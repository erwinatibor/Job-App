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

export type ViewType = 'dashboard' | 'applications' | 'kanban' | 'calendar' | 'scheduler' | 'profile';

export type InterviewType = 'phone_screen' | 'technical' | 'behavioral' | 'final_round' | 'hr' | 'other';
export type InterviewFormat = 'video' | 'phone' | 'in_person';
export type InterviewStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Interview {
  id: string;
  applicationId?: string;
  company: string;
  position: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM (24hr)
  duration: 30 | 45 | 60 | 90;
  type: InterviewType;
  format: InterviewFormat;
  meetingLink?: string;
  location?: string;
  notes?: string;
  status: InterviewStatus;
  interviewers?: string;
}

export interface AvailabilityDay {
  day: number;        // 0=Sun … 6=Sat
  enabled: boolean;
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
}

export interface UserAvailability {
  days: AvailabilityDay[];
  bufferMinutes: 0 | 15 | 30;
  timezone: string;
  name: string;
  durations: number[];  // e.g. [30, 60]
}

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
