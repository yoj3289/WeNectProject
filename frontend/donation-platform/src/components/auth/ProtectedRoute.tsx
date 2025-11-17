import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 보호된 라우트 컴포넌트
 * - 로그인이 필요한 페이지를 보호
 * - 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 * - 로그인 후 원래 페이지로 돌아올 수 있도록 redirect 파라미터 전달
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true
}) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (requireAuth && !isLoggedIn) {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    // 현재 경로를 redirect 파라미터로 전달
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
