// Main Page - Peperoncino Pasta Lab - Sora Lella Interface
import type { Context } from 'hono'

export const mainPage = (c: Context) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Peperoncino Pasta Lab - Sora Lella</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            pepper: { 50:'#fef2f2', 100:'#fee2e2', 200:'#fecaca', 300:'#fca5a5', 400:'#f87171', 500:'#b91c1c', 600:'#991b1b', 700:'#7f1d1d', 800:'#5c1414', 900:'#3b0d0d' },
            cream: { 50:'#fffdf7', 100:'#fefcf0', 200:'#fdf7e1', 300:'#faf0c8', 400:'#f7e8a8' },
            olive: { 50:'#f7f9f2', 100:'#e8efd8', 200:'#d4e1b5', 300:'#b8cf85', 400:'#9ab85a', 500:'#6b8e23' },
            wood: { 100:'#f5f0e8', 200:'#e8dcc8', 300:'#d4c4a8', 400:'#b8a07a', 500:'#8b7355' }
          },
          fontFamily: {
            display: ['Playfair Display', 'serif'],
            body: ['Inter', 'sans-serif'],
            italian: ['Crimson Text', 'serif']
          }
        }
      }
    }
  </script>
  <style>
    body { background: #fffdf7; }
    .chat-container { height: calc(100vh - 200px); }
    @media (min-width: 1024px) { .chat-container { height: calc(100vh - 140px); } }
    .msg-user { background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); }
    .msg-assistant { background: linear-gradient(135deg, #fffdf7 0%, #fefcf0 100%); border: 1px solid #e8dcc8; }
    .sidebar-item { transition: all 0.2s; }
    .sidebar-item:hover { background: #fef2f2; transform: translateX(4px); }
    .sidebar-item.active { background: #fee2e2; border-left: 3px solid #b91c1c; }
    .crm-card { transition: all 0.3s; border: 1px solid #e8dcc8; }
    .crm-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139,115,85,0.15); }
    .typing-dot { animation: blink 1.4s both infinite; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #d4c4a8; border-radius: 3px; }
    .markdown-body h1,.markdown-body h2,.markdown-body h3 { font-family: 'Playfair Display',serif; color: #7f1d1d; margin: 0.5em 0 0.3em; }
    .markdown-body h1 { font-size: 1.3em; } .markdown-body h2 { font-size: 1.15em; } .markdown-body h3 { font-size: 1.05em; }
    .markdown-body ul,.markdown-body ol { padding-left: 1.2em; margin: 0.3em 0; }
    .markdown-body li { margin: 0.15em 0; }
    .markdown-body p { margin: 0.4em 0; }
    .markdown-body table { border-collapse: collapse; margin: 0.5em 0; width: 100%; font-size: 0.9em; }
    .markdown-body th { background: #b91c1c; color: white; padding: 6px 10px; text-align: left; }
    .markdown-body td { border: 1px solid #e8dcc8; padding: 5px 10px; }
    .markdown-body tr:nth-child(even) { background: #fefcf0; }
    .markdown-body code { background: #f5f0e8; padding: 1px 4px; border-radius: 3px; font-size: 0.9em; }
    .markdown-body strong { color: #991b1b; }
    .modal-overlay { background: rgba(59,13,13,0.4); backdrop-filter: blur(4px); }
    .nav-tab { position: relative; }
    .nav-tab.active::after { content:''; position:absolute; bottom:-2px; left:10%; width:80%; height:3px; background:#b91c1c; border-radius:2px; }
    .action-badge { animation: popIn 0.4s ease; }
    @keyframes popIn { from{transform:scale(0)} to{transform:scale(1)} }
  </style>
</head>
<body class="bg-cream-50 font-body text-gray-800 overflow-hidden h-screen">

<!-- HEADER -->
<header class="bg-white border-b border-wood-200 px-4 py-2 flex items-center justify-between shadow-sm z-50 relative">
  <div class="flex items-center gap-3">
    <button id="menuBtn" class="lg:hidden text-pepper-500 text-xl"><i class="fas fa-bars"></i></button>
    <img src="/static/logo.png" alt="Peperoncino" class="h-10 w-10 object-contain">
    <div>
      <h1 class="font-display text-pepper-600 text-lg font-bold leading-tight">Peperoncino Pasta Lab</h1>
      <p class="text-xs text-wood-500 font-italian italic">Traslasierra, Córdoba</p>
    </div>
  </div>
  <div class="flex items-center gap-2">
    <div class="hidden md:flex items-center bg-cream-100 rounded-full px-3 py-1.5">
      <i class="fas fa-search text-wood-400 text-sm mr-2"></i>
      <input id="globalSearch" type="text" placeholder="Buscar..." class="bg-transparent text-sm outline-none w-40" />
    </div>
    <div class="flex items-center gap-1 bg-olive-50 px-3 py-1.5 rounded-full">
      <span class="w-2 h-2 bg-olive-400 rounded-full animate-pulse"></span>
      <span class="text-xs text-olive-500 font-medium">Sora Lella</span>
    </div>
  </div>
</header>

<!-- MAIN LAYOUT -->
<div class="flex h-[calc(100vh-52px)]">

  <!-- SIDEBAR -->
  <aside id="sidebar" class="w-64 bg-white border-r border-wood-200 flex-shrink-0 flex flex-col z-40 fixed lg:relative lg:translate-x-0 -translate-x-full transition-transform duration-300 h-[calc(100vh-52px)]">
    <!-- Nav Tabs -->
    <div class="flex border-b border-wood-200">
      <button onclick="switchView('chat')" class="nav-tab active flex-1 py-3 text-center text-sm font-medium text-pepper-600" data-view="chat">
        <i class="fas fa-comments mr-1"></i> Chat
      </button>
      <button onclick="switchView('crm')" class="nav-tab flex-1 py-3 text-center text-sm font-medium text-wood-500" data-view="crm">
        <i class="fas fa-briefcase mr-1"></i> CRM
      </button>
    </div>

    <!-- Chat Sidebar -->
    <div id="chatSidebar" class="flex-1 overflow-y-auto p-3">
      <button onclick="newConversation()" class="w-full bg-pepper-500 text-white rounded-lg py-2.5 px-4 text-sm font-medium hover:bg-pepper-600 transition mb-3 flex items-center justify-center gap-2">
        <i class="fas fa-plus"></i> Nueva conversación
      </button>
      <div id="conversationList" class="space-y-1"></div>
    </div>

    <!-- CRM Sidebar -->
    <div id="crmSidebar" class="flex-1 overflow-y-auto p-3 hidden">
      <div class="space-y-1">
        <button onclick="showCrmPanel('dashboard')" class="sidebar-item active w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5" data-panel="dashboard">
          <i class="fas fa-chart-line text-pepper-500 w-5"></i> Dashboard
        </button>
        <button onclick="showCrmPanel('products')" class="sidebar-item w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5" data-panel="products">
          <i class="fas fa-box text-amber-600 w-5"></i> Productos
        </button>
        <button onclick="showCrmPanel('recipes')" class="sidebar-item w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5" data-panel="recipes">
          <i class="fas fa-book-open text-olive-500 w-5"></i> Recetas
        </button>
        <button onclick="showCrmPanel('clients')" class="sidebar-item w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5" data-panel="clients">
          <i class="fas fa-users text-blue-500 w-5"></i> Clientes
        </button>
        <button onclick="showCrmPanel('orders')" class="sidebar-item w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5" data-panel="orders">
          <i class="fas fa-shopping-cart text-green-600 w-5"></i> Pedidos
        </button>
        <button onclick="showCrmPanel('offers')" class="sidebar-item w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5" data-panel="offers">
          <i class="fas fa-tags text-purple-500 w-5"></i> Ofertas
        </button>
        <button onclick="showCrmPanel('ingredients')" class="sidebar-item w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5" data-panel="ingredients">
          <i class="fas fa-leaf text-green-500 w-5"></i> Ingredientes
        </button>
        <button onclick="showCrmPanel('notes')" class="sidebar-item w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5" data-panel="notes">
          <i class="fas fa-sticky-note text-yellow-500 w-5"></i> Notas
        </button>
      </div>
    </div>

    <!-- Mirko info -->
    <div class="p-3 border-t border-wood-200 bg-cream-50">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-pepper-500 flex items-center justify-center text-white font-bold text-sm">M</div>
        <div>
          <p class="text-sm font-medium">Mirko Montani</p>
          <p class="text-xs text-wood-500">Chef & Fundador</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- OVERLAY for mobile sidebar -->
  <div id="sidebarOverlay" class="fixed inset-0 bg-black/30 z-30 hidden lg:hidden" onclick="closeSidebar()"></div>

  <!-- MAIN CONTENT -->
  <main class="flex-1 flex flex-col overflow-hidden">

    <!-- CHAT VIEW -->
    <div id="chatView" class="flex-1 flex flex-col">
      <!-- Messages -->
      <div id="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4">
        <!-- Welcome screen -->
        <div id="welcomeScreen" class="flex flex-col items-center justify-center h-full text-center">
          <img src="/static/logo.png" alt="Peperoncino" class="h-24 w-24 object-contain mb-4 opacity-80">
          <h2 class="font-display text-3xl text-pepper-600 mb-2">Ciao, Mirko!</h2>
          <p class="font-italian text-xl italic text-wood-500 mb-6">Soy Sora Lella, tu asistente personal</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <button onclick="sendQuickMessage('¿Cómo van las ventas de este mes?')" class="crm-card bg-white rounded-xl p-4 text-left hover:border-pepper-300">
              <i class="fas fa-chart-line text-pepper-400 mb-2"></i>
              <p class="text-sm font-medium">¿Cómo van las ventas?</p>
            </button>
            <button onclick="sendQuickMessage('Dame ideas para una oferta de fin de semana')" class="crm-card bg-white rounded-xl p-4 text-left hover:border-pepper-300">
              <i class="fas fa-lightbulb text-amber-400 mb-2"></i>
              <p class="text-sm font-medium">Ideas para ofertas</p>
            </button>
            <button onclick="sendQuickMessage('Quiero crear una receta nueva de ravioles')" class="crm-card bg-white rounded-xl p-4 text-left hover:border-pepper-300">
              <i class="fas fa-utensils text-olive-400 mb-2"></i>
              <p class="text-sm font-medium">Nueva receta</p>
            </button>
            <button onclick="sendQuickMessage('Estoy un poco bajón hoy, necesito motivación')" class="crm-card bg-white rounded-xl p-4 text-left hover:border-pepper-300">
              <i class="fas fa-heart text-pink-400 mb-2"></i>
              <p class="text-sm font-medium">Necesito motivación</p>
            </button>
          </div>
        </div>
        <!-- Messages will be rendered here -->
        <div id="messagesList" class="max-w-3xl mx-auto space-y-4 hidden"></div>
      </div>

      <!-- Input area -->
      <div class="border-t border-wood-200 bg-white px-4 py-3">
        <div class="max-w-3xl mx-auto">
          <div class="flex items-end gap-2">
            <div class="flex-1 relative">
              <textarea id="chatInput" rows="1" placeholder="Hablá con Sora Lella..."
                class="w-full resize-none bg-cream-50 border border-wood-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-pepper-400 focus:ring-1 focus:ring-pepper-200 transition"
                onkeydown="handleInputKey(event)" oninput="autoResize(this)"></textarea>
            </div>
            <button id="sendBtn" onclick="sendMessage()"
              class="bg-pepper-500 text-white rounded-full w-11 h-11 flex items-center justify-center hover:bg-pepper-600 transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <i class="fas fa-paper-plane text-sm"></i>
            </button>
          </div>
          <p class="text-xs text-wood-400 mt-1.5 text-center">Sora Lella puede cometer errores. Verificá la información importante.</p>
        </div>
      </div>
    </div>

    <!-- CRM VIEW -->
    <div id="crmView" class="flex-1 overflow-y-auto hidden">
      <!-- Dashboard -->
      <div id="panel-dashboard" class="crm-panel p-4 lg:p-6">
        <h2 class="font-display text-2xl text-pepper-700 mb-4">Dashboard</h2>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6" id="dashboardCards"></div>
        <div class="bg-white rounded-xl border border-wood-200 p-4">
          <h3 class="font-display text-lg text-pepper-600 mb-3">Actividad Reciente</h3>
          <div id="activityList" class="space-y-2"></div>
        </div>
      </div>

      <!-- Products -->
      <div id="panel-products" class="crm-panel p-4 lg:p-6 hidden">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-pepper-700">Productos</h2>
          <button onclick="showProductModal()" class="bg-pepper-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-pepper-600 transition">
            <i class="fas fa-plus mr-1"></i> Nuevo
          </button>
        </div>
        <div id="productsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </div>

      <!-- Recipes -->
      <div id="panel-recipes" class="crm-panel p-4 lg:p-6 hidden">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-pepper-700">Recetas</h2>
          <button onclick="showRecipeModal()" class="bg-pepper-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-pepper-600 transition">
            <i class="fas fa-plus mr-1"></i> Nueva
          </button>
        </div>
        <div id="recipesList" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
      </div>

      <!-- Clients -->
      <div id="panel-clients" class="crm-panel p-4 lg:p-6 hidden">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-pepper-700">Clientes</h2>
          <button onclick="showClientModal()" class="bg-pepper-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-pepper-600 transition">
            <i class="fas fa-plus mr-1"></i> Nuevo
          </button>
        </div>
        <div id="clientsList" class="space-y-3"></div>
      </div>

      <!-- Orders -->
      <div id="panel-orders" class="crm-panel p-4 lg:p-6 hidden">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-pepper-700">Pedidos</h2>
          <button onclick="showOrderModal()" class="bg-pepper-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-pepper-600 transition">
            <i class="fas fa-plus mr-1"></i> Nuevo
          </button>
        </div>
        <div id="ordersList" class="space-y-3"></div>
      </div>

      <!-- Offers -->
      <div id="panel-offers" class="crm-panel p-4 lg:p-6 hidden">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-pepper-700">Ofertas</h2>
          <button onclick="showOfferModal()" class="bg-pepper-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-pepper-600 transition">
            <i class="fas fa-plus mr-1"></i> Nueva
          </button>
        </div>
        <div id="offersList" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
      </div>

      <!-- Ingredients -->
      <div id="panel-ingredients" class="crm-panel p-4 lg:p-6 hidden">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-pepper-700">Ingredientes</h2>
          <button onclick="showIngredientModal()" class="bg-pepper-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-pepper-600 transition">
            <i class="fas fa-plus mr-1"></i> Nuevo
          </button>
        </div>
        <div id="ingredientsList" class="space-y-2"></div>
      </div>

      <!-- Notes -->
      <div id="panel-notes" class="crm-panel p-4 lg:p-6 hidden">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-2xl text-pepper-700">Notas</h2>
          <button onclick="showNoteModal()" class="bg-pepper-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-pepper-600 transition">
            <i class="fas fa-plus mr-1"></i> Nueva
          </button>
        </div>
        <div id="notesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"></div>
      </div>
    </div>
  </main>
</div>

<!-- MODAL CONTAINER -->
<div id="modalOverlay" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4">
  <div id="modalContent" class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"></div>
</div>

<script>
// ========== STATE ==========
let currentConversationId = null;
let currentView = 'chat';
let currentPanel = 'dashboard';
let conversations = [];
let isLoading = false;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  loadConversations();
  document.getElementById('chatInput').addEventListener('input', function() {
    document.getElementById('sendBtn').disabled = !this.value.trim();
  });
  document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
});

// ========== SIDEBAR ==========
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  s.classList.toggle('-translate-x-full');
  o.classList.toggle('hidden');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.add('-translate-x-full');
  document.getElementById('sidebarOverlay').classList.add('hidden');
}

// ========== VIEW SWITCHING ==========
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === view);
    t.classList.toggle('text-pepper-600', t.dataset.view === view);
    t.classList.toggle('text-wood-500', t.dataset.view !== view);
  });
  document.getElementById('chatSidebar').classList.toggle('hidden', view !== 'chat');
  document.getElementById('crmSidebar').classList.toggle('hidden', view !== 'crm');
  document.getElementById('chatView').classList.toggle('hidden', view !== 'chat');
  document.getElementById('crmView').classList.toggle('hidden', view !== 'crm');
  if (view === 'crm') loadCrmPanel(currentPanel);
}

function showCrmPanel(panel) {
  currentPanel = panel;
  document.querySelectorAll('.crm-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('panel-' + panel)?.classList.remove('hidden');
  document.querySelectorAll('#crmSidebar .sidebar-item').forEach(i => {
    i.classList.toggle('active', i.dataset.panel === panel);
  });
  loadCrmPanel(panel);
  closeSidebar();
}

// ========== CONVERSATIONS ==========
async function loadConversations() {
  try {
    const res = await fetch('/api/chat/conversations');
    const data = await res.json();
    if (data.success) {
      conversations = data.data || [];
      renderConversations();
    }
  } catch (e) { console.error(e); }
}

function renderConversations() {
  const list = document.getElementById('conversationList');
  if (!conversations.length) {
    list.innerHTML = '<p class="text-xs text-wood-400 text-center py-4 italic">Sin conversaciones aún</p>';
    return;
  }
  list.innerHTML = conversations.map(c => \`
    <button onclick="selectConversation(\${c.id})" 
      class="sidebar-item w-full text-left px-3 py-2.5 rounded-lg group \${c.id === currentConversationId ? 'active' : ''}"
      data-id="\${c.id}">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <p class="text-sm truncate">\${c.title || 'Nueva conversación'}</p>
          <p class="text-xs text-wood-400">\${c.message_count || 0} mensajes</p>
        </div>
        <button onclick="event.stopPropagation();deleteConversation(\${c.id})" class="opacity-0 group-hover:opacity-100 text-wood-400 hover:text-pepper-500 p-1">
          <i class="fas fa-trash text-xs"></i>
        </button>
      </div>
    </button>
  \`).join('');
}

async function newConversation() {
  try {
    const res = await fetch('/api/chat/conversations', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title: 'Nueva conversación' })
    });
    const data = await res.json();
    if (data.success) {
      currentConversationId = data.data.id;
      await loadConversations();
      showChat();
    }
  } catch (e) { console.error(e); }
}

async function selectConversation(id) {
  currentConversationId = id;
  renderConversations();
  await loadMessages(id);
  closeSidebar();
}

async function deleteConversation(id) {
  if (!confirm('¿Eliminar esta conversación?')) return;
  try {
    await fetch('/api/chat/conversations/' + id, { method: 'DELETE' });
    if (currentConversationId === id) { currentConversationId = null; showWelcome(); }
    await loadConversations();
  } catch (e) { console.error(e); }
}

// ========== MESSAGES ==========
async function loadMessages(convId) {
  try {
    const res = await fetch('/api/chat/conversations/' + convId + '/messages');
    const data = await res.json();
    if (data.success) renderMessages(data.data || []);
  } catch (e) { console.error(e); }
}

function showWelcome() {
  document.getElementById('welcomeScreen').classList.remove('hidden');
  document.getElementById('messagesList').classList.add('hidden');
}

function showChat() {
  document.getElementById('welcomeScreen').classList.add('hidden');
  document.getElementById('messagesList').classList.remove('hidden');
  document.getElementById('messagesList').innerHTML = '';
}

function renderMessages(messages) {
  document.getElementById('welcomeScreen').classList.add('hidden');
  const list = document.getElementById('messagesList');
  list.classList.remove('hidden');
  list.innerHTML = messages.filter(m => m.role !== 'system').map(m => createMessageHtml(m)).join('');
  scrollToBottom();
}

function createMessageHtml(msg) {
  if (msg.role === 'user') {
    return \`<div class="flex justify-end fade-in">
      <div class="msg-user rounded-2xl rounded-br-md px-4 py-3 max-w-[85%] text-white text-sm shadow-md">
        \${escapeHtml(msg.content)}
      </div>
    </div>\`;
  }
  const html = typeof marked !== 'undefined' ? marked.parse(msg.content) : msg.content;
  let actionsHtml = '';
  if (msg.actions_taken) {
    try {
      const actions = JSON.parse(msg.actions_taken);
      if (actions.length) {
        actionsHtml = '<div class="mt-2 space-y-1">' + actions.map(a => \`<div class="action-badge text-xs bg-olive-50 text-olive-500 rounded-full px-2.5 py-1 inline-block mr-1">\${a}</div>\`).join('') + '</div>';
      }
    } catch(e) {}
  }
  return \`<div class="flex justify-start fade-in">
    <div class="flex gap-2.5 max-w-[85%]">
      <div class="w-8 h-8 rounded-full bg-pepper-100 flex items-center justify-center flex-shrink-0 mt-1">
        <span class="text-sm">🌶️</span>
      </div>
      <div>
        <div class="msg-assistant rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm markdown-body">\${html}</div>
        \${actionsHtml}
        <p class="text-xs text-wood-400 mt-1">\${msg.model_used ? msg.model_used : ''}</p>
      </div>
    </div>
  </div>\`;
}

function addTypingIndicator() {
  const list = document.getElementById('messagesList');
  list.insertAdjacentHTML('beforeend', \`
    <div id="typingIndicator" class="flex justify-start fade-in">
      <div class="flex gap-2.5">
        <div class="w-8 h-8 rounded-full bg-pepper-100 flex items-center justify-center flex-shrink-0">
          <span class="text-sm">🌶️</span>
        </div>
        <div class="msg-assistant rounded-2xl px-4 py-3 shadow-sm">
          <div class="flex gap-1.5">
            <span class="typing-dot w-2 h-2 bg-wood-400 rounded-full inline-block"></span>
            <span class="typing-dot w-2 h-2 bg-wood-400 rounded-full inline-block"></span>
            <span class="typing-dot w-2 h-2 bg-wood-400 rounded-full inline-block"></span>
          </div>
        </div>
      </div>
    </div>
  \`);
  scrollToBottom();
}

function removeTypingIndicator() {
  document.getElementById('typingIndicator')?.remove();
}

// ========== SEND MESSAGE ==========
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg || isLoading) return;

  // Create conversation if needed
  if (!currentConversationId) {
    await newConversation();
  }

  isLoading = true;
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;

  // Show message
  showChat();
  const list = document.getElementById('messagesList');
  list.insertAdjacentHTML('beforeend', createMessageHtml({ role: 'user', content: msg }));
  addTypingIndicator();

  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ conversation_id: currentConversationId, message: msg })
    });
    const data = await res.json();
    removeTypingIndicator();

    if (data.success) {
      list.insertAdjacentHTML('beforeend', createMessageHtml({
        role: 'assistant', content: data.data.response,
        model_used: data.data.model,
        actions_taken: data.data.actions?.length ? JSON.stringify(data.data.actions) : null
      }));
    } else {
      list.insertAdjacentHTML('beforeend', createMessageHtml({
        role: 'assistant', content: '❌ Error: ' + (data.error || 'No pude procesar tu mensaje'),
        model_used: 'error'
      }));
    }
    scrollToBottom();
    loadConversations();
  } catch (e) {
    removeTypingIndicator();
    list.insertAdjacentHTML('beforeend', createMessageHtml({
      role: 'assistant', content: '❌ Error de conexión. Intentá de nuevo.',
      model_used: 'error'
    }));
  }
  isLoading = false;
}

function sendQuickMessage(msg) {
  document.getElementById('chatInput').value = msg;
  document.getElementById('sendBtn').disabled = false;
  sendMessage();
}

function handleInputKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}
function scrollToBottom() {
  const c = document.getElementById('messagesContainer');
  setTimeout(() => c.scrollTop = c.scrollHeight, 50);
}
function escapeHtml(text) {
  const d = document.createElement('div'); d.textContent = text; return d.innerHTML;
}

// ========== CRM PANELS ==========
async function loadCrmPanel(panel) {
  switch(panel) {
    case 'dashboard': await loadDashboard(); break;
    case 'products': await loadProducts(); break;
    case 'recipes': await loadRecipes(); break;
    case 'clients': await loadClients(); break;
    case 'orders': await loadOrders(); break;
    case 'offers': await loadOffers(); break;
    case 'ingredients': await loadIngredients(); break;
    case 'notes': await loadNotes(); break;
  }
}

async function loadDashboard() {
  try {
    const res = await fetch('/api/crm/dashboard');
    const data = await res.json();
    if (!data.success) return;
    const d = data.data;
    document.getElementById('dashboardCards').innerHTML = \`
      <div class="crm-card bg-white rounded-xl p-4 text-center">
        <i class="fas fa-box text-amber-500 text-2xl mb-2"></i>
        <p class="text-2xl font-bold text-pepper-700">\${d.products}</p>
        <p class="text-xs text-wood-500">Productos</p>
      </div>
      <div class="crm-card bg-white rounded-xl p-4 text-center">
        <i class="fas fa-users text-blue-500 text-2xl mb-2"></i>
        <p class="text-2xl font-bold text-pepper-700">\${d.clients}</p>
        <p class="text-xs text-wood-500">Clientes</p>
      </div>
      <div class="crm-card bg-white rounded-xl p-4 text-center">
        <i class="fas fa-shopping-cart text-green-500 text-2xl mb-2"></i>
        <p class="text-2xl font-bold text-pepper-700">\${d.activeOrders}</p>
        <p class="text-xs text-wood-500">Pedidos activos</p>
      </div>
      <div class="crm-card bg-white rounded-xl p-4 text-center">
        <i class="fas fa-dollar-sign text-emerald-500 text-2xl mb-2"></i>
        <p class="text-2xl font-bold text-pepper-700">$\${Number(d.monthlyRevenue).toLocaleString()}</p>
        <p class="text-xs text-wood-500">Ingreso mensual</p>
      </div>
      <div class="crm-card bg-white rounded-xl p-4 text-center">
        <i class="fas fa-tags text-purple-500 text-2xl mb-2"></i>
        <p class="text-2xl font-bold text-pepper-700">\${d.activeOffers}</p>
        <p class="text-xs text-wood-500">Ofertas activas</p>
      </div>
    \`;
    document.getElementById('activityList').innerHTML = (d.recentActivity || []).map(a => \`
      <div class="flex items-center gap-3 py-2 border-b border-cream-200 last:border-0">
        <div class="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center flex-shrink-0">
          <i class="fas \${getActivityIcon(a.action_type)} text-pepper-400 text-xs"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm truncate">\${a.description || a.action_type}</p>
          <p class="text-xs text-wood-400">\${timeAgo(a.created_at)}</p>
        </div>
      </div>
    \`).join('') || '<p class="text-sm text-wood-400 italic">Sin actividad reciente</p>';
  } catch (e) { console.error(e); }
}

async function loadProducts() {
  try {
    const res = await fetch('/api/crm/products');
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('productsList').innerHTML = (data.data || []).map(p => \`
      <div class="crm-card bg-white rounded-xl p-4">
        <div class="flex items-start justify-between mb-2">
          <span class="text-lg">\${p.category_icon || '🍝'}</span>
          <span class="text-xs px-2 py-0.5 rounded-full \${p.is_active ? 'bg-olive-50 text-olive-500' : 'bg-gray-100 text-gray-400'}">\${p.is_active ? 'Activo' : 'Inactivo'}</span>
        </div>
        <h3 class="font-display font-bold text-pepper-700 text-sm mb-1">\${p.name}</h3>
        <p class="text-xs text-wood-500 mb-2 line-clamp-2">\${p.description || ''}</p>
        <div class="flex items-center justify-between text-xs">
          <span class="text-wood-400">Costo: $\${Number(p.cost_price).toLocaleString()}/\${p.unit}</span>
          <span class="font-bold text-pepper-600">$\${Number(p.sell_price).toLocaleString()}/\${p.unit}</span>
        </div>
        <div class="mt-1 text-xs text-olive-500">Margen: \${Number(p.margin_percent).toFixed(1)}%</div>
      </div>
    \`).join('') || '<p class="text-wood-400 italic col-span-3">Sin productos aún</p>';
  } catch (e) { console.error(e); }
}

async function loadRecipes() {
  try {
    const res = await fetch('/api/crm/recipes');
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('recipesList').innerHTML = (data.data || []).map(r => \`
      <div class="crm-card bg-white rounded-xl p-4 cursor-pointer" onclick="viewRecipe(\${r.id})">
        <div class="flex items-center gap-2 mb-2">
          <i class="fas fa-book-open text-olive-400"></i>
          <span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">\${r.difficulty}</span>
        </div>
        <h3 class="font-display font-bold text-pepper-700 mb-1">\${r.name}</h3>
        <p class="text-xs text-wood-500 mb-2">\${r.description || ''}</p>
        <div class="flex items-center gap-4 text-xs text-wood-400">
          <span><i class="fas fa-clock mr-1"></i>\${r.prep_time_minutes} min</span>
          <span><i class="fas fa-balance-scale mr-1"></i>\${r.yield_quantity} \${r.yield_unit}</span>
          <span><i class="fas fa-dollar-sign mr-1"></i>$\${Number(r.cost_per_unit).toLocaleString()}/\${r.yield_unit}</span>
        </div>
      </div>
    \`).join('') || '<p class="text-wood-400 italic">Sin recetas aún</p>';
  } catch (e) { console.error(e); }
}

async function loadClients() {
  try {
    const res = await fetch('/api/crm/clients');
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('clientsList').innerHTML = (data.data || []).map(cl => \`
      <div class="crm-card bg-white rounded-xl p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <i class="fas \${cl.client_type === 'restaurant' ? 'fa-utensils' : cl.client_type === 'hotel' ? 'fa-hotel' : 'fa-user'} text-blue-400"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-sm">\${cl.name}</h3>
          <p class="text-xs text-wood-500">\${cl.city || ''} \${cl.phone ? '· ' + cl.phone : ''}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-wood-400 capitalize">\${cl.client_type}</p>
          <p class="text-xs text-wood-500">\${cl.total_orders} pedidos</p>
        </div>
      </div>
    \`).join('') || '<p class="text-wood-400 italic">Sin clientes aún</p>';
  } catch (e) { console.error(e); }
}

async function loadOrders() {
  try {
    const res = await fetch('/api/crm/orders');
    const data = await res.json();
    if (!data.success) return;
    const statusColors = { pendiente: 'bg-yellow-50 text-yellow-600', en_proceso: 'bg-blue-50 text-blue-600', completado: 'bg-green-50 text-green-600', cancelado: 'bg-red-50 text-red-600' };
    document.getElementById('ordersList').innerHTML = (data.data || []).map(o => \`
      <div class="crm-card bg-white rounded-xl p-4 flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-receipt text-green-400"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-sm">Pedido #\${o.id}</h3>
          <p class="text-xs text-wood-500">\${o.client_name || 'Sin cliente'} · \${o.order_date?.split('T')[0] || ''}</p>
        </div>
        <div class="text-right">
          <span class="text-xs px-2 py-0.5 rounded-full \${statusColors[o.status] || 'bg-gray-50 text-gray-600'}">\${o.status}</span>
          <p class="text-sm font-bold text-pepper-600 mt-1">$\${Number(o.total).toLocaleString()}</p>
        </div>
      </div>
    \`).join('') || '<p class="text-wood-400 italic">Sin pedidos aún</p>';
  } catch (e) { console.error(e); }
}

async function loadOffers() {
  try {
    const res = await fetch('/api/crm/offers');
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('offersList').innerHTML = (data.data || []).map(o => \`
      <div class="crm-card bg-white rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <i class="fas fa-tag text-purple-400"></i>
          <span class="text-xs px-2 py-0.5 rounded-full \${o.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}">\${o.is_active ? 'Activa' : 'Inactiva'}</span>
        </div>
        <h3 class="font-display font-bold text-pepper-700 text-sm mb-1">\${o.name}</h3>
        <p class="text-xs text-wood-500 mb-2">\${o.description || ''}</p>
        <div class="text-xs text-wood-400">
          \${o.discount_percent > 0 ? '<span class="text-pepper-500 font-bold">' + o.discount_percent + '% OFF</span>' : ''}
          \${o.start_date ? '· Desde: ' + o.start_date.split('T')[0] : ''}
          \${o.end_date ? ' hasta: ' + o.end_date.split('T')[0] : ''}
        </div>
      </div>
    \`).join('') || '<p class="text-wood-400 italic col-span-2">Sin ofertas aún</p>';
  } catch (e) { console.error(e); }
}

async function loadIngredients() {
  try {
    const res = await fetch('/api/crm/ingredients');
    const data = await res.json();
    if (!data.success) return;
    document.getElementById('ingredientsList').innerHTML = (data.data || []).map(i => \`
      <div class="crm-card bg-white rounded-xl p-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-leaf text-green-400 text-xs"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium">\${i.name}</h3>
          <p class="text-xs text-wood-400">\${i.supplier || 'Sin proveedor'}</p>
        </div>
        <div class="text-right text-xs">
          <p class="text-pepper-600 font-medium">$\${Number(i.cost_per_unit).toLocaleString()}/\${i.unit}</p>
          <p class="text-wood-400">Stock: \${i.current_stock} \${i.unit}</p>
        </div>
      </div>
    \`).join('') || '<p class="text-wood-400 italic">Sin ingredientes aún</p>';
  } catch (e) { console.error(e); }
}

async function loadNotes() {
  try {
    const res = await fetch('/api/crm/notes');
    const data = await res.json();
    if (!data.success) return;
    const priorityColors = { alta: 'border-l-4 border-l-pepper-500', normal: 'border-l-4 border-l-amber-400', baja: 'border-l-4 border-l-olive-400' };
    document.getElementById('notesList').innerHTML = (data.data || []).map(n => \`
      <div class="crm-card bg-white rounded-xl p-4 \${priorityColors[n.priority] || ''}">
        <h3 class="font-medium text-sm mb-1">\${n.title || 'Nota'}</h3>
        <p class="text-xs text-wood-500 line-clamp-3">\${n.content}</p>
        <div class="flex items-center justify-between mt-2 text-xs text-wood-400">
          <span class="capitalize">\${n.category}</span>
          <span>\${timeAgo(n.created_at)}</span>
        </div>
      </div>
    \`).join('') || '<p class="text-wood-400 italic col-span-3">Sin notas aún</p>';
  } catch (e) { console.error(e); }
}

async function viewRecipe(id) {
  try {
    const res = await fetch('/api/crm/recipes/' + id);
    const data = await res.json();
    if (!data.success) return;
    const r = data.data;
    showModal(\`
      <div class="p-6">
        <h2 class="font-display text-xl text-pepper-700 mb-1">\${r.name}</h2>
        <p class="text-sm text-wood-500 mb-4">\${r.description || ''}</p>
        <div class="flex gap-4 text-xs text-wood-400 mb-4">
          <span><i class="fas fa-clock mr-1"></i>\${r.prep_time_minutes} min</span>
          <span><i class="fas fa-balance-scale mr-1"></i>\${r.yield_quantity} \${r.yield_unit}</span>
          <span class="text-pepper-500 font-bold">$\${Number(r.cost_per_unit).toLocaleString()}/\${r.yield_unit}</span>
        </div>
        \${r.ingredients?.length ? '<h3 class="font-display text-pepper-600 mb-2">Ingredientes</h3><div class="space-y-1 mb-4">' + r.ingredients.map(i => '<div class="flex justify-between text-sm py-1 border-b border-cream-200"><span>' + i.ingredient_name + '</span><span class="text-wood-500">' + i.quantity + ' ' + i.unit + '</span></div>').join('') + '</div>' : ''}
        \${r.instructions ? '<h3 class="font-display text-pepper-600 mb-2">Instrucciones</h3><div class="text-sm whitespace-pre-line text-wood-600">' + r.instructions + '</div>' : ''}
        \${r.tips ? '<div class="mt-3 bg-amber-50 rounded-lg p-3 text-sm"><i class="fas fa-lightbulb text-amber-400 mr-1"></i> ' + r.tips + '</div>' : ''}
      </div>
    \`);
  } catch (e) { console.error(e); }
}

// ========== MODALS ==========
function showModal(html) {
  document.getElementById('modalContent').innerHTML = \`
    <div class="flex justify-end p-2"><button onclick="closeModal()" class="text-wood-400 hover:text-pepper-500 p-2"><i class="fas fa-times"></i></button></div>
    \${html}
  \`;
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

function showProductModal(product = null) {
  showModal(\`
    <div class="p-6 pt-0">
      <h2 class="font-display text-xl text-pepper-700 mb-4">\${product ? 'Editar' : 'Nuevo'} Producto</h2>
      <form onsubmit="saveProduct(event)" class="space-y-3">
        <input name="name" placeholder="Nombre del producto" value="\${product?.name || ''}" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" required />
        <textarea name="description" placeholder="Descripción" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="2">\${product?.description || ''}</textarea>
        <div class="grid grid-cols-2 gap-3">
          <input name="cost_price" type="number" step="0.01" placeholder="Costo" value="\${product?.cost_price || ''}" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
          <input name="sell_price" type="number" step="0.01" placeholder="Precio venta" value="\${product?.sell_price || ''}" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <select name="unit" class="border border-wood-200 rounded-lg px-3 py-2 text-sm">
            <option value="kg">kg</option><option value="docena">docena</option><option value="unidad">unidad</option><option value="frasco">frasco</option><option value="litro">litro</option>
          </select>
          <select name="category_id" class="border border-wood-200 rounded-lg px-3 py-2 text-sm">
            <option value="1">Pasta Rellena</option><option value="2">Pasta Larga</option><option value="3">Pasta Corta</option><option value="4">Salsas</option><option value="5">Postres</option><option value="6">Extras</option>
          </select>
        </div>
        <textarea name="notes" placeholder="Notas" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="2">\${product?.notes || ''}</textarea>
        <button type="submit" class="w-full bg-pepper-500 text-white rounded-lg py-2.5 font-medium hover:bg-pepper-600 transition">Guardar</button>
      </form>
    </div>
  \`);
}

async function saveProduct(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    await fetch('/api/crm/products', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    closeModal(); loadProducts();
  } catch(e) { alert('Error guardando producto'); }
}

function showClientModal() {
  showModal(\`
    <div class="p-6 pt-0">
      <h2 class="font-display text-xl text-pepper-700 mb-4">Nuevo Cliente</h2>
      <form onsubmit="saveClient(event)" class="space-y-3">
        <input name="name" placeholder="Nombre" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" required />
        <div class="grid grid-cols-2 gap-3">
          <input name="phone" placeholder="Teléfono" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
          <input name="email" placeholder="Email" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <input name="city" placeholder="Ciudad" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
          <select name="client_type" class="border border-wood-200 rounded-lg px-3 py-2 text-sm">
            <option value="particular">Particular</option><option value="restaurant">Restaurant</option><option value="hotel">Hotel</option><option value="negocio">Negocio</option>
          </select>
        </div>
        <textarea name="notes" placeholder="Notas" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="2"></textarea>
        <button type="submit" class="w-full bg-pepper-500 text-white rounded-lg py-2.5 font-medium hover:bg-pepper-600 transition">Guardar</button>
      </form>
    </div>
  \`);
}

async function saveClient(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    await fetch('/api/crm/clients', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    closeModal(); loadClients();
  } catch(e) { alert('Error guardando cliente'); }
}

function showRecipeModal() {
  showModal(\`
    <div class="p-6 pt-0">
      <h2 class="font-display text-xl text-pepper-700 mb-4">Nueva Receta</h2>
      <form onsubmit="saveRecipe(event)" class="space-y-3">
        <input name="name" placeholder="Nombre de la receta" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" required />
        <textarea name="description" placeholder="Descripción" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="2"></textarea>
        <div class="grid grid-cols-3 gap-3">
          <input name="prep_time_minutes" type="number" placeholder="Tiempo (min)" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
          <input name="yield_quantity" type="number" step="0.1" placeholder="Rinde" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
          <select name="difficulty" class="border border-wood-200 rounded-lg px-3 py-2 text-sm">
            <option value="facil">Fácil</option><option value="media" selected>Media</option><option value="dificil">Difícil</option>
          </select>
        </div>
        <textarea name="instructions" placeholder="Instrucciones paso a paso" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="5"></textarea>
        <textarea name="tips" placeholder="Tips y secretos" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="2"></textarea>
        <button type="submit" class="w-full bg-pepper-500 text-white rounded-lg py-2.5 font-medium hover:bg-pepper-600 transition">Guardar</button>
      </form>
    </div>
  \`);
}

async function saveRecipe(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    await fetch('/api/crm/recipes', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    closeModal(); loadRecipes();
  } catch(e) { alert('Error guardando receta'); }
}

function showOfferModal() {
  showModal(\`
    <div class="p-6 pt-0">
      <h2 class="font-display text-xl text-pepper-700 mb-4">Nueva Oferta</h2>
      <form onsubmit="saveOffer(event)" class="space-y-3">
        <input name="name" placeholder="Nombre de la oferta" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" required />
        <textarea name="description" placeholder="Descripción" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="2"></textarea>
        <div class="grid grid-cols-2 gap-3">
          <input name="discount_percent" type="number" step="0.1" placeholder="% Descuento" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
          <input name="discount_amount" type="number" step="0.01" placeholder="Monto desc." class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <input name="start_date" type="date" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
          <input name="end_date" type="date" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <textarea name="target_audience" placeholder="Público objetivo" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="1"></textarea>
        <textarea name="marketing_message" placeholder="Mensaje de marketing" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="2"></textarea>
        <button type="submit" class="w-full bg-pepper-500 text-white rounded-lg py-2.5 font-medium hover:bg-pepper-600 transition">Guardar</button>
      </form>
    </div>
  \`);
}

async function saveOffer(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    await fetch('/api/crm/offers', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    closeModal(); loadOffers();
  } catch(e) { alert('Error guardando oferta'); }
}

function showOrderModal() {
  showModal(\`
    <div class="p-6 pt-0">
      <h2 class="font-display text-xl text-pepper-700 mb-4">Nuevo Pedido</h2>
      <form onsubmit="saveOrder(event)" class="space-y-3">
        <input name="client_name" placeholder="Cliente (nombre)" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        <input name="delivery_date" type="date" placeholder="Fecha entrega" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        <input name="total" type="number" step="0.01" placeholder="Total $" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        <textarea name="notes" placeholder="Detalle del pedido" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="3"></textarea>
        <button type="submit" class="w-full bg-pepper-500 text-white rounded-lg py-2.5 font-medium hover:bg-pepper-600 transition">Guardar</button>
      </form>
    </div>
  \`);
}

async function saveOrder(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    await fetch('/api/crm/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    closeModal(); loadOrders();
  } catch(e) { alert('Error guardando pedido'); }
}

function showIngredientModal() {
  showModal(\`
    <div class="p-6 pt-0">
      <h2 class="font-display text-xl text-pepper-700 mb-4">Nuevo Ingrediente</h2>
      <form onsubmit="saveIngredient(event)" class="space-y-3">
        <input name="name" placeholder="Nombre" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" required />
        <div class="grid grid-cols-2 gap-3">
          <select name="unit" class="border border-wood-200 rounded-lg px-3 py-2 text-sm">
            <option value="kg">kg</option><option value="litro">litro</option><option value="docena">docena</option><option value="unidad">unidad</option><option value="100g">100g</option><option value="lata">lata</option>
          </select>
          <input name="cost_per_unit" type="number" step="0.01" placeholder="Costo/unidad" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <input name="supplier" placeholder="Proveedor" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        <div class="grid grid-cols-2 gap-3">
          <input name="current_stock" type="number" step="0.1" placeholder="Stock actual" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
          <input name="min_stock" type="number" step="0.1" placeholder="Stock mínimo" class="border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" class="w-full bg-pepper-500 text-white rounded-lg py-2.5 font-medium hover:bg-pepper-600 transition">Guardar</button>
      </form>
    </div>
  \`);
}

async function saveIngredient(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    await fetch('/api/crm/ingredients', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    closeModal(); loadIngredients();
  } catch(e) { alert('Error guardando ingrediente'); }
}

function showNoteModal() {
  showModal(\`
    <div class="p-6 pt-0">
      <h2 class="font-display text-xl text-pepper-700 mb-4">Nueva Nota</h2>
      <form onsubmit="saveNote(event)" class="space-y-3">
        <input name="title" placeholder="Título" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" />
        <textarea name="content" placeholder="Contenido" class="w-full border border-wood-200 rounded-lg px-3 py-2 text-sm" rows="4" required></textarea>
        <div class="grid grid-cols-2 gap-3">
          <select name="category" class="border border-wood-200 rounded-lg px-3 py-2 text-sm">
            <option value="general">General</option><option value="idea">Idea</option><option value="receta">Receta</option><option value="marketing">Marketing</option><option value="mejora">Mejora</option>
          </select>
          <select name="priority" class="border border-wood-200 rounded-lg px-3 py-2 text-sm">
            <option value="baja">Baja</option><option value="normal" selected>Normal</option><option value="alta">Alta</option>
          </select>
        </div>
        <button type="submit" class="w-full bg-pepper-500 text-white rounded-lg py-2.5 font-medium hover:bg-pepper-600 transition">Guardar</button>
      </form>
    </div>
  \`);
}

async function saveNote(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd);
  try {
    await fetch('/api/crm/notes', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    closeModal(); loadNotes();
  } catch(e) { alert('Error guardando nota'); }
}

// ========== HELPERS ==========
function getActivityIcon(type) {
  const icons = { create: 'fa-plus', update: 'fa-edit', delete: 'fa-trash', create_product: 'fa-box', create_client: 'fa-user-plus', create_order: 'fa-cart-plus', create_offer: 'fa-tag', create_recipe: 'fa-book', create_note: 'fa-sticky-note' };
  return icons[type] || 'fa-circle';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return 'hace ' + Math.floor(diff/60) + ' min';
  if (diff < 86400) return 'hace ' + Math.floor(diff/3600) + 'h';
  return d.toLocaleDateString('es-AR');
}

// Global search
document.getElementById('globalSearch')?.addEventListener('input', async function() {
  const q = this.value.trim();
  if (q.length < 2) return;
  // Could implement search dropdown here
});
</script>
</body>
</html>`)
}
