import React from 'react';
import Header from '../components/common/Header';
import type { PageType, UserType, Notification, UserProfile } from '../types';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  isLoggedIn: boolean;
  userType: UserType;
  notifications: Notification[];
  userProfile: UserProfile;
  handleLogout: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: number) => void;

  //아래 두줄 각각 sms: boolan; 추가
  notificationSettings: Record<string, { enabled: boolean; email: boolean; sms: boolean; push: boolean }>;
  onUpdateNotificationSettings: (settings: Record<string, { enabled: boolean; email: boolean; sms: boolean; push: boolean }>) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentPage,
  setCurrentPage,
  isLoggedIn,
  userType,
  notifications,
  userProfile,
  handleLogout,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  notificationSettings,
  onUpdateNotificationSettings,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isLoggedIn={isLoggedIn}
        userType={userType}
        notifications={notifications}
        userProfile={userProfile}
        handleLogout={handleLogout}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
        onDeleteNotification={onDeleteNotification}
        notificationSettings={notificationSettings}
        onUpdateNotificationSettings={onUpdateNotificationSettings}
      />
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
