/** HTML for a full student record PDF (attendance, grades, remark). */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Safe basename for react-native-html-to-pdf (no path chars). */
export function safeStudentRecordPdfBaseName(studentName: string, className: string): string {
  const raw = `student-${studentName}-${className}-${new Date().toISOString().slice(0, 10)}`;
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-');
  return cleaned.slice(0, 80) || 'student-record';
}

export type StudentRecordPdfParams = {
  generatedAtLabel: string;
  studentName: string;
  studentRollNumber: string | null;
  studentEmail: string | null;
  followUp: boolean;
  className: string;
  classSubject: string;
  gradeLevel: string;
  schedule: string;
  roomNumber: string | null;
  schoolName: string | null;
  schoolType: string | null;
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    ratePercent: number | null;
  };
  attendanceRows: { dateLabel: string; status: string }[];
  gradeRows: { title: string; kindLabel: string; grade: string; statusLabel: string }[];
  remark: string | null;
  remarkUpdatedLabel: string | null;
};

export function buildStudentRecordPdfHtml(p: StudentRecordPdfParams): string {
  const classMeta = [
    p.className,
    p.classSubject,
    p.gradeLevel,
    p.schedule,
    p.roomNumber ? `Room ${p.roomNumber}` : null,
    p.schoolName,
    p.schoolType,
  ]
    .filter(Boolean)
    .join(' · ');

  const attRows =
    p.attendanceRows.length === 0
      ? `<tr><td colspan="2" class="empty">No attendance logged for this student yet.</td></tr>`
      : p.attendanceRows
          .map(
            (r) => `
    <tr class="data-row">
      <td>${escapeHtml(r.dateLabel)}</td>
      <td class="status-cell">${escapeHtml(r.status)}</td>
    </tr>`,
          )
          .join('');

  const gradeRows =
    p.gradeRows.length === 0
      ? `<tr><td colspan="4" class="empty">No grades recorded for this class yet.</td></tr>`
      : p.gradeRows
          .map(
            (r) => `
    <tr class="data-row">
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.kindLabel)}</td>
      <td class="status-cell">${escapeHtml(r.statusLabel)}</td>
      <td class="grade-cell">${escapeHtml(r.grade)}</td>
    </tr>`,
          )
          .join('');

  const rateLine =
    p.attendance.ratePercent != null
      ? `Present rate: ${p.attendance.ratePercent}% (present ÷ logged days)`
      : 'Present rate: — (no logged days yet)';

  const remarkBlock =
    p.remark && p.remark.trim()
      ? `<div class="remark-box"><pre class="remark-pre">${escapeHtml(p.remark.trim())}</pre>${
          p.remarkUpdatedLabel
            ? `<p class="remark-meta">Last updated: ${escapeHtml(p.remarkUpdatedLabel)}</p>`
            : ''
        }</div>`
      : '<p class="muted">No teacher remark saved.</p>';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    padding: 28px 32px 40px;
    margin: 0;
    background: #faf8ff;
  }
  h1 { font-size: 22px; margin: 0 0 6px 0; font-weight: 700; letter-spacing: -0.3px; }
  .sub { font-size: 13px; color: #6b6b7a; margin: 0 0 18px 0; }
  .meta { font-size: 14px; color: #5c5c6b; margin: 0 0 16px 0; line-height: 1.5; }
  .pill-row { margin-bottom: 20px; }
  .pill {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 10px;
    background: rgba(160, 96, 255, 0.12);
    border: 1px solid rgba(0,0,0,0.08);
    font-size: 13px;
    font-weight: 600;
    color: #7c3aed;
    margin-right: 8px;
    margin-bottom: 8px;
  }
  .pill.warn { background: rgba(217, 119, 6, 0.15); color: #b45309; }
  .section {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b6b7a;
    margin: 22px 0 10px 0;
    font-weight: 600;
  }
  .stats {
    display: table;
    width: 100%;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 14px;
    background: #fff;
  }
  .stats-row { display: table-row; }
  .stat-cell {
    display: table-cell;
    width: 20%;
    text-align: center;
    padding: 12px 6px;
    border-right: 1px solid rgba(0,0,0,0.08);
    vertical-align: middle;
  }
  .stat-cell:last-child { border-right: none; }
  .stat-num { font-size: 18px; font-weight: 800; color: #1a1a1a; }
  .stat-lab { font-size: 10px; color: #6b6b7a; margin-top: 4px; font-weight: 600; }
  .stat-note { font-size: 12px; color: #5c5c6b; margin: 0 0 14px 0; }
  table.data { width: 100%; border-collapse: collapse; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; margin-bottom: 8px; background: #fff; }
  thead th {
    background: rgba(160, 96, 255, 0.08);
    padding: 10px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b6b7a;
    font-weight: 600;
    text-align: left;
  }
  th.status-col { text-align: center; width: 88px; }
  th.grade-col { text-align: right; width: 72px; }
  td { padding: 10px; border-top: 1px solid rgba(0,0,0,0.08); vertical-align: middle; font-size: 14px; }
  td.status-cell { text-align: center; font-weight: 600; text-transform: capitalize; font-size: 13px; }
  td.grade-cell { text-align: right; font-weight: 700; color: #7c3aed; }
  td.empty { color: #6b6b7a; font-style: italic; text-align: center; padding: 16px; }
  .remark-box {
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 12px;
    padding: 14px;
    background: #fff;
  }
  .remark-pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 14px;
    font-family: inherit;
    line-height: 1.5;
  }
  .remark-meta { font-size: 12px; color: #6b6b7a; margin: 10px 0 0 0; }
  .muted { color: #6b6b7a; font-size: 14px; margin: 0; }
  .footer { font-size: 12px; color: #6b6b7a; font-style: italic; line-height: 1.45; margin-top: 24px; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 14px; }
</style>
</head>
<body>
  <h1>${escapeHtml(p.studentName)}</h1>
  <p class="sub">Student record · TeachTrack</p>
  <p class="meta">${escapeHtml(classMeta)}</p>
  <p class="meta">Generated: ${escapeHtml(p.generatedAtLabel)}</p>
  <div class="pill-row">
    ${
      p.studentRollNumber
        ? `<span class="pill">Roll no. ${escapeHtml(p.studentRollNumber)}</span>`
        : '<span class="pill">No roll number</span>'
    }
    ${p.studentEmail ? `<span class="pill">${escapeHtml(p.studentEmail)}</span>` : '<span class="pill">No email on file</span>'}
    ${p.followUp ? '<span class="pill warn">Follow-up flagged</span>' : ''}
  </div>

  <p class="section">Attendance summary</p>
  <div class="stats">
    <div class="stats-row">
      <div class="stat-cell"><div class="stat-num">${p.attendance.total}</div><div class="stat-lab">Days logged</div></div>
      <div class="stat-cell"><div class="stat-num">${p.attendance.present}</div><div class="stat-lab">Present</div></div>
      <div class="stat-cell"><div class="stat-num">${p.attendance.late}</div><div class="stat-lab">Late</div></div>
      <div class="stat-cell"><div class="stat-num">${p.attendance.absent}</div><div class="stat-lab">Absent</div></div>
      <div class="stat-cell"><div class="stat-num">${p.attendance.ratePercent != null ? `${p.attendance.ratePercent}%` : '—'}</div><div class="stat-lab">Present rate</div></div>
    </div>
  </div>
  <p class="stat-note">${escapeHtml(rateLine)}</p>

  <p class="section">Attendance by session</p>
  <table class="data">
    <thead><tr><th>Date</th><th class="status-col">Status</th></tr></thead>
    <tbody>${attRows}</tbody>
  </table>

  <p class="section">Grades (this class)</p>
  <table class="data">
    <thead>
      <tr>
        <th>Task</th>
        <th>Type</th>
        <th class="status-col">Status</th>
        <th class="grade-col">Grade</th>
      </tr>
    </thead>
    <tbody>${gradeRows}</tbody>
  </table>

  <p class="section">Teacher remark</p>
  ${remarkBlock}

  <p class="footer">This report reflects data stored in TeachTrack on this device. Grades and attendance may change as you update the class.</p>
</body>
</html>`;
}
