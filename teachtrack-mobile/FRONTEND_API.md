# TeachTrack — frontend integration guide

Give this file to the mobile / web team. The API is live against **`/api/v1`**.

Configure:

```
API_BASE_URL=http://localhost:8000
STUDENT_FORM_BASE_URL=http://localhost:8000/form
```

Run the API with FastAPI:

```powershell
.\venv\Scripts\Activate.ps1
alembic upgrade head
uvicorn main:app --reload
```

Production: replace with HTTPS host. All JSON unless noted. Dates in responses are **ISO 8601 UTC** strings (or `null`).

---

## Envelope

Every API JSON body (except `GET /health` and HTML `GET /form/:formId`):

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

Teacher routes: header `Authorization: Bearer <accessToken>`.

Access token TTL **15 minutes**. Persist `refreshToken` and call refresh on 401 `UNAUTHORIZED`.

---

## Auth

| Screen | Method | Path | Body |
|--------|--------|------|------|
| Sign up | `POST` | `/api/v1/auth/register` | `{ name, email, password }` |
| Verify OTP | `POST` | `/api/v1/auth/otp/verify` | `{ email, code, purpose: "signup" \| "reset" }` |
| Resend OTP | `POST` | `/api/v1/auth/otp/resend` | `{ email, purpose }` |
| Log in | `POST` | `/api/v1/auth/login` | `{ email, password }` |
| Forgot | `POST` | `/api/v1/auth/forgot-password` | `{ email }` |
| New password | `POST` | `/api/v1/auth/reset-password` | `{ resetToken, password }` |
| Session | `POST` | `/api/v1/auth/refresh` | `{ refreshToken }` |
| Log out | `POST` | `/api/v1/auth/logout` | optional `{ refreshToken }` + Bearer |

**Register `data`:** `{ email, otpSent: true }` — **no tokens**. Then OTP screen.

**Verify signup `data`:** `{ user, tokens: { accessToken, refreshToken } }`

**Verify reset `data`:** `{ resetToken }` — not a session.

**Login `data`:** `{ user, tokens }`  
Unverified email → `401 EMAIL_NOT_VERIFIED` (send user to OTP `purpose: "signup"`).  
Wrong password → `401 INVALID_CREDENTIALS`.  
Duplicate verified email → `409 EMAIL_TAKEN`.

**User object** (matches profile fields; photo is `avatarUri`):

```json
{
  "id": "uuid",
  "email": "a@b.com",
  "displayName": "Ada Lovelace",
  "avatarUri": null,
  "phone": "",
  "country": "",
  "city": "",
  "address": "",
  "institutionName": "",
  "professionalTitle": "",
  "subjectsTeach": ""
}
```

Social login is **not** implemented.

---

## Me / settings / avatar

| Screen | Method | Path |
|--------|--------|------|
| Profile + settings | `GET` | `/api/v1/me` |
| Edit profile | `PATCH` | `/api/v1/me` |
| Notification + language | `PATCH` | `/api/v1/me/settings` |
| Photo | `POST` | `/api/v1/me/avatar` multipart field **`file`** (jpeg/png/webp, max 5MB) |

`GET /me` → `{ user, settings }`

```json
{
  "settings": {
    "notifications": {
      "taskReminders": true,
      "gradeUpdates": true,
      "classAnnouncements": true
    },
    "language": "en"
  }
}
```

`PATCH /me` any subset of: `displayName`, `phone`, `country`, `city`, `address`, `institutionName`, `professionalTitle`, `subjectsTeach`. Email is **not** changeable in v1.

`PATCH /me/settings`: `{ language?: "en"|"es"|"fr", notifications?: { taskReminders?, gradeUpdates?, classAnnouncements? } }`

Avatar `data`: `{ avatarUri, user }` — `avatarUri` is an `http(s)` URL, never `file://`.

---

## Classes & roster

| Screen | Method | Path |
|--------|--------|------|
| Home / My Classes | `GET` | `/api/v1/classes` |
| Create class | `POST` | `/api/v1/classes` |
| Class details | `GET` | `/api/v1/classes/:classId` |
| Edit class / reminder | `PATCH` | `/api/v1/classes/:classId` |
| Delete class | `DELETE` | `/api/v1/classes/:classId` |
| Reminder only | `GET`/`PATCH` | `/api/v1/classes/:classId/reminder` |
| Add student | `POST` | `/api/v1/classes/:classId/students` |
| Edit student | `PATCH` | `/api/v1/classes/:classId/students/:studentId` |
| Delete student | `DELETE` | `/api/v1/classes/:classId/students/:studentId` |
| Import | `POST` | `/api/v1/classes/:classId/students/import` |
| Assign rolls | `POST` | `/api/v1/classes/:classId/students/assign-rolls` |
| Announcement | `POST` | `/api/v1/classes/:classId/announcements` |
| Save attendance | `PUT` | `/api/v1/classes/:classId/attendance/:dateKey` |
| Attendance history | `GET` | `/api/v1/classes/:classId/attendance` |

**Create body:**

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

`schoolType`: `School` | `College` | `University` | `Others`. `students` optional.

**Class resource** (list omits `attendanceHistory`; detail includes it):

