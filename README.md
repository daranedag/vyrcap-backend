# VYRCAP Backend

Backend API para VYRCAP OTEC con Node.js + Express + TypeScript, usando Insforge para DB/Auth y Mercado Pago para pagos.

## Stack

- Node.js + Express
- TypeScript estricto
- pnpm (obligatorio)
- Insforge SDK (`@insforge/sdk`)
- Zod para validacion

## Estructura

```text
/
  api/index.ts
  src/
    app.ts
    server.ts
    config/
    lib/
    middleware/
    utils/
    modules/
  test/
```

## Instalacion

```bash
pnpm install
```

## Desarrollo local

```bash
cp .env.example .env
pnpm dev
```

Otros comandos:

```bash
pnpm build
pnpm start
pnpm test
pnpm lint
```

## Variables de entorno

Revisar `.env.example`.

- `NODE_ENV`
- `PORT`
- `CORS_ORIGIN`
- `INSFORGE_URL`
- `INSFORGE_ANON_KEY`
- `INSFORGE_SERVICE_KEY`
- `PUBLIC_SITE_URL`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET` (opcional si usas firma)
- `MERCADO_PAGO_WEBHOOK_URL`
- `MOODLE_BASE_URL` (opcional)
- `MOODLE_TOKEN` (opcional)
- `MOODLE_SERVICE` (opcional)

## Endpoints principales

- `GET /health`
- `GET /api/content/site`
- `GET /api/content/blocks`
- `GET /api/courses`
- `GET /api/courses/:slug`
- `GET /api/testimonials`
- `POST /api/contact`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me/profile`
- `PUT /api/me/profile`
- `GET /api/me/enrollments`
- `GET /api/me/payment-orders`
- `POST /api/payments/mercadopago/create-preference`
- `GET /api/payments/mercadopago/webhook`
- `POST /api/payments/mercadopago/webhook`

## Deploy en Render

- Runtime: Node
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`
- Health check path: `/health`

## Deploy en Vercel

El backend exporta el app Express en `api/index.ts` para uso serverless.

- Build Command: `pnpm install && pnpm build`
- Variables: mismas del `.env.example`

Webhook Mercado Pago en produccion:

`https://<tu-dominio>/api/payments/mercadopago/webhook`

## Conexion con frontend

En el frontend React/Vite:

```env
VITE_PAYMENT_API_BASE=https://<dominio-backend>
```

El frontend llama:

`POST ${VITE_PAYMENT_API_BASE}/api/payments/mercadopago/create-preference`
