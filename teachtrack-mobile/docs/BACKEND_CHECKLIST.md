# TeachTrack — Backend completeness checklist

**Audience:** Backend team  
**Product:** TeachTrack teacher app (React Native) + student web form viewer  
**Date:** 2026-10-05  
**Frontend status:** The mobile app **does not call a production API**. Auth is demo-only. Classes, roster, attendance, forms, tasks, grades, profile, and settings live in **device AsyncStorage**. Use this list to mark what the backend already covers and what is still missing.

**How to fill this in**

- `[ ]` not done  
- `[x]` done and verified against the criteria  
- `[~]` partial (write a one-line note)  
- `[n/a]` out of scope for this release  

Mark a section **Complete** only if every **Required** row is `[x]`.

Related schema notes: `teachtrack-mobile/docs/BACKEND_SPEC.md` (types match the app).

---

## 0. Snapshot of the frontend today

| Area | What the app does now |
|------|------------------------|
| Login / Sign up / Forgot password / OTP | Screens exist. OTP accepts **any 6-digit code**. No tokens. |
| Social login (G / f) | Buttons exist. **Not wired.** |
| Classes, students, attendance, announcements | Local JSON (`classes`) |
| Forms / quizzes / assignments | Local JSON (`forms`) |
| Gradebook tasks + rows | Local JSON (`groove_grades_tasks_v1`) |
| Teacher profile | Local JSON (`@groovebox_user_profile_v1`) |
| Notification prefs + language | Local JSON (`@groovebox_app_settings_v1`) |
| Theme (light/dark) | Device only |
| Class reminders | **Notifee on device** |
| PDF reports | **Generated on device**, then share sheet |
| Student task link | Hardcoded `https://pulsebox.app/form/{formId}` — **not a live URL** |
| AI lesson planner | UI only; **fake 2s delay**, no generation |
| Logout | Resets navigation to Get Started; **no server session to revoke** |

Until the items in **§1–§8 Required** are done, the backend is **not complete** for shipping this app against a server.

---

## 1. Auth and session — Required

Frontend screens: Login, Sign Up, Forgot Password, Verify OTP (`purpose`: `signup` \| `reset`).

| Done | Item | Acceptance |
|------|------|------------|
| [ ] | Register with name, email, password | Creates teacher account; does not log in until email verified (or document if you auto-login) |
| [ ] | Send 6-digit OTP to email | Signup and password-reset both send a real code |
| [ ] | Verify OTP | Rejects wrong/expired codes; signup OTP then starts a session; reset OTP then allows new password |
| [ ] | Resend OTP | Rate-limited (UI waits 60s) |
| [ ] | Login with email + password | Returns access + refresh (or equivalent) |
| [ ] | Refresh / persist session | App can restore session after restart |
| [ ] | Logout | Invalidates refresh token / session |
| [ ] | Forgot password flow | Email → OTP → set new password |
| [ ] | All teacher data scoped to authenticated user | No cross-teacher leak |

**Optional**

| Done | Item |
|------|------|
| [ ] | Social login (Google / Facebook) — UI placeholders only |
| [ ] | Change password while logged in |

**Auth is complete?** [ ]

---

## 2. Teacher profile — Required

Fields the Profile screen stores:

`displayName`, `avatarUri`, `email`, `phone`, `country`, `city`, `address`, `institutionName`, `professionalTitle`, `subjectsTeach`

| Done | Item | Acceptance |
|------|------|------------|
| [ ] | GET current teacher profile | Returns all fields above |
| [ ] | PATCH profile | Partial update; email uniqueness enforced if email can change |
| [ ] | Avatar upload | Multipart image → **HTTPS URL** (not `file://`) |
| [ ] | Greeting name | `displayName` (first word used as “Hey {name}”) |

**Profile is complete?** [ ]

---

## 3. App settings — Required (store) / Optional (push)

| Done | Item | Acceptance |
|------|------|------------|
| [ ] | GET/PATCH notification prefs | Booleans: `taskReminders`, `gradeUpdates`, `classAnnouncements` |
| [ ] | GET/PATCH language | `en` \| `es` \| `fr` (only English copy is live in the app) |

**Optional**

| Done | Item |
|------|------|
| [ ] | Push (FCM/APNs) honoring those three toggles |
| [ ] | Theme sync (app already stores light/dark on device) |