```json
{
  "id": "uuid",
  "name": "Mathematics 101",
  "subject": "Mathematics",
  "gradeLevel": "Grade 10",
  "studentCount": 3,
  "schedule": "...",
  "roomNumber": "Room 205",
  "schoolName": "Westside Academy",
  "schoolType": "School",
  "createdAt": "ISO",
  "reminder": { "enabled": false, "hour": 8, "minute": 0, "weekdays": [1, 2, 3, 4, 5] },
  "students": [],
  "announcements": [],
  "activityLog": [],
  "attendanceHistory": []
}
```

Student: `id`, `name`, `rollNumber`, `email`, `teacherRemark`, `teacherRemarkUpdatedAt`, `followUp`.  
`rollNumber` max 16. Sending `teacherRemark` on PATCH sets `teacherRemarkUpdatedAt` to now.

Import: `{ "students": [{ "name", "email?", "rollNumber?" }] }` → `{ created, students }`. Empty names skipped. Parse CSV on device (`Name` / `Name, email` / `Name, email, roll`) then POST this JSON.

Assign rolls: `{ "assignments": [{ "studentId", "rollNumber" }] }`.

Attendance `dateKey` = `YYYY-MM-DD` **from the device calendar**. PUT body:

```json
{ "entries": [{ "studentId": "uuid", "status": "present" }] }
```

`status`: `present` | `absent` | `late`. Latest PUT for that day wins. Writes activity `Attendance marked`.

Announcement: `{ "body": "..." }` also appends activity `Posted an announcement`.

Weekdays: ISO 1 = Monday … 7 = Sunday.

---

## Forms (task builder)

| Screen | Method | Path |
|--------|--------|------|
| List | `GET` | `/api/v1/forms` |
| Create | `POST` | `/api/v1/forms` |
| Edit | `GET`/`PATCH` | `/api/v1/forms/:formId` |
| Delete | `DELETE` | `/api/v1/forms/:formId` |
| Share → gradebook | `POST` | `/api/v1/forms/:formId/assign` |
| Question image/audio | `POST` | `/api/v1/uploads/question-media` field `file` |

Create/PATCH: `{ name, iconId?, answers }`  
`iconId`: `clipboard` | `star` | `message` | `chart` | `target` | `trophy`  
`answers` is **opaque JSON** (keep the builder document as-is, including `questions[]` order).

Form `data` includes `shareUrl` (use this instead of hardcoded `pulsebox.app`).

Question media `data`: `{ url, kind: "image" | "audio" }` — store in `answers.questions[].imageUrl` / `audioUrl`.

**Assign:**

```json
{
  "title": "Midterm quiz",
  "kind": "quiz",
  "dueLabel": "Due today",
  "dueAt": "2026-10-05T23:59:59.999Z",
  "targets": [{ "classId": "uuid", "studentIds": ["uuid"] }]
}
```

`kind`: `quiz` | `assignment` | `project` | `test`.  
If `studentIds` omitted, pending grades are created for the **full roster**. IDs are **server UUIDs** (do not synthesize `form-{id}-cls-{id}`).

---

## Gradebook

| Screen | Method | Path |
|--------|--------|------|
| View grades | `GET` | `/api/v1/tasks?classId=` or `/api/v1/classes/:classId/tasks` |
| Same + grades | `GET` | `/api/v1/grades?classId=` |
| One task report | `GET` | `/api/v1/classes/:classId/tasks/:taskId` |
| Update mark | `PATCH` | `/api/v1/grades/:gradeId` |

Task: `{ id, classId, title, kind, dueLabel, dueAt, createdAt, formId }`  
Grade: `{ id, classId, taskId, studentId, grade, status }`  
`status`: `graded` | `pending` | `missing`. Display `grade` is a **string** (`"92%"`, `"A−"`, `"—"`).

PATCH grade: `{ "grade": "92%", "status": "graded" }`.

---

## Student web form (no Bearer)

Share / QR: **`{STUDENT_FORM_BASE_URL}/{formId}`**  
Example local: `http://localhost:8000/form/<uuid>` (HTML page included).

RN static viewer: point `API_ENDPOINT` at:

- `GET /api/v1/public/forms/:formId` → `{ id, name, questions }`  
  (`correctAnswers` stripped; no remarks)
- `POST /api/v1/public/forms/:formId/submit`

```json
{
  "answers": { "questionId": "value" },
  "studentEmail": "optional",
  "studentId": "optional",
  "submittedAt": "optional ISO"
}
```

If `studentId` or matching `studentEmail` on a class assigned this form is found, that student’s grade row stays **`pending`** (teacher still marks).

---

## Suggested client helpers

```ts
async function api(path: string, opts: RequestInit & { token?: string } = {}) {
  const headers: Record<string, string> = {
    ...(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
  };
  const res = await fetch(`${API_BASE_URL}${path}`, { ...opts, headers: { ...headers, ...(opts.headers as object) } });
  if (path === "/health") return res.json();
  const json = await res.json();
  if (!json.success) throw Object.assign(new Error(json.error.message), { code: json.error.code, status: res.status });
  return json.data;
}
```

On `401 UNAUTHORIZED`, `POST /api/v1/auth/refresh` then retry once; if refresh fails, go to Login.

Store after login/verify: `user`, `accessToken`, `refreshToken`.

---

## Not in v1 (keep device-only or stub)

Google/Facebook, AI lesson planner, FCM push, server PDF, theme sync, offline `GET /sync`, one-shot AsyncStorage migration.

First real login starts with **empty** classes/forms unless you add a later import endpoint.
