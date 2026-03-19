-- ============================================
-- MIGRATION 0002: Media Gallery for generated materials
-- ============================================

-- Gallery of generated images and marketing materials
CREATE TABLE IF NOT EXISTS media_gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  html_content TEXT,
  material_type TEXT DEFAULT 'image',
  conversation_id INTEGER,
  prompt_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- Index for gallery lookups
CREATE INDEX IF NOT EXISTS idx_gallery_type ON media_gallery(material_type);
CREATE INDEX IF NOT EXISTS idx_gallery_conversation ON media_gallery(conversation_id);
