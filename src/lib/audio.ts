// Audio Processing Module v1.0 - Whisper Transcription + TTS Response
// OpenAI Whisper (speech-to-text) + OpenAI TTS (text-to-speech)

// ========== TYPES ==========

export interface TranscriptionResult {
  text: string
  language?: string
  duration?: number
}

export interface TTSResult {
  audioBase64: string
  contentType: string
}

// ========== WHISPER TRANSCRIPTION ==========
// Receives audio as base64, sends to OpenAI Whisper API, returns text

export async function transcribeAudio(
  audioBase64: string,
  audioMimeType: string,
  apiKey: string,
  baseUrl: string = 'https://api.openai.com/v1'
): Promise<TranscriptionResult> {
  // Convert base64 to binary
  const binaryString = atob(audioBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Determine file extension from mime type
  const extMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/ogg': 'ogg',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/m4a': 'm4a',
    'audio/x-m4a': 'm4a'
  }
  const ext = extMap[audioMimeType.toLowerCase()] || 'webm'

  // Build multipart form data manually (no FormData with File in Workers)
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2)
  
  // Build the multipart body
  const parts: Uint8Array[] = []
  const encoder = new TextEncoder()

  // File part
  parts.push(encoder.encode(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="audio.${ext}"\r\n` +
    `Content-Type: ${audioMimeType}\r\n\r\n`
  ))
  parts.push(bytes)
  parts.push(encoder.encode('\r\n'))

  // Model part
  parts.push(encoder.encode(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model"\r\n\r\n` +
    `whisper-1\r\n`
  ))

  // Language hint (Spanish)
  parts.push(encoder.encode(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="language"\r\n\r\n` +
    `es\r\n`
  ))

  // Prompt for better accuracy with domain-specific terms
  parts.push(encoder.encode(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="prompt"\r\n\r\n` +
    `Peperoncino Pasta Lab, Sora Lella, Mirko Montani, ravioles, sorrentinos, capeletinis, agnolotti, tortellini, Traslasierra, Córdoba\r\n`
  ))

  // Response format
  parts.push(encoder.encode(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
    `verbose_json\r\n`
  ))

  // End boundary
  parts.push(encoder.encode(`--${boundary}--\r\n`))

  // Combine all parts
  let totalLength = 0
  for (const part of parts) totalLength += part.length
  const body = new Uint8Array(totalLength)
  let offset = 0
  for (const part of parts) {
    body.set(part, offset)
    offset += part.length
  }

  const res = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Whisper error ${res.status}: ${errorText}`)
  }

  const data = await res.json() as any

  return {
    text: data.text || '',
    language: data.language || 'es',
    duration: data.duration || 0
  }
}

// ========== TEXT-TO-SPEECH ==========
// Converts Sora Lella's text response to spoken audio

export async function textToSpeech(
  text: string,
  apiKey: string,
  baseUrl: string = 'https://api.openai.com/v1',
  voice: string = 'nova', // nova = warm female voice, perfect for Sora Lella
  model: string = 'tts-1',
  speed: number = 1.0
): Promise<TTSResult> {
  // Truncate very long texts for TTS (max ~4096 chars)
  const maxChars = 4000
  let ttsText = text

  // Remove markdown formatting for cleaner speech
  ttsText = ttsText
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/<crm_actions>[\s\S]*?<\/crm_actions>/g, '') // Remove CRM actions
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold → plain
    .replace(/\*(.*?)\*/g, '$1') // Italic → plain
    .replace(/#{1,6}\s/g, '') // Remove heading markers
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image markdown
    .replace(/\[.*?\]\(.*?\)/g, (match) => match.replace(/\[|\]|\(.*?\)/g, '')) // Links → text only
    .replace(/\|.*\|/g, '') // Remove table rows
    .replace(/[-*+]\s/g, '• ') // List markers → bullet
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim()

  if (ttsText.length > maxChars) {
    ttsText = ttsText.substring(0, maxChars) + '...'
  }

  // Skip TTS if text is too short or empty after cleanup
  if (ttsText.length < 5) {
    throw new Error('Texto demasiado corto para generar audio')
  }

  const res = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: ttsText,
      voice,
      response_format: 'mp3',
      speed
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`TTS error ${res.status}: ${errorText}`)
  }

  // Convert response to base64
  const audioBuffer = await res.arrayBuffer()
  const uint8Array = new Uint8Array(audioBuffer)
  
  // Manual base64 encoding (btoa doesn't work with large binary in Workers)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  const audioBase64 = btoa(binary)

  return {
    audioBase64,
    contentType: 'audio/mpeg'
  }
}
