import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import type { PageType, UserType } from '../../types';

interface SignupPageProps {
  setCurrentPage: (page: PageType) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setUserType: (type: UserType) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({
  setCurrentPage,
  setIsLoggedIn,
  setUserType
}) => {
  const [signupType, setSignupType] = useState<UserType>('individual');
  const [signupEmail, setSignupEmail] = useState('');
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupBusinessNumber, setSignupBusinessNumber] = useState('');
  const [signupRepName, setSignupRepName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const checkEmailDuplicate = (email: string) => {
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('올바른 이메일 형식이 아닙니다.');
      return;
    }

    // 실제로는 백엔드 API 호출
    const existingEmails = [
      'user@example.com',
      'org@example.com',
      'admin@example.com',
      'test@test.com'
    ];

    const isDuplicate = existingEmails.includes(email);

    setIsEmailChecked(true);
    setIsEmailAvailable(!isDuplicate);

    if (isDuplicate) {
      alert('이미 사용 중인 이메일입니다.');
    } else {
      alert('사용 가능한 이메일입니다.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 검증 (PDF, JPG, PNG만 허용)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('PDF, JPG, PNG 파일만 업로드 가능합니다.');
      return;
    }

    setUploadedFile(file);
    alert(`파일이 업로드되었습니다: ${file.name}`);
  };

  const handleSignup = () => {
    // 이메일 중복 확인 여부
    if (!isEmailChecked) {
      alert('이메일 중복 확인을 해주세요.');
      return;
    }

    if (!isEmailAvailable) {
      alert('사용할 수 없는 이메일입니다.');
      return;
    }

    // 비밀번호 검증
    if (signupPassword.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(signupPassword)) {
      alert('비밀번호는 특수문자를 포함해야 합니다.');
      return;
    }

    if (signupPassword !== signupPasswordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 기관 회원인 경우 서류 확인
    if (signupType === 'organization' && !uploadedFile) {
      alert('기관 인증서류를 업로드해주세요.');
      return;
    }

    // 회원가입 성공
    alert('회원가입이 완료되었습니다!');
    setIsLoggedIn(true);
    setUserType(signupType);
    setCurrentPage('home');

    // 입력 필드 초기화
    setSignupEmail('');
    setSignupPassword('');
    setSignupPasswordConfirm('');
    setSignupName('');
    setSignupPhone('');
    setSignupBusinessNumber('');
    setSignupRepName('');
    setUploadedFile(null);
    setIsEmailChecked(false);
    setIsEmailAvailable(false);
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="w-full">
        <button
          onClick={() => setCurrentPage('login')}
          className="mb-8 text-gray-600 hover:text-gray-900 font-semibold"
        >
          ← 로그인으로
        </button>
        <div className="bg-white rounded-2xl p-12 border border-gray-200">
          <h1 className="text-5xl font-bold mb-10">회원가입</h1>

          <div className="flex gap-4 mb-10">
            <button
              onClick={() => {
                setSignupType('individual');
                setUploadedFile(null);
              }}
              className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all ${
                signupType === 'individual'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              일반 회원
            </button>
            <button
              onClick={() => setSignupType('organization')}
              className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all ${
                signupType === 'organization'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              기관 회원
            </button>
          </div>

          <div className="space-y-6">
            {/* 이메일 입력 + 중복 확인 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={signupEmail}
                  onChange={(e) => {
                    setSignupEmail(e.target.value);
                    setIsEmailChecked(false);
                    setIsEmailAvailable(false);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={() => checkEmailDuplicate(signupEmail)}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition-all whitespace-nowrap"
                >
                  중복 확인
                </button>
              </div>
              {isEmailChecked && (
                <p className={`text-sm mt-2 ${isEmailAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {isEmailAvailable ? '✓ 사용 가능한 이메일입니다.' : '✗ 이미 사용 중인 이메일입니다.'}
                </p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="8자 이상, 특수문자 포함"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                * 8자 이상, 특수문자(!@#$%^&* 등) 포함
              </p>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="비밀번호 재입력"
                value={signupPasswordConfirm}
                onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            {/* 이름/기관명 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {signupType === 'organization' ? '기관명' : '이름'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={signupType === 'organization' ? '기관명' : '이름'}
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="010-1234-5678"
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            {/* 기관 회원 추가 정보 */}
            {signupType === 'organization' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    사업자등록번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="000-00-00000"
                    value={signupBusinessNumber}
                    onChange={(e) => setSignupBusinessNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    대표자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="대표자명"
                    value={signupRepName}
                    onChange={(e) => setSignupRepName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* 기관 인증서류 첨부 */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    기관 인증서류 <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-500 transition-all">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <Upload className="text-gray-400" size={48} />
                      {uploadedFile ? (
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(uploadedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">
                            클릭하여 파일 업로드
                          </p>
                          <p className="text-xs text-gray-400">
                            PDF, JPG, PNG (최대 5MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * 사업자등록증, 고유번호증 등 기관을 증명할 수 있는 서류
                  </p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSignup}
            className="w-full mt-8 py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all"
          >
            가입하기
          </button>

          <div className="text-center mt-6">
            <span className="text-gray-600">이미 계정이 있으신가요? </span>
            <button
              onClick={() => setCurrentPage('login')}
              className="text-red-500 font-semibold hover:underline"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
