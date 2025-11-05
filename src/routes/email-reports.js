import express from 'express';
import nodemailer from 'nodemailer';
import { all, run } from '../db.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Weekly reports dashboard
router.get('/weekly-reports', requireAuth, async (req, res) => {
  const teacherId = req.session.user.id;
  
  // Get all classes for this teacher
  const classes = await all(`
    SELECT c.*, COUNT(s.id) as student_count
    FROM classes c 
    LEFT JOIN students s ON c.id = s.class_id 
    WHERE c.teacher_id = ? 
    GROUP BY c.id
    ORDER BY c.name
  `, [teacherId]);

  // Get recent email reports
  const recentReports = await all(`
    SELECT 
      er.*,
      c.name as class_name
    FROM email_reports er
    JOIN classes c ON er.class_id = c.id
    WHERE c.teacher_id = ?
    ORDER BY er.sent_at DESC
    LIMIT 10
  `, [teacherId]);

  res.render('weekly-reports', {
    classes,
    recentReports,
    pageTitle: 'Weekly Email Reports'
  });
});

// Generate and send weekly reports for a class
router.post('/class/:id/send-weekly-reports', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const teacherId = req.session.user.id;

  try {
    // Verify teacher owns this class
    const classInfo = await all(`
      SELECT * FROM classes WHERE id = ? AND teacher_id = ?
    `, [classId, teacherId]);
    
    if (classInfo.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate weekly reports
    const result = await generateWeeklyReports(classId);
    
    res.json({
      success: true,
      message: `Weekly reports sent to ${result.sent} parents`,
      details: result
    });

  } catch (error) {
    console.error('Error sending weekly reports:', error);
    res.status(500).json({ 
      error: 'Failed to send weekly reports',
      message: error.message 
    });
  }
});

// Send weekly reports for all classes
router.post('/send-all-weekly-reports', requireAuth, async (req, res) => {
  const teacherId = req.session.user.id;

  try {
    const classes = await all(`
      SELECT id FROM classes WHERE teacher_id = ?
    `, [teacherId]);

    let totalSent = 0;
    let totalErrors = 0;

    for (const cls of classes) {
      try {
        const result = await generateWeeklyReports(cls.id);
        totalSent += result.sent;
        totalErrors += result.errors;
      } catch (error) {
        console.error(`Error sending reports for class ${cls.id}:`, error);
        totalErrors++;
      }
    }

    res.json({
      success: true,
      message: `Weekly reports sent to ${totalSent} parents across ${classes.length} classes`,
      sent: totalSent,
      errors: totalErrors
    });

  } catch (error) {
    console.error('Error sending all weekly reports:', error);
    res.status(500).json({ 
      error: 'Failed to send weekly reports',
      message: error.message 
    });
  }
});

// Generate weekly reports for a specific class
async function generateWeeklyReports(classId) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7); // Last 7 days

  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  // Get class information
  const classInfo = await all(`
    SELECT * FROM classes WHERE id = ?
  `, [classId]);

  if (classInfo.length === 0) {
    throw new Error('Class not found');
  }

  // Get students with their attendance data for the week
  const studentsData = await all(`
    SELECT 
      s.id,
      s.name,
      s.roll_no,
      g.name as parent_name,
      g.email as parent_email,
      COUNT(a.id) as total_days,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
      SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_days
    FROM students s
    LEFT JOIN guardians g ON s.id = g.student_id
    LEFT JOIN attendance a ON s.id = a.student_id 
      AND a.date >= ? AND a.date <= ?
    WHERE s.class_id = ?
    GROUP BY s.id, s.name, s.roll_no, g.name, g.email
    HAVING g.email IS NOT NULL
  `, [startDateStr, endDateStr, classId]);

  let sent = 0;
  let errors = 0;

  // Create email transporter
  const transporter = createTransporter();

  for (const student of studentsData) {
    try {
      // Get daily attendance details
      const dailyAttendance = await all(`
        SELECT date, status, note
        FROM attendance
        WHERE student_id = ? AND date >= ? AND date <= ?
        ORDER BY date
      `, [student.id, startDateStr, endDateStr]);

      // Calculate attendance percentage
      const attendanceRate = student.total_days > 0 ? 
        Math.round((student.present_days / student.total_days) * 100) : 0;

      // Generate email content
      const emailContent = generateEmailContent(
        student, 
        classInfo[0], 
        dailyAttendance, 
        attendanceRate,
        startDateStr,
        endDateStr
      );

      // Send email
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'AttendanceMS <no-reply@school.com>',
          to: student.parent_email,
          subject: `Weekly Attendance Report - ${student.name} (${classInfo[0].name})`,
          html: emailContent
        });

        // Log successful email
        await logEmailReport(classId, student.id, 'sent', null);
        sent++;
      } else {
        console.log(`Email would be sent to ${student.parent_email} for ${student.name}`);
        await logEmailReport(classId, student.id, 'simulated', 'SMTP not configured');
        sent++;
      }

    } catch (error) {
      console.error(`Error sending email to ${student.parent_email}:`, error);
      await logEmailReport(classId, student.id, 'failed', error.message);
      errors++;
    }
  }

  return { sent, errors, total: studentsData.length };
}

