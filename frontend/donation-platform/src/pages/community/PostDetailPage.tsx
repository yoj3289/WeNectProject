import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Eye, Edit, Trash2, Reply, Send, X, Loader2, Heart, Link } from 'lucide-react';
import type { CommunityPost, Comment, PostType } from '../../types';
import { POST_TYPE_LABELS } from '../../types';
import { usePost, useComments, useCreateComment, useDeleteComment, useUpdateComment, useLikePost, useLikeComment } from '../../hooks/useCommunity';

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

  // API에서 게시글 데이터 가져오기
  const { data: postData, isLoading: isPostLoading, isError: isPostError } = usePost(postId || 0);
  const { data: commentsData, isLoading: isCommentsLoading } = useComments(postId || 0);

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
    if (commentsData) {
      const convertedComments: Comment[] = commentsData
        .filter(c => !c.parentCommentId)
        .map(comment => ({
          id: comment.commentId,
          author: comment.author.userName,
          content: comment.content,
          date: new Date(comment.createdAt).toISOString(),
          likeCount: comment.likeCount || 0,
          isLiked: comment.isLiked || false,
          replies: commentsData
            .filter(r => r.parentCommentId === comment.commentId)
            .map(reply => ({
              id: reply.commentId,
              author: reply.author.userName,
              content: reply.content,
              date: new Date(reply.createdAt).toISOString(),
              likeCount: reply.likeCount || 0,
              isLiked: reply.isLiked || false
            }))
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
    if (hasScrolledToComment.current || !commentsData || isCommentsLoading) {
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
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await likePostMutation.mutateAsync(post.id);
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  // 댓글 좋아요
  const handleLikeComment = async (commentId: number) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await likeCommentMutation.mutateAsync(commentId);
    } catch (error) {
      console.error('댓글 좋아요 처리 실패:', error);
      alert('댓글 좋아요 처리에 실패했습니다.');
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
      alert('댓글 링크가 복사되었습니다.');
    } catch (err) {
      alert('링크 복사에 실패했습니다. URL: ' + text);
    }

    document.body.removeChild(textArea);
  };

  // 댓글 링크 복사
  const handleCopyCommentLink = (commentId: number) => {
    const url = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;

    // HTTPS 환경에서는 navigator.clipboard 사용, HTTP에서는 폴백 사용
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        alert('댓글 링크가 복사되었습니다.');
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
      alert('댓글 내용을 입력해주세요.');
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
      alert('댓글이 등록되었습니다.');
    } catch (error) {
      alert('댓글 등록에 실패했습니다.');
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
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        content: editingCommentContent
      });

      setEditingCommentId(null);
      setEditingCommentContent('');
      alert('댓글이 수정되었습니다.');
    } catch (error) {
      alert('댓글 수정에 실패했습니다.');
      console.error(error);
    }
  };

  // 댓글 수정 취소
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  // 댓글 삭제
  const deleteComment = async (id: number, isReply: boolean = false, parentId?: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteCommentMutation.mutateAsync(id);
      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      alert('댓글 삭제에 실패했습니다.');
      console.error(error);
    }
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

    if (confirm('게시글을 삭제하시겠습니까?')) {
      onDeletePost(post.id);
      alert('게시글이 삭제되었습니다.');
      navigate('/community');
    }
  };

  if (isPostLoading || isCommentsLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-red-500" size={48} />
          <p className="text-gray-500">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isPostError || !post) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">게시글을 찾을 수 없습니다.</p>
          <button
            onClick={onNavigateToBoard}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  const currentViews = postViews.get(post.id) || post.views;
  const extendedPost = post as ExtendedPost;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <button
          onClick={onNavigateToBoard}
          className="mb-8 text-gray-600 hover:text-gray-900 font-semibold"
        >
          ← 목록으로
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {/* 게시글 헤더 */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded font-bold ${
              post.type === 'NOTICE' ? 'bg-red-100 text-red-600' :
              post.type === 'QUESTION' ? 'bg-blue-100 text-blue-600' :
              'bg-green-100 text-green-600'
            }`}>
              {POST_TYPE_LABELS[post.type]}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <span className="font-semibold">{post.author}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{post.date}</span>
              <span className="text-gray-500">•</span>
              <span className="flex items-center gap-1 text-gray-500">
                <Eye size={16} />
                {currentViews}
              </span>
            </div>

            {/* 수정/삭제 버튼 */}
            {(canEditPost() || canDeletePost()) && (
              <div className="flex gap-2">
                {canEditPost() && (
                  <button
                    onClick={() => onNavigateToEdit(post)}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Edit size={16} />
                    수정
                  </button>
                )}
                {canDeletePost() && (
                  <button
                    onClick={handleDeletePost}
                    className="flex items-center gap-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 게시글 내용 */}
          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content || '게시글 내용이 여기에 표시됩니다.'}
            </p>
          </div>

          {/* 첨부 이미지 표시 */}
          {extendedPost.images && extendedPost.images.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">첨부 이미지</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {extendedPost.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:opacity-90 cursor-pointer transition-opacity"
                    onClick={() => window.open(image, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 좋아요 버튼 */}
          <div className="flex gap-2 pb-6 mb-6 border-b border-gray-200">
            {isLoggedIn && (
              <button
                onClick={handleLikePost}
                disabled={likePostMutation.isPending}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  postData?.isLiked
                    ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart size={16} fill={postData?.isLiked ? 'currentColor' : 'none'} />
                좋아요 {postData?.likeCount || 0}
              </button>
            )}
          </div>

          {/* 댓글 섹션 */}
          <div className="mt-8 border-t pt-8">
            <h3 className="text-2xl font-bold mb-6">
              댓글 {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}개
            </h3>

            {/* 댓글 작성 */}
            {isLoggedIn ? (
              <div className="mb-8">
                {replyTo && (
                  <div className="mb-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      <Reply size={14} className="inline mr-1" />
                      {comments.find(c => c.id === replyTo)?.author}님에게 답글 작성 중
                    </span>
                    <button onClick={() => setReplyTo(null)}>
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
                    className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={() => addComment(newComment, replyTo || undefined)}
                    className="px-6 bg-red-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
                댓글을 작성하려면 로그인이 필요합니다.
              </div>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment.id} id={`comment-${comment.id}`} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{comment.author}</span>
                      <span className="text-sm text-gray-500 ml-2">{new Date(comment.date).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>

                  {/* 댓글 내용 또는 수정 폼 */}
                  {editingCommentId === comment.id ? (
                    <div className="mb-2">
                      <textarea
                        value={editingCommentContent}
                        onChange={(e) => setEditingCommentContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveEditComment(comment.id)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEditComment}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-700 mb-3">{comment.content}</p>

                      {/* 댓글 액션 버튼 */}
                      <div className="flex items-center gap-3 text-sm">
                        {isLoggedIn && (
                          <button
                            onClick={() => setReplyTo(comment.id)}
                            className="text-gray-600 hover:text-red-600 flex items-center gap-1"
                          >
                            <Reply size={14} />
                            답글
                          </button>
                        )}
                        {isLoggedIn && (
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            disabled={likeCommentMutation.isPending}
                            className={`flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              comment.isLiked
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-gray-600 hover:text-red-600'
                            }`}
                          >
                            <Heart size={14} fill={comment.isLiked ? 'currentColor' : 'none'} />
                            좋아요 {comment.likeCount || 0}
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyCommentLink(comment.id)}
                          className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
                        >
                          <Link size={14} />
                          링크
                        </button>
                        {canEditComment(comment) && (
                          <>
                            <button
                              onClick={() => startEditComment(comment)}
                              className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
                            >
                              <Edit size={14} />
                              수정
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="text-gray-600 hover:text-red-600 flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* 대댓글 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-6 space-y-3">
                      {comment.replies.map(reply => (
                        <div key={reply.id} id={`comment-${reply.id}`} className="border-l-2 border-red-200 pl-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Reply size={14} className="inline text-red-500 mr-1" />
                              <span className="font-medium text-gray-900">{reply.author}</span>
                              <span className="text-sm text-gray-500 ml-2">{new Date(reply.date).toLocaleDateString('ko-KR')}</span>
                            </div>
                          </div>

                          {/* 대댓글 내용 또는 수정 폼 */}
                          {editingCommentId === reply.id ? (
                            <div className="mb-2">
                              <textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => saveEditComment(reply.id, true, comment.id)}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={cancelEditComment}
                                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-gray-700 mb-3">{reply.content}</p>

                              {/* 대댓글 액션 버튼 */}
                              <div className="flex items-center gap-3 text-sm">
                                {isLoggedIn && (
                                  <button
                                    onClick={() => handleLikeComment(reply.id)}
                                    disabled={likeCommentMutation.isPending}
                                    className={`flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                      reply.isLiked
                                        ? 'text-red-600 hover:text-red-700'
                                        : 'text-gray-600 hover:text-red-600'
                                    }`}
                                  >
                                    <Heart size={14} fill={reply.isLiked ? 'currentColor' : 'none'} />
                                    좋아요 {reply.likeCount || 0}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleCopyCommentLink(reply.id)}
                                  className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <Link size={14} />
                                  링크
                                </button>
                                {canEditComment(reply) && (
                                  <>
                                    <button
                                      onClick={() => startEditComment(reply)}
                                      className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
                                    >
                                      <Edit size={14} />
                                      수정
                                    </button>
                                    <button
                                      onClick={() => deleteComment(reply.id, true, comment.id)}
                                      className="text-gray-600 hover:text-red-600 flex items-center gap-1"
                                    >
                                      <Trash2 size={14} />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
