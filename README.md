# UCB Course Prospectus & Subject Eligibility Planner

An offline-first React Native (Expo) app for University of Cebu, Banilad campus. It lets a student plot and plan future subjects against the official course prospectus, checking prerequisite and co-requisite rules automatically, with no connection to the university portal required.

**Special project, UCB-CCS.** Instructor: DL Sanchez. Student: CH Tinoy.

## Problem

Right now, enrollment eligibility is checked manually by comparing a student's completed subjects against the prerequisite and co-requisite structure in the official syllabus. That process is slow and prone to mistakes. This app automates the comparison, entirely offline.

## Core flow

```
Open app → Select program/curriculum → Select year level →
Input completed subjects and grades → App evaluates prerequisites
and co-requisites → Displays subjects eligible for the next term
```

## Scope

**In scope**
- Import a program's curriculum (prerequisites, co-requisites, year and term layout) from bundled JSON
- Record completed subjects and grades (Philippine 1.00 to 5.00 scale)
- Compute subject eligibility for upcoming terms
- Plot and plan subjects into future terms
- Fully offline, single local student profile

**Explicitly out of scope**
- Connecting to or reading from the university portal
- Modifying official student records
- Performing actual enrollment

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo |
| UI components | `@react-native-reuseable` |
| Local database | Expo SQLite |
| Language | TypeScript |
| Target platform | Android |

## Project structure

```
.
├── app/                     # Expo Router screens (file-based routing)
│   └── (tabs)/              # Plan, Subjects, Courses, Settings
├── features/                # Domain logic, grouped by feature
│   ├── eligibility/         # Pure eligibility engine, no DB or React imports
│   ├── curriculum-import/   # Curriculum JSON import logic
│   └── grades/              # PH grading scale helpers, status derivation
├── db/
│   ├── schema.sql           # SQLite DDL, source of truth
│   ├── client.ts            # Connection + migration runner
│   └── queries/             # One file per table/domain (programs, subjects, completed, planned)
├── components/              # Dumb, reusable UI only
│   └── ui/                  # Wrappers around @react-native-reuseable
├── hooks/                   # Bridges queries to screens
├── providers/               # Context providers (DB connection, theme)
├── constants/               # Grading thresholds, term enums
├── types/                   # Shared TS types
├── utils/                   # Generic helpers (date, formatting)
├── data/
│   └── curricula/           # Bundled JSON per program and curriculum version
├── assets/
└── docs/                    # README.md, AGENTS.md, DATABASE_DESIGN.md
```

## Getting started

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This moves the starter code into an **app-example** directory and creates a blank **app** directory so you can start developing from scratch.

```bash
npx create-expo-app@latest uc-subject-planner-android-client
cd ucb-course-planner
npx expo install expo-sqlite
# add @react-native-reuseable per its install docs
npx expo run:android
```

## Learn more

To learn more about developing your project with Expo, take a look at these resources:

- [Expo documentation](https://docs.expo.dev/): learn the fundamentals, or dig into advanced topics with the [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): a step-by-step tutorial where you build a project that runs on Android, iOS, and the web.

## Database

See [`DATABASE_DESIGN.md`](./DATABASE_DESIGN.md) for the full schema, ER overview, grading rules, and the eligibility algorithm. DDL lives in [`schema.sql`](./db/schema.sql).

## Curriculum data

Each program and curriculum version ships as a JSON file under `data/curricula` and gets imported into SQLite on first run, or through an import screen for updates. The format is documented in `DATABASE_DESIGN.md`.

## Status

Planning stage. Schema and architecture are defined, implementation hasn't started yet.