// Generate HTML email content
function generateEmailContent(student, classInfo, dailyAttendance, attendanceRate, startDate, endDate) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      case 'excused': return '📝';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#28a745';
      case 'absent': return '#dc3545';
      case 'late': return '#ffc107';
      case 'excused': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Weekly Attendance Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; }
        .summary { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .attendance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin: 15px 0; }
        .day-card { background: white; padding: 10px; border-radius: 6px; text-align: center; border-left: 4px solid #ddd; }
        .footer { background: #343a40; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
        .stat-card { background: white; padding: 10px; border-radius: 6px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📚 Weekly Attendance Report</h2>
          <p><strong>${student.name}</strong> - Roll No: ${student.roll_no}</p>
          <p>${classInfo.name}${classInfo.section ? ` - Section ${classInfo.section}` : ''}</p>
          <p>Week: ${formatDate(startDate)} to ${formatDate(endDate)}</p>
        </div>
        
        <div class="content">
          <div class="summary">
            <h3>📊 Weekly Summary</h3>
            <div class="stats">
              <div class="stat-card">
                <div style="font-size: 24px; font-weight: bold; color: #28a745;">${student.present_days}</div>
                <div>Present</div>
              </div>
              <div class="stat-card">
                <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${student.absent_days}</div>
                <div>Absent</div>
              </div>
              <div class="stat-card">
                <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${student.late_days}</div>
                <div>Late</div>
              </div>
              <div class="stat-card">
                <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${student.excused_days}</div>
                <div>Excused</div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px;">
              <div style="font-size: 32px; font-weight: bold; color: ${attendanceRate >= 80 ? '#28a745' : attendanceRate >= 60 ? '#ffc107' : '#dc3545'};">
                ${attendanceRate}%
              </div>
              <div>Overall Attendance Rate</div>
            </div>
          </div>

          ${dailyAttendance.length > 0 ? `
          <div class="summary">
            <h3>📅 Daily Attendance</h3>
            <div class="attendance-grid">
              ${dailyAttendance.map(day => `
                <div class="day-card" style="border-left-color: ${getStatusColor(day.status)};">
                  <div style="font-size: 20px;">${getStatusIcon(day.status)}</div>
                  <div style="font-weight: bold;">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div style="font-size: 12px;">${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div style="font-size: 11px; color: #666; text-transform: capitalize;">${day.status}</div>
                  ${day.note ? `<div style="font-size: 10px; color: #888; margin-top: 5px;">${day.note}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${attendanceRate < 75 ? `
          <div class="summary" style="border-left: 4px solid #dc3545;">
            <h4 style="color: #dc3545;">⚠️ Attendance Alert</h4>
            <p>Your child's attendance is below the recommended 75%. Please ensure regular attendance for better academic performance.</p>
          </div>
          ` : ''}

          ${attendanceRate >= 90 ? `
          <div class="summary" style="border-left: 4px solid #28a745;">
            <h4 style="color: #28a745;">🌟 Excellent Attendance!</h4>
            <p>Congratulations! Your child has maintained excellent attendance this week.</p>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p><strong>AttendanceMS</strong> - Automated Weekly Report</p>
          <p style="font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
          <p style="font-size: 12px;">For any queries, please contact the school administration.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Log email report attempts
async function logEmailReport(classId, studentId, status, error = null) {
  // First, ensure we have the email_reports table
  await run(`
    CREATE TABLE IF NOT EXISTS email_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      sent_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  await run(`
    INSERT INTO email_reports (class_id, student_id, status, error_message)
    VALUES (?, ?, ?, ?)
  `, [classId, studentId, status, error]);
}

export default router;