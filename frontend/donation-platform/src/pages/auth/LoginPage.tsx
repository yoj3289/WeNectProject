import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import type { PageType, UserType } from '../../types';

interface LoginPageProps {
  setCurrentPage: (page: PageType) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setUserType: (type: UserType) => void;
  loginAttempts: Map<string, number>;
  setLoginAttempts: (attempts: Map<string, number>) => void;
  lockedAccounts: Set<string>;
  setLockedAccounts: (locked: Set<string>) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  setCurrentPage,
  setIsLoggedIn,
  setUserType,
  loginAttempts,
  setLoginAttempts,
  lockedAccounts,
  setLockedAccounts
}) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (email: string, password: string, remember: boolean) => {
    // 계정 잠금 확인
    if (lockedAccounts.has(email)) {
      alert('계정이 잠겼습니다. 관리자에게 문의해주세요.');
      return;
    }

    // 데모 계정 확인 (실제로는 백엔드 API 호출)
    const demoAccounts = {
      'user@example.com': { password: 'password123', type: 'individual' as UserType },
      'org@example.com': { password: 'password123', type: 'organization' as UserType },
      'admin@example.com': { password: 'admin123', type: 'admin' as UserType }
    };

    const account = demoAccounts[email as keyof typeof demoAccounts];

    if (account && account.password === password) {
      // 로그인 성공
      setIsLoggedIn(true);
      setUserType(account.type);
      setCurrentPage('home');

      // JWT 토큰 생성 시뮬레이션
      const mockToken = btoa(JSON.stringify({
        email,
        type: account.type,
        exp: Date.now() + (remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
      }));

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('jwt_token', mockToken);
        window.localStorage.setItem('user_type', account.type);
        if (remember) {
          window.localStorage.setItem('remember_me', 'true');
        }
      }

      // 로그인 시도 횟수 초기화
      const newAttempts = new Map(loginAttempts);
      newAttempts.delete(email);
      setLoginAttempts(newAttempts);

      alert(`${account.type === 'admin' ? '관리자' : account.type === 'organization' ? '기관' : '일반'} 계정으로 로그인되었습니다.`);

      // 입력 필드 초기화
      setLoginEmail('');
      setLoginPassword('');
    } else {
      // 로그인 실패
      const attempts = (loginAttempts.get(email) || 0) + 1;
      const newAttempts = new Map(loginAttempts);
      newAttempts.set(email, attempts);
      setLoginAttempts(newAttempts);

      if (attempts >= 5) {
        // 계정 잠금
        const newLocked = new Set(lockedAccounts);
        newLocked.add(email);
        setLockedAccounts(newLocked);
        alert('비밀번호를 5회 잘못 입력하여 계정이 잠겼습니다. 관리자에게 문의해주세요.');
      } else {
        alert(`로그인 실패. (${attempts}/5회 시도)\n이메일 또는 비밀번호를 확인해주세요.`);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="bg-white rounded-2xl p-12 w-full border border-gray-200 shadow-lg relative">
        <button
          onClick={() => setCurrentPage('home')}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 font-semibold"
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
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin(loginEmail, loginPassword, rememberMe);
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin(loginEmail, loginPassword, rememberMe);
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">로그인 유지</span>
            </label>
            <button className="text-sm text-red-500 hover:underline">
              비밀번호 찾기
            </button>
          </div>

          <button
            onClick={() => handleLogin(loginEmail, loginPassword, rememberMe)}
            className="w-full py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all"
          >
            로그인
          </button>

          <div className="text-center">
            <span className="text-gray-600">계정이 없으신가요? </span>
            <button
              onClick={() => setCurrentPage('signup')}
              className="text-red-500 font-semibold hover:underline"
            >
              회원가입
            </button>
          </div>
        </div>

        {/* 데모 계정 안내 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-bold text-blue-900 mb-2">💡 데모 계정 안내</p>
          <div className="text-xs text-blue-800 space-y-1">
            <p>• 일반 회원: user@example.com / password123</p>
            <p>• 기관 회원: org@example.com / password123</p>
            <p>• 관리자: admin@example.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
