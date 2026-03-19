// AI Integration Layer v3.0 - Sora Lella Multi-Model Engine
// DeepSeek (chat rápido) + OpenAI (gpt-4o, gpt-4o-mini, gpt-4.1, o1, gpt-image-1, dall-e-3)
// Vision, Image Generation, Document Analysis, Marketing Material

import { SORA_LELLA_SYSTEM_PROMPT, SORA_LELLA_CONTEXT_TEMPLATE, TASK_CLASSIFIER_PROMPT, IMAGE_PROMPT_ENGINEER, MARKETING_MATERIAL_PROMPT } from './prompts'

// ========== TYPES ==========

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | any[]
}

interface ClassificationResult {
  complexity: 'simple' | 'complex' | 'vision' | 'image_gen' | 'material_gen' | 'document' | 'reasoning'
  crm_action: boolean
  action_type: string
  suggested_model?: string
}

interface AIResponse {
  content: string
  model: string
  provider: string
  tokens: number
  imageUrl?: string
  imageBase64?: string
  materialType?: string
}

interface Attachment {
  type: string
  data: string
  name: string
}

// ========== PROVIDER CONFIG ==========

function getDeepSeekConfig(env: any) {
  if (!env.DEEPSEEK_API_KEY) return null
  return { apiKey: env.DEEPSEEK_API_KEY, baseUrl: 'https://api.deepseek.com' }
}

