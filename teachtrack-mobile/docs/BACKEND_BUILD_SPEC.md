# TeachTrack API — build this backend from scratch

**Give this file to Cursor in the backend project folder.**  
It is an implementation spec, not a status checklist. Build everything in **v1 Required**. Do not stop at scaffolds, TODOs, or empty handlers.

**Product:** TeachTrack (teacher mobile app + public student form).  
**Frontend today:** no live API. Auth is fake. Data is AsyncStorage.  
**Your job:** a complete, runnable API the mobile app can switch onto.

---

## Cursor instructions (read first)

You are implementing **TeachTrack Backend v1** in the current folder.

1. Follow this document. Do not invent extra products (parents, schools admin, AI chat).
2. Use the **locked stack** in §1. Do not switch to Django/Firebase/Supabase unless this folder already has a different stack in production.
3. Implement **all Required endpoints** with real validation, auth, and database writes.
4. After each domain (auth, classes, forms, grades, public forms), add a smoke-test script or HTTP examples in `README.md`.
5. Empty accounts are OK (no seed of fake classes).
6. **Do not** claim complete if OTP is hardcoded, if any handler is a stub, or if teacher A can read teacher B’s data.
7. When done, print: how to run Postgres, migrate, start the server, and a curl login → create class → create form → assign → public GET form.

**v1 out of scope (skip):** Google/Facebook login, AI lesson generation, FCM push, server-side PDF, parent apps, GraphQL.

---

## 1. Locked stack

| Piece | Choice |
|-------|--------|
| Runtime | Node.js 20+ |
| Language | TypeScript (strict) |
| HTTP | Express 4 |
| Validation | Zod |
| ORM | Prisma |
| DB | PostgreSQL 15+ |
| Auth | bcrypt password + JWT access (15m) + JWT refresh (30d, stored hashed in DB) |
| Email | Nodemailer. If `SMTP_*` missing, **log OTP to console** in development only |
| Files | Local `uploads/` in dev; store public URL path `/uploads/...` |
| API style | REST, JSON, prefix `/api/v1` |

**Scripts:** `dev`, `build`, `start`, `prisma:migrate`, `prisma:generate`.

**Env (`.env.example`):**

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://teachtrack:teachtrack@localhost:5432/teachtrack
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
APP_PUBLIC_URL=http://localhost:3000
STUDENT_FORM_BASE_URL=http://localhost:3000/form
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=TeachTrack <noreply@localhost>
OTP_EXPIRES_MINUTES=10
OTP_LENGTH=6
```

Public student form URL the teacher app will share:

`{STUDENT_FORM_BASE_URL}/{formId}`  
Example: `http://localhost:3000/form/<uuid>`

(Optionally also `?formId=` for the existing static viewer.)

---

## 2. Target folder layout

```
src/
  index.ts                 # listen
  app.ts                   # express, cors, json, uploads static
  config/env.ts
  lib/prisma.ts
  lib/errors.ts            # AppError + error middleware
  lib/asyncHandler.ts
  middleware/auth.ts       # Bearer access JWT → req.userId
  middleware/validate.ts   # zod
  modules/auth/
  modules/users/
  modules/settings/
  modules/classes/
  modules/students/
  modules/attendance/
  modules/announcements/
  modules/forms/
  modules/grades/
  modules/publicForms/
  modules/uploads/
prisma/schema.prisma
uploads/.gitkeep
README.md
```

CORS: allow all origins in development; configurable later.

---

## 3. Error and success shape (use everywhere)

Success:

```json
{ "success": true, "data": { } }
```

Error (4xx/5xx):

```json
{
  "success": false,
  "error": { "code": "INVALID_OTP", "message": "That code is wrong or expired." }
}
```