**Settings is complete?** [ ]

---

## 4. Classes — Required

Each class must support:

| Field | Notes |
|-------|--------|
| `id` | Server UUID preferred; echo on create |
| `name`, `subject`, `gradeLevel`, `schedule` | Required in create flow |
| `studentCount` | Must match roster length |
| `roomNumber`, `schoolName` | Optional |
| `schoolType` | `School` \| `College` \| `University` \| `Others` |
| `students[]` | Roster |
| `announcements[]` | Newest first in UI |
| `activityLog[]` | Newest first; kinds below |
| `attendanceHistory[]` | One row per `dateKey`; **latest save wins** |
| `reminder` | `{ enabled, hour, minute, weekdays[] }` ISO weekday 1=Mon … 7=Sun |
| `createdAt` | ISO 8601 |

**Roster student**

| Field | Notes |
|-------|--------|
| `id`, `name` | Required |
| `rollNumber` | Optional, max 16 chars in UI |
| `email` | Optional |
| `teacherRemark`, `teacherRemarkUpdatedAt` | **Teacher-only — never on student APIs** |
| `followUp` | Boolean at-risk flag; treat as teacher-only |

**Activity `kind`:** `announcement` \| `attendance` \| `task_assigned`

**Attendance**

- `dateKey`: `YYYY-MM-DD` (document timezone: device-local vs UTC)
- `takenAt`: ISO
- `entries[]`: `{ studentId, status }` where `status` is `present` \| `absent` \| `late`

| Done | Item | Acceptance |
|------|------|------------|
| [ ] | List classes for the teacher | Includes roster counts used on Home |
| [ ] | Create class | Name, subject, grade, schedule, room, school, schoolType, initial roster |
| [ ] | Update class metadata | |
| [ ] | Delete class | Cascade or block if tasks exist — **document the rule**; cancel reminders conceptually |
| [ ] | Add one student | |
| [ ] | Bulk import students | CSV shape: `Name` / `Name, email` / `Name, email, roll` (optional header) |
| [ ] | Edit student | Name, email, roll, remark, follow-up |
| [ ] | Bulk assign roll numbers | |
| [ ] | Delete student(s) | Grade + attendance rows for that student handled (delete or keep — **document**) |
| [ ] | Post announcement | Writes announcement + activity log |
| [ ] | Save attendance for a day | Upsert by `dateKey`; activity log “Attendance marked” |
| [ ] | Attendance history for reports | Used by class attendance PDF and student record |
| [ ] | Get/set class reminder | Persist settings even if push is local for now |

**Classes is complete?** [ ]

---

## 5. Forms (task builder) — Required

`FormData`: `id`, `name`, `iconId`, `answers` (JSON document), `createdAt`

**`iconId` values:** `clipboard` \| `star` \| `message` \| `chart` \| `target` \| `trophy`

**`answers` (opaque JSON the builder stores) includes at least:**

```json
{
  "taskKind": "quiz | assignment | project | test",
  "assessmentType": "(same as taskKind)",
  "classId": "<id or \"all\">",
  "className": "string",
  "focusTopic": "optional",
  "duePreset": "today | tomorrow | week | two_weeks",
  "questionFormats": ["shortText", "..."],
  "questions": []
}
```

**Question object**

| Field | Type |
|-------|------|
| `id`, `title` | string |
| `type` | `shortText` \| `longText` \| `multipleChoice` \| `checkbox` \| `dropdown` \| `rating` \| `email` \| `number` \| `date` |
| `required` | boolean |
| `placeholder`, `description` | optional string |
| `maxLength` | optional number (text) |
| `options` | string[] (MCQ / checkbox / dropdown) |
| `correctAnswers` | number[] (option indices) |
| `imageUrl`, `audioUrl` | optional (upload endpoints if you support media) |
| `maxRating` | rating |
| `min`, `max`, `step` | number questions |
| `dateFormat`, `minDate`, `maxDate` | date questions |

| Done | Item | Acceptance |
|------|------|------------|
| [ ] | CRUD forms owned by the teacher | `answers` stored as JSON, not flattened away |
| [ ] | Update questions / reorder | Matches Edit + Swap questions screens |
| [ ] | Delete form | Also remove linked gradebook tasks (§6) |
| [ ] | Optional: question image/audio upload | HTTPS URLs in `imageUrl` / `audioUrl` |

