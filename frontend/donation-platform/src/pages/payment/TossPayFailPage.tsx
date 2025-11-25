import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, RefreshCw } from 'lucide-react';

const TossPayFailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get('code');
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-red-500" size={48} />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">결제 실패</h1>
        <p className="text-gray-600 mb-4">결제 처리 중 문제가 발생했습니다.</p>

        {message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{decodeURIComponent(message)}</p>
            {code && (
              <p className="text-xs text-red-600 mt-1">오류 코드: {code}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            다시 시도하기
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            프로젝트 둘러보기
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-50 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            홈으로 돌아가기
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          문제가 계속되면 고객센터로 문의해주세요.
        </p>
      </div>
    </div>
  );
};

export default TossPayFailPage;
