import React, { useState } from 'react';
import { PiggyBank as PiggyBankIcon, TrendingUp, Calendar, DollarSign, Users, Clock, ArrowUpRight, ArrowDownRight, Download, FileText, CheckCircle, AlertCircle, Send, Eye, Filter, Search, X, ChevronRight, ChevronLeft, Lock, ClipboardCheck } from 'lucide-react';
import type { PiggyBank } from '../../types';

interface PiggyBankPageProps {
  piggyBanks: PiggyBank[];
  onBack: () => void;
}

// 확장된 PiggyBank 타입
interface ExtendedPiggyBank extends PiggyBank {
  projectStatus?: 'completed' | 'active';
  targetAmount?: number;
  achievementRate?: number;
  donorCount?: number;
  createdAt?: string;
  canWithdraw?: boolean;
  recentDonations?: number;
  settlementDate?: string;
  lockReason?: string;
  settlementStatus?: {
    requestDate: string;
    requestAmount: number;
    status: 'pending' | 'completed' | 'rejected';
    approvedDate?: string;
    completedDate?: string;
    transferredAmount?: number;
    fee?: number;
    step: number;
    documents?: string[];
    reason?: string;
  };
}

interface Transaction {
  id: number;
  piggyBankId: number;
  projectTitle: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  donor?: string;
  message?: string;
  note?: string;
  timestamp: string;
  receiptNumber?: string;
  settlementId?: string;
}

interface SettlementHistory {
  id: number;
  piggyBankId: number;
  projectTitle: string;
  requestDate: string;
  requestAmount: number;
  status: 'completed' | 'pending' | 'rejected';
  approvedDate?: string;
  completedDate?: string;
  transferredAmount?: number;
  fee?: number;
  feeRate: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  documents: string[];
  rejectionReason?: string;
}

