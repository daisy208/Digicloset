import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/user-photos/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Upload user photo
router.post('/upload-photo', authenticateToken, upload.single('photo'), 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!req.file) {
    throw createError('No photo uploaded', 400);
  }

  const photoUrl = `/uploads/user-photos/${req.file.filename}`;

  // Log photo upload event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data) 
     VALUES ($1, $2, 'photo_uploaded', $3)`,
    [req.user?.id, req.user?.brandId, JSON.stringify({ photoUrl, fileSize: req.file.size })]
  );

  res.json({
    message: 'Photo uploaded successfully',
    photoUrl
  });
}));

// Create try-on session
router.post('/session', authenticateToken, [
  body('userPhotoUrl').isString().notEmpty(),
  body('clothingItems').isArray().isLength({ min: 1, max: 5 }),
  body('lightingSettings').isObject()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { userPhotoUrl, clothingItems, lightingSettings } = req.body;

  // Validate clothing items exist
  const itemIds = clothingItems.map((item: any) => item.id);
  const validItems = await pool.query(
    'SELECT id FROM clothing_items WHERE id = ANY($1) AND is_active = true',
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

  // In a real implementation, this would trigger AI processing
  // For now, we'll simulate the process
  const resultImageUrl = await simulateVirtualTryOn(userPhotoUrl, clothingItems, lightingSettings);

  // Update session with result
  await pool.query(
    'UPDATE try_on_sessions SET result_image_url = $1 WHERE id = $2',
    [resultImageUrl, session.id]
  );

  // Log try-on event
  await pool.query(
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data) 
     VALUES ($1, $2, 'try_on_session_created', $3)`,
    [req.user?.id, req.user?.brandId, JSON.stringify({ 
      sessionId: session.id, 
      itemCount: clothingItems.length,
      lightingScenario: lightingSettings.scenario
    })]
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
    `INSERT INTO analytics_events (user_id, brand_id, event_type, event_data) 
     VALUES ($1, $2, 'try_on_converted', $3)`,
    [req.user?.id, req.user?.brandId, JSON.stringify({ sessionId: id })]
  );

  res.json({ message: 'Session marked as converted successfully' });
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
  
  // For demo purposes, return a placeholder
  return `/uploads/try-on-results/${uuidv4()}.jpg`;
}

export default router;