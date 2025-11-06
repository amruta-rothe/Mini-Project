import express from 'express';
import { all } from '../db.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// Class details: sections, periods, and other metadata
router.get('/api/class/:id/details', requireAuth, async (req, res) => {
  try {
    const classId = parseInt(req.params.id, 10);
    const teacherId = req.session.user.id;
    
    // Verify class belongs to teacher
    const classInfo = await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, teacherId]);
    if (classInfo.length === 0) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    
    // Get unique sections from students in this class
    const sections = await all(`
      SELECT DISTINCT section 
      FROM students 
      WHERE class_id = ? AND section IS NOT NULL AND section != ''
      ORDER BY section
    `, [classId]);
    
    // Get periods (assuming you have a periods table or use default periods)
    const periods = [
      { id: 1, name: 'Period 1 (9:00-10:00)' },
      { id: 2, name: 'Period 2 (10:00-11:00)' },
      { id: 3, name: 'Period 3 (11:15-12:15)' },
      { id: 4, name: 'Period 4 (12:15-1:15)' },
      { id: 5, name: 'Period 5 (2:00-3:00)' },
      { id: 6, name: 'Period 6 (3:00-4:00)' }
    ];
    
    res.json({
      success: true,
      class: classInfo[0],
      sections: sections.map(s => s.section),
      periods: periods
    });
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Class summary: counts per status in range
router.get('/api/class/:id/summary', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const { from, to } = req.query;
  const rows = await all(`
    SELECT status, COUNT(*) as c
    FROM attendance
    WHERE class_id = ?
      AND (? IS NULL OR date >= ?)
      AND (? IS NULL OR date <= ?)
    GROUP BY status
  `, [classId, from || null, from || null, to || null, to || null]);
  const out = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const r of rows) out[r.status] = r.c;
  res.json(out);
});

// Class trend: last N days present rate
router.get('/api/class/:id/trend', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const days = Math.min(parseInt(req.query.days || '30', 10), 120);
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const totals = await all(`
    SELECT date, COUNT(*) as total
    FROM attendance
    WHERE class_id = ? AND date >= ?
    GROUP BY date
  `, [classId, dates[0]]);
  const presents = await all(`
    SELECT date, COUNT(*) as present
    FROM attendance
    WHERE class_id = ? AND date >= ? AND status = 'present'
    GROUP BY date
  `, [classId, dates[0]]);
  const tMap = new Map(totals.map(r => [r.date, r.total]));
  const pMap = new Map(presents.map(r => [r.date, r.present]));
  const series = dates.map(d => {
    const t = tMap.get(d) || 0;
    const p = pMap.get(d) || 0;
    return { date: d, rate: t ? Math.round((p / t) * 100) : null };
  });
  res.json(series);
});

// Class student percentages (range)
router.get('/api/class/:id/student-percentages', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const { from, to } = req.query;
  const rows = await all(`
    SELECT s.id, s.name, s.roll_no,
      SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present_count,
      COUNT(a.id) as total_count
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id
      AND (? IS NULL OR a.date >= ?)
      AND (? IS NULL OR a.date <= ?)
    WHERE s.class_id = ?
    GROUP BY s.id
    ORDER BY CAST(s.roll_no AS INT)
  `, [from || null, from || null, to || null, to || null, classId]);
  const data = rows.map(r => ({
    id: r.id,
    name: r.name,
    roll_no: r.roll_no,
    pct: r.total_count ? Math.round((r.present_count / r.total_count) * 100) : 0
  }));
  res.json(data);
});

// Teacher-level totals for dashboard
router.get('/api/teacher/totals', requireAuth, async (req, res) => {
  const teacherId = req.session.user.id;
  const classes = await all(`SELECT COUNT(*) as c FROM classes WHERE teacher_id = ?`, [teacherId]);
  const students = await all(`SELECT COUNT(*) as c FROM students WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = ?)`, [teacherId]);
  res.json({ classes: classes[0]?.c || 0, students: students[0]?.c || 0 });
});

// Teacher-level today summary across all classes
router.get('/api/teacher/today', requireAuth, async (req, res) => {
  const teacherId = req.session.user.id;
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const rows = await all(
    `SELECT status, COUNT(*) as c
     FROM attendance
     WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = ?)
       AND date = ?
     GROUP BY status`,
    [teacherId, date]
  );
  const out = { date, present: 0, absent: 0, late: 0, excused: 0 };
  for (const r of rows) out[r.status] = r.c;
  res.json(out);
});

// Teacher-level trend: last N days present rate across all classes
router.get('/api/teacher/trend', requireAuth, async (req, res) => {
  const teacherId = req.session.user.id;
  const days = Math.min(parseInt(req.query.days || '30', 10), 120);
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const since = dates[0];
  const totals = await all(
    `SELECT date, COUNT(*) as total
     FROM attendance
     WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = ?)
       AND date >= ?
     GROUP BY date`,
    [teacherId, since]
  );
  const presents = await all(
    `SELECT date, COUNT(*) as present
     FROM attendance
     WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = ?)
       AND date >= ? AND status = 'present'
     GROUP BY date`,
    [teacherId, since]
  );
  const tMap = new Map(totals.map(r => [r.date, r.total]));
  const pMap = new Map(presents.map(r => [r.date, r.present]));
  const series = dates.map(d => {
    const t = tMap.get(d) || 0;
    const p = pMap.get(d) || 0;
    return { date: d, rate: t ? Math.round((p / t) * 100) : null };
  });
  res.json(series);
});

export default router;