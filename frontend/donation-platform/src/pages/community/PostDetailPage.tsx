import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Eye, Edit, Trash2, Reply, Send, X, Loader2, Heart, Link, Megaphone, HelpCircle, MessageSquare, ArrowLeft, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CommunityPost, Comment, PostType } from '../../types';
import { usePost, useComments, useCreateComment, useDeleteComment, useUpdateComment, useLikePost, useLikeComment } from '../../hooks/useCommunity';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import ReportModal from '../../components/common/ReportModal';
import type { ReportType } from '../../api/reports';

interface PostDetailPageProps {
  selectedPost: CommunityPost | null;
  isLoggedIn: boolean;
  userType: 'individual' | 'organization' | 'admin';
  currentUserName: string;
  postViews: Map<number, number>;
  onNavigateToEdit: (post: CommunityPost) => void;
  onNavigateToBoard: () => void;
  onDeletePost: (postId: number) => void;
  onIncrementView: (postId: number) => void;
}

// 확장된 게시글 타입 (이미지 포함)
interface ExtendedPost extends CommunityPost {
  images?: string[];
}

// 카테고리 설정
const categoryConfig: Record<PostType, {
  icon: React.ElementType;
  color: string;
  lightBg: string;
  border: string;
  text: string;
  label: string;
}> = {
  NOTICE: {
    icon: Megaphone,
    color: 'bg-rose-500',
    lightBg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-600',
    label: '공지'
  },
  QUESTION: {
    icon: HelpCircle,
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-600',
    label: '질문'
  },
  SUPPORT: {
    icon: Heart,
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-600',
    label: '응원'
  },
  GENERAL: {
    icon: MessageSquare,
    color: 'bg-stone-500',
    lightBg: 'bg-stone-50',
    border: 'border-stone-300',
    text: 'text-stone-600',
    label: '일반'
  }
};

