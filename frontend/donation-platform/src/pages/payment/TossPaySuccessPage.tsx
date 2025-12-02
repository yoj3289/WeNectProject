import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Heart, Home, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

const TossPaySuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isConfirmingRef = useRef(false);

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const projectId = searchParams.get('projectId');

  // 결제 성공 페이지에서 뒤로가기 방지
  useEffect(() => {
    window.history.replaceState(null, '', window.location.href);

    const handlePopState = () => {
      navigate('/', { replace: true });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  useEffect(() => {
    const confirmPayment = async () => {
      if (isConfirmingRef.current) return;
      isConfirmingRef.current = true;

      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        const response = await apiClient.post<any>('/payments/toss/confirm', {
          paymentKey,
          orderId,
          amount: parseInt(amount)
        });

        if (response.status === 'already_completed' || response.status === 'success') {
          console.log('결제 처리 완료:', response);
        }

        setIsProcessing(false);
      } catch (err: any) {
        console.error('토스페이 결제 승인 실패:', err);
        const errorMsg = err.response?.data?.error || '결제 승인 중 오류가 발생했습니다.';

        if (errorMsg.includes('기존 요청을 처리중') || errorMsg.includes('FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING')) {
          setTimeout(() => setIsProcessing(false), 1500);
          return;
        }

        setError(errorMsg);
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-medium">기부 처리 중입니다...</p>
          <p className="text-stone-400 text-sm mt-1">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <div className="max-w-md w-full bg-white border border-stone-300 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">결제 오류</h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-3 bg-stone-800 text-white font-medium hover:bg-stone-900 transition flex items-center justify-center gap-2"
          >
            <Home size={18} />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="max-w-md w-full bg-white border border-stone-300 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-stone-800 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-green-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">기부 완료!</h1>
          <p className="text-stone-400">따뜻한 마음 감사합니다</p>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 p-5 mb-6">
            <Heart className="text-amber-500 mx-auto mb-3" size={28} />
            <p className="text-sm text-stone-700 leading-relaxed text-center">
              여러분의 기부가 세상을 더 나은 곳으로 만듭니다.
              <br />
              진심으로 감사드립니다.
            </p>
          </div>

          {amount && (
            <div className="bg-stone-50 border border-stone-200 p-4 mb-6 text-center">
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">기부 금액</p>
              <p className="text-2xl font-bold text-amber-600">{parseInt(amount).toLocaleString()}원</p>
            </div>
          )}

          <div className="space-y-3">
            {projectId && (
              <button
                onClick={() => navigate(`/projects/${projectId}`, { replace: true })}
                className="w-full py-3 bg-amber-500 text-white font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2"
              >
                <Heart size={18} />
                기부한 프로젝트로 돌아가기
              </button>
            )}
            <button
              onClick={() => navigate('/projects', { replace: true })}
              className="w-full py-3 bg-stone-800 text-white font-medium hover:bg-stone-900 transition flex items-center justify-center gap-2"
            >
              다른 프로젝트 둘러보기
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full py-3 border border-stone-300 text-stone-600 font-medium hover:bg-stone-50 transition flex items-center justify-center gap-2"
            >
              <Home size={18} />
              홈으로 돌아가기
            </button>
          </div>

          <p className="text-xs text-stone-400 mt-6 text-center">
            기부 영수증은 이메일로 발송됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TossPaySuccessPage;
