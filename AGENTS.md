# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# AGENTS.md

Context for AI coding agents (Claude Code, etc.) working in this repository.

## Project

Offline React Native/Expo app: students plot subjects against a curriculum's prerequisite/co-requisite rules. No backend, no network calls — everything is local SQLite. See `README.md` and `DATABASE_DESIGN.md` for full context before making structural changes.

## Hard constraints — do not violate

- **No network calls.** This app is offline-only by requirement. Never add `fetch`/`axios`/API clients unless explicitly asked.
- **Never simulate a university portal connection.** Completed-subject data only ever enters via manual input or JSON import, never automatic sync.
- **Never implement actual enrollment/registration actions or write to any external system.** This app only computes and displays eligibility.
- **Single student profile.** `student_profile` table is a single row (`id = 1`, enforced by `CHECK`). Don't build multi-student list UI unless the project scope changes.

## Tech stack

- React Native + Expo, target platform Android
- Routing: **Expo Router** (file-based). Screens live under `/app` and stay thin — compose hooks + components, no business logic or direct SQL.
- UI: `@react-native-reuseable` — use its components before writing custom ones
- DB: `expo-sqlite`, schema defined in `/db/schema.sql`
- TypeScript, strict mode, no implicit `any`

## Major screens

The app has 4 top-level screens, navigated via an Expo Router tab group (`/app/(tabs)`):

1. **Plan** — the plotted term-by-term subject plan (`planned_subjects`) and the current eligibility results
2. **Subjects** — completed subjects and grade input/history (`completed_subjects`)
3. **Courses** — program/curriculum selection and curriculum browsing (`programs`, `program_subjects`)
4. **Settings** — active program switch, curriculum import/re-import, app info (`app_settings`)

Don't add a 5th top-level tab without confirming scope — new functionality should nest under one of these four first.

## Project structure

```
/app                       # Expo Router — file-based routing, screens only
  _layout.tsx
  (tabs)/
    _layout.tsx             # tab navigator: Plan, Subjects, Courses, Settings
    plan.tsx
    subjects.tsx
    courses.tsx
    settings.tsx

/src
  /features                 # domain logic, grouped by feature
    /eligibility
      eligibility.ts          # pure engine — no DB/React imports
      eligibility.test.ts
      types.ts
    /curriculum-import
      importCurriculum.ts
      importCurriculum.test.ts
    /grades
      gradeUtils.ts            # PH scale helpers, status derivation

  /db
    schema.sql
    client.ts                  # connection + migration runner
    queries/
      programs.ts
      subjects.ts
      completedSubjects.ts
      plannedSubjects.ts

  /components                # dumb, reusable UI only
    /ui                        # wrappers around @react-native-reuseable
    SubjectCard.tsx
    EligibilityBadge.tsx

  /hooks                     # bridge queries -> screens
    useEligibility.ts
    useCompletedSubjects.ts

  /providers                 # context providers (DB connection, theme)
  /constants                  # grading thresholds, term enums
  /types                      # shared TS types
  /utils                       # generic helpers (date, formatting)

/data/curricula               # bundled JSON per program/version
/assets
/docs                          # README.md, AGENTS.md, DATABASE_DESIGN.md
```

Rules:
- Dependency direction is one-way: `app → features/hooks → db`. Never the reverse.
- Pure logic (`eligibility.ts`, `gradeUtils.ts`) has zero React/DB imports — this is what keeps the eligibility engine unit-testable without a component tree or live SQLite connection.
- One query file per table, not a single giant queries file.
- Path aliases (`@/features/*`, `@/db/*`) via `babel.config.js` + `tsconfig.json` — avoid deep `../../../` chains.

## Business logic — read before touching eligibility code

- Eligibility engine: `/lib/eligibility.ts`. Keep it a **pure function** — inputs are plain arrays/objects (subjects, prerequisites, corequisites, subject statuses, planned subjects), output is an eligibility map. No DB calls, no React imports inside this file. This keeps it unit-testable and reusable if the UI layer changes.
- Grading: Philippine 1.00–5.00 scale. Passing = `grade <= 3.00` (generated column in SQL — don't recompute this comparison ad hoc elsewhere in the app; import the derived `status` from the DB/`subject_status` view instead).
- Co-requisites are only satisfied if the paired subject is **already passed** or **planned in the same term** (`planned_subjects` table with matching `planned_school_year` + `planned_term`) — being merely present elsewhere in the curriculum is not sufficient. See `DATABASE_DESIGN.md` for the full algorithm and the open question about whether pre-completed co-reqs need Dean approval.

## Data conventions

- SQL: `snake_case`. TypeScript: `camelCase`. Map at the query layer, not ad hoc in components.
- Every multi-statement DB write (e.g. curriculum import) wrapped in a transaction.
- Curriculum imports must be idempotent — re-importing the same JSON file should upsert, not duplicate rows (`programs` unique on `program_code` + `curriculum_version`).
- Schema changes go in `/db/schema.sql` first, then a migration step in `/db/client.ts` — never hand-edit the SQLite file shape from application code.

## Testing priorities

Eligibility engine unit tests should cover:
- Subject with no prerequisites (always eligible if not yet passed)
- Missing prerequisite (should block)
- Co-requisite already passed (should satisfy)
- Co-requisite only satisfied by being planned in the same term
- Co-requisite planned in a *different* term (should still block)
- Retake with an improved grade overriding an earlier failing attempt

## Before large changes

This is a small special-project scope. Flag (don't silently implement) anything that would expand scope beyond what's in `README.md` — e.g. multi-student support, network sync, or authentication — since that changes the schema and architecture significantly.