import React from 'react';
import { Search, Download, Eye, CheckCircle, XCircle, X, Users, FileText, AlertCircle } from 'lucide-react';
import type { AdminDashboardProps } from '../../types/admin';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">프로젝트 검토</h2>
            <p className="text-sm text-gray-600 mt-1">프로젝트 정보를 확인하고 승인/반려 처리하세요</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">승인 대기중</span>
                <h3 className="text-2xl font-bold text-gray-800 mt-3">{selectedProject.title}</h3>
                <p className="text-gray-600 mt-2">{selectedProject.organization || selectedProject.org}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">{selectedProject.category}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">목표 금액</p>
                <p className="text-xl font-bold text-red-600">{(selectedProject.targetAmount || selectedProject.amount).toLocaleString()}원</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">신청일</p>
                <p className="text-lg font-semibold text-gray-800">{selectedProject.date || '2024.11.15'}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">프로젝트 ID</p>
                <p className="text-lg font-semibold text-gray-800">#{selectedProject.id}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-pink-500" />
              기관 정보
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">기관명</p>
                <p className="font-semibold text-gray-800">{selectedProject.org || selectedProject.organization || '교육나눔재단'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">사업자등록번호</p>
                <p className="font-semibold text-gray-800">123-45-67890</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">대표자</p>
                <p className="font-semibold text-gray-800">홍길동</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">연락처</p>
                <p className="font-semibold text-gray-800">02-1234-5678</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-pink-500" />
              프로젝트 설명
            </h4>
            <p className="text-gray-700 leading-relaxed">
              저소득층 학생들에게 양질의 교육 기회를 제공하여 교육 격차를 해소하고자 합니다.
              본 프로젝트는 학습 교재 지원, 온라인 교육 플랫폼 구독, 그리고 전문 튜터링 서비스를 포함합니다.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-purple-500" />
              첨부 서류
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">사업계획서.pdf</p>
                    <p className="text-sm text-gray-500">2.4 MB</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">다운로드</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">예산서.xlsx</p>
                    <p className="text-sm text-gray-500">156 KB</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">다운로드</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">사업자등록증.pdf</p>
                    <p className="text-sm text-gray-500">890 KB</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">다운로드</button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500" />
              반려 사유 (선택)
            </h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="프로젝트를 반려할 경우 사유를 입력해주세요..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50">취소</button>
          <button onClick={handleRejectProject} className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600">반려</button>
          <button onClick={handleApproveProject} className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">승인</button>
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
  const recentProjects = [
    { id: 1, title: '저소득층 학생 교육비 지원', org: '교육나눔재단', amount: 10000000, status: 'pending', date: '2024-10-07', category: '교육' },
    { id: 2, title: '독거노인 생활 지원 프로젝트', org: '희망나눔센터', amount: 5000000, status: 'pending', date: '2024-10-06', category: '노인' },
    { id: 3, title: '장애인 일자리 창출 사업', org: '함께일하는세상', amount: 15000000, status: 'pending', date: '2024-10-05', category: '장애인' },
    { id: 4, title: '지역아동센터 급식 지원', org: '아이사랑복지관', amount: 7500000, status: 'approved', date: '2024-10-04', category: '아동' },
    { id: 5, title: '환경보호 캠페인 운영', org: '그린피스코리아', amount: 20000000, status: 'rejected', date: '2024-10-03', category: '환경' },
  ];

  const handleApproveProject = React.useCallback(() => {
    if (window.confirm('이 프로젝트를 승인하시겠습니까?')) {
      alert('프로젝트가 승인되었습니다.');
      setShowProjectModal(false);
      setSelectedProject(null);
    }
  }, [setShowProjectModal, setSelectedProject]);

  const handleRejectProject = React.useCallback(() => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    if (window.confirm('이 프로젝트를 반려하시겠습니까?')) {
      alert('프로젝트가 반려되었습니다.');
      setShowProjectModal(false);
      setSelectedProject(null);
      setRejectReason('');
    }
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">모든 상태</option>
                <option value="pending">승인 대기</option>
                <option value="approved">승인 완료</option>
                <option value="rejected">반려</option>
              </select>
              <select
                value={projectCategoryFilter}
                onChange={(e) => setProjectCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              <button className="px-3 py-1 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-lg text-sm font-medium hover:from-red-100 hover:to-pink-100 border border-red-200">
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
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="상세보기"
                        >
                          <Eye size={16} className="text-gray-600" />
                        </button>
                        {project.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                if (window.confirm('이 프로젝트를 승인하시겠습니까?')) {
                                  alert('프로젝트가 승인되었습니다.');
                                }
                              }}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="승인"
                            >
                              <CheckCircle size={16} className="text-green-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProject(project);
                                setShowProjectModal(true);
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="반려"
                            >
                              <XCircle size={16} className="text-red-600" />
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
              <button className="px-3 py-1 border rounded-lg bg-red-500 text-white border-red-500">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>다음</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectManagementPage;
