package com.wenect.donation_paltform.domain.admin.service;

import com.wenect.donation_paltform.domain.admin.dto.SystemMetricsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

/**
 * 시스템 메트릭 수집 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemMetricsService {

    private final DataSource dataSource;
    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    private final RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
    private final ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

    /**
     * 현재 시스템 메트릭 조회
     */
    public SystemMetricsResponse getSystemMetrics() {
        log.debug("시스템 메트릭 수집 시작");

        return SystemMetricsResponse.builder()
                .cpuUsage(getCpuUsage())
                .memory(getMemoryInfo())
                .disk(getDiskInfo())
                .jvm(getJvmInfo())
                .system(getSystemInfo())
                .database(getDatabaseInfo())
                .build();
    }

    /**
     * CPU 사용률 조회
     */
    private Double getCpuUsage() {
        try {
            // com.sun.management.OperatingSystemMXBean 사용 (Windows 호환)
            if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
                com.sun.management.OperatingSystemMXBean sunOsBean =
                    (com.sun.management.OperatingSystemMXBean) osBean;

                // 시스템 전체 CPU 사용률 (0.0 ~ 1.0)
                double cpuUsage = sunOsBean.getCpuLoad() * 100.0;

                // 유효한 값인지 확인
                if (cpuUsage >= 0.0) {
                    return Math.min(cpuUsage, 100.0);
                }
            }

            // 대체 방법: Load Average 사용 (Linux/Unix)
            double loadAverage = osBean.getSystemLoadAverage();
            if (loadAverage >= 0) {
                int processors = osBean.getAvailableProcessors();
                double cpuUsage = (loadAverage / processors) * 100.0;
                return Math.min(cpuUsage, 100.0);
            }

            return 0.0;

        } catch (Exception e) {
            log.warn("CPU 사용률 조회 실패", e);
            return 0.0;
        }
    }

    /**
     * 메모리 정보 조회
     */
    private SystemMetricsResponse.MemoryInfo getMemoryInfo() {
        try {
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            double usagePercent = (double) usedMemory / totalMemory * 100.0;

            return SystemMetricsResponse.MemoryInfo.builder()
                    .total(totalMemory)
                    .used(usedMemory)
                    .free(freeMemory)
                    .usagePercent(usagePercent)
                    .build();

        } catch (Exception e) {
            log.warn("메모리 정보 조회 실패", e);
            return SystemMetricsResponse.MemoryInfo.builder()
                    .total(0L)
                    .used(0L)
                    .free(0L)
                    .usagePercent(0.0)
                    .build();
        }
    }

    /**
     * 디스크 정보 조회
     */
    private SystemMetricsResponse.DiskInfo getDiskInfo() {
        try {
            // 루트 디렉토리 기준으로 디스크 정보 조회
            // Windows: C:\ / Linux: /
            File root = new File(System.getProperty("user.home")).getAbsoluteFile();
            while (root.getParentFile() != null) {
                root = root.getParentFile();
            }

            long totalSpace = root.getTotalSpace();
            long freeSpace = root.getFreeSpace();
            long usedSpace = totalSpace - freeSpace;
            double usagePercent = totalSpace > 0 ? (double) usedSpace / totalSpace * 100.0 : 0.0;

            return SystemMetricsResponse.DiskInfo.builder()
                    .total(totalSpace)
                    .free(freeSpace)
                    .used(usedSpace)
                    .usagePercent(usagePercent)
                    .build();

        } catch (Exception e) {
            log.warn("디스크 정보 조회 실패", e);
            return SystemMetricsResponse.DiskInfo.builder()
                    .total(0L)
                    .free(0L)
                    .used(0L)
                    .usagePercent(0.0)
                    .build();
        }
    }

    /**
     * JVM 정보 조회
     */
    private SystemMetricsResponse.JvmInfo getJvmInfo() {
        try {
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long maxMemory = runtime.maxMemory();
            long usedMemory = totalMemory - freeMemory;
            int activeThreads = threadBean.getThreadCount();

            return SystemMetricsResponse.JvmInfo.builder()
                    .totalMemory(totalMemory)
                    .freeMemory(freeMemory)
                    .maxMemory(maxMemory)
                    .usedMemory(usedMemory)
                    .activeThreads(activeThreads)
                    .build();

        } catch (Exception e) {
            log.warn("JVM 정보 조회 실패", e);
            return SystemMetricsResponse.JvmInfo.builder()
                    .totalMemory(0L)
                    .freeMemory(0L)
                    .maxMemory(0L)
                    .usedMemory(0L)
                    .activeThreads(0)
                    .build();
        }
    }

    /**
     * 시스템 정보 조회
     */
    private SystemMetricsResponse.SystemInfo getSystemInfo() {
        try {
            String osName = System.getProperty("os.name");
            String osVersion = System.getProperty("os.version");
            String osArch = System.getProperty("os.arch");
            int availableProcessors = osBean.getAvailableProcessors();
            long uptime = runtimeBean.getUptime();

            return SystemMetricsResponse.SystemInfo.builder()
                    .osName(osName)
                    .osVersion(osVersion)
                    .osArch(osArch)
                    .availableProcessors(availableProcessors)
                    .uptime(uptime)
                    .build();

        } catch (Exception e) {
            log.warn("시스템 정보 조회 실패", e);
            return SystemMetricsResponse.SystemInfo.builder()
                    .osName("Unknown")
                    .osVersion("Unknown")
                    .osArch("Unknown")
                    .availableProcessors(0)
                    .uptime(0L)
                    .build();
        }
    }

    /**
     * 데이터베이스 정보 조회
     */
    private SystemMetricsResponse.DatabaseInfo getDatabaseInfo() {
        long startTime = System.currentTimeMillis();

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();

            // 데이터베이스 타입 및 버전 조회
            String databaseType = metaData.getDatabaseProductName();
            String databaseVersion = metaData.getDatabaseProductVersion();

            // 연결 상태 확인 및 응답 시간 측정
            long queryStartTime = System.currentTimeMillis();
            boolean isConnected = connection.isValid(5); // 5초 타임아웃
            long responseTime = System.currentTimeMillis() - queryStartTime;

            // MySQL의 경우 활성 연결 수 및 최대 연결 수 조회
            Integer activeConnections = null;
            Integer maxConnections = null;

            if (databaseType.toLowerCase().contains("mysql")) {
                try (ResultSet rs = connection.createStatement().executeQuery(
                        "SHOW STATUS LIKE 'Threads_connected'")) {
                    if (rs.next()) {
                        activeConnections = rs.getInt("Value");
                    }
                } catch (Exception e) {
                    log.debug("활성 연결 수 조회 실패", e);
                }

                try (ResultSet rs = connection.createStatement().executeQuery(
                        "SHOW VARIABLES LIKE 'max_connections'")) {
                    if (rs.next()) {
                        maxConnections = rs.getInt("Value");
                    }
                } catch (Exception e) {
                    log.debug("최대 연결 수 조회 실패", e);
                }
            }

            return SystemMetricsResponse.DatabaseInfo.builder()
                    .isConnected(isConnected)
                    .activeConnections(activeConnections)
                    .maxConnections(maxConnections)
                    .databaseType(databaseType)
                    .databaseVersion(databaseVersion)
                    .responseTime(responseTime)
                    .build();

        } catch (Exception e) {
            log.warn("데이터베이스 정보 조회 실패", e);
            long responseTime = System.currentTimeMillis() - startTime;

            return SystemMetricsResponse.DatabaseInfo.builder()
                    .isConnected(false)
                    .activeConnections(0)
                    .maxConnections(0)
                    .databaseType("Unknown")
                    .databaseVersion("Unknown")
                    .responseTime(responseTime)
                    .build();
        }
    }
}
