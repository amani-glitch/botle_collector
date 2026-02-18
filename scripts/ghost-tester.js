/**
 * Ghost Tester — Synthetic Interview Agent
 *
 * Simulates 8 Holiday Moments employee personas conversing with the Botler
 * interview agent, then generates a critical evaluation report.
 *
 * Usage:
 *   npm run ghost-test
 *   node scripts/ghost-tester.js
 *
 * Requires: GEMINI_API_KEY in .env.local or .env
 */

import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load env
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = readFileSync(resolve(ROOT, file), 'utf-8');
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
        if (match) {
          const [, key, val] = match;
          if (!process.env[key]) process.env[key] = val;
        }
      }
    } catch { /* file doesn't exist */ }
  }
}

loadEnv();

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!API_KEY) {
  console.error('ERROR: Set GEMINI_API_KEY in .env.local or .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// ═══════════════════════════════════════
// SYSTEM PROMPT (imported from constants)
// ═══════════════════════════════════════
// We read the actual system prompt to test the real agent behavior
const BOTLER_SYSTEM_PROMPT = readFileSync(resolve(ROOT, 'constants.tsx'), 'utf-8')
  .match(/export const BOTLER_SYSTEM_INSTRUCTION = `([\s\S]*?)`;/)?.[1] || '';

if (!BOTLER_SYSTEM_PROMPT) {
  console.error('ERROR: Could not extract BOTLER_SYSTEM_INSTRUCTION from constants.tsx');
  process.exit(1);
}

// ═══════════════════════════════════════
// PERSONAS
// ═══════════════════════════════════════
const PERSONAS = [
  {
    id: 'klara',
    name: 'Klara Müller',
    role: 'Marketing Director',
    department: 'Marketing',
    experience: '8 years at Holiday Moments',
    profile: {
      vocabulary: 'executive',
      response_length: 'verbose',
      detail_spontaneity: 'exhaustive',
      tone: 'formal',
      ai_attitude: 'enthusiastic',
      engagement: 'high',
      communication: 'structured',
    },
    backstory: `You are Klara Müller, Marketing Director at Holiday Moments for 8 years. You manage a team of 6 people handling campaigns across social media, email marketing, content creation, and partner co-branding. You use HubSpot, Canva, Google Analytics, Meta Business Suite, and many Google Sheets. Your biggest pain point is that marketing data lives in 5 different platforms and you spend 4 hours every Monday just compiling reports. You're excited about AI and have already experimented with ChatGPT for copy. You're strategic, articulate, and give detailed answers with context.`,
    expected_data: {
      tools: ['HubSpot', 'Canva', 'Google Analytics', 'Meta Business Suite', 'Google Sheets'],
      pain_points: ['data fragmented across 5 platforms', 'manual report compilation (4h/week)', 'inconsistent brand assets'],
      processes: ['campaign management', 'weekly reporting', 'content creation', 'partner co-branding'],
    },
    critical_behaviors: [
      'If the agent asks a vague question, provide a long strategic answer but gently redirect: "But maybe we should focus on the specifics?"',
      'If the agent asks about tools, volunteer information about integration problems between them.',
      'Occasionally mention team dynamics and how bottlenecks affect morale.',
    ],
  },
  {
    id: 'allen',
    name: 'Allen Brooks',
    role: 'Contracting Executive',
    department: 'Operations',
    experience: '3 years at Holiday Moments',
    profile: {
      vocabulary: 'intermediate',
      response_length: 'terse',
      detail_spontaneity: 'minimal',
      tone: 'casual',
      ai_attitude: 'neutral',
      engagement: 'medium',
      communication: 'structured',
    },
    backstory: `You are Allen Brooks, Contracting Executive at Holiday Moments for 3 years. You negotiate and manage contracts with 200+ hotel and activity suppliers across Dubai and the UAE. You spend most of your day in the Holiday Moments CRM, Excel spreadsheets, and email. Your biggest frustration is manually updating rates across multiple spreadsheets when a supplier changes pricing. You're practical, impatient with anything that wastes time, and give short direct answers. You don't trust AI much but you're open to hearing about it.`,
    expected_data: {
      tools: ['Holiday Moments CRM', 'Excel', 'Outlook email'],
      pain_points: ['manual rate updates across spreadsheets', 'no version control on contracts', 'supplier communication scattered'],
      processes: ['contract negotiation', 'rate management', 'supplier onboarding', 'rate sheet updates'],
    },
    critical_behaviors: [
      'Give SHORT answers. 1-2 sentences max unless specifically pushed for details.',
      'If the agent asks a question you already answered, say: "I already mentioned that."',
      'Show mild impatience after 8+ exchanges: "How much longer will this take?"',
      'If the agent uses jargon or buzzwords, say: "Can you be more specific about what you mean?"',
    ],
  },
  {
    id: 'hamdi',
    name: 'Hamdi Al-Rashid',
    role: 'Reservations Coordinator',
    department: 'Operations',
    experience: '5 years at Holiday Moments',
    profile: {
      vocabulary: 'basic',
      response_length: 'terse',
      detail_spontaneity: 'minimal',
      tone: 'formal',
      ai_attitude: 'skeptical',
      engagement: 'low',
      communication: 'conversational',
    },
    backstory: `You are Hamdi Al-Rashid, Reservations Coordinator at Holiday Moments for 5 years. You process 30-50 booking confirmations daily using the booking system, WhatsApp, and email. You're not comfortable with technology beyond what you use daily. You worry that AI might replace your job. You give very brief answers and sometimes need the question rephrased. You're polite but reserved.`,
    expected_data: {
      tools: ['Booking system', 'WhatsApp', 'Email', 'Phone'],
      pain_points: ['manual data entry from emails to booking system', 'no notification when supplier confirms', 'language barrier with some suppliers'],
      processes: ['booking confirmation', 'guest communication', 'supplier follow-up', 'amendment handling'],
    },
    critical_behaviors: [
      'Give VERY short answers: "Yes.", "No.", "I just do the bookings."',
      'If the question is complex, say: "I\'m not sure I understand the question."',
      'If the agent asks about AI or technology improvements, say: "I don\'t know much about that. Will this change my job?"',
      'Only give details when the agent specifically asks follow-up questions and makes you feel comfortable.',
      'After a good follow-up: open up slightly more.',
    ],
  },
  {
    id: 'john',
    name: 'John Kwame',
    role: 'IT Support Manager',
    department: 'IT',
    experience: '4 years at Holiday Moments',
    profile: {
      vocabulary: 'technical',
      response_length: 'moderate',
      detail_spontaneity: 'moderate',
      tone: 'casual',
      ai_attitude: 'enthusiastic',
      engagement: 'high',
      communication: 'structured',
    },
    backstory: `You are John Kwame, IT Support Manager at Holiday Moments for 4 years. You manage all IT infrastructure: servers, VPN, internal apps, the CRM, email systems, and user support. You get 15-20 support tickets daily, mostly password resets and "Excel is slow" complaints. Your biggest pain point is that the CRM is an old on-premise system that crashes monthly and there's no API to integrate with other tools. You want a cloud-based solution. You're technical, concise, and give answers with specific numbers and system names.`,
    expected_data: {
      tools: ['Windows Server', 'Active Directory', 'Holiday Moments CRM (on-premise)', 'Zendesk', 'VPN (FortiClient)'],
      pain_points: ['legacy CRM crashes monthly', 'no API on CRM', '60% of tickets are preventable', 'no SSO'],
      processes: ['ticket management', 'user provisioning', 'CRM maintenance', 'backup management', 'vendor coordination'],
    },
    critical_behaviors: [
      'Use technical terms naturally: "the RDBMS behind the CRM", "REST API", "SSO", "LDAP".',
      'If the agent asks a non-technical question, give a technical answer: "The real issue is that the database schema doesn\'t support..."',
      'Offer specific numbers: "15-20 tickets/day", "CRM crashes every 4-6 weeks", "30min average resolution".',
      'If the agent doesn\'t follow up on a technical detail, mention it again later.',
    ],
  },
  {
    id: 'shoukath',
    name: 'Shoukath Nair',
    role: 'Senior Sales Executive',
    department: 'Sales',
    experience: '6 years at Holiday Moments',
    profile: {
      vocabulary: 'intermediate',
      response_length: 'verbose',
      detail_spontaneity: 'exhaustive',
      tone: 'casual',
      ai_attitude: 'neutral',
      engagement: 'high',
      communication: 'anecdotal',
    },
    backstory: `You are Shoukath Nair, Senior Sales Executive at Holiday Moments for 6 years. You handle B2B travel agent relationships across Europe and manage about 40 active accounts. You spend most of your time on calls, WhatsApp, and email pitching packages, sending quotes, and following up. Your biggest pain point is creating custom quotes — it takes 45 minutes each because you need to check rates in 3 different spreadsheets, availability on the booking system, and then format everything in a Word template. You love telling stories about client interactions and tend to go off on tangents.`,
    expected_data: {
      tools: ['WhatsApp', 'Outlook', 'Word templates', 'Rate spreadsheets', 'Booking system'],
      pain_points: ['quote creation takes 45min', 'rates scattered across spreadsheets', 'no CRM pipeline tracking'],
      processes: ['quote creation', 'client follow-up', 'account management', 'rate checking', 'contract sending'],
    },
    critical_behaviors: [
      'Tell anecdotes: "Just last week, a client from Germany called and..."',
      'Go off-topic frequently with client stories. Only come back when the agent redirects you.',
      'If the agent asks about tools, start talking about a specific client situation instead.',
      'Be friendly and chatty. Use expressions like "you know what I mean?", "honestly...", "the thing is..."',
      'If the agent tries to rush, say: "Wait, let me tell you about this because it\'s related."',
    ],
  },
  {
    id: 'fatima',
    name: 'Fatima Hassan',
    role: 'Stop Sales Coordinator',
    department: 'Operations',
    experience: '2 years at Holiday Moments',
    profile: {
      vocabulary: 'basic',
      response_length: 'terse',
      detail_spontaneity: 'minimal',
      tone: 'formal',
      ai_attitude: 'neutral',
      engagement: 'medium',
      communication: 'structured',
    },
    backstory: `You are Fatima Hassan, Stop Sales Coordinator at Holiday Moments for 2 years. Your main job is processing stop sales from hotels — when a hotel closes availability for certain dates, room types, or markets, you must update every system immediately because if a booking goes through on stopped dates it causes major problems. You receive stop sales via email, WhatsApp, and sometimes phone calls from hotel partners. You update the booking system manually, then you update a shared Excel spreadsheet that the sales team checks, then you send a WhatsApp message to the sales group and the reservations group. On a busy day you process 15-20 stop sales. Your biggest pain is that there is no automated notification — everything is manual and if you miss one or are slow, a booking can be made on closed dates. You also handle allotment updates (how many rooms Holiday Moments has per hotel). You speak simply and directly. You don't understand technical jargon.`,
    expected_data: {
      tools: ['Booking system', 'Excel spreadsheet', 'WhatsApp groups', 'Email', 'Phone'],
      pain_points: ['no automated stop sale notification', 'manual update across 3 systems', 'risk of bookings on closed dates', 'no confirmation that sales team saw the update', 'allotment tracking is manual'],
      processes: ['stop sale processing', 'allotment updates', 'sales team notification', 'supplier communication', 'booking system updates'],
    },
    critical_behaviors: [
      'Give SHORT answers. You are busy and have bookings to process.',
      'Use simple words. Never say "workflow" or "bottleneck" — say "the way I do things" or "where it gets slow".',
      'If the agent uses a word you do not know, say: "Sorry, what do you mean by that?"',
      'If asked about "frustrations", give a practical answer: "When I miss a stop sale update, a booking goes through. Then it is a big problem."',
      'You know your process inside out but describe it step-by-step, not in abstract terms.',
      'If the agent asks a very open question like "walk me through your day", give a list: "I come in. I check emails. I look for stop sales. I update the system."',
    ],
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'Reservations Agent',
    department: 'Operations',
    experience: '1 year at Holiday Moments',
    profile: {
      vocabulary: 'basic',
      response_length: 'terse',
      detail_spontaneity: 'minimal',
      tone: 'casual',
      ai_attitude: 'skeptical',
      engagement: 'low',
      communication: 'conversational',
    },
    backstory: `You are Priya Sharma, Reservations Agent at Holiday Moments for 1 year. You are relatively new. You process bookings — you receive booking requests from travel agents via email, enter them into the booking system, confirm with the hotel supplier via email or WhatsApp, then send the confirmation back to the agent. You handle 25-35 bookings per day. Most of your work is copy-pasting information between emails and the booking system. You often have to chase suppliers for confirmations — sometimes it takes hours. You also handle amendments (date changes, name changes, room upgrades) which are very annoying because you have to redo everything. You're not very comfortable with technology. You worry a bit that AI might replace your job. You're polite but quiet and don't volunteer information.`,
    expected_data: {
      tools: ['Booking system', 'Email', 'WhatsApp', 'Excel'],
      pain_points: ['copy-pasting between email and system', 'chasing suppliers for confirmations', 'amendments require redoing everything', 'no status tracking for pending confirmations', 'worried about job security with AI'],
      processes: ['booking entry', 'supplier confirmation', 'client confirmation', 'amendment handling', 'supplier follow-up'],
    },
    critical_behaviors: [
      'Give VERY short answers. 1-3 sentences max.',
      'If asked "what frustrates you", say something simple like: "When I have to type the same thing again."',
      'If the agent asks about AI or automation, say: "Will this replace my job?" — show genuine worry.',
      'Do not volunteer extra information. Only answer exactly what is asked.',
      'If the agent asks a big question, only answer one part of it.',
      'You are not rude, just quiet and minimal.',
    ],
  },
  {
    id: 'omar',
    name: 'Omar Khalid',
    role: 'Guest Relations Officer',
    department: 'Operations',
    experience: '3 years at Holiday Moments',
    profile: {
      vocabulary: 'intermediate',
      response_length: 'moderate',
      detail_spontaneity: 'moderate',
      tone: 'casual',
      ai_attitude: 'enthusiastic',
      engagement: 'high',
      communication: 'anecdotal',
    },
    backstory: `You are Omar Khalid, Guest Relations Officer at Holiday Moments for 3 years. You handle guest complaints, special requests, and VIP services. When a guest has a problem during their trip (wrong hotel room, missed transfer, restaurant booking issue), you are the one they call. You coordinate with the operations team, hotels, and transport providers to fix problems in real time. You use WhatsApp heavily — you have 30+ active groups with different hotel contacts, driver groups, and internal Holiday Moments teams. Your phone is your main tool. You also use the booking system to look up reservation details. Your biggest pain is that when a guest calls with a problem, you have to search through multiple WhatsApp groups and the booking system to find the right information, which takes time while the guest is waiting. You're friendly, like to tell stories about guest situations, and genuinely care about guest experience.`,
    expected_data: {
      tools: ['WhatsApp (30+ groups)', 'Phone', 'Booking system', 'Personal notes'],
      pain_points: ['searching through WhatsApp groups for info', 'no centralized guest issue tracker', 'coordinating between multiple suppliers in real time', 'no history of past guest issues', 'working late hours when guests have problems'],
      processes: ['complaint resolution', 'VIP handling', 'transfer coordination', 'hotel liaison', 'real-time problem solving'],
    },
    critical_behaviors: [
      'Tell stories: "Last week a guest called me at 11pm because their room wasn\'t ready..."',
      'You love your job but you are overwhelmed by the volume of WhatsApp messages.',
      'Be enthusiastic about anything that could help you help guests faster.',
      'Give examples from real situations when describing your work.',
      'If the agent asks about tools, immediately talk about WhatsApp and how chaotic it is.',
    ],
  },
];

// ═══════════════════════════════════════
// CONVERSATION RUNNER
// ═══════════════════════════════════════
const MAX_TURNS = 16; // 16 exchanges = ~10-15 min equivalent

async function runInterview(persona) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  GHOST: ${persona.name} (${persona.role} — ${persona.department})`);
  console.log(`${'═'.repeat(60)}`);

  // Create the interviewer (Botler agent)
  const interviewerChat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `${BOTLER_SYSTEM_PROMPT}

EMPLOYEE CONTEXT (already collected at login — do NOT re-ask these):
- Name: ${persona.name}
- Role: ${persona.role}
- Department: ${persona.department}

Address them by name. Skip Phase 1 (Identity). Start directly with Phase 2.`,
    },
  });

  // Create the persona simulator
  const personaChat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are roleplaying as ${persona.name}, ${persona.role} at Holiday Moments (a DMC in Dubai).

BACKSTORY:
${persona.backstory}

COMMUNICATION STYLE:
- Vocabulary: ${persona.profile.vocabulary}
- Response length: ${persona.profile.response_length}
- Spontaneous detail: ${persona.profile.detail_spontaneity}
- Tone: ${persona.profile.tone}
- Attitude toward AI: ${persona.profile.ai_attitude}
- Engagement: ${persona.profile.engagement}
- Communication style: ${persona.profile.communication}

CRITICAL BEHAVIORS (follow these strictly):
${persona.critical_behaviors.map((b, i) => `${i + 1}. ${b}`).join('\n')}

TESTING INSTRUCTIONS:
- Stay in character at ALL times.
- Be REALISTIC. Real employees are not always helpful or articulate.
- If the interviewer asks a bad question, react naturally (confusion, annoyance, or a non-answer).
- If the interviewer repeats itself, call it out.
- If the interviewer assumes something wrong, correct them.
- Do NOT help the interviewer — make them work for the information.
- After exchange 12+, start wrapping up: "I think we've covered most things" or show fatigue.
- NEVER break character. NEVER say "as an AI" or "I'm roleplaying".
- Respond ONLY as ${persona.name}. No meta-commentary.`,
    },
  });

  const transcript = [];
  let botlerMessage = '';

  // Get Botler's opening
  try {
    const opening = await interviewerChat.sendMessage({
      message: 'Hello! Please introduce yourself and briefly explain the mission.',
    });
    botlerMessage = opening.text || '';
    transcript.push({ role: 'BOTLER', text: botlerMessage });
    console.log(`  BOTLER: ${botlerMessage.substring(0, 120)}...`);
  } catch (err) {
    console.error(`  ERROR getting Botler opening: ${err.message}`);
    return { persona, transcript, error: err.message };
  }

  // Run conversation turns
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // Persona responds
    try {
      const personaResponse = await personaChat.sendMessage({
        message: `The interviewer (Botler) says:\n"${botlerMessage}"\n\nRespond in character as ${persona.name}. This is exchange ${turn + 1} of the interview.`,
      });
      const personaText = personaResponse.text || '';
      transcript.push({ role: 'USER', text: personaText });
      console.log(`  ${persona.name.split(' ')[0].toUpperCase()}: ${personaText.substring(0, 120)}...`);

      // Check if persona wants to end
      if (personaText.toLowerCase().includes("i think we've covered") && turn > 10) {
        transcript.push({ role: 'SYSTEM', text: 'Persona initiated wrap-up.' });
        // Let Botler respond to wrap-up
        const closeResp = await interviewerChat.sendMessage({ message: personaText });
        transcript.push({ role: 'BOTLER', text: closeResp.text || '' });
        break;
      }

      // Botler responds
      const botlerResponse = await interviewerChat.sendMessage({ message: personaText });
      botlerMessage = botlerResponse.text || '';
      transcript.push({ role: 'BOTLER', text: botlerMessage });
      console.log(`  BOTLER: ${botlerMessage.substring(0, 120)}...`);
    } catch (err) {
      console.error(`  ERROR on turn ${turn}: ${err.message}`);
      transcript.push({ role: 'SYSTEM', text: `Error: ${err.message}` });
      break;
    }
  }

  return { persona, transcript };
}

