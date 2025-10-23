import React, { useState } from 'react';
import { MessageSquare, Eye, Heart, ChevronRight, Search, Reply, Image as ImageIcon, Send, X, Pin } from 'lucide-react';
import type { CommunityPost } from '../../types';

interface BoardPageProps {
  isLoggedIn: boolean;
  userType: 'individual' | 'organization' | 'admin';
  communityPosts: CommunityPost[];
  postViews: Map<number, number>;
  uploadedImageFiles: File[];
  onNavigateToPostDetail: (post: CommunityPost) => void;
  onNavigateToCreatePost: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  setUploadedImageFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

// 확장된 게시글 타입 (댓글 및 이미지 포함)
interface ExtendedPost extends CommunityPost {
  content?: string;
  likes?: number;
  isPinned?: boolean;
  authorType?: 'individual' | 'organization';
  images?: string[];
  comments?: Array<{
    id: number;
    author: string;
    content: string;
    date: string;
    replies?: Array<{
      id: number;
      author: string;
      content: string;
      date: string;
    }>;
  }>;
}

const BoardPage: React.FC<BoardPageProps> = ({
  isLoggedIn,
  userType,
  communityPosts,
  postViews,
  uploadedImageFiles,
  onNavigateToPostDetail,
  onNavigateToCreatePost,
  onImageUpload,
  onRemoveImage,
  setUploadedImageFiles
}) => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedPost, setSelectedPost] = useState<ExtendedPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'공지' | '질문' | '응원'>('질문');

  // 샘플 게시글 데이터 (확장된 정보 포함)
  const extendedPosts: ExtendedPost[] = [
    {
      id: 1,
      type: '공지',
      title: '프로젝트 진행 상황 공지사항',
      author: '희망재단',
      authorType: 'organization',
      content: '안녕하세요. 희망재단입니다.\n\n현재 프로젝트가 목표 금액의 80%를 달성했습니다. 여러분의 따뜻한 마음에 진심으로 감사드립니다.\n\n앞으로도 투명한 운영과 정기적인 진행상황 보고를 통해 신뢰를 지켜나가겠습니다.',
      date: '2024-03-15',
      views: 324,
      likes: 45,
      isPinned: true,
      images: [],
      comments: [
        { id: 1, author: '김민수', content: '응원합니다! 좋은 일에 함께할 수 있어서 기쁩니다.', date: '2024-03-15', replies: [] },
        { id: 2, author: '이지은', content: '화이팅입니다!', date: '2024-03-15', replies: [] }
      ]
    },
    {
      id: 2,
      type: '질문',
      title: '기부금 영수증은 어떻게 발급받나요?',
      author: '박서준',
      authorType: 'individual',
      content: '안녕하세요. 기부를 진행했는데 영수증 발급 방법을 알고 싶습니다.',
      date: '2024-03-14',
      views: 156,
      likes: 12,
      isPinned: false,
      images: [],
      comments: [
        {
          id: 3,
          author: '희망재단',
          content: '마이페이지 > 기부내역에서 다운로드 가능합니다. 추가 문의사항은 고객센터로 연락 주세요.',
          date: '2024-03-14',
          replies: [
            { id: 4, author: '박서준', content: '감사합니다! 확인했어요.', date: '2024-03-14' }
          ]
        }
      ]
    },
    {
      id: 3,
      type: '응원',
      title: '소중한 프로젝트 응원합니다!',
      author: '최유진',
      authorType: 'individual',
      content: '이렇게 좋은 프로젝트에 참여할 수 있어서 영광입니다. 작은 힘이지만 보탬이 되었으면 좋겠습니다. 파이팅!',
      date: '2024-03-13',
      views: 89,
      likes: 28,
      isPinned: false,
      images: [],
      comments: []
    }
  ];

  const filteredPosts = extendedPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.type === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handlePostClick = (post: ExtendedPost) => {
    setSelectedPost(post);
    setCurrentView('detail');
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    alert('댓글이 등록되었습니다.');
    setCommentText('');
    setReplyTo(null);
  };

  const handleSubmitPost = () => {
    if (!postTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!postContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    // 권한 관리: 일반 사용자가 공지사항을 작성하려고 하는 경우 차단
    if (postType === '공지' && userType === 'individual') {
      alert('일반 사용자는 공지사항을 작성할 수 없습니다.\n질문 또는 응원 카테고리를 선택해주세요.');
      return;
    }

    // 이미지가 첨부된 경우 처리
    const imageUrls = uploadedImageFiles.map(file => URL.createObjectURL(file));

    alert(`게시글이 등록되었습니다.\n제목: ${postTitle}\n카테고리: ${postType}\n이미지: ${imageUrls.length}개`);

    setPostTitle('');
    setPostContent('');
    setPostType('질문');
    setUploadedImageFiles([]);
    setCurrentView('list');
  };

  const getCategoryColor = (type: string) => {
    switch(type) {
      case '공지': return 'bg-red-500';
      case '질문': return 'bg-blue-500';
      case '응원': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // 게시판 목록 뷰
  const renderListView = () => (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">커뮤니티 게시판</h1>
        <p className="text-gray-600">프로젝트에 대한 소통과 응원의 공간입니다</p>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {['all', '공지', '질문', '응원'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? '전체' : category}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="게시글 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            {isLoggedIn && (
              <button
                onClick={() => setCurrentView('write')}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow whitespace-nowrap"
              >
                글쓰기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <MessageSquare className="mx-auto mb-4" size={48} />
            <p>게시글이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPosts.map(post => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {post.isPinned && (
                    <Pin className="text-red-500 flex-shrink-0 mt-1" size={20} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${getCategoryColor(post.type)} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                        {post.type}
                      </span>
                      {post.authorType === 'organization' && (
                        <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded font-medium">
                          기관
                        </span>
                      )}
                      {post.images && post.images.length > 0 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                          <ImageIcon size={12} />
                          {post.images.length}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                      {post.title}
                      {post.comments && post.comments.length > 0 && (
                        <span className="ml-2 text-red-500 text-sm">
                          [{post.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}]
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-medium">{post.author}</span>
                      <span>{post.date}</span>
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        {postViews.get(post.id) || post.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={14} />
                        {post.likes || 0}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400 flex-shrink-0 mt-2 group-hover:text-red-500 transition-colors" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // 게시글 상세 뷰
  const renderDetailView = () => {
    if (!selectedPost) return null;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => setCurrentView('list')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← 목록으로
        </button>

        {/* 게시글 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* 헤더 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className={`${getCategoryColor(selectedPost.type)} text-white text-xs px-3 py-1 rounded-full font-medium`}>
                {selectedPost.type}
              </span>
              {selectedPost.authorType === 'organization' && (
                <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded font-medium">
                  기관
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span className="font-medium">{selectedPost.author}</span>
                <span>{selectedPost.date}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  {postViews.get(selectedPost.id) || selectedPost.views}
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={16} />
                  {selectedPost.likes || 0}
                </div>
              </div>
            </div>
          </div>

          {/* 본문 */}
          <div className="p-6">
            <div className="prose max-w-none whitespace-pre-wrap text-gray-700 mb-6">
              {selectedPost.content}
            </div>

            {/* 첨부 이미지 */}
            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3">첨부 이미지</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedPost.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`첨부 ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 cursor-pointer transition-opacity"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="px-6 pb-6 flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Heart size={16} />
              좋아요
            </button>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold mb-4">
            댓글 {selectedPost.comments ? selectedPost.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) : 0}개
          </h3>

          {/* 댓글 입력 */}
          {isLoggedIn && (
            <div className="mb-6">
              {replyTo && (
                <div className="mb-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    <Reply size={14} className="inline mr-1" />
                    {replyTo.author}님에게 답글 작성 중
                  </span>
                  <button onClick={() => setReplyTo(null)}>
                    <X size={16} />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  className="px-6 bg-red-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {selectedPost.comments && selectedPost.comments.map(comment => (
              <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{comment.author}</span>
                    <span className="text-sm text-gray-500 ml-2">{comment.date}</span>
                  </div>
                  {isLoggedIn && (
                    <button
                      onClick={() => setReplyTo(comment)}
                      className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
                    >
                      <Reply size={14} />
                      답글
                    </button>
                  )}
                </div>
                <p className="text-gray-700 mb-2">{comment.content}</p>

                {/* 대댓글 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 ml-6 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="border-l-2 border-red-200 pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Reply size={14} className="inline text-red-500 mr-1" />
                            <span className="font-medium text-gray-900">{reply.author}</span>
                            <span className="text-sm text-gray-500 ml-2">{reply.date}</span>
                          </div>
                        </div>
                        <p className="text-gray-700">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 글쓰기 뷰
  const renderWriteView = () => (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => setCurrentView('list')}
        className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
      >
        ← 취소
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold mb-6">게시글 작성</h2>

        <div className="space-y-4">
          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <div className="flex gap-2 flex-wrap">
              {(userType === 'organization' || userType === 'admin'
                ? ['공지', '질문', '응원']
                : ['질문', '응원']
              ).map(type => (
                <button
                  key={type}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    postType === type
                      ? `${getCategoryColor(type)} border-transparent text-white`
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                  onClick={() => setPostType(type as '공지' | '질문' | '응원')}
                >
                  {type}
                </button>
              ))}
            </div>
            {userType === 'individual' && (
              <p className="text-xs text-gray-500 mt-2">
                * 일반 사용자는 질문과 응원 카테고리만 작성할 수 있습니다.
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

          {/* 이미지 첨부 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 첨부 (선택)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onImageUpload}
              className="hidden"
              id="image-upload-write"
            />
            <label
              htmlFor="image-upload-write"
              className="inline-flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 w-full text-center hover:border-red-500 transition-colors cursor-pointer"
            >
              <div className="w-full">
                <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm text-gray-600">
                  클릭하여 이미지를 업로드하세요 (최대 5개)
                </p>
              </div>
            </label>

            {/* 업로드된 이미지 미리보기 */}
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
              onClick={() => {
                setCurrentView('list');
                setPostTitle('');
                setPostContent('');
                setUploadedImageFiles([]);
              }}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmitPost}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              등록하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'list' && renderListView()}
      {currentView === 'detail' && renderDetailView()}
      {currentView === 'write' && renderWriteView()}
    </div>
  );
};

export default BoardPage;
