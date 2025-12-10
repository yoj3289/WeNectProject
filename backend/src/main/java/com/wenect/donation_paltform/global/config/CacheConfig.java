package com.wenect.donation_paltform.global.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine 캐시 설정
 * [성능 개선] 자주 조회되는 데이터를 메모리에 캐싱하여 DB 부하 감소
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(500)           // 최대 500개 항목 캐싱
                .expireAfterWrite(5, TimeUnit.MINUTES)  // 5분 후 만료
                .recordStats());            // 캐시 통계 기록
        return cacheManager;
    }
}
