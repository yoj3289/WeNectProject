import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, AlertCircle, CheckCircle, X, ChevronRight, ArrowLeft, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type { UserType } from '../../types';

// 이용약관 내용
const TERMS_OF_SERVICE = `제1조 (목적)
이 약관은 WeNect(이하 "회사")가 제공하는 기부 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "서비스"란 회사가 제공하는 온라인 기부 중개 플랫폼을 의미합니다.
② "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.
③ "회원"이란 본 약관에 동의하고 회원가입을 완료한 자를 말합니다.
④ "기부자"란 서비스를 통해 기부금을 전달하는 이용자를 말합니다.
⑤ "기관회원"이란 기부금을 수령하는 비영리단체, 사회적기업 등을 말합니다.

제3조 (약관의 효력 및 변경)
① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
② 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
③ 변경된 약관은 공지 후 7일이 경과한 날부터 효력이 발생합니다.

제4조 (서비스의 제공)
회사는 다음과 같은 서비스를 제공합니다:
① 기부 프로젝트 등록 및 관리 서비스
② 온라인 기부금 결제 중개 서비스
③ 기부 내역 관리 및 영수증 발급 서비스
④ 기부자와 기관 간 커뮤니케이션 서비스
⑤ 기타 회사가 정하는 서비스

제5조 (회원가입)
① 이용자는 회사가 정한 절차에 따라 회원가입을 신청합니다.
② 회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다:
  1. 타인의 명의를 도용한 경우
  2. 허위 정보를 기재한 경우
  3. 기타 회원으로 등록하는 것이 부적절하다고 판단되는 경우

제6조 (회원의 의무)
① 회원은 서비스 이용 시 다음 행위를 하여서는 안 됩니다:
  1. 허위 정보 등록 및 타인의 정보 도용
  2. 회사 및 제3자의 지식재산권 침해
  3. 서비스의 정상적인 운영을 방해하는 행위
  4. 기타 관련 법령에 위반되는 행위
② 회원은 본인의 계정 정보를 안전하게 관리할 책임이 있습니다.

제7조 (기부금 처리)
① 기부자가 결제한 기부금은 회사가 지정한 결제대행사를 통해 처리됩니다.
② 기부금은 프로젝트 종료 후 해당 기관회원에게 전달됩니다.
③ 기부금 환불은 관련 법령 및 회사 정책에 따라 처리됩니다.

제8조 (면책조항)
① 회사는 천재지변, 전쟁, 기타 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.
② 회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.
③ 회사는 기관회원의 프로젝트 운영 및 기부금 사용에 대해 보증하지 않습니다.

제9조 (분쟁해결)
① 본 약관과 관련하여 분쟁이 발생한 경우 회사와 이용자는 상호 협의하여 해결합니다.
② 협의가 이루어지지 않는 경우 관할 법원에 소송을 제기할 수 있습니다.

부칙
본 약관은 2024년 1월 1일부터 시행합니다.`;

const PRIVACY_POLICY = `제1조 (개인정보의 수집 항목)
회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
① 필수 수집 항목: 이메일, 비밀번호, 이름, 연락처
② 기관회원 추가 수집 항목: 기관명, 사업자등록번호, 대표자명, 기관 인증서류
③ 기부 시 수집 항목: 결제 정보, 기부 내역

제2조 (개인정보의 수집 및 이용 목적)
① 회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 부정이용 방지
② 서비스 제공: 기부 중개, 결제 처리, 영수증 발급, 기부 내역 관리
③ 마케팅 및 광고: 이벤트 정보 제공, 서비스 개선을 위한 통계 분석 (선택 동의 시)

제3조 (개인정보의 보유 및 이용 기간)
① 회원 탈퇴 시까지 보유하며, 탈퇴 후 지체 없이 파기합니다.
② 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다:
  - 계약 또는 청약철회 등에 관한 기록: 5년
  - 대금결제 및 재화 등의 공급에 관한 기록: 5년
  - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년

제4조 (개인정보의 제3자 제공)
① 회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
② 다만, 다음의 경우에는 예외로 합니다:
  1. 이용자가 사전에 동의한 경우
  2. 법령의 규정에 의한 경우
  3. 기부금 전달을 위해 기관회원에게 제공하는 경우 (기부자명, 기부금액)

제5조 (개인정보의 파기)
① 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
② 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제합니다.

제6조 (이용자의 권리)
① 이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있습니다.
② 이용자는 회원 탈퇴를 통해 개인정보 처리 정지를 요청할 수 있습니다.

제7조 (개인정보 보호책임자)
개인정보 보호책임자: WeNect 개인정보보호팀
연락처: privacy@wenect.com

부칙
본 방침은 2024년 1월 1일부터 시행합니다.`;

