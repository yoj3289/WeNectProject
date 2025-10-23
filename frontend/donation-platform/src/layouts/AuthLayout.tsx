import React from 'react';
import { Heart } from 'lucide-react';
import type { PageType } from '../types';

interface AuthLayoutProps {
  children: React.ReactNode;
  setCurrentPage: (page: PageType) => void;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50 flex flex-col">
      {/* 로고 헤더 */}
      <div className="p-6">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center space-x-2 text-rose-600 hover:text-rose-700 transition-colors"
        >
          <Heart className="w-8 h-8 fill-current" />
          <span className="text-2xl font-bold">위넥트</span>
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
