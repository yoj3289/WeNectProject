package com.wenect.donation_paltform.domain.community.service;

import com.wenect.donation_paltform.domain.auth.entity.User;
import com.wenect.donation_paltform.domain.auth.repository.UserRepository;
import com.wenect.donation_paltform.domain.community.dto.*;
import com.wenect.donation_paltform.domain.community.entity.Post;
import com.wenect.donation_paltform.domain.community.entity.PostImage;
import com.wenect.donation_paltform.domain.community.entity.PostLike;
import com.wenect.donation_paltform.domain.community.repository.CommentRepository;
import com.wenect.donation_paltform.domain.community.repository.PostImageRepository;
import com.wenect.donation_paltform.domain.community.repository.PostRepository;
import com.wenect.donation_paltform.domain.community.repository.PostLikeRepository;
import com.wenect.donation_paltform.global.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PostLikeRepository postLikeRepository;

    /**
     * 게시글 목록 조회 (페이징, 필터링, 검색)
     */
    public PostListResponse getPosts(String type, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> postPage;

        if (type != null && !type.isEmpty() && search != null && !search.isEmpty()) {
            // 타입 + 검색
            postPage = postRepository.searchByTypeAndKeyword(Post.PostType.valueOf(type), search, pageable);
        } else if (type != null && !type.isEmpty()) {
            // 타입만
            postPage = postRepository.findByType(Post.PostType.valueOf(type), pageable);
        } else if (search != null && !search.isEmpty()) {
            // 검색만
            postPage = postRepository.searchByKeyword(search, pageable);
        } else {
            // 전체
            postPage = postRepository.findAllActive(pageable);
        }

        List<PostResponse> content = postPage.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return PostListResponse.builder()
                .content(content)
                .totalPages(postPage.getTotalPages())
                .totalElements(postPage.getTotalElements())
                .currentPage(page)
                .size(size)
                .build();
    }

    /**
     * 게시글 상세 조회
     */
    @Transactional
    public PostResponse getPost(Long postId) {
        Post post = postRepository.findByIdAndNotDeleted(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 조회수 증가
        post.incrementViewCount();
        postRepository.save(post);

        return convertToResponse(post);
    }

    /**
     * 게시글 작성
     */
    @Transactional
    public PostResponse createPost(Long userId, CreatePostRequest request, List<MultipartFile> images) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 게시글 타입별 권한 체크
        // NOTICE(공지): 관리자만
        // NEWS(소식): 관리자 + 기관
        // QUESTION, SUPPORT, GENERAL: 모든 사용자
        if ("NOTICE".equals(request.getType())) {
            if (user.getUserType() != User.UserType.ADMIN) {
                throw new IllegalArgumentException("공지사항은 관리자만 작성할 수 있습니다.");
            }
        } else if ("NEWS".equals(request.getType())) {
            if (user.getUserType() != User.UserType.ADMIN && user.getUserType() != User.UserType.ORGANIZATION) {
                throw new IllegalArgumentException("소식은 관리자 또는 기관만 작성할 수 있습니다.");
            }
        }

        // Post 생성
        Post post = Post.builder()
                .userId(userId)
                .projectId(request.getProjectId())
                .type(Post.PostType.valueOf(request.getType()))
                .title(request.getTitle())
                .content(request.getContent())
                .isNotice("NOTICE".equals(request.getType()))
                .build();

        post = postRepository.save(post);

        // 이미지 저장
        if (images != null && !images.isEmpty()) {
            int displayOrder = 0;
            for (MultipartFile image : images) {
                String filePath = fileStorageService.saveCommunityPostImage(image);

                PostImage postImage = PostImage.builder()
                        .post(post)
                        .filePath(filePath)
                        .fileName(image.getOriginalFilename())
                        .fileSize(image.getSize())
                        .displayOrder(displayOrder++)
                        .build();

                postImageRepository.save(postImage);
            }
        }

        return convertToResponse(post);
    }

    /**
     * 게시글 수정
     */
    @Transactional
    public PostResponse updatePost(Long userId, Long postId, UpdatePostRequest request, List<MultipartFile> newImages) throws IOException {
        Post post = postRepository.findByIdAndNotDeleted(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 권한 확인
        if (!post.getUserId().equals(userId)) {
            throw new IllegalArgumentException("게시글을 수정할 권한이 없습니다.");
        }

        // 게시글 수정
        if (request.getTitle() != null) {
            post.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }

        // 삭제할 이미지 처리
        if (request.getRemoveImageIds() != null && !request.getRemoveImageIds().isEmpty()) {
            for (Long imageId : request.getRemoveImageIds()) {
                PostImage image = postImageRepository.findById(imageId)
                        .orElseThrow(() -> new IllegalArgumentException("이미지를 찾을 수 없습니다."));

                // 파일 삭제
                fileStorageService.deleteFile(image.getFilePath());

                // DB에서 삭제
                postImageRepository.delete(image);
            }
        }

        // 새 이미지 추가
        if (newImages != null && !newImages.isEmpty()) {
            // 현재 최대 displayOrder 찾기
            List<PostImage> existingImages = postImageRepository.findByPostId(postId);
            int maxOrder = existingImages.stream()
                    .mapToInt(PostImage::getDisplayOrder)
                    .max()
                    .orElse(-1);

            int displayOrder = maxOrder + 1;
            for (MultipartFile image : newImages) {
                String filePath = fileStorageService.saveCommunityPostImage(image);

                PostImage postImage = PostImage.builder()
                        .post(post)
                        .filePath(filePath)
                        .fileName(image.getOriginalFilename())
                        .fileSize(image.getSize())
                        .displayOrder(displayOrder++)
                        .build();

                postImageRepository.save(postImage);
            }
        }

        post = postRepository.save(post);
        return convertToResponse(post);
    }

    /**
     * 게시글 삭제 (소프트 삭제)
     */
    @Transactional
    public void deletePost(Long userId, Long postId) {
        Post post = postRepository.findByIdAndNotDeleted(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 권한 확인 (작성자 또는 관리자)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!post.getUserId().equals(userId) && user.getUserType() != User.UserType.ADMIN) {
            throw new IllegalArgumentException("게시글을 삭제할 권한이 없습니다.");
        }

        post.softDelete();
        postRepository.save(post);
    }

    /**
     * 좋아요 토글
     */
    @Transactional
    public PostResponse toggleLike(Long userId, Long postId) {
        Post post = postRepository.findByIdAndNotDeleted(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        // 이미 좋아요를 눌렀는지 확인
        Optional<PostLike> existingLike = postLikeRepository.findByPostIdAndUserId(postId, userId);

        if (existingLike.isPresent()) {
            // 좋아요 취소
            postLikeRepository.delete(existingLike.get());
            post.decrementLikeCount();
        } else {
            // 좋아요 추가
            PostLike postLike = PostLike.builder()
                    .postId(postId)
                    .userId(userId)
                    .build();
            postLikeRepository.save(postLike);
            post.incrementLikeCount();
        }

        post = postRepository.save(post);
        return convertToResponse(post, userId);
    }

    /**
     * Post -> PostResponse 변환 (userId 없이 - 목록 조회용)
     */
    private PostResponse convertToResponse(Post post) {
        return convertToResponse(post, null);
    }

    /**
     * Post -> PostResponse 변환 (userId 포함 - 좋아요 상태 확인용)
     */
    private PostResponse convertToResponse(Post post, Long currentUserId) {
        // 사용자 조회 (삭제된 사용자 처리)
        User user = userRepository.findById(post.getUserId()).orElse(null);

        AuthorDto author;
        if (user != null) {
            author = AuthorDto.builder()
                    .userId(user.getUserId())
                    .userName(user.getUserName())
                    .userType(user.getUserType().name())
                    .build();
        } else {
            // 삭제된 사용자인 경우 기본값 사용
            author = AuthorDto.builder()
                    .userId(post.getUserId())
                    .userName("알 수 없음")
                    .userType("INDIVIDUAL")
                    .build();
        }

        List<PostImage> images = postImageRepository.findByPostId(post.getPostId());
        List<PostImageDto> imageDtos = images.stream()
                .map(img -> PostImageDto.builder()
                        .imageId(img.getImageId())
                        .imageUrl(img.getFilePath())
                        .fileName(img.getFileName())
                        .fileSize(img.getFileSize())
                        .displayOrder(img.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        Long commentCount = commentRepository.countByPostId(post.getPostId());

        // 현재 사용자가 좋아요를 눌렀는지 확인
        boolean isLiked = false;
        if (currentUserId != null) {
            isLiked = postLikeRepository.existsByPostIdAndUserId(post.getPostId(), currentUserId);
        }

        return PostResponse.builder()
                .postId(post.getPostId())
                .type(post.getType().name())
                .title(post.getTitle())
                .content(post.getContent())
                .author(author)
                .viewCount(post.getViewCount())
                .likeCount(post.getLikeCount())
                .commentCount(commentCount)
                .isPinned(post.getIsNotice())
                .isLiked(isLiked)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .images(imageDtos)
                .build();
    }
}
