import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, TrendingDown, Calendar, FileText, Download, AlertCircle } from 'lucide-react';
import { usePiggyBankByProject, usePiggyBankDetail } from '../../hooks/usePiggyBanks';
import { WithdrawalModal } from '../../components/piggybank/WithdrawalModal';
import { SettlementRequestModal } from '../../components/settlement/SettlementRequestModal';

/**
 * 저금통 관리 페이지
 * - 저금통 상세 정보 조회
 * - 인출 내역 확인
 * - 카테고리별 통계
 * - 인출 요청
 * - 정산 요청
 */
const PiggyBankManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // API: projectId로 먼저 저금통 조회하여 piggyId를 얻음
  const {
    data: basicPiggyBank,
    isLoading: isLoadingBasic,
    isError: isErrorBasic
  } = usePiggyBankByProject(Number(projectId));

  // API: piggyId로 저금통 상세 정보 조회 (지출 내역 포함)
  const {
    data: piggyBank,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    refetch
  } = usePiggyBankDetail(basicPiggyBank?.piggyId ?? null);

  const isLoading = isLoadingBasic || isLoadingDetail;
  const isError = isErrorBasic || isErrorDetail;

  const formatAmount = (amount: number): string => {
    return Math.floor(amount).toLocaleString('ko-KR');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">저금통 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isError || !piggyBank) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">저금통 정보를 불러오는데 실패했습니다.</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const canWithdraw = piggyBank.status === 'ACTIVE' && piggyBank.balance > 0;
  const canRequestSettlement = piggyBank.status === 'ACTIVE' && piggyBank.balance === 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/organization/dashboard')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">저금통 관리</h1>
              <p className="text-gray-600 mt-1">{piggyBank.projectTitle}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {canWithdraw && (
              <button
                onClick={() => setIsWithdrawalModalOpen(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                지출 내역 등록
              </button>
            )}
            {canRequestSettlement && (
              <button
                onClick={() => setIsSettlementModalOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                정산 요청
              </button>
            )}
          </div>
        </div>

        {/* 저금통 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 총 금액 */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="text-blue-600" size={20} />
              <p className="text-sm text-blue-700 font-medium">총 저금통 금액</p>
            </div>
            <p className="text-3xl font-bold text-blue-900 mb-1">
              {formatAmount(piggyBank.totalAmount)}원
            </p>
            <p className="text-xs text-blue-600">정산 승인 금액</p>
          </div>

          {/* 인출 금액 */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="text-orange-600" size={20} />
              <p className="text-sm text-orange-700 font-medium">총 인출 금액</p>
            </div>
            <p className="text-3xl font-bold text-orange-900 mb-1">
              {formatAmount(piggyBank.withdrawnAmount)}원
            </p>
            <p className="text-xs text-orange-600">
              {piggyBank.withdrawalHistory.length}건 인출
            </p>
          </div>

          {/* 잔액 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="text-green-600" size={20} />
              <p className="text-sm text-green-700 font-medium">현재 잔액</p>
            </div>
            <p className="text-3xl font-bold text-green-900 mb-1">
              {formatAmount(piggyBank.balance)}원
            </p>
            <p className="text-xs text-green-600">
              {piggyBank.balance === 0 ? '정산 요청 가능' : '인출 가능'}
            </p>
          </div>
        </div>

        {/* 카테고리별 통계 */}
        {piggyBank.categoryStats && piggyBank.categoryStats.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <h2 className="text-xl font-bold mb-4">카테고리별 지출 통계</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {piggyBank.categoryStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{stat.category}</h3>
                    <span className="text-sm text-gray-600">{stat.count}건</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {formatAmount(stat.amount)}원
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    전체의 {stat.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 지출 내역 */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">지출 내역</h2>
            <p className="text-sm text-gray-600">
              총 {piggyBank.withdrawalHistory.length}건
            </p>
          </div>

          {piggyBank.withdrawalHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 지출 내역이 없습니다.</p>
              {canWithdraw && (
                <button
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600"
                >
                  지출 내역 등록
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      날짜
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      카테고리
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      설명
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      금액
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      상태
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      영수증
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {piggyBank.withdrawalHistory.map((expense) => (
                    <tr
                      key={expense.expenseId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm">
                            {formatDate(expense.expenseDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {expense.description}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-orange-600">
                          {formatAmount(expense.amount)}원
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              expense.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : expense.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : expense.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {expense.status === 'APPROVED'
                              ? '승인됨'
                              : expense.status === 'PENDING'
                              ? '대기중'
                              : expense.status === 'REJECTED'
                              ? '반려됨'
                              : expense.status}
                          </span>
                          {expense.status === 'REJECTED' && expense.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">
                              {expense.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {expense.receiptUrl ? (
                          <a
                            href={`${import.meta.env.VITE_IMAGE_BASE_URL}${expense.receiptUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            <Download size={16} />
                            <span className="text-sm">보기</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 저금통 상태 안내 */}
        {piggyBank.balance === 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">
                  정산 요청이 가능합니다
                </h3>
                <p className="text-sm text-green-700">
                  저금통 잔액이 모두 사용되었습니다. 정산 요청을 통해 프로젝트를 종료할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => setIsSettlementModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                정산 요청하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 인출 모달 */}
      {isWithdrawalModalOpen && (
        <WithdrawalModal
          isOpen={isWithdrawalModalOpen}
          onClose={() => setIsWithdrawalModalOpen(false)}
          piggyId={piggyBank.piggyId}
          projectTitle={piggyBank.projectTitle}
          currentBalance={piggyBank.balance}
        />
      )}

      {/* 정산 요청 모달 */}
      {isSettlementModalOpen && (
        <SettlementRequestModal
          isOpen={isSettlementModalOpen}
          onClose={() => setIsSettlementModalOpen(false)}
          projectId={piggyBank.projectId}
          projectTitle={piggyBank.projectTitle}
          totalAmount={piggyBank.totalAmount}
        />
      )}
    </div>
  );
};

export default PiggyBankManagementPage;
