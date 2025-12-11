import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 페이지 이동 시 스크롤을 맨 위로 이동시키는 컴포넌트
 * BrowserRouter 내부에서 사용해야 합니다.
 * - pathname 변경 시 스크롤 최상단 이동
 * - search params (tab 등) 변경 시에도 스크롤 최상단 이동
 */
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 페이지 이동 또는 탭 변경 시 스크롤을 맨 위로
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
