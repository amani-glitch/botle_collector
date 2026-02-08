
export enum InterviewDay {
  DAY_1 = 'Day 1: Introduction & Big Picture',
  DAY_2 = 'Day 2: Deep Dive on Tasks',
  DAY_3 = 'Day 3: Pain Points & Workarounds',
  DAY_4 = 'Day 4: Collaboration & Communication',
  DAY_5 = 'Day 5: Tools & Wishes'
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface InterviewSummary {
  employee_name: string;
  department: string;
  role_description: string;
  primary_tasks: string[];
  tools_used: string[];
  pain_points: string[];
  automation_opportunities: string[];
  collaboration_network: string[];
  technical_proficiency_1_5: number;
  ai_sentiment: string;
}

export interface InterviewSession {
  id: string;
  day: InterviewDay;
  messages: Message[];
  status: 'active' | 'completed';
  summary?: InterviewSummary;
}
