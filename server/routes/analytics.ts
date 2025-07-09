import express from 'express';
import { query, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// Get analytics dashboard data
router.get('/dashboard', authenticateToken, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('brandId').optional().isUUID()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { startDate, endDate, brandId } = req.query;
  const userBrandId = req.user?.brandId;

  // Determine which brand to analyze
  let targetBrandId = brandId as string;
  if (req.user?.role !== 'admin') {
    targetBrandId = userBrandId || '';
  }

  // Date range setup
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  // Build base conditions
  const conditions = ['ae.created_at >= $1', 'ae.created_at <= $2'];
  const values = [start, end];
  let paramCount = 3;

  if (targetBrandId) {
    conditions.push(`ae.brand_id = $${paramCount++}`);
    values.push(targetBrandId);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Get key metrics
  const metricsResult = await pool.query(`
    SELECT 
      COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) as total_try_ons,
      COUNT(CASE WHEN event_type = 'try_on_converted' THEN 1 END) as total_conversions,
      COUNT(CASE WHEN event_type = 'user_registered' THEN 1 END) as new_users,
      COUNT(CASE WHEN event_type = 'photo_uploaded' THEN 1 END) as photo_uploads,
      ROUND(
        CASE 
          WHEN COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) > 0 
          THEN (COUNT(CASE WHEN event_type = 'try_on_converted' THEN 1 END)::float / 
                COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END)) * 100
          ELSE 0 
        END, 2
      ) as conversion_rate
    FROM analytics_events ae
    ${whereClause}
  `, values);

  const metrics = metricsResult.rows[0];

  // Get daily try-on trends
  const trendsResult = await pool.query(`
    SELECT 
      DATE(ae.created_at) as date,
      COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) as try_ons,
      COUNT(CASE WHEN event_type = 'try_on_converted' THEN 1 END) as conversions
    FROM analytics_events ae
    ${whereClause}
    GROUP BY DATE(ae.created_at)
    ORDER BY date DESC
    LIMIT 30
  `, values);

  // Get top performing clothing categories
  const categoryResult = await pool.query(`
    SELECT 
      ci.category,
      COUNT(ts.id) as try_on_count,
      COUNT(CASE WHEN ts.converted THEN 1 END) as conversion_count,
      ROUND(AVG(ci.price), 2) as avg_price
    FROM try_on_sessions ts
    JOIN LATERAL jsonb_array_elements(ts.clothing_items) as item(value) ON true
    JOIN clothing_items ci ON ci.id = (item.value->>'id')::uuid
    WHERE ts.created_at >= $1 AND ts.created_at <= $2
    ${targetBrandId ? 'AND ci.brand_id = $' + (values.length + 1) : ''}
    GROUP BY ci.category
    ORDER BY try_on_count DESC
    LIMIT 10
  `, targetBrandId ? [...values, targetBrandId] : values);

  // Get user engagement metrics
  const engagementResult = await pool.query(`
    SELECT 
      COUNT(DISTINCT ae.user_id) as active_users,
      ROUND(AVG(session_counts.session_count), 2) as avg_sessions_per_user,
      ROUND(AVG(session_durations.avg_duration), 2) as avg_session_duration
    FROM analytics_events ae
    LEFT JOIN (
      SELECT user_id, COUNT(*) as session_count
      FROM try_on_sessions
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY user_id
    ) session_counts ON ae.user_id = session_counts.user_id
    LEFT JOIN (
      SELECT user_id, AVG(session_duration) as avg_duration
      FROM try_on_sessions
      WHERE created_at >= $1 AND created_at <= $2 AND session_duration IS NOT NULL
      GROUP BY user_id
    ) session_durations ON ae.user_id = session_durations.user_id
    ${whereClause}
  `, values);

  const engagement = engagementResult.rows[0];

  res.json({
    metrics: {
      totalTryOns: parseInt(metrics.total_try_ons),
      totalConversions: parseInt(metrics.total_conversions),
      newUsers: parseInt(metrics.new_users),
      photoUploads: parseInt(metrics.photo_uploads),
      conversionRate: parseFloat(metrics.conversion_rate)
    },
    trends: trendsResult.rows.map(row => ({
      date: row.date,
      tryOns: parseInt(row.try_ons),
      conversions: parseInt(row.conversions)
    })),
    categories: categoryResult.rows.map(row => ({
      category: row.category,
      tryOnCount: parseInt(row.try_on_count),
      conversionCount: parseInt(row.conversion_count),
      avgPrice: parseFloat(row.avg_price)
    })),
    engagement: {
      activeUsers: parseInt(engagement.active_users || 0),
      avgSessionsPerUser: parseFloat(engagement.avg_sessions_per_user || 0),
      avgSessionDuration: parseFloat(engagement.avg_session_duration || 0)
    },
    dateRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  });
}));

