// General API Routes
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
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
    version: '1.0.0',
    ai_configured: !!(c.env.OPENAI_API_KEY && c.env.OPENAI_BASE_URL)
  })
})

// Get AI configuration status
apiRoutes.get('/settings', (c) => {
  return c.json({
    success: true,
    data: {
      ai_configured: !!(c.env.OPENAI_API_KEY && c.env.OPENAI_BASE_URL),
      base_url: c.env.OPENAI_BASE_URL ? c.env.OPENAI_BASE_URL.replace(/\/v1$/, '/...') : 'not set',
      api_key_set: !!c.env.OPENAI_API_KEY
    }
  })
})

// Test AI connection
apiRoutes.post('/test-ai', async (c) => {
  try {
    const response = await fetch(`${c.env.OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        messages: [{ role: 'user', content: 'Di "Ciao!" y nada más.' }],
        max_tokens: 20
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return c.json({ success: false, error: `API Error ${response.status}: ${err}` })
    }

    const data = await response.json() as any
    return c.json({
      success: true,
      message: data.choices?.[0]?.message?.content || 'OK',
      model: data.model
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
