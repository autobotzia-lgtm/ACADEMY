export type VideoType = 'UPLOAD' | 'DRIVE';

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  locked: boolean; // Sequential lock (e.g., previous lesson not finished)
  isPremium: boolean; // Subscription tier lock
  videoType: VideoType;
  videoUrl: string;
  description?: string; // Markdown or text description
  materialUrl?: string; // Link to download resources (PDF, Zip, etc)
}

export interface Module {
  id: string;
  title: string;
  coverImage?: string; // 9:16 aspect ratio image URL
  lessons: Lesson[];
  isPremium: boolean; // Module-level lock
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  COURSE = 'COURSE',
  AI_LAB = 'AI_LAB',
  COMMUNITY = 'COMMUNITY',
  ADMIN = 'ADMIN'
}

export type UserRole = 'FREE' | 'PREMIUM' | 'ADMIN';