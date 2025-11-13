package com.wenect.donation_paltform.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.dir:uploads}")
    private String baseUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 프로젝트 이미지 정적 리소스 제공
        registry.addResourceHandler("/uploads/projects/images/**")
                .addResourceLocations("file:" + baseUploadDir + "/projects/images/");

        // 프로젝트 문서 정적 리소스 제공
        registry.addResourceHandler("/uploads/projects/documents/**")
                .addResourceLocations("file:" + baseUploadDir + "/projects/documents/");

        // 일반 문서 정적 리소스 제공
        registry.addResourceHandler("/uploads/documents/**")
                .addResourceLocations("file:" + baseUploadDir + "/documents/");
    }
}
