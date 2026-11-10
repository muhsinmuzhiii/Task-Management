# Task Management API

A REST API built with Node.js and Express for managing projects and tasks.
It has JWT authentication, task assignment, filtering, sorting, pagination and reports.
No database is used: data is stored in JSON files.

## Features

- Register, login, logout (JWT) and profile update
- Projects and tasks (create, read, update, delete)
- Tasks have status (`todo`, `in_progress`, `done`), priority (`low`, `medium`, `high`) and due date
- Assign a task to another user (the assignee can change only the status)
- Filter, sort and paginate lists
- Task summary report and JSON export
- Passwords hashed with bcrypt, safe concurrent writes to the JSON files
- 21 automated tests

## Tech stack

Node.js, Express, JSON Web Token, bcryptjs, Zod (validation), Node built-in test runner.

## Setup

1. Install the packages:

```bash
npm install
```

2. Copy `.env.example` to `.env` in the project root and set a secret:

```
PORT=3008
JWT_SECRET=your-secret-here
```

`JWT_SECRET` is required. `PORT` is optional (default is 3008).
Do not upload your real `.env` file to GitHub.

3. Start the server:

```bash
npm start        # normal
npm run dev      # auto-restart on changes
```

Open `http://localhost:3008` for the simple web page. The API is under `/api`.

## Run the tests

```bash
npm test
```

Tests use a temporary folder, so the real data files are never touched.
Test output: `docs/test-output.txt`

## Project structure

```
src/
  config/        environment settings
  controllers/   request handlers
  middleware/    auth, validation, error handling
  routes/        route definitions
  services/      business logic
  utils/         file store, pagination, helpers
  validators/    Zod schemas
  data/          JSON data files
public/          simple front-end (index.html)
tests/           automated tests
docs/            API docs and test evidence
exports/         exported report files
```

## API overview

All routes except register and login need this header:
`Authorization: Bearer <token>`

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, get token |
| POST | /api/auth/logout | Logout (token revoked) |
| GET | /api/auth/me | Current user |
| GET | /api/users | List users (id, name, email) |
| GET | /api/users/me | Own profile |
| PATCH | /api/users/me | Update name, email or password |
| POST | /api/projects | Create project |
| GET | /api/projects | List own projects |
| GET | /api/projects/:id | Get project |
| PATCH | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project and its tasks |
| POST | /api/tasks | Create task |
| GET | /api/tasks | List tasks (filter, sort, paginate) |
| GET | /api/tasks/:id | Get task |
| PATCH | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/status | Change status |
| PATCH | /api/tasks/:id/assign | Assign to a user |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/reports/tasks | Task summary report |
| GET | /api/reports/tasks/export | Download report as JSON file |

Full details with examples: [docs/API.md](docs/API.md)

## Author

Muhammed Muhsin P