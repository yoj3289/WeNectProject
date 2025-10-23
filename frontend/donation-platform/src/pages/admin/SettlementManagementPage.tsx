import React, { useState } from 'react';
import { Search, FileText, X, CreditCard, AlertCircle, Download, FileSpreadsheet, FileDown, Eye, CheckCircle, XCircle } from 'lucide-react';
import type { AdminDashboardProps } from '../../types/admin';
import * as XLSX from 'xlsx';

interface SettlementManagementPageProps extends AdminDashboardProps {
  rejectReason: string;
  setRejectReason: (reason: string) => void;
}

// Settlement Detail Modal Component
const SettlementDetailModalContent: React.FC<{
  selectedSettlement: any;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  handleApproveSettlement: () => void;
  handleRejectSettlement: () => void;
  onClose: () => void;
}> = React.memo(({ selectedSettlement, rejectReason, setRejectReason, handleApproveSettlement, handleRejectSettlement, onClose }) => {
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
            <h2 className="text-2xl font-bold text-gray-800">정산 검토</h2>
            <p className="text-sm text-gray-600 mt-1">정산 정보를 확인하고 승인/거부 처리하세요</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">정산 대기중</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-3">{selectedSettlement.project}</h3>
            <p className="text-gray-600 mt-2">{selectedSettlement.org}</p>
            <div className="bg-white rounded-lg p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">정산 금액</span>
                <span className="text-3xl font-bold text-green-600">{selectedSettlement.amount.toLocaleString()}원</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">신청일</span>
                <span className="font-semibold text-gray-800">{selectedSettlement.date}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-green-500" />
              프로젝트 정보
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">목표 금액</p>
                <p className="text-xl font-bold text-gray-800">50,000,000원</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">최종 모금액</p>
                <p className="text-xl font-bold text-green-600">52,500,000원</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">달성률</p>
                <p className="text-xl font-bold text-blue-600">105%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">기부자 수</p>
                <p className="text-xl font-bold text-purple-600">1,234명</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-500" />
              입금 계좌 정보
            </h4>
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">은행명</span>
                <span className="font-semibold text-gray-800">국민은행</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">계좌번호</span>
                <span className="font-semibold text-gray-800">123-456-789012</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">예금주</span>
                <span className="font-semibold text-gray-800">사회복지법인 희망나눔</span>
              </div>
            </div>
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
                    <p className="font-semibold text-gray-800">사용내역서.pdf</p>
                    <p className="text-sm text-gray-500">1.8 MB</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">다운로드</button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">영수증_모음.pdf</p>
                    <p className="text-sm text-gray-500">3.2 MB</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">다운로드</button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" />
              주의사항
            </h4>
            <ul className="space-y-2 text-sm text-amber-900">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>정산 승인 후 취소가 불가능하니 신중히 검토해주세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>첨부된 서류를 반드시 확인하신 후 승인해주세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>승인 시 즉시 입금 처리되며, 거래 내역이 기록됩니다.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500" />
              거부 사유 (선택)
            </h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="정산을 거부할 경우 사유를 입력해주세요..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50">취소</button>
          <button onClick={handleRejectSettlement} className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600">거부</button>
          <button onClick={handleApproveSettlement} className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">승인 및 송금</button>
        </div>
      </div>
    </div>
  );
});