function getOpenAIConfig(env: any) {
  if (!env.OPENAI_API_KEY) return null
  return { apiKey: env.OPENAI_API_KEY, baseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com/v1' }
}

// ========== API CALLS ==========

async function callChatAPI(
  baseUrl: string, apiKey: string, model: string,
  messages: any[], temperature = 0.7, maxTokens = 4096
): Promise<any> {
  const body: any = { model, messages, temperature, max_tokens: maxTokens }

  // o1 models don't support temperature or system messages the same way
  if (model.startsWith('o1')) {
    delete body.temperature
    delete body.max_tokens
    body.max_completion_tokens = maxTokens
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const e = await res.text()
    throw new Error(`${model} error ${res.status}: ${e}`)
  }
  return await res.json() as any
}

async function callImageGeneration(
  apiKey: string, baseUrl: string,
  prompt: string, model: string = 'dall-e-3',
  size: string = '1024x1024', quality: string = 'hd'
): Promise<{ url?: string; b64_json?: string; revised_prompt?: string }> {
  const body: any = { model, prompt, n: 1, size, quality }
  
  if (model === 'dall-e-3') {
    body.style = 'vivid'
    body.response_format = 'url'
  }

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  if (!res.ok) {
    const e = await res.text()
    throw new Error(`Image gen error ${res.status}: ${e}`)
  }
  
  const data = await res.json() as any
  return {
    url: data.data?.[0]?.url,
    b64_json: data.data?.[0]?.b64_json,
    revised_prompt: data.data?.[0]?.revised_prompt
  }
}

// ========== MODEL SELECTOR ==========
// Full multi-model routing for maximum capability

type ModelSelection = {
  provider: 'deepseek' | 'openai'
  model: string
  apiKey: string
  baseUrl: string
}

function selectModel(
  complexity: string,
  hasImages: boolean,
  env: any,
  suggestedModel?: string
): ModelSelection {
  const openai = getOpenAIConfig(env)
  const deepseek = getDeepSeekConfig(env)

  // If a specific model is suggested and we have OpenAI
  if (suggestedModel && openai) {
    const openaiModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o1', 'o1-mini', 'o1-preview', 'gpt-image-1', 'dall-e-3']
    if (openaiModels.includes(suggestedModel)) {
      return { provider: 'openai', model: suggestedModel, apiKey: openai.apiKey, baseUrl: openai.baseUrl }
    }
    if (suggestedModel === 'deepseek-chat' && deepseek) {
      return { provider: 'deepseek', model: 'deepseek-chat', apiKey: deepseek.apiKey, baseUrl: deepseek.baseUrl }
    }
  }

  // Vision (images) → gpt-4o (best vision model)
  if (hasImages && openai) {
    return { provider: 'openai', model: 'gpt-4o', apiKey: openai.apiKey, baseUrl: openai.baseUrl }
  }

  // Image generation
  if (complexity === 'image_gen' && openai) {
    return { provider: 'openai', model: 'dall-e-3', apiKey: openai.apiKey, baseUrl: openai.baseUrl }
  }

  // Material generation → gpt-4o (needs creative + structured output)
  if (complexity === 'material_gen' && openai) {
    return { provider: 'openai', model: 'gpt-4o', apiKey: openai.apiKey, baseUrl: openai.baseUrl }
  }

  // Document analysis → gpt-4o-mini (good enough, cheaper)
  if (complexity === 'document' && openai) {
    return { provider: 'openai', model: 'gpt-4o-mini', apiKey: openai.apiKey, baseUrl: openai.baseUrl }
  }

  // Reasoning tasks → o1-mini (deep reasoning)
  if (complexity === 'reasoning' && openai) {
    return { provider: 'openai', model: 'gpt-4o', apiKey: openai.apiKey, baseUrl: openai.baseUrl }
  }

  // Complex tasks → gpt-4o
  if (complexity === 'complex' && openai) {
    return { provider: 'openai', model: 'gpt-4o', apiKey: openai.apiKey, baseUrl: openai.baseUrl }
  }

  // Simple → DeepSeek (cheap & fast)
  if (deepseek) {
    return { provider: 'deepseek', model: 'deepseek-chat', apiKey: deepseek.apiKey, baseUrl: deepseek.baseUrl }
  }

  // Fallback → OpenAI gpt-4o-mini
  if (openai) {
    return { provider: 'openai', model: 'gpt-4o-mini', apiKey: openai.apiKey, baseUrl: openai.baseUrl }
  }

  throw new Error('No hay API de IA configurada. Necesitás DEEPSEEK_API_KEY o OPENAI_API_KEY.')
}

// ========== CLASSIFICATION ==========

export async function classifyMessage(
  message: string,
  hasAttachments: boolean,
  attachmentTypes: string[],
  env: any
): Promise<ClassificationResult> {
  const lower = message.toLowerCase()

  // Material publicitario keywords
  const materialWords = [
    'menú', 'menu', 'carta', 'tarjeta de plato', 'plato estrella',
    'flyer', 'volante', 'folleto', 'afiche', 'póster', 'poster',
    'banner', 'cartel', 'etiqueta', 'packaging', 'envoltorio',
    'tarjeta de visita', 'tarjeta de presentación', 'business card',
    'post para instagram', 'post para facebook', 'post de instagram', 'historia de instagram',
    'story', 'reel', 'publicación', 'contenido para redes',
    'infografía', 'catálogo', 'catalogo', 'lista de precios',
    'diseñá un', 'diseña un', 'creá un', 'crea un', 'armá un', 'arma un',
    'haceme un menú', 'haceme una tarjeta', 'haceme un flyer', 'haceme un post',
    'material publicitario', 'material de marketing', 'promocional'
  ]
  if (materialWords.some(w => lower.includes(w))) {
    return { complexity: 'material_gen', crm_action: false, action_type: 'none', suggested_model: 'gpt-4o' }
  }

  // Image generation keywords (generic image creation, not marketing material)
  const imageGenWords = [
    'generá una imagen', 'genera una imagen', 'creá una imagen', 'crea una imagen',
    'dibujá', 'dibuja', 'ilustración', 'foto artificial',
    'imagen de', 'picture of', 'generate image'
  ]
  if (imageGenWords.some(w => lower.includes(w))) {
    return { complexity: 'image_gen', crm_action: false, action_type: 'none', suggested_model: 'dall-e-3' }
  }

  // Document attachments
  if (hasAttachments && attachmentTypes.some(t => t.includes('pdf') || t.includes('text') || t.includes('csv') || t.includes('spreadsheet'))) {
    return { complexity: 'document', crm_action: false, action_type: 'none', suggested_model: 'gpt-4o' }
  }

  // Image attachments
  if (hasAttachments && attachmentTypes.some(t => t.startsWith('image/'))) {
    return { complexity: 'vision', crm_action: false, action_type: 'none', suggested_model: 'gpt-4o' }
  }

  // Use AI to classify the rest
  try {
    const sel = selectModel('simple', false, env)
    const data = await callChatAPI(sel.baseUrl, sel.apiKey, sel.model, [
      { role: 'system', content: TASK_CLASSIFIER_PROMPT },
      { role: 'user', content: message }
    ], 0.1, 200)

    const content = data.choices?.[0]?.message?.content || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        complexity: parsed.complexity || 'simple',
        crm_action: parsed.crm_action || false,
        action_type: parsed.action_type || 'none',
        suggested_model: parsed.suggested_model
      }
    }
  } catch (e) { console.error('Classification error:', e) }

  return { complexity: 'simple', crm_action: false, action_type: 'none' }
}

