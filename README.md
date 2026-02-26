# Compliance App

A React (Create React App) web application for compliance-related forms, audits, dashboards, and user management.

## Requirements

- **Node.js:** 20 or later
	- This repo includes a `.nvmrc` so you can use `nvm` to consistently select a compatible Node version.
- **npm:** comes with Node (use a recent npm version that ships with Node 20+)

## Setup

### 1) Install Node 20+ (recommended: nvm)

If you have `nvm` installed:

```bash
nvm install
nvm use
node -v
```

You should see a version **>= 20**.

### 2) Install dependencies

```bash
npm ci
```

If you don't have a `package-lock.json` yet (or you're not using `npm ci`), you can use:

```bash
npm install
```

## Run

Start the development server:

```bash
npm start
```

Open http://localhost:3000

## Build

Create a production build:

```bash
npm run build
```

The output is generated into the `build/` directory.

## Test

```bash
npm test
```

## Environment variables

- This project supports CRA-style environment files (for example `.env.local`).
- Environment files are ignored by git (`.env*`) so secrets are not committed.

## Git hygiene (important)

- `node_modules/` and `build/` are **generated** and should not be committed to GitHub.
- This repo includes a `.gitignore` that excludes them.

## Troubleshooting

### Node version issues

- If you see errors during install/build, confirm your Node version is >= 20:

```bash
node -v
```

- With `nvm`, always run `nvm use` from the project root (where `.nvmrc` lives).

### Clean install

If dependencies get into a bad state:

```bash
rm -rf node_modules
npm ci
```

## About

This project was bootstrapped with Create React App.
CRA docs: https://create-react-app.dev/
