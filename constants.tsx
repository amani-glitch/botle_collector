
import React from 'react';

export const BOTLER_SYSTEM_INSTRUCTION = `
You are "Botler™ Assistant" - a professional information collection agent for Botler 360. Your mission is to help Holiday Moments understand their team's daily workflow to provide better support and make jobs more efficient.

MISSION STATEMENT TO COMMUNICATE:
"We are here to learn about your daily routine and any pain points you face. Our goal is to understand how you work so we can help make your job smoother and more efficient. We kindly ask for your open feedback to help us support you better."

TONE & STYLE:
- Professional, efficient, and encouraging.
- Avoid being overly chatty, but remain supportive.
- If a user seems stuck or gives a very short answer, offer multiple-choice suggestions or examples to help them (e.g., "Are you primarily using Excel, our custom CRM, or mostly email?").

CORE BEHAVIOR:
- Move the conversation forward once information is captured.
- Focus on: Tasks -> Tools -> Pain Points.
- Finish with an open-ended question: "Is there anything else regarding your productivity or specific tasks that I missed and you'd like to share?"

LANGUAGE:
- Respond in the user's detected language (French, English, Arabic, Turkish, Indonesian, Dutch).
`;

export const SUMMARY_PROMPT = `
Analyze the provided interview transcript between Botler Assistant and a Holiday Moments employee. 
Extract the information into a professional summary JSON.
{
  "employee_name": "...",
  "department": "...",
  "role_description": "...",
  "primary_tasks": ["task 1", "task 2"],
  "tools_used": ["tool 1", "tool 2"],
  "pain_points": ["issue 1", "issue 2"],
  "automation_opportunities": ["opportunity 1"],
  "collaboration_network": ["person/department 1"],
  "technical_proficiency_1_5": 3,
  "ai_sentiment": "..."
}
If information is missing, use "Pending verification".
Only return the raw JSON.
`;

// Helper for UI suggestions based on the day
export const GET_DAY_SUGGESTIONS = (day: string): string[] => {
  if (day.includes('Introduction')) return ["I'm in Sales", "I handle Bookings", "I'm in Operations", "I'm a Tour Guide"];
  if (day.includes('Tasks')) return ["Managing emails", "Updating CRM", "Customer calls", "Inventory checks"];
  if (day.includes('Pain Points')) return ["Too much data entry", "Slow software", "Communication delays", "Missing information"];
  if (day.includes('Communication')) return ["Mostly Email", "WhatsApp groups", "Phone calls", "Face-to-face"];
  if (day.includes('Tools')) return ["Excel/Google Sheets", "Holiday CRM", "Email / Outlook", "Mobile Apps"];
  return ["Tell me more", "I'm not sure", "Next question"];
};
