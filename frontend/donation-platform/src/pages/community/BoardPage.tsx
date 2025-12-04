import React, { useState } from 'react';
import {
  MessageSquare, Eye, Heart, Search, Reply, Image as ImageIcon, Send, X,
  Pin, Loader2, Link, Edit2, Trash2, Users, Megaphone, HelpCircle,
  Sparkles, ArrowLeft, Calendar, ChevronRight, MessageCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import type { CommunityPost, PostType } from '../../types';
import { POST_TYPE_LABELS } from '../../types';
import { usePosts, useLikePost, useCreateComment, useComments, useLikeComment, useUpdateComment, useDeleteComment } from '../../hooks/useCommunity';
import { createPost } from '../../api/community';
import { useAuth } from '../../hooks/useAuth';
import ConfirmModal from '../../components/common/ConfirmModal';

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

interface ExtendedPost extends CommunityPost {
  content?: string;
  likes?: number;
  isLiked?: boolean;
  isPinned?: boolean;
  authorType?: 'individual' | 'organization';
  images?: string[];
  commentCount?: number;
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
  const [replyToCommentId, setReplyToCommentId] = useState<number | undefined>(undefined);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<PostType>('QUESTION');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
    isLoading?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const { user } = useAuth();

  const { data: postsData, isLoading, isError } = usePosts({
    type: selectedCategory === 'all' ? undefined : selectedCategory,
    keyword: searchTerm
  });

  const likePostMutation = useLikePost();
  const createCommentMutation = useCreateComment();
  const likeCommentMutation = useLikeComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const { data: commentsData } = useComments(selectedPost?.id || 0);

  const convertedComments = commentsData?.content
    ?.map(comment => ({
      id: comment.commentId,
      authorId: comment.author.userId,
      author: comment.author.userName,
      content: comment.content,
      date: new Date(comment.createdAt).toLocaleDateString('ko-KR'),
      createdAt: comment.createdAt,
      likeCount: comment.likeCount || 0,
      isLiked: comment.isLiked || false,
      replies: (comment.replies || []).map(reply => ({
        id: reply.commentId,
        authorId: reply.author.userId,
        author: reply.author.userName,
        content: reply.content,
        date: new Date(reply.createdAt).toLocaleDateString('ko-KR'),
        createdAt: reply.createdAt,
        likeCount: reply.likeCount || 0,
        isLiked: reply.isLiked || false,
        replyToCommentId: reply.replyToCommentId,
        replyToAuthor: reply.replyToAuthor?.userName || reply.replyToAuthor
      }))
    })) || [];

  const isWithin5Minutes = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - created) < fiveMinutes;
  };

  const isOwnComment = (authorId: number) => {
    return user?.userId === authorId;
  };

  const extendedPosts: ExtendedPost[] = postsData?.content.map(post => ({
    id: post.postId,
    type: post.type,
    title: post.title,
    author: post.author.userName,
    authorType: post.author.userType === 'ORGANIZATION' ? 'organization' : 'individual',
    content: post.content,
    date: new Date(post.createdAt).toLocaleDateString('ko-KR'),
    views: post.viewCount,
    likes: post.likeCount,
    isLiked: post.isLiked || false,
    isPinned: post.isPinned || false,
    images: post.imageUrls || [],
    commentCount: post.commentCount || 0
  })) || [];

  const filteredPosts = extendedPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.type === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePostClick = (post: ExtendedPost) => {
    setSelectedPost(post);
    setCurrentView('detail');
  };

  const handleLikePost = async () => {
    if (!selectedPost || !isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    try {
      await likePostMutation.mutateAsync(selectedPost.id);
      setSelectedPost(prev => prev ? {
        ...prev,
        likes: prev.isLiked ? (prev.likes || 1) - 1 : (prev.likes || 0) + 1,
        isLiked: !prev.isLiked
      } : null);
    } catch (error) {
      toast.error('좋아요 처리에 실패했습니다.');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      toast.error('댓글을 입력해주세요.');
      return;
    }
    if (!selectedPost) return;

    try {
      await createCommentMutation.mutateAsync({
        postId: selectedPost.id,
        content: commentText,
        parentId: replyTo?.id,
        replyToCommentId: replyToCommentId
      });
      setCommentText('');
      setReplyTo(null);
      setReplyToCommentId(undefined);
      toast.success('댓글이 등록되었습니다.');
    } catch (error) {
      toast.error('댓글 등록에 실패했습니다.');
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingCommentContent.trim()) {
      toast.error('댓글을 입력해주세요.');
      return;
    }
    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        content: editingCommentContent
      });
      setEditingCommentId(null);
      setEditingCommentContent('');
      toast.success('댓글이 수정되었습니다.');
    } catch (error) {
      toast.error('댓글 수정에 실패했습니다.');
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    try {
      await likeCommentMutation.mutateAsync(commentId);
    } catch (error) {
      toast.error('좋아요 처리에 실패했습니다.');
    }
  };

  const handleCopyCommentLink = (commentId: number) => {
    const url = `${window.location.origin}/community/posts/${selectedPost?.id}?commentId=${commentId}`;
    navigator.clipboard.writeText(url);
    toast.success('댓글 링크가 복사되었습니다.');
  };

  const handleDeleteComment = (commentId: number) => {
    setConfirmModal({
      isOpen: true,
      title: '댓글 삭제',
      message: '이 댓글을 삭제하시겠습니까?',
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await deleteCommentMutation.mutateAsync(commentId);
          toast.success('댓글이 삭제되었습니다.');
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        } catch (error) {
          toast.error('댓글 삭제에 실패했습니다.');
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const startEditComment = (commentId: number, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleSubmitPost = async () => {
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

    try {
      await createPost({
        type: postType,
        title: postTitle,
        content: postContent,
        images: uploadedImageFiles.length > 0 ? uploadedImageFiles : undefined
      });

      toast.success('게시글이 등록되었습니다.');

      setPostTitle('');
      setPostContent('');
      setPostType('QUESTION');
      setUploadedImageFiles([]);
      setCurrentView('list');

      window.location.reload();
    } catch (error) {
      toast.error('게시글 작성에 실패했습니다.');
    }
  };

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

  // 게시판 목록 뷰
  const renderListView = () => (
    <div className="min-h-screen bg-stone-100">
      {/* 헤더 */}
      <div className="bg-stone-900">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-amber-400 uppercase tracking-widest text-xs font-medium mb-1">Community</p>
              <h1 className="text-2xl text-white font-light">
                커뮤니티 <span className="font-semibold">게시판</span>
              </h1>
            </div>
            <div className="flex gap-8 text-center">
              {[
                { type: 'NOTICE' as PostType, count: extendedPosts.filter(p => p.type === 'NOTICE').length },
                { type: 'QUESTION' as PostType, count: extendedPosts.filter(p => p.type === 'QUESTION').length },
                { type: 'SUPPORT' as PostType, count: extendedPosts.filter(p => p.type === 'SUPPORT').length }
              ].map(item => {
                const config = getCategoryConfig(item.type);
                return (
                  <div key={item.type}>
                    <p className="text-2xl font-light text-white">{item.count}</p>
                    <p className="text-xs text-stone-400">{config.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* 필터 바 */}
        <div className="bg-white border border-stone-300 p-3 mb-4 flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="flex gap-px bg-stone-200">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              전체
            </button>
            {(['NOTICE', 'QUESTION', 'SUPPORT'] as PostType[]).map(type => {
              const config = getCategoryConfig(type);
              return (
                <button
                  key={type}
                  onClick={() => setSelectedCategory(type)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === type ? `${config.color} text-white` : 'bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            {isLoggedIn && (
              <button
                onClick={() => setCurrentView('write')}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 flex items-center gap-1.5"
              >
                <Edit2 size={14} />
                글쓰기
              </button>
            )}
          </div>
        </div>

        {/* 게시글 테이블 */}
        {isLoading ? (
          <div className="bg-white border border-stone-300 p-12">
            <LoadingSpinner size="lg" message="게시글을 불러오는 중..." />
          </div>
        ) : isError ? (
          <div className="bg-white border border-stone-300 p-12 text-center">
            <MessageSquare className="mx-auto mb-3 text-stone-300" size={40} />
            <p className="text-stone-500">게시글을 불러올 수 없습니다</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white border border-stone-300 p-12 text-center">
            <MessageSquare className="mx-auto mb-3 text-stone-300" size={40} />
            <p className="text-stone-500">게시글이 없습니다</p>
          </div>
        ) : (
          <div className="bg-white border border-stone-300">
            {/* 테이블 헤더 */}
            <div className="hidden md:grid grid-cols-[80px_1fr_100px_70px_70px_70px] gap-4 px-4 py-2.5 bg-stone-100 border-b border-stone-300 text-xs font-medium text-stone-500 uppercase">
              <div>분류</div>
              <div>제목</div>
              <div>작성자</div>
              <div className="text-center">좋아요</div>
              <div className="text-center">댓글</div>
              <div className="text-center">조회</div>
            </div>

            {/* 게시글 목록 */}
            <div className="divide-y divide-stone-200">
              {filteredPosts.map(post => {
                const config = getCategoryConfig(post.type);
                const Icon = config.icon;

                return (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className="grid grid-cols-1 md:grid-cols-[80px_1fr_100px_70px_70px_70px] gap-2 md:gap-4 px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors items-center"
                  >
                    {/* 분류 */}
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${config.color} text-white text-xs font-medium`}>
                        {config.label}
                      </span>
                    </div>

                    {/* 제목 */}
                    <div className="flex items-center gap-2 min-w-0">
                      {post.isPinned && <Pin size={12} className="text-rose-500 flex-shrink-0" />}
                      <span className="font-medium text-stone-800 truncate">{post.title}</span>
                      {post.authorType === 'organization' && (
                        <span className="px-1 py-0.5 bg-purple-500 text-white text-[10px] flex-shrink-0">기관</span>
                      )}
                      {post.images && post.images.length > 0 && (
                        <ImageIcon size={12} className="text-stone-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* 작성자 */}
                    <div className="hidden md:block text-sm text-stone-600 truncate">{post.author}</div>

                    {/* 좋아요 */}
                    <div className="hidden md:flex justify-center text-sm text-stone-500">{post.likes || 0}</div>

                    {/* 댓글 */}
                    <div className="hidden md:flex justify-center text-sm text-stone-500">{post.commentCount || 0}</div>

                    {/* 조회 */}
                    <div className="hidden md:flex justify-center text-sm text-stone-500">{postViews.get(post.id) || post.views}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 게시글 상세 뷰
  const renderDetailView = () => {
    if (!selectedPost) return null;

    const config = getCategoryConfig(selectedPost.type);
    const Icon = config.icon;
    const isSupport = selectedPost.type === 'SUPPORT';

    return (
      <div className={`min-h-screen ${isSupport ? 'bg-amber-50' : 'bg-stone-100'}`}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => setCurrentView('list')}
            className="mb-4 text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} />
            목록
          </button>

          {/* 게시글 */}
          <div className={`bg-white border mb-4 ${isSupport ? 'border-amber-300' : 'border-stone-300'}`}>
            {/* 헤더 */}
            <div className={`px-6 py-4 ${isSupport ? 'bg-amber-500' : 'bg-stone-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${
                  isSupport ? 'bg-white/20 text-white' : `${config.lightBg} ${config.text}`
                }`}>
                  {config.label}
                </span>
                {selectedPost.authorType === 'organization' && (
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-xs">기관</span>
                )}
              </div>
              <h1 className="text-xl font-medium text-white mb-2">{selectedPost.title}</h1>
              <div className="flex items-center gap-4 text-sm text-white/70">
                <span className="text-white/90">{selectedPost.author}</span>
                <span>{selectedPost.date}</span>
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {postViews.get(selectedPost.id) || selectedPost.views}
                </span>
              </div>
            </div>

            {/* 본문 */}
            <div className="p-6">
              {isSupport ? (
                <div className="p-5 bg-amber-50 border border-amber-200 mb-4">
                  <div className="flex gap-4">
                    <Heart className="text-amber-500 flex-shrink-0 mt-1" size={24} />
                    <p className="text-stone-800 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                  </div>
                </div>
              ) : (
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
              )}

              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">첨부 이미지</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPost.images.map((image, index) => (
                      <img key={index} src={image} alt="" className="w-full h-32 object-cover border border-stone-200" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 좋아요 */}
            <div className="px-6 pb-6">
              <button
                onClick={handleLikePost}
                disabled={likePostMutation.isPending}
                className={`inline-flex items-center gap-2 px-4 py-2 border text-sm transition-colors disabled:opacity-50 ${
                  selectedPost.isLiked
                    ? 'border-amber-500 bg-amber-50 text-amber-600'
                    : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Heart size={16} fill={selectedPost.isLiked ? 'currentColor' : 'none'} />
                {isSupport ? '응원해요' : '좋아요'} {selectedPost.likes || 0}
              </button>
            </div>
          </div>

          {/* 댓글 */}
          <div className="bg-white border border-stone-300 p-6">
            <h3 className="text-sm font-medium text-stone-800 uppercase tracking-wider mb-4">
              {isSupport ? '응원 댓글' : '댓글'} ({convertedComments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
            </h3>

            {isLoggedIn && (
              <div className="mb-6">
                {replyTo && (
                  <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 flex justify-between items-center text-sm">
                    <span className="text-amber-700">
                      <Reply size={14} className="inline mr-1" />
                      {replyTo.author}님에게 답글
                    </span>
                    <button onClick={() => { setReplyTo(null); setReplyToCommentId(undefined); }}>
                      <X size={16} className="text-amber-600" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={isSupport ? "응원 메시지..." : "댓글 입력..."}
                    className="flex-1 p-3 border border-stone-300 resize-none focus:outline-none focus:border-amber-500 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={createCommentMutation.isPending}
                    className="px-4 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {convertedComments.map(comment => (
                <div key={comment.id} id={`comment-${comment.id}`} className="border-l-2 border-stone-200 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-stone-800">{comment.author}</span>
                    <span className="text-xs text-stone-400">{comment.date}</span>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="mb-2">
                      <textarea
                        value={editingCommentContent}
                        onChange={(e) => setEditingCommentContent(e.target.value)}
                        className="w-full p-2 border border-stone-300 text-sm resize-none focus:outline-none focus:border-amber-500"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleEditComment(comment.id)} className="px-3 py-1 bg-amber-500 text-white text-xs">저장</button>
                        <button onClick={cancelEditComment} className="px-3 py-1 bg-stone-200 text-stone-600 text-xs">취소</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-700 mb-2">{comment.content}</p>
                  )}

                  <div className="flex gap-3 text-xs">
                    {isLoggedIn && (
                      <>
                        <button onClick={() => { setReplyTo(comment); setReplyToCommentId(undefined); }} className="text-stone-500 hover:text-amber-600">답글</button>
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={comment.isLiked ? 'text-amber-600' : 'text-stone-500 hover:text-amber-600'}
                        >
                          좋아요 {comment.likeCount || 0}
                        </button>
                      </>
                    )}
                    <button onClick={() => handleCopyCommentLink(comment.id)} className="text-stone-500 hover:text-blue-600">링크</button>
                    {isLoggedIn && ((isOwnComment(comment.authorId) && isWithin5Minutes(comment.createdAt)) || userType === 'admin') && editingCommentId !== comment.id && (
                      <>
                        <button onClick={() => startEditComment(comment.id, comment.content)} className="text-stone-500 hover:text-blue-600">수정</button>
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-stone-500 hover:text-red-600">삭제</button>
                      </>
                    )}
                  </div>

                  {/* 대댓글 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-2 ml-4">
                      {comment.replies.map(reply => (
                        <div key={reply.id} id={`comment-${reply.id}`} className="border-l-2 border-amber-200 bg-stone-50 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Reply size={12} className="text-amber-500" />
                            <span className="font-medium text-sm text-stone-800">{reply.author}</span>
                            {reply.replyToAuthor && <span className="text-xs text-stone-500">→ {reply.replyToAuthor}</span>}
                            <span className="text-xs text-stone-400">{reply.date}</span>
                          </div>

                          {editingCommentId === reply.id ? (
                            <div className="mb-2">
                              <textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                className="w-full p-2 border border-stone-300 text-sm resize-none focus:outline-none focus:border-amber-500 bg-white"
                                rows={3}
                              />
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => handleEditComment(reply.id)} className="px-3 py-1 bg-amber-500 text-white text-xs">저장</button>
                                <button onClick={cancelEditComment} className="px-3 py-1 bg-stone-200 text-stone-600 text-xs">취소</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-stone-700 mb-2">{reply.content}</p>
                          )}

                          <div className="flex gap-3 text-xs">
                            {isLoggedIn && (
                              <>
                                <button onClick={() => { setReplyTo(comment); setReplyToCommentId(reply.id); }} className="text-stone-500 hover:text-amber-600">답글</button>
                                <button
                                  onClick={() => handleLikeComment(reply.id)}
                                  className={reply.isLiked ? 'text-amber-600' : 'text-stone-500 hover:text-amber-600'}
                                >
                                  좋아요 {reply.likeCount || 0}
                                </button>
                              </>
                            )}
                            <button onClick={() => handleCopyCommentLink(reply.id)} className="text-stone-500 hover:text-blue-600">링크</button>
                            {isLoggedIn && ((isOwnComment(reply.authorId) && isWithin5Minutes(reply.createdAt)) || userType === 'admin') && editingCommentId !== reply.id && (
                              <>
                                <button onClick={() => startEditComment(reply.id, reply.content)} className="text-stone-500 hover:text-blue-600">수정</button>
                                <button onClick={() => handleDeleteComment(reply.id)} className="text-stone-500 hover:text-red-600">삭제</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 글쓰기 뷰
  const renderWriteView = () => {
    const config = getCategoryConfig(postType);
    const isSupport = postType === 'SUPPORT';

    return (
      <div className="min-h-screen bg-stone-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => { setCurrentView('list'); setPostTitle(''); setPostContent(''); setUploadedImageFiles([]); }}
            className="mb-4 text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={16} />
            목록
          </button>

          <div className="bg-white border border-stone-300">
            {/* 헤더 */}
            <div className="bg-stone-800 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 flex items-center justify-center">
                <Edit2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">게시글 작성</h2>
                <p className="text-sm text-stone-400">커뮤니티에 글을 작성합니다</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* 카테고리 */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">카테고리</label>
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
                        onClick={() => setPostType(type)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          isSelected ? `${typeConfig.color} text-white` : 'bg-white text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {typeConfig.label}
                      </button>
                    );
                  })}
                </div>
                <div className={`mt-3 p-3 ${config.lightBg} border ${config.border} text-sm ${config.text}`}>
                  {config.description}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">제목</label>
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
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">내용</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={isSupport ? '따뜻한 응원 메시지를 작성해주세요' : '내용을 입력하세요'}
                  className="w-full px-4 py-3 border border-stone-300 resize-none focus:outline-none focus:border-amber-500"
                  rows={12}
                />
              </div>

              {/* 이미지 */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">이미지 (선택)</label>
                <input type="file" accept="image/*" multiple onChange={onImageUpload} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="block border-2 border-dashed border-stone-300 p-6 text-center hover:border-amber-400 cursor-pointer transition-colors">
                  <ImageIcon className="mx-auto mb-2 text-stone-400" size={28} />
                  <p className="text-sm text-stone-600">이미지 업로드 (최대 5개)</p>
                </label>
                {uploadedImageFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {uploadedImageFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-20 object-cover border border-stone-200" />
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
                onClick={() => { setCurrentView('list'); setPostTitle(''); setPostContent(''); setUploadedImageFiles([]); }}
                className="flex-1 py-3 text-stone-600 hover:bg-stone-200 transition-colors"
              >
                취소
              </button>
              <button onClick={handleSubmitPost} className="flex-1 py-3 bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                {isSupport ? '응원 보내기' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {currentView === 'list' && renderListView()}
      {currentView === 'detail' && renderDetailView()}
      {currentView === 'write' && renderWriteView()}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        isDanger={confirmModal.isDanger}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};

export default BoardPage;
