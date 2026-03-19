// General API Routes v2.0
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  DEEPSEEK_API_KEY: string
  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string
}

export const apiRoutes = new Hono<{ Bindings: Bindings }>()

// Health check
apiRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'Peperoncino Pasta Lab',
    ai: 'Sora Lella',
    version: '3.0.0',
    features: ['chat', 'vision', 'image-gen', 'material-gen', 'documents', 'crm', 'gallery', 'voice', 'whisper', 'tts'],
    deepseek: !!c.env.DEEPSEEK_API_KEY,
    openai: !!c.env.OPENAI_API_KEY,
    models: {
      deepseek: c.env.DEEPSEEK_API_KEY ? ['deepseek-chat'] : [],
      openai: c.env.OPENAI_API_KEY ? ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'dall-e-3', 'o1-mini', 'whisper-1', 'tts-1'] : []
    }
  })
})

// Get AI configuration status
apiRoutes.get('/settings', (c) => {
  return c.json({
    success: true,
    data: {
      deepseek_configured: !!c.env.DEEPSEEK_API_KEY,
      openai_configured: !!c.env.OPENAI_API_KEY,
      any_ai: !!(c.env.DEEPSEEK_API_KEY || c.env.OPENAI_API_KEY),
      capabilities: {
        chat: !!(c.env.DEEPSEEK_API_KEY || c.env.OPENAI_API_KEY),
        vision: !!c.env.OPENAI_API_KEY,
        image_generation: !!c.env.OPENAI_API_KEY,
        material_generation: !!c.env.OPENAI_API_KEY,
        document_analysis: !!c.env.OPENAI_API_KEY,
        voice_input: !!c.env.OPENAI_API_KEY,
        voice_output: !!c.env.OPENAI_API_KEY
      }
    }
  })
})

// Test AI connections
apiRoutes.post('/test-ai', async (c) => {
  const results: any = {}

  // Test DeepSeek
  if (c.env.DEEPSEEK_API_KEY) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${c.env.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'Di solo: "DeepSeek OK" y nada más.' }], max_tokens: 20 })
      })
      if (res.ok) {
        const data = await res.json() as any
        results.deepseek = { status: 'ok', model: data.model, message: data.choices?.[0]?.message?.content }
      } else {
        results.deepseek = { status: 'error', code: res.status }
      }
    } catch (e: any) { results.deepseek = { status: 'error', message: e.message } }
  }

  // Test OpenAI
  if (c.env.OPENAI_API_KEY) {
    const baseUrl = c.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Di solo: "OpenAI OK" y nada más.' }], max_tokens: 20 })
      })
      if (res.ok) {
        const data = await res.json() as any
        results.openai = { status: 'ok', model: data.model, message: data.choices?.[0]?.message?.content }
      } else {
        results.openai = { status: 'error', code: res.status }
      }
    } catch (e: any) { results.openai = { status: 'error', message: e.message } }
  }

  return c.json({
    success: true,
    data: results,
    summary: `DeepSeek: ${results.deepseek?.status || 'no configurado'} | OpenAI: ${results.openai?.status || 'no configurado'}`
  })
})

// Search across CRM
apiRoutes.get('/search', async (c) => {
  const db = c.env.DB
  const q = c.req.query('q') || ''
  if (q.length < 2) return c.json({ success: true, data: { products: [], clients: [], recipes: [], gallery: [] } })

  const pattern = `%${q}%`
  try {
    const [products, clients, recipes, gallery] = await Promise.all([
      db.prepare('SELECT id, name, sell_price FROM products WHERE name LIKE ? AND is_active = 1 LIMIT 5').bind(pattern).all(),
      db.prepare('SELECT id, name, phone, city FROM clients WHERE (name LIKE ? OR phone LIKE ?) AND is_active = 1 LIMIT 5').bind(pattern, pattern).all(),
      db.prepare('SELECT id, name, difficulty FROM recipes WHERE name LIKE ? AND is_active = 1 LIMIT 5').bind(pattern).all(),
      db.prepare('SELECT id, title, material_type FROM media_gallery WHERE title LIKE ? LIMIT 5').bind(pattern).all()
    ])
    return c.json({
      success: true,
      data: { products: products.results, clients: clients.results, recipes: recipes.results, gallery: gallery.results }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})
