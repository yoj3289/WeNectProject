import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { UserType } from '../../types';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [errorMessage, setErrorMessage] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const { signup, isSigningUp, checkEmailAvailability } = useAuth();

  const checkEmailDuplicate = async (email: string) => {
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('올바른 이메일 형식이 아닙니다.');
      return;
    }

    try {
      setIsCheckingEmail(true);
      setErrorMessage('');
      const available = await checkEmailAvailability(email);

      setIsEmailChecked(true);
      setIsEmailAvailable(available);

      if (!available) {
        setErrorMessage('이미 사용 중인 이메일입니다.');
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || '이메일 중복 확인에 실패했습니다.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 검증 (PDF, JPG, PNG만 허용)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('PDF, JPG, PNG 파일만 업로드 가능합니다.');
      return;
    }

    setUploadedFile(file);
    setErrorMessage('');
  };

  const validateForm = (): boolean => {
    // 이메일 중복 확인 여부
    if (!isEmailChecked) {
      setErrorMessage('이메일 중복 확인을 해주세요.');
      return false;
    }

    if (!isEmailAvailable) {
      setErrorMessage('사용할 수 없는 이메일입니다.');
      return false;
    }

    // 필수 필드 확인
    if (!signupEmail || !signupPassword || !signupPasswordConfirm || !signupName || !signupPhone) {
      setErrorMessage('모든 필수 항목을 입력해주세요.');
      return false;
    }

    // 비밀번호 검증
    if (signupPassword.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(signupPassword)) {
      setErrorMessage('비밀번호는 특수문자를 포함해야 합니다.');
      return false;
    }

    if (signupPassword !== signupPasswordConfirm) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return false;
    }

    // 기관 회원인 경우 추가 검증
    if (signupType === 'organization') {
      if (!signupBusinessNumber || !signupRepName) {
        setErrorMessage('기관 회원의 모든 필수 항목을 입력해주세요.');
        return false;
      }
      if (!uploadedFile) {
        setErrorMessage('기관 인증서류를 업로드해주세요.');
        return false;
      }
    }

    return true;
  };


  // 회원가입 방법 변경 시도(기관회원가입 오류로 인함 251101)
  // const handleSignup = async () => {
  //   if (!validateForm()) {
  //     return;
  //   }

  //   try {
  //     setErrorMessage('');

  //     // 회원가입 요청 데이터 생성
  //     const signupData = {
  //       email: signupEmail,
  //       password: signupPassword,
  //       userName: signupName,
  //       phone: signupPhone,
  //       userType: signupType,
  //       ...(signupType === 'organization' && {
  //         organizationName: signupName,
  //         businessNumber: signupBusinessNumber,
  //         representativeName: signupRepName,
  //       }),
  //     };

  //     await signup(signupData);

  //     // 회원가입 성공
  //     alert('회원가입이 완료되었습니다!');
  //     navigate('/login');

  //     // 입력 필드 초기화
  //     setSignupEmail('');
  //     setSignupPassword('');
  //     setSignupPasswordConfirm('');
  //     setSignupName('');
  //     setSignupPhone('');
  //     setSignupBusinessNumber('');
  //     setSignupRepName('');
  //     setUploadedFile(null);
  //     setIsEmailChecked(false);
  //     setIsEmailAvailable(false);
  //   } catch (error: any) {
  //     const message = error.response?.data?.message || '회원가입에 실패했습니다.';
  //     setErrorMessage(message);
  //   }
  // };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setErrorMessage('');

      // FormData로 변환
      const formData = new FormData();

      // JSON 데이터
      const signupData = {
        email: signupEmail,
        password: signupPassword,
        userName: signupName,
        phone: signupPhone,
        userType: signupType.toUpperCase(),
        ...(signupType === 'organization' && {
          organizationName: signupName,
          businessNumber: signupBusinessNumber,
          representativeName: signupRepName,
        }),
      };

      // data 파트 (JSON)
      formData.append('data', new Blob([JSON.stringify(signupData)], {
        type: 'application/json'
      }));

      // file 파트 (기관 회원인 경우)
      if (uploadedFile && signupType === 'organization') {
        formData.append('file', uploadedFile);
      }

      // FormData 전송
      await signup(formData);

      // 회원가입 성공
      alert('회원가입이 완료되었습니다!');
      navigate('/');  // 자동 로그인되므로 홈으로

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
    } catch (error: any) {
      const message = error.response?.data?.message || '회원가입에 실패했습니다.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="w-full">
        <button
          onClick={() => navigate('/login')}
          disabled={isSigningUp}
          className="mb-8 text-gray-600 hover:text-gray-900 font-semibold disabled:text-gray-400"
        >
          ← 로그인으로
        </button>
        <div className="bg-white rounded-2xl p-12 border border-gray-200">
          <h1 className="text-5xl font-bold mb-10">회원가입</h1>

          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          <div className="flex gap-4 mb-10">
            <button
              onClick={() => {
                setSignupType('individual');
                setUploadedFile(null);
              }}
              disabled={isSigningUp}
              className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed ${signupType === 'individual'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              일반 회원
            </button>
            <button
              onClick={() => setSignupType('organization')}
              disabled={isSigningUp}
              className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed ${signupType === 'organization'
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
                  disabled={isSigningUp || isCheckingEmail}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => checkEmailDuplicate(signupEmail)}
                  disabled={isSigningUp || isCheckingEmail || !signupEmail}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition-all whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCheckingEmail ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>확인 중...</span>
                    </>
                  ) : (
                    '중복 확인'
                  )}
                </button>
              </div>
              {isEmailChecked && (
                <div className={`flex items-center gap-2 text-sm mt-2 ${isEmailAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {isEmailAvailable ? (
                    <>
                      <CheckCircle size={16} />
                      <span>사용 가능한 이메일입니다.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} />
                      <span>이미 사용 중인 이메일입니다.</span>
                    </>
                  )}
                </div>
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
                disabled={isSigningUp}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isSigningUp}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isSigningUp}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={isSigningUp}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={isSigningUp}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    disabled={isSigningUp}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      disabled={isSigningUp}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer flex flex-col items-center gap-3 ${isSigningUp ? 'cursor-not-allowed opacity-50' : ''}`}
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
            disabled={isSigningUp}
            className="w-full mt-8 py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSigningUp ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>가입 중...</span>
              </>
            ) : (
              '가입하기'
            )}
          </button>

          <div className="text-center mt-6">
            <span className="text-gray-600">이미 계정이 있으신가요? </span>
            <button
              onClick={() => navigate('/login')}
              disabled={isSigningUp}
              className="text-red-500 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              로그인
            </button>
          </div>

          {/* 백엔드 미구현 안내 (임시) */}
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-bold text-yellow-900 mb-2">⚠️ 개발 중</p>
            <div className="text-xs text-yellow-800 space-y-1">
              <p>• 백엔드 API가 구현되면 실제 회원가입 기능이 작동합니다.</p>
              <p>• 현재는 API 호출이 실패하며 에러 메시지가 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
