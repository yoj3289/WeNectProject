package com.wenect.donation_paltform.domain.project.service;

import com.wenect.donation_paltform.domain.project.dto.DonationOptionDto;
import com.wenect.donation_paltform.domain.project.entity.DonationOption;
import com.wenect.donation_paltform.domain.project.repository.DonationOptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 기부 옵션 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DonationOptionService {

    private final DonationOptionRepository donationOptionRepository;

    /**
     * 프로젝트의 활성화된 기부 옵션 목록 조회
     */
    public List<DonationOptionDto> getActiveOptionsByProjectId(Long projectId) {
        log.info("프로젝트 ID {}의 활성 기부 옵션 조회", projectId);
        List<DonationOption> options = donationOptionRepository
                .findByProjectIdAndIsActiveTrueOrderByDisplayOrderAsc(projectId);

        return options.stream()
                .map(DonationOptionDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 프로젝트의 모든 기부 옵션 목록 조회 (관리자용)
     */
    public List<DonationOptionDto> getAllOptionsByProjectId(Long projectId) {
        log.info("프로젝트 ID {}의 전체 기부 옵션 조회", projectId);
        List<DonationOption> options = donationOptionRepository
                .findByProjectIdOrderByDisplayOrderAsc(projectId);

        return options.stream()
                .map(DonationOptionDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 기부 옵션 단건 조회
     */
    public DonationOptionDto getOptionById(Long optionId) {
        log.info("기부 옵션 ID {} 조회", optionId);
        DonationOption option = donationOptionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 기부 옵션입니다."));

        return DonationOptionDto.fromEntity(option);
    }

    /**
     * 기부 옵션 생성 (단건)
     */
    @Transactional
    public DonationOptionDto createOption(DonationOptionDto dto) {
        log.info("기부 옵션 생성: {}", dto.getOptionName());

        // 유효성 검증
        validateOption(dto);

        DonationOption option = dto.toEntity();
        DonationOption saved = donationOptionRepository.save(option);

        return DonationOptionDto.fromEntity(saved);
    }

    /**
     * 기부 옵션 여러 개 생성 (프로젝트 생성 시)
     */
    @Transactional
    public List<DonationOptionDto> createOptions(Long projectId, List<DonationOptionDto> dtoList) {
        log.info("프로젝트 ID {}에 기부 옵션 {}개 생성", projectId, dtoList.size());

        // 각 옵션의 projectId 설정 및 유효성 검증
        for (int i = 0; i < dtoList.size(); i++) {
            DonationOptionDto dto = dtoList.get(i);
            dto.setProjectId(projectId);

            // displayOrder가 없으면 자동 설정
            if (dto.getDisplayOrder() == null) {
                dto.setDisplayOrder(i);
            }

            validateOption(dto);
        }

        List<DonationOption> options = dtoList.stream()
                .map(DonationOptionDto::toEntity)
                .collect(Collectors.toList());

        List<DonationOption> savedOptions = donationOptionRepository.saveAll(options);

        return savedOptions.stream()
                .map(DonationOptionDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 기부 옵션 수정
     */
    @Transactional
    public DonationOptionDto updateOption(Long optionId, DonationOptionDto dto) {
        log.info("기부 옵션 ID {} 수정", optionId);

        DonationOption option = donationOptionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 기부 옵션입니다."));

        // 유효성 검증
        validateOption(dto);

        // 수정 가능한 필드만 업데이트
        option.setOptionName(dto.getOptionName());
        option.setOptionDescription(dto.getOptionDescription());
        option.setAmount(dto.getAmount());
        option.setIconEmoji(dto.getIconEmoji());
        option.setDisplayOrder(dto.getDisplayOrder());
        option.setIsActive(dto.getIsActive());

        DonationOption updated = donationOptionRepository.save(option);

        return DonationOptionDto.fromEntity(updated);
    }

    /**
     * 기부 옵션 삭제
     */
    @Transactional
    public void deleteOption(Long optionId) {
        log.info("기부 옵션 ID {} 삭제", optionId);

        if (!donationOptionRepository.existsById(optionId)) {
            throw new IllegalArgumentException("존재하지 않는 기부 옵션입니다.");
        }

        donationOptionRepository.deleteById(optionId);
    }

    /**
     * 프로젝트의 모든 기부 옵션 삭제
     */
    @Transactional
    public void deleteOptionsByProjectId(Long projectId) {
        log.info("프로젝트 ID {}의 모든 기부 옵션 삭제", projectId);
        donationOptionRepository.deleteByProjectId(projectId);
    }

    /**
     * 기부 옵션 유효성 검증
     */
    private void validateOption(DonationOptionDto dto) {
        if (dto.getOptionName() == null || dto.getOptionName().trim().isEmpty()) {
            throw new IllegalArgumentException("옵션명은 필수입니다.");
        }

        if (dto.getOptionName().length() > 200) {
            throw new IllegalArgumentException("옵션명은 200자 이하여야 합니다.");
        }

        if (dto.getAmount() == null || dto.getAmount().doubleValue() < 1000) {
            throw new IllegalArgumentException("금액은 최소 1,000원 이상이어야 합니다.");
        }

        if (dto.getOptionDescription() != null && dto.getOptionDescription().length() > 500) {
            throw new IllegalArgumentException("설명은 500자 이하여야 합니다.");
        }
    }
}
