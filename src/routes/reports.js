import express from 'express';
import { all } from '../db.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function sendCsv(res, filename, headers, rows) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  res.write(headers.join(',') + '\n');
  for (const r of rows) {
    res.write(headers.map(h => esc(r[h])).join(',') + '\n');
  }
  res.end();
}

router.get('/reports/class/:id', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  const { from, to, format } = req.query;
  const rows = await all(`
    SELECT a.date, s.roll_no, s.name as student_name, a.status
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    WHERE a.class_id = ?
      AND (? IS NULL OR a.date >= ?)
      AND (? IS NULL OR a.date <= ?)
    ORDER BY a.date DESC, CAST(s.roll_no AS INT)
  `, [classId, from || null, from || null, to || null, to || null]);

  if (format === 'csv') {
    return sendCsv(res, `class-${classId}-report.csv`, ['date','roll_no','student_name','status'], rows);
  }
  res.render('report_class', { klass, rows, from: from || '', to: to || '' });
});

router.get('/reports/student/:id', requireAuth, async (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const student = (await all(`SELECT s.*, c.name as class_name FROM students s JOIN classes c ON c.id = s.class_id WHERE s.id = ? AND c.teacher_id = ?`, [studentId, req.session.user.id]))[0];
  if (!student) return res.status(404).send('Not found');
  const { from, to, format } = req.query;
  const rows = await all(`
    SELECT a.date, a.status
    FROM attendance a
    WHERE a.student_id = ?
      AND (? IS NULL OR a.date >= ?)
      AND (? IS NULL OR a.date <= ?)
    ORDER BY a.date DESC
  `, [studentId, from || null, from || null, to || null, to || null]);

  if (format === 'csv') {
    const mapped = rows.map(r => ({ date: r.date, status: r.status }));
    return sendCsv(res, `student-${studentId}-report.csv`, ['date','status'], mapped);
  }
  res.render('report_student', { student, rows, from: from || '', to: to || '' });
});

export default router;
 
// Period-wise class report
router.get('/reports/class/:id/periods', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  const { date, format } = req.query;
  const selDate = date || new Date().toISOString().slice(0,10);
  const periods = await all(`SELECT * FROM periods WHERE class_id = ? ORDER BY id ASC`, [classId]);
  const students = await all(`SELECT * FROM students WHERE class_id = ? ORDER BY CAST(roll_no AS INT)`, [classId]);
  const rows = await all(`SELECT * FROM attendance_period WHERE class_id = ? AND date = ?`, [classId, selDate]);
  const present = new Map();
  for (const r of rows) present.set(`${r.student_id}_${r.period_id}`, r.present);
  if (format === 'csv') {
    const headers = ['roll_no','student_name', ...periods.map(p=>p.name)];
    const out = students.map(s => {
      const row = { roll_no: s.roll_no, student_name: s.name };
      for (const p of periods) row[p.name] = present.get(`${s.id}_${p.id}`) ? 1 : 0;
      return row;
    });
    return sendCsv(res, `class-${classId}-periods-${selDate}.csv`, headers, out);
  }
  res.render('report_class_periods', { klass, periods, students, present, date: selDate });
});

// Period-wise student report
router.get('/reports/student/:id/periods', requireAuth, async (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const student = (await all(`SELECT s.*, c.name as class_name FROM students s JOIN classes c ON c.id = s.class_id WHERE s.id = ? AND c.teacher_id = ?`, [studentId, req.session.user.id]))[0];
  if (!student) return res.status(404).send('Not found');
  const { from, to, format } = req.query;
  const rows = await all(`
    SELECT a.date, p.name as period_name, a.present
    FROM attendance_period a
    JOIN periods p ON p.id = a.period_id
    WHERE a.student_id = ?
      AND (? IS NULL OR a.date >= ?)
      AND (? IS NULL OR a.date <= ?)
    ORDER BY a.date DESC, p.id ASC
  `, [studentId, from || null, from || null, to || null, to || null]);
  if (format === 'csv') {
    return sendCsv(res, `student-${studentId}-periods.csv`, ['date','period_name','present'], rows.map(r=>({ ...r, present: r.present?1:0 })));
  }
  res.render('report_student_periods', { student, rows, from: from || '', to: to || '' });
});