const MARKETING_POLICY = `마케팅 정보 수신 동의

WeNect(이하 "회사")는 회원님께 다양한 혜택과 정보를 제공하기 위해 마케팅 정보 수신 동의를 받고 있습니다.

1. 수집 및 이용 목적
① 신규 기부 프로젝트 안내
② 기부 캠페인 및 이벤트 정보 제공
③ 맞춤형 기부 추천 서비스
④ 서비스 업데이트 및 새로운 기능 안내
⑤ 기부 관련 뉴스레터 발송

2. 수집 항목
① 이메일 주소
② 휴대폰 번호 (SMS 수신 동의 시)

3. 정보 발송 방법
① 이메일
② SMS/MMS
③ 앱 푸시 알림

4. 수신 동의 철회
① 회원님은 언제든지 마케팅 정보 수신 동의를 철회할 수 있습니다.
② 철회 방법: 마이페이지 > 설정 > 알림 설정에서 변경
③ 또는 수신된 이메일/SMS 하단의 '수신거부' 링크 클릭

5. 동의 거부 시 불이익
① 마케팅 정보 수신 동의는 선택 사항입니다.
② 동의하지 않으셔도 서비스 이용에 제한이 없습니다.
③ 단, 유용한 기부 정보 및 이벤트 혜택을 받으실 수 없습니다.

6. 보유 및 이용 기간
① 마케팅 정보 수신 동의일로부터 회원 탈퇴 시 또는 동의 철회 시까지

※ 본 동의는 선택 사항이며, 동의하지 않으셔도 WeNect 서비스를 이용하실 수 있습니다.`;

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  // 스텝 관리 (1: 약관 동의, 2: 정보 입력)
  const [currentStep, setCurrentStep] = useState(1);

  // 회원 유형
  const [signupType, setSignupType] = useState<UserType>('individual');

  // 회원 정보
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

  // 이메일 인증 상태
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [remainingTime, setRemainingTime] = useState(300); // 5분 = 300초

  // 약관 동의 상태
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // 약관 모달 상태
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);

  const { signup, isSigningUp, checkEmailAvailability } = useAuth();

  // 타이머 효과
  React.useEffect(() => {
    if (isVerificationSent && !isVerified && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVerificationSent, isVerified, remainingTime]);

  // 전체 동의 핸들러
  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  // 개별 동의 변경 시 전체 동의 상태 업데이트
  const updateAgreeAll = (terms: boolean, privacy: boolean, marketing: boolean) => {
    setAgreeAll(terms && privacy && marketing);
  };

  // 다음 단계로 이동
  const handleNextStep = () => {
    if (!agreeTerms) {
      setErrorMessage('이용약관에 동의해주세요.');
      return;
    }
    if (!agreePrivacy) {
      setErrorMessage('개인정보 처리방침에 동의해주세요.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(2);
  };

  // 이전 단계로 이동
  const handlePrevStep = () => {
    setErrorMessage('');
    setCurrentStep(1);
  };

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

  // 이메일 인증번호 발송
  const sendVerificationCode = async () => {
    if (!isEmailChecked || !isEmailAvailable) {
      setErrorMessage('이메일 중복 확인을 먼저 해주세요.');
      return;
    }

    try {
      setIsSendingCode(true);
      setErrorMessage('');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/email/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: signupEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '인증번호 발송에 실패했습니다.');
      }

      setIsVerificationSent(true);
      setRemainingTime(300); // 5분 타이머 리셋
      toast.success('인증번호가 이메일로 발송되었습니다.');
    } catch (error: any) {
      setErrorMessage(error.message || '인증번호 발송에 실패했습니다.');
      toast.error(error.message || '인증번호 발송에 실패했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증번호 확인
  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrorMessage('6자리 인증번호를 입력해주세요.');
      return;
    }

    try {
      setIsVerifyingCode(true);
      setErrorMessage('');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/email/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: signupEmail, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '인증에 실패했습니다.');
      }

      if (data.data.verified) {
        setIsVerified(true);
        toast.success('이메일 인증이 완료되었습니다!');
      } else {
        setErrorMessage(data.data.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (error: any) {
      setErrorMessage(error.message || '인증 확인에 실패했습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 남은 시간 포맷팅 (5:00 형식)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

    // 이메일 인증 확인
    if (!isVerified) {
      setErrorMessage('이메일 인증을 완료해주세요.');
      return false;
    }

    // 필수 필드 확인
    if (!signupEmail || !signupPassword || !signupPasswordConfirm || !signupName || !signupPhone) {
      setErrorMessage('모든 필수 항목을 입력해주세요.');
      return false;
    }

    // 전화번호 형식 검증 (010-1234-5678 또는 01012345678)
    const cleanPhone = signupPhone.replace(/-/g, '');
    if (!/^01[016789]\d{7,8}$/.test(cleanPhone)) {
      setErrorMessage('올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)');
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
      // 사업자등록번호 형식 검증 (000-00-00000 또는 0000000000)
      const cleanBusinessNumber = signupBusinessNumber.replace(/-/g, '');
      if (!/^\d{10}$/.test(cleanBusinessNumber)) {
        setErrorMessage('올바른 사업자등록번호 형식이 아닙니다. (예: 000-00-00000)');
        return false;
      }
      if (!uploadedFile) {
        setErrorMessage('기관 인증서류를 업로드해주세요.');
        return false;
      }
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setErrorMessage('');

      // FormData로 변환
      const formData = new FormData();

      // 전화번호 형식 변환 (01012345678 → 010-1234-5678)
      const formatPhone = (phone: string) => {
        const cleaned = phone.replace(/-/g, '');
        if (cleaned.length === 11) {
          return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
        }
        return phone; // 이미 형식이 맞거나 다른 경우 그대로 반환
      };

      // JSON 데이터
      const signupData = {
        email: signupEmail,
        password: signupPassword,
        userName: signupName,
        phone: formatPhone(signupPhone),
        userType: signupType.toUpperCase(),
        agreeMarketing: agreeMarketing,
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
      toast.success('회원가입이 완료되었습니다!');
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

  // 스텝 1: 약관 동의 화면
  const renderStep1 = () => (
    <>
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="text-amber-500" size={28} fill="currentColor" />
          <span className="text-lg font-bold text-stone-800">위넥트</span>
        </div>
        <h1 className="text-xl font-bold text-stone-800 mb-1">회원가입</h1>
        <p className="text-sm text-stone-500">서비스 이용을 위해 약관에 동의해주세요</p>
      </div>

      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* 약관 동의 섹션 */}
      <div className="space-y-3">
        {/* 전체 동의 */}
        <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors border border-stone-200">
          <input
            type="checkbox"
            checked={agreeAll}
            onChange={(e) => handleAgreeAll(e.target.checked)}
            className="w-4 h-4 text-amber-500 border-stone-300 rounded focus:ring-amber-500"
          />
          <span className="font-bold text-stone-800">전체 동의</span>
        </label>

        <div className="space-y-2">
          {/* 이용약관 */}
          <div className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  updateAgreeAll(e.target.checked, agreePrivacy, agreeMarketing);
                }}
                className="w-4 h-4 text-amber-500 border-stone-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-stone-700">
                <span className="text-amber-600 font-bold">[필수]</span> 이용약관 동의
              </span>
            </label>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-xs text-stone-500 hover:text-amber-600 underline px-2"
            >
              보기
            </button>
          </div>

          {/* 개인정보 처리방침 */}
          <div className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => {
                  setAgreePrivacy(e.target.checked);
                  updateAgreeAll(agreeTerms, e.target.checked, agreeMarketing);
                }}
                className="w-4 h-4 text-amber-500 border-stone-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-stone-700">
                <span className="text-amber-600 font-bold">[필수]</span> 개인정보 처리방침 동의
              </span>
            </label>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-xs text-stone-500 hover:text-amber-600 underline px-2"
            >
              보기
            </button>
          </div>

          {/* 마케팅 정보 수신 */}
          <div className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={agreeMarketing}
                onChange={(e) => {
                  setAgreeMarketing(e.target.checked);
                  updateAgreeAll(agreeTerms, agreePrivacy, e.target.checked);
                }}
                className="w-4 h-4 text-amber-500 border-stone-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm text-stone-700">
                <span className="text-stone-400 font-bold">[선택]</span> 마케팅 정보 수신 동의
              </span>
            </label>
            <button
              type="button"
              onClick={() => setShowMarketingModal(true)}
              className="text-xs text-stone-500 hover:text-amber-600 underline px-2"
            >
              보기
            </button>
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={handleNextStep}
        className="w-full mt-6 py-3 bg-amber-500 text-stone-900 rounded-lg font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
      >
        <span>다음</span>
        <ChevronRight size={18} />
      </button>

      <div className="text-center mt-4">
        <span className="text-sm text-stone-500">이미 계정이 있으신가요? </span>
        <button
          onClick={() => navigate('/login')}
          className="text-sm text-amber-600 font-semibold hover:underline"
        >
          로그인
        </button>
      </div>
    </>
  );

  // 스텝 2: 정보 입력 화면
  const renderStep2 = () => (
    <>
      {/* 뒤로가기 버튼 */}
      <button
        onClick={handlePrevStep}
        disabled={isSigningUp}
        className="flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium mb-4 disabled:text-stone-400"
      >
        <ArrowLeft size={18} />
        <span>이전</span>
      </button>

      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-stone-800 mb-1">회원정보 입력</h1>
        <p className="text-sm text-stone-500">회원 정보를 입력해주세요</p>
      </div>

      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* 회원 유형 선택 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setSignupType('individual');
            setUploadedFile(null);
          }}
          disabled={isSigningUp}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors disabled:cursor-not-allowed ${signupType === 'individual'
              ? 'bg-amber-500 text-stone-900'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
        >
          일반 회원
        </button>
        <button
          onClick={() => setSignupType('organization')}
          disabled={isSigningUp}
          className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors disabled:cursor-not-allowed ${signupType === 'organization'
              ? 'bg-amber-500 text-stone-900'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
        >
          기관 회원
        </button>
      </div>

      <div className="space-y-4">
        {/* 이메일 입력 + 중복 확인 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            이메일 <span className="text-amber-600">*</span>
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
                setIsVerificationSent(false);
                setIsVerified(false);
                setVerificationCode('');
              }}
              disabled={isSigningUp || isCheckingEmail || isVerified}
              className="flex-1 px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
            />
            <button
              onClick={() => checkEmailDuplicate(signupEmail)}
              disabled={isSigningUp || isCheckingEmail || !signupEmail || isVerified}
              className="px-4 py-2.5 bg-stone-800 text-white rounded-lg font-medium text-sm hover:bg-stone-900 transition-colors whitespace-nowrap disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCheckingEmail ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>확인 중</span>
                </>
              ) : (
                '중복 확인'
              )}
            </button>
          </div>
          {isEmailChecked && !isVerified && (
            <div className={`flex items-center gap-2 text-xs mt-1.5 ${isEmailAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {isEmailAvailable ? (
                <>
                  <CheckCircle size={14} />
                  <span>사용 가능한 이메일입니다.</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  <span>이미 사용 중인 이메일입니다.</span>
                </>
              )}
            </div>
          )}
          {isVerified && (
            <div className="flex items-center gap-2 text-xs mt-1.5 text-green-600">
              <CheckCircle size={14} />
              <span>이메일 인증이 완료되었습니다.</span>
            </div>
          )}
        </div>

        {/* 인증번호 발송 버튼 (이메일 중복 확인 후 표시) */}
        {isEmailChecked && isEmailAvailable && !isVerified && (
          <div>
            <button
              onClick={sendVerificationCode}
              disabled={isSendingCode || isSigningUp}
              className="w-full py-2.5 bg-stone-700 text-white rounded-lg font-medium text-sm hover:bg-stone-800 transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>발송 중...</span>
                </>
              ) : isVerificationSent ? (
                '인증번호 재발송'
              ) : (
                '인증번호 발송'
              )}
            </button>
          </div>
        )}

        {/* 인증번호 입력 (인증번호 발송 후 표시) */}
        {isVerificationSent && !isVerified && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              인증번호 <span className="text-amber-600">*</span>
              {remainingTime > 0 && (
                <span className="ml-2 text-amber-600 font-normal text-xs">
                  ({formatTime(remainingTime)})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="6자리 숫자"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 6) {
                    setVerificationCode(value);
                  }
                }}
                maxLength={6}
                disabled={isVerifyingCode || isSigningUp || remainingTime === 0}
                className="flex-1 px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
              />
              <button
                onClick={verifyCode}
                disabled={isVerifyingCode || isSigningUp || !verificationCode || verificationCode.length !== 6 || remainingTime === 0}
                className="px-4 py-2.5 bg-amber-500 text-stone-900 rounded-lg font-medium text-sm hover:bg-amber-400 transition-colors whitespace-nowrap disabled:bg-stone-400 disabled:text-stone-600 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isVerifyingCode ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>확인 중</span>
                  </>
                ) : (
                  '인증 확인'
                )}
              </button>
            </div>
            {remainingTime === 0 && (
              <p className="text-xs text-red-500 mt-1">
                인증번호가 만료되었습니다. 재발송 버튼을 눌러주세요.
              </p>
            )}
          </div>
        )}

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            비밀번호 <span className="text-amber-600">*</span>
          </label>
          <input
            type="password"
            placeholder="8자 이상, 특수문자 포함"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            disabled={isSigningUp}
            className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
          />
          <p className="text-xs text-stone-500 mt-1">
            * 8자 이상, 특수문자(!@#$%^&* 등) 포함
          </p>
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            비밀번호 확인 <span className="text-amber-600">*</span>
          </label>
          <input
            type="password"
            placeholder="비밀번호 재입력"
            value={signupPasswordConfirm}
            onChange={(e) => setSignupPasswordConfirm(e.target.value)}
            disabled={isSigningUp}
            className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm ${
              signupPasswordConfirm && signupPassword !== signupPasswordConfirm
                ? 'border-red-500 focus:border-red-500'
                : 'border-stone-300 focus:border-amber-500'
            }`}
          />
          {signupPasswordConfirm && signupPassword !== signupPasswordConfirm && (
            <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
          )}
          {signupPasswordConfirm && signupPassword === signupPasswordConfirm && (
            <p className="text-xs text-green-600 mt-1">비밀번호가 일치합니다.</p>
          )}
        </div>

        {/* 이름/기관명 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            {signupType === 'organization' ? '기관명' : '이름'} <span className="text-amber-600">*</span>
          </label>
          <input
            type="text"
            placeholder={signupType === 'organization' ? '기관명' : '이름'}
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            disabled={isSigningUp}
            className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
          />
        </div>

        {/* 전화번호 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            전화번호 <span className="text-amber-600">*</span>
          </label>
          <input
            type="tel"
            placeholder="010-1234-5678"
            value={signupPhone}
            onChange={(e) => {
              // 숫자만 추출
              const numbers = e.target.value.replace(/[^0-9]/g, '');
              // 자동 하이픈 포맷팅
              let formatted = numbers;
              if (numbers.length > 3 && numbers.length <= 7) {
                formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
              } else if (numbers.length > 7) {
                formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
              }
              setSignupPhone(formatted);
            }}
            maxLength={13}
            disabled={isSigningUp}
            className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
          />
        </div>

        {/* 기관 회원 추가 정보 */}
        {signupType === 'organization' && (
          <>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                사업자등록번호 <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                placeholder="000-00-00000"
                value={signupBusinessNumber}
                onChange={(e) => setSignupBusinessNumber(e.target.value)}
                disabled={isSigningUp}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                대표자명 <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                placeholder="대표자명"
                value={signupRepName}
                onChange={(e) => setSignupRepName(e.target.value)}
                disabled={isSigningUp}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-stone-100 disabled:cursor-not-allowed text-sm"
              />
            </div>

            {/* 기관 인증서류 첨부 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                기관 인증서류 <span className="text-amber-600">*</span>
              </label>
              <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center hover:border-amber-500 transition-all">
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
                  className={`cursor-pointer flex flex-col items-center gap-2 ${isSigningUp ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <Upload className="text-stone-400" size={32} />
                  {uploadedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-stone-800">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-stone-600">
                        클릭하여 파일 업로드
                      </p>
                      <p className="text-xs text-stone-400">
                        PDF, JPG, PNG (최대 5MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                * 사업자등록증, 고유번호증 등 기관을 증명할 수 있는 서류
              </p>
            </div>
          </>
        )}
      </div>

      {/* 가입하기 버튼 */}
      <button
        onClick={handleSignup}
        disabled={isSigningUp || !isVerified}
        className="w-full mt-6 py-3 bg-amber-500 text-stone-900 rounded-lg font-bold hover:bg-amber-400 transition-colors disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSigningUp ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>가입 중...</span>
          </>
        ) : (
          '가입하기'
        )}
      </button>
      {!isVerified && (
        <p className="text-xs text-stone-500 text-center mt-2">
          이메일 인증을 완료하면 가입하기 버튼이 활성화됩니다.
        </p>
      )}

      <div className="text-center mt-4">
        <span className="text-sm text-stone-500">이미 계정이 있으신가요? </span>
        <button
          onClick={() => navigate('/login')}
          disabled={isSigningUp}
          className="text-sm text-amber-600 font-semibold hover:underline disabled:text-stone-400 disabled:no-underline"
        >
          로그인
        </button>
      </div>
    </>
  );

  return (
    <div className="w-full max-w-md">
      <button
        onClick={() => navigate('/login')}
        disabled={isSigningUp}
        className="mb-6 flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium disabled:text-stone-400"
      >
        <ArrowLeft size={18} />
        <span>로그인으로</span>
      </button>

      {/* 진행 상태 표시 */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
          currentStep >= 1 ? 'bg-amber-500 text-stone-900' : 'bg-stone-200 text-stone-500'
        }`}>
          1
        </div>
        <div className={`w-12 h-1 rounded ${currentStep >= 2 ? 'bg-amber-500' : 'bg-stone-200'}`} />
        <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
          currentStep >= 2 ? 'bg-amber-500 text-stone-900' : 'bg-stone-200 text-stone-500'
        }`}>
          2
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </div>

      {/* 이용약관 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h2 className="text-lg font-bold text-stone-800">이용약관</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-stone-700 font-sans leading-relaxed">
                {TERMS_OF_SERVICE}
              </pre>
            </div>
            <div className="p-4 border-t border-stone-200 flex gap-2">
              <button
                onClick={() => {
                  setAgreeTerms(true);
                  updateAgreeAll(true, agreePrivacy, agreeMarketing);
                  setShowTermsModal(false);
                }}
                className="flex-1 py-2.5 bg-amber-500 text-stone-900 font-bold rounded-lg hover:bg-amber-400 transition-colors text-sm"
              >
                동의
              </button>
              <button
                onClick={() => setShowTermsModal(false)}
                className="flex-1 py-2.5 bg-stone-200 text-stone-700 font-bold rounded-lg hover:bg-stone-300 transition-colors text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 처리방침 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h2 className="text-lg font-bold text-stone-800">개인정보 처리방침</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-stone-700 font-sans leading-relaxed">
                {PRIVACY_POLICY}
              </pre>
            </div>
            <div className="p-4 border-t border-stone-200 flex gap-2">
              <button
                onClick={() => {
                  setAgreePrivacy(true);
                  updateAgreeAll(agreeTerms, true, agreeMarketing);
                  setShowPrivacyModal(false);
                }}
                className="flex-1 py-2.5 bg-amber-500 text-stone-900 font-bold rounded-lg hover:bg-amber-400 transition-colors text-sm"
              >
                동의
              </button>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="flex-1 py-2.5 bg-stone-200 text-stone-700 font-bold rounded-lg hover:bg-stone-300 transition-colors text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 마케팅 정보 수신 동의 모달 */}
      {showMarketingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-stone-200">
              <h2 className="text-lg font-bold text-stone-800">마케팅 정보 수신 동의</h2>
              <button
                onClick={() => setShowMarketingModal(false)}
                className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-stone-700 font-sans leading-relaxed">
                {MARKETING_POLICY}
              </pre>
            </div>
            <div className="p-4 border-t border-stone-200 flex gap-2">
              <button
                onClick={() => {
                  setAgreeMarketing(true);
                  updateAgreeAll(agreeTerms, agreePrivacy, true);
                  setShowMarketingModal(false);
                }}
                className="flex-1 py-2.5 bg-amber-500 text-stone-900 font-bold rounded-lg hover:bg-amber-400 transition-colors text-sm"
              >
                동의
              </button>
              <button
                onClick={() => setShowMarketingModal(false)}
                className="flex-1 py-2.5 bg-stone-200 text-stone-700 font-bold rounded-lg hover:bg-stone-300 transition-colors text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupPage;
