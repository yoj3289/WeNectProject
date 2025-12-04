package com.wenect.donation_paltform.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * 비동기 처리 설정
 * 이메일 전송을 별도 스레드에서 처리하기 위한 설정
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * 이메일 전송용 ThreadPoolTaskExecutor 빈 설정
     * - core pool size: 2 (기본 스레드 개수)
     * - max pool size: 5 (최대 스레드 개수)
     * - queue capacity: 100 (대기열 크기)
     */
    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("email-async-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
}
