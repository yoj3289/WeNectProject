import React, { useState } from 'react';
import { Search, Eye, Check, X, FileText, Building2, User, Phone, Mail, Calendar, Download } from 'lucide-react';
import type { AdminDashboardProps } from '../../types/admin';

interface OrganizationApprovalPageProps extends AdminDashboardProps {}

interface OrganizationApproval {
  id: number;
  userId: number;
  userName: string;
  email: string;
  phone: string;
  organizationName: string;
  businessNumber: string;
  representativeName: string;
  documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  processedDate?: string;
  rejectionReason?: string;
}

const OrganizationApprovalPage: React.FC<OrganizationApprovalPageProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApproval, setSelectedApproval] = useState<OrganizationApproval | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // 임시 데이터 (실제로는 API에서 가져옴)
  const approvals: OrganizationApproval[] = [
    {
      id: 1,
      userId: 101,
      userName: '김기관',
      email: 'kim@organization.com',
      phone: '010-1234-5678',
      organizationName: '사랑나눔재단',
      businessNumber: '123-45-67890',
      representativeName: '김대표',
      documents: ['사업자등록증.pdf', '법인등기부등본.pdf', '통장사본.pdf'],
      status: 'pending',
      appliedDate: '2024-03-15 10:30',
    },
    {
      id: 2,
      userId: 102,
      userName: '박복지',
      email: 'park@welfare.org',
      phone: '010-2345-6789',
      organizationName: '희망복지센터',
      businessNumber: '234-56-78901',
      representativeName: '박센터장',
      documents: ['사업자등록증.pdf', '법인등기부등본.pdf'],
      status: 'pending',
      appliedDate: '2024-03-16 14:20',
    },
    {
      id: 3,
      userId: 103,
      userName: '이나눔',
      email: 'lee@sharing.or.kr',
      phone: '010-3456-7890',
      organizationName: '나눔의집',
      businessNumber: '345-67-89012',
      representativeName: '이대표',
      documents: ['사업자등록증.pdf', '통장사본.pdf'],
      status: 'approved',
      appliedDate: '2024-03-10 09:15',
      processedDate: '2024-03-11 11:30',
    },
    {
      id: 4,
      userId: 104,
      userName: '최봉사',
      email: 'choi@volunteer.com',
      phone: '010-4567-8901',
      organizationName: '봉사활동협회',
      businessNumber: '456-78-90123',
      representativeName: '최회장',
      documents: ['사업자등록증.pdf'],
      status: 'rejected',
      appliedDate: '2024-03-12 16:45',
      processedDate: '2024-03-13 10:00',
      rejectionReason: '제출 서류 미비 (법인등기부등본 누락)',
    },
  ];

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

  const handleApprove = () => {
    if (selectedApproval) {
      console.log('승인:', selectedApproval.id, approvalNote);
      alert('기관 회원가입이 승인되었습니다.');
      setShowApproveModal(false);
      setShowDetailModal(false);
      setApprovalNote('');
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    if (selectedApproval) {
      console.log('거절:', selectedApproval.id, rejectionReason);
      alert('기관 회원가입이 거절되었습니다.');
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason('');
    }
  };

  const filteredApprovals = approvals.filter(approval => {
    const statusMatch = statusFilter === 'all' || approval.status === statusFilter;
    const searchMatch = searchTerm === '' ||
      approval.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.email.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  return (
    <>
      {/* Detail Modal */}
      {showDetailModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">기관 회원가입 신청 상세</h2>
                <p className="text-sm text-gray-600 mt-1">신청 정보를 확인하고 승인/거절 처리하세요</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedApproval(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 상태 표시 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{selectedApproval.organizationName}</h3>
                    <p className="text-gray-600 mt-1">사업자번호: {selectedApproval.businessNumber}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedApproval.status)}`}>
                    {getStatusLabel(selectedApproval.status)}
                  </span>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-blue-500" />
                  기관 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">대표자명</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedApproval.representativeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">이메일</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedApproval.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">담당자명</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedApproval.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">연락처</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedApproval.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제출 서류 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-green-500" />
                  제출 서류
                </h4>
                <div className="space-y-2">
                  {selectedApproval.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-red-500" />
                        <span className="text-sm font-medium text-gray-800">{doc}</span>
                      </div>
                      <button className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-semibold">
                        <Download size={16} />
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 신청 일시 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-purple-500" />
                  처리 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">신청일시</p>
                    <p className="text-lg font-bold text-gray-800">{selectedApproval.appliedDate}</p>
                  </div>
                  {selectedApproval.processedDate && (
                    <div className="bg-pink-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">처리일시</p>
                      <p className="text-lg font-bold text-gray-800">{selectedApproval.processedDate}</p>
                    </div>
                  )}
                </div>
                {selectedApproval.rejectionReason && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-700 mb-2">거절 사유</p>
                    <p className="text-sm text-gray-700">{selectedApproval.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* 액션 버튼 (승인 대기인 경우만) */}
              {selectedApproval.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg font-bold hover:bg-red-50"
                  >
                    <X size={20} />
                    거절
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                  >
                    <Check size={20} />
                    승인
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">기관 회원가입 거절</h2>
              <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>{selectedApproval.organizationName}</strong>의 회원가입을 거절하시겠습니까?
                </p>
                <p className="text-xs text-gray-600 mt-2">거절 사유는 신청자에게 이메일로 전달됩니다.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">거절 사유 <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="거절 사유를 입력하세요..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
                >
                  거절하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">기관 회원가입 승인</h1>
          <p className="text-sm text-gray-600 mt-1">기관 회원가입 신청을 검토하고 승인/거절 처리합니다</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">승인 대기</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}건</p>
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
                <p className="text-3xl font-bold text-green-600">{approvedCount}건</p>
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
                <p className="text-3xl font-bold text-red-600">{rejectedCount}건</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="기관명, 담당자명, 이메일로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">모든 상태</option>
              <option value="pending">승인대기</option>
              <option value="approved">승인완료</option>
              <option value="rejected">거절</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기관명</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">대표자</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">담당자</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">연락처</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">신청일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{approval.organizationName}</td>
                    <td className="px-6 py-4 text-gray-600">{approval.representativeName}</td>
                    <td className="px-6 py-4 text-gray-600">{approval.userName}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{approval.phone}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{approval.appliedDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(approval.status)}`}>
                        {getStatusLabel(approval.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="승인"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApproval(approval);
                                setShowRejectModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="거절"
                            >
                              <X size={18} />
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

          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <strong>{filteredApprovals.length}</strong>건 중 <strong>1-{filteredApprovals.length}</strong> 표시
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>이전</button>
              <button className="px-3 py-1 border rounded-lg bg-red-500 text-white border-red-500">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>다음</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationApprovalPage;
