package com.wenect.donation_paltform.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 프로젝트 이미지 정적 리소스 제공
        registry.addResourceHandler("/uploads/projects/images/**")
                .addResourceLocations("file:uploads/projects/images/");

        // 프로젝트 문서 정적 리소스 제공
        registry.addResourceHandler("/uploads/projects/documents/**")
                .addResourceLocations("file:uploads/projects/documents/");

        // 일반 문서 정적 리소스 제공
        registry.addResourceHandler("/uploads/documents/**")
                .addResourceLocations("file:uploads/documents/");
    }
}
