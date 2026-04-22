FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy all POMs first for dependency caching
COPY pom.xml ./pom.xml
COPY shared-library/pom.xml ./shared-library/pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY services/user-service/pom.xml ./services/user-service/pom.xml
COPY services/project-service/pom.xml ./services/project-service/pom.xml
COPY services/position-service/pom.xml ./services/position-service/pom.xml
COPY services/admin-service/pom.xml ./services/admin-service/pom.xml
COPY services/chat-service/pom.xml ./services/chat-service/pom.xml
COPY services/announcement-service/pom.xml ./services/announcement-service/pom.xml

# Create stub src dirs so Maven can resolve the reactor without actual sources
RUN for d in shared-library api-gateway services/user-service services/project-service services/position-service services/admin-service services/chat-service services/announcement-service; do mkdir -p $d/src/main/java; done

# Download dependencies (cached as long as POMs don't change)
RUN mvn -pl services/announcement-service -am dependency:resolve -q 2>/dev/null || true

# Now copy only the source code we actually need
COPY shared-library ./shared-library
COPY services/announcement-service ./services/announcement-service

# Build
RUN mvn -pl services/announcement-service -am clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/services/announcement-service/target/*.jar app.jar
EXPOSE 8086
ENTRYPOINT ["java", "-jar", "app.jar"]
