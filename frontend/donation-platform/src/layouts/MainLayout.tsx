import React from 'react';
import Header from '../components/common/Header';
import type { UserType, UserProfile } from '../types';

interface MainLayoutProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  userType: UserType;
  userProfile: UserProfile;
  handleLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isLoggedIn,
  userType,
  userProfile,
  handleLogout,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isLoggedIn={isLoggedIn}
        userType={userType}
        userProfile={userProfile}
        handleLogout={handleLogout}
      />
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;
