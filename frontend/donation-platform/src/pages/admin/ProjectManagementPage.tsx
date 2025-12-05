import React, { useState } from 'react';
import { Search, Download, Eye, CheckCircle, XCircle, X, Users, FileText, AlertCircle, Target, Calendar, Building2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminDashboardProps } from '../../types/admin';
import ConfirmModal from '../../components/common/ConfirmModal';

interface ProjectManagementPageProps extends AdminDashboardProps {
  rejectReason: string;
  setRejectReason: (reason: string) => void;
}

// Project Detail Modal Component
const ProjectDetailModalContent: React.FC<{
  selectedProject: any;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  handleApproveProject: () => void;
  handleRejectProject: () => void;
  onClose: () => void;
}> = React.memo(({ selectedProject, rejectReason, setRejectReason, handleApproveProject, handleRejectProject, onClose }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollPositionRef = React.useRef<number>(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  };

  React.useEffect(() => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* 헤더 - 다크 스타일 */}
        <div className="bg-stone-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">프로젝트 검토</h2>
                <p className="text-sm text-stone-400">승인/반려 처리하세요</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-700 rounded-xl transition-colors">
              <X size={20} className="text-stone-400" />
            </button>
          </div>
        </div>

        {/* 프로젝트 정보 카드 */}
        <div className="bg-amber-500 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-amber-100 text-sm">프로젝트 신청</p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                승인 대기중
              </span>
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                {selectedProject.category}
              </span>
            </div>
          </div>
          <h3 className="text-white font-medium text-lg mb-4 line-clamp-2">
            {selectedProject.title}
          </h3>
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-white" />
                <span className="text-white/90 text-sm">목표 금액</span>
              </div>
              <span className="text-white text-xl font-bold">{(selectedProject.targetAmount || selectedProject.amount).toLocaleString()}원</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-white" />
                <span className="text-white/90 text-sm">신청일</span>
              </div>
              <span className="text-white font-medium">{selectedProject.date || '2024.11.15'}</span>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* STEP 1: 기관 정보 */}
          <div className="bg-white rounded-xl p-5 border border-stone-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <h4 className="font-medium text-stone-800">기관 정보</h4>
            </div>
            <div className="bg-stone-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-stone-500" />
                  <span className="text-sm text-stone-600">기관명</span>
                </div>
                <span className="font-medium text-stone-800">{selectedProject.org || selectedProject.organization || '교육나눔재단'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">사업자등록번호</span>
                <span className="font-medium text-stone-800">123-45-67890</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">대표자</span>
                <span className="font-medium text-stone-800">홍길동</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">연락처</span>
                <span className="font-medium text-stone-800">02-1234-5678</span>
              </div>
            </div>
          </div>

          {/* STEP 2: 프로젝트 설명 */}
          <div className="bg-white rounded-xl p-5 border border-stone-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <h4 className="font-medium text-stone-800">프로젝트 설명</h4>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-stone-700 text-sm leading-relaxed">
                저소득층 학생들에게 양질의 교육 기회를 제공하여 교육 격차를 해소하고자 합니다.
                본 프로젝트는 학습 교재 지원, 온라인 교육 플랫폼 구독, 그리고 전문 튜터링 서비스를 포함합니다.
              </p>
            </div>
          </div>

          {/* STEP 3: 첨부 서류 */}
          <div className="bg-white rounded-xl p-5 border border-stone-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-stone-800 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <h4 className="font-medium text-stone-800">첨부 서류</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">사업계획서.pdf</p>
                    <p className="text-xs text-stone-500">2.4 MB</p>
                  </div>
                </div>
                <button className="px-3 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700">
                  <Download size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">예산서.xlsx</p>
                    <p className="text-xs text-stone-500">156 KB</p>
                  </div>
                </div>
                <button className="px-3 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700">
                  <Download size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">사업자등록증.pdf</p>
                    <p className="text-xs text-stone-500">890 KB</p>
                  </div>
                </div>
                <button className="px-3 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700">
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* 반려 사유 입력 */}
          <div className="bg-white rounded-xl p-5 border border-stone-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-amber-500" />
              <h4 className="font-medium text-stone-800">반려 사유 (반려 시 필수)</h4>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="프로젝트를 반려할 경우 사유를 입력해주세요..."
              rows={3}
              className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-sm"
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="border-t border-stone-200 p-4 bg-white flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition">
            취소
          </button>
          <button onClick={handleRejectProject} className="flex-1 px-4 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition">
            반려
          </button>
          <button onClick={handleApproveProject} className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition">
            승인
          </button>
        </div>
      </div>
    </div>
  );
});

