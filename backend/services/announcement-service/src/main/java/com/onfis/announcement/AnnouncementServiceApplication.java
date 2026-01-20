package com.onfis.announcement;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication(scanBasePackages = {"com.onfis.announcement", "com.onfis.shared"})
@EntityScan(basePackages = {"com.onfis.announcement.entity", "com.onfis.shared.dto"})
@EnableJpaAuditing
public class AnnouncementServiceApplication {
    public static void main(String[] args) { SpringApplication.run(AnnouncementServiceApplication.class, args); }
}
