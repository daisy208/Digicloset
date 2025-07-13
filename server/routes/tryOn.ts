import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { uploadUserPhoto, getFileUrl } from '../middleware/upload.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Upload user photo
router.post('/upload-photo', authenticateToken, uploadUserPhoto, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.file) {
    throw createError('No photo uploaded', 400);
  }

  const photoUrl = getFileUrl(req, req.file.filename, 'user-photos');

  // Log photo upload event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data, ip_address) 
     VALUES ($1, $2, 'photo_uploaded', $3, $4)`,
    [
      req.user?.id, 
      req.user?.brandId, 
      JSON.stringify({ 
        photoUrl, 
        fileSize: req.file.size,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      }), 
      req.ip
    ]
  );

  res.json({
    message: 'Photo uploaded successfully',
    photoUrl,
    fileInfo: {
      size: req.file.size,
      type: req.file.mimetype,
      originalName: req.file.originalname
    }
  });
}));

// Create try-on session
router.post('/session', authenticateToken, [
  body('userPhotoUrl').isString().notEmpty().withMessage('User photo URL is required'),
  body('clothingItems').isArray({ min: 1, max: 5 }).withMessage('1-5 clothing items required'),
  body('lightingSettings').isObject().withMessage('Lighting settings must be an object'),
  body('lightingSettings.brightness').optional().isInt({ min: 20, max: 150 }),
  body('lightingSettings.contrast').optional().isInt({ min: 50, max: 150 }),
  body('lightingSettings.warmth').optional().isInt({ min: 0, max: 100 }),
  body('lightingSettings.scenario').optional().isIn(['natural', 'indoor', 'evening', 'bright', 'warm', 'cool'])
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
  }

  const { userPhotoUrl, clothingItems, lightingSettings } = req.body;

  // Validate clothing items exist and are active
  const itemIds = clothingItems.map((item: any) => item.id);
  const validItems = await pool.query(
    'SELECT id, name, brand_id FROM clothing_items WHERE id = ANY($1) AND is_active = true',
    [itemIds]
  );

  if (validItems.rows.length !== itemIds.length) {
    throw createError('Some clothing items are invalid or unavailable', 400);
  }

  // Create try-on session
  const sessionResult = await pool.query(
    `INSERT INTO try_on_sessions (user_id, user_photo_url, clothing_items, lighting_settings)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [req.user?.id, userPhotoUrl, JSON.stringify(clothingItems), JSON.stringify(lightingSettings)]
  );

  const session = sessionResult.rows[0];

  // Simulate AI processing (in production, this would call actual AI service)
  const resultImageUrl = await simulateVirtualTryOn(userPhotoUrl, clothingItems, lightingSettings);

  // Update session with result
  await pool.query(
    'UPDATE try_on_sessions SET result_image_url = $1, session_duration = $2 WHERE id = $3',
    [resultImageUrl, Math.floor(Math.random() * 300) + 30, session.id] // Random duration 30-330 seconds
  );

  // Log try-on event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data, ip_address) 
     VALUES ($1, $2, 'try_on_session_created', $3, $4)`,
    [
      req.user?.id, 
      req.user?.brandId, 
      JSON.stringify({ 
        sessionId: session.id, 
        itemCount: clothingItems.length,
        lightingScenario: lightingSettings.scenario || 'natural',
        itemIds: itemIds
      }),
      req.ip
    ]
  );

  res.status(201).json({
    message: 'Try-on session created successfully',
    session: {
      id: session.id,
      userPhotoUrl,
      clothingItems,
      lightingSettings,
      resultImageUrl,
      createdAt: session.created_at
    }
  });
}));

// Get user's try-on sessions
router.get('/sessions', authenticateToken, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const result = await pool.query(
    `SELECT ts.*, 
            COUNT(*) OVER() as total_count
     FROM try_on_sessions ts
     WHERE ts.user_id = $1
     ORDER BY ts.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user?.id, limit, offset]
  );

  const sessions = result.rows.map(session => ({
    id: session.id,
    userPhotoUrl: session.user_photo_url,
    clothingItems: session.clothing_items,
    lightingSettings: session.lighting_settings,
    resultImageUrl: session.result_image_url,
    sessionDuration: session.session_duration,
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

// Get specific try-on session
router.get('/sessions/:id', authenticateToken, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  const result = await pool.query(
    'SELECT * FROM try_on_sessions WHERE id = $1 AND user_id = $2',
    [id, req.user?.id]
  );

  if (result.rows.length === 0) {
    throw createError('Try-on session not found', 404);
  }

  const session = result.rows[0];
  res.json({
    session: {
      id: session.id,
      userPhotoUrl: session.user_photo_url,
      clothingItems: session.clothing_items,
      lightingSettings: session.lighting_settings,
      resultImageUrl: session.result_image_url,
      sessionDuration: session.session_duration,
      converted: session.converted,
      createdAt: session.created_at
    }
  });
}));

// Mark session as converted (purchase made)
router.post('/sessions/:id/convert', authenticateToken, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  const result = await pool.query(
    'UPDATE try_on_sessions SET converted = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, req.user?.id]
  );

  if (result.rows.length === 0) {
    throw createError('Try-on session not found', 404);
  }

  // Log conversion event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data, ip_address) 
     VALUES ($1, $2, 'try_on_converted', $3, $4)`,
    [
      req.user?.id, 
      req.user?.brandId, 
      JSON.stringify({ sessionId: id }),
      req.ip
    ]
  );

  res.json({ 
    message: 'Session marked as converted successfully',
    session: result.rows[0]
  });
}));

// Get try-on statistics for user
router.get('/stats', authenticateToken,
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const statsResult = await pool.query(`
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(CASE WHEN converted THEN 1 END) as converted_sessions,
      AVG(session_duration) as avg_duration,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as sessions_last_30_days
    FROM try_on_sessions 
    WHERE user_id = $1
  `, [req.user?.id]);

  const stats = statsResult.rows[0];

  res.json({
    stats: {
      totalSessions: parseInt(stats.total_sessions),
      convertedSessions: parseInt(stats.converted_sessions),
      conversionRate: stats.total_sessions > 0 
        ? ((stats.converted_sessions / stats.total_sessions) * 100).toFixed(1)
        : '0.0',
      avgDuration: stats.avg_duration ? Math.round(stats.avg_duration) : 0,
      sessionsLast30Days: parseInt(stats.sessions_last_30_days)
    }
  });
}));

// Simulate virtual try-on processing (replace with actual AI service)
async function simulateVirtualTryOn(
  userPhotoUrl: string, 
  clothingItems: any[], 
  lightingSettings: any
): Promise<string> {
  // In a real implementation, this would:
  // 1. Send the user photo and clothing items to an AI service
  // 2. Apply the lighting settings
  // 3. Generate a composite image
  // 4. Return the URL of the processed image
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // For demo purposes, return a placeholder URL
  // In production, this would be the actual processed image URL
  return `${userPhotoUrl}?processed=${Date.now()}&items=${clothingItems.length}`;
}

export default router;