const PostDetailPage: React.FC<PostDetailPageProps> = ({
  selectedPost,
  isLoggedIn,
  userType,
  currentUserName,
  postViews,
  onNavigateToEdit,
  onNavigateToBoard,
  onDeletePost,
  onIncrementView
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const postId = id ? parseInt(id) : selectedPost?.id;
  const hasScrolledToComment = useRef(false);

  // 댓글 페이지네이션 상태
  const [commentPage, setCommentPage] = useState(1);
  const commentPageSize = 10;

  // API에서 게시글 데이터 가져오기
  const { data: postData, isLoading: isPostLoading, isError: isPostError } = usePost(postId || 0);
  const { data: commentsData, isLoading: isCommentsLoading } = useComments(postId || 0, { page: commentPage - 1, size: commentPageSize });

  const createCommentMutation = useCreateComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const likePostMutation = useLikePost();
  const likeCommentMutation = useLikeComment();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
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

  // 신고 모달 상태
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    itemId: number;
    itemType: ReportType;
    itemTitle?: string;
  }>({ isOpen: false, itemId: 0, itemType: 'COMMENT' });

  // API 응답을 CommunityPost 형식으로 변환
  const post: CommunityPost | null = postData ? {
    id: postData.postId,
    type: postData.type,
    title: postData.title,
    author: postData.author.userName,
    date: new Date(postData.createdAt).toLocaleDateString('ko-KR'),
    views: postData.viewCount,
    content: postData.content,
    comments: []
  } : selectedPost;

  // 댓글 데이터 변환
  useEffect(() => {
    if (commentsData?.content) {
      const commentsList = commentsData.content;
      const convertedComments: Comment[] = commentsList
        .map(comment => ({
          id: comment.commentId,
          author: comment.author.userName,
          content: comment.content,
          date: new Date(comment.createdAt).toISOString(),
          likeCount: comment.likeCount || 0,
          isLiked: comment.isLiked || false,
          replies: comment.replies?.map(reply => ({
            id: reply.commentId,
            author: reply.author.userName,
            content: reply.content,
            date: new Date(reply.createdAt).toISOString(),
            likeCount: reply.likeCount || 0,
            isLiked: reply.isLiked || false
          })) || []
        }));
      setComments(convertedComments);
    } else if (selectedPost?.comments) {
      setComments(selectedPost.comments);
    }
  }, [commentsData, selectedPost]);

  // 조회수 증가 (페이지 진입 시 한 번만 실행)
  useEffect(() => {
    if (post) {
      onIncrementView(post.id);
    }
  }, [post?.id]);

  // URL 해시로 특정 댓글로 스크롤 (댓글 링크 공유 시)
  useEffect(() => {
    // 이미 스크롤했거나 댓글이 로드되지 않았으면 무시
    if (hasScrolledToComment.current || !commentsData?.content || isCommentsLoading) {
      return;
    }

    const hash = location.hash;
    if (hash && hash.startsWith('#comment-')) {
      // 약간의 지연 후 스크롤 (DOM 렌더링 대기)
      const timeoutId = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 하이라이트 효과 추가
          element.classList.add('bg-yellow-50', 'transition-colors', 'duration-1000');
          setTimeout(() => {
            element.classList.remove('bg-yellow-50');
          }, 2000);
          hasScrolledToComment.current = true;
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [location.hash, commentsData, isCommentsLoading]);

  // 게시글 좋아요
  const handleLikePost = async () => {
    if (!post) return;
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      await likePostMutation.mutateAsync(post.id);
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      toast.error('좋아요 처리에 실패했습니다.');
    }
  };

  // 댓글 좋아요
  const handleLikeComment = async (commentId: number) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      await likeCommentMutation.mutateAsync(commentId);
    } catch (error) {
      console.error('댓글 좋아요 처리 실패:', error);
      toast.error('댓글 좋아요 처리에 실패했습니다.');
    }
  };

  // HTTP 환경을 위한 클립보드 복사 폴백
  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      toast.success('댓글 링크가 복사되었습니다.');
    } catch (err) {
      toast.error('링크 복사에 실패했습니다.');
    }

    document.body.removeChild(textArea);
  };

  // 댓글 링크 복사
  const handleCopyCommentLink = (commentId: number) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;

    // HTTPS 환경에서는 navigator.clipboard 사용, HTTP에서는 폴백 사용
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success('댓글 링크가 복사되었습니다.');
      }).catch(() => {
        fallbackCopyToClipboard(url);
      });
    } else {
      fallbackCopyToClipboard(url);
    }
  };

  // 댓글 추가
  const addComment = async (content: string, parentId?: number) => {
    if (!content.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }

    if (!postId) return;

    try {
      await createCommentMutation.mutateAsync({
        postId,
        data: {
          content,
          parentCommentId: parentId
        }
      });

      setNewComment('');
      setReplyTo(null);
      toast.success('댓글이 등록되었습니다.');
    } catch (error) {
      toast.error('댓글 등록에 실패했습니다.');
      console.error(error);
    }
  };

  // 댓글 수정 시작
  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  // 댓글 수정 저장
  const saveEditComment = async (commentId: number, isReply: boolean = false, parentId?: number) => {
    if (!editingCommentContent.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
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
      console.error(error);
    }
  };

  // 댓글 수정 취소
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  // 댓글 삭제
  const deleteComment = (id: number, isReply: boolean = false, parentId?: number) => {
    setConfirmModal({
      isOpen: true,
      title: '댓글 삭제',
      message: '댓글을 삭제하시겠습니까?',
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          await deleteCommentMutation.mutateAsync(id);
          toast.success('댓글이 삭제되었습니다.');
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        } catch (error) {
          toast.error('댓글 삭제에 실패했습니다.');
          console.error(error);
          setConfirmModal(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  // 댓글 수정 권한 체크 (5분 이내만 수정 가능)
  const canEditComment = (comment: Comment) => {
    if (!isLoggedIn || comment.author !== currentUserName) return false;

    // 댓글 작성 후 5분이 경과했는지 확인
    const commentDate = new Date(comment.date);
    const now = new Date();
    const diffMinutes = (now.getTime() - commentDate.getTime()) / (1000 * 60);

    return diffMinutes <= 5;
  };

  // 게시글 수정 권한 체크
  const canEditPost = () => {
    if (!post) return false;
    return isLoggedIn && (post.author === currentUserName || userType === 'admin');
  };

  // 게시글 삭제 권한 체크
  const canDeletePost = () => {
    if (!post) return false;
    return isLoggedIn && (post.author === currentUserName || userType === 'admin');
  };

  const handleDeletePost = () => {
    if (!post) return;

    setConfirmModal({
      isOpen: true,
      title: '게시글 삭제',
      message: '게시글을 삭제하시겠습니까?',
      isDanger: true,
      onConfirm: () => {
        onDeletePost(post.id);
        toast.success('게시글이 삭제되었습니다.');
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        navigate('/community');
      }
    });
  };

  if (isPostLoading || isCommentsLoading) {
    return (
      <div className="bg-stone-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-amber-500" size={48} />
          <p className="text-stone-500">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isPostError || !post) {
    return (
      <div className="bg-stone-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">게시글을 찾을 수 없습니다.</p>
          <button
            onClick={onNavigateToBoard}
            className="px-6 py-3 bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  const currentViews = postViews.get(post.id) || post.views;
  const extendedPost = post as ExtendedPost;
  const config = categoryConfig[post.type];
  const CategoryIcon = config.icon;
  const isSupport = post.type === 'SUPPORT';

  return (
    <div className={`min-h-screen ${isSupport ? 'bg-amber-50' : 'bg-stone-100'}`}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={onNavigateToBoard}
          className="mb-4 text-stone-500 hover:text-stone-800 flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={16} />
          목록으로
        </button>

        <div className="bg-white border border-stone-300">
          {/* 게시글 헤더 */}
          <div className={`px-6 py-5 ${isSupport ? 'bg-amber-500' : 'bg-stone-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium ${isSupport ? 'bg-white/20 text-white' : `${config.color} text-white`}`}>
                {config.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">{post.title}</h1>
          </div>

          <div className="p-6">
            {/* 메타 정보 */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200">
              <div className="flex items-center gap-3 text-sm text-stone-500">
                <span className="font-medium text-stone-700">{post.author}</span>
                <span>•</span>
                <span>{post.date}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {currentViews}
                </span>
              </div>

              {/* 수정/삭제/신고 버튼 */}
              <div className="flex gap-2">
                {canEditPost() && (
                  <button
                    onClick={() => onNavigateToEdit(post)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-stone-300 hover:bg-stone-50 transition-colors"
                  >
                    <Edit size={14} />
                    수정
                  </button>
                )}
                {canDeletePost() && (
                  <button
                    onClick={handleDeletePost}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                )}
                {isLoggedIn && !canEditPost() && (
                  <button
                    onClick={() => setReportModal({
                      isOpen: true,
                      itemId: post.id,
                      itemType: 'POST',
                      itemTitle: post.title
                    })}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Flag size={14} />
                    신고
                  </button>
                )}
              </div>
            </div>

            {/* 게시글 내용 */}
            {isSupport ? (
              <div className="mb-6 bg-amber-50 border border-amber-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Heart size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {post.content || '응원 메시지가 여기에 표시됩니다.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {post.content || '게시글 내용이 여기에 표시됩니다.'}
                </p>
              </div>
            )}

            {/* 첨부 이미지 표시 */}
            {extendedPost.images && extendedPost.images.length > 0 && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">
                  첨부 이미지
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {extendedPost.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`첨부 이미지 ${index + 1}`}
                      className="w-full h-40 object-cover border border-stone-200 hover:opacity-90 cursor-pointer transition-opacity"
                      onClick={() => window.open(image, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 좋아요 버튼 */}
            <div className="flex gap-2 pb-4 mb-6 border-b border-stone-200">
              {isLoggedIn && (
                <button
                  onClick={handleLikePost}
                  disabled={likePostMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    postData?.isLiked
                      ? isSupport
                        ? 'border-amber-500 bg-amber-50 text-amber-600 hover:bg-amber-100'
                        : 'border-amber-500 bg-amber-50 text-amber-600 hover:bg-amber-100'
                      : 'border-stone-300 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <Heart size={16} fill={postData?.isLiked ? 'currentColor' : 'none'} />
                  {isSupport ? '응원해요' : '좋아요'} {postData?.likeCount || 0}
                </button>
              )}
            </div>

            {/* 댓글 섹션 */}
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-4">
                댓글 {commentsData?.totalElements || comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}개
              </label>

              {/* 댓글 작성 */}
              {isLoggedIn ? (
                <div className="mb-6">
                  {replyTo && (
                    <div className="mb-2 p-3 bg-stone-100 border border-stone-200 flex items-center justify-between">
                      <span className="text-sm text-stone-600">
                        <Reply size={14} className="inline mr-1" />
                        {comments.find(c => c.id === replyTo)?.author}님에게 답글 작성 중
                      </span>
                      <button onClick={() => setReplyTo(null)} className="text-stone-500 hover:text-stone-700">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyTo ? "답글을 입력하세요..." : isSupport ? "응원의 댓글을 남겨주세요" : "댓글을 입력하세요..."}
                      className="flex-1 p-3 border border-stone-300 resize-none focus:outline-none focus:border-amber-500 transition-colors"
                      rows={3}
                    />
                    <button
                      onClick={() => addComment(newComment, replyTo || undefined)}
                      className={`px-4 text-white transition-colors ${
                        isSupport
                          ? 'bg-amber-500 hover:bg-amber-600'
                          : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-stone-100 border border-stone-200 text-center text-stone-600 text-sm">
                  댓글을 작성하려면 로그인이 필요합니다.
                </div>
              )}

              {/* 댓글 목록 */}
              <div className="space-y-3">
                {comments.map(comment => (
                  <div
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    className={`p-4 ${isSupport ? 'bg-amber-50 border border-amber-100' : 'bg-stone-50 border border-stone-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm">
                        <span className="font-medium text-stone-800">{comment.author}</span>
                        <span className="text-stone-400 ml-2">{new Date(comment.date).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>

                    {/* 댓글 내용 또는 수정 폼 */}
                    {editingCommentId === comment.id ? (
                      <div className="mb-2">
                        <textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          className="w-full p-3 border border-stone-300 resize-none focus:outline-none focus:border-amber-500 transition-colors bg-white"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveEditComment(comment.id)}
                            className="px-3 py-1.5 bg-amber-500 text-white text-sm hover:bg-amber-600 transition-colors"
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEditComment}
                            className="px-3 py-1.5 bg-stone-200 text-stone-700 text-sm hover:bg-stone-300 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-stone-700 text-sm mb-3">{comment.content}</p>

                        {/* 댓글 액션 버튼 */}
                        <div className="flex items-center gap-3 text-xs">
                          {isLoggedIn && (
                            <button
                              onClick={() => setReplyTo(comment.id)}
                              className="text-stone-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
                            >
                              <Reply size={12} />
                              답글
                            </button>
                          )}
                          {isLoggedIn && (
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              disabled={likeCommentMutation.isPending}
                              className={`flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                comment.isLiked
                                  ? 'text-amber-600 hover:text-amber-700'
                                  : 'text-stone-500 hover:text-amber-600'
                              }`}
                            >
                              <Heart size={12} fill={comment.isLiked ? 'currentColor' : 'none'} />
                              {comment.likeCount || 0}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyCommentLink(comment.id)}
                            className="text-stone-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                          >
                            <Link size={12} />
                            링크
                          </button>
                          {canEditComment(comment) && (
                            <>
                              <button
                                onClick={() => startEditComment(comment)}
                                className="text-stone-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                              >
                                <Edit size={12} />
                                수정
                              </button>
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="text-stone-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                              >
                                <Trash2 size={12} />
                                삭제
                              </button>
                            </>
                          )}
                          {isLoggedIn && !canEditComment(comment) && (
                            <button
                              onClick={() => setReportModal({
                                isOpen: true,
                                itemId: comment.id,
                                itemType: 'COMMENT',
                                itemTitle: comment.content.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content
                              })}
                              className="text-stone-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                            >
                              <Flag size={12} />
                              신고
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* 대댓글 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-4 space-y-2">
                        {comment.replies.map(reply => (
                          <div
                            key={reply.id}
                            id={`comment-${reply.id}`}
                            className={`p-3 border-l-2 ${
                              isSupport
                                ? 'bg-white border-amber-300'
                                : 'bg-white border-stone-300'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-1 text-sm">
                                <Reply size={12} className={isSupport ? 'text-amber-500' : 'text-stone-400'} />
                                <span className="font-medium text-stone-800">{reply.author}</span>
                                <span className="text-stone-400 ml-2">{new Date(reply.date).toLocaleDateString('ko-KR')}</span>
                              </div>
                            </div>

                            {/* 대댓글 내용 또는 수정 폼 */}
                            {editingCommentId === reply.id ? (
                              <div className="mb-2">
                                <textarea
                                  value={editingCommentContent}
                                  onChange={(e) => setEditingCommentContent(e.target.value)}
                                  className="w-full p-3 border border-stone-300 resize-none focus:outline-none focus:border-amber-500 transition-colors"
                                  rows={3}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => saveEditComment(reply.id, true, comment.id)}
                                    className="px-3 py-1.5 bg-amber-500 text-white text-sm hover:bg-amber-600 transition-colors"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={cancelEditComment}
                                    className="px-3 py-1.5 bg-stone-200 text-stone-700 text-sm hover:bg-stone-300 transition-colors"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-stone-700 text-sm mb-2">{reply.content}</p>

                                {/* 대댓글 액션 버튼 */}
                                <div className="flex items-center gap-3 text-xs">
                                  {isLoggedIn && (
                                    <button
                                      onClick={() => handleLikeComment(reply.id)}
                                      disabled={likeCommentMutation.isPending}
                                      className={`flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                        reply.isLiked
                                          ? 'text-amber-600 hover:text-amber-700'
                                          : 'text-stone-500 hover:text-amber-600'
                                      }`}
                                    >
                                      <Heart size={12} fill={reply.isLiked ? 'currentColor' : 'none'} />
                                      {reply.likeCount || 0}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCopyCommentLink(reply.id)}
                                    className="text-stone-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                  >
                                    <Link size={12} />
                                    링크
                                  </button>
                                  {canEditComment(reply) && (
                                    <>
                                      <button
                                        onClick={() => startEditComment(reply)}
                                        className="text-stone-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                      >
                                        <Edit size={12} />
                                        수정
                                      </button>
                                      <button
                                        onClick={() => deleteComment(reply.id, true, comment.id)}
                                        className="text-stone-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                      >
                                        <Trash2 size={12} />
                                        삭제
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 댓글 페이지네이션 */}
              {commentsData && commentsData.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={commentPage}
                    totalPages={commentsData.totalPages}
                    onPageChange={(page) => {
                      setCommentPage(page);
                      // 댓글 섹션으로 스크롤
                      const commentSection = document.querySelector('.space-y-3');
                      if (commentSection) {
                        commentSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        isDanger={confirmModal.isDanger}
        isLoading={confirmModal.isLoading}
      />

      {/* 신고 모달 */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, itemId: 0, itemType: 'COMMENT' })}
        itemId={reportModal.itemId}
        itemType={reportModal.itemType}
        itemTitle={reportModal.itemTitle}
      />
    </div>
  );
};

export default PostDetailPage;
