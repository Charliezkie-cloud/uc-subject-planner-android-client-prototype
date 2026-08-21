# Database Design — Course Prospectus & Subject Eligibility Planner

Offline SQLite schema (Expo SQLite). Full DDL in [`schema.sql`](./schema.sql).

## Design decisions and why

| Decision | Reasoning |
|---|---|
| `subjects` are global, `program_subjects` maps them into a curriculum | The same subject code (e.g. `GE101`) can appear in multiple programs/versions with different year/term placement — don't duplicate subject rows per program. |
| `prerequisites` / `corequisites` scoped by `program_id` | A curriculum revision can change prerequisite chains for the same subject code. Scoping avoids one program's edit silently breaking another's eligibility rules. |
| `completed_subjects` stores one row per **attempt** | Retakes must be preserved for audit/history, not overwritten. `subject_status` view exposes only the latest attempt for eligibility checks. |
| `status` is a SQLite generated column | Single source of truth for pass/fail — no risk of the app computing it inconsistently in two places. |
| `planned_subjects` table | Co-requisites require "taken in the same term" (per the instructor's note in the spec), which the app can't verify from `completed_subjects` alone — it needs to know what the student is *planning* to take together. |
| Single-row `student_profile` (`id = 1` via CHECK) | Confirmed: single local profile, self-planning use case. No `students` table with multiple rows needed for MVP. |
| Curriculum delivered as versioned JSON bundles | Confirmed: multi-program, multi-version, importable — not hardcoded. |

## Entity relationship overview

```
programs 1───* program_subjects *───1 subjects
   │                                     │  │
   │                                     │  └──* completed_subjects
   1                                     │  └──* planned_subjects
   │                                     │
   *                                     *
prerequisites (subject_id, prerequisite_subject_id, program_id)
corequisites  (subject_id, corequisite_subject_id, program_id)

student_profile ──> programs (current program)
app_settings (key/value, e.g. active program_id, schema_version)
```

## Grading

Philippine 5-point scale, confirmed: **1.00 = highest, passing = grade ≤ 3.00, failing = grade > 3.00 up to 5.00.**

> Assumption flagged for verification: whether exactly `3.00` is passing or failing varies by institution. Schema currently treats `3.00` as passing (`status` generated column). If UCB-Banilad's actual cutoff differs, this is a one-line change in `schema.sql` (`grade <= 3.00` → `grade < 3.00`) — do not hardcode this comparison anywhere else in the app.

## Eligibility algorithm

Runs against `subject_status` (latest attempt per subject) and `planned_subjects` (same-term co-req check):

```
FOR each Subject S in program_subjects (for the student's program):
  IF S already in subject_status with status = 'passed':
    SKIP (already completed)

  prereqs_ok  = ALL prerequisite subjects of S have status = 'passed'
                in subject_status

  coreqs_ok   = ALL corequisite subjects of S satisfy EITHER:
                  - status = 'passed' in subject_status, OR
                  - present in planned_subjects for the SAME
                    (planned_school_year, planned_term) the student
                    is planning S into

  IF prereqs_ok AND coreqs_ok:
    S is ELIGIBLE
  ELSE:
    S is NOT ELIGIBLE (surface which prereq/coreq is missing, not just a boolean)
```

Implementation note: keep this as a pure function in `/lib/eligibility.ts` (input: arrays of subjects/prereqs/coreqs/statuses/planned — output: eligibility map). No direct DB or React imports, so it's unit-testable in isolation and reusable if the UI changes.

## Curriculum JSON import format (proposed)

One file per program + curriculum version, bundled under `/data/<PROGRAM_CODE>/` (e.g. `data/BSIT/2024-2025.json`). Register each file in `data/bundledCurricula.ts` so the app can seed multiple prospectus versions for the same course:

```json
{
  "program_code": "ITCS",
  "program_name": "BS Information Technology",
  "curriculum_version": "2024-2025",
  "subjects": [
    { "code": "IT301", "name": "Systems Integration", "units": 3, "year_level": 3, "term": 1 }
  ],
  "prerequisites": [
    { "subject": "IT301", "requires": "IT201" }
  ],
  "corequisites": [
    { "subject": "IT301", "with": "IT301L" }
  ]
}
```

Import is a transaction: upsert into `programs` (unique on `program_code` + `curriculum_version`), then `subjects`, `program_subjects`, `prerequisites`, `corequisites`. Re-importing the same file should be idempotent (safe to re-run after a curriculum correction). Multiple versions of the same `program_code` coexist; the student picks one via Settings / Courses.

## Open items to confirm with UCB-CCS

- Exact passing/failing boundary at `3.00` (see Grading note above).
- Whether a co-requisite completed **in advance** (not simultaneously) should ever be allowed without Dean approval — the source spec flags this as a rule the instructor still needs to clarify. Current schema/algorithm treats "already passed" as satisfying a co-req; tighten this later if UCB says otherwise.
