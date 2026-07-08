# Omnichannel CRM AI

Este proyecto es un CRM Omnicanal avanzado que integra IA (Gemini/Python) para responder automáticamente a los clientes o brindar sugerencias a los agentes humanos. Soporta WhatsApp, Instagram y Telegram.

## Arquitectura del Sistema
El proyecto consta de tres partes principales:
1. **Frontend**: SPA construida con React y Vite. Utiliza TailwindCSS para el diseño UI/UX (basado en un panel oscuro y moderno).
2. **Backend**: API construida con Laravel 11. Maneja la autenticación mediante Sanctum, eventos en tiempo real con WebSockets (Reverb), gestión de la base de datos (SQLite/MySQL) e integraciones de Webhooks.
3. **Servicio IA (Python)**: Microservicio en Python que se comunica con el modelo Gemini para procesar mensajes. Se conecta a la API de Laravel mediante callbacks autenticados con `X-Internal-Secret`.

### Componentes Clave
- **Webhooks**: `WebhookController.php` recibe los eventos de Meta y Telegram. Cada evento se verifica para confirmar la firma criptográfica antes de su procesamiento.
- **Microservicio AI**: Cuando llega un mensaje, Laravel lo envía mediante HTTP POST al microservicio. La IA evalúa la intención, los sentimientos y decide si responder o enviar a un humano. Luego responde al callback `InternalAiController`.
- **Tiempo Real**: Los agentes reciben los mensajes instantáneamente en la pantalla a través de *Laravel Reverb*. Los eventos viajan por canales privados autenticados, evitando recargas (polling).

## Requisitos
- PHP >= 8.2
- Node.js >= 18
- Composer
- Python 3.10+
- Base de datos (MySQL o SQLite)
- Redis (Opcional, pero recomendado para colas en producción)

## Instrucciones de Instalación Local

1. **Clonar repositorio**:
   ```bash
   git clone <repo-url>
   ```

2. **Backend (Laravel)**:
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   ```
   Asegúrate de iniciar el servidor y WebSockets en terminales separadas:
   ```bash
   php artisan serve
   php artisan reverb:start
   ```

3. **Frontend (React/Vite)**:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
   > **Nota de Seguridad**: El archivo `.env` del frontend contiene las claves de WebSockets, pero **NO** debes incluir claves secretas como `STRIPE_SECRET` allí. Las variables del frontend siempre empiezan con `VITE_`.

4. **Microservicio IA (Python)**:
   ```bash
   cd python_service
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8001
   ```

## Variables de Entorno Clave (`.env`)
- `BROADCAST_CONNECTION=reverb`: Para asegurar que los WebSockets operen.
- `REVERB_APP_*`: Configuración de tu servidor WebSocket.
- `GEMINI_API_KEY`: Clave de tu modelo IA.
- `STRIPE_SECRET` y `TURNSTILE_SECRET_KEY`: Para pagos y anti-spam en el registro.

## Prevención de Fugas de Datos
- Las contraseñas se almacenan mediante Hashes de BCrypt.
- Laravel Sanctum previene los ataques CSRF en las SPA.
- Los Canales Privados aseguran que los *sockets* no transmitan datos entre diferentes compañías.
- El archivo `.env` está registrado en `.gitignore` tanto en el backend como en el frontend para evitar subir llaves sensibles a GitHub.
