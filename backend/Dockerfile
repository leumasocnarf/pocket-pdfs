# syntax=docker/dockerfile:1
ARG JAVA_VERSION=25

# Build stage
FROM eclipse-temurin:$JAVA_VERSION-jdk-alpine AS builder
WORKDIR /build

# Copy gradle files
COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle .
COPY settings.gradle .

# Download dependencies before copying source code (cacheable layer)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon

# Copy application source code
COPY src/ src/

# Compile the application and skip tests
RUN ./gradlew clean build -x test -x testClasses --no-daemon

# Run stage
FROM eclipse-temurin:$JAVA_VERSION-jre-alpine
WORKDIR /app

# Copy the compiled jar from the build stage
COPY --from=builder /build/build/libs/*.jar app.jar

# Install wget before switching to non-root user
RUN apk add --no-cache wget

# Create a non-root user and group to run the application with least privilege
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Expose the default Spring Boot port
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]