// 공통 타입 정의
export type PageType = 'home' | 'login' | 'projects' | 'detail' | 'signup' | 'create-project' | 'edit-project' | 'community' | 'mypage' | 'profile-edit' | 'admin' | 'admin-users' | 'post-detail' | 'create-post' | 'edit-post' | 'settlement' | 'notifications' | 'donation-history' | 'favorite-projects' | 'piggy-bank' | 'project-approval';
export type UserType = 'individual' | 'organization' | 'admin';
export type TabType = 'intro' | 'budget' | 'progress' | 'donors' | 'messages';

// 기부 옵션 타입
export interface DonationOption {
  optionId?: number;
  projectId?: number;
  optionName: string;
  optionDescription?: string;
  amount: number;
  iconEmoji?: string;
  displayOrder?: number;
  isActive?: boolean;
}

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
  userId: number; // 프로젝트 작성자 ID
  budgetPlan?: string;              // 기부금 사용계획
  planDocumentUrl?: string;         // 사용계획서 파일 URL
  isPlanPublic?: boolean;           // 계획서 공개 여부
  donationOptions?: DonationOption[]; // 기부 옵션 목록
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
  selectedOptionId?: number;         // 선택한 옵션 ID
  selectedOptionName?: string;       // 선택한 옵션명
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

// 카테고리 영어 -> 한글 매핑
export const CATEGORY_LABELS: Record<string, string> = {
  'Child Welfare': '아동복지',
  'Elder Care': '노인복지',
  'Disability Support': '장애인복지',
  'Animal Protection': '동물보호',
  'Environment': '환경보호',
  'Education': '교육',
  'Others': '기타'
};

// 카테고리 변환 함수
export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category;
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