// ========== VISION MESSAGES ==========

export function buildVisionMessages(
  text: string,
  attachments: Attachment[]
): any[] {
  const content: any[] = []

  if (text) {
    content.push({ type: 'text', text })
  }

  for (const att of attachments) {
    if (att.type.startsWith('image/')) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${att.type};base64,${att.data}`, detail: 'high' }
      })
    } else {
      // Documents: decode base64 and include as text
      try {
        const decoded = atob(att.data)
        const cleanText = decoded.substring(0, 15000) // Limit for context window
        content.push({
          type: 'text',
          text: `\n📄 **Documento: ${att.name}**\n\`\`\`\n${cleanText}\n\`\`\``
        })
      } catch {
        content.push({ type: 'text', text: `[No se pudo leer el documento: ${att.name}]` })
      }
    }
  }

  return [{ role: 'user', content }]
}

// ========== MAIN CHAT FUNCTION ==========

export async function chatWithSoraLella(
  messages: ChatMessage[],
  crmContext: string,
  env: any,
  complexity: string,
  hasImages: boolean,
  attachments?: Attachment[],
  suggestedModel?: string
): Promise<AIResponse> {

  const systemMsg = SORA_LELLA_SYSTEM_PROMPT + SORA_LELLA_CONTEXT_TEMPLATE(crmContext)

  // === IMAGE GENERATION PATH ===
  if (complexity === 'image_gen') {
    return await generateImage(messages, env)
  }

  // === MATERIAL GENERATION PATH ===
  if (complexity === 'material_gen') {
    return await generateMarketingMaterial(messages, crmContext, env, attachments)
  }

  // === CHAT / VISION / DOCUMENT PATH ===
  const sel = selectModel(complexity, hasImages, env, suggestedModel)
  
  const allMessages: any[] = [
    { role: 'system', content: systemMsg },
    ...messages
  ]

  const maxTokens = complexity === 'complex' || complexity === 'reasoning' ? 8000 : 4096
  const temperature = complexity === 'reasoning' ? 0.3 : 0.7
  const data = await callChatAPI(sel.baseUrl, sel.apiKey, sel.model, allMessages, temperature, maxTokens)
  
  const content = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.'
  const tokens = data.usage?.total_tokens || 0
  const providerName = sel.provider === 'deepseek' ? 'DeepSeek' : 'OpenAI'

  return { content, model: sel.model, provider: providerName, tokens }
}

// ========== IMAGE GENERATION ==========

