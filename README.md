# Peperoncino Pasta Lab - Sora Lella AI CRM

## Project Overview
- **Name**: Peperoncino Pasta Lab
- **AI**: Sora Lella - Asistente IA personal para Mirko Montani
- **Version**: 3.0.0
- **Goal**: CRM inteligente con IA conversacional, generacion de imagenes, material publicitario, analisis de documentos y **conversacion por voz con Whisper + TTS**

## URLs
- **Production**: https://peperoncino-pasta-lab.pages.dev
- **GitHub**: https://github.com/Samuelwoody/Peperoncino-
- **Sandbox**: https://3000-iagd6r0752r1kkif5nj42-cbeee0f9.sandbox.novita.ai

## Features Implementadas (v3.0)

### NUEVO: Conversacion por Voz (Whisper + TTS)
- **Boton de microfono** en el chat para grabar mensajes de voz
- **OpenAI Whisper** (whisper-1): transcripcion de audio a texto en espanol
- **OpenAI TTS** (tts-1, voz Nova): respuesta de Sora Lella en audio
- **Flujo completo**: Grabar -> Whisper transcribe -> Sora Lella responde -> TTS genera audio
- **Boton "Escuchar"** en cada mensaje de Sora Lella (TTS on-demand)
- **Barra de grabacion** con timer, cancelar, enviar
- **Formatos soportados**: WebM, OGG, MP4, MP3, WAV, M4A
- **Prompt optimizado**: Whisper usa contexto de negocio (Peperoncino, ravioles, sorrentinos, etc.)
- **Limpieza automatica**: TTS remueve markdown, code blocks, CRM actions del texto

### Chat IA Multi-Modelo
- **DeepSeek** (`deepseek-chat`): Conversaciones simples, clasificacion automatica
- **GPT-4o**: Tareas complejas, analisis visual (Vision), generacion de material publicitario
- **GPT-4o-mini**: Analisis de documentos, optimizacion de prompts
- **DALL-E 3**: Generacion de imagenes profesionales estilo trattoria italiana
- **Whisper-1**: Transcripcion de audio (speech-to-text)
- **TTS-1**: Sintesis de voz (text-to-speech, voz Nova)
- Routing inteligente: la IA elige automaticamente el modelo segun la complejidad

### Upload de Imagenes y Documentos
- Boton de clip para adjuntar archivos
- Drag & drop directamente en el chat
- Soporte: imagenes (JPG, PNG, GIF), documentos (PDF, TXT, CSV, DOC)
- Preview de adjuntos antes de enviar
- Limite: 10MB por archivo

### Analisis Visual (Vision API)
- GPT-4o analiza fotos de platos, productos, etiquetas
- Extrae datos de facturas, recibos, tickets
- Compara con competencia
- Sugiere mejoras de presentacion

### Generacion de Imagenes
- DALL-E 3 con prompts optimizados para estilo trattoria italiana
- Paleta Peperoncino (terracota, verde oliva, crema, rojo profundo)
- Descarga directa de imagenes generadas

### Material Publicitario
- **Menus** personalizados para restaurantes (HTML, estilo trattoria)
- **Tarjetas de plato estrella** para insertar en cartas
- **Posts para Instagram/Facebook** con hashtags
- **Flyers** para WhatsApp y para imprimir
- **Etiquetas de producto** con branding
- **Banners** para ferias y eventos
- **Tarjetas de presentacion** del negocio
- **Infografias** y **Catalogos** de precios
- Vista previa y descarga HTML

### Galeria de Material
- Tab "Media" en el sidebar
- Filtros por tipo: Menus, Tarjetas plato, Flyers, Posts redes, Imagenes
- Vista previa, descarga y eliminacion
- Historial de todo el material generado

### CRM Completo
- **Dashboard**: Resumen de productos, clientes, pedidos, ingresos, ofertas
- **Productos**: 8 productos pre-cargados con costos, precios, margenes
- **Recetas**: Documentacion de recetas con ingredientes, instrucciones, tips
- **Clientes**: 3 clientes de ejemplo (restaurante, particular, hotel)
- **Pedidos**: Tracking de pedidos con estados
- **Ofertas**: Gestion de promociones con fechas y publicos
- **Ingredientes**: 12 ingredientes con stock y proveedores
- **Notas**: Sistema de notas con categorias y prioridades
- **Actividad**: Log automatico de todas las acciones

### Acciones CRM Automaticas
Sora Lella detecta automaticamente cuando Mirko menciona:
- Nuevo producto/cliente/receta/oferta/pedido -> Lo crea en el CRM
- Actualizacion de precios -> Registra estudio de precios
- Notas e ideas -> Las guarda clasificadas

## Data Architecture
- **Database**: Cloudflare D1 (SQLite distribuido)
- **Tables**: 16 (categories, products, ingredients, recipes, recipe_ingredients, clients, orders, order_items, offers, offer_products, pricing_studies, conversations, messages, activity_log, notes, media_gallery)
- **Secrets**: DEEPSEEK_API_KEY, OPENAI_API_KEY, OPENAI_BASE_URL

## Tech Stack
- **Backend**: Hono (TypeScript) + Cloudflare Workers
- **Frontend**: Tailwind CSS + Vanilla JS + marked.js
- **AI**: DeepSeek API + OpenAI API (multi-model: GPT-4o, DALL-E 3, Whisper, TTS)
- **Database**: Cloudflare D1
- **Fonts**: Playfair Display, Inter, Crimson Text
- **Deploy**: Cloudflare Pages

## API Endpoints

### Chat
- `GET /api/chat/conversations` — Lista conversaciones
- `POST /api/chat/conversations` — Crear conversacion
- `GET /api/chat/conversations/:id/messages` — Mensajes de conversacion
- `POST /api/chat/send` — Enviar mensaje (con attachments opcionales)
- `POST /api/chat/voice` — **NUEVO** Enviar mensaje de voz (audio base64 -> Whisper -> AI -> TTS)
- `POST /api/chat/tts` — **NUEVO** Convertir texto a audio (TTS on-demand)
- `DELETE /api/chat/conversations/:id` — Eliminar conversacion
- `GET /api/chat/gallery` — Galeria de material generado
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
- `GET /api/settings` — Estado de configuracion IA
- `POST /api/test-ai` — Test conexiones IA
- `GET /api/search?q=` — Busqueda global

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: Active
- **Version**: 3.0.0
- **Last Updated**: 2026-03-19

## Nota sobre Audio
OpenAI Whisper (speech-to-text) y TTS (text-to-speech) funcionan perfectamente en Cloudflare Workers via API REST. El flujo es:
1. Frontend graba audio con MediaRecorder API
2. Audio se envia como base64 al endpoint `/api/chat/voice`
3. Worker envia audio a Whisper API -> recibe texto transcrito
4. Texto se procesa con Sora Lella (DeepSeek/GPT-4o segun complejidad)
5. Respuesta de texto se envia a TTS API -> recibe audio MP3
6. Frontend muestra transcripcion + texto + reproductor de audio

## Proximos Pasos Posibles
- Streaming de respuestas con Server-Sent Events
- Edicion de imagenes con DALL-E 3 (variaciones, inpainting)
- Template gallery con disenos predeterminados
- WhatsApp integration para enviar material directo
- Exportacion a PDF desde el material HTML
- Notificaciones de stock bajo
- Reportes automaticos semanales/mensuales
