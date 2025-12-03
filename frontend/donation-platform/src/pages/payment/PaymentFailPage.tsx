import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

const PaymentFailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      apiClient.get(`/payments/kakao/fail?orderId=${orderId}`)
        .catch(err => console.error('실패 처리 오류:', err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="max-w-md w-full bg-white border border-stone-300 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-stone-800 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">결제 실패</h1>
          <p className="text-stone-400">결제 처리 중 오류가 발생했습니다</p>
        </div>

        {/* 본문 */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-xs font-medium text-red-800 uppercase tracking-wider mb-2">자주 발생하는 문제</p>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• 카드 한도 초과</li>
              <li>• 네트워크 연결 불안정</li>
              <li>• 카드 정보 오류</li>
              <li>• 결제 승인 거부</li>
            </ul>
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

          <p className="text-xs text-stone-400 mt-6 text-center">
            계속 문제가 발생하면 고객센터로 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailPage;
