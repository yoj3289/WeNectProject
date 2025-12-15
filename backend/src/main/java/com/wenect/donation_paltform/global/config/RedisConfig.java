package com.wenect.donation_paltform.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis 캐싱 설정
 * 성능 향상을 위한 캐시 레이어 구성
 */
@Configuration
@EnableCaching
public class RedisConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    /**
     * Redis 연결 팩토리
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        if (redisPassword != null && !redisPassword.isEmpty()) {
            config.setPassword(redisPassword);
        }
        return new LettuceConnectionFactory(config);
    }

    /**
     * RedisTemplate - 범용 Redis 작업용
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    /**
     * 캐시 매니저 - 다양한 TTL을 가진 캐시 설정
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // 기본 캐시 설정 (1시간)
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        // 캐시별 개별 TTL 설정
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // 프로젝트 목록 캐시 (5분)
        cacheConfigurations.put("projectList", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // 프로젝트 상세 캐시 (10분)
        cacheConfigurations.put("projectDetail", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // 통계 캐시 (30분)
        cacheConfigurations.put("statistics", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // 대시보드 통계 캐시 (15분)
        cacheConfigurations.put("dashboardStats", defaultConfig.entryTtl(Duration.ofMinutes(15)));

        // 카테고리 목록 캐시 (1시간)
        cacheConfigurations.put("categories", defaultConfig.entryTtl(Duration.ofHours(1)));

        // 사용자 프로필 캐시 (30분)
        cacheConfigurations.put("userProfile", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // 기관 정보 캐시 (30분)
        cacheConfigurations.put("organizationInfo", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}