// Get conversion funnel data
router.get('/funnel', authenticateToken, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { startDate, endDate } = req.query;
  const userBrandId = req.user?.brandId;

  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const conditions = ['ae.created_at >= $1', 'ae.created_at <= $2'];
  const values = [start, end];

  if (req.user?.role !== 'admin' && userBrandId) {
    conditions.push('ae.brand_id = $3');
    values.push(userBrandId);
  }

  const funnelResult = await pool.query(`
    SELECT 
      'Photo Upload' as step,
      COUNT(CASE WHEN event_type = 'photo_uploaded' THEN 1 END) as count,
      1 as step_order
    FROM analytics_events ae
    WHERE ${conditions.join(' AND ')}
    
    UNION ALL
    
    SELECT 
      'Try-On Session' as step,
      COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) as count,
      2 as step_order
    FROM analytics_events ae
    WHERE ${conditions.join(' AND ')}
    
    UNION ALL
    
    SELECT 
      'Conversion' as step,
      COUNT(CASE WHEN event_type = 'try_on_converted' THEN 1 END) as count,
      3 as step_order
    FROM analytics_events ae
    WHERE ${conditions.join(' AND ')}
    
    ORDER BY step_order
  `, values);

  res.json({
    funnel: funnelResult.rows.map(row => ({
      step: row.step,
      count: parseInt(row.count),
      stepOrder: row.step_order
    }))
  });
}));

// Get real-time analytics
router.get('/realtime', authenticateToken, 
asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const userBrandId = req.user?.brandId;
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const conditions = ['ae.created_at >= $1'];
  const values = [last24Hours];

  if (req.user?.role !== 'admin' && userBrandId) {
    conditions.push('ae.brand_id = $2');
    values.push(userBrandId);
  }

  // Get hourly activity for last 24 hours
  const activityResult = await pool.query(`
    SELECT 
      DATE_TRUNC('hour', ae.created_at) as hour,
      COUNT(CASE WHEN event_type = 'try_on_session_created' THEN 1 END) as try_ons,
      COUNT(CASE WHEN event_type = 'user_login' THEN 1 END) as logins,
      COUNT(CASE WHEN event_type = 'photo_uploaded' THEN 1 END) as uploads
    FROM analytics_events ae
    WHERE ${conditions.join(' AND ')}
    GROUP BY DATE_TRUNC('hour', ae.created_at)
    ORDER BY hour DESC
    LIMIT 24
  `, values);

  // Get current active sessions (last 30 minutes)
  const activeSessionsResult = await pool.query(`
    SELECT COUNT(DISTINCT user_id) as active_users
    FROM analytics_events
    WHERE created_at >= NOW() - INTERVAL '30 minutes'
    ${req.user?.role !== 'admin' && userBrandId ? 'AND brand_id = $1' : ''}
  `, req.user?.role !== 'admin' && userBrandId ? [userBrandId] : []);

  res.json({
    activity: activityResult.rows.map(row => ({
      hour: row.hour,
      tryOns: parseInt(row.try_ons),
      logins: parseInt(row.logins),
      uploads: parseInt(row.uploads)
    })),
    activeUsers: parseInt(activeSessionsResult.rows[0].active_users || 0),
    lastUpdated: new Date().toISOString()
  });
}));

// Export analytics data (admin only)
router.get('/export', authenticateToken, requireRole(['admin']), [
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
  query('format').optional().isIn(['json', 'csv'])
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { startDate, endDate, format = 'json' } = req.query;

  const result = await pool.query(`
    SELECT 
      ae.*,
      u.name as user_name,
      u.email as user_email,
      b.name as brand_name
    FROM analytics_events ae
    LEFT JOIN users u ON ae.user_id = u.id
    LEFT JOIN brands b ON ae.brand_id = b.id
    WHERE ae.created_at >= $1 AND ae.created_at <= $2
    ORDER BY ae.created_at DESC
  `, [startDate, endDate]);

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(result.rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
    res.send(csv);
  } else {
    res.json({
      data: result.rows,
      exportedAt: new Date().toISOString(),
      totalRecords: result.rows.length
    });
  }
}));

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export default router;