import React, { useState } from 'react';
import { Mail, Loader, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/apiClient';

const TestMailPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTestMail = async () => {
    if (!email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const response = await apiClient.post<{ message: string; email: string }>(
        `/test/mail?email=${encodeURIComponent(email)}`
      );

      setResult({
        success: true,
        message: `${email}로 테스트 메일이 성공적으로 발송되었습니다.`
      });
      toast.success('메일 발송 성공!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '메일 발송에 실패했습니다.';
      setResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              이메일 발송 테스트
            </h1>
            <p className="text-gray-600">
              JavaMailSender를 이용한 테스트 메일 발송
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                수신 이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isSending}
              />
            </div>

            <button
              onClick={handleSendTestMail}
              disabled={isSending}
              className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all flex items-center justify-center gap-2 ${
                isSending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg'
              }`}
            >
              {isSending ? (
                <>
                  <Loader className="animate-spin" size={24} />
                  발송 중...
                </>
              ) : (
                <>
                  <Mail size={24} />
                  테스트 메일 발송
                </>
              )}
            </button>

            {result && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
                  ) : (
                    <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                  )}
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {result.success ? '발송 성공' : '발송 실패'}
                    </h3>
                    <p
                      className={`text-sm ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">테스트 정보</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>발신자: wenect.noreply@gmail.com</li>
              <li>제목: 테스트 메일입니다</li>
              <li>내용: JavaMailSender를 통한 테스트 메일 발송에 성공했습니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMailPage;
