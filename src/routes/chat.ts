// Chat Routes v3.0 - Full multimedia: vision, image gen, material, documents, VOICE
import { Hono } from 'hono'
import { classifyMessage, chatWithSoraLella, buildVisionMessages, parseCrmActions, getCrmSummary, executeCrmActions, saveToGallery } from '../lib/ai'
import { transcribeAudio, textToSpeech } from '../lib/audio'

type Bindings = {
  DB: D1Database
  DEEPSEEK_API_KEY: string
  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string
}

export const chatRoutes = new Hono<{ Bindings: Bindings }>()

// Get all conversations
chatRoutes.get('/conversations', async (c) => {
  const db = c.env.DB
  try {
    const result = await db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 50').all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// Get messages for a conversation
chatRoutes.get('/conversations/:id/messages', async (c) => {
  const id = c.req.param('id')
  try {
    const messages = await c.env.DB.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').bind(id).all()
    return c.json({ success: true, data: messages.results })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// Create new conversation
chatRoutes.post('/conversations', async (c) => {
  const db = c.env.DB
  try {
    const { title } = await c.req.json()
    const result = await db.prepare('INSERT INTO conversations (title) VALUES (?)').bind(title || 'Nueva conversación').run()
    const conv = await db.prepare('SELECT * FROM conversations WHERE id = ?').bind(result.meta.last_row_id).first()
    return c.json({ success: true, data: conv })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// Delete a conversation
chatRoutes.delete('/conversations/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare('DELETE FROM messages WHERE conversation_id = ?').bind(id).run()
    await c.env.DB.prepare('DELETE FROM conversations WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// Send message with optional attachments (images, documents)
chatRoutes.post('/send', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const { conversation_id, message, attachments } = body
  // attachments: [{ type: 'image/png', data: 'base64...', name: 'foto.png' }]

  if ((!message && (!attachments || !attachments.length)) || !conversation_id) {
    return c.json({ success: false, error: 'Faltan datos' }, 400)
  }

  try {
    const hasAttachments = attachments && attachments.length > 0
    const attachmentTypes = hasAttachments ? attachments.map((a: any) => a.type || '') : []
    const hasImages = hasAttachments && attachmentTypes.some((t: string) => t.startsWith('image/'))

    // 1. Save user message
    const attachInfo = hasAttachments
      ? attachments.map((a: any) => {
          const icon = a.type?.startsWith('image/') ? '🖼️' : '📄'
          return `${icon} ${a.name}`
        }).join(', ')
      : ''
    const savedContent = message + (attachInfo ? `\n[${attachInfo}]` : '')
    
    // Save user message with attachment metadata
    const attachMeta = hasAttachments
      ? JSON.stringify(attachments.map((a: any) => ({ name: a.name, type: a.type, size: Math.round((a.data?.length || 0) * 0.75) })))
      : null
    
    await db.prepare('INSERT INTO messages (conversation_id, role, content, actions_taken) VALUES (?, ?, ?, ?)')
      .bind(conversation_id, 'user', savedContent, attachMeta).run()

    // 2. Classify message
    const classification = await classifyMessage(
      message || (hasImages ? 'Analizá esta imagen' : 'Analizá este documento'),
      hasAttachments,
      attachmentTypes,
      c.env
    )

    // 3. Build conversation history (last 15 messages, text only for context)
    const history = await db.prepare(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 15'
    ).bind(conversation_id).all()

    let chatMessages: any[] = (history.results || []).reverse().map((m: any) => ({
      role: m.role, content: m.content
    }))

    // 4. If there are attachments, replace the last user message with vision format
    if (hasAttachments) {
      chatMessages.pop() // remove the text-only version
      const visionMsgs = buildVisionMessages(
        message || (hasImages ? 'Analizá esta imagen y decime qué ves. Sé detallista y útil.' : 'Analizá este documento y extraé la información más importante.'),
        attachments
      )
      chatMessages.push(...visionMsgs)
    }

    // 5. Get CRM context
    const crmContext = await getCrmSummary(db)

    // 6. Get AI response
    const aiResponse = await chatWithSoraLella(
      chatMessages, crmContext, c.env,
      classification.complexity, hasImages,
      hasAttachments ? attachments : undefined,
      classification.suggested_model
    )

    // 7. Parse CRM actions
    const { cleanResponse, actions } = parseCrmActions(aiResponse.content)

    // 8. Execute CRM actions
    let actionResults: string[] = []
    if (actions.length > 0) actionResults = await executeCrmActions(db, actions)

    // 9. Save to gallery if material was generated
    let galleryId: number | null = null
    if (aiResponse.materialType || aiResponse.imageUrl) {
      try {
        // Extract HTML from response if material
        let htmlContent: string | undefined
        const htmlMatch = cleanResponse.match(/```html\s*([\s\S]*?)```/)
        if (htmlMatch) htmlContent = htmlMatch[1].trim()

        galleryId = await saveToGallery(db, {
          title: (message || 'Material generado').substring(0, 100),
          description: aiResponse.materialType || 'imagen',
          image_url: aiResponse.imageUrl,
          html_content: htmlContent,
          material_type: aiResponse.materialType || 'image',
          conversation_id,
          prompt_used: message
        })
      } catch (e) { console.error('Gallery save error:', e) }
    }

    // 10. Save assistant message
    const modelInfo = `${aiResponse.provider}/${aiResponse.model}`
    await db.prepare(
      'INSERT INTO messages (conversation_id, role, content, model_used, tokens_used, actions_taken) VALUES (?,?,?,?,?,?)'
    ).bind(
      conversation_id, 'assistant', cleanResponse,
      modelInfo, aiResponse.tokens,
      actionResults.length > 0 ? JSON.stringify(actionResults) : null
    ).run()

    // If there's a generated image, save it as a separate message
    if (aiResponse.imageUrl) {
      await db.prepare(
        'INSERT INTO messages (conversation_id, role, content, model_used) VALUES (?,?,?,?)'
      ).bind(conversation_id, 'assistant', `![imagen generada](${aiResponse.imageUrl})`, `${aiResponse.model}/image`).run()
    }

    // 11. Update conversation
    await db.prepare('UPDATE conversations SET message_count = message_count + 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(conversation_id).run()

    // Auto-title
    const conv = await db.prepare('SELECT message_count FROM conversations WHERE id = ?').bind(conversation_id).first() as any
    if (conv && conv.message_count <= 3) {
      const title = (message || 'Imagen/Documento').substring(0, 60) + ((message || '').length > 60 ? '...' : '')
      await db.prepare('UPDATE conversations SET title = ? WHERE id = ?').bind(title, conversation_id).run()
    }

    return c.json({
      success: true,
      data: {
        response: cleanResponse,
        model: aiResponse.model,
        provider: aiResponse.provider,
        tokens: aiResponse.tokens,
        imageUrl: aiResponse.imageUrl || null,
        materialType: aiResponse.materialType || null,
        galleryId,
        actions: actionResults,
        classification
      }
    })
  } catch (e: any) {
    console.error('Chat error:', e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== VOICE MESSAGE (Whisper + AI + TTS) ==========

chatRoutes.post('/voice', async (c) => {
  const db = c.env.DB
  const body = await c.req.json()
  const { conversation_id, audio_data, audio_type, text_with_audio } = body
  // audio_data: base64 encoded audio
  // audio_type: 'audio/webm', 'audio/mp4', etc.
  // text_with_audio: optional text to send along with audio

  if (!audio_data || !conversation_id) {
    return c.json({ success: false, error: 'Faltan datos de audio' }, 400)
  }

  const openai = c.env.OPENAI_API_KEY
  const baseUrl = c.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

  if (!openai) {
    return c.json({ success: false, error: 'OpenAI API key necesaria para audio' }, 400)
  }

  try {
    // Step 1: Transcribe audio with Whisper
    const transcription = await transcribeAudio(
      audio_data,
      audio_type || 'audio/webm',
      openai,
      baseUrl
    )

    if (!transcription.text || transcription.text.trim().length < 2) {
      return c.json({ success: false, error: 'No se pudo reconocer el audio. Intentá hablar más fuerte o claro.' }, 400)
    }

    const userMessage = text_with_audio
      ? `${text_with_audio}\n\n[Mensaje de voz]: ${transcription.text}`
      : transcription.text

    // Step 2: Save user message (as voice)
    await db.prepare('INSERT INTO messages (conversation_id, role, content, actions_taken) VALUES (?, ?, ?, ?)')
      .bind(conversation_id, 'user', `🎙️ ${userMessage}`, JSON.stringify({ type: 'voice', duration: transcription.duration, language: transcription.language })).run()

    // Step 3: Classify and process with Sora Lella
    const classification = await classifyMessage(userMessage, false, [], c.env)

    const history = await db.prepare(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 15'
    ).bind(conversation_id).all()

    const chatMessages = (history.results || []).reverse().map((m: any) => ({
      role: m.role, content: m.content
    }))

    const crmContext = await getCrmSummary(db)

    const aiResponse = await chatWithSoraLella(
      chatMessages, crmContext, c.env,
      classification.complexity, false,
      undefined,
      classification.suggested_model
    )

    // Step 4: Parse CRM actions
    const { cleanResponse, actions } = parseCrmActions(aiResponse.content)

    let actionResults: string[] = []
    if (actions.length > 0) actionResults = await executeCrmActions(db, actions)

    // Step 5: Save to gallery if material was generated
    let galleryId: number | null = null
    if (aiResponse.materialType || aiResponse.imageUrl) {
      try {
        let htmlContent: string | undefined
        const htmlMatch = cleanResponse.match(/```html\s*([\s\S]*?)```/)
        if (htmlMatch) htmlContent = htmlMatch[1].trim()

        galleryId = await saveToGallery(db, {
          title: (userMessage).substring(0, 100),
          description: aiResponse.materialType || 'imagen',
          image_url: aiResponse.imageUrl,
          html_content: htmlContent,
          material_type: aiResponse.materialType || 'image',
          conversation_id,
          prompt_used: userMessage
        })
      } catch (e) { console.error('Gallery save error:', e) }
    }

    // Step 6: Save assistant message
    const modelInfo = `${aiResponse.provider}/${aiResponse.model}`
    await db.prepare(
      'INSERT INTO messages (conversation_id, role, content, model_used, tokens_used, actions_taken) VALUES (?,?,?,?,?,?)'
    ).bind(
      conversation_id, 'assistant', cleanResponse,
      modelInfo, aiResponse.tokens,
      actionResults.length > 0 ? JSON.stringify(actionResults) : null
    ).run()

    // Step 7: Generate TTS response audio
    let audioResponse: { audioBase64: string; contentType: string } | null = null
    try {
      audioResponse = await textToSpeech(cleanResponse, openai, baseUrl, 'nova', 'tts-1', 1.0)
    } catch (ttsError: any) {
      console.error('TTS error (non-fatal):', ttsError.message)
      // TTS failure is non-fatal, we still return the text response
    }

    // Step 8: Update conversation
    await db.prepare('UPDATE conversations SET message_count = message_count + 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(conversation_id).run()

    // Auto-title
    const conv = await db.prepare('SELECT message_count FROM conversations WHERE id = ?').bind(conversation_id).first() as any
    if (conv && conv.message_count <= 3) {
      const title = '🎙️ ' + userMessage.substring(0, 55) + (userMessage.length > 55 ? '...' : '')
      await db.prepare('UPDATE conversations SET title = ? WHERE id = ?').bind(title, conversation_id).run()
    }

    return c.json({
      success: true,
      data: {
        transcription: transcription.text,
        transcription_language: transcription.language,
        transcription_duration: transcription.duration,
        response: cleanResponse,
        model: aiResponse.model,
        provider: aiResponse.provider,
        tokens: aiResponse.tokens,
        imageUrl: aiResponse.imageUrl || null,
        materialType: aiResponse.materialType || null,
        galleryId,
        actions: actionResults,
        classification,
        // TTS audio response
        audio: audioResponse ? {
          data: audioResponse.audioBase64,
          contentType: audioResponse.contentType
        } : null
      }
    })
  } catch (e: any) {
    console.error('Voice processing error:', e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== TTS ONLY (Convert text to speech) ==========

chatRoutes.post('/tts', async (c) => {
  const body = await c.req.json()
  const { text, voice, speed } = body

  if (!text) {
    return c.json({ success: false, error: 'Falta texto para convertir' }, 400)
  }

  const openai = c.env.OPENAI_API_KEY
  const baseUrl = c.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

  if (!openai) {
    return c.json({ success: false, error: 'OpenAI API key necesaria para TTS' }, 400)
  }

  try {
    const result = await textToSpeech(
      text, openai, baseUrl,
      voice || 'nova',
      'tts-1',
      speed || 1.0
    )

    return c.json({
      success: true,
      data: {
        audio: result.audioBase64,
        contentType: result.contentType
      }
    })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========== MEDIA GALLERY ==========

chatRoutes.get('/gallery', async (c) => {
  const db = c.env.DB
  const type = c.req.query('type')
  try {
    let query = 'SELECT * FROM media_gallery ORDER BY created_at DESC LIMIT 50'
    if (type) {
      query = `SELECT * FROM media_gallery WHERE material_type = '${type}' ORDER BY created_at DESC LIMIT 50`
    }
    const result = await db.prepare(query).all()
    return c.json({ success: true, data: result.results })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

chatRoutes.get('/gallery/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const item = await c.env.DB.prepare('SELECT * FROM media_gallery WHERE id = ?').bind(id).first()
    return c.json({ success: true, data: item })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

chatRoutes.delete('/gallery/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await c.env.DB.prepare('DELETE FROM media_gallery WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})
