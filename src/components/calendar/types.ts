/* eslint-disable @typescript-eslint/no-explicit-any */

export interface EventClickArg {
  event: any;
  jsEvent: MouseEvent;
  view: any;
}

export interface EventDropArg {
  event: any;
  oldEvent: any;
  delta: any;
  revert: () => void;
}

export interface EventResizeArg {
  event: any;
  startDelta: any;
  endDelta: any;
  revert: () => void;
}

export interface SessionData {
  id: number;
  startTime: Date;
  duration: number;
  status: string;
  sessionType: string;
  location: string;
  studentId: string;
  tutorId: number;
  invitationId?: number;
}

export interface AvailableSlotData {
  id: number;
  startTime: Date;
  duration: number;
  sessionType: string;
  location: string;
  tutorId: number;
}

export interface StudentPreferences {
  languageLevel?: string;
  learningGoals?: string[];
  preferredTutor?: number;
  preferredSchedule?: string;
}

export interface StudentInfo {
  name: string | null;
  email: string;
  image: string;
  languageLevel?: string | null;
  preferences?: StudentPreferences | null;
}
