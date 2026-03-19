-- ============================================
-- PEPERONCINO PASTA LAB - Seed Data
-- Initial categories and sample products
-- ============================================

-- Categories
INSERT OR IGNORE INTO categories (name, description, icon, sort_order) VALUES
  ('Pasta Rellena', 'Pasta fresca rellena artesanal', '🥟', 1),
  ('Pasta Larga', 'Pasta fresca larga', '🍝', 2),
  ('Pasta Corta', 'Pasta fresca corta', '🍜', 3),
  ('Salsas', 'Salsas artesanales', '🫕', 4),
  ('Postres', 'Dulces y postres italianos', '🍰', 5),
  ('Extras', 'Complementos y extras', '🧀', 6);

-- Sample products  
INSERT OR IGNORE INTO products (name, description, category_id, unit, cost_price, sell_price, margin_percent) VALUES
  ('Ravioles de Ricota y Espinaca', 'Ravioles clásicos con ricota cremosa y espinaca fresca', 1, 'docena', 800, 1500, 46.7),
  ('Ravioles de Calabaza', 'Ravioles con relleno de calabaza asada y nuez moscada', 1, 'docena', 850, 1600, 46.9),
  ('Sorrentinos de Jamón y Queso', 'Sorrentinos grandes con jamón cocido y muzzarella', 1, 'docena', 900, 1700, 47.1),
  ('Capeletinis de Carne', 'Capeletinis rellenos de carne braseada', 1, 'docena', 950, 1800, 47.2),
  ('Fettuccine', 'Fettuccine de huevo fresco', 2, 'kg', 600, 1100, 45.5),
  ('Pappardelle', 'Pappardelle anchas de huevo', 2, 'kg', 650, 1200, 45.8),
  ('Salsa Pomodoro', 'Salsa de tomates San Marzano', 4, 'frasco', 400, 800, 50.0),
  ('Salsa Bolognesa', 'Ragú de carne cocción lenta', 4, 'frasco', 600, 1200, 50.0);

-- Sample ingredients
INSERT OR IGNORE INTO ingredients (name, unit, cost_per_unit, supplier, current_stock) VALUES
  ('Harina 000', 'kg', 350, 'Molino del Sur', 50),
  ('Huevos', 'docena', 800, 'Granja Serrana', 20),
  ('Ricota', 'kg', 900, 'Lácteos Traslasierra', 10),
  ('Espinaca fresca', 'kg', 600, 'Huerta Local', 5),
  ('Calabaza', 'kg', 300, 'Huerta Local', 15),
  ('Jamón cocido', 'kg', 2500, 'Fiambrería Central', 3),
  ('Muzzarella', 'kg', 1800, 'Lácteos Traslasierra', 5),
  ('Tomates San Marzano', 'lata', 450, 'Importadora Roma', 30),
  ('Carne picada especial', 'kg', 2200, 'Carnicería Don Luis', 5),
  ('Aceite de oliva', 'litro', 1500, 'Olivares del Valle', 8),
  ('Sal fina', 'kg', 150, 'Proveedor General', 10),
  ('Nuez moscada', '100g', 800, 'Especias del Mundo', 3);

-- Sample recipe
INSERT OR IGNORE INTO recipes (name, description, product_id, prep_time_minutes, yield_quantity, yield_unit, total_cost, cost_per_unit, difficulty, instructions) VALUES
  ('Ravioles de Ricota y Espinaca', 'Receta clásica italiana de ravioles rellenos', 1, 120, 10, 'docena', 7500, 750, 'media',
   '1. Preparar la masa: harina, huevos, sal, aceite de oliva. Amasar 10 min.
2. Dejar reposar la masa 30 minutos envuelta en film.
3. Blanquear la espinaca, escurrir bien y picar fino.
4. Mezclar ricota con espinaca, sal, pimienta y nuez moscada.
5. Estirar la masa fina con la máquina de pasta.
6. Rellenar y cerrar los ravioles.
7. Dejar secar 15 minutos antes de cocinar.');

-- Link recipe to ingredients
INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, notes) VALUES
  (1, 1, 2, 'kg', 'Harina para la masa'),
  (1, 2, 2, 'docena', 'Huevos para la masa'),
  (1, 3, 3, 'kg', 'Ricota bien escurrida'),
  (1, 4, 1, 'kg', 'Espinaca fresca blanqueada'),
  (1, 10, 0.1, 'litro', 'Un chorrito para la masa'),
  (1, 11, 0.05, 'kg', 'Sal para la masa y el relleno'),
  (1, 12, 0.02, '100g', 'Nuez moscada rallada');

-- Sample client
INSERT OR IGNORE INTO clients (name, phone, email, city, client_type, notes) VALUES
  ('Restaurant La Plaza', '+54 3544 123456', 'laplaza@email.com', 'Mina Clavero', 'restaurant', 'Cliente fijo, pedido semanal'),
  ('María González', '+54 3544 234567', NULL, 'Villa Cura Brochero', 'particular', 'Le encantan los sorrentinos'),
  ('Hotel Valle del Sol', '+54 3544 345678', 'hotel@valledelsol.com', 'Nono', 'hotel', 'Pedidos para eventos especiales');

-- Initial conversation
INSERT OR IGNORE INTO conversations (title, summary) VALUES
  ('Bienvenida', 'Primera conversación con Sora Lella');

INSERT OR IGNORE INTO messages (conversation_id, role, content, model_used) VALUES
  (1, 'assistant', '¡Ciao Mirko! 🌶️ Soy Sora Lella, tu asistente personal de Peperoncino Pasta Lab. Estoy aquí para ayudarte con todo: desde las recetas hasta los números, desde los clientes hasta las ideas de marketing. ¡Contame qué necesitás hoy y pongámonos a trabajar!', 'system');
