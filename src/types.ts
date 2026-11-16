export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type PortfolioCategory =
  | 'Packaging'
  | 'Company Profile'
  | 'Booth & Exhibition'
  | 'Brochure & Print'
  | 'Branding & Logo';

export type SocialPlatform = 'CV Archive' | 'Behance' | 'Instagram' | 'LinkedIn';

export type VisitorRole =
  | 'Recruiter'
  | 'Hiring Manager'
  | 'Creative Director'
  | 'Client'
  | 'Peer';

export type SourceChannel =
  | 'LinkedIn'
  | 'Behance'
  | 'Instagram'
  | 'Direct / QR'
  | 'Email Link';

export type DeviceType = 'Desktop' | 'Mobile' | 'Tablet';

export type DigestDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface ProfileSettingsData {
  id?: string;
  ownerUid: string;
  fullName: string;
  brandName: string;
  headline: string;
  tagline: string;
  bio: string;
  location: string;
  yearsExperience: number;
  awardsCount: number;
  linkedinUrl: string;
  behanceUrl: string;
  instagramUrl: string;
  autoSyncEnabled: boolean;
  lastSyncedAt: string;
}

export interface PortfolioItemData {
  id: string;
  ownerUid: string;
  title: string;
  client: string;
  category: PortfolioCategory;
  sourcePlatform: SocialPlatform;
  year: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  views: number;
  likes: number;
  featured: boolean;
}

export interface ProfileVisitData {
  id: string;
  ownerUid: string;
  visitorName: string;
  visitorRole: VisitorRole;
  company: string;
  location: string;
  sourceChannel: SourceChannel;
  sectionViewed: string;
  durationSeconds: number;
  device: DeviceType;
  isRecruiter: boolean;
  visitDate: string; // YYYY-MM-DD
  createdAtIso?: string;
}

export interface RecruiterAlertData {
  id: string;
  ownerUid: string;
  visitId: string;
  visitorName: string;
  visitorRole: string;
  company: string;
  sourceChannel: string;
  sectionViewed: string;
  isRead: boolean;
  createdAtIso: string;
}

export interface DigestSettingsData {
  id?: string;
  ownerUid: string;
  recipientEmail: string;
  enabled: boolean;
  dayOfWeek: DigestDay;
  sendHour: string;
  includeRecruiterLog: boolean;
  includeSocialSync: boolean;
  lastSentAt: string;
  totalSent: number;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
}

export interface SkillItem {
  name: string;
  level: number; // 0-100
  category: string;
}

export interface SocialPlatformStatus {
  platform: 'LinkedIn' | 'Behance' | 'Instagram';
  handle: string;
  url: string;
  connected: boolean;
  reachable: boolean;
  statusNote: string;
  syncedItemsCount: number;
  lastCheckedAt: string;
  ogTitle?: string;
  ogDescription?: string;
}

export interface SocialSyncResponse {
  syncedAt: string;
  platforms: SocialPlatformStatus[];
  discoveredProjects: Array<{
    title: string;
    client: string;
    category: PortfolioCategory;
    sourcePlatform: 'Behance' | 'Instagram' | 'LinkedIn';
    year: string;
    description: string;
    imageUrl: string;
    externalUrl: string;
  }>;
}
