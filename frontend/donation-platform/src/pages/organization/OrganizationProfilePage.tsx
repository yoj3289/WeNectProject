import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Upload, Loader2, AlertCircle, CheckCircle, Save, ArrowLeft, Building2, Mail, Phone, FileText, Calendar, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOrganizationProfile, useUpdateOrganizationProfile, useUpdateOrganizationProfileImage } from '../../hooks/useOrganization';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const OrganizationProfilePage: React.FC = () => {
  const { data: profile, isLoading, isError, refetch } = useOrganizationProfile();
  const updateProfileMutation = useUpdateOrganizationProfile();
  const updateImageMutation = useUpdateOrganizationProfileImage();

  const [bio, setBio] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setImagePreview(profile.profileImage || null);
    }
  }, [profile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('이미지 크기는 2MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setImageFile(file);
  };

  const handleSaveImage = async () => {
    if (!imageFile) return;

    try {
      await updateImageMutation.mutateAsync(imageFile);
      toast.success('프로필 이미지가 업데이트되었습니다.');
      setImageFile(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '이미지 업로드에 실패했습니다.');
    }
  };

  const handleSaveBio = async () => {
    try {
      await updateProfileMutation.mutateAsync({ bio });
      toast.success('소개글이 업데이트되었습니다.');
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '소개글 저장에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !profile) {
    return (
      <div className="bg-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-bold text-stone-800 mb-2">프로필을 불러올 수 없습니다</h2>
          <p className="text-stone-500">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>돌아가기</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <User className="text-amber-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">기관 프로필</h1>
              <p className="text-stone-400 mt-1">기관 정보 및 프로필을 관리합니다</p>
            </div>
          </div>
        </div>
      </section>

      {/* 프로필 미완성 알림 */}
      {profile.profileIncomplete && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-amber-800">프로필을 완성해주세요</h3>
              <p className="text-sm text-amber-700 mt-1">
                기관 로고 이미지를 등록하면 후원자들에게 더 신뢰감을 줄 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 프로필 이미지 카드 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-stone-800 mb-4">기관 로고</h2>

              <div className="flex flex-col items-center">
                {/* 이미지 미리보기 */}
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-stone-300 overflow-hidden flex items-center justify-center bg-stone-50 mb-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="기관 로고"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="text-stone-400" size={48} />
                  )}
                </div>

                {/* 이미지 업로드 버튼 */}
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="profile-image"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium text-sm hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  <Upload size={16} />
                  {imagePreview ? '이미지 변경' : '이미지 업로드'}
                </label>
                <p className="text-xs text-stone-400 mt-2 text-center">
                  JPG, PNG (최대 2MB)
                </p>

                {/* 이미지 저장 버튼 */}
                {imageFile && (
                  <button
                    onClick={handleSaveImage}
                    disabled={updateImageMutation.isPending}
                    className="mt-4 w-full py-2 bg-amber-500 text-stone-900 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updateImageMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        이미지 저장
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 인증 상태 카드 */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 mt-6">
              <h2 className="text-lg font-bold text-stone-800 mb-4">인증 상태</h2>
              <div className="flex items-center gap-3">
                {profile.verified ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-green-700">인증 완료</p>
                      <p className="text-sm text-stone-500">정식 승인된 기관입니다</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertCircle className="text-amber-600" size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-amber-700">승인 대기</p>
                      <p className="text-sm text-stone-500">관리자 승인 대기 중</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 기관 정보 카드 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-stone-800 mb-6">기관 정보</h2>

              <div className="space-y-6">
                {/* 기관명 */}
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    기관명
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                    <Building2 className="text-stone-400" size={20} />
                    <span className="font-medium text-stone-800">{profile.orgName}</span>
                  </div>
                </div>

                {/* 사업자등록번호 */}
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    사업자등록번호
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                    <FileText className="text-stone-400" size={20} />
                    <span className="font-medium text-stone-800">{profile.registrationNumber}</span>
                  </div>
                </div>

                {/* 대표자명 */}
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    대표자명
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                    <User className="text-stone-400" size={20} />
                    <span className="font-medium text-stone-800">{profile.representative}</span>
                  </div>
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    이메일
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                    <Mail className="text-stone-400" size={20} />
                    <span className="font-medium text-stone-800">{profile.email}</span>
                  </div>
                </div>

                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    전화번호
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                    <Phone className="text-stone-400" size={20} />
                    <span className="font-medium text-stone-800">{profile.phone}</span>
                  </div>
                </div>

                {/* 가입일 */}
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-1">
                    가입일
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                    <Calendar className="text-stone-400" size={20} />
                    <span className="font-medium text-stone-800">{formatDate(profile.createdAt)}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-400">
                  * 기관명, 사업자등록번호, 대표자명 변경은 관리자 문의가 필요합니다.
                </p>
              </div>
            </div>

            {/* 소개글 카드 */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-stone-800">기관 소개</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    수정
                  </button>
                )}
              </div>

              {isEditing ? (
                <>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="기관 소개를 입력해주세요. 후원자들이 기관을 이해하는 데 도움이 됩니다."
                    className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-sm"
                    rows={5}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-stone-400">{bio.length}/500</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setBio(profile.bio || '');
                        }}
                        className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium text-sm hover:bg-stone-200 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={updateProfileMutation.isPending}
                        className="px-4 py-2 bg-amber-500 text-stone-900 rounded-lg font-bold text-sm hover:bg-amber-400 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            저장 중...
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            저장
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-stone-50 rounded-lg min-h-[120px]">
                  {profile.bio ? (
                    <p className="text-stone-700 whitespace-pre-wrap">{profile.bio}</p>
                  ) : (
                    <p className="text-stone-400 italic">
                      아직 소개글이 등록되지 않았습니다. 기관 소개를 작성해주세요.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfilePage;
