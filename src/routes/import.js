import express from 'express';
import multer from 'multer';
import { all, run } from '../db.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

router.get('/class/:id/import', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  res.render('import_class', { klass, error: null });
});

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(',').map(s => s.trim());
  const rows = lines.map(line => {
    const cols = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        cols.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    const obj = {};
    header.forEach((h, idx) => obj[h] = (cols[idx] || '').trim());
    return obj;
  });
  return { header, rows };
}

router.post('/class/:id/import', requireAuth, upload.single('csv'), async (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const klass = (await all(`SELECT * FROM classes WHERE id = ? AND teacher_id = ?`, [classId, req.session.user.id]))[0];
  if (!klass) return res.status(404).send('Not found');
  if (!req.file) return res.status(400).render('import_class', { klass, error: 'CSV file is required' });

  const text = req.file.buffer.toString('utf8');
  const { header, rows } = parseCsv(text);
  const required = ['name','roll_no','guardian_name','guardian_email','guardian_phone'];
  for (const f of required) {
    if (!header.includes(f)) return res.status(400).render('import_class', { klass, error: `Missing column: ${f}` });
  }

  try {
    for (const r of rows) {
      if (!r.name) continue;
      await run(`INSERT INTO students (name, roll_no, class_id) VALUES (?,?,?)`, [r.name, r.roll_no || null, classId]);
      const s = (await all(`SELECT * FROM students WHERE class_id = ? AND name = ? ORDER BY id DESC LIMIT 1`, [classId, r.name]))[0];
      await run(`INSERT INTO guardians (name, email, phone, preferred_channel, student_id) VALUES (?,?,?,?,?)`, [
        r.guardian_name || null, r.guardian_email || null, r.guardian_phone || null, 'email', s.id
      ]);
    }
  } catch (e) {
    return res.status(400).render('import_class', { klass, error: 'Failed to import CSV. Ensure valid format.' });
  }

  res.redirect(`/class/${classId}/attendance`);
});

export default router;
