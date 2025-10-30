import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, isLoggingIn } = useAuth();

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setErrorMessage('');
      await login({
        email: loginEmail,
        password: loginPassword,
        rememberMe,
      });

      // 로그인 성공 시 홈으로 이동
      navigate('/');

      // 입력 필드 초기화
      setLoginEmail('');
      setLoginPassword('');
    } catch (error: any) {
      // 에러 처리
      const message = error.response?.data?.message || '로그인에 실패했습니다.';
      setErrorMessage(message);

      // 계정 잠금 에러 처리
      if (error.response?.status === 423) {
        setErrorMessage('계정이 잠겼습니다. 관리자에게 문의해주세요.');
      }
      // 인증 실패 에러 처리
      else if (error.response?.status === 401) {
        const attempts = error.response?.data?.remainingAttempts;
        if (attempts !== undefined) {
          setErrorMessage(
            `로그인 실패. (${5 - attempts}/5회 시도)\n이메일 또는 비밀번호를 확인해주세요.`
          );
        } else {
          setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoggingIn) {
      handleLogin();
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-white rounded-2xl p-12 w-full border border-gray-200 shadow-lg relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 font-semibold"
          disabled={isLoggingIn}
        >
          ← 홈으로
        </button>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-red-500" size={40} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold mb-2">로그인</h1>
          <p className="text-gray-600">따뜻한 나눔에 오신 것을 환영합니다</p>
        </div>

        <div className="space-y-5">
          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800 whitespace-pre-line">{errorMessage}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoggingIn}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoggingIn}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoggingIn}
                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-700">로그인 유지</span>
            </label>
            <button
              className="text-sm text-red-500 hover:underline disabled:text-gray-400 disabled:no-underline"
              disabled={isLoggingIn}
            >
              비밀번호 찾기
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>로그인 중...</span>
              </>
            ) : (
              '로그인'
            )}
          </button>

          <div className="text-center">
            <span className="text-gray-600">계정이 없으신가요? </span>
            <button
              onClick={() => navigate('/signup')}
              disabled={isLoggingIn}
              className="text-red-500 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              회원가입
            </button>
          </div>
        </div>

        {/* 백엔드 미구현 안내 (임시) */}
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-bold text-yellow-900 mb-2">⚠️ 개발 중</p>
          <div className="text-xs text-yellow-800 space-y-1">
            <p>• 백엔드 API가 구현되면 실제 로그인 기능이 작동합니다.</p>
            <p>• 현재는 API 호출이 실패하며 에러 메시지가 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
