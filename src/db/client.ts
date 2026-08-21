import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS programs (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  program_code       TEXT NOT NULL,
  program_name       TEXT NOT NULL,
  curriculum_version TEXT NOT NULL,
  source_file        TEXT,
  imported_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (program_code, curriculum_version)
);

CREATE TABLE IF NOT EXISTS subjects (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_code TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL,
  units        REAL NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS program_subjects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  year_level INTEGER NOT NULL,
  term       INTEGER NOT NULL,
  UNIQUE (program_id, subject_id)
);

CREATE TABLE IF NOT EXISTS prerequisites (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id              INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject_id              INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  prerequisite_subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (program_id, subject_id, prerequisite_subject_id),
  CHECK (subject_id != prerequisite_subject_id)
);

CREATE TABLE IF NOT EXISTS corequisites (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id             INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject_id             INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  corequisite_subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (program_id, subject_id, corequisite_subject_id),
  CHECK (subject_id != corequisite_subject_id)
);

CREATE TABLE IF NOT EXISTS student_profile (
  id                 INTEGER PRIMARY KEY CHECK (id = 1),
  program_id         INTEGER REFERENCES programs(id),
  current_year_level INTEGER,
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS completed_subjects (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id     INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  grade          REAL NOT NULL CHECK (grade >= 1.00 AND grade <= 5.00),
  status         TEXT GENERATED ALWAYS AS (
                    CASE WHEN grade <= 3.00 THEN 'passed' ELSE 'failed' END
                 ) STORED,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  school_year    TEXT,
  term_taken     INTEGER,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (subject_id, attempt_number)
);

CREATE VIEW IF NOT EXISTS subject_status AS
  SELECT cs.subject_id, cs.grade, cs.status, cs.attempt_number
  FROM completed_subjects cs
  INNER JOIN (
    SELECT subject_id, MAX(attempt_number) AS max_attempt
    FROM completed_subjects
    GROUP BY subject_id
  ) latest ON latest.subject_id = cs.subject_id
          AND latest.max_attempt = cs.attempt_number;

CREATE TABLE IF NOT EXISTS planned_subjects (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id          INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  planned_school_year TEXT NOT NULL,
  planned_term        INTEGER NOT NULL,
  UNIQUE (subject_id, planned_school_year, planned_term)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_program_subjects_program ON program_subjects(program_id);
CREATE INDEX IF NOT EXISTS idx_prereq_subject           ON prerequisites(subject_id);
CREATE INDEX IF NOT EXISTS idx_coreq_subject            ON corequisites(subject_id);
CREATE INDEX IF NOT EXISTS idx_completed_subject        ON completed_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_planned_term             ON planned_subjects(planned_school_year, planned_term);
`;

/**
 * Initializes the SQLite database and executes initial schema migrations.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('uc_planner.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(SCHEMA_SQL);

  dbInstance = db;
  return db;
}
