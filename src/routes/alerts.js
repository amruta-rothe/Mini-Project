import express from 'express';
import AlertService from '../services/alert-service.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// Get alerts for current teacher
router.get('/api/alerts', requireAuth, async (req, res) => {
  try {
    const teacherId = req.session.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const includeRead = req.query.include_read === 'true';
    
    const alerts = await AlertService.getAlertsForTeacher(teacherId, limit, includeRead);
    const counts = await AlertService.getAlertCounts(teacherId);
    
    res.json({
      success: true,
      alerts,
      counts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert counts only
router.get('/api/alerts/counts', requireAuth, async (req, res) => {
  try {
    const teacherId = req.session.user.id;
    const counts = await AlertService.getAlertCounts(teacherId);
    
    res.json({
      success: true,
      counts
    });
  } catch (error) {
    console.error('Error fetching alert counts:', error);
    res.status(500).json({ error: 'Failed to fetch alert counts' });
  }
});

// Mark alert as read
router.post('/api/alerts/:id/read', requireAuth, async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const teacherId = req.session.user.id;
    
    const success = await AlertService.markAsRead(alertId, teacherId);
    
    if (success) {
      res.json({ success: true, message: 'Alert marked as read' });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// Mark all alerts as read
router.post('/api/alerts/read-all', requireAuth, async (req, res) => {
  try {
    const teacherId = req.session.user.id;
    
    const success = await AlertService.markAllAsRead(teacherId);
    
    if (success) {
      res.json({ success: true, message: 'All alerts marked as read' });
    } else {
      res.status(500).json({ error: 'Failed to mark alerts as read' });
    }
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({ error: 'Failed to mark all alerts as read' });
  }
});

// Create a test alert (for development/testing)
router.post('/api/alerts/test', requireAuth, async (req, res) => {
  try {
    const teacherId = req.session.user.id;
    const { type, title, message } = req.body;
    
    const alert = await AlertService.createAlert(
      type.toUpperCase(),
      title || 'Test Alert',
      message || 'This is a test alert',
      teacherId
    );
    
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error creating test alert:', error);
    res.status(500).json({ error: 'Failed to create test alert' });
  }
});

// Cleanup expired alerts (admin endpoint)
router.post('/api/alerts/cleanup', requireAuth, async (req, res) => {
  try {
    const cleanedCount = await AlertService.cleanupExpiredAlerts();
    res.json({ 
      success: true, 
      message: `Cleaned up ${cleanedCount} expired alerts` 
    });
  } catch (error) {
    console.error('Error cleaning up alerts:', error);
    res.status(500).json({ error: 'Failed to cleanup alerts' });
  }
});

// Alerts page
router.get('/alerts', (req, res, next) => {
  if (!req.session.user) return res.redirect('/login');
  next();
}, async (req, res) => {
  res.render('alerts', {
    title: 'System Alerts',
    currentPage: 'alerts'
  });
});

export default router;