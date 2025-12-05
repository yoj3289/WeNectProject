import React, { useState, useEffect } from 'react';
import { X, Heart, CreditCard, Wallet, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { getDonationOptions } from '../../api/projects';
import { apiClient } from '../../lib/apiClient';
import type { DonationOption } from '../../types';

interface DonationModalProps {
  projectId: number;
  projectTitle: string;
  onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ projectId, projectTitle, onClose }) => {
  const { user } = useAuthStore();

  // 기부 옵션 관련 상태
  const [selectedOption, setSelectedOption] = useState<DonationOption | null>(null);
  const [donationOptions, setDonationOptions] = useState<DonationOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // 커스텀 금액 입력 상태
  const [useCustomAmount, setUseCustomAmount] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // 기부자 정보 상태
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'KAKAO_PAY' | 'TOSS_PAY'>('KAKAO_PAY');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 기부 옵션 불러오기
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const options = await getDonationOptions(projectId);
        setDonationOptions(options);
        setOptionsError(null);
      } catch (error: any) {
        console.error('기부 옵션 조회 실패:', error);
        setOptionsError('기부 옵션을 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [projectId]);

  // 로그인한 사용자 정보로 자동 채우기
  useEffect(() => {
    if (user) {
      setDonorName(user.userName || '');
      setDonorEmail(user.email || '');
      setDonorPhone(user.phone || '');
    }
  }, [user]);

  const handleOptionSelect = (option: DonationOption) => {
    setSelectedOption(option);
    setUseCustomAmount(false); // 옵션 선택 시 커스텀 모드 해제
  };

  const handleCustomAmountToggle = () => {
    setUseCustomAmount(true);
    setSelectedOption(null); // 커스텀 모드 시 옵션 선택 해제
  };

  // 최종 기부 금액 계산
  const getFinalAmount = (): number => {
    if (useCustomAmount) {
      const amount = parseInt(customAmount);
      if (isNaN(amount) || amount < 4000) {
        throw new Error('최소 4,000원 이상 기부해주세요.');
      }
      return amount;
    }

    if (!selectedOption) {
      throw new Error('기부 옵션을 선택하거나 금액을 직접 입력해주세요.');
    }

    return selectedOption.amount;
  };

  const handleDonate = async () => {
    // 유효성 검사
    try {
      const amount = getFinalAmount(); // 금액 검증 포함

      if (!donorName.trim()) {
        toast.error('기부자 이름을 입력해주세요.');
        return;
      }

      if (!donorEmail.trim()) {
        toast.error('이메일을 입력해주세요.');
        return;
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(donorEmail)) {
        toast.error('올바른 이메일 형식이 아닙니다.');
        return;
      }

      setIsLoading(true);

      const requestData = {
        projectId: projectId,
        amount: amount,
        selectedOptionId: useCustomAmount ? null : selectedOption?.optionId,
        donorName: donorName,
        donorEmail: donorEmail,
        donorPhone: donorPhone,
        message: message,
        isAnonymous: isAnonymous,
        paymentMethod: paymentMethod
      };

      console.log('=== 결제 준비 요청 데이터 ===');
      console.log('전송 데이터:', requestData);

      if (paymentMethod === 'TOSS_PAY') {
        // 토스페이 결제 준비 API 호출
        const response = await apiClient.post<{
          orderId: string;
          clientKey: string;
          amount: number;
          orderName: string;
          customerKey: string;
          successUrl: string;
          failUrl: string;
        }>('/payments/toss/ready', requestData);

        console.log('=== 토스페이 결제 준비 응답 ===');
        console.log('응답 데이터:', response);

        // 토스페이먼츠 SDK v2 동적 로드 및 결제 요청
        const script = document.createElement('script');
        script.src = 'https://js.tosspayments.com/v2/standard';
        script.onload = async () => {
          try {
            // @ts-ignore - TossPayments SDK v2 API
            const tossPayments = window.TossPayments(response.clientKey);

            // v2에서는 payment 객체를 먼저 생성해야 함
            const payment = tossPayments.payment({
              customerKey: response.customerKey,
            });

            // 결제 요청
            await payment.requestPayment({
              method: 'CARD',
              amount: {
                currency: 'KRW',
                value: response.amount,
              },
              orderId: response.orderId,
              orderName: response.orderName,
              successUrl: response.successUrl,
              failUrl: response.failUrl,
              customerEmail: donorEmail,
              customerName: donorName,
            });
          } catch (error: any) {
            console.error('토스페이 결제 요청 실패:', error);
            if (error.code === 'USER_CANCEL') {
              toast.error('결제가 취소되었습니다.');
            } else {
              toast.error(`결제 요청 실패: ${error.message || '알 수 없는 오류'}`);
            }
          }
        };
        document.head.appendChild(script);
      } else {
        // 카카오페이 결제 준비 API 호출
        const response = await apiClient.post<{ next_redirect_pc_url: string }>('/payments/kakao/ready', requestData);

        console.log('=== 결제 준비 응답 ===');
        console.log('응답 데이터:', response);

        // 카카오페이 결제 페이지로 리다이렉트
        if (response.next_redirect_pc_url) {
          console.log('결제 페이지로 이동:', response.next_redirect_pc_url);
          window.location.href = response.next_redirect_pc_url;
        } else {
          console.error('next_redirect_pc_url이 없습니다:', response);
          toast.error('결제 준비 중 오류가 발생했습니다.');
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes('원 이상')) {
        toast.error(error.message);
        return;
      }

      console.error('=== 결제 준비 실패 ===');
      console.error('에러 객체:', error);
      console.error('에러 메시지:', error.message);
      if (error.response) {
        console.error('응답 상태:', error.response.status);
        console.error('응답 데이터:', error.response.data);
        console.error('응답 헤더:', error.response.headers);
        toast.error(`결제 준비 실패: ${error.response.data.error || error.response.data.message || '알 수 없는 오류'}`);
      } else if (error.request) {
        console.error('요청은 전송되었으나 응답 없음:', error.request);
        toast.error('서버 응답이 없습니다. 백엔드가 실행 중인지 확인해주세요.');
      } else {
        console.error('요청 설정 중 오류:', error.message);
        toast.error('요청 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 bg-stone-800 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Heart className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">기부하기</h2>
              <p className="text-xs text-stone-400 truncate max-w-[250px]">{projectTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-700 rounded-lg transition">
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5 space-y-4">
          {/* 기부 금액 선택 방식 탭 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              기부 금액 선택
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setUseCustomAmount(false);
                  setCustomAmount('');
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${!useCustomAmount
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                옵션 선택
              </button>
              <button
                onClick={handleCustomAmountToggle}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${useCustomAmount
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                직접 입력
              </button>
            </div>
          </div>

          {/* 기부 옵션 선택 또는 커스텀 금액 입력 */}
          <div>
            {useCustomAmount ? (
              /* 커스텀 금액 입력 UI */
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="기부 금액을 입력하세요"
                    className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="1000"
                    step="1000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-500">
                    원
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-500" />
                  <p>최소 <span className="font-semibold text-amber-600">4,000원</span> 이상 기부 가능합니다.</p>
                </div>
                {/* 빠른 금액 선택 버튼 */}
                <div className="grid grid-cols-3 gap-2">
                  {[5000, 10000, 30000, 50000, 100000, 300000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCustomAmount(amount.toString())}
                      className={`py-2 px-3 border rounded-lg transition-all text-sm font-medium ${
                        customAmount === amount.toString()
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      {amount === 5000 ? '5천원' : `${(amount / 10000).toFixed(0)}만원`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* 기부 옵션 선택 UI */
              isLoadingOptions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
              ) : optionsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <p className="text-sm text-red-800">{optionsError}</p>
                </div>
              ) : donationOptions.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-sm font-medium text-amber-800 mb-0.5">등록된 기부 옵션이 없습니다.</p>
                    <p className="text-xs text-amber-700">'직접 입력' 버튼을 눌러 원하시는 금액을 입력해주세요.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {donationOptions.map((option) => (
                    <button
                      key={option.optionId}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${selectedOption?.optionId === option.optionId
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 bg-white hover:border-amber-300'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {option.optionName}
                          </h4>
                          {option.optionDescription && (
                            <p className="text-xs text-gray-500 truncate">
                              {option.optionDescription}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-amber-600 flex-shrink-0">
                          {option.amount.toLocaleString()}원
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* 기부자 정보 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">기부자 정보</label>

            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="이름 *"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              required
            />

            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="이메일 * (영수증 발송용)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              required
            />

            <input
              type="tel"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="전화번호 (선택)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700">
                익명으로 기부하기
              </label>
            </div>
          </div>

          {/* 응원 메시지 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              응원 메시지 (선택)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="프로젝트에 전할 응원 메시지를 작성해주세요."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* 결제 수단 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              결제 수단 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('KAKAO_PAY')}
                className={`py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${paymentMethod === 'KAKAO_PAY'
                    ? 'bg-yellow-400 text-gray-900 border-2 border-yellow-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
              >
                <Wallet size={18} />
                카카오페이
              </button>
              <button
                onClick={() => setPaymentMethod('TOSS_PAY')}
                className={`py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${paymentMethod === 'TOSS_PAY'
                    ? 'bg-blue-500 text-white border-2 border-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
              >
                <CreditCard size={18} />
                토스페이
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleDonate}
            disabled={
              isLoading ||
              (!selectedOption && !useCustomAmount) ||
              (useCustomAmount && !customAmount) ||
              !donorName ||
              !donorEmail
            }
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                처리 중...
              </>
            ) : (
              <>
                <Heart size={18} />
                {paymentMethod === 'KAKAO_PAY' ? '카카오페이로 기부하기' : '토스페이로 기부하기'}
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            기부금은 프로젝트 종료 후 단체에 전달됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
