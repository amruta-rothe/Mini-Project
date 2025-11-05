import express from 'express';
import { all, run } from '../db.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Daily attendance dashboard
router.get('/daily-attendance', requireAuth, async (req, res) => {
  const teacherId = req.session.user.id;
  const today = new Date().toISOString().slice(0, 10);
  
  // Get filter parameters
  const selectedYear = req.query.year || '';
  const selectedBranch = req.query.branch || '';
  
  // Get all unique academic years and branches for this teacher
  const academicYears = await all(`
    SELECT DISTINCT academic_year 
    FROM classes 
    WHERE teacher_id = ? AND academic_year IS NOT NULL
    ORDER BY academic_year DESC
  `, [teacherId]);
  
  const branches = await all(`
    SELECT DISTINCT department 
    FROM classes 
    WHERE teacher_id = ? AND department IS NOT NULL
    ORDER BY department
  `, [teacherId]);
  
  // Build filter conditions
  let whereConditions = ['c.teacher_id = ?'];
  let queryParams = [teacherId];
  
  if (selectedYear) {
    whereConditions.push('c.academic_year = ?');
    queryParams.push(selectedYear);
  }
  
  if (selectedBranch) {
    whereConditions.push('c.department = ?');
    queryParams.push(selectedBranch);
  }
  
  // Get filtered classes for this teacher
  const classes = await all(`
    SELECT c.*, COUNT(s.id) as student_count
    FROM classes c 
    LEFT JOIN students s ON c.id = s.class_id 
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY c.id
    ORDER BY c.academic_year DESC, c.department, c.name
  `, queryParams);

  // Get today's attendance summary for each class
  for (let cls of classes) {
    const attendanceStats = await all(`
      SELECT 
        status,
        COUNT(*) as count
      FROM attendance 
      WHERE class_id = ? AND date = ?
      GROUP BY status
    `, [cls.id, today]);
    
    cls.attendance_stats = {};
    attendanceStats.forEach(stat => {
      cls.attendance_stats[stat.status] = stat.count;
    });
    
    cls.total_marked = attendanceStats.reduce((sum, stat) => sum + stat.count, 0);
    cls.pending = cls.student_count - cls.total_marked;
  }

  res.render('daily-attendance', { 
    classes, 
    today,
    academicYears,
    branches,
    selectedYear,
    selectedBranch,
    pageTitle: 'Daily Attendance Tracking'
  });
});

// Mark attendance for a specific class
router.get('/class/:id/daily-attendance', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const teacherId = req.session.user.id;
  const today = new Date().toISOString().slice(0, 10);
  
  // Get filter parameters
  const selectedYear = req.query.year || '';
  const selectedBranch = req.query.branch || '';
  
  // Verify teacher owns this class
  const classInfo = await all(`
    SELECT * FROM classes WHERE id = ? AND teacher_id = ?
  `, [classId, teacherId]);
  
  if (classInfo.length === 0) {
    req.session.flash = { message: 'Class not found or access denied' };
    return res.redirect('/daily-attendance');
  }

  // Get all unique academic years for students in this class
  const studentYears = await all(`
    SELECT DISTINCT 
      COALESCE(s.academic_year, c.academic_year) as academic_year
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.class_id = ? AND COALESCE(s.academic_year, c.academic_year) IS NOT NULL
    ORDER BY academic_year DESC
  `, [classId]);
  
  // Get all unique branches/departments for students in this class
  const studentBranches = await all(`
    SELECT DISTINCT 
      COALESCE(s.branch, c.department) as branch
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.class_id = ? AND COALESCE(s.branch, c.department) IS NOT NULL
    ORDER BY branch
  `, [classId]);

  // Build filter conditions for students
  let whereConditions = ['s.class_id = ?'];
  let queryParams = [today, classId];
  
  if (selectedYear) {
    whereConditions.push('(s.academic_year = ? OR (s.academic_year IS NULL AND c.academic_year = ?))');
    queryParams.push(selectedYear, selectedYear);
  }
  
  if (selectedBranch) {
    whereConditions.push('(s.branch = ? OR (s.branch IS NULL AND c.department = ?))');
    queryParams.push(selectedBranch, selectedBranch);
  }

  // Get filtered students in this class with today's attendance
  const students = await all(`
    SELECT 
      s.*,
      a.status,
      a.note,
      g.name as parent_name,
      g.email as parent_email,
      g.phone as parent_phone,
      COALESCE(s.academic_year, c.academic_year) as student_year,
      COALESCE(s.branch, c.department) as student_branch
    FROM students s
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
    LEFT JOIN guardians g ON s.id = g.student_id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY 
      COALESCE(s.academic_year, c.academic_year) DESC,
      COALESCE(s.branch, c.department),
      CAST(s.roll_no AS INTEGER)
  `, queryParams);

  res.render('mark-daily-attendance', {
    class: classInfo[0],
    students,
    today,
    studentYears,
    studentBranches,
    selectedYear,
    selectedBranch,
    pageTitle: `Mark Attendance - ${classInfo[0].name}`
  });
});

