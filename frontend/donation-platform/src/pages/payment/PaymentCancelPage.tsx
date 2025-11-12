import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, ArrowLeft } from 'lucide-react';

const PaymentCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      fetch(`http://localhost:8080/api/payments/kakao/cancel?orderId=${orderId}`)
        .catch(err => console.error('취소 처리 오류:', err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-orange-500" size={48} />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">결제 취소</h1>
        <p className="text-gray-600 mb-8">
          기부 결제가 취소되었습니다.
          <br />
          언제든지 다시 시도해주세요!
        </p>

        <div className="bg-orange-50 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-700">
            결제 과정에서 문제가 있으셨나요?
            <br />
            고객센터로 문의주시면 도와드리겠습니다.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            다시 시도하기
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            다른 프로젝트 둘러보기
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelPage;
