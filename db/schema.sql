-- ============================================================
-- UCB Course Prospectus & Subject Eligibility Planner
-- Expo SQLite schema — offline-first, single local student profile
-- ============================================================

PRAGMA foreign_keys = ON;

-- One row per curriculum "package" imported from bundled JSON.
-- Supports multiple programs and multiple curriculum versions
-- coexisting on-device (e.g. ITCS 2023 vs ITCS 2020).
CREATE TABLE IF NOT EXISTS programs (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  program_code       TEXT NOT NULL,          -- e.g. 'ITCS'
  program_name       TEXT NOT NULL,          -- e.g. 'BS Information Technology'
  curriculum_version TEXT NOT NULL,          -- e.g. '2023'
  source_file        TEXT,                   -- imported JSON filename, for traceability
  imported_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (program_code, curriculum_version)
);

-- Subjects are global (subject_code is unique across programs);
-- placement inside a curriculum is program-specific (see program_subjects).
CREATE TABLE IF NOT EXISTS subjects (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_code TEXT NOT NULL UNIQUE,   -- e.g. 'IT301'
  subject_name TEXT NOT NULL,
  units        REAL NOT NULL DEFAULT 3
);

-- Where a subject sits inside a specific program/curriculum version.
CREATE TABLE IF NOT EXISTS program_subjects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  year_level INTEGER NOT NULL,   -- 1,2,3,4
  term       INTEGER NOT NULL,   -- 1,2,3 (3 = summer)
  UNIQUE (program_id, subject_id)
);

-- Prerequisite edges, scoped per program: the same subject_code can
-- carry different prereqs under different curriculum versions.
CREATE TABLE IF NOT EXISTS prerequisites (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id              INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject_id              INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  prerequisite_subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (program_id, subject_id, prerequisite_subject_id),
  CHECK (subject_id != prerequisite_subject_id)
);

-- Co-requisite edges (must be taken in the SAME term, per spec — see
-- planned_subjects below for how "same term" is evaluated).
CREATE TABLE IF NOT EXISTS corequisites (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id             INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject_id             INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  corequisite_subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE (program_id, subject_id, corequisite_subject_id),
  CHECK (subject_id != corequisite_subject_id)
);

-- Year-range prerequisite rules (e.g. requires all subjects from Year 1 through through_year_level).
CREATE TABLE IF NOT EXISTS year_range_prerequisites (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id         INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject_id         INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  through_year_level INTEGER NOT NULL CHECK (through_year_level >= 1 AND through_year_level <= 5),
  UNIQUE (program_id, subject_id, through_year_level)
);

-- Single local student profile. App enforces exactly one row (id = 1).
CREATE TABLE IF NOT EXISTS student_profile (
  id                 INTEGER PRIMARY KEY CHECK (id = 1),
  program_id         INTEGER REFERENCES programs(id),
  current_year_level INTEGER,
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Grade history. One row per attempt so retakes are preserved.
-- Philippine 5-point scale: 1.00 (highest) .. 5.00 (lowest).
-- status is derived: passing = grade <= 3.00.
CREATE TABLE IF NOT EXISTS completed_subjects (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id     INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  grade          REAL NOT NULL CHECK (grade >= 1.00 AND grade <= 5.00),
  status         TEXT GENERATED ALWAYS AS (
                    CASE WHEN grade <= 3.00 THEN 'passed' ELSE 'failed' END
                 ) STORED,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  school_year    TEXT,      -- e.g. '2025-2026'
  term_taken     INTEGER,   -- 1,2,3
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (subject_id, attempt_number)
);

-- Latest attempt per subject — this is what eligibility checks read.
CREATE VIEW IF NOT EXISTS subject_status AS
  SELECT cs.subject_id, cs.grade, cs.status, cs.attempt_number
  FROM completed_subjects cs
  INNER JOIN (
    SELECT subject_id, MAX(attempt_number) AS max_attempt
    FROM completed_subjects
    GROUP BY subject_id
  ) latest ON latest.subject_id = cs.subject_id
          AND latest.max_attempt = cs.attempt_number;

-- Subjects the student has "plotted" into a future term. Needed
-- because co-requisites are only satisfied if the pair is planned
-- together in the same term (not merely both existing in the curriculum).
CREATE TABLE IF NOT EXISTS planned_subjects (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id          INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  planned_school_year TEXT NOT NULL,
  planned_term        INTEGER NOT NULL,
  UNIQUE (subject_id, planned_school_year, planned_term)
);

-- App-level key/value settings (schema_version, active program_id, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_program_subjects_program    ON program_subjects(program_id);
CREATE INDEX IF NOT EXISTS idx_prereq_subject              ON prerequisites(subject_id);
CREATE INDEX IF NOT EXISTS idx_coreq_subject               ON corequisites(subject_id);
CREATE INDEX IF NOT EXISTS idx_year_range_prereq_subject   ON year_range_prerequisites(subject_id);
CREATE INDEX IF NOT EXISTS idx_completed_subject           ON completed_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_planned_term                ON planned_subjects(planned_school_year, planned_term);
