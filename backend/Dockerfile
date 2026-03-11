# syntax=docker/dockerfile:1
ARG JAVA_VERSION=25

# Estágio de compilação
FROM eclipse-temurin:$JAVA_VERSION-jdk-alpine AS builder
WORKDIR /build

# Copia os arquivos do gradle
COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle .
COPY settings.gradle .

# Baixa dependências antes de copiar o código fonte (camada cacheável)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon

# Copia o código fonte da aplicação
COPY src/ src/

# Compila a aplicação e pula testes
RUN ./gradlew clean build -x test -x testClasses --no-daemon

# Estágio de execução
FROM eclipse-temurin:$JAVA_VERSION-jre-alpine
WORKDIR /app

# Copia o jar compilado do estágio de compilação
COPY --from=builder /build/build/libs/*.jar app.jar

# Cria um usuário e grupo não-root para executar a aplicação com menor privilégio
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Expõe a porta padrão do Spring Boot
EXPOSE 8080

# Inicia a aplicação
ENTRYPOINT ["java", "--enable-native-access=ALL-UNNAMED", "-jar", "app.jar"]