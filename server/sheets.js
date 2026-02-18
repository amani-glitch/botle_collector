import { google } from 'googleapis';

let sheetsClient = null;

function getAuthClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set in environment variables');
  }

  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

function getSheetsClient() {
  if (!sheetsClient) {
    const auth = getAuthClient();
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

const HEADERS = [
  'timestamp',
  'employee_name',
  'employee_role',
  'department',
  'session_id',
  'raw_transcript',
  'interview_transcript',
  'process_map',
  'pain_points',
  'tools_used',
  'automation_opportunities',
  'time_estimates',
  'interaction_style',
  'completion_status',
];

export async function ensureHeaders(spreadsheetId) {
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A1:N1',
  });

  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:N1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [HEADERS],
      },
    });
  }
}

export async function appendInterviewRow(spreadsheetId, data) {
  const sheets = getSheetsClient();

  await ensureHeaders(spreadsheetId);

  const row = [
    data.timestamp || new Date().toISOString(),
    data.employee_name || '',
    data.employee_role || '',
    data.department || '',
    data.session_id || '',
    data.raw_transcript || '',
    typeof data.interview_transcript === 'string'
      ? data.interview_transcript
      : JSON.stringify(data.interview_transcript || []),
    JSON.stringify(data.process_map || []),
    JSON.stringify(data.pain_points || []),
    JSON.stringify(data.tools_used || []),
    JSON.stringify(data.automation_opportunities || []),
    JSON.stringify(data.time_estimates || {}),
    JSON.stringify(data.interaction_style || {}),
    data.completion_status || 'completed',
  ];

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:N',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  });

  return res.data;
}
