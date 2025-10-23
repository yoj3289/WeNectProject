import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Reply, Send, X } from 'lucide-react';
import type { CommunityPost, Comment } from '../../types';

interface PostDetailPageProps {
  selectedPost: CommunityPost | null;
  isLoggedIn: boolean;
  userType: 'individual' | 'organization' | 'admin';
  currentUserName: string;
  postViews: Map<number, number>;
  onNavigateToBoard: () => void;
  onNavigateToEdit: (post: CommunityPost) => void;
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
  onNavigateToBoard,
  onNavigateToEdit,
  onDeletePost,
  onIncrementView
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  // 게시글이 변경될 때마다 댓글 초기화
  useEffect(() => {
    if (selectedPost?.comments) {
      setComments(selectedPost.comments);
    } else {
      setComments([]);
    }
  }, [selectedPost?.id]);

  // 조회수 증가 (페이지 진입 시 한 번만 실행)
  useEffect(() => {
    if (selectedPost) {
      onIncrementView(selectedPost.id);
    }
  }, [selectedPost?.id]);

  // 댓글 추가
  const addComment = (content: string, parentId?: number) => {
    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    const comment: Comment = {
      id: Date.now(),
      author: currentUserName || '사용자',
      content,
      date: new Date().toLocaleDateString('ko-KR'),
      parentId,
      replies: []
    };

    if (parentId) {
      // 대댓글인 경우
      const updatedComments = comments.map(c => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), comment]
          };
        }
        return c;
      });
      setComments(updatedComments);
    } else {
      // 일반 댓글인 경우
      setComments([...comments, comment]);
    }

    setNewComment('');
    setReplyTo(null);
    alert('댓글이 등록되었습니다.');
  };

  // 댓글 수정 시작
  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  // 댓글 수정 저장
  const saveEditComment = (commentId: number, isReply: boolean = false, parentId?: number) => {
    if (!editingCommentContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    if (isReply && parentId) {
      // 대댓글 수정
      const updatedComments = comments.map(c => {
        if (c.id === parentId && c.replies) {
          return {
            ...c,
            replies: c.replies.map(r =>
              r.id === commentId ? { ...r, content: editingCommentContent } : r
            )
          };
        }
        return c;
      });
      setComments(updatedComments);
    } else {
      // 일반 댓글 수정
      const updatedComments = comments.map(c =>
        c.id === commentId ? { ...c, content: editingCommentContent } : c
      );
      setComments(updatedComments);
    }

    setEditingCommentId(null);
    setEditingCommentContent('');
    alert('댓글이 수정되었습니다.');
  };

  // 댓글 수정 취소
  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  // 댓글 삭제
  const deleteComment = (id: number, isReply: boolean = false, parentId?: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    if (isReply && parentId) {
      // 대댓글 삭제
      const updatedComments = comments.map(c => {
        if (c.id === parentId && c.replies) {
          return {
            ...c,
            replies: c.replies.filter(r => r.id !== id)
          };
        }
        return c;
      });
      setComments(updatedComments);
    } else {
      // 일반 댓글 및 그 대댓글 삭제
      setComments(comments.filter(c => c.id !== id));
    }

    alert('댓글이 삭제되었습니다.');
  };

  // 댓글 수정 권한 체크
  const canEditComment = (comment: Comment) => {
    return isLoggedIn && comment.author === currentUserName;
  };

  // 게시글 수정 권한 체크
  const canEditPost = () => {
    if (!selectedPost) return false;
    return isLoggedIn && (selectedPost.author === currentUserName || userType === 'admin');
  };

  // 게시글 삭제 권한 체크
  const canDeletePost = () => {
    if (!selectedPost) return false;
    return isLoggedIn && (selectedPost.author === currentUserName || userType === 'admin');
  };

  const handleDeletePost = () => {
    if (!selectedPost) return;

    if (confirm('게시글을 삭제하시겠습니까?')) {
      onDeletePost(selectedPost.id);
      alert('게시글이 삭제되었습니다.');
      onNavigateToBoard();
    }
  };

  if (!selectedPost) {
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

  const currentViews = postViews.get(selectedPost.id) || selectedPost.views;
  const extendedPost = selectedPost as ExtendedPost;

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
              selectedPost.type === '공지' ? 'bg-red-100 text-red-600' :
              selectedPost.type === '질문' ? 'bg-blue-100 text-blue-600' :
              'bg-green-100 text-green-600'
            }`}>
              {selectedPost.type}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-6">{selectedPost.title}</h1>

          <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <span className="font-semibold">{selectedPost.author}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{selectedPost.date}</span>
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
                    onClick={() => onNavigateToEdit(selectedPost)}
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
              {selectedPost.content || '게시글 내용이 여기에 표시됩니다.'}
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
                <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900">{comment.author}</span>
                      <span className="text-sm text-gray-500 ml-2">{comment.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoggedIn && (
                        <button
                          onClick={() => setReplyTo(comment.id)}
                          className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
                        >
                          <Reply size={14} />
                          답글
                        </button>
                      )}
                      {canEditComment(comment) && (
                        <>
                          <button
                            onClick={() => startEditComment(comment)}
                            className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
                          >
                            <Edit size={14} />
                            수정
                          </button>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
                          >
                            <Trash2 size={14} />
                            삭제
                          </button>
                        </>
                      )}
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
                    <p className="text-gray-700 mb-2">{comment.content}</p>
                  )}

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
                            {canEditComment(reply) && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEditComment(reply)}
                                  className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <Edit size={14} />
                                  수정
                                </button>
                                <button
                                  onClick={() => deleteComment(reply.id, true, comment.id)}
                                  className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
                                >
                                  <Trash2 size={14} />
                                  삭제
                                </button>
                              </div>
                            )}
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
                            <p className="text-gray-700">{reply.content}</p>
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