async function generateImage(
  messages: ChatMessage[],
  env: any
): Promise<AIResponse> {
  const openai = getOpenAIConfig(env)
  if (!openai) throw new Error('OpenAI API key necesaria para generar imágenes')

  // Extract last user message as prompt
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  let userPrompt = ''
  if (lastUserMsg) {
    if (typeof lastUserMsg.content === 'string') userPrompt = lastUserMsg.content
    else if (Array.isArray(lastUserMsg.content)) {
      userPrompt = lastUserMsg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join(' ')
    }
  }

  // Step 1: Optimize prompt with gpt-4o-mini
  const promptData = await callChatAPI(openai.baseUrl, openai.apiKey, 'gpt-4o-mini', [
    { role: 'system', content: IMAGE_PROMPT_ENGINEER },
    { role: 'user', content: userPrompt }
  ], 0.7, 500)

  const imagePrompt = promptData.choices?.[0]?.message?.content || userPrompt

  // Step 2: Generate image
  const imgResult = await callImageGeneration(openai.apiKey, openai.baseUrl, imagePrompt, 'dall-e-3', '1024x1024', 'hd')

  const responseText = `🎨 **¡Imagen lista, Mirko!**

He creado esta imagen con el estilo Peperoncino — cálido, artesanal, italiano auténtico.

**Prompt utilizado:** _${(imgResult.revised_prompt || imagePrompt).substring(0, 300)}${(imgResult.revised_prompt || imagePrompt).length > 300 ? '...' : ''}_

¿Querés que le haga algún cambio? Puedo ajustar colores, texto, estilo, o crear variaciones. También puedo convertir esto en material publicitario (menú, tarjeta, flyer, post).`

  return {
    content: responseText,
    model: 'dall-e-3',
    provider: 'OpenAI',
    tokens: 0,
    imageUrl: imgResult.url
  }
}

// ========== MARKETING MATERIAL GENERATION ==========

async function generateMarketingMaterial(
  messages: ChatMessage[],
  crmContext: string,
  env: any,
  attachments?: Attachment[]
): Promise<AIResponse> {
  const openai = getOpenAIConfig(env)
  if (!openai) throw new Error('OpenAI API necesaria para generar material publicitario')

  // Get user request
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  let userPrompt = ''
  if (lastUserMsg) {
    if (typeof lastUserMsg.content === 'string') userPrompt = lastUserMsg.content
    else if (Array.isArray(lastUserMsg.content)) {
      userPrompt = lastUserMsg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join(' ')
    }
  }

  // Step 1: Generate the material content with gpt-4o (HTML/structured)
  const materialMsgs: any[] = [
    { role: 'system', content: MARKETING_MATERIAL_PROMPT + `\n\n## CRM Context:\n${crmContext}` },
    ...messages.filter(m => m.role === 'user').slice(-3) // Last 3 user messages for context
  ]

  const materialData = await callChatAPI(openai.baseUrl, openai.apiKey, 'gpt-4o', materialMsgs, 0.8, 6000)
  const materialContent = materialData.choices?.[0]?.message?.content || ''
  const tokens = materialData.usage?.total_tokens || 0

  // Step 2: Also generate a visual image for the material
  let imageUrl: string | undefined
  try {
    const imgPromptData = await callChatAPI(openai.baseUrl, openai.apiKey, 'gpt-4o-mini', [
      { role: 'system', content: IMAGE_PROMPT_ENGINEER },
      { role: 'user', content: `Create a professional Italian trattoria style visual for: ${userPrompt}. Peperoncino Pasta Lab brand. Style: warm, rustic, artisanal Italian aesthetic.` }
    ], 0.7, 400)
    const imgPrompt = imgPromptData.choices?.[0]?.message?.content || `Italian trattoria style ${userPrompt}`
    const imgResult = await callImageGeneration(openai.apiKey, openai.baseUrl, imgPrompt, 'dall-e-3', '1024x1024', 'hd')
    imageUrl = imgResult.url
  } catch (e) {
    console.error('Image gen for material failed:', e)
  }

  // Detect material type
  const lower = userPrompt.toLowerCase()
  let materialType = 'general'
  if (lower.includes('menú') || lower.includes('menu') || lower.includes('carta')) materialType = 'menu'
  else if (lower.includes('tarjeta') && (lower.includes('plato') || lower.includes('estrella'))) materialType = 'dish_card'
  else if (lower.includes('flyer') || lower.includes('volante') || lower.includes('folleto')) materialType = 'flyer'
  else if (lower.includes('post') || lower.includes('instagram') || lower.includes('facebook') || lower.includes('redes')) materialType = 'social_post'
  else if (lower.includes('etiqueta') || lower.includes('label')) materialType = 'label'
  else if (lower.includes('banner')) materialType = 'banner'
  else if (lower.includes('tarjeta de visita') || lower.includes('tarjeta de presentación') || lower.includes('business card')) materialType = 'business_card'
  else if (lower.includes('infografía')) materialType = 'infographic'
  else if (lower.includes('catálogo') || lower.includes('catalogo') || lower.includes('lista de precios')) materialType = 'catalog'

  return {
    content: materialContent,
    model: 'gpt-4o',
    provider: 'OpenAI',
    tokens,
    imageUrl,
    materialType
  }
}