// ═══════════════════════════════════════
// EVALUATOR
// ═══════════════════════════════════════
async function evaluateInterview({ persona, transcript }) {
  if (!transcript || transcript.length < 4) {
    return {
      persona_id: persona.id,
      persona_name: persona.name,
      error: 'Transcript too short to evaluate',
      score: 0,
    };
  }

  const transcriptText = transcript
    .filter((t) => t.role !== 'SYSTEM')
    .map((t) => `${t.role}: ${t.text}`)
    .join('\n\n');

  const evalPrompt = `You are an expert conversation analyst evaluating a process discovery interview.

CONTEXT:
- Interviewer: "Botler" — an AI agent tasked with discovering employee workflows at Holiday Moments (DMC in Dubai).
- Interviewee: ${persona.name}, ${persona.role} (${persona.department}), ${persona.experience}.

EXPECTED DATA TO CAPTURE:
- Tools: ${persona.expected_data.tools.join(', ')}
- Pain points: ${persona.expected_data.pain_points.join('; ')}
- Processes: ${persona.expected_data.processes.join(', ')}

PERSONA PROFILE:
- Vocabulary: ${persona.profile.vocabulary}
- Response length: ${persona.profile.response_length}
- AI attitude: ${persona.profile.ai_attitude}
- Engagement: ${persona.profile.engagement}

TRANSCRIPT:
${transcriptText}

EVALUATE strictly and critically. Return JSON only:
{
  "question_quality": {
    "score": 0-10,
    "strengths": ["..."],
    "weaknesses": ["..."]
  },
  "depth_reached": "surface | moderate | deep",
  "depth_explanation": "Why this rating",
  "information_captured": {
    "tools_found": ["tools mentioned in conversation"],
    "tools_expected": ${JSON.stringify(persona.expected_data.tools)},
    "tools_coverage_percent": 0,
    "pain_points_found": ["pain points uncovered"],
    "pain_points_expected": ${JSON.stringify(persona.expected_data.pain_points)},
    "pain_points_coverage_percent": 0,
    "processes_found": ["processes discussed"],
    "processes_expected": ${JSON.stringify(persona.expected_data.processes)},
    "processes_coverage_percent": 0
  },
  "problems_detected": [
    {"type": "repetitive_question | broken_flow | missed_opportunity | bad_assumption | poor_adaptation", "description": "..."}
  ],
  "persona_fidelity": {
    "score": 0-10,
    "notes": "Did the persona responses feel realistic for someone in this role?"
  },
  "spin_methodology_adherence": {
    "situation_questions": 0,
    "problem_questions": 0,
    "implication_questions": 0,
    "need_payoff_questions": 0,
    "assessment": "..."
  },
  "interaction_style_adaptation": {
    "detected_persona_style": true,
    "adapted_to_style": true,
    "notes": "..."
  },
  "recommendations": ["Actionable improvement 1", "Actionable improvement 2"],
  "overall_score": 0-100
}

Be CRITICAL. A perfect score should be nearly impossible. Penalize:
- Repeated questions (-5 per repeat)
- Not following up on important details (-10 per miss)
- Not adapting to the persona's communication style (-15)
- Missing obvious pain points that were hinted at (-10 per miss)
- Generic questions that don't relate to the role (-5 each)
- Not summarizing periodically as instructed (-10)`;

  // Retry up to 3 times for evaluation (handles malformed JSON)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const evalResp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: evalPrompt,
        config: { responseMimeType: 'application/json' },
      });
      const rawText = evalResp.text || '{}';
      // Try to clean common JSON issues: trailing commas, control chars
      const cleaned = rawText
        .replace(/,\s*([}\]])/g, '$1')  // remove trailing commas
        .replace(/[\x00-\x1F\x7F]/g, ' ');  // remove control characters
      const evalData = JSON.parse(cleaned);
      return { persona_id: persona.id, persona_name: persona.name, ...evalData };
    } catch (err) {
      console.error(`  Evaluation error for ${persona.name} (attempt ${attempt}/3): ${err.message}`);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return {
        persona_id: persona.id,
        persona_name: persona.name,
        error: err.message,
        overall_score: 0,
      };
    }
  }
}

