// Chat Routes - Sora Lella AI Conversations
import { Hono } from 'hono'
import { classifyMessage, chatWithSoraLella, parseCrmActions, getCrmSummary, executeCrmActions } from '../lib/ai'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string
}

export const chatRoutes = new Hono<{ Bindings: Bindings }>()

// Get all conversations
chatRoutes.get('/conversations', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare(
      'SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 50'
    ).all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Get messages for a conversation
chatRoutes.get('/conversations/:id/messages', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  try {
    const messages = await db.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).bind(id).all()
    return c.json({ success: true, data: messages.results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Create new conversation
chatRoutes.post('/conversations', async (c) => {
  const db = c.env.DB
  try {
    const { title } = await c.req.json()
    const result = await db.prepare(
      'INSERT INTO conversations (title) VALUES (?)'
    ).bind(title || 'Nueva conversación').run()
    
    const conv = await db.prepare(
      'SELECT * FROM conversations WHERE id = ?'
    ).bind(result.meta.last_row_id).first()
    
    return c.json({ success: true, data: conv })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Delete a conversation
chatRoutes.delete('/conversations/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB
  try {
    await db.prepare('DELETE FROM messages WHERE conversation_id = ?').bind(id).run()
    await db.prepare('DELETE FROM conversations WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Send message and get AI response
chatRoutes.post('/send', async (c) => {
  const db = c.env.DB
  const { conversation_id, message } = await c.req.json()

  if (!message || !conversation_id) {
    return c.json({ success: false, error: 'Faltan datos' }, 400)
  }

  const config = {
    apiKey: c.env.OPENAI_API_KEY,
    baseUrl: c.env.OPENAI_BASE_URL
  }

  try {
    // 1. Save user message
    await db.prepare(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
    ).bind(conversation_id, 'user', message).run()

    // 2. Classify message complexity
    const classification = await classifyMessage(message, config)

    // 3. Get conversation history (last 20 messages)
    const history = await db.prepare(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 20'
    ).bind(conversation_id).all()

    const chatMessages = (history.results || []).reverse().map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    // 4. Get CRM context
    const crmContext = await getCrmSummary(db)

    // 5. Get AI response
    const aiResponse = await chatWithSoraLella(
      chatMessages,
      crmContext,
      config,
      classification.complexity
    )

    // 6. Parse CRM actions from response
    const { cleanResponse, actions } = parseCrmActions(aiResponse.content)

    // 7. Execute CRM actions if any
    let actionResults: string[] = []
    if (actions.length > 0) {
      actionResults = await executeCrmActions(db, actions)
    }

    // 8. Save assistant message
    await db.prepare(
      'INSERT INTO messages (conversation_id, role, content, model_used, tokens_used, actions_taken) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      conversation_id, 'assistant', cleanResponse,
      aiResponse.model, aiResponse.tokens,
      actionResults.length > 0 ? JSON.stringify(actionResults) : null
    ).run()

    // 9. Update conversation
    await db.prepare(
      'UPDATE conversations SET message_count = message_count + 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(conversation_id).run()

    // Auto-title if first real message
    const conv = await db.prepare('SELECT message_count FROM conversations WHERE id = ?').bind(conversation_id).first() as any
    if (conv && conv.message_count <= 3) {
      const title = message.substring(0, 60) + (message.length > 60 ? '...' : '')
      await db.prepare('UPDATE conversations SET title = ? WHERE id = ?').bind(title, conversation_id).run()
    }

    return c.json({
      success: true,
      data: {
        response: cleanResponse,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        actions: actionResults,
        classification
      }
    })
  } catch (e: any) {
    console.error('Chat error:', e)
    return c.json({ success: false, error: e.message }, 500)
  }
})
