import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50 flex flex-col">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