const SettlementManagementPage: React.FC<SettlementManagementPageProps> = ({
  settlementFilter,
  setSettlementFilter,
  settlementSearchTerm,
  setSettlementSearchTerm,
  selectedSettlements,
  setSelectedSettlements,
  selectedSettlement,
  setSelectedSettlement,
  showSettlementModal,
  setShowSettlementModal,
  rejectReason,
  setRejectReason,
}) => {
  const settlements = [
    { id: 1, project: '독거노인 생활 지원', org: '실버케어센터', targetAmount: 50000000, finalAmount: 52500000, amount: 9800000, date: '2024-03-15', status: 'pending', files: 2 },
    { id: 2, project: '청소년 진로 멘토링', org: '청년미래재단', targetAmount: 80000000, finalAmount: 85000000, amount: 15000000, date: '2024-03-10', status: 'pending', files: 3 },
    { id: 3, project: '장애인 재활 프로그램', org: '함께가는복지관', targetAmount: 45000000, finalAmount: 48000000, amount: 8500000, date: '2024-03-05', status: 'completed', files: 2 },
  ];

  const handleApproveSettlement = React.useCallback(() => {
    if (window.confirm('정산을 승인하고 송금 처리하시겠습니까?')) {
      alert('정산이 승인되었습니다. 송금 처리가 진행됩니다.');
      setShowSettlementModal(false);
      setSelectedSettlement(null);
    }
  }, [setShowSettlementModal, setSelectedSettlement]);

  const handleRejectSettlement = React.useCallback(() => {
    if (!rejectReason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }
    if (window.confirm('이 정산 요청을 거부하시겠습니까?')) {
      alert('정산 요청이 거부되었습니다.');
      setShowSettlementModal(false);
      setSelectedSettlement(null);
      setRejectReason('');
    }
  }, [rejectReason, setShowSettlementModal, setSelectedSettlement, setRejectReason]);

  const handleCloseSettlementModal = React.useCallback(() => {
    setShowSettlementModal(false);
    setSelectedSettlement(null);
    setRejectReason('');
  }, [setShowSettlementModal, setSelectedSettlement, setRejectReason]);

  // Excel 보고서 생성 함수
  const generateExcelReport = () => {
    const filteredSettlements = settlements.filter(s =>
      (settlementFilter === 'all' || s.status === settlementFilter) &&
      (settlementSearchTerm === '' ||
        s.project.toLowerCase().includes(settlementSearchTerm.toLowerCase()) ||
        s.org.toLowerCase().includes(settlementSearchTerm.toLowerCase()))
    );

    const excelData = filteredSettlements.map(s => ({
      '프로젝트명': s.project,
      '기관명': s.org,
      '목표금액': s.targetAmount.toString(),
      '최종모금액': s.finalAmount.toString(),
      '정산금액': s.amount.toString(),
      '신청일': s.date,
      '상태': s.status === 'pending' ? '대기중' : '완료',
      '첨부파일수': s.files
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '정산관리');

    // 열 너비 설정
    ws['!cols'] = [
      { wch: 25 }, // 프로젝트명
      { wch: 20 }, // 기관명
      { wch: 15 }, // 목표금액
      { wch: 15 }, // 최종모금액
      { wch: 15 }, // 정산금액
      { wch: 12 }, // 신청일
      { wch: 10 }, // 상태
      { wch: 12 }  // 첨부파일수
    ];

    XLSX.writeFile(wb, `정산관리_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // PDF 보고서 생성 함수 (간단한 텍스트 기반)
  const generatePDFReport = () => {
    const filteredSettlements = settlements.filter(s =>
      (settlementFilter === 'all' || s.status === settlementFilter) &&
      (settlementSearchTerm === '' ||
        s.project.toLowerCase().includes(settlementSearchTerm.toLowerCase()) ||
        s.org.toLowerCase().includes(settlementSearchTerm.toLowerCase()))
    );

    let pdfContent = '정산 관리 보고서\n\n';
    pdfContent += `생성일: ${new Date().toLocaleDateString('ko-KR')}\n`;
    pdfContent += `총 건수: ${filteredSettlements.length}건\n\n`;
    pdfContent += '='.repeat(80) + '\n\n';

    filteredSettlements.forEach((s, index) => {
      pdfContent += `${index + 1}. ${s.project}\n`;
      pdfContent += `   기관: ${s.org}\n`;
      pdfContent += `   목표금액: ${s.targetAmount.toLocaleString()}원\n`;
      pdfContent += `   최종모금액: ${s.finalAmount.toLocaleString()}원\n`;
      pdfContent += `   정산금액: ${s.amount.toLocaleString()}원\n`;
      pdfContent += `   신청일: ${s.date}\n`;
      pdfContent += `   상태: ${s.status === 'pending' ? '대기중' : '완료'}\n`;
      pdfContent += `   첨부파일: ${s.files}개\n\n`;
    });

    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `정산관리_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Settlement Detail Modal */}
      {showSettlementModal && selectedSettlement && (
        <SettlementDetailModalContent
          selectedSettlement={selectedSettlement}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          handleApproveSettlement={handleApproveSettlement}
          handleRejectSettlement={handleRejectSettlement}
          onClose={handleCloseSettlementModal}
        />
      )}

      {/* Main Content */}
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">정산 관리</h1>
            <p className="text-sm text-gray-600 mt-1">프로젝트 정산 요청을 검토하고 처리합니다</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateExcelReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
            >
              <FileSpreadsheet size={18} />
              Excel 다운로드
            </button>
            <button
              onClick={generatePDFReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              <FileDown size={18} />
              보고서 다운로드
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={settlementSearchTerm}
                onChange={(e) => setSettlementSearchTerm(e.target.value)}
                placeholder="프로젝트명, 기관명으로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <select
              value={settlementFilter}
              onChange={(e) => setSettlementFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">모든 상태</option>
              <option value="pending">대기중</option>
              <option value="completed">완료</option>
            </select>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedSettlements.length === 0}
              onClick={() => {
                alert(`${selectedSettlements.length}건의 정산을 승인합니다.`);
                setSelectedSettlements([]);
              }}
            >
              선택 항목 승인 ({selectedSettlements.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedSettlements.length === settlements.filter(s =>
                        (settlementFilter === 'all' || s.status === settlementFilter) &&
                        (settlementSearchTerm === '' || s.project.toLowerCase().includes(settlementSearchTerm.toLowerCase()) || s.org.toLowerCase().includes(settlementSearchTerm.toLowerCase()))
                      ).length && settlements.filter(s =>
                        (settlementFilter === 'all' || s.status === settlementFilter) &&
                        (settlementSearchTerm === '' || s.project.toLowerCase().includes(settlementSearchTerm.toLowerCase()) || s.org.toLowerCase().includes(settlementSearchTerm.toLowerCase()))
                      ).length > 0}
                      onChange={(e) => {
                        const filteredSettlements = settlements.filter(s =>
                          (settlementFilter === 'all' || s.status === settlementFilter) &&
                          (settlementSearchTerm === '' || s.project.toLowerCase().includes(settlementSearchTerm.toLowerCase()) || s.org.toLowerCase().includes(settlementSearchTerm.toLowerCase()))
                        );
                        if (e.target.checked) {
                          setSelectedSettlements(filteredSettlements.map(s => s.id));
                        } else {
                          setSelectedSettlements([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">프로젝트명</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">기관</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">정산금액</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">신청일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">첨부서류</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">상태</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {settlements.filter(s =>
                  (settlementFilter === 'all' || s.status === settlementFilter) &&
                  (settlementSearchTerm === '' || s.project.toLowerCase().includes(settlementSearchTerm.toLowerCase()) || s.org.toLowerCase().includes(settlementSearchTerm.toLowerCase()))
                ).map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedSettlements.includes(settlement.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSettlements([...selectedSettlements, settlement.id]);
                          } else {
                            setSelectedSettlements(selectedSettlements.filter(id => id !== settlement.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{settlement.project}</td>
                    <td className="px-6 py-4 text-gray-600">{settlement.org}</td>
                    <td className="px-6 py-4 text-gray-800 font-bold text-lg">{settlement.amount.toLocaleString()}원</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{settlement.date}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedSettlement(settlement);
                          setShowSettlementModal(true);
                        }}
                        className="flex items-center gap-1 text-pink-600 hover:text-pink-700 text-sm font-medium hover:underline"
                      >
                        <FileText size={16} />
                        {settlement.files}개 파일
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {settlement.status === 'pending' ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                          대기중
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          완료
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSettlement(settlement);
                            setShowSettlementModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="상세보기"
                        >
                          <Eye size={16} className="text-gray-600" />
                        </button>
                        {settlement.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                if (window.confirm('이 정산을 승인하시겠습니까?')) {
                                  alert('정산이 승인되었습니다.');
                                }
                              }}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="승인"
                            >
                              <CheckCircle size={16} className="text-green-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSettlement(settlement);
                                setShowSettlementModal(true);
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

          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              총 <strong>{settlements.filter(s =>
                (settlementFilter === 'all' || s.status === settlementFilter) &&
                (settlementSearchTerm === '' || s.project.toLowerCase().includes(settlementSearchTerm.toLowerCase()) || s.org.toLowerCase().includes(settlementSearchTerm.toLowerCase()))
              ).length}</strong>건 중 <strong>1-{settlements.filter(s =>
                (settlementFilter === 'all' || s.status === settlementFilter) &&
                (settlementSearchTerm === '' || s.project.toLowerCase().includes(settlementSearchTerm.toLowerCase()) || s.org.toLowerCase().includes(settlementSearchTerm.toLowerCase()))
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

export default SettlementManagementPage;
