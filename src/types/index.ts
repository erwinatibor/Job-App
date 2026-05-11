export type ApplicationStatus =
  | 'applied'
  | 'contacted'
  | 'screening'
  | 'interview'
  | 'final_interview'
  | 'offer'
  | 'rejected'
  | 'ghosted';

export type PriorityTier = 'dream' | 'high' | 'medium' | 'low';

export type ViewType = 'dashboard' | 'applications' | 'kanban' | 'calendar' | 'profile';

export type TimelineEventType =
  | 'applied'
  | 'contacted'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejection'
  | 'note'
  | 'followup';

export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description?: string;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  salary?: string;
  location: string;
  jobLink?: string;
  dateApplied: string;
  status: ApplicationStatus;
  priority: PriorityTier;
  recruiterName?: string;
  contactLink?: string;
  followUpDate?: string;
  notes: string;
  timeline: TimelineEvent[];
  tags: string[];
  industry?: string;
  companySize?: string;
  remote?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface WeeklyData {
  day: string;
  applications: number;
  interviews: number;
  responses: number;
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}
