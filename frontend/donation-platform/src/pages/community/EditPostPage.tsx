import React, { useState, useEffect } from 'react';
import { Image, X, Loader2 } from 'lucide-react';
import type { CommunityPost, PostType } from '../../types';
import { POST_TYPE_LABELS } from '../../types';
import { useUpdatePost, useCreatePost } from '../../hooks/useCommunity';

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

// 확장된 게시글 타입 (이미지 포함)
interface ExtendedPost extends CommunityPost {
  images?: string[];
}

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
      alert('제목을 입력해주세요.');
      return;
    }
    if (!postContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    // 일반 사용자가 공지사항을 작성하려고 하는 경우 차단
    if (postType === 'NOTICE' && userType === 'individual') {
      alert('일반 사용자는 공지사항을 작성할 수 없습니다.');
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

      alert('게시글이 수정되었습니다.');
      setUploadedImageFiles([]);
      onNavigateToPostDetail(selectedPost);
    } catch (error) {
      alert('게시글 수정에 실패했습니다.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('수정을 취소하시겠습니까? 변경사항이 저장되지 않습니다.')) {
      setUploadedImageFiles([]);
      if (selectedPost) {
        onNavigateToPostDetail(selectedPost);
      }
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const getCategoryColor = (type: PostType) => {
    switch(type) {
      case 'NOTICE': return 'bg-red-500';
      case 'QUESTION': return 'bg-blue-500';
      case 'SUPPORT': return 'bg-green-500';
      case 'GENERAL': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (!selectedPost) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">수정할 게시글을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={handleCancel}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← 취소
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-6">게시글 수정</h2>

          <div className="space-y-4">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <div className="flex gap-2">
                {(userType === 'organization' || userType === 'admin'
                  ? (['NOTICE', 'QUESTION', 'SUPPORT'] as PostType[])
                  : (['QUESTION', 'SUPPORT'] as PostType[])
                ).map(type => (
                  <button
                    key={type}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      postType === type
                        ? `${getCategoryColor(type)} border-transparent text-white`
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                    onClick={() => setPostType(type)}
                  >
                    {POST_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              {userType === 'individual' && (
                <p className="text-xs text-gray-500 mt-2">
                  * 일반 사용자는 질문과 응원 카테고리만 선택할 수 있습니다.
                </p>
              )}
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="내용을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={10}
              />
            </div>

            {/* 기존 이미지 */}
            {existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  기존 이미지
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`existing-${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 이미지 추가 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="inline-flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 w-full text-center hover:border-red-500 transition-colors cursor-pointer"
              >
                <div className="w-full">
                  <Image className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-sm text-gray-600">
                    클릭하여 이미지를 업로드하세요
                  </p>
                </div>
              </label>

              {/* 새로 업로드된 이미지 미리보기 */}
              {uploadedImageFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {uploadedImageFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => onRemoveImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    수정 중...
                  </>
                ) : (
                  '수정하기'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPostPage;
