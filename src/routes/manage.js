import express from 'express';
import { all, run } from '../db.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Add Class
router.get('/manage/class/new', requireAuth, (req, res) => {
  res.render('manage_class_new', { error: null });
});

router.post('/manage/class/new', requireAuth, async (req, res) => {
  const { name, section } = req.body;
  if (!name) return res.render('manage_class_new', { error: 'Class name is required' });
  await run(`INSERT INTO classes (name, section, teacher_id) VALUES (?,?,?)`, [name, section || null, req.session.user.id]);
  req.session.flash = { type: 'success', message: 'Class created' };
  res.redirect('/dashboard');
});

// Add Student to class
router.get('/class/:id/student/new', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  res.render('manage_student_new', { klass, error: null });
});

router.post('/class/:id/student/new', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  const { name, roll_no, guardian_name, guardian_email, guardian_phone } = req.body;
  if (!name) return res.render('manage_student_new', { klass, error: 'Student name is required' });
  await run(`INSERT INTO students (name, roll_no, class_id) VALUES (?,?,?)`, [name, roll_no || null, classId]);
  const s = (await all(`SELECT * FROM students WHERE class_id = ? ORDER BY id DESC LIMIT 1`, [classId]))[0];
  await run(`INSERT INTO guardians (name, email, phone, preferred_channel, student_id) VALUES (?,?,?,?,?)`, [
    guardian_name || null, guardian_email || null, guardian_phone || null, 'email', s.id
  ]);
  req.session.flash = { type: 'success', message: 'Student added' };
  res.redirect('/dashboard');
});

// Manage periods (list/add/edit)
router.get('/class/:id/periods/manage', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  const periods = await all(`SELECT * FROM periods WHERE class_id = ? ORDER BY id ASC`, [classId]);
  res.render('manage_periods', { klass, periods, error: null });
});

router.post('/class/:id/periods/add', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  const { name, start_time, end_time } = req.body;
  if (!name) {
    const periods = await all(`SELECT * FROM periods WHERE class_id = ? ORDER BY id ASC`, [classId]);
    return res.render('manage_periods', { klass, periods, error: 'Period name is required' });
  }
  await run(`INSERT OR IGNORE INTO periods (class_id, name, start_time, end_time) VALUES (?,?,?,?)`, [classId, name, start_time || null, end_time || null]);
  req.session.flash = { type: 'success', message: 'Period added' };
  res.redirect(`/class/${classId}/periods/manage`);
});

router.post('/class/:id/periods/:pid/edit', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const pid = parseInt(req.params.pid, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  const { name, start_time, end_time } = req.body;
  await run(`UPDATE periods SET name = ?, start_time = ?, end_time = ? WHERE id = ? AND class_id = ?`, [name || null, start_time || null, end_time || null, pid, classId]);
  req.session.flash = { type: 'success', message: 'Period updated' };
  res.redirect(`/class/${classId}/periods/manage`);
});

export default router;
 
// Manage students list
router.get('/class/:id/students/manage', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  const students = await all(`
    SELECT s.*, g.id as guardian_id, g.name as guardian_name, g.email as guardian_email, g.phone as guardian_phone
    FROM students s
    LEFT JOIN guardians g ON g.student_id = s.id
    WHERE s.class_id = ?
    ORDER BY CAST(s.roll_no AS INT)
  `, [classId]);
  res.render('manage_students', { klass, students });
});

router.post('/class/:id/students/:sid/edit', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const sid = parseInt(req.params.sid, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  const { name, roll_no, guardian_name, guardian_email, guardian_phone } = req.body;
  await run(`UPDATE students SET name = ?, roll_no = ? WHERE id = ? AND class_id = ?`, [name || null, roll_no || null, sid, classId]);
  const existing = await all(`SELECT * FROM guardians WHERE student_id = ? LIMIT 1`, [sid]);
  if (existing.length === 0) {
    if (guardian_name || guardian_email || guardian_phone) {
      await run(`INSERT INTO guardians (name, email, phone, preferred_channel, student_id) VALUES (?,?,?,?,?)`, [
        guardian_name || null, guardian_email || null, guardian_phone || null, 'email', sid
      ]);
    }
  } else {
    await run(`UPDATE guardians SET name = ?, email = ?, phone = ? WHERE student_id = ?`, [
      guardian_name || null, guardian_email || null, guardian_phone || null, sid
    ]);
  }
  req.session.flash = { type: 'success', message: 'Student updated' };
  res.redirect(`/class/${classId}/students/manage`);
});

router.post('/class/:id/students/:sid/delete', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const sid = parseInt(req.params.sid, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  await run(`DELETE FROM students WHERE id = ? AND class_id = ?`, [sid, classId]);
  req.session.flash = { type: 'success', message: 'Student deleted' };
  res.redirect(`/class/${classId}/students/manage`);
});
