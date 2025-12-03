import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, X, Loader2, ArrowLeft, Edit2, Megaphone, HelpCircle, Heart, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CommunityPost, PostType } from '../../types';
import { POST_TYPE_LABELS } from '../../types';
import { useUpdatePost, useCreatePost } from '../../hooks/useCommunity';
import ConfirmModal from '../../components/common/ConfirmModal';

interface EditPostPageProps {
  selectedPost: CommunityPost | null;
  userType: 'individual' | 'organization' | 'admin';
  uploadedImageFiles: File[];
  onNavigateToPostDetail: (post: CommunityPost) => void;
  onUpdatePost: (postId: number, updatedData: {
    title: string;
    content: string;
    type: PostType;
    images?: string[];
  }) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  setUploadedImageFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

interface ExtendedPost extends CommunityPost {
  images?: string[];
}

// 카테고리 설정
const categoryConfig = {
  NOTICE: {
    icon: Megaphone,
    color: 'bg-rose-500',
    lightBg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-600',
    label: '공지',
    description: '중요한 소식을 전합니다'
  },
  QUESTION: {
    icon: HelpCircle,
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-600',
    label: '질문',
    description: '궁금한 점을 물어보세요'
  },
  SUPPORT: {
    icon: Heart,
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-600',
    label: '응원',
    description: '따뜻한 응원을 보내주세요'
  },
  GENERAL: {
    icon: MessageSquare,
    color: 'bg-stone-500',
    lightBg: 'bg-stone-50',
    border: 'border-stone-300',
    text: 'text-stone-600',
    label: '일반',
    description: '자유롭게 이야기해요'
  }
};

const getCategoryConfig = (type: PostType) => {
  return categoryConfig[type] || categoryConfig.GENERAL;
};

const EditPostPage: React.FC<EditPostPageProps> = ({
  selectedPost,
  userType,
  uploadedImageFiles,
  onNavigateToPostDetail,
  onUpdatePost,
  onImageUpload,
  onRemoveImage,
  setUploadedImageFiles
}) => {
  const updatePostMutation = useUpdatePost();
  const createPostMutation = useCreatePost();

  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<PostType>('QUESTION');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    if (selectedPost) {
      setPostTitle(selectedPost.title);
      setPostContent(selectedPost.content || '');
      setPostType(selectedPost.type);
      const extendedPost = selectedPost as ExtendedPost;
      if (extendedPost.images) {
        setExistingImages(extendedPost.images);
      }
    }
  }, [selectedPost]);

  const handleSubmit = async () => {
    if (!postTitle.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (!postContent.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    if (postType === 'NOTICE' && userType === 'individual') {
      toast.error('일반 사용자는 공지사항을 작성할 수 없습니다.');
      return;
    }

    if (!selectedPost) return;

    setIsSubmitting(true);

    try {
      await updatePostMutation.mutateAsync({
        id: selectedPost.id,
        data: {
          title: postTitle,
          content: postContent
        }
      });

      toast.success('게시글이 수정되었습니다.');
      setUploadedImageFiles([]);
      onNavigateToPostDetail(selectedPost);
    } catch (error) {
      toast.error('게시글 수정에 실패했습니다.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setConfirmModal({
      isOpen: true,
      title: '수정 취소',
      message: '수정을 취소하시겠습니까?\n변경사항이 저장되지 않습니다.',
      onConfirm: () => {
        setUploadedImageFiles([]);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        if (selectedPost) {
          onNavigateToPostDetail(selectedPost);
        }
      }
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const config = getCategoryConfig(postType);
  const isSupport = postType === 'SUPPORT';

  if (!selectedPost) {
    return (
      <div className="bg-stone-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-4 text-stone-300" size={48} />
          <p className="text-stone-500">수정할 게시글을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={handleCancel}
          className="mb-4 text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={16} />
          취소
        </button>

        <div className="bg-white border border-stone-300">
          {/* 헤더 */}
          <div className="bg-stone-800 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 flex items-center justify-center">
              <Edit2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">게시글 수정</h2>
              <p className="text-sm text-stone-400">게시글 내용을 수정합니다</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* 카테고리 */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                카테고리
              </label>
              <div className="flex gap-px bg-stone-200 inline-flex">
                {(userType === 'organization' || userType === 'admin'
                  ? (['NOTICE', 'QUESTION', 'SUPPORT'] as PostType[])
                  : (['QUESTION', 'SUPPORT'] as PostType[])
                ).map(type => {
                  const typeConfig = getCategoryConfig(type);
                  const isSelected = postType === type;

                  return (
                    <button
                      key={type}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? `${typeConfig.color} text-white`
                          : 'bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                      onClick={() => setPostType(type)}
                    >
                      {typeConfig.label}
                    </button>
                  );
                })}
              </div>

              <div className={`mt-3 p-3 ${config.lightBg} border ${config.border} text-sm ${config.text}`}>
                {config.description}
              </div>

              {userType === 'individual' && (
                <p className="text-xs text-stone-400 mt-2">
                  * 일반 사용자는 질문과 응원 카테고리만 선택 가능
                </p>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                제목
              </label>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder={isSupport ? '응원 제목' : '제목을 입력하세요'}
                className="w-full px-4 py-3 border border-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                내용
              </label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={isSupport ? '따뜻한 응원 메시지를 작성해주세요' : '내용을 입력하세요'}
                className="w-full px-4 py-3 border border-stone-300 resize-none focus:outline-none focus:border-amber-500"
                rows={12}
              />
            </div>

            {/* 기존 이미지 */}
            {existingImages.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  기존 이미지
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`existing-${index}`}
                        className="w-full h-20 object-cover border border-stone-200"
                      />
                      <button
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 이미지 추가 */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                이미지 추가 (선택)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onImageUpload}
                className="hidden"
                id="image-upload-edit"
              />
              <label
                htmlFor="image-upload-edit"
                className="block border-2 border-dashed border-stone-300 p-6 text-center hover:border-amber-400 cursor-pointer transition-colors"
              >
                <ImageIcon className="mx-auto mb-2 text-stone-400" size={28} />
                <p className="text-sm text-stone-600">새 이미지 업로드</p>
                <p className="text-xs text-stone-400">최대 5개</p>
              </label>

              {uploadedImageFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {uploadedImageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="w-full h-20 object-cover border border-stone-200"
                      />
                      <button
                        onClick={() => onRemoveImage(index)}
                        className="absolute top-1 right-1 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                  수정 중...
                </>
              ) : (
                isSupport ? '응원 수정하기' : '수정하기'
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default EditPostPage;
