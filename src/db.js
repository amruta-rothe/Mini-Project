import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'app.db');

import fs from 'fs';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrate() {
  await run(`PRAGMA foreign_keys = ON;`);

  await run(`CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );`);

  await run(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    section TEXT,
    teacher_id INTEGER NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
  );`);

  await run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    roll_no TEXT,
    class_id INTEGER NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  );`);

  await run(`CREATE TABLE IF NOT EXISTS guardians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    preferred_channel TEXT DEFAULT 'email',
    student_id INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );`);

  await run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present','absent','late','excused')),
    note TEXT,
    UNIQUE(date, student_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );`);

  await run(`CREATE TABLE IF NOT EXISTS notification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attendance_id INTEGER NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    provider_id TEXT,
    sent_at TEXT,
    error TEXT,
    FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE
  );`);
}

async function seed() {
  const existing = await all(`SELECT COUNT(*) as c FROM teachers;`);
  if (existing[0].c > 0) return;
  const password_hash = await bcrypt.hash('pass1234', 10);
  await run(`INSERT INTO teachers (name, email, password_hash) VALUES (?,?,?)`, [
    'Demo Teacher',
    'teacher@example.com',
    password_hash
  ]);
  const teacher = (await all(`SELECT * FROM teachers WHERE email = ?`, ['teacher@example.com']))[0];

  await run(`INSERT INTO classes (name, section, teacher_id) VALUES (?,?,?)`, [
    'Class 8', 'A', teacher.id
  ]);
  const klass = (await all(`SELECT * FROM classes WHERE teacher_id = ?`, [teacher.id]))[0];

  const students = [
    ['Aarav Sharma','1'],
    ['Diya Patel','2'],
    ['Kabir Singh','3'],
    ['Ananya Gupta','4']
  ];
  for (const [name, roll] of students) {
    await run(`INSERT INTO students (name, roll_no, class_id) VALUES (?,?,?)`, [name, roll, klass.id]);
  }
  const rows = await all(`SELECT * FROM students WHERE class_id = ?`, [klass.id]);
  for (const s of rows) {
    await run(`INSERT INTO guardians (name, email, phone, preferred_channel, student_id) VALUES (?,?,?,?,?)`, [
      `${s.name} Parent`, `${s.name.split(' ')[0].toLowerCase()}@example.com`, '+911234567890', 'email', s.id
    ]);
  }
}

async function ensureDefaultTeacher(email, password) {
  if (!email || !password) return;
  const existing = await all(`SELECT * FROM teachers WHERE email = ?`, [email]);
  let teacherId;
  if (existing.length === 0) {
    const hash = await bcrypt.hash(password, 10);
    await run(`INSERT INTO teachers (name, email, password_hash) VALUES (?,?,?)`, [
      'Teacher', email, hash
    ]);
    const t = (await all(`SELECT * FROM teachers WHERE email = ?`, [email]))[0];
    teacherId = t.id;
  } else {
    teacherId = existing[0].id;
    const hash = await bcrypt.hash(password, 10);
    await run(`UPDATE teachers SET password_hash = ? WHERE id = ?`, [hash, teacherId]);
  }

  const classCount = await all(`SELECT COUNT(*) as c FROM classes WHERE teacher_id = ?`, [teacherId]);
  if (classCount[0].c === 0) {
    await run(`INSERT INTO classes (name, section, teacher_id) VALUES (?,?,?)`, ['Class 8', 'A', teacherId]);
    const klass = (await all(`SELECT * FROM classes WHERE teacher_id = ?`, [teacherId]))[0];
    await run(`INSERT INTO students (name, roll_no, class_id) VALUES (?,?,?)`, ['Student One','1', klass.id]);
    await run(`INSERT INTO students (name, roll_no, class_id) VALUES (?,?,?)`, ['Student Two','2', klass.id]);
  }
}

const cmd = process.argv[2];
if (cmd === 'init') {
  migrate().then(() => { console.log('DB migrated'); db.close(); }).catch(e => { console.error(e); db.close(); process.exit(1); });
} else if (cmd === 'seed') {
  migrate().then(seed).then(() => { console.log('DB seeded'); db.close(); }).catch(e => { console.error(e); db.close(); process.exit(1); });
}

export { db, migrate, seed, all, run, dbPath, ensureDefaultTeacher };