const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({
  projectFilter,
  setProjectFilter,
  projectCategoryFilter,
  setProjectCategoryFilter,
  projectSearchTerm,
  setProjectSearchTerm,
  selectedProjects,
  setSelectedProjects,
  selectedProject,
  setSelectedProject,
  showProjectModal,
  setShowProjectModal,
  rejectReason,
  setRejectReason,
}) => {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const recentProjects = [
    { id: 1, title: '저소득층 학생 교육비 지원', org: '교육나눔재단', amount: 10000000, status: 'pending', date: '2024-10-07', category: '교육' },
    { id: 2, title: '독거노인 생활 지원 프로젝트', org: '희망나눔센터', amount: 5000000, status: 'pending', date: '2024-10-06', category: '노인' },
    { id: 3, title: '장애인 일자리 창출 사업', org: '함께일하는세상', amount: 15000000, status: 'pending', date: '2024-10-05', category: '장애인' },
    { id: 4, title: '지역아동센터 급식 지원', org: '아이사랑복지관', amount: 7500000, status: 'approved', date: '2024-10-04', category: '아동' },
    { id: 5, title: '환경보호 캠페인 운영', org: '그린피스코리아', amount: 20000000, status: 'rejected', date: '2024-10-03', category: '환경' },
  ];

  const handleApproveProject = React.useCallback(() => {
    setConfirmModal({
      isOpen: true,
      title: '프로젝트 승인',
      message: '이 프로젝트를 승인하시겠습니까?',
      onConfirm: () => {
        toast.success('프로젝트가 승인되었습니다.');
        setShowProjectModal(false);
        setSelectedProject(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [setShowProjectModal, setSelectedProject]);

  const handleRejectProject = React.useCallback(() => {
    if (!rejectReason.trim()) {
      toast.error('반려 사유를 입력해주세요.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: '프로젝트 반려',
      message: '이 프로젝트를 반려하시겠습니까?',
      isDanger: true,
      onConfirm: () => {
        toast.success('프로젝트가 반려되었습니다.');
        setShowProjectModal(false);
        setSelectedProject(null);
        setRejectReason('');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [rejectReason, setShowProjectModal, setSelectedProject, setRejectReason]);

  const handleCloseProjectModal = React.useCallback(() => {
    setShowProjectModal(false);
    setSelectedProject(null);
    setRejectReason('');
  }, [setShowProjectModal, setSelectedProject, setRejectReason]);

  return (
    <>
      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && (
        <ProjectDetailModalContent
          selectedProject={selectedProject}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          handleApproveProject={handleApproveProject}
          handleRejectProject={handleRejectProject}
          onClose={handleCloseProjectModal}
        />
      )}

      {/* Main Content */}
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">프로젝트 관리</h1>
          <p className="text-sm text-gray-600 mt-1">프로젝트 승인 요청을 검토하고 처리합니다</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* 필터 바 */}
          <div className="p-6 border-b border-gray-200 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                  placeholder="프로젝트명, 기관명으로 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">모든 상태</option>
                <option value="pending">승인 대기</option>
                <option value="approved">승인 완료</option>
                <option value="rejected">반려</option>
              </select>
              <select
                value={projectCategoryFilter}
                onChange={(e) => setProjectCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="all">모든 카테고리</option>
                <option value="교육">교육</option>
                <option value="노인">노인</option>
                <option value="장애인">장애인</option>
                <option value="아동">아동</option>
                <option value="환경">환경</option>
              </select>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 font-semibold">
                <Download size={18} />
                엑셀
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">빠른 필터:</span>
              <button className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-100 border border-amber-200">
                오늘 신청 (3)
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                이번 주 (12)
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                긴급 (2)
              </button>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedProjects.length === recentProjects.filter(p =>
                        (projectFilter === 'all' || p.status === projectFilter) &&
                        (projectCategoryFilter === 'all' || p.category === projectCategoryFilter) &&
                        (projectSearchTerm === '' || p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) || p.org.toLowerCase().includes(projectSearchTerm.toLowerCase()))
                      ).length && recentProjects.filter(p =>
                        (projectFilter === 'all' || p.status === projectFilter) &&
                        (projectCategoryFilter === 'all' || p.category === projectCategoryFilter) &&
                        (projectSearchTerm === '' || p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) || p.org.toLowerCase().includes(projectSearchTerm.toLowerCase()))
                      ).length > 0}
                      onChange={(e) => {
                        const filteredProjects = recentProjects.filter(p =>
                          (projectFilter === 'all' || p.status === projectFilter) &&
                          (projectCategoryFilter === 'all' || p.category === projectCategoryFilter) &&
                          (projectSearchTerm === '' || p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) || p.org.toLowerCase().includes(projectSearchTerm.toLowerCase()))
                        );
                        if (e.target.checked) {
                          setSelectedProjects(filteredProjects.map(p => p.id));
                        } else {
                          setSelectedProjects([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트명</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기관</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">목표금액</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">신청일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentProjects.filter(p =>
                  (projectFilter === 'all' || p.status === projectFilter) &&
                  (projectCategoryFilter === 'all' || p.category === projectCategoryFilter) &&
                  (projectSearchTerm === '' || p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) || p.org.toLowerCase().includes(projectSearchTerm.toLowerCase()))
                ).map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedProjects.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects([...selectedProjects, project.id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">#{project.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{project.title}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{project.org}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-semibold">{project.amount.toLocaleString()}원</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{project.date}</td>
                    <td className="px-6 py-4">
                      {project.status === 'pending' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                          대기중
                        </span>
                      )}
                      {project.status === 'approved' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          승인
                        </span>
                      )}
                      {project.status === 'rejected' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          반려
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProjectModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          title="상세보기"
                        >
                          <Eye size={18} />
                        </button>
                        {project.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: '프로젝트 승인',
                                  message: '이 프로젝트를 승인하시겠습니까?',
                                  onConfirm: () => {
                                    toast.success('프로젝트가 승인되었습니다.');
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
                                setSelectedProject(project);
                                setShowProjectModal(true);
                              }}
                              className="p-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200"
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

          {/* 페이지네이션 */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <strong>{recentProjects.filter(p =>
                (projectFilter === 'all' || p.status === projectFilter) &&
                (projectCategoryFilter === 'all' || p.category === projectCategoryFilter) &&
                (projectSearchTerm === '' || p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) || p.org.toLowerCase().includes(projectSearchTerm.toLowerCase()))
              ).length}</strong>개 중 <strong>1-{recentProjects.filter(p =>
                (projectFilter === 'all' || p.status === projectFilter) &&
                (projectCategoryFilter === 'all' || p.category === projectCategoryFilter) &&
                (projectSearchTerm === '' || p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) || p.org.toLowerCase().includes(projectSearchTerm.toLowerCase()))
              ).length}</strong> 표시
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>이전</button>
              <button className="px-3 py-1 border rounded-lg bg-amber-500 text-white border-amber-500">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>다음</button>
            </div>
          </div>
        </div>
      </div>

      {/* ConfirmModal */}
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

export default ProjectManagementPage;
