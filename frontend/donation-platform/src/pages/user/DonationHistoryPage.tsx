import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, Calendar, Heart, CheckCircle, AlertCircle, Search, Loader2, TrendingUp, Award, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { getMyDonations, getMyDonationStats, type DonationStatsResponse } from '../../api/donations';

interface DonationHistory {
  id: number;
  projectTitle: string;
  amount: number;
  date: string;
  receiptNumber: string;
  status: 'completed' | 'pending';
  donorName: string;
  organization: string;
}

interface DonationHistoryPageProps {
  onBack: () => void;
}

const DonationHistoryPage: React.FC<DonationHistoryPageProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([]);
  const [stats, setStats] = useState<DonationStatsResponse | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfDonation, setPdfDonation] = useState<DonationHistory | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // 연도 옵션 생성
  const currentYear = new Date().getFullYear();
  const yearOptions = ['all', ...Array.from({ length: 5 }, (_, i) => String(currentYear - i))];

  // 통계 API 호출
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getMyDonationStats();
        setStats(response);
      } catch (error) {
        console.error('기부 통계 조회 실패:', error);
      }
    };
    fetchStats();
  }, []);

  // 기부 내역 API 호출
  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const response = await getMyDonations({
        year: selectedYear === 'all' ? undefined : selectedYear,
        status: filterStatus === 'all' ? undefined : filterStatus,
        page: currentPage - 1,
        size: pageSize,
      });

      const mappedData: DonationHistory[] = response.content.map((item: any) => ({
        id: item.donationId || item.id,
        projectTitle: item.projectTitle || '프로젝트명 없음',
        amount: item.amount,
        date: item.createdAt ? item.createdAt.split('T')[0] : item.date || '',
        receiptNumber: item.receiptNumber || `RCP-${item.donationId || item.id}`,
        status: item.status?.toLowerCase() === 'completed' ? 'completed' : 'pending',
        donorName: item.donorName || '기부자',
        organization: item.organizationName || item.organization || '기관명 없음',
      }));

      setDonationHistory(mappedData);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || mappedData.length);
    } catch (error: any) {
      console.error('기부 내역 조회 실패:', error);
      toast.error('기부 내역을 불러오는데 실패했습니다.');
      setDonationHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, filterStatus]);

  useEffect(() => {
    fetchDonations();
  }, [currentPage, selectedYear, filterStatus]);

  const filteredHistory = searchTerm.trim()
    ? donationHistory.filter(item =>
        item.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.organization.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : donationHistory;

  // PDF 영수증 생성
  const generateReceiptPDF = async (donation: DonationHistory) => {
    setIsGeneratingPDF(true);
    setPdfDonation(donation);

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      if (!receiptRef.current) {
        throw new Error('영수증 템플릿을 찾을 수 없습니다.');
      }

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: receiptRef.current.scrollHeight,
        height: receiptRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      // A4 크기: 210mm x 297mm
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = 10;

      // 이미지 높이가 페이지를 초과하면 페이지 크기를 조정
      const requiredHeight = imgHeight + yOffset + 10; // 상하 여백 포함

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: requiredHeight > pageHeight ? [pageWidth, requiredHeight] : 'a4',
      });

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`기부금영수증_${donation.receiptNumber}.pdf`);
      toast.success('영수증이 다운로드되었습니다.');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      toast.error('영수증 다운로드에 실패했습니다.');
    } finally {
      setIsGeneratingPDF(false);
      setPdfDonation(null);
    }
  };

  const downloadAllReceipts = () => {
    const completedDonations = filteredHistory.filter(d => d.status === 'completed');

    if (completedDonations.length === 0) {
      toast.error('다운로드 가능한 영수증이 없습니다.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: '영수증 다운로드',
      message: `${completedDonations.length}개의 영수증을 다운로드하시겠습니까?`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        for (const donation of completedDonations) {
          await generateReceiptPDF(donation);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        toast.success(`${completedDonations.length}개의 영수증 다운로드 완료`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section - 홈페이지 스타일 */}
      <section className="relative bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />

        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <button
            onClick={onBack}
            className="mb-4 text-stone-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={16} />
            마이페이지로
          </button>

          <h1 className="text-2xl md:text-3xl text-white font-light mb-2">
            기부 <span className="font-medium">내역</span>
          </h1>
          <p className="text-stone-400 text-sm">나의 소중한 기부 활동 기록</p>

          {/* 통계 카드 - 홈페이지 Our Impact 스타일 */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-amber-400" size={18} />
                <span className="text-sm text-white/80">총 기부 금액</span>
              </div>
              <p className="text-xl md:text-2xl font-light text-white">
                {stats ? Number(stats.totalAmount).toLocaleString() : '0'}원
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="text-amber-400" size={18} />
                <span className="text-sm text-white/80">참여 프로젝트</span>
              </div>
              <p className="text-xl md:text-2xl font-light text-white">
                {stats?.totalCount || 0}개
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-amber-400" size={18} />
                <span className="text-sm text-white/80">영수증 발급 가능</span>
              </div>
              <p className="text-xl md:text-2xl font-light text-white">
                {stats?.completedCount || 0}건
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        {/* 필터 및 검색 */}
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="프로젝트명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-white"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year === 'all' ? '전체 연도' : `${year}년`}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'pending')}
              className="px-4 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm bg-white"
            >
              <option value="all">전체</option>
              <option value="completed">완료</option>
              <option value="pending">대기중</option>
            </select>

            <button
              onClick={downloadAllReceipts}
              className="px-5 py-2.5 bg-amber-500 text-stone-900 rounded-xl font-medium hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
              <Download size={16} />
              전체 다운로드
            </button>
          </div>
        </div>

        {/* 기부 내역 리스트 */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                <Heart className="text-stone-300" size={32} />
              </div>
              <p className="text-stone-600 font-medium mb-2">기부 내역이 없습니다</p>
              <p className="text-sm text-stone-500">검색 조건을 변경해보세요</p>
            </div>
          ) : (
            <>
              {/* 데스크탑 리스트 뷰 */}
              <div className="hidden lg:block">
                {filteredHistory.map((donation, idx) => (
                  <div
                    key={donation.id}
                    className={`flex items-center justify-between p-5 hover:bg-stone-50 transition-colors ${
                      idx !== filteredHistory.length - 1 ? 'border-b border-stone-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Heart className="text-amber-500" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-stone-800">{donation.projectTitle}</p>
                        <p className="text-sm text-stone-500">{donation.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium text-amber-600 text-lg">{donation.amount.toLocaleString()}원</p>
                        {donation.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle size={12} />
                            완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                            <AlertCircle size={12} />
                            대기중
                          </span>
                        )}
                      </div>

                      {donation.status === 'completed' && (
                        <button
                          onClick={() => generateReceiptPDF(donation)}
                          className="p-2.5 bg-amber-500 text-stone-900 rounded-xl hover:bg-amber-400 transition-colors"
                        >
                          <Download size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 모바일 카드 뷰 */}
              <div className="lg:hidden divide-y divide-stone-100">
                {filteredHistory.map((donation) => (
                  <div key={donation.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <Heart className="text-amber-500" size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-stone-800 text-sm">{donation.projectTitle}</p>
                          <p className="text-xs text-stone-500">{donation.date}</p>
                        </div>
                      </div>
                      {donation.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                          <CheckCircle size={12} />
                          완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs">
                          <AlertCircle size={12} />
                          대기중
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="font-medium text-amber-600">{donation.amount.toLocaleString()}원</p>
                      {donation.status === 'completed' && (
                        <button
                          onClick={() => generateReceiptPDF(donation)}
                          className="p-2 bg-amber-500 text-stone-900 rounded-lg hover:bg-amber-400 transition-colors"
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-stone-100">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* 안내 사항 */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
            <FileText size={18} />
            영수증 안내
          </h3>
          <ul className="text-sm text-amber-800 space-y-1.5">
            <li>• 기부금 영수증은 기부 완료 후 즉시 발급됩니다.</li>
            <li>• 연말정산 시 소득공제 또는 세액공제를 받으실 수 있습니다.</li>
            <li>• 영수증 재발급 문의: 고객센터 (02-1234-5678)</li>
          </ul>
        </div>
      </section>

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />

      {/* PDF 생성용 숨겨진 영수증 템플릿 */}
      {pdfDonation && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div
            ref={receiptRef}
            style={{
              width: '600px',
              padding: '40px',
              backgroundColor: '#fff',
              fontFamily: "'Malgun Gothic', 'Noto Sans KR', sans-serif",
            }}
          >
            <div style={{ border: '2px solid #333', padding: '30px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '10px', fontWeight: 'bold' }}>기부금 영수증</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>DONATION RECEIPT</p>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', background: '#f5f5f5', padding: '8px 12px', marginBottom: '15px', borderLeft: '4px solid #f59e0b' }}>
                  영수증 정보
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px dashed #ddd' }}>
                  <span style={{ color: '#666' }}>영수증 번호</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.receiptNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
                  <span style={{ color: '#666' }}>발급일자</span>
                  <span style={{ fontWeight: 'bold' }}>{new Date().toLocaleDateString('ko-KR')}</span>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', background: '#f5f5f5', padding: '8px 12px', marginBottom: '15px', borderLeft: '4px solid #f59e0b' }}>
                  기부자 정보
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px dashed #ddd' }}>
                  <span style={{ color: '#666' }}>성명</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.donorName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
                  <span style={{ color: '#666' }}>기부일자</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.date}</span>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', background: '#f5f5f5', padding: '8px 12px', marginBottom: '15px', borderLeft: '4px solid #f59e0b' }}>
                  기부 내역
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px dashed #ddd' }}>
                  <span style={{ color: '#666' }}>프로젝트</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.projectTitle}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px' }}>
                  <span style={{ color: '#666' }}>수혜기관</span>
                  <span style={{ fontWeight: 'bold' }}>{pdfDonation.organization}</span>
                </div>
                <div style={{ fontSize: '24px', color: '#f59e0b', textAlign: 'center', padding: '20px', background: '#fffbeb', borderRadius: '8px', margin: '15px 0', fontWeight: 'bold' }}>
                  기부금액: {pdfDonation.amount.toLocaleString()}원
                </div>
              </div>

              <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '8px', fontSize: '13px', color: '#92400e', lineHeight: '1.6' }}>
                <strong>세액공제 안내</strong><br /><br />
                본 영수증은 연말정산 시 세액공제를 받으실 수 있습니다.<br />
                소득세법 제34조 및 법인세법 제24조에 따라 기부금 세액공제 대상입니다.<br />
                영수증은 5년간 보관하시기 바랍니다.
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd', color: '#666', fontSize: '12px' }}>
                발급기관: {pdfDonation.organization}<br />
                문의전화: 02-1234-5678<br /><br />
                <strong>위넥트(WeNect) 기부 플랫폼</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF 생성 중 로딩 오버레이 */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl">
            <Loader2 className="animate-spin text-amber-500" size={48} />
            <p className="text-lg font-medium text-stone-700">영수증 PDF 생성 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationHistoryPage;
