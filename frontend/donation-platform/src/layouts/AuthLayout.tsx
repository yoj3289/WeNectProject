import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50 flex flex-col">
      {/* 로고 헤더 */}
      <div className="p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 transition-colors"
        >
          <Heart className="w-8 h-8 fill-current text-amber-500" />
          <span className="text-2xl font-bold text-black">위넥트</span>
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
