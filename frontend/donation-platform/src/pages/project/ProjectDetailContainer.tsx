import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useProjectDetail } from '../../hooks/useProjects';
import ProjectActivePage from './ProjectActivePage';
import ProjectSettlementPage from './ProjectSettlementPage';

interface ProjectDetailContainerProps {
  isLoggedIn: boolean;
  favoriteProjectIds: Set<number>;
  onNavigateToLogin: () => void;
  onShowDonationModal: () => void;
}

/**
 * 프로젝트 상태에 따라 적절한 페이지 컴포넌트를 렌더링하는 컨테이너
 * - ACTIVE/APPROVED/PENDING: ProjectActivePage (진행 중 프로젝트)
 * - SETTLEMENT/CLOSED: ProjectSettlementPage (결산 페이지)
 */
const ProjectDetailContainer: React.FC<ProjectDetailContainerProps> = ({
  isLoggedIn,
  favoriteProjectIds,
  onNavigateToLogin,
  onShowDonationModal,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);

  // 프로젝트 기본 정보만 먼저 로드
  const { data: project, isLoading, isError, error } = useProjectDetail(projectId);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">프로젝트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError || !project) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {(error as any)?.response?.data?.message || '프로젝트를 불러오는데 실패했습니다.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 프로젝트 상태에 따라 다른 페이지 렌더링
  const isSettlementPhase =
    project.status?.toLowerCase() === 'completed' ||
    project.status?.toLowerCase() === 'settlement' ||
    project.status?.toLowerCase() === 'closed';

  console.log('Project status:', project.status, 'isSettlementPhase:', isSettlementPhase);

  if (isSettlementPhase) {
    return (
      <ProjectSettlementPage
        projectId={projectId}
        project={project}
        isLoggedIn={isLoggedIn}
        favoriteProjectIds={favoriteProjectIds}
        onNavigateToLogin={onNavigateToLogin}
      />
    );
  }

  return (
    <ProjectActivePage
      projectId={projectId}
      project={project}
      isLoggedIn={isLoggedIn}
      favoriteProjectIds={favoriteProjectIds}
      onNavigateToLogin={onNavigateToLogin}
      onShowDonationModal={onShowDonationModal}
    />
  );
};

export default ProjectDetailContainer;
