# Laravel 13 - Production Dockerfile
# Multi-stage build: keeps image small and reproducible
# Same as dev stack (PHP 8.4, same extensions) but runs php-fpm + nginx instead of `artisan serve`

# ---- Stage 1: Build dependencies ----
FROM composer:2.7 AS vendor

WORKDIR /app

# Copy composer files first to leverage Docker cache
COPY backend/composer.json backend/composer.lock ./

# Install dependencies without dev packages, no scripts (we'll run them in next stage)
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --optimize-autoloader

# ---- Stage 2: Production runtime ----
FROM php:8.4-fpm-alpine

# Install system dependencies + nginx + supervisor
RUN apk add --no-cache \
    nginx \
    supervisor \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    mysql-client

# Install PHP extensions (same as dev)
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip opcache

# Install Redis extension (phpredis) - matches REDIS_CLIENT=phpredis in your .env
RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

# Opcache tuned for production
COPY .deploy/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Copy application code
WORKDIR /var/www
COPY backend/ ./

# Copy vendor from build stage
COPY --from=vendor /app/vendor ./vendor

# Generate optimized autoloader + run Laravel optimizations
RUN composer dump-autoload --optimize --no-dev \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan event:cache

# Storage permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Nginx + supervisor config
COPY .deploy/nginx.conf /etc/nginx/nginx.conf
COPY .deploy/supervisord.conf /etc/supervisord.conf

EXPOSE 8000

# Run migrations on start, then start php-fpm + nginx under supervisor
CMD ["sh", "-c", "php artisan migrate --force && /usr/bin/supervisord -c /etc/supervisord.conf"]
