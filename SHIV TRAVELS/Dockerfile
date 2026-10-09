# =====================================================================
# SHIV TRAVELS - Production Dockerfile for Cloud Deployment
# =====================================================================
# Multi-stage build for lightweight, high-performance cloud container
# Supported Platforms: Render.com, Railway, AWS ECS, DigitalOcean, GCP
# =====================================================================

FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy source code and libraries
COPY src/ ./src/
COPY lib/ ./lib/

# Compile Java sources
RUN mkdir -p bin && \
    javac -encoding UTF-8 -cp "lib/*" -d bin $(find src -name "*.java")

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy compiled classes, libraries, assets, and web interface
COPY --from=builder /app/bin ./bin
COPY lib/ ./lib/
COPY web/ ./web/
COPY assets/ ./assets/
COPY db.properties ./db.properties

# Expose default HTTP port
EXPOSE 8181

# Environment variables
ENV PORT=8181
ENV JAVA_OPTS="-Xms128m -Xmx512m"

# Launch SHIV TRAVELS platform
CMD ["sh", "-c", "java $JAVA_OPTS -cp 'bin:lib/*' com.travelbooking.Main $PORT"]
