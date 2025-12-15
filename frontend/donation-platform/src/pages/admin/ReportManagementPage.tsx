import React, { useState } from 'react';
import { Flag, Search, Eye, CheckCircle, XCircle, Clock, AlertTriangle, MessageCircle, MessageSquare, FileText, User, Loader2, X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminReports, useProcessReport, useReportStats } from '../../hooks/useReports';
import { REPORT_TYPE_LABELS, REPORT_STATUS_LABELS, REPORT_REASON_LABELS } from '../../api/reports';
import type { ReportStatus, ReportType, ReportResponse } from '../../api/reports';
import Pagination from '../../components/common/Pagination';

const ReportManagementPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ReportType | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processNote, setProcessNote] = useState('');
  const [processStatus, setProcessStatus] = useState<ReportStatus>('RESOLVED');

  // API hooks
  const { data: reportsData, isLoading } = useAdminReports(
    statusFilter || undefined,
    typeFilter || undefined,
    currentPage,
    10
  );
  const { data: statsData } = useReportStats();
  const processReportMutation = useProcessReport();

  const reports = reportsData?.content || [];
  const totalPages = reportsData?.totalPages || 0;

  const handleProcessReport = async () => {
    if (!selectedReport) return;

    try {
      await processReportMutation.mutateAsync({
        reportId: selectedReport.reportId,
        request: {
          status: processStatus,
          adminNote: processNote.trim() || undefined,
        },
      });

      toast.success('신고가 처리되었습니다.');
      setShowProcessModal(false);
      setSelectedReport(null);
      setProcessNote('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '신고 처리 중 오류가 발생했습니다.');
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="text-yellow-500" size={16} />;
      case 'UNDER_REVIEW':
        return <AlertTriangle className="text-blue-500" size={16} />;
      case 'RESOLVED':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'REJECTED':
        return <XCircle className="text-red-500" size={16} />;
    }
  };

  const getStatusBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-700';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
    }
  };

  const getTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'COMMENT':
        return <MessageCircle size={14} />;
      case 'POST':
        return <FileText size={14} />;
      case 'PROJECT':
        return <Flag size={14} />;
      case 'USER':
        return <User size={14} />;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900">신고 관리</h1>
          <p className="text-xs md:text-sm text-stone-500 mt-1">사용자 신고를 검토하고 처리합니다.</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{statsData?.pendingCount || 0}</p>
              <p className="text-xs text-stone-500">대기중</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{statsData?.underReviewCount || 0}</p>
              <p className="text-xs text-stone-500">검토중</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{statsData?.resolvedCount || 0}</p>
              <p className="text-xs text-stone-500">처리완료</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{statsData?.rejectedCount || 0}</p>
              <p className="text-xs text-stone-500">반려됨</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Flag className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{statsData?.todayCount || 0}</p>
              <p className="text-xs text-stone-500">오늘 접수</p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="신고 대상 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ReportStatus | '');
              setCurrentPage(0);
            }}
            className="px-3 md:px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
          >
            <option value="">전체 상태</option>
            <option value="PENDING">대기중</option>
            <option value="UNDER_REVIEW">검토중</option>
            <option value="RESOLVED">처리완료</option>
            <option value="REJECTED">반려됨</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as ReportType | '');
              setCurrentPage(0);
            }}
            className="px-3 md:px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-sm"
          >
            <option value="">전체 유형</option>
            <option value="COMMENT">댓글</option>
            <option value="POST">게시글</option>
            <option value="PROJECT">프로젝트</option>
            <option value="USER">사용자</option>
          </select>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <Flag className="mx-auto text-stone-300 mb-4" size={48} />
            <p className="text-stone-500">신고 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    신고 대상
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider hidden md:table-cell">
                    사유
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider hidden lg:table-cell">
                    신고자
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider hidden md:table-cell">
                    접수일
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reports.map((report) => (
                  <tr key={report.reportId} className="hover:bg-stone-50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-stone-100 rounded-lg">
                          {getTypeIcon(report.reportType)}
                        </span>
                        <span className="text-sm text-stone-700">
                          {REPORT_TYPE_LABELS[report.reportType]}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {report.reportedItemTitle}
                        </p>
                        {report.reportedUserName && (
                          <p className="text-xs text-stone-500">작성자: {report.reportedUserName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                      <span className="text-sm text-stone-700">{report.reasonLabel}</span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className="text-sm text-stone-700">{report.reporterName}</span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          report.status
                        )}`}
                      >
                        {getStatusIcon(report.status)}
                        {report.statusLabel}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                      <span className="text-sm text-stone-500">
                        {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          title="상세보기"
                        >
                          <Eye size={16} className="text-stone-500" />
                        </button>
                        {report.status === 'PENDING' || report.status === 'UNDER_REVIEW' ? (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowProcessModal(true);
                            }}
                            className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                            title="처리하기"
                          >
                            <CheckCircle size={16} className="text-amber-600" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-4 md:px-6 py-4 border-t border-stone-200">
            <Pagination
              currentPage={currentPage + 1}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page - 1)}
            />
          </div>
        )}
      </div>

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-50 rounded-2xl w-full max-w-[95%] md:max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 - 다크 스타일 */}
            <div className="bg-stone-800 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Flag size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">신고 상세</h2>
                    <p className="text-sm text-stone-400">신고 정보를 확인하세요</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-stone-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            {/* 신고 정보 카드 */}
            <div className="bg-amber-500 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-amber-100 text-sm">{REPORT_TYPE_LABELS[selectedReport.reportType]} 신고</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedReport.status)}`}>
                  {selectedReport.statusLabel}
                </span>
              </div>
              <h3 className="text-white font-medium text-lg mb-4 line-clamp-2">
                {selectedReport.reportedItemTitle}
              </h3>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-white" />
                    <span className="text-white/90 text-sm">신고자</span>
                  </div>
                  <span className="text-white font-medium">{selectedReport.reporterName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-white" />
                    <span className="text-white/90 text-sm">접수일</span>
                  </div>
                  <span className="text-white font-medium">{new Date(selectedReport.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>

            {/* 스크롤 가능한 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
              {/* STEP 1: 신고 사유 */}
              <div className="bg-white rounded-xl p-5 border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="font-medium text-stone-800">신고 사유</h4>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-red-700 font-medium">{selectedReport.reasonLabel}</p>
                </div>
              </div>

              {/* STEP 2: 신고 대상 */}
              {selectedReport.reportedUserName && (
                <div className="bg-white rounded-xl p-5 border border-stone-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <h4 className="font-medium text-stone-800">신고 대상 사용자</h4>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-medium text-stone-800">{selectedReport.reportedUserName}</p>
                  </div>
                </div>
              )}

              {/* 상세 설명 */}
              {selectedReport.description && (
                <div className="bg-white rounded-xl p-5 border border-stone-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">{selectedReport.reportedUserName ? '3' : '2'}</div>
                    <h4 className="font-medium text-stone-800">상세 설명</h4>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-stone-700 text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                  </div>
                </div>
              )}

              {/* 관리자 메모 */}
              {selectedReport.adminNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={18} className="text-amber-600" />
                    <h4 className="font-medium text-amber-800">관리자 메모</h4>
                  </div>
                  <p className="text-amber-900 text-sm">{selectedReport.adminNote}</p>
                </div>
              )}

              {/* 처리일 */}
              {selectedReport.processedAt && (
                <div className="bg-stone-100 rounded-xl p-4">
                  <p className="text-sm text-stone-600 mb-1">처리일</p>
                  <p className="font-medium text-stone-800">
                    {new Date(selectedReport.processedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="border-t border-stone-200 p-4 bg-white flex gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition"
              >
                닫기
              </button>
              {(selectedReport.status === 'PENDING' || selectedReport.status === 'UNDER_REVIEW') && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowProcessModal(true);
                  }}
                  className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition"
                >
                  처리하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 처리 모달 */}
      {showProcessModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-50 rounded-2xl w-full max-w-[95%] md:max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 - 다크 스타일 */}
            <div className="bg-stone-800 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <CheckCircle size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">신고 처리</h2>
                    <p className="text-sm text-stone-400">처리 결과를 선택하세요</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="p-2 hover:bg-stone-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            {/* 처리 대상 정보 */}
            <div className="bg-amber-500 px-4 md:px-6 py-4 md:py-5">
              <p className="text-amber-100 text-sm mb-2">처리 대상</p>
              <h3 className="text-white font-medium text-lg line-clamp-2">{selectedReport.reportedItemTitle}</h3>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/90 text-sm">신고 사유</span>
                  <span className="text-white font-medium">{selectedReport.reasonLabel}</span>
                </div>
              </div>
            </div>

            {/* 스크롤 가능한 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
              {/* 처리 결과 선택 */}
              <div className="bg-white rounded-xl p-5 border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="font-medium text-stone-800">처리 결과</h4>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setProcessStatus('RESOLVED')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      processStatus === 'RESOLVED'
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    처리완료
                  </button>
                  <button
                    onClick={() => setProcessStatus('REJECTED')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                      processStatus === 'REJECTED'
                        ? 'bg-red-500 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    반려
                  </button>
                </div>
              </div>

              {/* 관리자 메모 */}
              <div className="bg-white rounded-xl p-5 border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <h4 className="font-medium text-stone-800">관리자 메모 (선택)</h4>
                </div>
                <textarea
                  value={processNote}
                  onChange={(e) => setProcessNote(e.target.value)}
                  placeholder="처리 내용을 기록하세요..."
                  rows={3}
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
                />
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="border-t border-stone-200 p-4 bg-white flex gap-3">
              <button
                onClick={() => setShowProcessModal(false)}
                disabled={processReportMutation.isPending}
                className="flex-1 px-4 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 disabled:opacity-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleProcessReport}
                disabled={processReportMutation.isPending}
                className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {processReportMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    처리 중...
                  </>
                ) : (
                  '처리하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagementPage;
