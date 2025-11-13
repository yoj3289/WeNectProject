import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Heart, Home } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pgToken = searchParams.get('pg_token');
  const orderId = searchParams.get('orderId');
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    const approvePayment = async () => {
      if (!pgToken || !orderId) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/payments/kakao/success?pg_token=${pgToken}&orderId=${orderId}`
        );

        if (!response.ok) {
          throw new Error('결제 승인에 실패했습니다.');
        }

        setIsProcessing(false);
      } catch (err) {
        console.error('결제 승인 실패:', err);
        setError('결제 승인 중 오류가 발생했습니다.');
        setIsProcessing(false);
      }
    };

    approvePayment();
  }, [pgToken, orderId]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">기부 처리중입니다...</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">오류 발생</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="text-green-500" size={48} />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">기부 완료!</h1>
        <p className="text-gray-600 mb-8">따뜻한 마음 감사합니다.</p>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <Heart className="text-red-500 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-700 leading-relaxed">
            여러분의 기부가 세상을 더 나은 곳으로 만듭니다.
            <br />
            진심으로 감사드립니다.
          </p>
        </div>

        <div className="space-y-3">
          {projectId && (
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-pink-600 transition flex items-center justify-center gap-2"
            >
              <Heart size={20} />
              기부한 프로젝트로 돌아가기
            </button>
          )}
          <button
            onClick={() => navigate('/projects')}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
          >
            다른 프로젝트 둘러보기
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            홈으로 돌아가기
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          기부 영수증은 이메일로 발송됩니다.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