// ========== CRM HELPERS ==========

export function parseCrmActions(response: string): { cleanResponse: string; actions: any[] } {
  const actionsMatch = response.match(/<crm_actions>([\s\S]*?)<\/crm_actions>/)
  let actions: any[] = []
  let cleanResponse = response

  if (actionsMatch) {
    try { actions = JSON.parse(actionsMatch[1]) } catch (e) { console.error('CRM parse error:', e) }
    cleanResponse = response.replace(/<crm_actions>[\s\S]*?<\/crm_actions>/, '').trim()
  }

  return { cleanResponse, actions }
}

export async function getCrmSummary(db: D1Database): Promise<string> {
  try {
    const [products, clients, orders, revenue, offers] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first(),
      db.prepare('SELECT COUNT(*) as count FROM clients WHERE is_active = 1').first(),
      db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pendiente', 'en_proceso')").first(),
      db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE created_at > datetime('now', '-30 days')").first(),
      db.prepare('SELECT COUNT(*) as count FROM offers WHERE is_active = 1').first()
    ])

    let topProducts: string[] = []
    try {
      const top = await db.prepare('SELECT p.name, SUM(oi.quantity) as q FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.id ORDER BY q DESC LIMIT 3').all()
      topProducts = top.results?.map((r: any) => r.name) || []
    } catch {}

    // Get product list for material generation context
    let productList = ''
    try {
      const prods = await db.prepare('SELECT name, sell_price, unit, description FROM products WHERE is_active = 1 ORDER BY sell_price DESC LIMIT 15').all()
      productList = (prods.results || []).map((p: any) => `  - ${p.name}: $${p.sell_price}/${p.unit} — ${p.description || ''}`).join('\n')
    } catch {}

    return `- Productos activos: ${(products as any)?.count || 0}
- Clientes: ${(clients as any)?.count || 0}
- Pedidos activos: ${(orders as any)?.count || 0}
- Ofertas activas: ${(offers as any)?.count || 0}
- Ingresos 30 días: $${((revenue as any)?.total || 0).toLocaleString('es-AR')}
- Top productos: ${topProducts.length ? topProducts.join(', ') : 'Sin datos'}
${productList ? `\n### Catálogo actual:\n${productList}` : ''}`
  } catch (e) { return '- CRM recién inicializado.' }
}

