import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type { UserType } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedUserTypes?: UserType[];
}

/**
 * 보호된 라우트 컴포넌트
 * - 로그인이 필요한 페이지를 보호
 * - 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
 * - 로그인 후 원래 페이지로 돌아올 수 있도록 redirect 파라미터 전달
 * - allowedUserTypes로 특정 사용자 타입만 접근 허용 가능
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedUserTypes
}) => {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const hasShownToast = useRef(false);

  // 권한 체크
  const hasPermission = !allowedUserTypes || !user || allowedUserTypes.includes(user.userType);

  // 권한 없을 때 toast 표시 (렌더링 후 useEffect에서 실행)
  useEffect(() => {
    if (!hasPermission && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error('접근 권한이 없습니다.');
    }
  }, [hasPermission]);

  if (requireAuth && !isLoggedIn) {
    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    // 현재 경로를 redirect 파라미터로 전달
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // allowedUserTypes가 지정된 경우, 사용자 타입 확인
  if (!hasPermission) {
    // 권한이 없는 경우 메인 페이지로 리다이렉트
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
