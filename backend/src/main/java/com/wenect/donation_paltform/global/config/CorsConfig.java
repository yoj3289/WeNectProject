package com.wenect.donation_paltform.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:5173",           // 로컬 개발
                    "http://140.245.64.178",           // VM HTTP
                    "https://wenect.duckdns.org"       // 프로덕션 HTTPS
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);

        // WebSocket CORS
        registry.addMapping("/ws/**")
                .allowedOrigins(
                    "http://localhost:5173",
                    "http://140.245.64.178",
                    "https://wenect.duckdns.org"
                )
                .allowedMethods("GET", "POST")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}