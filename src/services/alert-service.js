import { getDB } from '../db.js';

class AlertService {
  constructor() {
    this.db = getDB();
    this.alertTypes = {
      SUCCESS: { color: 'success', icon: 'fas fa-check-circle', priority: 1 },
      INFO: { color: 'info', icon: 'fas fa-info-circle', priority: 2 },
      WARNING: { color: 'warning', icon: 'fas fa-exclamation-triangle', priority: 3 },
      ERROR: { color: 'danger', icon: 'fas fa-times-circle', priority: 4 },
      SYSTEM: { color: 'secondary', icon: 'fas fa-tools', priority: 5 }
    };
  }

  // Create a new alert
  async createAlert(type, title, message, teacherId = null, studentId = null, classId = null, expiresAt = null) {
    try {
      if (!this.alertTypes[type]) {
        throw new Error(`Invalid alert type: ${type}`);
      }

      const alertData = {
        type: type.toLowerCase(),
        title,
        message,
        teacher_id: teacherId,
        student_id: studentId,
        class_id: classId,
        expires_at: expiresAt,
        is_read: 0,
        created_at: new Date().toISOString()
      };

      const result = await this.db.run(`
        INSERT INTO alerts (type, title, message, teacher_id, student_id, class_id, expires_at, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        alertData.type,
        alertData.title,
        alertData.message,
        alertData.teacher_id,
        alertData.student_id,
        alertData.class_id,
        alertData.expires_at,
        alertData.is_read,
        alertData.created_at
      ]);

      return { id: result.lastID, ...alertData };
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  // Get alerts for a specific teacher
  async getAlertsForTeacher(teacherId, limit = 10, includeRead = false) {
    try {
      const readCondition = includeRead ? '' : 'AND is_read = 0';
      
      const alerts = await this.db.all(`
        SELECT a.*, 
               s.name as student_name,
               c.name as class_name
        FROM alerts a
        LEFT JOIN students s ON a.student_id = s.id
        LEFT JOIN classes c ON a.class_id = c.id
        WHERE (a.teacher_id = ? OR a.teacher_id IS NULL)
          AND (a.expires_at IS NULL OR datetime(a.expires_at) > datetime('now'))
          ${readCondition}
        ORDER BY 
          CASE a.type 
            WHEN 'error' THEN 1
            WHEN 'warning' THEN 2
            WHEN 'info' THEN 3
            WHEN 'success' THEN 4
            WHEN 'system' THEN 5
          END,
          a.created_at DESC
        LIMIT ?
      `, [teacherId, limit]);

      return alerts.map(alert => ({
        ...alert,
        ...this.alertTypes[alert.type.toUpperCase()],
        timeAgo: this.getTimeAgo(alert.created_at)
      }));
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  // Get alert counts by type for a teacher
  async getAlertCounts(teacherId) {
    try {
      const counts = await this.db.get(`
        SELECT 
          COUNT(CASE WHEN type = 'success' AND is_read = 0 THEN 1 END) as success_count,
          COUNT(CASE WHEN type = 'info' AND is_read = 0 THEN 1 END) as info_count,
          COUNT(CASE WHEN type = 'warning' AND is_read = 0 THEN 1 END) as warning_count,
          COUNT(CASE WHEN type = 'error' AND is_read = 0 THEN 1 END) as error_count,
          COUNT(CASE WHEN type = 'system' AND is_read = 0 THEN 1 END) as system_count,
          COUNT(CASE WHEN is_read = 0 THEN 1 END) as total_unread
        FROM alerts
        WHERE (teacher_id = ? OR teacher_id IS NULL)
          AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
      `, [teacherId]);

      return counts || {
        success_count: 0,
        info_count: 0,
        warning_count: 0,
        error_count: 0,
        system_count: 0,
        total_unread: 0
      };
    } catch (error) {
      console.error('Error getting alert counts:', error);
      return {
        success_count: 0,
        info_count: 0,
        warning_count: 0,
        error_count: 0,
        system_count: 0,
        total_unread: 0
      };
    }
  }

  // Mark alert as read
  async markAsRead(alertId, teacherId) {
    try {
      await this.db.run(`
        UPDATE alerts 
        SET is_read = 1, read_at = datetime('now')
        WHERE id = ? AND (teacher_id = ? OR teacher_id IS NULL)
      `, [alertId, teacherId]);
      return true;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }
  }

  // Mark all alerts as read for a teacher
  async markAllAsRead(teacherId) {
    try {
      await this.db.run(`
        UPDATE alerts 
        SET is_read = 1, read_at = datetime('now')
        WHERE (teacher_id = ? OR teacher_id IS NULL) AND is_read = 0
      `, [teacherId]);
      return true;
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      return false;
    }
  }

  // Delete expired alerts
  async cleanupExpiredAlerts() {
    try {
      const result = await this.db.run(`
        DELETE FROM alerts 
        WHERE expires_at IS NOT NULL 
          AND datetime(expires_at) <= datetime('now')
      `);
      console.log(`Cleaned up ${result.changes} expired alerts`);
      return result.changes;
    } catch (error) {
      console.error('Error cleaning up expired alerts:', error);
      return 0;
    }
  }

  // Helper method to calculate time ago
  getTimeAgo(dateString) {
    const now = new Date();
    const alertDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - alertDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return alertDate.toLocaleDateString();
  }

  // Predefined alert creators for common scenarios
  async createSuccessAlert(title, message, teacherId, options = {}) {
    return this.createAlert('SUCCESS', title, message, teacherId, options.studentId, options.classId, options.expiresAt);
  }

  async createInfoAlert(title, message, teacherId, options = {}) {
    return this.createAlert('INFO', title, message, teacherId, options.studentId, options.classId, options.expiresAt);
  }

  async createWarningAlert(title, message, teacherId, options = {}) {
    return this.createAlert('WARNING', title, message, teacherId, options.studentId, options.classId, options.expiresAt);
  }

  async createErrorAlert(title, message, teacherId, options = {}) {
    return this.createAlert('ERROR', title, message, teacherId, options.studentId, options.classId, options.expiresAt);
  }

  async createSystemAlert(title, message, options = {}) {
    return this.createAlert('SYSTEM', title, message, null, options.studentId, options.classId, options.expiresAt);
  }

  // Common alert scenarios
  async alertAttendanceMarked(teacherId, className, presentCount, totalCount) {
    return this.createSuccessAlert(
      'Attendance Marked Successfully',
      `${className}: ${presentCount}/${totalCount} students present`,
      teacherId,
      { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() } // Expires in 24 hours
    );
  }

  async alertLowAttendance(teacherId, studentName, attendancePercentage, classId, studentId) {
    return this.createWarningAlert(
      'Low Attendance Detected',
      `${studentName} has ${attendancePercentage}% attendance`,
      teacherId,
      { classId, studentId }
    );
  }

  async alertNotificationFailed(teacherId, studentName, errorMessage) {
    return this.createErrorAlert(
      'Notification Failed',
      `Failed to send notification to ${studentName}: ${errorMessage}`,
      teacherId
    );
  }

  async alertSystemMaintenance(message, expiresAt) {
    return this.createSystemAlert(
      'System Maintenance',
      message,
      { expiresAt }
    );
  }

  async alertNewFeature(title, message, expiresAt) {
    return this.createInfoAlert(
      title,
      message,
      null, // System-wide alert
      { expiresAt }
    );
  }

  async alertStudentAbsent(teacherId, studentName, date, classId, studentId) {
    return this.createInfoAlert(
      'Student Absence',
      `${studentName} was marked absent on ${date}`,
      teacherId,
      { 
        classId, 
        studentId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expires in 7 days
      }
    );
  }

  async alertReportGenerated(teacherId, reportType, className) {
    return this.createSuccessAlert(
      'Report Generated',
      `${reportType} report for ${className} has been generated successfully`,
      teacherId,
      { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    );
  }

  async alertBulkImportCompleted(teacherId, successCount, failedCount, className) {
    const type = failedCount > 0 ? 'WARNING' : 'SUCCESS';
    const title = failedCount > 0 ? 'Bulk Import Completed with Issues' : 'Bulk Import Successful';
    const message = `${className}: ${successCount} students imported successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`;
    
    return this.createAlert(type, title, message, teacherId, null, null, 
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    );
  }
}

export default new AlertService();