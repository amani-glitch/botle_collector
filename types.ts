
export enum InterviewDay {
  DAY_1 = 'Day 1: Introduction & Big Picture',
  DAY_2 = 'Day 2: Deep Dive on Tasks',
  DAY_3 = 'Day 3: Pain Points & Workarounds',
  DAY_4 = 'Day 4: Collaboration & Communication',
  DAY_5 = 'Day 5: Tools & Wishes'
}

export type Department = 'Operations' | 'Sales' | 'Marketing' | 'Finance' | 'IT' | 'Management';

export const DEPARTMENTS: Department[] = ['Operations', 'Sales', 'Marketing', 'Finance', 'IT', 'Management'];

export interface UserProfile {
  employee_name: string;
  employee_role: string;
  department: Department;
  session_id: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ProcessEntry {
  name: string;
  steps: string[];
  frequency: string;
  time_per_instance_minutes: number;
  tools_involved: string[];
  people_involved: string[];
}

export interface PainPoint {
  description: string;
  severity: number;
  frequency: string;
  current_workaround: string;
  impact: string;
}

export interface ToolEntry {
  name: string;
  purpose: string;
  satisfaction: number;
  issues: string;
}

export interface AutomationOpportunity {
  process: string;
  current_time_minutes: number;
  potential_savings_percent: number;
  complexity: string;
  description: string;
}

export interface InteractionStyle {
  vocabulary_level: string;
  response_length: string;
  detail_spontaneity: string;
  tone: string;
  ai_attitude: string;
  engagement_level: string;
  communication_preference: string;
}

export interface InterviewSummary {
  employee_name: string;
  employee_role: string;
  department: string;
  role_description: string;
  primary_tasks: string[];
  process_map: ProcessEntry[];
  tools_used: ToolEntry[] | string[];
  pain_points: PainPoint[] | string[];
  automation_opportunities: AutomationOpportunity[] | string[];
  collaboration_network: string[];
  time_estimates: Record<string, string | number>;
  interaction_style: InteractionStyle;
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

export type AppPage = 'landing' | 'login' | 'interview';

export interface DayProgress {
  completedDays: InterviewDay[];
  daySummaries: { [day: string]: string };
}
