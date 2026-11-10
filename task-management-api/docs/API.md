# API Documentation

Base URL: `http://localhost:300//api`

## Response format

Success:

```json
{ "success": true, "data": { } }
```

List responses also have `meta`:

```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "page": 1, "limit": 10, "total": 25, "totalPages": 3,
    "hasNext": true, "hasPrev": false,
    "links": { "next": "/api/tasks?page=2", "prev": null }
  }
}
```

Error:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ ] }
}
```

## Status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 400 | Validation error or invalid JSON |
| 401 | Missing, invalid or logged-out token |
| 403 | Resource belongs to another user |
| 404 | Not found |
| 409 | Email already registered |
| 500 | Server error |

## Authentication

Send the token from login/register in every protected request:

```
Authorization: Bearer <token>
```

### POST /auth/register

Body:

```json
{ "name": "Muhsin", "email": "muhsin@example.com", "password": "password123" }
```

Rules: name 2-100 chars, valid email, password 8-72 chars.
Returns `201` with `{ user, token }`. Password hash is never returned.
Errors: `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`.

### POST /auth/login

Body: `{ "email": "...", "password": "..." }`
Returns `200` with `{ user, token }`.
Wrong email or wrong password gives the same `401 INVALID_CREDENTIALS`.

### POST /auth/logout

Needs token. The token stops working after logout.

### GET /auth/me

Needs token. Returns the current user.

## Users

### GET /users

Returns `id`, `name`, `email` of all users (used to pick an assignee).

### GET /users/me

Returns own profile.

### PATCH /users/me

Send at least one of: `name`, `email`, `password`, `currentPassword`.
To change the password, `currentPassword` is required.

```json
{ "password": "newpassword1", "currentPassword": "password123" }
```

Errors: `400` (wrong current password or validation), `409 EMAIL_TAKEN`.

## Projects

A project can be used only by its owner (`403` for others).

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /projects | Create (`name`, optional `description`) |
| GET | /projects | List own projects |
| GET | /projects/:id | Get one |
| PATCH | /projects/:id | Update |
| DELETE | /projects/:id | Delete project and all its tasks |

List query: `page`, `limit`, `sortBy`, `order` (`asc` or `desc`).
Example: `GET /projects?limit=1&page=2&sortBy=name&order=asc`

## Tasks

### POST /tasks

```json
{
  "title": "Design homepage",
  "projectId": "<project-id>",
  "priority": "high",
  "assignedDate": "2026-11-09",
  "submissionDate": "2026-11-20",
  "dueDate": "2026-12-01"
}
```

Defaults: `status` = `todo`, `assigneeId` = `null`.
Priority: `low`, `medium`, `high`. Status: `todo`, `in_progress`, `done`.
`assignedDate`, `submissionDate`, and `dueDate` must be valid dates. Only the project owner can create tasks in it.

### GET /tasks

Returns tasks you own or are assigned to.

| Query | Description |
| --- | --- |
| status | `todo`, `in_progress`, `done` |
| priority | `low`, `medium`, `high` |
| dueBefore | tasks due before this date (`YYYY-MM-DD`) |
| dueAfter | tasks due after this date |
| sortBy | field to sort by (e.g. `dueDate`, `priority`, `title`) |
| order | `asc` or `desc` |
| page, limit | pagination |

Tasks without a due date always come last when sorting by `dueDate`.
Invalid `limit` or `sortBy` gives `400`.

### GET /tasks/:id
Owner or assignee only.

### PATCH /tasks/:id
Owner only. Body must have at least one field. `"dueDate": null` clears the date.

### PATCH /tasks/:id/status
Owner or assignee. Body: `{ "status": "in_progress" }`

### PATCH /tasks/:id/assign
Owner only. Body: `{ "assigneeId": "<user-id>" }`
Unknown user id gives `400`.

### DELETE /tasks/:id
Owner only.

## Reports

### GET /reports/tasks

Summary of your tasks:

```json
{
  "success": true,
  "data": {
    "totalTasks": 4,
    "byStatus": { "todo": 1, "in_progress": 2, "done": 1 },
    "completionRate": 25
  }
}
```

### GET /reports/tasks/export

Downloads the tasks as a JSON file (`tasks-export-<time>.json`).
A copy is also saved in the `exports` folder.