package com.wenect.donation_paltform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Argon2id 사용
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    /*
     * @Bean
     * public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
     * http
     * .csrf(csrf -> csrf.disable())
     * .authorizeHttpRequests(auth -> auth
     * .requestMatchers("/api/auth/**").permitAll()
     * .anyRequest().authenticated()
     * );
     * 
     * return http.build();
     * }
     */

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll() // ← /api/auth/login도 포함됨
                        .anyRequest().authenticated());

        return http.build();
    }
}