import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { apiRoutes } from './routes/api'
import { chatRoutes } from './routes/chat'
import { crmRoutes } from './routes/crm'
import { mainPage } from './pages/main'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY: string
  OPENAI_BASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// API Routes
app.route('/api', apiRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/crm', crmRoutes)

// Main page
app.get('/', mainPage)

// Catch-all for SPA
app.get('/*', mainPage)

export default app