**Forms is complete?** [ ]

---

## 6. Gradebook (tasks + grades) — Required

**Task (`ClassTask`)**

`id`, `classId`, `title`, `kind` (`quiz` \| `assignment` \| `project` \| `test`), `dueLabel?`, `dueAt?` (ISO), `createdAt`, `formId?`

**Grade row (`TaskGradeRecord`)**

`id`, `classId`, `taskId`, `studentId`, `grade` (display **string**: `92%`, `A−`, `—`, …), `status` (`graded` \| `pending` \| `missing`)

**Assign form to classes** (Share Task screen)

```json
{
  "formId": "string",
  "title": "string",
  "kind": "quiz | assignment | project | test",
  "dueLabel": "optional",
  "dueAt": "optional ISO",
  "targets": [{ "classId": "string", "studentIds": ["..."] }]
}
```

Frontend today: one task per `(formId, classId)` with id `form-{formId}-cls-{classId}`; grade id `g-{taskId}-{studentId}`; new rows `grade: "—"`, `status: "pending"`.

| Done | Item | Acceptance |
|------|------|------------|
| [ ] | Unique `(classId, taskId, studentId)` | |
| [ ] | Assign form → upsert task + pending grades | Activity log `task_assigned` on each class |
| [ ] | List tasks/grades by class | Powers View Grades + Home stats |
| [ ] | Get one task report | All students for `classId` + `taskId` |
| [ ] | Update a grade row | Teacher can change `grade` + `status` (UI mainly displays today; API should still exist) |
| [ ] | Delete form cascades tasks + those grades | |
| [ ] | New roster students get pending rows for existing class tasks **or** documented “assign again” | Pick one and document |

**If you use server UUIDs instead of `form-{formId}-cls-{classId}`, the mobile assign/report code must be updated in the same release.**

**Gradebook is complete?** [ ]

---

## 7. Student-facing form (web) — Required for “Share”

The teacher app copies/shares:

`https://pulsebox.app/form/{formId}`

and shows a QR of that URL. The static web viewer expects:

| Done | Item | Acceptance |
|------|------|------------|
| [ ] | Public GET form by id (or tokenized link) | Returns name + questions; **no** teacher remarks |
| [ ] | POST submission | `{ formId, answers, submittedAt }` |
| [ ] | Tie submission to student | Email, token, or class code — **product decision required** |
| [ ] | On submit, update grade row | e.g. `pending` → `graded` or keep `pending` until teacher reviews — **document** |
| [ ] | Real share URL | Replace `pulsebox.app` with the production host; tokenized links preferred |
| [ ] | CORS / HTTPS | Phone + browser can load and submit |

**Share / student submit is complete?** [ ]

---

## 8. Platform / security — Required

| Done | Item |
|------|------|
| [ ] | HTTPS only |
| [ ] | Auth on all teacher routes |
| [ ] | Teacher A cannot read/write teacher B’s classes, forms, grades |
| [ ] | `teacherRemark` / `followUp` never returned on student endpoints |
| [ ] | Validation + sensible max payload sizes (forms JSON, CSV import) |
| [ ] | Rate limit auth, OTP, public submit |
| [ ] | Environments: local, staging, production base URLs |

**Security is complete?** [ ]

---

## 9. Optional / not blocking “backend matches current app”

These exist in UI or plans but **are not required** to replace AsyncStorage.

| Done | Item | Notes |
|------|------|--------|
| [ ] | AI lesson planner API | Screen is stubbed (`subject`, `topic`, `gradeLevel`, `duration`, `learningObjectives`) |
| [ ] | Persist generated lesson plans | Not stored in the app yet |
| [ ] | Server-side PDF | App already builds PDF on device |
| [ ] | Push for class reminders | Device Notifee is enough for v1 |
| [ ] | Offline sync / `GET /sync?since=` | App is currently last-write-wins on device |
| [ ] | Parent messaging, seating charts, behavior tracker | Not in current app |
| [ ] | Help / legal CMS | Terms & Privacy are static copy in the app |

---

## 10. Suggested teacher API map (for gap review)

