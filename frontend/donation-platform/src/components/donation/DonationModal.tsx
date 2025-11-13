import React, { useState, useEffect } from 'react';
import { X, Heart, CreditCard, Wallet, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getDonationOptions } from '../../api/projects';
import type { DonationOption } from '../../types';

interface DonationModalProps {
  projectId: number;
  projectTitle: string;
  onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ projectId, projectTitle, onClose }) => {
  const [selectedOption, setSelectedOption] = useState<DonationOption | null>(null);
  const [donationOptions, setDonationOptions] = useState<DonationOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

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

  const handleOptionSelect = (option: DonationOption) => {
    setSelectedOption(option);
  };

  const handleDonate = async () => {
    // 유효성 검사
    if (!selectedOption) {
      alert('기부 옵션을 선택해주세요.');
      return;
    }

    if (!donorName.trim()) {
      alert('기부자 이름을 입력해주세요.');
      return;
    }

    if (!donorEmail.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    if (paymentMethod === 'TOSS_PAY') {
      alert('토스페이는 곧 지원될 예정입니다. 카카오페이를 이용해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        projectId: projectId,
        amount: selectedOption.amount,
        selectedOptionId: selectedOption.optionId,
        donorName: donorName,
        donorEmail: donorEmail,
        donorPhone: donorPhone,
        message: message,
        isAnonymous: isAnonymous,
        paymentMethod: paymentMethod
      };

      console.log('=== 결제 준비 요청 데이터 ===');
      console.log('전송 데이터:', requestData);
      console.log('URL:', 'http://localhost:8080/api/payments/kakao/ready');

      // 카카오페이 결제 준비 API 호출
      const response = await axios.post('http://localhost:8080/api/payments/kakao/ready', requestData);

      console.log('=== 결제 준비 응답 ===');
      console.log('응답 데이터:', response.data);

      // 카카오페이 결제 페이지로 리다이렉트
      if (response.data.next_redirect_pc_url) {
        console.log('결제 페이지로 이동:', response.data.next_redirect_pc_url);
        window.location.href = response.data.next_redirect_pc_url;
      } else {
        console.error('next_redirect_pc_url이 없습니다:', response.data);
        alert('결제 준비 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('=== 결제 준비 실패 ===');
      console.error('에러 객체:', error);
      console.error('에러 메시지:', error.message);
      if (error.response) {
        console.error('응답 상태:', error.response.status);
        console.error('응답 데이터:', error.response.data);
        console.error('응답 헤더:', error.response.headers);
        alert(`결제 준비 실패: ${error.response.data.error || error.response.data.message || '알 수 없는 오류'}`);
      } else if (error.request) {
        console.error('요청은 전송되었으나 응답 없음:', error.request);
        alert('서버 응답이 없습니다. 백엔드가 실행 중인지 확인해주세요.');
      } else {
        console.error('요청 설정 중 오류:', error.message);
        alert('요청 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Heart className="text-red-500" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">기부하기</h2>
              <p className="text-sm text-gray-600 mt-1">{projectTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 기부 옵션 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              기부 옵션 선택
            </label>

            {isLoadingOptions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : optionsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-800">{optionsError}</p>
              </div>
            ) : donationOptions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-yellow-800">등록된 기부 옵션이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {donationOptions.map((option) => (
                  <button
                    key={option.optionId}
                    onClick={() => handleOptionSelect(option)}
                    className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                      selectedOption?.optionId === option.optionId
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">
                          {option.optionName}
                        </h4>
                        {option.optionDescription && (
                          <p className="text-sm text-gray-600 mb-2">
                            {option.optionDescription}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-red-600">
                          {option.amount.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 기부자 정보 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">기부자 정보</label>

            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="이름 *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />

            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="이메일 * (영수증 발송용)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />

            <input
              type="tel"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
              placeholder="전화번호 (선택)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
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
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 결제 수단 선택 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              결제 수단 선택
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('KAKAO_PAY')}
                className={`py-4 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  paymentMethod === 'KAKAO_PAY'
                    ? 'bg-yellow-400 text-gray-900 border-2 border-yellow-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                <Wallet size={20} />
                카카오페이
              </button>
              <button
                onClick={() => setPaymentMethod('TOSS_PAY')}
                disabled
                className="py-4 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent"
              >
                <CreditCard size={20} />
                토스페이 (준비중)
              </button>
            </div>
          </div>

          {/* 금액 요약 */}
          {selectedOption && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 font-medium">선택한 옵션</span>
                <span className="font-semibold text-gray-900">
                  {selectedOption.optionName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">총 기부 금액</span>
                <span className="text-2xl font-bold text-red-600">
                  {selectedOption.amount.toLocaleString()}원
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={handleDonate}
            disabled={isLoading || !selectedOption || !donorName || !donorEmail}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                처리 중...
              </>
            ) : (
              <>
                <Heart size={20} />
                {paymentMethod === 'KAKAO_PAY' ? '카카오페이로 기부하기' : '토스페이로 기부하기'}
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            기부금은 프로젝트 종료 후 단체에 전달됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
