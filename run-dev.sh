#!/usr/bin/env bash
set -e

# ─── Config (chỉnh ở đây nếu cần) ─────────────────────────────────────────────
DB_CONTAINER="cinema-postgres-dev"
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="cinema_db"
DB_USER="cinema_user"
DB_PASS="cinema_password"
REDIS_HOST="localhost"
REDIS_PORT="6379"
SERVER_PORT="8081"
OPENAI_API_KEY="${OPENAI_API_KEY:-DUMMY}"

# Mail — đọc từ env nếu đã set, ngược lại hỏi người dùng
if [ -z "$MAIL_USERNAME" ]; then
  printf "Gmail address (MAIL_USERNAME): "
  read -r MAIL_USERNAME
fi
if [ -z "$MAIL_PASSWORD" ]; then
  printf "App password  (MAIL_PASSWORD): "
  read -rs MAIL_PASSWORD
  echo
fi
# ───────────────────────────────────────────────────────────────────────────────

echo ""
echo "▶ Kiểm tra Docker containers..."
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "  Container '${DB_CONTAINER}' chưa chạy — khởi động docker compose..."
  docker compose -f docker-compose-dev.yml up -d
  echo "  Chờ Postgres sẵn sàng..."
  sleep 3
else
  echo "  ✔ ${DB_CONTAINER} đang chạy"
fi

echo ""
echo "▶ Đảm bảo role '${DB_USER}' và database '${DB_NAME}' tồn tại..."

# Superuser trong container là chính DB_USER (POSTGRES_USER trong docker-compose)
PSQL="docker exec ${DB_CONTAINER} psql -U ${DB_USER}"

${PSQL} -tc \
  "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  ${PSQL} -c \
  "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}; GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" || true

echo "  ✔ DB sẵn sàng"

echo ""
echo "▶ Khởi động Spring Boot (port ${SERVER_PORT})..."
echo ""

export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}"
export SPRING_DATASOURCE_USERNAME="${DB_USER}"
export SPRING_DATASOURCE_PASSWORD="${DB_PASS}"
export REDIS_HOST="${REDIS_HOST}"
export REDIS_PORT="${REDIS_PORT}"
export SERVER_PORT="${SERVER_PORT}"
export MAIL_USERNAME="${MAIL_USERNAME}"
export MAIL_PASSWORD="${MAIL_PASSWORD}"
export OPENAI_API_KEY="${OPENAI_API_KEY}"

./gradlew --no-daemon bootRun
