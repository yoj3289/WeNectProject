import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, isLoggingIn } = useAuth();

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setErrorMessage('');
      const result = await login({
        email: loginEmail,
        password: loginPassword,
        rememberMe,
      });

      // 거부된 사용자인 경우 재심사 요청 페이지로 이동
      if (result.isRejected && result.rejectionInfo) {
        navigate('/reapply', {
          state: {
            user: result.user,
            rejectionInfo: result.rejectionInfo,
          },
        });
        return;
      }

      // 로그인 성공 시 redirect URL이 있으면 해당 페이지로, 없으면 홈으로 이동
      const redirect = searchParams.get('redirect');
      const openDonation = searchParams.get('openDonation');

      if (redirect) {
        // redirect URL에 openDonation 파라미터 포함
        const redirectUrl = openDonation === 'true'
          ? `${redirect}?openDonation=true`
          : redirect;
        navigate(redirectUrl);
      } else {
        navigate('/');
      }

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
    <div className="w-full max-w-md">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate('/')}
        disabled={isLoggingIn}
        className="mb-6 flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium disabled:text-stone-400"
      >
        <ArrowLeft size={18} />
        <span>홈으로</span>
      </button>

      <div className="bg-white rounded-xl p-8 border border-stone-200 shadow-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="text-amber-500" size={32} fill="currentColor" />
            <span className="text-xl font-bold text-black">위넥트</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-1">로그인</h1>
          <p className="text-sm text-stone-500">따뜻한 나눔에 오신 것을 환영합니다</p>
        </div>

        <div className="space-y-4">
          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 whitespace-pre-line">{errorMessage}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoggingIn}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-stone-700">비밀번호</label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  disabled={isLoggingIn}
                  tabIndex={-1}
                  className="w-3.5 h-3.5 text-amber-500 border-stone-300 rounded focus:ring-amber-500 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-stone-500">표시</span>
              </label>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoggingIn}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoggingIn}
                tabIndex={-1}
                className="w-4 h-4 text-amber-500 border-stone-300 rounded focus:ring-amber-500 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-stone-600">로그인 유지</span>
            </label>
            <button
              className="text-sm text-amber-600 hover:text-amber-700 hover:underline disabled:text-stone-400 disabled:no-underline"
              disabled={isLoggingIn}
              tabIndex={-1}
            >
              비밀번호 찾기
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-3 bg-amber-500 text-stone-900 rounded-lg font-bold hover:bg-amber-400 transition-colors disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>로그인 중...</span>
              </>
            ) : (
              '로그인'
            )}
          </button>

          <div className="text-center pt-2">
            <span className="text-sm text-stone-500">계정이 없으신가요? </span>
            <button
              onClick={() => navigate('/signup')}
              disabled={isLoggingIn}
              className="text-sm text-amber-600 font-semibold hover:underline disabled:text-stone-400 disabled:no-underline"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
