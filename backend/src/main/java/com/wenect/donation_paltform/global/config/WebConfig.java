package com.wenect.donation_paltform.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.util.UrlPathHelper;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        // URL 디코딩 설정 - 한글 파일명 지원
        UrlPathHelper urlPathHelper = new UrlPathHelper();
        urlPathHelper.setUrlDecode(true);
        configurer.setUrlPathHelper(urlPathHelper);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 업로드 파일 정적 리소스 서빙
        // /uploads/** 경로로 요청 시 실제 파일 시스템의 uploads 디렉토리에서 파일 제공
        // toUri()를 사용하여 Windows/Linux 모두 호환되는 file:/// 형식으로 변환
        String resourceLocation = Paths.get(uploadDir).toAbsolutePath().toUri().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
