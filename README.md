# Peperoncino Pasta Lab - Sora Lella AI CRM

## Project Overview
- **Name**: Peperoncino Pasta Lab
- **AI**: Sora Lella - Asistente IA personal para Mirko Montani
- **Version**: 2.0.0
- **Goal**: CRM inteligente con IA conversacional, generación de imágenes, material publicitario y análisis de documentos

## URLs
- **Production**: https://peperoncino-pasta-lab.pages.dev
- **GitHub**: https://github.com/Samuelwoody/Peperoncino-
- **Sandbox**: https://3000-iagd6r0752r1kkif5nj42-cbeee0f9.sandbox.novita.ai

## Features Implementadas (v2.0)

### Chat IA Multi-Modelo
- **DeepSeek** (`deepseek-chat`): Conversaciones simples, clasificación automática
- **GPT-4o**: Tareas complejas, análisis visual (Vision), generación de material publicitario
- **GPT-4o-mini**: Análisis de documentos, optimización de prompts
- **DALL-E 3**: Generación de imágenes profesionales estilo trattoria italiana
- Routing inteligente: la IA elige automáticamente el modelo según la complejidad

### Upload de Imágenes y Documentos
- Botón de clip (📎) para adjuntar archivos
- Drag & drop directamente en el chat
- Soporte: imágenes (JPG, PNG, GIF), documentos (PDF, TXT, CSV, DOC)
- Preview de adjuntos antes de enviar
- Límite: 10MB por archivo

### Análisis Visual (Vision API)
- GPT-4o analiza fotos de platos, productos, etiquetas
- Extrae datos de facturas, recibos, tickets
- Compara con competencia
- Sugiere mejoras de presentación

### Generación de Imágenes
- DALL-E 3 con prompts optimizados para estilo trattoria italiana
- Paleta Peperoncino (terracota, verde oliva, crema, rojo profundo)
- Descarga directa de imágenes generadas

### Material Publicitario
- **Menús** personalizados para restaurantes (HTML, estilo trattoria)
- **Tarjetas de plato estrella** para insertar en cartas
- **Posts para Instagram/Facebook** con hashtags
- **Flyers** para WhatsApp y para imprimir
- **Etiquetas de producto** con branding
- **Banners** para ferias y eventos
- **Tarjetas de presentación** del negocio
- **Infografías** y **Catálogos** de precios
- Vista previa y descarga HTML

### Galería de Material
- Tab "Media" en el sidebar
- Filtros por tipo: Menús, Tarjetas plato, Flyers, Posts redes, Imágenes
- Vista previa, descarga y eliminación
- Historial de todo el material generado

### CRM Completo
- **Dashboard**: Resumen de productos, clientes, pedidos, ingresos, ofertas
- **Productos**: 8 productos pre-cargados con costos, precios, márgenes
- **Recetas**: Documentación de recetas con ingredientes, instrucciones, tips
- **Clientes**: 3 clientes de ejemplo (restaurante, particular, hotel)
- **Pedidos**: Tracking de pedidos con estados
- **Ofertas**: Gestión de promociones con fechas y públicos
- **Ingredientes**: 12 ingredientes con stock y proveedores
- **Notas**: Sistema de notas con categorías y prioridades
- **Actividad**: Log automático de todas las acciones

### Acciones CRM Automáticas
Sora Lella detecta automáticamente cuando Mirko menciona:
- Nuevo producto/cliente/receta/oferta/pedido → Lo crea en el CRM
- Actualización de precios → Registra estudio de precios
- Notas e ideas → Las guarda clasificadas

## Data Architecture
- **Database**: Cloudflare D1 (SQLite distribuido)
- **Tables**: 16 (categories, products, ingredients, recipes, recipe_ingredients, clients, orders, order_items, offers, offer_products, pricing_studies, conversations, messages, activity_log, notes, media_gallery)
- **Secrets**: DEEPSEEK_API_KEY, OPENAI_API_KEY, OPENAI_BASE_URL

## Tech Stack
- **Backend**: Hono (TypeScript) + Cloudflare Workers
- **Frontend**: Tailwind CSS + Vanilla JS + marked.js
- **AI**: DeepSeek API + OpenAI API (multi-model)
- **Database**: Cloudflare D1
- **Fonts**: Playfair Display, Inter, Crimson Text
- **Deploy**: Cloudflare Pages

## API Endpoints

### Chat
- `GET /api/chat/conversations` — Lista conversaciones
- `POST /api/chat/conversations` — Crear conversación
- `GET /api/chat/conversations/:id/messages` — Mensajes de conversación
- `POST /api/chat/send` — Enviar mensaje (con attachments opcionales)
- `DELETE /api/chat/conversations/:id` — Eliminar conversación
- `GET /api/chat/gallery` — Galería de material generado
- `GET /api/chat/gallery/:id` — Detalle de item
- `DELETE /api/chat/gallery/:id` — Eliminar item

### CRM
- `GET /api/crm/dashboard` — Dashboard resumen
- `GET/POST /api/crm/products` — Productos
- `GET/POST /api/crm/recipes` — Recetas
- `GET/POST /api/crm/clients` — Clientes
- `GET/POST /api/crm/orders` — Pedidos
- `GET/POST /api/crm/offers` — Ofertas
- `GET/POST /api/crm/ingredients` — Ingredientes
- `GET/POST /api/crm/notes` — Notas

### General
- `GET /api/health` — Health check
- `GET /api/settings` — Estado de configuración IA
- `POST /api/test-ai` — Test conexiones IA
- `GET /api/search?q=` — Búsqueda global

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active
- **Version**: 2.0.0
- **Last Updated**: 2026-03-19

## Nota sobre Real-Time
Cloudflare Workers no soporta WebSocket servers persistentes. La Realtime API de OpenAI requiere WebSocket bidireccional con audio streaming, lo cual no es factible en serverless. En su lugar, se implementaron indicadores de estado en tiempo real y respuestas completas optimizadas para velocidad.

## Próximos Pasos Posibles
- Streaming de respuestas con Server-Sent Events
- Edición de imágenes con DALL-E 3 (variaciones, inpainting)
- Template gallery con diseños predeterminados
- WhatsApp integration para enviar material directo
- Exportación a PDF desde el material HTML
- Notificaciones de stock bajo
- Reportes automáticos semanales/mensuales
