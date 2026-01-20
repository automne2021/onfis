package com.onfis.admin;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {"com.onfis.admin", "com.onfis.shared"})
@EntityScan(basePackages = {"com.onfis.admin.entity", "com.onfis.shared.dto"})
@EnableJpaAuditing
public class AdminServiceApplication {
    public static void main(String[] args) { SpringApplication.run(AdminServiceApplication.class, args); }
}
