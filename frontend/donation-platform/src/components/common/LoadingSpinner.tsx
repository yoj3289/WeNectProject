import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

/**
 * 로딩 스피너 컴포넌트
 * - 명확한 로딩 상태 표시
 * - 다양한 크기 지원
 * - 전체 화면 또는 인라인 사용 가능
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = '로딩 중...',
  subMessage,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* 스피너 */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-stone-200 border-t-amber-500 animate-spin`}
        />
        {/* 내부 펄스 효과 */}
        {size !== 'sm' && (
          <div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-transparent border-t-amber-300 animate-ping opacity-20`}
          />
        )}
      </div>

      {/* 메시지 */}
      {message && (
        <div className="text-center">
          <p className={`${textSizeClasses[size]} font-medium text-stone-700 animate-pulse`}>
            {message}
          </p>
          {subMessage && (
            <p className="text-sm text-stone-500 mt-1">{subMessage}</p>
          )}
        </div>
      )}

      {/* 로딩 도트 애니메이션 */}
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
