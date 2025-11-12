import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

const PaymentFailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      fetch(`http://localhost:8080/api/payments/kakao/fail?orderId=${orderId}`)
        .catch(err => console.error('실패 처리 오류:', err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-red-500" size={48} />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">결제 실패</h1>
        <p className="text-gray-600 mb-8">
          결제 처리 중 오류가 발생했습니다.
          <br />
          다시 시도해주세요.
        </p>

        <div className="bg-red-50 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-700 font-semibold mb-2">자주 발생하는 문제</p>
          <ul className="text-xs text-left text-gray-600 space-y-1">
            <li>• 카드 한도 초과</li>
            <li>• 네트워크 연결 불안정</li>
            <li>• 카드 정보 오류</li>
            <li>• 결제 승인 거부</li>
          </ul>
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

        <p className="text-xs text-gray-500 mt-6">
          계속 문제가 발생하면 고객센터로 문의해주세요.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailPage;
