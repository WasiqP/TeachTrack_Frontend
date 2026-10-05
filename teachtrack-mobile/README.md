# TeachTrack API

REST API for the TeachTrack teacher app and public student forms.

- **Base URL (local):** `http://localhost:3000`
- **API prefix:** `/api/v1`
- **Auth:** `Authorization: Bearer <accessToken>` on every teacher route
- **Public:** `/api/v1/public/forms/:formId` and `GET /form/:formId` (no token)

The older Python FastAPI files under `app/` are unused scaffolding. **This Node API is v1.**

## Stack

Node.js 20+ · TypeScript · Express · Prisma · PostgreSQL · Zod · JWT (15m access + 30d refresh) · bcrypt

## Setup

1. Install Node 20+ and PostgreSQL 15+.
2. Create a database:

```sql
CREATE DATABASE teachtrack;
```

3. Copy env and edit `DATABASE_URL` / JWT secrets:

```bash
cp .env.example .env
```

4. Install, migrate, run:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Health check: `GET http://localhost:3000/health` → `{ "ok": true }`

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Watch mode |
| `npm run build` / `npm start` | Production |
| `npm run prisma:migrate` | Dev migrations |
| `npm run prisma:generate` | Prisma client |
| `npm run smoke` | Hits `/health` + register (OTP from server log) |

### Email / OTP

If `SMTP_HOST` is empty, **development logs the 6-digit OTP to the console**. Codes are random, hashed, expire (`OTP_EXPIRES_MINUTES`, default 10), and cannot be reused. Production requires SMTP.

## Product rules (frontend should match)

- Signup does **not** return tokens until OTP verify (`purpose: "signup"`).
- Reset OTP returns a short-lived `resetToken`, not a session. Then `POST /auth/reset-password`.
- Teacher A cannot read teacher B’s classes, forms, or grades (all queries filter `teacherId`).
- Deleting a **class** cascades students, attendance, announcements, activity, tasks, and grades for that class.
- Deleting a **student** deletes that student’s grade rows and attendance entries.
- Deleting a **form** deletes ClassTasks with that `formId` and their grades.
- New roster students automatically get **pending** grade rows for existing class tasks.
- Attendance `dateKey` is **`YYYY-MM-DD` as sent by the client** (treat as the teacher’s device-local calendar date, not converted to UTC midnight). `takenAt` is server ISO UTC.
- Public form JSON never includes `correctAnswers`, roster, or `teacherRemark` / `followUp`.
- After a student submit, matching grade rows stay **`pending`** until the teacher marks them.
- Share URL: `{STUDENT_FORM_BASE_URL}/{formId}` (local default `http://localhost:3000/form/<uuid>`). Also returned as `shareUrl` on form resources.
- Empty accounts are expected (no demo seed).
- Task/grade IDs are **server UUIDs**, not `form-{formId}-cls-{classId}`.

## Response shape

Success:

```json
{ "success": true, "data": { } }
```

Error:

```json
{
  "success": false,
  "error": { "code": "INVALID_OTP", "message": "That code is wrong or expired." }
}
```

| HTTP | Codes |
|------|--------|
| 400 | `VALIDATION_ERROR`, `INVALID_OTP` |
| 401 | `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `EMAIL_TAKEN`, `CONFLICT` |
| 429 | `RATE_LIMITED` |

Rate limits: auth/OTP 10 per 15 min per IP; OTP resend 1 per 50s per email+purpose; public submit 30 per 15 min per IP.

## Curl walkthrough

```bash
# health
curl -s http://localhost:3000/health

# register
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"Password123!"}'

# read OTP from the server log, then:
curl -s -X POST http://localhost:3000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","code":"123456","purpose":"signup"}'
```

Use `data.tokens.accessToken` as `TOKEN`:

```bash
# create class
curl -s -X POST http://localhost:3000/api/v1/classes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Mathematics 101","subject":"Mathematics","gradeLevel":"Grade 10","schedule":"Mon 9am","students":[{"name":"Alex Morgan","email":"alex@school.edu","rollNumber":"12"}]}'

# create form
curl -s -X POST http://localhost:3000/api/v1/forms \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Midterm quiz","iconId":"clipboard","answers":{"taskKind":"quiz","questions":[{"id":"q1","title":"2+2?","type":"shortText","required":true}]}}'

# assign (replace CLASS_ID and FORM_ID)
curl -s -X POST http://localhost:3000/api/v1/forms/FORM_ID/assign \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Midterm quiz","kind":"quiz","dueLabel":"Due today","targets":[{"classId":"CLASS_ID"}]}'

# public form
curl -s http://localhost:3000/api/v1/public/forms/FORM_ID
```

## Frontend contract

See **[FRONTEND_API.md](./FRONTEND_API.md)** for every endpoint, payload, and screen mapping.

## Production

- Set `NODE_ENV=production`, strong JWT secrets, real `DATABASE_URL`, SMTP, `APP_PUBLIC_URL`, `STUDENT_FORM_BASE_URL`.
- Terminate **HTTPS** at the reverse proxy / load balancer and set `CORS_ORIGINS` to the app origins.
- `GET /docs` is not included in v1 (optional later).
