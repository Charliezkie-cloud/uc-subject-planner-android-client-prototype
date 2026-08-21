# UCB Course Prospectus & Subject Eligibility Planner

Offline-first React Native (Expo) app for University of Cebu – Banilad. Lets a student plot and plan future subjects against the official course prospectus — evaluating prerequisite and co-requisite rules automatically — without any connection to the university portal.

**Special project** — UCB-CCS. Instructor: DL Sanchez. Student: CH Tinoy.

## Problem

Enrollment eligibility is currently checked manually by comparing a student's completed subjects against the prerequisite/co-requisite structure in the official syllabus. This is slow and error-prone. This app automates that comparison, fully offline.

## Core flow

```
Open app → Select program/curriculum → Select year level →
Input completed subjects + grades → App evaluates prerequisites &
co-requisites → Displays subjects eligible for the next term
```

## Scope

**In scope**
- Import a program's curriculum (prerequisites, co-requisites, year/term layout) from bundled JSON
- Record completed subjects and grades (Philippine 1.00–5.00 scale)
- Compute subject eligibility for upcoming terms
- Plot/plan subjects into future terms
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
/app                 Expo Router screens
/components           Shared UI components
/db
  schema.sql          SQLite DDL (source of truth)
  client.ts           expo-sqlite connection + migration runner
  queries/             One file per table/domain (programs, subjects, completed, planned)
/lib
  eligibility.ts       Pure eligibility engine (no DB/React imports)
  types.ts
/data/curricula        Bundled per-program curriculum JSON files
/hooks                 React hooks wrapping /db/queries for screens
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

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

```bash
npx create-expo-app@latest uc-subject-planner-android-client
cd ucb-course-planner
npx expo install expo-sqlite
# add @react-native-reuseable per its install docs
npx expo run:android
```

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Database

See [`DATABASE_DESIGN.md`](./DATABASE_DESIGN.md) for the full schema, ER overview, grading rules, and the eligibility algorithm. DDL lives in [`schema.sql`](./schema.sql).

## Curriculum data

Each program + curriculum version ships as a JSON file under `/data/curricula` and is imported into SQLite on first run (or via an import screen for updates). Format documented in `DATABASE_DESIGN.md`.

## Status

Planning stage — schema and architecture defined, implementation not started.