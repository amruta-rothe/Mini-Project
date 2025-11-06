import AlertService from './alert-service.js';
import { getDB } from '../db.js';

// Create sample alerts for demonstration
export async function createSampleAlerts() {
  try {
    const db = getDB();
    
    // Get the first teacher for demo alerts
    const teacher = await db.get('SELECT id FROM teachers LIMIT 1');
    if (!teacher) return;

    const teacherId = teacher.id;
    
    // Check if sample alerts already exist
    const existingAlerts = await db.get('SELECT COUNT(*) as count FROM alerts WHERE teacher_id = ?', [teacherId]);
    if (existingAlerts.count > 0) return; // Don't create duplicates

    console.log('Creating sample alerts for demonstration...');

    // Success alert
    await AlertService.createSuccessAlert(
      'Attendance Marked Successfully',
      'Class 10A: 28/30 students present today',
      teacherId,
      { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    );

    // Info alert
    await AlertService.createInfoAlert(
      'New Features Added',
      'Parent Reports system has been updated with new filtering options',
      teacherId,
      { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
    );

    // Warning alert
    await AlertService.createWarningAlert(
      'Low Attendance Detected',
      'Student John Doe has 65% attendance, below the 75% threshold',
      teacherId
    );

    // Error alert
    await AlertService.createErrorAlert(
      'Notification Failed',
      'Failed to send SMS to parent of Jane Smith: Invalid phone number',
      teacherId
    );

    // System alert
    await AlertService.createSystemAlert(
      'Scheduled Maintenance',
      'System maintenance scheduled for tonight 11:00 PM - 2:00 AM',
      { expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() }
    );

    // Additional alerts for variety
    await AlertService.createSuccessAlert(
      'Report Generated',
      'Monthly attendance report for Class 9B has been generated successfully',
      teacherId,
      { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    );

    await AlertService.createWarningAlert(
      'Multiple Absences',
      'Student Mike Johnson has been absent for 3 consecutive days',
      teacherId
    );

    await AlertService.createInfoAlert(
      'Parent Contact Updated',
      'Parent contact information updated for 5 students in Class 8C',
      teacherId,
      { expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }
    );

    console.log('Sample alerts created successfully');
  } catch (error) {
    console.error('Error creating sample alerts:', error);
  }
}

// Clean up old sample alerts (optional)
export async function cleanupSampleAlerts() {
  try {
    const db = getDB();
    await db.run(`
      DELETE FROM alerts 
      WHERE title IN (
        'Attendance Marked Successfully',
        'New Features Added',
        'Low Attendance Detected',
        'Notification Failed',
        'Scheduled Maintenance',
        'Report Generated',
        'Multiple Absences',
        'Parent Contact Updated'
      )
    `);
    console.log('Sample alerts cleaned up');
  } catch (error) {
    console.error('Error cleaning up sample alerts:', error);
  }
}