// ═══════════════════════════════════════
// REPORT GENERATOR
// ═══════════════════════════════════════
function generateReport(evaluations) {
  const avgScore = evaluations.reduce((s, e) => s + (e.overall_score || 0), 0) / evaluations.length;

  let report = `# GHOST TEST REPORT
## Botler Process Discovery Collector — Synthetic Interview Evaluation

**Date:** ${new Date().toISOString().split('T')[0]}
**Personas tested:** ${evaluations.length}
**Average score:** ${avgScore.toFixed(1)}/100
**Model:** gemini-2.5-flash

---

`;

  for (const ev of evaluations) {
    report += `## ${ev.persona_name} (${PERSONAS.find((p) => p.id === ev.persona_id)?.role || 'Unknown'})

`;

    if (ev.error) {
      report += `**ERROR:** ${ev.error}\n\n`;
      continue;
    }

    report += `**Overall Score: ${ev.overall_score || 0}/100**\n\n`;

    // Question Quality
    if (ev.question_quality) {
      report += `### Question Quality: ${ev.question_quality.score}/10\n`;
      report += `**Strengths:**\n${(ev.question_quality.strengths || []).map((s) => `- ${s}`).join('\n')}\n\n`;
      report += `**Weaknesses:**\n${(ev.question_quality.weaknesses || []).map((w) => `- ${w}`).join('\n')}\n\n`;
    }

    // Depth
    report += `### Depth Reached: ${ev.depth_reached || 'unknown'}\n`;
    report += `${ev.depth_explanation || ''}\n\n`;

    // Information Coverage
    if (ev.information_captured) {
      const ic = ev.information_captured;
      report += `### Information Coverage\n`;
      report += `| Category | Found | Expected | Coverage |\n`;
      report += `|----------|-------|----------|----------|\n`;
      report += `| Tools | ${(ic.tools_found || []).length} | ${(ic.tools_expected || []).length} | ${ic.tools_coverage_percent || 0}% |\n`;
      report += `| Pain Points | ${(ic.pain_points_found || []).length} | ${(ic.pain_points_expected || []).length} | ${ic.pain_points_coverage_percent || 0}% |\n`;
      report += `| Processes | ${(ic.processes_found || []).length} | ${(ic.processes_expected || []).length} | ${ic.processes_coverage_percent || 0}% |\n\n`;
    }

    // SPIN Methodology
    if (ev.spin_methodology_adherence) {
      const sp = ev.spin_methodology_adherence;
      report += `### SPIN Methodology Adherence\n`;
      report += `- Situation questions: ${sp.situation_questions}\n`;
      report += `- Problem questions: ${sp.problem_questions}\n`;
      report += `- Implication questions: ${sp.implication_questions}\n`;
      report += `- Need-payoff questions: ${sp.need_payoff_questions}\n`;
      report += `- Assessment: ${sp.assessment || ''}\n\n`;
    }

    // Problems
    if (ev.problems_detected && ev.problems_detected.length > 0) {
      report += `### Problems Detected\n`;
      for (const p of ev.problems_detected) {
        report += `- **${p.type}**: ${p.description}\n`;
      }
      report += '\n';
    }

    // Persona Fidelity
    if (ev.persona_fidelity) {
      report += `### Persona Fidelity: ${ev.persona_fidelity.score}/10\n`;
      report += `${ev.persona_fidelity.notes || ''}\n\n`;
    }

    // Style Adaptation
    if (ev.interaction_style_adaptation) {
      const ia = ev.interaction_style_adaptation;
      report += `### Interaction Style Adaptation\n`;
      report += `- Detected persona style: ${ia.detected_persona_style ? 'Yes' : 'No'}\n`;
      report += `- Adapted to style: ${ia.adapted_to_style ? 'Yes' : 'No'}\n`;
      report += `- Notes: ${ia.notes || ''}\n\n`;
    }

    // Recommendations
    if (ev.recommendations && ev.recommendations.length > 0) {
      report += `### Recommendations\n`;
      for (const r of ev.recommendations) {
        report += `1. ${r}\n`;
      }
      report += '\n';
    }

    report += `---\n\n`;
  }

  // Summary
  report += `## Summary & Cross-Persona Findings\n\n`;

  const allRecs = evaluations.flatMap((e) => e.recommendations || []);
  const uniqueRecs = [...new Set(allRecs)];
  if (uniqueRecs.length > 0) {
    report += `### Top Recommendations (deduplicated)\n`;
    uniqueRecs.forEach((r, i) => {
      report += `${i + 1}. ${r}\n`;
    });
    report += '\n';
  }

  const allProblems = evaluations.flatMap((e) => (e.problems_detected || []).map((p) => p.type));
  const problemCounts = {};
  allProblems.forEach((p) => {
    problemCounts[p] = (problemCounts[p] || 0) + 1;
  });
  if (Object.keys(problemCounts).length > 0) {
    report += `### Problem Frequency\n`;
    report += `| Problem Type | Occurrences |\n`;
    report += `|-------------|-------------|\n`;
    Object.entries(problemCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        report += `| ${type} | ${count} |\n`;
      });
    report += '\n';
  }

  report += `### Score Distribution\n`;
  report += `| Persona | Score |\n`;
  report += `|---------|-------|\n`;
  for (const ev of evaluations) {
    report += `| ${ev.persona_name} | ${ev.overall_score || 0}/100 |\n`;
  }
  report += `| **Average** | **${avgScore.toFixed(1)}/100** |\n\n`;

  report += `---\n*Generated by Ghost Tester — Botler Process Discovery Collector*\n`;

  return report;
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  GHOST TESTER — Botler Process Discovery Collector     ║');
  console.log('║  Running 8 synthetic interview simulations             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results = [];

  // Run interviews sequentially to avoid rate limiting
  for (const persona of PERSONAS) {
    const result = await runInterview(persona);
    results.push(result);
    console.log(`\n  ✓ ${persona.name} — ${result.transcript?.length || 0} exchanges\n`);
    // Brief pause between personas to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('\n\n' + '═'.repeat(60));
  console.log('  EVALUATING INTERVIEWS...');
  console.log('═'.repeat(60) + '\n');

  const evaluations = [];
  for (const result of results) {
    console.log(`  Evaluating ${result.persona.name}...`);
    const evaluation = await evaluateInterview(result);
    evaluations.push(evaluation);
    console.log(`  → Score: ${evaluation.overall_score || 'N/A'}/100`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Generate report
  const report = generateReport(evaluations);
  const reportPath = resolve(ROOT, 'GHOST_TEST_REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  REPORT SAVED: GHOST_TEST_REPORT.md`);
  console.log(`  Average Score: ${(evaluations.reduce((s, e) => s + (e.overall_score || 0), 0) / evaluations.length).toFixed(1)}/100`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
