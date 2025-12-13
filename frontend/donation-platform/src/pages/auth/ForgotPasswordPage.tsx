import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import {
  checkEmailExists,
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from '../../api/auth';

type Step = 'email' | 'verification' | 'reset' | 'complete';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // 현재 단계
  const [step, setStep] = useState<Step>('email');

  // 이메일 입력 단계
  const [email, setEmail] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // 인증번호 단계
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // 비밀번호 재설정 단계
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 공통
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 타이머 관리
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [remainingTime]);

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 이메일 유효성 검사
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 1단계: 이메일 확인 및 인증번호 발송
  const handleEmailSubmit = async () => {
    if (!email) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setIsCheckingEmail(true);
    setErrorMessage('');

    try {
      // 이메일 존재 여부 확인
      const exists = await checkEmailExists(email);
      if (!exists) {
        setErrorMessage('가입되지 않은 이메일입니다.');
        setIsCheckingEmail(false);
        return;
      }

      // 인증번호 발송
      setIsSendingCode(true);
      await sendPasswordResetCode(email);

      setSuccessMessage('인증번호가 이메일로 발송되었습니다.');
      setRemainingTime(300); // 5분
      setCanResend(false);
      setStep('verification');
    } catch (error: any) {
      const message = error.response?.data?.message || '오류가 발생했습니다. 다시 시도해주세요.';
      setErrorMessage(message);
    } finally {
      setIsCheckingEmail(false);
      setIsSendingCode(false);
    }
  };

  // 인증번호 재발송
  const handleResendCode = async () => {
    if (!canResend && remainingTime > 0) return;

    setIsSendingCode(true);
    setErrorMessage('');

    try {
      await sendPasswordResetCode(email);
      setSuccessMessage('인증번호가 재발송되었습니다.');
      setRemainingTime(300);
      setCanResend(false);
      setVerificationCode('');
    } catch (error: any) {
      const message = error.response?.data?.message || '인증번호 발송에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setIsSendingCode(false);
    }
  };

  // 2단계: 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setErrorMessage('인증번호를 입력해주세요.');
      return;
    }

    if (verificationCode.length !== 6) {
      setErrorMessage('인증번호는 6자리입니다.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await verifyPasswordResetCode(email, verificationCode);
      if (result.verified) {
        setSuccessMessage('인증이 완료되었습니다.');
        setStep('reset');
      } else {
        setErrorMessage(result.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '인증에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setIsVerifying(false);
    }
  };

  // 3단계: 비밀번호 재설정
  const handleResetPassword = async () => {
    if (!newPassword) {
      setErrorMessage('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsResetting(true);
    setErrorMessage('');

    try {
      await resetPassword({
        email,
        code: verificationCode,
        newPassword,
        confirmPassword,
      });
      setStep('complete');
    } catch (error: any) {
      const message = error.response?.data?.message || '비밀번호 변경에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setIsResetting(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  }, []);

  // 이메일 입력 단계 렌더링
  const renderEmailStep = () => (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <Mail className="text-amber-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">비밀번호 찾기</h1>
        <p className="text-sm text-stone-500">
          가입하신 이메일 주소를 입력해주세요.<br />
          인증번호를 발송해드립니다.
        </p>
      </div>

      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">이메일</label>
          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleEmailSubmit)}
            disabled={isCheckingEmail || isSendingCode}
            className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
          />
        </div>

        <button
          onClick={handleEmailSubmit}
          disabled={isCheckingEmail || isSendingCode}
          className="w-full py-3 bg-amber-500 text-stone-900 rounded-lg font-bold hover:bg-amber-400 transition-colors disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCheckingEmail || isSendingCode ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>인증번호 발송 중...</span>
            </>
          ) : (
            '인증번호 발송'
          )}
        </button>
      </div>
    </>
  );

  // 인증번호 입력 단계 렌더링
  const renderVerificationStep = () => (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <Mail className="text-amber-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">인증번호 입력</h1>
        <p className="text-sm text-stone-500">
          <span className="font-medium text-stone-700">{email}</span>로<br />
          발송된 인증번호 6자리를 입력해주세요.
        </p>
      </div>

      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-stone-700">인증번호</label>
            {remainingTime > 0 && (
              <span className="text-sm text-amber-600 font-medium">
                {formatTime(remainingTime)}
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="6자리 인증번호"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyPress={(e) => handleKeyPress(e, handleVerifyCode)}
            disabled={isVerifying}
            maxLength={6}
            className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm text-center tracking-widest text-lg"
          />
        </div>

        <button
          onClick={handleVerifyCode}
          disabled={isVerifying || verificationCode.length !== 6}
          className="w-full py-3 bg-amber-500 text-stone-900 rounded-lg font-bold hover:bg-amber-400 transition-colors disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>확인 중...</span>
            </>
          ) : (
            '인증번호 확인'
          )}
        </button>

        <div className="text-center">
          <button
            onClick={handleResendCode}
            disabled={isSendingCode || (!canResend && remainingTime > 0)}
            className="text-sm text-amber-600 hover:text-amber-700 hover:underline disabled:text-stone-400 disabled:no-underline"
          >
            {isSendingCode ? '발송 중...' : '인증번호 재발송'}
          </button>
        </div>

        <button
          onClick={() => {
            setStep('email');
            setVerificationCode('');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className="w-full py-2 text-stone-500 text-sm hover:text-stone-700"
        >
          이메일 다시 입력
        </button>
      </div>
    </>
  );

  // 비밀번호 재설정 단계 렌더링
  const renderResetStep = () => (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <Lock className="text-amber-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">새 비밀번호 설정</h1>
        <p className="text-sm text-stone-500">
          새로운 비밀번호를 입력해주세요.<br />
          8자 이상으로 설정해주세요.
        </p>
      </div>

      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">새 비밀번호</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="8자 이상 입력"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isResetting}
              className="w-full px-3 py-2.5 pr-10 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {newPassword && newPassword.length < 8 && (
            <p className="text-xs text-red-500 mt-1">비밀번호는 8자 이상이어야 합니다.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">비밀번호 확인</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="비밀번호 재입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleResetPassword)}
              disabled={isResetting}
              className="w-full px-3 py-2.5 pr-10 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
          )}
        </div>

        <button
          onClick={handleResetPassword}
          disabled={isResetting || newPassword.length < 8 || newPassword !== confirmPassword}
          className="w-full py-3 bg-amber-500 text-stone-900 rounded-lg font-bold hover:bg-amber-400 transition-colors disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isResetting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>변경 중...</span>
            </>
          ) : (
            '비밀번호 변경'
          )}
        </button>
      </div>
    </>
  );

  // 완료 단계 렌더링
  const renderCompleteStep = () => (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">비밀번호 변경 완료</h1>
        <p className="text-sm text-stone-500">
          비밀번호가 성공적으로 변경되었습니다.<br />
          새로운 비밀번호로 로그인해주세요.
        </p>
      </div>

      <button
        onClick={() => navigate('/login')}
        className="w-full py-3 bg-amber-500 text-stone-900 rounded-lg font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
      >
        로그인하러 가기
      </button>
    </>
  );

  return (
    <div className="w-full max-w-md">
      {/* 뒤로가기 버튼 */}
      {step !== 'complete' && (
        <button
          onClick={() => navigate('/login')}
          className="mb-6 flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium"
        >
          <ArrowLeft size={18} />
          <span>로그인으로</span>
        </button>
      )}

      <div className="bg-white rounded-xl p-8 border border-stone-200 shadow-sm">
        {step === 'email' && renderEmailStep()}
        {step === 'verification' && renderVerificationStep()}
        {step === 'reset' && renderResetStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
