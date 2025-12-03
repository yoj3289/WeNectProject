import React, { useState, useEffect } from 'react';
import { Search, FileText, X, CreditCard, AlertCircle, Download, Eye, CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { getSettlementsByStatus, approveSettlement, rejectSettlement, type SettlementResponse, type SettlementDocument } from '../../api/admin';

type TabType = 'pending' | 'processed';
type ProcessedFilterType = 'ALL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

const PAGE_SIZE = 10;

const SettlementManagementPage: React.FC = () => {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [processedFilter, setProcessedFilter] = useState<ProcessedFilterType>('ALL');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);

  // 데이터 상태
  const [allSettlements, setAllSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 모달 상태
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [adminMemo, setAdminMemo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 확인 모달
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // 다운로드 상태
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  // 파일 다운로드 함수
  const handleDownload = async (doc: SettlementDocument) => {
    setDownloadingDocId(doc.documentId);
    try {
      // 백엔드 서버 URL (API URL에서 /api 제거)
      const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace('/api', '');
      const fullUrl = doc.filePath.startsWith('http') ? doc.filePath : `${backendBaseUrl}${doc.filePath}`;

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('파일 다운로드 실패');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${doc.fileName} 다운로드 완료`);
    } catch (error) {
      console.error('다운로드 오류:', error);
      toast.error('파일 다운로드에 실패했습니다.');
    } finally {
      setDownloadingDocId(null);
    }
  };

  // 데이터 로드
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 모든 상태의 정산 가져오기
      const [pendingRes, approvedRes, rejectedRes, completedRes] = await Promise.all([
        getSettlementsByStatus('PENDING'),
        getSettlementsByStatus('APPROVED'),
        getSettlementsByStatus('REJECTED'),
        getSettlementsByStatus('COMPLETED'),
      ]);

      setAllSettlements([
        ...(pendingRes.data || []),
        ...(approvedRes.data || []),
        ...(rejectedRes.data || []),
        ...(completedRes.data || []),
      ].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));

    } catch (error) {
      console.error('정산 데이터 로드 실패:', error);
      toast.error('정산 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 정산 승인 처리
  const handleApprove = async () => {
    if (!selectedSettlement) return;

    setIsProcessing(true);
    try {
      await approveSettlement({
        settlementId: selectedSettlement.settlementId,
        approvalNote: adminMemo,
      });
      toast.success('정산이 승인되었습니다.');
      setConfirmModal(prev => ({ ...prev, isOpen: false })); // 확인 모달 닫기
      setShowDetailModal(false);
      setSelectedSettlement(null);
      setAdminMemo('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '정산 승인에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 정산 반려 처리
  const handleReject = async () => {
    if (!selectedSettlement) return;
    if (!rejectReason.trim()) {
      toast.error('반려 사유를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectSettlement({
        settlementId: selectedSettlement.settlementId,
        rejectionReason: rejectReason,
      });
      toast.success('정산이 반려되었습니다.');
      setConfirmModal(prev => ({ ...prev, isOpen: false })); // 확인 모달 닫기
      setShowDetailModal(false);
      setSelectedSettlement(null);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '정산 반려에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 필터링된 데이터
  const getFilteredSettlements = () => {
    let filtered = allSettlements;

    // 탭별 필터링
    if (activeTab === 'pending') {
      filtered = filtered.filter(s => s.status === 'PENDING');
    } else {
      // 처리 내역 탭
      filtered = filtered.filter(s => s.status === 'APPROVED' || s.status === 'REJECTED' || s.status === 'COMPLETED');

      // 추가 상태 필터링
      if (processedFilter !== 'ALL') {
        filtered = filtered.filter(s => s.status === processedFilter);
      }
    }

    // 검색어 필터링
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.projectTitle?.toLowerCase().includes(term) ||
        s.accountHolder?.toLowerCase().includes(term) ||
        s.bankName?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  // 대기 중인 정산 개수 (배지용)
  const pendingCount = allSettlements.filter(s => s.status === 'PENDING').length;

  // 상태 뱃지 렌더링
  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      PENDING: '대기중',
      APPROVED: '승인됨',
      COMPLETED: '완료',
      REJECTED: '반려됨',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // 날짜 포맷
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 금액 포맷
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const filteredSettlements = getFilteredSettlements();

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredSettlements.length / PAGE_SIZE);
  const paginatedSettlements = filteredSettlements.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  // 탭, 필터, 검색어 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, processedFilter, searchTerm]);

  return (
    <>
      {/* 정산 상세 모달 */}
      {showDetailModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">정산 상세</h2>
                <p className="text-sm text-gray-600 mt-1">정산 정보를 확인하고 처리하세요</p>
              </div>
              <button onClick={() => { setShowDetailModal(false); setSelectedSettlement(null); setRejectReason(''); setAdminMemo(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                {renderStatusBadge(selectedSettlement.status)}
                <h3 className="text-2xl font-bold text-gray-800 mt-3">{selectedSettlement.projectTitle || '프로젝트 정보 없음'}</h3>
                <div className="bg-white rounded-lg p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600">정산 금액</span>
                    <span className="text-3xl font-bold text-green-600">{formatAmount(selectedSettlement.settlementAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">신청일</span>
                    <span className="font-semibold text-gray-800">{formatDate(selectedSettlement.requestedAt)}</span>
                  </div>
                  {selectedSettlement.approvedAt && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">승인일</span>
                      <span className="font-semibold text-gray-800">{formatDate(selectedSettlement.approvedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 계좌 정보 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-blue-500" />
                  입금 계좌 정보
                </h4>
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">은행명</span>
                    <span className="font-semibold text-gray-800">{selectedSettlement.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">계좌번호</span>
                    <span className="font-semibold text-gray-800">{selectedSettlement.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">예금주</span>
                    <span className="font-semibold text-gray-800">{selectedSettlement.accountHolder}</span>
                  </div>
                </div>
              </div>

              {/* 첨부 서류 */}
              {selectedSettlement.documents && selectedSettlement.documents.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-purple-500" />
                    첨부 서류 ({selectedSettlement.documents.length}개)
                  </h4>
                  <div className="space-y-3">
                    {selectedSettlement.documents.map((doc) => (
                      <div key={doc.documentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText size={20} className="text-red-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{doc.fileName}</p>
                            <p className="text-sm text-gray-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingDocId === doc.documentId}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {downloadingDocId === doc.documentId ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              다운로드 중...
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              다운로드
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 반려된 경우 반려 사유 표시 */}
              {selectedSettlement.status === 'REJECTED' && selectedSettlement.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                    <XCircle size={20} className="text-red-600" />
                    반려 사유
                  </h4>
                  <p className="text-red-900">{selectedSettlement.rejectionReason}</p>
                </div>
              )}

              {/* 관리자 메모 표시 */}
              {selectedSettlement.adminMemo && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">관리자 메모</h4>
                  <p className="text-gray-700">{selectedSettlement.adminMemo}</p>
                </div>
              )}

              {/* 대기중일 때만 승인/반려 폼 표시 */}
              {selectedSettlement.status === 'PENDING' && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                      <AlertCircle size={20} className="text-amber-600" />
                      주의사항
                    </h4>
                    <ul className="space-y-2 text-sm text-amber-900">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>정산 승인 시 저금통에 해당 금액이 입금됩니다.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>첨부된 서류를 반드시 확인하신 후 처리해주세요.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">관리자 메모 (선택)</h4>
                    <textarea
                      value={adminMemo}
                      onChange={(e) => setAdminMemo(e.target.value)}
                      placeholder="승인 시 남길 메모를 입력하세요..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertCircle size={20} className="text-red-500" />
                      반려 사유 (반려 시 필수)
                    </h4>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="정산을 반려할 경우 사유를 입력해주세요..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedSettlement(null); setRejectReason(''); setAdminMemo(''); }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
              >
                닫기
              </button>
              {selectedSettlement.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: '정산 반려',
                        message: '이 정산 요청을 반려하시겠습니까?',
                        isDanger: true,
                        onConfirm: handleReject,
                      });
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-50"
                  >
                    반려
                  </button>
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: '정산 승인',
                        message: '정산을 승인하시겠습니까? 저금통에 해당 금액이 입금됩니다.',
                        onConfirm: handleApprove,
                      });
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:opacity-50"
                  >
                    승인
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">정산 관리</h1>
            <p className="text-sm text-gray-600 mt-1">기관의 정산 요청을 검토하고 처리합니다</p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-white text-green-600 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            승인 대기
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'processed'
                ? 'bg-white text-green-600 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            처리 내역
          </button>
        </div>

        {/* 정산 목록 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* 필터 및 검색 */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="프로젝트명, 예금주로 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              {activeTab === 'processed' && (
                <select
                  value={processedFilter}
                  onChange={(e) => setProcessedFilter(e.target.value as ProcessedFilterType)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="ALL">모든 상태</option>
                  <option value="APPROVED">승인됨</option>
                  <option value="COMPLETED">완료</option>
                  <option value="REJECTED">반려됨</option>
                </select>
              )}
            </div>
          </div>

          {/* 테이블 */}
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw size={32} className="animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">정산 데이터를 불러오는 중...</p>
            </div>
          ) : filteredSettlements.length === 0 ? (
            <div className="p-12 text-center">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? '검색 결과가 없습니다.'
                  : activeTab === 'pending'
                  ? '대기 중인 정산 요청이 없습니다.'
                  : '처리된 정산 내역이 없습니다.'}
              </p>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 뷰 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">신청일</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트명</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">정산금액</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedSettlements.map((settlement) => (
                      <tr key={settlement.settlementId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-gray-600 text-sm whitespace-nowrap">{formatDate(settlement.requestedAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-800 line-clamp-1">{settlement.projectTitle || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-800 font-bold whitespace-nowrap">{formatAmount(settlement.settlementAmount)}</span>
                        </td>
                        <td className="px-4 py-3">{renderStatusBadge(settlement.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedSettlement(settlement);
                                setShowDetailModal(true);
                              }}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                              title="상세보기"
                            >
                              <Eye size={18} />
                            </button>
                            {settlement.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedSettlement(settlement);
                                    setConfirmModal({
                                      isOpen: true,
                                      title: '정산 승인',
                                      message: '정산을 승인하시겠습니까?',
                                      onConfirm: async () => {
                                        try {
                                          await approveSettlement({ settlementId: settlement.settlementId });
                                          toast.success('정산이 승인되었습니다.');
                                          loadData();
                                        } catch (error) {
                                          toast.error('정산 승인에 실패했습니다.');
                                        }
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                      },
                                    });
                                  }}
                                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                  title="승인"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSettlement(settlement);
                                    setShowDetailModal(true);
                                  }}
                                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                  title="반려"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 뷰 */}
              <div className="md:hidden divide-y divide-gray-200">
                {paginatedSettlements.map((settlement) => (
                  <div key={settlement.settlementId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{settlement.projectTitle || '-'}</p>
                        <p className="text-lg font-bold text-green-600 mt-1">{formatAmount(settlement.settlementAmount)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {renderStatusBadge(settlement.status)}
                          <span className="text-xs text-gray-500">{formatDate(settlement.requestedAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSettlement(settlement);
                          setShowDetailModal(true);
                        }}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex-shrink-0"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 푸터 - 페이지네이션 */}
          <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              총 <strong>{filteredSettlements.length}</strong>건
              <span className="hidden md:inline ml-2">
                {filteredSettlements.length > 0 && `(${currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, filteredSettlements.length)}건 표시)`}
              </span>
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter(page => {
                      // 현재 페이지 주변 2개씩만 표시
                      return Math.abs(page - currentPage) <= 2 || page === 0 || page === totalPages - 1;
                    })
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium ${
                            currentPage === page
                              ? 'bg-green-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page + 1}
                        </button>
                      </React.Fragment>
                    ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
      />
    </>
  );
};

export default SettlementManagementPage;
