// CRM Routes - Products, Recipes, Clients, Orders, Offers, Pricing
import { Hono } from 'hono'

type Bindings = { DB: D1Database }

export const crmRoutes = new Hono<{ Bindings: Bindings }>()

// ========== DASHBOARD ==========
crmRoutes.get('/dashboard', async (c) => {
  const db = c.env.DB
  try {
    const [products, clients, orders, revenue, recentActivity, activeOffers] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first(),
      db.prepare('SELECT COUNT(*) as count FROM clients WHERE is_active = 1').first(),
      db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pendiente', 'en_proceso')").first(),
      db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE created_at > datetime('now', '-30 days')").first(),
      db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10').all(),
      db.prepare('SELECT COUNT(*) as count FROM offers WHERE is_active = 1').first()
    ])

    return c.json({
      success: true,
      data: {
        products: (products as any)?.count || 0,
        clients: (clients as any)?.count || 0,
        activeOrders: (orders as any)?.count || 0,
        monthlyRevenue: (revenue as any)?.total || 0,
        activeOffers: (activeOffers as any)?.count || 0,
        recentActivity: recentActivity.results || []
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== PRODUCTS ==========
crmRoutes.get('/products', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY c.sort_order, p.name
    `).all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.get('/products/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  try {
    const product = await db.prepare(`
      SELECT p.*, c.name as category_name FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
    `).bind(id).first()
    return c.json({ success: true, data: product })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.post('/products', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const margin = d.sell_price && d.cost_price ? ((d.sell_price - d.cost_price) / d.sell_price * 100).toFixed(1) : 0
    const result = await db.prepare(`
      INSERT INTO products (name, description, category_id, unit, cost_price, sell_price, margin_percent, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(d.name, d.description || '', d.category_id || 1, d.unit || 'kg', d.cost_price || 0, d.sell_price || 0, margin, d.notes || '').run()
    
    await db.prepare('INSERT INTO activity_log (action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?)').bind('create', 'product', result.meta.last_row_id, `Producto creado: ${d.name}`).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.put('/products/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const margin = d.sell_price && d.cost_price ? ((d.sell_price - d.cost_price) / d.sell_price * 100).toFixed(1) : 0
    await db.prepare(`
      UPDATE products SET name=?, description=?, category_id=?, unit=?, cost_price=?, sell_price=?, margin_percent=?, notes=?, is_active=?, updated_at=CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(d.name, d.description || '', d.category_id || 1, d.unit || 'kg', d.cost_price || 0, d.sell_price || 0, margin, d.notes || '', d.is_active ?? 1, id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.delete('/products/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  try {
    await db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== CATEGORIES ==========
crmRoutes.get('/categories', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== RECIPES ==========
crmRoutes.get('/recipes', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare(`
      SELECT r.*, p.name as product_name FROM recipes r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.name
    `).all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.get('/recipes/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  try {
    const recipe = await db.prepare('SELECT r.*, p.name as product_name FROM recipes r LEFT JOIN products p ON r.product_id = p.id WHERE r.id = ?').bind(id).first()
    const ingredients = await db.prepare(`
      SELECT ri.*, i.name as ingredient_name, i.cost_per_unit
      FROM recipe_ingredients ri JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `).bind(id).all()
    return c.json({ success: true, data: { ...recipe, ingredients: ingredients.results } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.post('/recipes', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const result = await db.prepare(`
      INSERT INTO recipes (name, description, product_id, prep_time_minutes, yield_quantity, yield_unit, total_cost, cost_per_unit, difficulty, instructions, tips)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(d.name, d.description || '', d.product_id || null, d.prep_time_minutes || 0, d.yield_quantity || 1, d.yield_unit || 'kg', d.total_cost || 0, d.cost_per_unit || 0, d.difficulty || 'media', d.instructions || '', d.tips || '').run()
    
    await db.prepare('INSERT INTO activity_log (action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?)').bind('create', 'recipe', result.meta.last_row_id, `Receta creada: ${d.name}`).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== INGREDIENTS ==========
crmRoutes.get('/ingredients', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare('SELECT * FROM ingredients ORDER BY name').all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.post('/ingredients', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const result = await db.prepare(`
      INSERT INTO ingredients (name, unit, cost_per_unit, supplier, min_stock, current_stock, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(d.name, d.unit || 'kg', d.cost_per_unit || 0, d.supplier || '', d.min_stock || 0, d.current_stock || 0, d.notes || '').run()
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== CLIENTS ==========
crmRoutes.get('/clients', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare('SELECT * FROM clients WHERE is_active = 1 ORDER BY name').all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.get('/clients/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  try {
    const client = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first()
    const orders = await db.prepare('SELECT * FROM orders WHERE client_id = ? ORDER BY order_date DESC LIMIT 10').bind(id).all()
    return c.json({ success: true, data: { ...client, orders: orders.results } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.post('/clients', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const result = await db.prepare(`
      INSERT INTO clients (name, phone, email, address, city, client_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(d.name, d.phone || '', d.email || '', d.address || '', d.city || '', d.client_type || 'particular', d.notes || '').run()
    
    await db.prepare('INSERT INTO activity_log (action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?)').bind('create', 'client', result.meta.last_row_id, `Cliente creado: ${d.name}`).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.put('/clients/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const d = await c.req.json()
  try {
    await db.prepare(`
      UPDATE clients SET name=?, phone=?, email=?, address=?, city=?, client_type=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(d.name, d.phone || '', d.email || '', d.address || '', d.city || '', d.client_type || 'particular', d.notes || '', id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== ORDERS ==========
crmRoutes.get('/orders', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare(`
      SELECT o.*, c.name as client_name FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      ORDER BY o.created_at DESC LIMIT 50
    `).all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.get('/orders/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  try {
    const order = await db.prepare(`
      SELECT o.*, c.name as client_name FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id WHERE o.id = ?
    `).bind(id).first()
    const items = await db.prepare(`
      SELECT oi.*, p.name as product_name FROM order_items oi
      JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `).bind(id).all()
    return c.json({ success: true, data: { ...order, items: items.results } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.post('/orders', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const result = await db.prepare(`
      INSERT INTO orders (client_id, delivery_date, status, subtotal, discount, total, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(d.client_id || null, d.delivery_date || null, d.status || 'pendiente', d.subtotal || 0, d.discount || 0, d.total || 0, d.payment_method || '', d.notes || '').run()

    const orderId = result.meta.last_row_id
    if (d.items && Array.isArray(d.items)) {
      for (const item of d.items) {
        await db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(orderId, item.product_id, item.quantity, item.unit_price, item.total_price || item.quantity * item.unit_price, item.notes || '').run()
      }
    }

    await db.prepare('INSERT INTO activity_log (action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?)').bind('create', 'order', orderId, `Pedido #${orderId} creado`).run()

    return c.json({ success: true, id: orderId })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.put('/orders/:id/status', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const { status } = await c.req.json()
  try {
    await db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(status, id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== OFFERS ==========
crmRoutes.get('/offers', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare('SELECT * FROM offers ORDER BY created_at DESC').all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.post('/offers', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const result = await db.prepare(`
      INSERT INTO offers (name, description, offer_type, discount_percent, discount_amount, min_purchase, start_date, end_date, target_audience, marketing_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(d.name, d.description || '', d.offer_type || 'descuento', d.discount_percent || 0, d.discount_amount || 0, d.min_purchase || 0, d.start_date || null, d.end_date || null, d.target_audience || '', d.marketing_message || '').run()
    
    await db.prepare('INSERT INTO activity_log (action_type, entity_type, entity_id, description) VALUES (?, ?, ?, ?)').bind('create', 'offer', result.meta.last_row_id, `Oferta creada: ${d.name}`).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.put('/offers/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  const d = await c.req.json()
  try {
    await db.prepare(`
      UPDATE offers SET name=?, description=?, offer_type=?, discount_percent=?, discount_amount=?, min_purchase=?, start_date=?, end_date=?, is_active=?, target_audience=?, marketing_message=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
    `).bind(d.name, d.description || '', d.offer_type || 'descuento', d.discount_percent || 0, d.discount_amount || 0, d.min_purchase || 0, d.start_date || null, d.end_date || null, d.is_active ?? 1, d.target_audience || '', d.marketing_message || '', id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== PRICING ==========
crmRoutes.get('/pricing', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare(`
      SELECT ps.*, p.name as product_name FROM pricing_studies ps
      JOIN products p ON ps.product_id = p.id
      ORDER BY ps.study_date DESC LIMIT 50
    `).all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.post('/pricing', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const result = await db.prepare(`
      INSERT INTO pricing_studies (product_id, current_cost, current_price, suggested_price, competitor_price, market_notes, ai_analysis, recommendation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(d.product_id, d.current_cost || 0, d.current_price || 0, d.suggested_price || 0, d.competitor_price || null, d.market_notes || '', d.ai_analysis || '', d.recommendation || '').run()
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== NOTES ==========
crmRoutes.get('/notes', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare('SELECT * FROM notes ORDER BY created_at DESC LIMIT 50').all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

crmRoutes.post('/notes', async (c) => {
  const db = c.env.DB
  const d = await c.req.json()
  try {
    const result = await db.prepare(`
      INSERT INTO notes (title, content, category, priority) VALUES (?, ?, ?, ?)
    `).bind(d.title || 'Nota rápida', d.content, d.category || 'general', d.priority || 'normal').run()
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== ACTIVITY LOG ==========
crmRoutes.get('/activity', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 30').all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})
