import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiggyBank, TrendingUp, CheckCircle, Send, Eye, Search,
  ChevronLeft, Clock, DollarSign, BarChart3
} from 'lucide-react';
import type { PiggyBank as PiggyBankType } from '../../types';

interface PiggyBankData {
  id: number;
  projectTitle: string;
  balance: number;
  totalAmount: number;
  withdrawnAmount: number;
  donorCount: number;
  status: 'active' | 'withdrawn' | 'pending';
  achievementRate: number;
  canWithdraw: boolean;
  lastUpdated: string;
}

interface PiggyBankPageProps {
  piggyBanks: PiggyBankType[];
  onBack: () => void;
}

const PiggyBankPage: React.FC<PiggyBankPageProps> = ({ piggyBanks, onBack }) => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 기존 데이터를 새 형식으로 변환
  const piggyBankData: PiggyBankData[] = piggyBanks.map(pb => ({
    id: pb.projectId,
    projectTitle: pb.projectTitle,
    balance: pb.balance,
    totalAmount: pb.totalAmount,
    withdrawnAmount: pb.withdrawnAmount,
    donorCount: 150 + Math.floor(Math.random() * 100),
    status: pb.status === 'withdrawn' ? 'withdrawn' : 'active',
    achievementRate: Math.round((pb.totalAmount / 5000000) * 100),
    canWithdraw: pb.status === 'active' && pb.balance > 1000000,
    lastUpdated: pb.lastUpdated
  }));

  // 통계
  const totalBalance = piggyBankData.reduce((sum, pb) => sum + pb.balance, 0);
  const totalDonations = piggyBankData.reduce((sum, pb) => sum + pb.totalAmount, 0);
  const totalWithdrawn = piggyBankData.reduce((sum, pb) => sum + pb.withdrawnAmount, 0);
  const activePiggyBanks = piggyBankData.filter(pb => pb.status === 'active').length;

  // 필터링
  const filteredData = piggyBankData.filter(pb => {
    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'active' && pb.status === 'active') ||
      (selectedFilter === 'withdrawn' && pb.status === 'withdrawn') ||
      (selectedFilter === 'can-withdraw' && pb.canWithdraw);
    const matchesSearch = pb.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; bg: string; text: string }> = {
      active: { label: '운영중', bg: 'bg-blue-100', text: 'text-blue-600' },
      withdrawn: { label: '정산완료', bg: 'bg-green-100', text: 'text-green-600' },
      pending: { label: '정산대기', bg: 'bg-amber-100', text: 'text-amber-600' },
    };
    return configs[status] || configs.active;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-r from-stone-800 to-stone-900">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <button
            onClick={onBack}
            className="text-stone-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
          >
            <ChevronLeft size={20} />
            마이페이지로
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center">
              <PiggyBank className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">저금통 관리</h1>
              <p className="text-stone-400 mt-1">내 프로젝트의 기부금을 관리하고 정산하세요</p>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-stone-700/50 backdrop-blur-sm rounded-2xl p-5 border border-stone-600">
              <div className="flex items-center gap-2 text-stone-400 text-sm mb-2">
                <DollarSign size={18} className="text-amber-400" />
                총 잔액
              </div>
              <p className="text-2xl font-bold text-amber-400">{(totalBalance / 10000).toLocaleString()}만원</p>
            </div>

            <div className="bg-stone-700/50 backdrop-blur-sm rounded-2xl p-5 border border-stone-600">
              <div className="flex items-center gap-2 text-stone-400 text-sm mb-2">
                <TrendingUp size={18} className="text-amber-400" />
                총 모금액
              </div>
              <p className="text-2xl font-bold text-white">{(totalDonations / 10000).toLocaleString()}만원</p>
            </div>

            <div className="bg-stone-700/50 backdrop-blur-sm rounded-2xl p-5 border border-stone-600">
              <div className="flex items-center gap-2 text-stone-400 text-sm mb-2">
                <CheckCircle size={18} className="text-amber-400" />
                정산 완료
              </div>
              <p className="text-2xl font-bold text-white">{(totalWithdrawn / 10000).toLocaleString()}만원</p>
            </div>

            <div className="bg-stone-700/50 backdrop-blur-sm rounded-2xl p-5 border border-stone-600">
              <div className="flex items-center gap-2 text-stone-400 text-sm mb-2">
                <BarChart3 size={18} className="text-amber-400" />
                운영 중
              </div>
              <p className="text-2xl font-bold text-white">{activePiggyBanks}개</p>
            </div>
          </div>
        </div>
      </section>

      {/* 메인 컨텐츠 */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        {/* 필터 & 검색 바 */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* 필터 탭 */}
            <div className="flex bg-stone-100 rounded-xl p-1">
              {[
                { id: 'all', label: '전체' },
                { id: 'active', label: '운영중' },
                { id: 'can-withdraw', label: '정산가능' },
                { id: 'withdrawn', label: '정산완료' },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedFilter === filter.id
                      ? 'bg-white shadow text-stone-900'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* 검색 */}
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="프로젝트명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* 저금통 리스트 */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center">
            <PiggyBank className="mx-auto mb-4 text-stone-300" size={64} />
            <h3 className="text-xl font-bold text-stone-900 mb-2">저금통이 없습니다</h3>
            <p className="text-stone-500">프로젝트를 등록하면 자동으로 저금통이 생성됩니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {filteredData.map(pb => {
              const statusConfig = getStatusConfig(pb.status);
              return (
                <div
                  key={pb.id}
                  className="bg-white rounded-2xl border border-stone-200 hover:border-amber-300 hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* 카드 헤더 */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2.5 py-1 ${statusConfig.bg} ${statusConfig.text} rounded-lg text-xs font-semibold`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-stone-900">{pb.projectTitle}</h3>
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <PiggyBank className="text-amber-500" size={24} />
                      </div>
                    </div>

                    {/* 잔액 */}
                    <div className="mb-4">
                      <p className="text-sm text-stone-500 mb-1">현재 잔액</p>
                      <p className="text-3xl font-bold text-stone-900">
                        {pb.balance.toLocaleString()}<span className="text-base text-stone-400 ml-1">원</span>
                      </p>
                    </div>

                    {/* 진행률 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-stone-500">목표 달성률</span>
                        <span className={`text-sm font-bold ${pb.achievementRate >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                          {pb.achievementRate}%
                        </span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pb.achievementRate >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(pb.achievementRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* 통계 */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-stone-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-stone-500 mb-1">총 모금</p>
                        <p className="font-bold text-stone-900">{(pb.totalAmount / 10000).toFixed(0)}만</p>
                      </div>
                      <div className="bg-stone-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-stone-500 mb-1">기부자</p>
                        <p className="font-bold text-stone-900">{pb.donorCount}명</p>
                      </div>
                      <div className="bg-stone-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-stone-500 mb-1">정산액</p>
                        <p className="font-bold text-stone-900">{(pb.withdrawnAmount / 10000).toFixed(0)}만</p>
                      </div>
                    </div>
                  </div>

                  {/* 카드 푸터 */}
                  <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock size={12} />
                      {pb.lastUpdated} 업데이트
                    </span>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors">
                        <Eye size={16} />
                        상세
                      </button>
                      {pb.canWithdraw && (
                        <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors">
                          <Send size={16} />
                          정산 요청
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PiggyBankPage;