// Submit daily attendance
router.post('/class/:id/daily-attendance', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const teacherId = req.session.user.id;
  const today = new Date().toISOString().slice(0, 10);
  const { attendance, notes } = req.body;

  try {
    // Verify teacher owns this class
    const classInfo = await all(`
      SELECT * FROM classes WHERE id = ? AND teacher_id = ?
    `, [classId, teacherId]);
    
    if (classInfo.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Process attendance for each student
    for (const [studentId, status] of Object.entries(attendance)) {
      const note = notes && notes[studentId] ? notes[studentId] : null;
      
      // Insert or update attendance record
      await run(`
        INSERT OR REPLACE INTO attendance 
        (date, class_id, student_id, status, note) 
        VALUES (?, ?, ?, ?, ?)
      `, [today, classId, parseInt(studentId), status, note]);
    }

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`class-${classId}`).emit('attendance-updated', {
        classId,
        date: today,
        updatedBy: teacherId,
        timestamp: new Date().toISOString()
      });
    }

    // Send automatic absence notifications if enabled
    try {
      const settings = await all(`
        SELECT absence_alerts, email_enabled, sms_enabled 
        FROM notification_settings 
        WHERE teacher_id = ?
      `, [teacherId]);
      
      if (settings.length > 0 && settings[0].absence_alerts && 
          (settings[0].email_enabled || settings[0].sms_enabled)) {
        
        // Import notification functions
        const { sendAbsenceNotifications } = await import('./notifications.js');
        
        // Send notifications in background (don't wait)
        setImmediate(async () => {
          try {
            await sendAbsenceNotifications(classId, today, teacherId);
            console.log(`Absence notifications sent for class ${classId} on ${today}`);
          } catch (error) {
            console.error('Error sending automatic absence notifications:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error checking notification settings:', error);
    }

    // Send immediate notifications for absent students
    await sendAbsentNotifications(classId, today);

    req.session.flash = { 
      message: `Attendance marked successfully for ${Object.keys(attendance).length} students` 
    };
    res.redirect('/daily-attendance');

  } catch (error) {
    console.error('Error marking attendance:', error);
    req.session.flash = { 
      message: 'Error marking attendance. Please try again.' 
    };
    res.redirect(`/class/${classId}/daily-attendance`);
  }
});

// Quick mark all present
router.post('/class/:id/mark-all-present', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id);
  const teacherId = req.session.user.id;
  const today = new Date().toISOString().slice(0, 10);

  try {
    // Verify teacher owns this class
    const classInfo = await all(`
      SELECT * FROM classes WHERE id = ? AND teacher_id = ?
    `, [classId, teacherId]);
    
    if (classInfo.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all students in this class
    const students = await all(`
      SELECT id FROM students WHERE class_id = ?
    `, [classId]);

    // Mark all as present
    for (const student of students) {
      await run(`
        INSERT OR REPLACE INTO attendance 
        (date, class_id, student_id, status, note) 
        VALUES (?, ?, ?, 'present', 'Marked all present')
      `, [today, classId, student.id]);
    }

    res.json({ 
      success: true, 
      message: `All ${students.length} students marked present` 
    });

  } catch (error) {
    console.error('Error marking all present:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Function to send notifications for absent students
async function sendAbsentNotifications(classId, date) {
  const absentStudents = await all(`
    SELECT 
      s.name as student_name,
      s.roll_no,
      c.name as class_name,
      g.name as parent_name,
      g.email as parent_email,
      g.phone as parent_phone,
      a.id as attendance_id
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN classes c ON a.class_id = c.id
    LEFT JOIN guardians g ON s.id = g.student_id
    WHERE a.class_id = ? AND a.date = ? AND a.status = 'absent'
  `, [classId, date]);

  for (const student of absentStudents) {
    if (student.parent_email) {
      // Send email notification (implement email sending logic)
      console.log(`Sending absent notification for ${student.student_name} to ${student.parent_email}`);
      
      // Log notification attempt
      await run(`
        INSERT INTO notification_log 
        (attendance_id, channel, status, sent_at) 
        VALUES (?, 'email', 'sent', datetime('now'))
      `, [student.attendance_id]);
    }
  }
}

export default router;