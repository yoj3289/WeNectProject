package com.wenect.donation_paltform.domain.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 시스템 메트릭 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemMetricsResponse {

    /**
     * CPU 사용률 (0-100%)
     */
    private Double cpuUsage;

    /**
     * 메모리 정보
     */
    private MemoryInfo memory;

    /**
     * 디스크 정보
     */
    private DiskInfo disk;

    /**
     * JVM 정보
     */
    private JvmInfo jvm;

    /**
     * 시스템 정보
     */
    private SystemInfo system;

    /**
     * 데이터베이스 정보
     */
    private DatabaseInfo database;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemoryInfo {
        /**
         * 전체 메모리 (bytes)
         */
        private Long total;

        /**
         * 사용 중인 메모리 (bytes)
         */
        private Long used;

        /**
         * 사용 가능한 메모리 (bytes)
         */
        private Long free;

        /**
         * 사용률 (0-100%)
         */
        private Double usagePercent;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiskInfo {
        /**
         * 전체 디스크 용량 (bytes)
         */
        private Long total;

        /**
         * 사용 가능한 디스크 용량 (bytes)
         */
        private Long free;

        /**
         * 사용 중인 디스크 용량 (bytes)
         */
        private Long used;

        /**
         * 사용률 (0-100%)
         */
        private Double usagePercent;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JvmInfo {
        /**
         * JVM 전체 메모리 (bytes)
         */
        private Long totalMemory;

        /**
         * JVM 사용 가능한 메모리 (bytes)
         */
        private Long freeMemory;

        /**
         * JVM 최대 메모리 (bytes)
         */
        private Long maxMemory;

        /**
         * 사용 중인 JVM 메모리 (bytes)
         */
        private Long usedMemory;

        /**
         * 활성 스레드 수
         */
        private Integer activeThreads;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemInfo {
        /**
         * OS 이름
         */
        private String osName;

        /**
         * OS 버전
         */
        private String osVersion;

        /**
         * OS 아키텍처
         */
        private String osArch;

        /**
         * 사용 가능한 프로세서 수
         */
        private Integer availableProcessors;

        /**
         * 서버 가동 시간 (milliseconds)
         */
        private Long uptime;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DatabaseInfo {
        /**
         * 데이터베이스 연결 상태
         */
        private Boolean isConnected;

        /**
         * 활성 연결 수
         */
        private Integer activeConnections;

        /**
         * 최대 연결 수
         */
        private Integer maxConnections;

        /**
         * 데이터베이스 타입
         */
        private String databaseType;

        /**
         * 데이터베이스 버전
         */
        private String databaseVersion;

        /**
         * 응답 시간 (milliseconds)
         */
        private Long responseTime;
    }
}
