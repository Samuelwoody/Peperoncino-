# Peperoncino Pasta Lab - Sora Lella AI CRM

## Descripcion General
- **Nombre**: Peperoncino Pasta Lab
- **Ubicacion**: Traslasierra, Cordoba, Argentina
- **Fundador**: Mirko Montani
- **IA Asistente**: Sora Lella - Secretaria, asistenta, consejera, socia y psicologa motivadora

## Caracteristicas Implementadas

### Chat IA - Sora Lella
- Interfaz tipo ChatGPT con personalidad italiana/argentina
- Clasificacion automatica de complejidad (DeepSeek/OpenAI routing)
- Deteccion automatica de acciones CRM desde la conversacion
- Soporte markdown para respuestas ricas
- Historial de conversaciones persistente
- Quick-actions predefinidas

### CRM Completo
- **Dashboard**: Metricas clave del negocio en tiempo real
- **Productos**: Catalogo con categorias, costos, precios y margenes
- **Recetas**: Documentacion completa con ingredientes, instrucciones y costos
- **Clientes**: Fichas de particulares, restaurantes y hoteles
- **Pedidos**: Seguimiento de pedidos con estados
- **Ofertas**: Creacion y gestion de promociones
- **Ingredientes**: Inventario con proveedores y stock
- **Notas**: Sistema de notas rapidas con prioridades
- **Estudio de Precios**: Analisis de pricing y margenes
- **Log de Actividad**: Registro automatico de todas las acciones

### Integracion IA-CRM
- Sora Lella detecta automaticamente cuando Mirko menciona:
  - Un nuevo producto -> lo crea en el CRM
  - Un nuevo cliente -> lo registra
  - Una idea de oferta -> la documenta
  - Una receta -> la guarda con ingredientes
  - Un pedido -> lo registra
  - Notas e ideas -> las archiva

## URLs

### Desarrollo (Sandbox)
- **App**: https://3000-iagd6r0752r1kkif5nj42-cbeee0f9.sandbox.novita.ai
- **Health**: /api/health
- **Settings**: /api/settings

### API Endpoints
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/health | Estado del servicio |
| GET | /api/settings | Config de IA |
| POST | /api/test-ai | Test conexion IA |
| GET | /api/search?q= | Busqueda global |
| GET | /api/chat/conversations | Listar conversaciones |
| POST | /api/chat/conversations | Nueva conversacion |
| DELETE | /api/chat/conversations/:id | Eliminar conversacion |
| GET | /api/chat/conversations/:id/messages | Mensajes de conversacion |
| POST | /api/chat/send | Enviar mensaje a Sora Lella |
| GET | /api/crm/dashboard | Metricas del dashboard |
| GET/POST | /api/crm/products | CRUD Productos |
| GET/POST | /api/crm/recipes | CRUD Recetas |
| GET/POST | /api/crm/clients | CRUD Clientes |
| GET/POST | /api/crm/orders | CRUD Pedidos |
| GET/POST | /api/crm/offers | CRUD Ofertas |
| GET/POST | /api/crm/ingredients | CRUD Ingredientes |
| GET/POST | /api/crm/notes | CRUD Notas |
| GET/POST | /api/crm/pricing | Estudios de precios |
| GET | /api/crm/activity | Log de actividad |

## Arquitectura de Datos

### Base de Datos: Cloudflare D1 (SQLite)
- **categories**: Categorias de productos
- **products**: Catalogo de productos con costos y precios
- **ingredients**: Ingredientes con stock y proveedores
- **recipes**: Recetas con instrucciones detalladas
- **recipe_ingredients**: Ingredientes por receta
- **clients**: Base de clientes (particulares, restaurantes, hoteles)
- **orders**: Pedidos con estados
- **order_items**: Items de cada pedido
- **offers**: Ofertas y promociones
- **offer_products**: Productos en ofertas
- **pricing_studies**: Analisis de precios
- **conversations**: Conversaciones con Sora Lella
- **messages**: Mensajes individuales
- **activity_log**: Registro de actividad
- **notes**: Notas rapidas

### Modelos IA
- **gpt-5-nano**: Clasificacion de mensajes y conversaciones simples
- **gpt-5-mini**: Tareas complejas (analisis, estrategia, marketing)

## Guia de Uso

### Chat con Sora Lella
1. Click en "Nueva conversacion" o usa las quick-actions
2. Escribi naturalmente - Sora Lella entiende contexto
3. Si mencionas productos, clientes, etc. ella los registra automaticamente
4. Podes pedir analisis de precios, ideas de marketing, motivacion, etc.

### Gestion CRM
1. Click en "CRM" en el sidebar
2. Navega entre las secciones (Dashboard, Productos, Recetas, etc.)
3. Usa los botones "Nuevo" para crear registros
4. Todo se sincroniza con el chat de Sora Lella

## Despliegue

### Plataforma: Cloudflare Pages
- **Estado**: Activo (desarrollo local)
- **Tech Stack**: Hono + TypeScript + TailwindCSS CDN + D1
- **Ultima Actualizacion**: 2026-03-19

### Variables de Entorno Necesarias
```
OPENAI_API_KEY=tu-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Comandos
```bash
npm run build          # Compilar
npm run dev:sandbox    # Servidor local con D1
npm run db:migrate:local  # Aplicar migraciones
npm run db:seed        # Cargar datos de prueba
npm run db:reset       # Resetear DB completa
npm run deploy         # Desplegar a Cloudflare
```

## Funcionalidades Pendientes
- [ ] Autenticacion/login para Mirko
- [ ] Generacion de imagenes para marketing
- [ ] Exportacion de informes PDF
- [ ] Integracion con WhatsApp Business
- [ ] Sistema de recordatorios automaticos
- [ ] Calculo automatico de costos en recetas
- [ ] Graficos historicos de ventas
- [ ] Backup automatico de datos

## Proximos Pasos Recomendados
1. Configurar API key valida para OpenAI/DeepSeek
2. Desplegar a produccion en Cloudflare Pages
3. Agregar autenticacion basica
4. Configurar dominio personalizado
5. Empezar a cargar datos reales del negocio
