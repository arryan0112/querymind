function extractNumberFromQuery(question: string): number | null {
  const numberWords: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  };
  
  const lower = question.toLowerCase();
  
  const digitMatch = lower.match(/\b(\d+)\b/);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    if (num > 0 && num <= 100) return num;
  }
  
  for (const [word, num] of Object.entries(numberWords)) {
    if (lower.includes(word)) {
      return num;
    }
  }
  
  return null;
}

const DEMO_SQL_PATTERNS: Record<string, string> = {
  // Products with dynamic limit - more specific patterns first
  'most sold products': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'most selled products': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'best seller products': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'best selling products': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'most selling products': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'top seller products': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'top selling products': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'products by revenue': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  'most revenue products': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  'highest revenue products': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  
  // Short product patterns
  'most sold': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'most selled': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'best sellers': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'best selling': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'most selling': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'top selling': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY total_sold DESC LIMIT {LIMIT}`,
  'most revenue': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  'highest revenue': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  'best revenue': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  
  // Top products - default 10
  'top products': `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  'top revenue': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  
  // Customers
  'top customers': `SELECT c.first_name, c.last_name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.first_name, c.last_name ORDER BY total_spent DESC LIMIT {LIMIT}`,
  'best customers': `SELECT c.first_name, c.last_name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.first_name, c.last_name ORDER BY total_spent DESC LIMIT {LIMIT}`,
  'top customers by spend': `SELECT c.first_name, c.last_name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.first_name, c.last_name ORDER BY total_spent DESC LIMIT {LIMIT}`,
  'most orders': `SELECT c.first_name, c.last_name, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.first_name, c.last_name ORDER BY order_count DESC LIMIT {LIMIT}`,
  
  // Daily orders
  'daily orders': `SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as order_count, SUM(total_amount) as total_revenue FROM orders GROUP BY DATE_TRUNC('day', created_at) ORDER BY day DESC LIMIT {LIMIT}`,
  
  // Time-based queries
  'total orders': `SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as total_orders FROM orders WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01' GROUP BY DATE_TRUNC('month', created_at) ORDER BY month`,
  'total sales': `SELECT DATE_TRUNC('month', o.created_at) as month, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as total_sales FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE o.created_at >= '2025-01-01' AND o.created_at < '2026-01-01' GROUP BY DATE_TRUNC('month', o.created_at) ORDER BY month`,
  'orders by month': `SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as order_count FROM orders WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01' GROUP BY DATE_TRUNC('month', created_at) ORDER BY month`,
  'revenue': `SELECT DATE_TRUNC('month', o.created_at) as month, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM orders o JOIN order_items oi ON o.id = oi.order_id GROUP BY DATE_TRUNC('month', o.created_at) ORDER BY month`,
  'monthly revenue': `SELECT DATE_TRUNC('month', o.created_at) as month, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue, COUNT(DISTINCT o.id) as order_count FROM orders o JOIN order_items oi ON o.id = oi.order_id GROUP BY DATE_TRUNC('month', o.created_at) ORDER BY month`,
  'average order value': `SELECT DATE_TRUNC('month', created_at) as month, AVG(total_amount) as avg_order_value FROM orders GROUP BY DATE_TRUNC('month', created_at) ORDER BY month`,
  'order count by day': `SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as order_count FROM orders WHERE created_at >= '2025-12-01' AND created_at < '2026-01-01' GROUP BY DATE_TRUNC('day', created_at) ORDER BY day`,
  'orders by day': `SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as order_count FROM orders WHERE created_at >= '2025-12-01' AND created_at < '2026-01-01' GROUP BY DATE_TRUNC('day', created_at) ORDER BY day`,
  'orders last 30 days': `SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as order_count FROM orders WHERE created_at >= '2025-12-01' AND created_at < '2026-01-01' GROUP BY DATE_TRUNC('day', created_at) ORDER BY day`,
  'order count': `SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as order_count FROM orders WHERE created_at >= '2025-12-01' AND created_at < '2026-01-01' GROUP BY DATE_TRUNC('day', created_at) ORDER BY day`,
  'sales by category': `SELECT c.name as category, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as total_sales FROM categories c JOIN products p ON c.id = p.category_id JOIN order_items oi ON p.id = oi.product_id GROUP BY c.name ORDER BY total_sales DESC`,
  'orders by status': `SELECT status, COUNT(*) as count FROM orders GROUP BY status`,
  'customers by country': `SELECT country, COUNT(*) as count FROM customers GROUP BY country ORDER BY count DESC`,
  'customers by state': `SELECT state, COUNT(*) as count FROM customers GROUP BY state ORDER BY count DESC`,
  'recent orders': `SELECT o.id, c.first_name, c.last_name, o.status, o.total_amount, o.created_at FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 10`,
  'order items': `SELECT oi.id, oi.order_id, p.name as product_name, oi.quantity, oi.unit_price FROM order_items oi JOIN products p ON oi.product_id = p.id LIMIT 20`,
  'customer segments': `SELECT segment, COUNT(*) as customer_count FROM customers GROUP BY segment`,
  'order status breakdown': `SELECT status, COUNT(*) as count, SUM(total_amount) as total_value FROM orders GROUP BY status`,
  'products by category': `SELECT c.name as category, COUNT(p.id) as product_count, AVG(p.price) as avg_price FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.name ORDER BY product_count DESC`,
  'products low stock': `SELECT name, stock_quantity FROM products WHERE stock_quantity < 10 ORDER BY stock_quantity ASC LIMIT 10`,
  'products out of stock': `SELECT name, stock_quantity FROM products WHERE stock_quantity = 0 ORDER BY name ASC`,
  'recent reviews': `SELECT r.rating, r.title, r.body, p.name as product_name, c.first_name, c.last_name, r.created_at FROM reviews r JOIN products p ON r.product_id = p.id JOIN customers c ON r.customer_id = c.id ORDER BY r.created_at DESC LIMIT 10`,
  'top rated products': `SELECT p.name, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count FROM products p LEFT JOIN reviews r ON p.id = r.product_id GROUP BY p.name HAVING COUNT(r.id) > 0 ORDER BY avg_rating DESC LIMIT 10`,
  'average rating by category': `SELECT c.name as category, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count FROM categories c JOIN products p ON c.id = p.category_id LEFT JOIN reviews r ON p.id = r.product_id GROUP BY c.name HAVING COUNT(r.id) > 0 ORDER BY avg_rating DESC`,
  'pending orders': `SELECT o.id, c.first_name, c.last_name, o.total_amount, o.created_at FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.status = 'pending' ORDER BY o.created_at DESC LIMIT 10`,
  'delivered orders': `SELECT o.id, c.first_name, c.last_name, o.total_amount, o.created_at, o.delivered_at FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.status = 'delivered' ORDER BY o.delivered_at DESC LIMIT 10`,
  'customers with orders but never left a review': `SELECT c.id, c.first_name, c.last_name, c.email, COUNT(o.id) as order_count FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.id NOT IN (SELECT DISTINCT order_id FROM reviews) GROUP BY c.id, c.first_name, c.last_name, c.email HAVING COUNT(o.id) >= 10 ORDER BY order_count DESC`,
  'revenue by category this quarter': `SELECT c.name as category, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM categories c JOIN products p ON c.id = p.category_id JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE EXTRACT(QUARTER FROM o.created_at) = 4 AND EXTRACT(YEAR FROM o.created_at) = 2025 GROUP BY c.name ORDER BY revenue DESC`,
  'revenue by category last quarter': `SELECT c.name as category, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM categories c JOIN products p ON c.id = p.category_id JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE EXTRACT(QUARTER FROM o.created_at) = 3 AND EXTRACT(YEAR FROM o.created_at) = 2025 GROUP BY c.name ORDER BY revenue DESC`,
  'revenue by category this quarter vs last quarter': `SELECT c.name as category, CASE WHEN EXTRACT(QUARTER FROM o.created_at) = 4 THEN 'Q4_2025' WHEN EXTRACT(QUARTER FROM o.created_at) = 3 THEN 'Q3_2025' ELSE 'Other' END as quarter, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM categories c JOIN products p ON c.id = p.category_id JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.created_at >= '2025-07-01' GROUP BY c.name, CASE WHEN EXTRACT(QUARTER FROM o.created_at) = 4 THEN 'Q4_2025' WHEN EXTRACT(QUARTER FROM o.created_at) = 3 THEN 'Q3_2025' ELSE 'Other' END ORDER BY category, quarter`,
  'average order value by customer segment': `SELECT segment, AVG(total_amount) as avg_order_value, COUNT(*) as order_count FROM orders GROUP BY segment ORDER BY avg_order_value DESC`,
  'average order value by segment': `SELECT segment, AVG(total_amount) as avg_order_value, COUNT(*) as order_count FROM orders GROUP BY segment ORDER BY avg_order_value DESC`,
  'order value by segment': `SELECT segment, AVG(total_amount) as avg_order_value, COUNT(*) as order_count FROM orders GROUP BY segment ORDER BY avg_order_value DESC`,
  'products by revenue last month': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.created_at >= '2025-12-01' AND o.created_at < '2026-01-01' GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  'top products by revenue last month': `SELECT p.name, SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent / 100)) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.created_at >= '2025-12-01' AND o.created_at < '2026-01-01' GROUP BY p.name ORDER BY revenue DESC LIMIT {LIMIT}`,
  
  // Generic patterns - must be last
  'products': `SELECT * FROM products LIMIT 20`,
  'customers': `SELECT * FROM customers LIMIT 20`,
  'orders': `SELECT * FROM orders LIMIT 20`,
};

export function generateDemoSQL(question: string): string | null {
  const lowerQuestion = question.toLowerCase();
  const limit = extractNumberFromQuery(question);
  const defaultLimit = 10;
  
  // Create version without numbers (both digit and word) for pattern matching
  const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  let questionForMatching = lowerQuestion.replace(/\d+/g, '');
  for (const word of numberWords) {
    questionForMatching = questionForMatching.replace(new RegExp('\\b' + word + '\\b', 'g'), '');
  }
  questionForMatching = questionForMatching.replace(/\s+/g, ' ').trim();
  
  // Find first matching pattern
  for (const [pattern, sqlTemplate] of Object.entries(DEMO_SQL_PATTERNS)) {
    if (lowerQuestion.includes(pattern) || questionForMatching.includes(pattern)) {
      // Check if this pattern supports dynamic limit
      if (sqlTemplate.includes('{LIMIT}')) {
        const finalLimit = limit || defaultLimit;
        return sqlTemplate.replace('{LIMIT}', String(finalLimit));
      }
      return sqlTemplate;
    }
  }
  
  return null;
}
