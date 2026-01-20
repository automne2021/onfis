package com.onfis.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * User Service Application
 */
@SpringBootApplication(scanBasePackages = {"com.onfis.user", "com.onfis.shared"})
@EntityScan(basePackages = {"com.onfis.user.entity", "com.onfis.shared.dto"})
@EnableJpaAuditing
public class UserServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
