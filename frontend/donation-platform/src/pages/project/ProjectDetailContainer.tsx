import React from 'react';
import { useParams } from 'react-router-dom';
import ProjectDetailPage from './ProjectDetailPage';

interface ProjectDetailContainerProps {
  isLoggedIn: boolean;
  favoriteProjectIds: Set<number>;
  onNavigateToLogin: () => void;
  onShowDonationModal: () => void;
}

/**
 * 프로젝트 상세 페이지 컨테이너
 * - 모든 프로젝트 상태(FUNDING, COMPLETED, SETTLEMENT, CLOSED)에서 동일한 페이지 사용
 * - '진행 현황' 탭만 프로젝트 상태에 따라 다르게 표시
 */
const ProjectDetailContainer: React.FC<ProjectDetailContainerProps> = ({
  isLoggedIn,
  favoriteProjectIds,
  onNavigateToLogin,
  onShowDonationModal,
}) => {
  const { id } = useParams();
  const projectId = Number(id);

  return (
    <ProjectDetailPage
      projectId={projectId}
      isLoggedIn={isLoggedIn}
      favoriteProjectIds={favoriteProjectIds}
      onNavigateToLogin={onNavigateToLogin}
      onShowDonationModal={onShowDonationModal}
    />
  );
};

export default ProjectDetailContainer;
