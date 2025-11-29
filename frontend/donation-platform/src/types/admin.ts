// 관리자 대시보드 Props
export interface AdminDashboardProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  projectFilter: string;
  setProjectFilter: (filter: string) => void;
  projectCategoryFilter: string;
  setProjectCategoryFilter: (filter: string) => void;
  projectSearchTerm: string;
  setProjectSearchTerm: (term: string) => void;
  userTypeFilter: string;
  setUserTypeFilter: (filter: string) => void;
  userStatusFilter: string;
  setUserStatusFilter: (filter: string) => void;
  userSearchTerm: string;
  setUserSearchTerm: (term: string) => void;
  settlementFilter: string;
  setSettlementFilter: (filter: string) => void;
  settlementSearchTerm: string;
  setSettlementSearchTerm: (term: string) => void;
  selectedProjects: number[];
  setSelectedProjects: (projects: number[]) => void;
  selectedUsers: number[];
  setSelectedUsers: (users: number[]) => void;
  selectedSettlements: number[];
  setSelectedSettlements: (settlements: number[]) => void;
  selectedProject: any;
  setSelectedProject: (project: any) => void;
  selectedUser: any;
  setSelectedUser: (user: any) => void;
  selectedSettlement: any;
  setSelectedSettlement: (settlement: any) => void;
  showProjectModal: boolean;
  setShowProjectModal: (show: boolean) => void;
  showUserModal: boolean;
  setShowUserModal: (show: boolean) => void;
  showSettlementModal: boolean;
  setShowSettlementModal: (show: boolean) => void;
}

// 시스템 메트릭 타입
export interface SystemMetrics {
  cpuUsage: number;
  memory: MemoryInfo;
  disk: DiskInfo;
  jvm: JvmInfo;
  system: SystemInfo;
  database: DatabaseInfo;
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  usagePercent: number;
}

export interface DiskInfo {
  total: number;
  free: number;
  used: number;
  usagePercent: number;
}

export interface JvmInfo {
  totalMemory: number;
  freeMemory: number;
  maxMemory: number;
  usedMemory: number;
  activeThreads: number;
}

export interface SystemInfo {
  osName: string;
  osVersion: string;
  osArch: string;
  availableProcessors: number;
  uptime: number;
}

export interface DatabaseInfo {
  isConnected: boolean;
  activeConnections: number | null;
  maxConnections: number | null;
  databaseType: string;
  databaseVersion: string;
  responseTime: number;
}
