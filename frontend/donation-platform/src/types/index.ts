// 공통 타입 정의
export type PageType = 'home' | 'login' | 'projects' | 'detail' | 'signup' | 'create-project' | 'edit-project' | 'community' | 'mypage' | 'profile-edit' | 'admin' | 'admin-users' | 'post-detail' | 'create-post' | 'edit-post' | 'settlement' | 'notifications' | 'donation-history' | 'favorite-projects' | 'piggy-bank' | 'project-approval';
export type UserType = 'individual' | 'organization' | 'admin';
export type TabType = 'intro' | 'progress' | 'donors' | 'messages';

// 프로젝트 관련 타입
export interface Project {
  id: number;
  title: string;
  category: string;
  currentAmount: number;
  targetAmount: number;
  dday: number;
  donors: number;
  image: string;
  description: string;
  organization: string;
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
}

// 기부 관련 타입
export interface RecentDonation {
  name: string;
  amount: number;
  project: string;
  time: string;
}

export interface DonationHistory {
  id: number;
  projectTitle: string;
  amount: number;
  date: string;
  receiptNumber: string;
  status: 'completed' | 'pending';
}

// 저금통 관련 타입
export interface PiggyBank {
  projectId: number;
  projectTitle: string;
  totalAmount: number;
  withdrawnAmount: number;
  balance: number;
  status: 'active' | 'withdrawn' | 'locked' | 'pending_settlement';
  lastUpdated: string;
}

// 커뮤니티 관련 타입
export type PostType = 'NOTICE' | 'QUESTION' | 'SUPPORT' | 'GENERAL';

// UI 표시용 매핑 유틸
export const POST_TYPE_LABELS: Record<PostType, string> = {
  NOTICE: '공지',
  QUESTION: '질문',
  SUPPORT: '응원',
  GENERAL: '일반'
};

export interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
  parentId?: number;
  replies?: Comment[];
}

export interface CommunityPost {
  id: number;
  type: PostType;
  title: string;
  author: string;
  date: string;
  views: number;
  content?: string;
  comments?: Comment[];
}

// 정산 관련 타입
export interface SettlementRequest {
  id: number;
  projectId: number;
  projectTitle: string;
  organization: string;
  requestAmount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
  rejectionReason?: string;
}

// 알림 관련 타입
export interface Notification {
  id: number;
  type: 'donation' | 'project' | 'settlement' | 'comment' | 'reply' | 'project_approval' | 'project_rejection' | 'goal_achieved' | 'deadline_soon';
  category: 'donation' | 'community' | 'project' | 'settlement';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isArchived: boolean;
  link?: string;
  metadata?: {
    projectName?: string;
    amount?: string;
    author?: string;
    postTitle?: string;
    approver?: string;
    donors?: number;
    daysLeft?: number;
    progress?: number;
    reason?: string;
    priority?: 'normal' | 'high';
  };
}

// 사용자 관련 타입
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  notificationSettings: {
    donation: boolean;
    project: boolean;
    comment: boolean;
    newsletter: boolean;
  };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  type: '일반' | '기관';
  status: 'active' | 'inactive' | 'suspended';
  registeredDate: string;
  lastLogin: string;
}