const PiggyBankPage: React.FC<PiggyBankPageProps> = ({ piggyBanks, onBack }) => {
  const [selectedProject, setSelectedProject] = useState<ExtendedPiggyBank | null>(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [transactionDateFilter, setTransactionDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 확장된 저금통 데이터 (기존 데이터에 추가 정보 포함)
  const extendedPiggyBanks: ExtendedPiggyBank[] = piggyBanks.map((pb, index) => {
    // 정산 대기 상태 샘플
    if (index === 2 && pb.status === 'active') {
      return {
        ...pb,
        status: 'pending_settlement' as any,
        projectStatus: 'active',
        targetAmount: 5000000,
        achievementRate: 87,
        donorCount: 198,
        createdAt: '2024-01-15',
        canWithdraw: false,
        recentDonations: 12,
        settlementStatus: {
          requestDate: '2024-03-10',
          requestAmount: pb.balance,
          status: 'pending',
          step: 2,
          documents: ['사용계획서.pdf', '통장사본.jpg']
        }
      };
    }
    // 잠김 상태 샘플
    if (index === 4 && pb.status === 'active') {
      return {
        ...pb,
        status: 'locked' as any,
        projectStatus: 'active',
        targetAmount: 3000000,
        achievementRate: 83,
        donorCount: 89,
        createdAt: '2024-02-15',
        canWithdraw: false,
        recentDonations: 3,
        lockReason: '서류 미비로 인한 일시 잠금'
      };
    }
    return {
      ...pb,
      projectStatus: pb.status === 'withdrawn' ? 'completed' : 'active',
      targetAmount: 5000000,
      achievementRate: Math.round((pb.totalAmount / 5000000) * 100),
      donorCount: 150 + index * 50,
      createdAt: '2024-01-01',
      canWithdraw: pb.status === 'active' && pb.balance > 1000000,
      recentDonations: pb.status === 'active' ? Math.floor(Math.random() * 20) : 0,
      settlementDate: pb.status === 'withdrawn' ? '2024-02-25' : undefined
    };
  });

  // 거래 내역 샘플 데이터
  const transactions: Transaction[] = [
    { id: 1, piggyBankId: 1, projectTitle: '희망의 집 짓기', type: 'deposit', amount: 50000, donor: '김민수', message: '좋은 일에 쓰이길', timestamp: '2024-03-15 14:30', receiptNumber: 'RCP-2024-001234' },
    { id: 2, piggyBankId: 1, projectTitle: '희망의 집 짓기', type: 'deposit', amount: 30000, donor: '이지은', message: '응원합니다', timestamp: '2024-03-15 12:15', receiptNumber: 'RCP-2024-001233' },
    { id: 3, piggyBankId: 2, projectTitle: '아이들의 미래', type: 'deposit', amount: 100000, donor: '박서준', message: '아이들을 위해', timestamp: '2024-03-14 10:20', receiptNumber: 'RCP-2024-001232' },
    { id: 4, piggyBankId: 1, projectTitle: '희망의 집 짓기', type: 'withdrawal', amount: 6300000, note: '프로젝트 집행', timestamp: '2024-02-25 14:00', settlementId: 'STL-2024-001' },
    { id: 5, piggyBankId: 2, projectTitle: '아이들의 미래', type: 'deposit', amount: 20000, donor: '최유진', message: '파이팅!', timestamp: '2024-03-13 16:45', receiptNumber: 'RCP-2024-001231' },
    { id: 6, piggyBankId: 1, projectTitle: '희망의 집 짓기', type: 'deposit', amount: 100000, donor: '정민호', message: '', timestamp: '2024-03-14 09:30', receiptNumber: 'RCP-2024-001230' },
    { id: 7, piggyBankId: 2, projectTitle: '아이들의 미래', type: 'deposit', amount: 50000, donor: '익명', message: '작은 마음입니다', timestamp: '2024-03-13 18:20', receiptNumber: 'RCP-2024-001229' },
  ];

  // 정산 이력 샘플 데이터
  const settlementHistory: SettlementHistory[] = [
    {
      id: 1,
      piggyBankId: 1,
      projectTitle: '희망의 집 짓기',
      requestDate: '2024-02-20',
      requestAmount: 6300000,
      status: 'completed',
      approvedDate: '2024-02-23',
      completedDate: '2024-02-25',
      transferredAmount: 6111000,
      fee: 189000,
      feeRate: 3,
      bankName: '국민은행',
      accountNumber: '123-456-7890',
      accountHolder: '희망재단',
      documents: ['사용계획서_최종.pdf', '통장사본.jpg']
    },
    {
      id: 2,
      piggyBankId: 3,
      projectTitle: '봄날의 따뜻함',
      requestDate: '2024-03-10',
      requestAmount: 4350000,
      status: 'pending',
      feeRate: 3,
      bankName: '신한은행',
      accountNumber: '987-654-3210',
      accountHolder: '나눔재단',
      documents: ['사용계획서.pdf', '통장사본.jpg']
    }
  ];

  const filteredPiggyBanks = extendedPiggyBanks.filter(pb => {
    if (selectedFilter === 'active') return pb.status === 'active';
    if (selectedFilter === 'withdrawn') return pb.status === 'withdrawn';
    if (selectedFilter === 'can-withdraw') return pb.canWithdraw;
    if (selectedFilter === 'pending') return pb.status === 'pending_settlement';
    if (selectedFilter === 'locked') return pb.status === 'locked';
    return true;
  }).filter(pb =>
    pb.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 통계 계산
  const totalBalance = extendedPiggyBanks.reduce((sum, pb) => sum + pb.balance, 0);
  const totalDonations = extendedPiggyBanks.reduce((sum, pb) => sum + pb.totalAmount, 0);
  const totalWithdrawn = extendedPiggyBanks.reduce((sum, pb) => sum + pb.withdrawnAmount, 0);
  const activePiggyBanks = extendedPiggyBanks.filter(pb => pb.status === 'active').length;

  const handleSettlementRequest = (piggyBank: ExtendedPiggyBank) => {
    setSelectedProject(piggyBank);
    setShowSettlementModal(true);
  };

  const handleViewTransactions = (piggyBank: ExtendedPiggyBank) => {
    setSelectedProject(piggyBank);
    setShowTransactionModal(true);
    setCurrentPage(1);
  };

  const handleViewHistory = () => {
    setShowHistoryModal(true);
  };

  const handleDownloadReceipt = (receiptNumber: string) => {
    alert(`영수증 ${receiptNumber}을 다운로드합니다.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { text: '운영중', color: 'bg-blue-100 text-blue-600' };
      case 'withdrawn':
        return { text: '정산완료', color: 'bg-green-100 text-green-600' };
      case 'pending_settlement':
        return { text: '정산대기', color: 'bg-yellow-100 text-yellow-600' };
      case 'locked':
        return { text: '잠김', color: 'bg-gray-100 text-gray-600' };
      default:
        return { text: '알 수 없음', color: 'bg-gray-100 text-gray-600' };
    }
  };

  const getSettlementStepInfo = (step: number) => {
    const steps = [
      { label: '정산 요청', icon: <Send size={16} /> },
      { label: '서류 검토', icon: <ClipboardCheck size={16} /> },
      { label: '승인 완료', icon: <CheckCircle size={16} /> },
      { label: '송금 완료', icon: <DollarSign size={16} /> }
    ];
    return steps.map((s, idx) => ({ ...s, active: idx < step, current: idx === step - 1 }));
  };

  const renderSidebar = () => (
    <div className="w-72 flex-shrink-0">
      {/* 빠른 통계 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">빠른 통계</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <span className="text-sm text-gray-700">총 잔액</span>
            <span className="font-bold text-gray-900">{(totalBalance / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-gray-700">총 모금액</span>
            <span className="font-bold text-gray-900">{(totalDonations / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-700">정산 완료</span>
            <span className="font-bold text-gray-900">{(totalWithdrawn / 1000000).toFixed(1)}M</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-sm text-gray-700">운영 중</span>
            <span className="font-bold text-gray-900">{activePiggyBanks}개</span>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">필터</h3>
        <div className="space-y-2">
          {[
            { id: 'all', label: '전체 프로젝트', count: extendedPiggyBanks.length },
            { id: 'active', label: '운영 중', count: extendedPiggyBanks.filter(pb => pb.status === 'active').length },
            { id: 'pending', label: '정산 대기', count: extendedPiggyBanks.filter(pb => pb.status === 'pending_settlement').length },
            { id: 'withdrawn', label: '정산 완료', count: extendedPiggyBanks.filter(pb => pb.status === 'withdrawn').length },
            { id: 'can-withdraw', label: '정산 가능', count: extendedPiggyBanks.filter(pb => pb.canWithdraw).length },
            { id: 'locked', label: '잠김', count: extendedPiggyBanks.filter(pb => pb.status === 'locked').length }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${selectedFilter === filter.id
                ? 'bg-red-500 text-white'
                : 'hover:bg-gray-50 text-gray-700'
                }`}
            >
              <span className="text-sm">{filter.label}</span>
              <span className={`text-sm ${selectedFilter === filter.id ? 'text-white/90' : 'text-gray-500'}`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 정산 이력 바로가기 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-base font-bold text-gray-900 mb-3">정산 관리</h3>
        <button
          onClick={handleViewHistory}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 flex items-center justify-between transition-colors"
        >
          <span>정산 이력 보기</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderMainContent = () => (
    <div className="flex-1 min-w-0">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">내 프로젝트 저금통</h2>
            <p className="text-sm text-gray-600 mt-1">프로젝트별 기부금을 관리하고 정산하세요</p>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors">
            <Download size={18} />
            리포트 다운로드
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="프로젝트명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 프로젝트 그리드 */}
      {filteredPiggyBanks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <PiggyBankIcon className="mx-auto mb-4 text-gray-300" size={64} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">저금통이 없습니다</h3>
          <p className="text-gray-500">프로젝트를 등록하면 자동으로 저금통이 생성됩니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPiggyBanks.map(piggyBank => {
            const statusBadge = getStatusBadge(piggyBank.status);
            return (
              <div
                key={piggyBank.projectId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-200 transition-all overflow-hidden"
              >
                {/* 카드 헤더 */}
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{piggyBank.projectTitle}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusBadge.color}`}>
                          {statusBadge.text}
                        </span>
                        {piggyBank.status === 'locked' && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Lock size={12} />
                            잠김
                          </span>
                        )}
                        {piggyBank.recentDonations && piggyBank.recentDonations > 0 && (
                          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                            최근 {piggyBank.recentDonations}건
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl">
                      <PiggyBankIcon size={28} className="text-red-600" />
                    </div>
                  </div>

                  {/* 잠김 사유 */}
                  {piggyBank.status === 'locked' && piggyBank.lockReason && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 flex items-center gap-2">
                        <AlertCircle size={14} />
                        {piggyBank.lockReason}
                      </p>
                    </div>
                  )}

                  {/* 잔액 */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">현재 잔액</p>
                    <p className="text-3xl font-bold text-gray-900">{piggyBank.balance.toLocaleString()}원</p>
                  </div>
                </div>

                {/* 카드 본문 */}
                <div className="p-5">
                  {/* 정산 진행 단계 */}
                  {piggyBank.status === 'pending_settlement' && piggyBank.settlementStatus && (
                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-bold text-gray-900 mb-3">정산 진행 상황</p>
                      <div className="flex items-center justify-between">
                        {getSettlementStepInfo(piggyBank.settlementStatus.step).map((step, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.active ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'
                              }`}>
                              {step.icon}
                            </div>
                            <p className={`text-xs mt-1 text-center ${step.active ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                              {step.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 진행률 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">목표 달성률</span>
                      <span className={`font-bold ${(piggyBank.achievementRate || 0) >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {piggyBank.achievementRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(piggyBank.achievementRate || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 통계 그리드 */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">총 모금</p>
                      <p className="font-bold text-gray-900 text-sm">{(piggyBank.totalAmount / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">기부자</p>
                      <p className="font-bold text-gray-900 text-sm">{piggyBank.donorCount}명</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">정산액</p>
                      <p className="font-bold text-gray-900 text-sm">{(piggyBank.withdrawnAmount / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewTransactions(piggyBank)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye size={16} />
                      거래내역
                    </button>
                    {piggyBank.canWithdraw && piggyBank.status !== 'locked' && (
                      <button
                        onClick={() => handleSettlementRequest(piggyBank)}
                        className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                      >
                        <Send size={16} />
                        정산 요청
                      </button>
                    )}
                  </div>

                  {/* 마지막 업데이트 */}
                  <p className="text-xs text-gray-500 text-center mt-4">
                    최종 업데이트: {piggyBank.lastUpdated}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSettlementModal = () => {
    if (!showSettlementModal || !selectedProject) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">정산 요청</h3>
                <p className="text-gray-600 mt-1">프로젝트 기부금을 정산 요청합니다</p>
              </div>
              <button
                onClick={() => setShowSettlementModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 프로젝트 정보 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-3">프로젝트 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">프로젝트명</span>
                  <span className="font-bold">{selectedProject.projectTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">현재 잔액</span>
                  <span className="font-bold text-red-600">{selectedProject.balance.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">기부자 수</span>
                  <span className="font-bold">{selectedProject.donorCount}명</span>
                </div>
              </div>
            </div>

            {/* 정산 금액 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                정산 요청 금액
              </label>
              <input
                type="text"
                placeholder="금액을 입력하세요"
                defaultValue={selectedProject.balance.toLocaleString()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  • 수수료 3% 제외 후 실제 입금액: <strong>{(selectedProject.balance * 0.97).toLocaleString()}원</strong>
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  • 수수료: <strong>{(selectedProject.balance * 0.03).toLocaleString()}원</strong>
                </p>
              </div>
            </div>

            {/* 계좌 정보 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                입금 계좌
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="은행명"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="계좌번호"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="예금주"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 사용 계획서 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                사용 계획서 첨부 <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 transition-colors cursor-pointer">
                <FileText className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600">클릭하여 파일 업로드</p>
                <p className="text-xs text-gray-400 mt-1">PDF, 이미지 (최대 10MB)</p>
              </div>
            </div>

            {/* 안내사항 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h5 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle size={18} />
                정산 안내
              </h5>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 정산 요청 후 관리자 승인까지 2-3 영업일 소요됩니다</li>
                <li>• 승인 후 1-2 영업일 내 입금 처리됩니다</li>
                <li>• 사용 계획서는 필수 제출 서류입니다</li>
                <li>• 서류 미비 시 반려될 수 있습니다</li>
              </ul>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setShowSettlementModal(false)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                alert('정산 요청이 완료되었습니다!');
                setShowSettlementModal(false);
              }}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
              정산 요청하기
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionModal = () => {
    if (!showTransactionModal || !selectedProject) return null;

    let projectTransactions = transactions.filter(t => t.piggyBankId === selectedProject.projectId);

    // 필터 적용
    if (transactionFilter !== 'all') {
      projectTransactions = projectTransactions.filter(t => t.type === transactionFilter);
    }

    if (transactionDateFilter !== 'all') {
      const now = new Date();
      projectTransactions = projectTransactions.filter(t => {
        const txDate = new Date(t.timestamp);
        const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));

        if (transactionDateFilter === 'today') return diffDays === 0;
        if (transactionDateFilter === 'week') return diffDays <= 7;
        if (transactionDateFilter === 'month') return diffDays <= 30;
        return true;
      });
    }

    // 페이지네이션
    const totalPages = Math.ceil(projectTransactions.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedTransactions = projectTransactions.slice(startIdx, startIdx + itemsPerPage);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">거래 내역</h3>
                <p className="text-gray-600 mt-1">{selectedProject.projectTitle}</p>
              </div>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setTransactionFilter('all');
                  setTransactionDateFilter('all');
                  setCurrentPage(1);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* 필터 */}
            <div className="flex gap-3 mt-4">
              <select
                value={transactionFilter}
                onChange={(e) => {
                  setTransactionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">전체 거래</option>
                <option value="deposit">입금만</option>
                <option value="withdrawal">출금만</option>
              </select>

              <select
                value={transactionDateFilter}
                onChange={(e) => {
                  setTransactionDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">전체 기간</option>
                <option value="today">오늘</option>
                <option value="week">최근 1주일</option>
                <option value="month">최근 1개월</option>
              </select>

              <button className="ml-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium">
                <Download size={16} />
                엑셀 다운로드
              </button>
            </div>
          </div>

          <div className="p-6">
            {paginatedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto mb-4 text-gray-300" size={64} />
                <p className="text-gray-500">거래 내역이 없습니다</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${tx.type === 'deposit' ? 'bg-blue-50' : 'bg-green-50'
                          }`}>
                          {tx.type === 'deposit' ? (
                            <ArrowUpRight className="text-blue-600" size={24} />
                          ) : (
                            <ArrowDownRight className="text-green-600" size={24} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {tx.type === 'deposit' ? tx.donor : '정산 출금'}
                          </p>
                          {tx.message && (
                            <p className="text-sm text-gray-600 italic">"{tx.message}"</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{tx.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`text-xl font-bold ${tx.type === 'deposit' ? 'text-blue-600' : 'text-green-600'
                            }`}>
                            {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()}원
                          </p>
                          {tx.receiptNumber && (
                            <p className="text-xs text-gray-500 mt-1">{tx.receiptNumber}</p>
                          )}
                        </div>
                        {tx.receiptNumber && (
                          <button
                            onClick={() => handleDownloadReceipt(tx.receiptNumber!)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="영수증 다운로드"
                          >
                            <Download size={16} className="text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {[...Array(totalPages)].map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`px-4 py-2 rounded-lg font-medium ${currentPage === idx + 1
                          ? 'bg-red-500 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryModal = () => {
    if (!showHistoryModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">정산 이력</h3>
                <p className="text-gray-600 mt-1">모든 정산 요청 및 완료 내역</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {settlementHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto mb-4 text-gray-300" size={64} />
                <p className="text-gray-500">정산 이력이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settlementHistory.map(history => (
                  <div key={history.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* 헤더 */}
                    <div className="p-5 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-lg text-gray-900">{history.projectTitle}</h4>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${history.status === 'completed' ? 'bg-green-100 text-green-600' :
                          history.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                          {history.status === 'completed' ? '정산 완료' :
                            history.status === 'pending' ? '검토 중' : '반려'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>요청일: {history.requestDate}</span>
                        {history.completedDate && <span>완료일: {history.completedDate}</span>}
                      </div>
                    </div>

                    {/* 본문 */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        <div>
                          <h5 className="text-sm font-bold text-gray-700 mb-3">정산 정보</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">요청 금액</span>
                              <span className="font-bold">{history.requestAmount.toLocaleString()}원</span>
                            </div>
                            {history.transferredAmount && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">수수료 ({history.feeRate}%)</span>
                                  <span className="font-bold text-red-600">-{history.fee?.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                  <span className="text-gray-600">실 입금액</span>
                                  <span className="font-bold text-green-600">{history.transferredAmount.toLocaleString()}원</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-bold text-gray-700 mb-3">계좌 정보</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">은행</span>
                              <span className="font-medium">{history.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">계좌번호</span>
                              <span className="font-medium">{history.accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">예금주</span>
                              <span className="font-medium">{history.accountHolder}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 첨부 서류 */}
                      <div className="mb-4">
                        <h5 className="text-sm font-bold text-gray-700 mb-2">첨부 서류</h5>
                        <div className="flex gap-2 flex-wrap">
                          {history.documents.map((doc, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm flex items-center gap-2">
                              <FileText size={14} />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 반려 사유 */}
                      {history.status === 'rejected' && history.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>반려 사유:</strong> {history.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2"
          >
            ← 마이페이지로
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <PiggyBankIcon size={36} className="text-red-600" />
            저금통 관리
          </h1>
          <p className="text-gray-600">내 프로젝트의 기부금을 관리하고 정산하세요</p>
        </div>

        {/* 메인 레이아웃: 좌우 분할 */}
        <div className="flex gap-6">
          {/* 왼쪽 사이드바 */}
          {renderSidebar()}

          {/* 오른쪽 메인 콘텐츠 */}
          {renderMainContent()}
        </div>

        {/* 모달들 */}
        {renderSettlementModal()}
        {renderTransactionModal()}
        {renderHistoryModal()}
      </div>
    </div>
  );
};

export default PiggyBankPage;
