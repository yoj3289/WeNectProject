import React, { useState } from 'react';
import { X, CreditCard, Building, DollarSign } from 'lucide-react';
import type { Project } from '../../types';

interface DonationModalProps {
  selectedProject: Project | null;
  showDonationModal: boolean;
  setShowDonationModal: (show: boolean) => void;
  formatAmount: (amount: number) => string;
}

const DonationModal: React.FC<DonationModalProps> = ({
  selectedProject,
  showDonationModal,
  setShowDonationModal,
  formatAmount
}) => {
  // Donation form states
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [donationMessage, setDonationMessage] = useState<string>('');

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  // Donation handler
  const handleDonation = () => {
    const amount = customAmount ? parseInt(customAmount) : donationAmount;
    if (!amount || amount <= 0) {
      alert('기부 금액을 입력해주세요.');
      return;
    }
    if (!donorName && !isAnonymous) {
      alert('기부자명을 입력하거나 익명을 선택해주세요.');
      return;
    }
    setShowPaymentModal(true);
  };

  // Payment handler
  const handlePayment = () => {
    if (!paymentMethod) {
      alert('결제 수단을 선택해주세요.');
      return;
    }

    // TODO: 토스페이먼츠 API 연동
    // 실제 구현 시 여기에 토스페이먼츠 결제 요청 로직 추가

    alert('결제가 완료되었습니다! 기부해주셔서 감사합니다.');

    // Reset all states
    setShowPaymentModal(false);
    setShowDonationModal(false);
    setDonationAmount(0);
    setCustomAmount('');
    setDonorName('');
    setIsAnonymous(false);
    setDonationMessage('');
    setPaymentMethod('');
  };

  if (!showDonationModal) return null;

  return (
    <>
      {/* Donation Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="max-w-2xl w-full bg-white rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">기부하기</h2>
            <button
              onClick={() => setShowDonationModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {selectedProject && (
            <>
              {/* Project Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-lg mb-2">{selectedProject.title}</h3>
                <p className="text-gray-600 text-sm">{selectedProject.organization}</p>
              </div>

              <div className="space-y-6">
                {/* Donation Amount Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">기부 금액</label>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {[10000, 30000, 50000, 100000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => {
                          setDonationAmount(amount);
                          setCustomAmount('');
                        }}
                        className={`py-3 rounded-lg font-bold transition-all ${
                          donationAmount === amount && !customAmount
                            ? 'bg-red-500 text-white'
                            : 'border border-gray-300 hover:border-red-500'
                        }`}
                      >
                        {formatAmount(amount)}원
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="직접 입력"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setDonationAmount(0);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Donor Information */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">기부자 정보</label>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="이름을 입력해주세요"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      disabled={isAnonymous}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-100"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => {
                          setIsAnonymous(e.target.checked);
                          if (e.target.checked) setDonorName('');
                        }}
                        className="w-5 h-5"
                      />
                      <span className="font-semibold">익명</span>
                    </label>
                  </div>
                </div>

                {/* Support Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">응원 메시지</label>
                  <textarea
                    placeholder="따뜻한 응원의 메시지를 남겨주세요 (선택)"
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleDonation}
                  className="w-full py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all"
                >
                  {customAmount ? formatAmount(parseInt(customAmount)) : formatAmount(donationAmount)}원 기부하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full bg-white rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">결제 수단 선택</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Payment Amount */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">결제 금액</span>
                <span className="text-2xl font-bold text-red-500">
                  {formatAmount(customAmount ? parseInt(customAmount) : donationAmount)}원
                </span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3 mb-6">
              {/* Credit/Debit Card */}
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  paymentMethod === 'card'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-500'
                }`}
              >
                <CreditCard size={24} />
                <div className="text-left">
                  <div className="font-bold">신용/체크카드</div>
                  <div className="text-sm text-gray-600">간편하게 카드로 결제</div>
                </div>
              </button>

              {/* Bank Transfer */}
              <button
                onClick={() => setPaymentMethod('transfer')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  paymentMethod === 'transfer'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-500'
                }`}
              >
                <Building size={24} />
                <div className="text-left">
                  <div className="font-bold">계좌이체</div>
                  <div className="text-sm text-gray-600">은행 계좌로 이체</div>
                </div>
              </button>

              {/* Simple Payment (Toss, Kakao Pay, etc.) */}
              <button
                onClick={() => setPaymentMethod('simple')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                  paymentMethod === 'simple'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-500'
                }`}
              >
                <DollarSign size={24} />
                <div className="text-left">
                  <div className="font-bold">간편결제</div>
                  <div className="text-sm text-gray-600">토스, 카카오페이 등</div>
                </div>
              </button>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={!paymentMethod}
              className="w-full py-4 bg-red-500 text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              결제하기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DonationModal;