Use any style (REST/GraphQL); these are the operations the UI needs.

| Method | Resource | Maps to |
|--------|----------|---------|
| POST | `/auth/register` | Sign up |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Log out |
| POST | `/auth/refresh` | Session |
| POST | `/auth/otp/send` | Signup + reset |
| POST | `/auth/otp/verify` | Verify OTP |
| POST | `/auth/password/reset` | After reset OTP |
| GET/PATCH | `/me` | Profile |
| POST | `/me/avatar` | Photo |
| GET/PATCH | `/me/settings` | Notifications + language |
| GET/POST | `/classes` | List / create |
| GET/PATCH/DELETE | `/classes/:id` | Detail / update / delete |
| POST/PATCH/DELETE | `/classes/:id/students` | Roster |
| POST | `/classes/:id/students/import` | CSV |
| POST | `/classes/:id/announcements` | Announcements |
| PUT | `/classes/:id/attendance/:dateKey` | Attendance upsert |
| GET/PATCH | `/classes/:id/reminder` | Reminder |
| GET/POST | `/forms` | List / create |
| GET/PATCH/DELETE | `/forms/:id` | Edit / delete |
| POST | `/forms/:id/assign` | Share → gradebook |
| GET | `/classes/:id/tasks` | View Grades |
| GET | `/classes/:id/tasks/:taskId` | Task grade report |
| PATCH | `/grades/:id` | Update mark/status |
| GET | `/public/forms/:id` | Student web form |
| POST | `/public/forms/:id/submit` | Student answers |

---

## 11. Data integrity (must hold)

| Done | Rule |
|------|------|
| [ ] | `ClassTask.classId` belongs to the logged-in teacher |
| [ ] | Grade `studentId` is on that class roster |
| [ ] | Grade `taskId` belongs to the same `classId` |
| [ ] | Attendance `entries[].studentId` on roster |
| [ ] | `studentCount === students.length` |
| [ ] | ISO timestamps everywhere the app uses dates |
| [ ] | Attendance `dateKey` timezone documented |

---

## 12. First login / migration (if teachers already used the local app)

| Done | Item |
|------|------|
| [ ] | After first real login, accept a one-shot upload of local JSON **or** start empty |
| [ ] | If server reissues IDs, return a mapping for `classId` / `studentId` / `formId` / `taskId` |

Skip if you are launching with empty accounts only.

---

## 13. Sign-off

Fill this when **§1–§8 Required** are all `[x]`.

| Question | Answer |
|----------|--------|
| Auth works with real email OTP (not any 6-digit code)? | Yes / No |
| Teacher can do class → roster → attendance → form → assign → grades entirely on the server? | Yes / No |
| Student can open a real share/QR link and submit? | Yes / No |
| Teacher-only fields never leak on public APIs? | Yes / No |
| Staging URL for the mobile team? | ________________ |
| OpenAPI / Postman collection attached? | Yes / No |

**Backend complete for TeachTrack v1 (teacher app + student form)?**

- [ ] Yes  
- [ ] No — remaining items: ________________

**Signed**

| Role | Name | Date |
|------|------|------|
| Backend | | |
| Mobile / frontend | | |

---

## Appendix — Frontend files (source of truth)

| Domain | File |
|--------|------|
| Classes, roster, attendance, announcements | `teachtrack-mobile/src/context/ClassesContext.tsx` |
| Tasks / grades / assign | `teachtrack-mobile/src/context/GradesTasksContext.tsx` |
| Forms | `teachtrack-mobile/src/context/FormsContext.tsx` |
| Profile | `teachtrack-mobile/src/context/UserContext.tsx` |
| Settings | `teachtrack-mobile/src/context/AppSettingsContext.tsx` |
| OTP demo | `teachtrack-mobile/src/authentication/VerifyOtp.tsx` |
| Share URL | `teachtrack-mobile/src/forms/ShareForm.tsx` |
| Question types | `teachtrack-mobile/src/forms/QuestionsScreen.tsx` |
| CSV import | `teachtrack-mobile/src/utils/parseStudentCsv.ts` |
| Lesson planner stub | `teachtrack-mobile/src/teacher/LessonPlanner.tsx` |
| Student web submit | `teachtrack-mobile/web/js/form-submit.js` |
