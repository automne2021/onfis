package com.onfis.announcement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.context.annotation.Bean; 
import org.springframework.web.context.request.RequestContextListener;

// @EntiyScan: Thực chất DTO không phải là Entity (chúng không tương tác trực tiếp với Database),
// nên việc đưa DTO vào @EntityScan là không cần thiết và đôi khi có thể gây cảnh báo lỗi. Chỉ nên
// scan các thư mục chứa file được đánh dấu @Entity thôi

@SpringBootApplication(scanBasePackages = {"com.onfis.announcement", "com.onfis.shared"})
@EntityScan(basePackages = {"com.onfis.announcement.entity", "com.onfis.shared.entity"})
@EnableJpaAuditing
@EnableFeignClients
public class AnnouncementServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(AnnouncementServiceApplication.class, args);
  }

  @Bean
  public RequestContextListener requestContextListener() {
    return new RequestContextListener();
  }
}