export async function executeCrmActions(db: D1Database, actions: any[]): Promise<string[]> {
  const results: string[] = []
  for (const action of actions) {
    try {
      const d = action.data || {}
      switch (action.action) {
        case 'create_product':
          await db.prepare('INSERT INTO products (name, description, category_id, unit, cost_price, sell_price, margin_percent, notes) VALUES (?,?,?,?,?,?,?,?)').bind(d.name, d.description||'', d.category_id||1, d.unit||'kg', d.cost_price||0, d.sell_price||0, d.margin_percent||0, d.notes||'').run()
          results.push(`Producto creado: ${d.name}`); break
        case 'update_product':
          if (d.id) { const s: string[] = [], v: any[] = []; for (const [k,val] of Object.entries(d)) { if(k!=='id'){s.push(`${k}=?`);v.push(val)} }; if(s.length){v.push(d.id); await db.prepare(`UPDATE products SET ${s.join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...v).run(); results.push(`Producto actualizado: ID ${d.id}`)} }; break
        case 'create_client':
          await db.prepare('INSERT INTO clients (name, phone, email, address, city, client_type, notes) VALUES (?,?,?,?,?,?,?)').bind(d.name, d.phone||'', d.email||'', d.address||'', d.city||'', d.client_type||'particular', d.notes||'').run()
          results.push(`Cliente creado: ${d.name}`); break
        case 'update_client':
          if (d.id) { const s: string[] = [], v: any[] = []; for (const [k,val] of Object.entries(d)) { if(k!=='id'){s.push(`${k}=?`);v.push(val)} }; if(s.length){v.push(d.id); await db.prepare(`UPDATE clients SET ${s.join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(...v).run(); results.push(`Cliente actualizado: ID ${d.id}`)} }; break
        case 'create_order':
          const or = await db.prepare("INSERT INTO orders (client_id, delivery_date, status, total, notes) VALUES (?,?,'pendiente',?,?)").bind(d.client_id||null, d.delivery_date||null, d.total||0, d.notes||'').run()
          results.push(`Pedido #${or.meta?.last_row_id} creado`); break
        case 'create_offer':
          await db.prepare('INSERT INTO offers (name, description, offer_type, discount_percent, discount_amount, start_date, end_date, target_audience, marketing_message) VALUES (?,?,?,?,?,?,?,?,?)').bind(d.name, d.description||'', d.offer_type||'descuento', d.discount_percent||0, d.discount_amount||0, d.start_date||null, d.end_date||null, d.target_audience||'', d.marketing_message||'').run()
          results.push(`Oferta creada: ${d.name}`); break
        case 'create_note':
          await db.prepare('INSERT INTO notes (title, content, category, priority) VALUES (?,?,?,?)').bind(d.title||'Nota', d.content, d.category||'general', d.priority||'normal').run()
          results.push(`Nota guardada: ${d.title||'Nota'}`); break
        case 'create_recipe':
          await db.prepare('INSERT INTO recipes (name, description, product_id, prep_time_minutes, yield_quantity, yield_unit, difficulty, instructions, tips) VALUES (?,?,?,?,?,?,?,?,?)').bind(d.name, d.description||'', d.product_id||null, d.prep_time_minutes||0, d.yield_quantity||1, d.yield_unit||'kg', d.difficulty||'media', d.instructions||'', d.tips||'').run()
          results.push(`Receta creada: ${d.name}`); break
        case 'update_pricing':
          if (d.product_id) {
            await db.prepare('INSERT INTO pricing_studies (product_id, current_cost, current_price, suggested_price, competitor_price, market_notes, ai_analysis, recommendation) VALUES (?,?,?,?,?,?,?,?)').bind(d.product_id, d.current_cost||0, d.current_price||0, d.suggested_price||0, d.competitor_price||null, d.market_notes||'', d.ai_analysis||'', d.recommendation||'').run()
            results.push(`Estudio de precio guardado`); break
          }
        default: results.push(`Acción desconocida: ${action.action}`)
      }
      await db.prepare('INSERT INTO activity_log (action_type, entity_type, description) VALUES (?,?,?)').bind(action.action, action.action.replace('create_','').replace('update_',''), `Sora Lella: ${results[results.length-1]}`).run()
    } catch (e: any) { results.push(`Error: ${e.message}`) }
  }
  return results
}

// ========== MEDIA GALLERY ==========

export async function saveToGallery(
  db: D1Database,
  data: {
    title: string
    description?: string
    image_url?: string
    html_content?: string
    material_type: string
    conversation_id?: number
    prompt_used?: string
  }
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO media_gallery (title, description, image_url, html_content, material_type, conversation_id, prompt_used)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.title, data.description || '', data.image_url || null,
    data.html_content || null, data.material_type,
    data.conversation_id || null, data.prompt_used || ''
  ).run()
  return result.meta.last_row_id as number
}
