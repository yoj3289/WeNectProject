import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

const PaymentCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      apiClient.get(`/payments/kakao/cancel?orderId=${orderId}`)
        .catch(err => console.error('취소 처리 오류:', err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="max-w-md w-full bg-white border border-stone-300 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-stone-800 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-orange-500 flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">결제 취소</h1>
          <p className="text-stone-400">기부 결제가 취소되었습니다</p>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 p-4 mb-6 text-center">
            <p className="text-sm text-stone-700">
              결제 과정에서 문제가 있으셨나요?
              <br />
              고객센터로 문의주시면 도와드리겠습니다.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 bg-amber-500 text-white font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              다시 시도하기
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="w-full py-3 bg-stone-800 text-white font-medium hover:bg-stone-900 transition"
            >
              다른 프로젝트 둘러보기
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 border border-stone-300 text-stone-600 font-medium hover:bg-stone-50 transition flex items-center justify-center gap-2"
            >
              <Home size={18} />
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
