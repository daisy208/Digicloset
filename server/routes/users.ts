import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Update user preferences
router.put('/preferences', authenticateToken, [
  body('favoriteColors').optional().isArray(),
  body('preferredStyles').optional().isArray(),
  body('bodyType').optional().isIn(['petite', 'tall', 'curvy', 'athletic', 'plus-size']),
  body('occasions').optional().isArray(),
  body('brands').optional().isArray(),
  body('priceRange').optional().isArray().isLength({ min: 2, max: 2 })
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const preferences = req.body;

  const result = await pool.query(
    'UPDATE users SET preferences = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING preferences',
    [JSON.stringify(preferences), req.user?.id]
  );

  // Log preference update event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data) 
     VALUES ($1, $2, 'preferences_updated', $3)`,
    [req.user?.id, req.user?.brandId, JSON.stringify(preferences)]
  );

  res.json({
    message: 'Preferences updated successfully',
    preferences: result.rows[0].preferences
  });
}));

// Get user's try-on history
router.get('/try-on-history', authenticateToken, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const result = await pool.query(`
    SELECT 
      ts.*,
      COUNT(*) OVER() as total_count
    FROM try_on_sessions ts
    WHERE ts.user_id = $1
    ORDER BY ts.created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.user?.id, limit, offset]);

  const sessions = result.rows.map(session => ({
    id: session.id,
    userPhotoUrl: session.user_photo_url,
    clothingItems: session.clothing_items,
    lightingSettings: session.lighting_settings,
    resultImageUrl: session.result_image_url,
    converted: session.converted,
    createdAt: session.created_at
  }));

  const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

  res.json({
    sessions,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      totalItems: totalCount,
      itemsPerPage: Number(limit)
    }
  });
}));

// Get user's favorite items
router.get('/favorites', authenticateToken, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // This would typically be stored in a separate favorites table
  // For now, we'll return items based on user's try-on history and preferences
  const result = await pool.query(`
    SELECT 
      ci.*,
      b.name as brand_name,
      COUNT(ts.id) as try_on_count
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.id
    JOIN LATERAL (
      SELECT ts.id
      FROM try_on_sessions ts
      JOIN LATERAL jsonb_array_elements(ts.clothing_items) as item(value) ON true
      WHERE ts.user_id = $1 AND (item.value->>'id')::uuid = ci.id
    ) ts ON true
    WHERE ci.is_active = true
    GROUP BY ci.id, b.name
    ORDER BY try_on_count DESC, ci.rating DESC
    LIMIT 20
  `, [req.user?.id]);

  const favorites = result.rows.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    style: item.style,
    colors: item.colors,
    price: parseFloat(item.price),
    imageUrl: item.image_url,
    overlayImageUrl: item.overlay_image_url,
    tags: item.tags,
    rating: parseFloat(item.rating || 0),
    sizes: item.sizes,
    brandId: item.brand_id,
    brandName: item.brand_name,
    tryOnCount: parseInt(item.try_on_count)
  }));

  res.json({ favorites });
}));

// Get personalized recommendations
router.get('/recommendations', authenticateToken, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  // Get user preferences
  const userResult = await pool.query(
    'SELECT preferences FROM users WHERE id = $1',
    [req.user?.id]
  );

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  const preferences = userResult.rows[0].preferences || {};

  // Build recommendation query based on preferences
  const conditions = ['ci.is_active = true'];
  const values = [];
  let paramCount = 1;

  if (preferences.preferredStyles && preferences.preferredStyles.length > 0) {
    conditions.push(`ci.style = ANY($${paramCount++})`);
    values.push(preferences.preferredStyles);
  }

  if (preferences.priceRange && preferences.priceRange.length === 2) {
    conditions.push(`ci.price >= $${paramCount++} AND ci.price <= $${paramCount++}`);
    values.push(preferences.priceRange[0], preferences.priceRange[1]);
  }

  if (preferences.brands && preferences.brands.length > 0) {
    conditions.push(`b.name = ANY($${paramCount++})`);
    values.push(preferences.brands);
  }

  const whereClause = conditions.join(' AND ');

  const result = await pool.query(`
    SELECT 
      ci.*,
      b.name as brand_name,
      CASE 
        WHEN ci.style = ANY($${paramCount++}) THEN 3
        ELSE 0
      END +
      CASE 
        WHEN ci.price >= $${paramCount++} AND ci.price <= $${paramCount++} THEN 2
        ELSE 0
      END +
      CASE 
        WHEN b.name = ANY($${paramCount++}) THEN 2
        ELSE 0
      END +
      CASE 
        WHEN ci.colors && $${paramCount++} THEN 1
        ELSE 0
      END as relevance_score
    FROM clothing_items ci
    JOIN brands b ON ci.brand_id = b.id
    WHERE ${whereClause}
    ORDER BY relevance_score DESC, ci.rating DESC, ci.created_at DESC
    LIMIT 20
  `, [
    ...values,
    preferences.preferredStyles || [],
    preferences.priceRange?.[0] || 0,
    preferences.priceRange?.[1] || 1000,
    preferences.brands || [],
    preferences.favoriteColors || []
  ]);

  const recommendations = result.rows.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    style: item.style,
    colors: item.colors,
    price: parseFloat(item.price),
    imageUrl: item.image_url,
    overlayImageUrl: item.overlay_image_url,
    tags: item.tags,
    rating: parseFloat(item.rating || 0),
    sizes: item.sizes,
    brandId: item.brand_id,
    brandName: item.brand_name,
    relevanceScore: parseInt(item.relevance_score)
  }));

  res.json({ recommendations });
}));

export default router;
// server/routes/users.ts
import express from 'express';
import { UserService } from '../services/userService';

const router = express.Router();
const userService = new UserService();

router.get('/', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
