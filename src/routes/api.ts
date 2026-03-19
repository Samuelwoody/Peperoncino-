// General API Routes
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
    version: '1.1.0',
    deepseek: !!c.env.DEEPSEEK_API_KEY,
    openai: !!c.env.OPENAI_API_KEY
  })
})

// Get AI configuration status
apiRoutes.get('/settings', (c) => {
  return c.json({
    success: true,
    data: {
      deepseek_configured: !!c.env.DEEPSEEK_API_KEY,
      openai_configured: !!c.env.OPENAI_API_KEY,
      any_ai: !!(c.env.DEEPSEEK_API_KEY || c.env.OPENAI_API_KEY)
    }
  })
})

// Test AI connection
apiRoutes.post('/test-ai', async (c) => {
  const apiKey = c.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return c.json({ success: false, error: 'DEEPSEEK_API_KEY no configurada' })
  }
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Di solo: "Ciao Mirko! Sora Lella está lista!" y nada más.' }],
        max_tokens: 30
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return c.json({ success: false, error: `DeepSeek Error ${response.status}: ${err}` })
    }

    const data = await response.json() as any
    return c.json({
      success: true,
      message: data.choices?.[0]?.message?.content || 'OK',
      model: data.model,
      provider: 'DeepSeek'
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message })
  }
})

// Search across CRM
apiRoutes.get('/search', async (c) => {
  const db = c.env.DB
  const q = c.req.query('q') || ''
  if (q.length < 2) return c.json({ success: true, data: { products: [], clients: [], recipes: [] } })

  const pattern = `%${q}%`
  try {
    const [products, clients, recipes] = await Promise.all([
      db.prepare('SELECT id, name, sell_price FROM products WHERE name LIKE ? AND is_active = 1 LIMIT 5').bind(pattern).all(),
      db.prepare('SELECT id, name, phone, city FROM clients WHERE (name LIKE ? OR phone LIKE ?) AND is_active = 1 LIMIT 5').bind(pattern, pattern).all(),
      db.prepare('SELECT id, name, difficulty FROM recipes WHERE name LIKE ? AND is_active = 1 LIMIT 5').bind(pattern).all()
    ])
    return c.json({
      success: true,
      data: { products: products.results, clients: clients.results, recipes: recipes.results }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})
