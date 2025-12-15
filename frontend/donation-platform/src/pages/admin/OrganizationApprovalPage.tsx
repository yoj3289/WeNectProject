import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, FileText, Building2, User, Phone, Mail, Calendar, Download, CheckCircle, XCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminDashboardProps } from '../../types/admin';
import { getOrganizationApprovals, approveOrganization, rejectOrganization, type OrganizationApprovalResponse, type OrganizationDocument } from '../../api/admin';

interface OrganizationApprovalPageProps extends AdminDashboardProps {}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
}

const PAGE_SIZE = 10;

const OrganizationApprovalPage: React.FC<OrganizationApprovalPageProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApproval, setSelectedApproval] = useState<OrganizationApprovalResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);  // 거부된 필드 목록

  // API 데이터
  const [approvals, setApprovals] = useState<OrganizationApprovalResponse[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  // 파일 다운로드 함수
  const handleDownload = async (doc: OrganizationDocument) => {
    setDownloadingDocId(doc.docId);
    try {
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

  // 파일 크기 포맷
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 데이터 로딩
  useEffect(() => {
    loadApprovals();
  }, [statusFilter]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await getOrganizationApprovals({ status: statusFilter });
      setApprovals(response.content || []);
    } catch (error) {
      console.error('기관 목록 조회 실패:', error);
      toast.error('기관 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return '승인대기';
      case 'approved': return '승인완료';
      case 'rejected': return '거절';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;

    try {
      await approveOrganization({
        userId: selectedApproval.userId,
        approvalNote: approvalNote || undefined,
      });
      toast.success('기관 회원가입이 승인되었습니다.');
      setShowApproveModal(false);
      setShowDetailModal(false);
      setApprovalNote('');
      loadApprovals(); // 목록 새로고침
    } catch (error) {
      console.error('승인 처리 실패:', error);
      toast.error('승인 처리에 실패했습니다.');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('거절 사유를 입력해주세요.');
      return;
    }
    if (!selectedApproval) return;

    try {
      await rejectOrganization({
        userId: selectedApproval.userId,
        rejectionReason,
        rejectionFields: JSON.stringify(selectedFields),  // JSON 문자열로 전송
      });
      toast.success('기관 회원가입이 거절되었습니다.');
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason('');
      setSelectedFields([]);
      loadApprovals(); // 목록 새로고침
    } catch (error) {
      console.error('거절 처리 실패:', error);
      toast.error('거절 처리에 실패했습니다.');
    }
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const filteredApprovals = approvals.filter(approval => {
    const searchMatch = searchTerm === '' ||
      approval.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.email.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredApprovals.length / PAGE_SIZE);
  const paginatedApprovals = filteredApprovals.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  // 필터나 검색어 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, searchTerm]);

  return (
    <>
      {/* Detail Modal */}
      {showDetailModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-50 rounded-2xl w-full max-w-[95%] md:max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* 헤더 - 다크 스타일 */}
            <div className="bg-stone-800 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Building2 size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">기관 신청 상세</h2>
                    <p className="text-sm text-stone-400">승인/거절 처리하세요</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedApproval(null);
                  }}
                  className="p-2 hover:bg-stone-700 rounded-xl transition-colors"
                >
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            {/* 기관 정보 카드 */}
            <div className="bg-amber-500 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-amber-100 text-sm">기관 회원가입 신청</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApproval.status)}`}>
                  {getStatusLabel(selectedApproval.status)}
                </span>
              </div>
              <h3 className="text-white font-medium text-lg mb-4 line-clamp-1">
                {selectedApproval.organizationName}
              </h3>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-white" />
                    <span className="text-white/90 text-sm">사업자번호</span>
                  </div>
                  <span className="text-white font-medium">{selectedApproval.businessNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-white" />
                    <span className="text-white/90 text-sm">신청일</span>
                  </div>
                  <span className="text-white font-medium">{selectedApproval.appliedDate}</span>
                </div>
              </div>
            </div>

            {/* 스크롤 가능한 콘텐츠 영역 */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
              {/* STEP 1: 기관 정보 */}
              <div className="bg-white rounded-xl p-5 border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="font-medium text-stone-800">기관 정보</h4>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-stone-500" />
                      <span className="text-sm text-stone-600">대표자명</span>
                    </div>
                    <span className="font-medium text-stone-800">{selectedApproval.representativeName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-stone-500" />
                      <span className="text-sm text-stone-600">이메일</span>
                    </div>
                    <span className="font-medium text-stone-800 text-sm">{selectedApproval.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-stone-500" />
                      <span className="text-sm text-stone-600">연락처</span>
                    </div>
                    <span className="font-medium text-stone-800">{selectedApproval.phone}</span>
                  </div>
                </div>
              </div>

              {/* STEP 2: 제출 서류 */}
              <div className="bg-white rounded-xl p-5 border border-stone-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <h4 className="font-medium text-stone-800">제출 서류</h4>
                </div>
                <div className="space-y-3">
                  {selectedApproval.documents.map((doc) => (
                    <div key={doc.docId} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-stone-800 text-sm">{doc.fileName}</p>
                          <p className="text-xs text-stone-500">{formatFileSize(doc.fileSize)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingDocId === doc.docId}
                        className="px-3 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Download size={14} className={downloadingDocId === doc.docId ? 'animate-bounce' : ''} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 처리일시 */}
              {selectedApproval.processedDate && (
                <div className="bg-stone-100 rounded-xl p-4">
                  <p className="text-sm text-stone-600 mb-1">처리일시</p>
                  <p className="font-medium text-stone-800">{selectedApproval.processedDate}</p>
                </div>
              )}

              {/* 거절 사유 */}
              {selectedApproval.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={18} className="text-red-600" />
                    <h4 className="font-medium text-red-800">거절 사유</h4>
                  </div>
                  <p className="text-red-700 text-sm">{selectedApproval.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="border-t border-stone-200 p-4 bg-white flex gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedApproval(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition"
              >
                닫기
              </button>
              {selectedApproval.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition"
                  >
                    승인
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-[95%] md:max-w-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">기관 회원가입 승인</h2>
              <button onClick={() => setShowApproveModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>{selectedApproval.organizationName}</strong>의 회원가입을 승인하시겠습니까?
                </p>
                <p className="text-xs text-gray-600 mt-2">승인 후 해당 기관은 프로젝트를 등록하고 관리할 수 있습니다.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">승인 메모 (선택)</label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="승인 메모를 입력하세요..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                >
                  승인하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-stone-50 rounded-2xl w-full max-w-[95%] md:max-w-2xl overflow-hidden">
            {/* 헤더 */}
            <div className="bg-stone-800 px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <X size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-white">기관 회원가입 거절</h2>
                    <p className="text-sm text-stone-400">거절 사유를 입력해주세요</p>
                  </div>
                </div>
                <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-stone-700 rounded-xl">
                  <X size={20} className="text-stone-400" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-amber-500 rounded-xl p-4">
                <p className="text-sm text-white">
                  <strong>{selectedApproval.organizationName}</strong>의 회원가입을 거절하시겠습니까?
                </p>
                <p className="text-xs text-amber-100 mt-2">거절 사유는 신청자에게 전달됩니다.</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <label className="block text-sm font-semibold text-stone-700 mb-3">문제가 있는 항목 선택 (중복 선택 가능)</label>
                <div className="grid grid-cols-2 gap-3">
                  {['기관명', '연락처', '사업자번호', '대표자명', '제출서류'].map((field) => (
                    <label
                      key={field}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFields.includes(field)
                          ? 'bg-amber-50 border-amber-500'
                          : 'border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field)}
                        onChange={() => toggleField(field)}
                        className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-stone-700">{field}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-stone-200">
                <label className="block text-sm font-semibold text-stone-700 mb-2">상세 거절 사유 <span className="text-amber-500">*</span></label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="거절 사유를 상세히 입력하세요... (예: 사업자등록증이 만료되었습니다)"
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-bold hover:bg-stone-100"
                >
                  취소
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-6 py-3 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-700"
                >
                  거절하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">기관 회원가입 승인</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">기관 회원가입 신청을 검토하고 승인/거절 처리합니다</p>
          </div>
          <button
            onClick={() => loadApprovals()}
            disabled={loading}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition disabled:opacity-50 text-xs md:text-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">승인 대기</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}건</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">승인 완료</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}건</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">거절</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}건</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="기관명, 대표자명, 이메일로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              <option value="all">모든 상태</option>
              <option value="pending">승인대기</option>
              <option value="approved">승인완료</option>
              <option value="rejected">거절</option>
            </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기관명</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">대표자명</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">연락처</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">신청일</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : filteredApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      기관이 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedApprovals.map((approval) => (
                  <tr key={approval.userId} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-gray-800 text-sm">{approval.userName}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-gray-600 text-sm hidden md:table-cell">{approval.representativeName}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-gray-600 text-sm hidden lg:table-cell">{approval.phone}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-gray-600 text-xs md:text-sm">{approval.appliedDate}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(approval.status)}`}>
                        {getStatusLabel(approval.status)}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowDetailModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          title="상세보기"
                        >
                          <Eye size={18} />
                        </button>
                        {approval.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedApproval(approval);
                                setShowApproveModal(true);
                              }}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                              title="승인"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApproval(approval);
                                setShowRejectModal(true);
                              }}
                              className="p-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200"
                              title="거절"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* 푸터 - 페이지네이션 */}
          <div className="p-4 md:p-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              총 <strong>{filteredApprovals.length}</strong>건
              {filteredApprovals.length > 0 && (
                <span className="ml-2">
                  ({currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, filteredApprovals.length)}건 표시)
                </span>
              )}
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
                              ? 'bg-amber-500 text-white'
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
    </>
  );
};

export default OrganizationApprovalPage;
