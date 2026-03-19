// AI Integration Layer
// DeepSeek for conversations & simple tasks | OpenAI for complex tasks
// Both APIs are OpenAI-compatible

import { SORA_LELLA_SYSTEM_PROMPT, SORA_LELLA_CONTEXT_TEMPLATE, TASK_CLASSIFIER_PROMPT } from './prompts'

interface AIProvider {
  apiKey: string
  baseUrl: string
  models: { fast: string; smart: string }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ClassificationResult {
  complexity: 'simple' | 'complex'
  crm_action: boolean
  action_type: string
}

// Build provider configs from environment
function getProviders(env: any): { deepseek: AIProvider | null; openai: AIProvider | null } {
  const deepseek: AIProvider | null = env.DEEPSEEK_API_KEY ? {
    apiKey: env.DEEPSEEK_API_KEY,
    baseUrl: 'https://api.deepseek.com',
    models: { fast: 'deepseek-chat', smart: 'deepseek-reasoner' }
  } : null

  const openai: AIProvider | null = env.OPENAI_API_KEY ? {
    apiKey: env.OPENAI_API_KEY,
    baseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    models: { fast: 'gpt-5-nano', smart: 'gpt-5-mini' }
  } : null

  return { deepseek, openai }
}

// Pick the right provider: DeepSeek for simple, OpenAI for complex, with fallback
function pickProvider(
  providers: { deepseek: AIProvider | null; openai: AIProvider | null },
  complexity: 'simple' | 'complex'
): { provider: AIProvider; model: string } {
  const { deepseek, openai } = providers

  if (complexity === 'complex' && openai) {
    return { provider: openai, model: openai.models.smart }
  }
  if (deepseek) {
    return { provider: deepseek, model: deepseek.models.fast }
  }
  if (openai) {
    return { provider: openai, model: openai.models.fast }
  }
  throw new Error('No hay ninguna API de IA configurada. Configurá DEEPSEEK_API_KEY o OPENAI_API_KEY.')
}

async function callAI(provider: AIProvider, model: string, messages: any[], temperature = 0.7, maxTokens = 2000) {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI API error (${model}): ${response.status} - ${errText}`)
  }

  return await response.json() as any
}

// Classify message complexity using DeepSeek (fast & cheap)
export async function classifyMessage(
  message: string,
  env: any
): Promise<ClassificationResult> {
  try {
    const providers = getProviders(env)
    const { provider, model } = pickProvider(providers, 'simple')

    const data = await callAI(provider, model, [
      { role: 'system', content: TASK_CLASSIFIER_PROMPT },
      { role: 'user', content: message }
    ], 0.1, 200)

    const content = data.choices?.[0]?.message?.content || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return { complexity: 'simple', crm_action: false, action_type: 'none' }
  } catch (e) {
    console.error('Classification error:', e)
    return { complexity: 'simple', crm_action: false, action_type: 'none' }
  }
}

// Main chat function with Sora Lella
export async function chatWithSoraLella(
  messages: ChatMessage[],
  crmContext: string,
  env: any,
  complexity: 'simple' | 'complex' = 'simple'
): Promise<{ content: string; model: string; tokens: number; provider: string }> {
  const providers = getProviders(env)
  const { provider, model } = pickProvider(providers, complexity)

  const systemMessage = SORA_LELLA_SYSTEM_PROMPT + SORA_LELLA_CONTEXT_TEMPLATE(crmContext)

  const allMessages: ChatMessage[] = [
    { role: 'system', content: systemMessage },
    ...messages
  ]

  const data = await callAI(provider, model, allMessages, 0.7, 2000)
  const content = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.'
  const tokens = data.usage?.total_tokens || 0
  const providerName = provider.baseUrl.includes('deepseek') ? 'DeepSeek' : 'OpenAI'

  return { content, model, tokens, provider: providerName }
}

// Parse CRM actions from Sora Lella's response
export function parseCrmActions(response: string): { cleanResponse: string; actions: any[] } {
  const actionsMatch = response.match(/<crm_actions>([\s\S]*?)<\/crm_actions>/)
  let actions: any[] = []
  let cleanResponse = response

  if (actionsMatch) {
    try {
      actions = JSON.parse(actionsMatch[1])
    } catch (e) {
      console.error('Error parsing CRM actions:', e)
    }
    cleanResponse = response.replace(/<crm_actions>[\s\S]*?<\/crm_actions>/, '').trim()
  }

  return { cleanResponse, actions }
}

// Get CRM summary for context
export async function getCrmSummary(db: D1Database): Promise<string> {
  try {
    const [products, clients, orders, revenue] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first(),
      db.prepare('SELECT COUNT(*) as count FROM clients WHERE is_active = 1').first(),
      db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pendiente', 'en_proceso')").first(),
      db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE created_at > datetime('now', '-30 days')").first()
    ])

    let topProducts: string[] = []
    try {
      const top = await db.prepare(`
        SELECT p.name, SUM(oi.quantity) as total_qty 
        FROM order_items oi JOIN products p ON oi.product_id = p.id 
        GROUP BY p.id ORDER BY total_qty DESC LIMIT 3
      `).all()
      topProducts = top.results?.map((r: any) => r.name) || []
    } catch (e) { /* empty */ }

    return `
- Productos activos: ${(products as any)?.count || 0}
- Clientes registrados: ${(clients as any)?.count || 0}
- Pedidos activos: ${(orders as any)?.count || 0}
- Ingresos últimos 30 días: $${((revenue as any)?.total || 0).toLocaleString('es-AR')}
- Productos más vendidos: ${topProducts.length > 0 ? topProducts.join(', ') : 'Sin datos aún'}
`
  } catch (e) {
    return '- CRM recién inicializado, sin datos históricos aún.'
  }
}

// Execute CRM actions from AI response
export async function executeCrmActions(db: D1Database, actions: any[]): Promise<string[]> {
  const results: string[] = []

  for (const action of actions) {
    try {
      switch (action.action) {
        case 'create_product': {
          const d = action.data
          await db.prepare(`
            INSERT INTO products (name, description, category_id, unit, cost_price, sell_price, margin_percent, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(d.name, d.description || '', d.category_id || 1, d.unit || 'kg', d.cost_price || 0, d.sell_price || 0, d.margin_percent || 0, d.notes || '').run()
          results.push(`Producto creado: ${d.name}`)
          break
        }
        case 'create_client': {
          const d = action.data
          await db.prepare(`
            INSERT INTO clients (name, phone, email, address, city, client_type, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(d.name, d.phone || '', d.email || '', d.address || '', d.city || '', d.client_type || 'particular', d.notes || '').run()
          results.push(`Cliente creado: ${d.name}`)
          break
        }
        case 'update_client': {
          const d = action.data
          if (d.id) {
            const sets: string[] = []
            const vals: any[] = []
            for (const [key, val] of Object.entries(d)) {
              if (key !== 'id') { sets.push(`${key} = ?`); vals.push(val); }
            }
            if (sets.length > 0) {
              vals.push(d.id)
              await db.prepare(`UPDATE clients SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...vals).run()
              results.push(`Cliente actualizado: ID ${d.id}`)
            }
          }
          break
        }
        case 'create_order': {
          const d = action.data
          const orderResult = await db.prepare(`
            INSERT INTO orders (client_id, delivery_date, status, total, notes)
            VALUES (?, ?, 'pendiente', ?, ?)
          `).bind(d.client_id || null, d.delivery_date || null, d.total || 0, d.notes || '').run()
          results.push(`Pedido creado #${orderResult.meta?.last_row_id}`)
          break
        }
        case 'create_offer': {
          const d = action.data
          await db.prepare(`
            INSERT INTO offers (name, description, offer_type, discount_percent, discount_amount, start_date, end_date, target_audience, marketing_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(d.name, d.description || '', d.offer_type || 'descuento', d.discount_percent || 0, d.discount_amount || 0, d.start_date || null, d.end_date || null, d.target_audience || '', d.marketing_message || '').run()
          results.push(`Oferta creada: ${d.name}`)
          break
        }
        case 'create_note': {
          const d = action.data
          await db.prepare(`
            INSERT INTO notes (title, content, category, priority) VALUES (?, ?, ?, ?)
          `).bind(d.title || 'Nota rápida', d.content, d.category || 'general', d.priority || 'normal').run()
          results.push(`Nota guardada: ${d.title || 'Nota rápida'}`)
          break
        }
        case 'create_recipe': {
          const d = action.data
          await db.prepare(`
            INSERT INTO recipes (name, description, product_id, prep_time_minutes, yield_quantity, yield_unit, difficulty, instructions, tips)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(d.name, d.description || '', d.product_id || null, d.prep_time_minutes || 0, d.yield_quantity || 1, d.yield_unit || 'kg', d.difficulty || 'media', d.instructions || '', d.tips || '').run()
          results.push(`Receta creada: ${d.name}`)
          break
        }
        default:
          results.push(`Acción no reconocida: ${action.action}`)
      }

      await db.prepare(`
        INSERT INTO activity_log (action_type, entity_type, description)
        VALUES (?, ?, ?)
      `).bind(action.action, action.action.replace('create_', '').replace('update_', ''), `Sora Lella: ${results[results.length - 1]}`).run()
    } catch (e: any) {
      results.push(`Error en ${action.action}: ${e.message}`)
    }
  }

  return results
}