| HTTP | `code` examples |
|------|-----------------|
| 400 | `VALIDATION_ERROR`, `INVALID_OTP`, `PASSWORD_MISMATCH` |
| 401 | `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `EMAIL_TAKEN`, `CONFLICT` |
| 429 | `RATE_LIMITED` |

Every teacher route except auth + public forms: `Authorization: Bearer <accessToken>`.  
Every query **must** filter `teacherId = req.userId`.

---

## 4. Prisma schema (implement this model)

Use UUID `@default(uuid())` for all ids. `Json` for form `answers`. Timestamps `DateTime @default(now())`.

```prisma
enum OtpPurpose { SIGNUP RESET }
enum SchoolType { School College University Others }
enum AttendanceStatus { present absent late }
enum ActivityKind { announcement attendance task_assigned }
enum TaskKind { quiz assignment project test }
enum GradeStatus { graded pending missing }
enum AppLanguage { en es fr }

model Teacher {
  id                 String   @id @default(uuid())
  email              String   @unique
  passwordHash       String
  emailVerifiedAt    DateTime?
  displayName        String   @default("")
  avatarUrl          String?
  phone              String   @default("")
  country            String   @default("")
  city               String   @default("")
  address            String   @default("")
  institutionName    String   @default("")
  professionalTitle  String   @default("")
  subjectsTeach      String   @default("")
  notifyTaskReminders      Boolean @default(true)
  notifyGradeUpdates       Boolean @default(true)
  notifyClassAnnouncements Boolean @default(true)
  language           AppLanguage @default(en)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  refreshTokens      RefreshToken[]
  otps               OtpCode[]
  classes            Class[]
  forms              Form[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  teacherId String
  teacher   Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  tokenHash String
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model OtpCode {
  id        String     @id @default(uuid())
  teacherId String?
  teacher   Teacher?   @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  email     String
  purpose   OtpPurpose
  codeHash  String
  expiresAt DateTime
  consumedAt DateTime?
  createdAt DateTime @default(now())
  @@index([email, purpose])
}

model Class {
  id           String      @id @default(uuid())
  teacherId    String
  teacher      Teacher     @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  name         String
  subject      String
  gradeLevel   String
  schedule     String      @default("")
  roomNumber   String?
  schoolName   String?
  schoolType   SchoolType?
  reminderEnabled  Boolean @default(false)
  reminderHour     Int     @default(8)
  reminderMinute   Int     @default(0)
  reminderWeekdays Int[]   @default([1, 2, 3, 4, 5])
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  students     Student[]
  announcements Announcement[]
  activityLog  ActivityItem[]
  attendanceDays AttendanceDay[]
  tasks        ClassTask[]
}

model Student {
  id                     String    @id @default(uuid())
  classId                String
  class                  Class     @relation(fields: [classId], references: [id], onDelete: Cascade)
  name                   String
  rollNumber             String?
  email                  String?
  teacherRemark          String?
  teacherRemarkUpdatedAt DateTime?
  followUp               Boolean   @default(false)
  createdAt              DateTime  @default(now())
  grades                 TaskGrade[]
  attendanceEntries      AttendanceEntry[]
}

model Announcement {
  id        String   @id @default(uuid())
  classId   String
  class     Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  body      String
  createdAt DateTime @default(now())
}

model ActivityItem {
  id        String       @id @default(uuid())
  classId   String
  class     Class        @relation(fields: [classId], references: [id], onDelete: Cascade)
  kind      ActivityKind
  headline  String
  detail    String?
  createdAt DateTime     @default(now())
}

model AttendanceDay {
  id        String   @id @default(uuid())
  classId   String
  class     Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  dateKey   String   // YYYY-MM-DD
  takenAt   DateTime
  entries   AttendanceEntry[]
  @@unique([classId, dateKey])
}

model AttendanceEntry {
  id               String           @id @default(uuid())
  attendanceDayId  String
  day              AttendanceDay    @relation(fields: [attendanceDayId], references: [id], onDelete: Cascade)
  studentId        String
  student          Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  status           AttendanceStatus
  @@unique([attendanceDayId, studentId])
}

model Form {
  id        String   @id @default(uuid())
  teacherId String
  teacher   Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  name      String
  iconId    String   @default("clipboard")
  answers   Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tasks     ClassTask[]
}

model ClassTask {
  id        String    @id @default(uuid())
  teacherId String
  classId   String
  class     Class     @relation(fields: [classId], references: [id], onDelete: Cascade)
  formId    String?
  form      Form?     @relation(fields: [formId], references: [id], onDelete: SetNull)
  title     String
  kind      TaskKind
  dueLabel  String?
  dueAt     DateTime?
  createdAt DateTime  @default(now())
  grades    TaskGrade[]
  @@unique([formId, classId])
}

model TaskGrade {
  id        String      @id @default(uuid())
  classId   String
  taskId    String
  task      ClassTask   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  studentId String
  student   Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  grade     String      @default("—")
  status    GradeStatus @default(pending)
  @@unique([taskId, studentId])
}

model FormSubmission {
  id          String   @id @default(uuid())
  formId      String
  studentId   String?
  answers     Json
  submittedAt DateTime @default(now())
}
```

**Class JSON for the app:** include `studentCount: students.length`, nested `students`, `announcements` (newest first), `activityLog` (newest first), `attendanceHistory` (map days + entries), `reminder: { enabled, hour, minute, weekdays }`.

ISO strings in JSON (`createdAt`, `dueAt`, `takenAt`, `teacherRemarkUpdatedAt`).

---

## 5. Auth flows (match the mobile screens)

### Sign up (`SignUp.tsx`)

App collects: `name`, `email`, `password`, `confirm`. Then navigates to VerifyOtp `{ email, purpose: 'signup', name }`.

1. `POST /api/v1/auth/register`  
   Body: `{ "name": string, "email": string, "password": string }`  
   - 409 if email exists **and verified**  
   - If email exists **unverified**, rotate OTP and resend (do not leak “already exists” if you prefer a generic message — still send OTP)  
   - Hash password (bcrypt 12), create Teacher `emailVerifiedAt = null`, `displayName = name`  
   - Create OTP purpose `SIGNUP`, email it (or console.log in dev)  
   - **Do not** return tokens yet  
   Response `data`: `{ "email": "...", "otpSent": true }`

2. `POST /api/v1/auth/otp/verify`  
   Body: `{ "email": string, "code": string, "purpose": "signup" | "reset" }`  
   - Code must be 6 digits, not consumed, not expired  
   - On `signup`: set `emailVerifiedAt`, consume OTP, issue tokens  
   Response `data`: `{ "user": <public teacher>, "tokens": { "accessToken", "refreshToken" } }`  
   - On `reset`: consume OTP, return short-lived `resetToken` (JWT 15m, purpose reset) **not** full session  
   Response: `{ "resetToken": string }`

3. `POST /api/v1/auth/otp/resend`  
   Body: `{ "email": string, "purpose": "signup" | "reset" }`  
   Rate limit: 1 per 50s per email+purpose. Always 200 with `{ otpSent: true }` to avoid email enumeration in production; in development log the code.

### Login (`Login.tsx`)

`POST /api/v1/auth/login` `{ email, password }`  
- 401 invalid  
- 401 `EMAIL_NOT_VERIFIED` if not verified (app can send them to OTP)  
- Return `{ user, tokens }`

### Forgot password (`ForgotPassword.tsx` → VerifyOtp purpose `reset`)

1. `POST /api/v1/auth/forgot-password` `{ email }` — if teacher exists, send RESET OTP. Always generic success.  
2. Verify OTP purpose `reset` → `resetToken`  
3. `POST /api/v1/auth/reset-password` `{ "resetToken", "password" }` — set password, revoke all refresh tokens.

### Session

- `POST /api/v1/auth/refresh` `{ refreshToken }` → new access (and optionally rotate refresh)  
- `POST /api/v1/auth/logout` Bearer + optional `{ refreshToken }` → delete refresh row(s)

### Public teacher object (`user`)

```json
{
  "id": "uuid",
  "email": "a@b.com",
  "displayName": "Ada Lovelace",
  "avatarUri": "https://... or null",
  "phone": "",
  "country": "",
  "city": "",
  "address": "",
  "institutionName": "",
  "professionalTitle": "",
  "subjectsTeach": ""
}
```

Note: JSON field name **`avatarUri`** to match the app (`UserProfile.avatarUri`), even if DB column is `avatarUrl`.

---

## 6. Profile and settings

`GET /api/v1/me` → `{ user, settings }`

`settings`:

```json
{
  "notifications": {
    "taskReminders": true,
    "gradeUpdates": true,
    "classAnnouncements": true
  },
  "language": "en"
}
```

`PATCH /api/v1/me` body: any subset of profile fields (not password).

`PATCH /api/v1/me/settings` body: subset of notifications + `language`: `en|es|fr`.

`POST /api/v1/me/avatar` `multipart/form-data` field `file` (jpeg/png/webp, max 5MB) → `{ avatarUri: "<APP_PUBLIC_URL>/uploads/..." }`.

---

## 7. Classes

`GET /api/v1/classes` → `{ classes: ClassResource[] }` newest first.

`POST /api/v1/classes`

```json
{
  "name": "Mathematics 101",
  "subject": "Mathematics",
  "gradeLevel": "Grade 10",
  "schedule": "Mon, Wed, Fri - 9:00 AM",
  "roomNumber": "Room 205",
  "schoolName": "Westside Academy",
  "schoolType": "School",
  "students": [{ "name": "Alex Morgan", "email": "a@x.com", "rollNumber": "12" }]
}
```

`schoolType` enum as specified. `students` optional.

`GET /api/v1/classes/:classId`  
`PATCH /api/v1/classes/:classId` metadata + `reminder`  
`DELETE /api/v1/classes/:classId` cascade students, attendance, announcements, activity, tasks/grades for that class.

**Reminder PATCH** (or included in class PATCH):

```json
{ "reminder": { "enabled": true, "hour": 8, "minute": 0, "weekdays": [1,2,3,4,5] } }
```

Hour 0–23, minute 0–59, weekdays 1–7 unique.

### Students

`POST /api/v1/classes/:classId/students` `{ name, email?, rollNumber? }`  
`PATCH /api/v1/classes/:classId/students/:studentId` `{ name?, email?, rollNumber?, teacherRemark?, followUp? }`  
- If `teacherRemark` sent, set `teacherRemarkUpdatedAt` now.  
- `rollNumber` max 16 chars.

`DELETE /api/v1/classes/:classId/students/:studentId`  
Also delete that student’s grade rows and attendance entries. Recalc nothing else required.

`POST /api/v1/classes/:classId/students/import`

```json
{ "students": [{ "name": "A", "email": "a@x.com", "rollNumber": "1" }] }
```

Skip empty names. Return `{ created: number, students: StudentResource[] }`.

`POST /api/v1/classes/:classId/students/assign-rolls`

```json
{ "assignments": [{ "studentId": "uuid", "rollNumber": "01" }] }
```

### Announcements

`POST /api/v1/classes/:classId/announcements` `{ "body": string }`  
Creates announcement **and** activity `{ kind: "announcement", headline: "Posted an announcement", detail: body }`.

### Attendance

`PUT /api/v1/classes/:classId/attendance/:dateKey`

`dateKey` = `YYYY-MM-DD`.

```json
{
  "entries": [
    { "studentId": "uuid", "status": "present" },
    { "studentId": "uuid", "status": "late" }
  ]
}
```

Upsert the day (unique classId+dateKey). Replace entries. `takenAt` = now.  
Activity: `kind: attendance`, headline `Attendance marked`, detail e.g. `3 present · 1 late · 0 absent`.

`GET /api/v1/classes/:classId/attendance` → history newest first (for PDFs).

---

## 8. Forms (teacher)

`iconId` allowlist: `clipboard | star | message | chart | target | trophy` (default `clipboard`).

`POST /api/v1/forms`

```json
{
  "name": "Midterm quiz",
  "iconId": "clipboard",
  "answers": { }
}
```

`answers` is **opaque JSON**. Persist as given. Typical shape from the app:

```json
{
  "taskKind": "quiz",
  "assessmentType": "quiz",
  "classId": "uuid-or-all",
  "className": "Mathematics 101",
  "focusTopic": "Fractions",
  "duePreset": "today | tomorrow | week | two_weeks",
  "questionFormats": ["shortText"],
  "questions": [
    {
      "id": "string",
      "title": "Question text",
      "type": "shortText",
      "required": true,
      "placeholder": "",
      "description": "",
      "maxLength": 200,
      "options": ["A", "B"],
      "correctAnswers": [0],
      "imageUrl": null,
      "audioUrl": null,
      "maxRating": 5,
      "min": 0,
      "max": 10,
      "step": 1,
      "dateFormat": "MM/DD/YYYY",
      "minDate": null,
      "maxDate": null
    }
  ]
}
```

`taskKind` / question `type` enums as in the JSON. Validate lightly: `answers` must be an object; `name` required.

`GET /api/v1/forms`  
`GET /api/v1/forms/:formId`  
`PATCH /api/v1/forms/:formId` `{ name?, iconId?, answers? }`  
`DELETE /api/v1/forms/:formId`  
Delete form. **Delete ClassTasks with this formId and their grades** (matches `removeTasksForForm`).

Optional: `POST /api/v1/uploads/question-media` for `imageUrl`/`audioUrl`.

---

## 9. Assign to classes + gradebook

`POST /api/v1/forms/:formId/assign`

```json
{
  "title": "Midterm quiz",
  "kind": "quiz",
  "dueLabel": "Due today",
  "dueAt": "2026-10-05T23:59:59.999Z",
  "targets": [
    { "classId": "uuid", "studentIds": ["uuid", "uuid"] }
  ]
}
```

For each target (class must belong to teacher):

- Upsert `ClassTask` unique `(formId, classId)` with title/kind/due/formId.  
- For each `studentId` on that class roster: create `TaskGrade` if missing (`grade: "—"`, `status: pending`).  
- Activity on class: `kind: task_assigned`, headline `Task assigned: {title}` (or `Assigned: {title}`).

Return `{ tasks: ClassTaskResource[], gradesCreated: number }`.

`GET /api/v1/tasks?classId=` all tasks for that class.  
`GET /api/v1/classes/:classId/tasks` same.  
`GET /api/v1/classes/:classId/tasks/:taskId` task + grades + student names/rolls.

`PATCH /api/v1/grades/:gradeId` `{ "grade": "92%", "status": "graded" }`  
Teacher must own the class.

`GET /api/v1/grades?classId=` optional bulk for View Grades screen.

**Task resource:**

```json
{
  "id": "uuid",
  "classId": "uuid",
  "title": "Midterm quiz",
  "kind": "quiz",
  "dueLabel": "Due today",
  "dueAt": "ISO or null",
  "createdAt": "ISO",
  "formId": "uuid or null"
}
```

**Grade resource:**

```json
{
  "id": "uuid",
  "classId": "uuid",
  "taskId": "uuid",
  "studentId": "uuid",
  "grade": "—",
  "status": "pending"
}
```

---

## 10. Public student form

No Bearer token.

`GET /api/v1/public/forms/:formId`

Return **safe** payload only:

```json
{
  "id": "uuid",
  "name": "Midterm quiz",
  "questions": [ /* from answers.questions */ ]
}
```

Never include `correctAnswers`, teacher email, roster, remarks.

`POST /api/v1/public/forms/:formId/submit`

```json
{
  "answers": { "questionId": "value" },
  "studentEmail": "optional",
  "studentId": "optional"
}
```

Store `FormSubmission`. If `studentId` matches a grade row for a task with this `formId`, set that grade `status` to `pending` (teacher still marks) **or** `graded` with a placeholder — **use `pending`** unless you auto-score MCQ later.

Also serve a minimal HTML page `GET /form/:formId` that loads questions (or document that the RN `web/` viewer should point `API_ENDPOINT` at `/api/v1/public/forms`).

---

## 11. Class resource (wire this exact shape)

The Home / My Classes / Class Details screens expect something equivalent to:

```json
{
  "id": "uuid",
  "name": "Mathematics 101",
  "subject": "Mathematics",
  "gradeLevel": "Grade 10",
  "studentCount": 3,
  "schedule": "Mon, Wed, Fri - 9:00 AM",
  "roomNumber": "Room 205",
  "schoolName": "Westside Academy",
  "schoolType": "School",
  "createdAt": "ISO",
  "reminder": { "enabled": false, "hour": 8, "minute": 0, "weekdays": [1, 2, 3, 4, 5] },
  "students": [
    {
      "id": "uuid",
      "name": "Alex Morgan",
      "rollNumber": "12",
      "email": "alex.m@school.edu",
      "teacherRemark": null,
      "teacherRemarkUpdatedAt": null,
      "followUp": false
    }
  ],
  "announcements": [{ "id": "uuid", "body": "...", "createdAt": "ISO" }],
  "activityLog": [
    { "id": "uuid", "kind": "announcement", "headline": "...", "detail": "...", "createdAt": "ISO" }
  ],
  "attendanceHistory": [
    {
      "id": "uuid",
      "dateKey": "2026-10-05",
      "takenAt": "ISO",
      "entries": [{ "studentId": "uuid", "status": "present" }]
    }
  ]
}
```

List endpoint may omit huge `attendanceHistory` if needed, but **detail GET must include it**. List should still include `students` (or at least `studentCount` + names) for Home cards.

---

## 12. Rate limits

- Auth login / register / OTP: 10 / 15 min / IP  
- OTP resend: 1 / 50s / email+purpose  
- Public submit: 30 / 15 min / IP  

Use `express-rate-limit` or equivalent.

---

## 13. Build order (do in this sequence)

1. Project init, env, Prisma, health `GET /health` → `{ ok: true }`  
2. Auth module (register, OTP, login, refresh, logout, forgot, reset) + console OTP in dev  
3. `me` + settings + avatar  
4. Classes CRUD + students + import + rolls  
5. Announcements + activity  
6. Attendance upsert + history  
7. Class reminder fields  
8. Forms CRUD + delete cascade  
9. Assign + tasks + grades PATCH  
10. Public GET/POST form + `/form/:id`  
11. README with curl walkthrough  
12. Confirm teacher isolation with two users in a short test script `scripts/smoke.ts`

---

## 14. Definition of done

The backend is done when **all** of the following are true:

- [ ] `npm run dev` starts and `/health` works  
- [ ] Signup OTP is random, stored hashed, expires, not “any 6 digits”  
- [ ] Login returns JWTs; invalid password is 401  
- [ ] Two teachers cannot see each other’s classes  
- [ ] Full path works: register → verify → login → create class → add students → mark attendance → create form → assign → list tasks/grades → public GET form → submit  
- [ ] Delete form removes its tasks/grades  
- [ ] `teacherRemark` is not on public form JSON  
- [ ] README documents env, migrate, run, example curl  

**Not done:** “routes exist but return hardcoded arrays.”

---

## 15. README curl walkthrough (include this, filled with real sample IDs after smoke)

```bash
# health
curl -s localhost:3000/health

# register
curl -s -X POST localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"Password123!"}'

# (read OTP from server log in dev)
curl -s -X POST localhost:3000/api/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","code":"123456","purpose":"signup"}'

# then login / use accessToken on:
# POST /api/v1/classes
# POST /api/v1/forms
# POST /api/v1/forms/:id/assign
# GET  /api/v1/public/forms/:id
```

---

## 16. What the frontend will send later

The mobile app is **not wired yet**. Design the API as specified so a later client can map 1:1:

| Screen | Calls |
|--------|--------|
| SignUp | `POST /auth/register` then OTP |
| VerifyOtp | `POST /auth/otp/verify` (+ resend) |
| Login | `POST /auth/login` |
| ForgotPassword | `POST /auth/forgot-password` |
| Home / My Classes | `GET /classes` |
| CreateClass | `POST /classes` |
| ViewStudents | student CRUD/import |
| Attendance | `PUT .../attendance/:dateKey` |
| Home megaphone | `POST .../announcements` |
| Create/Edit form | forms CRUD |
| ShareTask | `POST /forms/:id/assign` |
| View Grades | `GET /tasks?classId=` + grades |
| Profile | `GET/PATCH /me`, avatar |
| Settings | `PATCH /me/settings` |
| Logout | `POST /auth/logout` |

Do not wait for the app to be wired. Ship a complete API.

---

## 17. Optional later (do not build in v1)

- Google/Facebook OAuth  
- `POST /lesson-plans/generate` (AI)  
- Push notifications  
- HTML-to-PDF on server  
- Multi-school admin  
- Auto-score quizzes from `correctAnswers`

If you finish v1 early, add OpenAPI (`/docs` with swagger) — optional polish only.
