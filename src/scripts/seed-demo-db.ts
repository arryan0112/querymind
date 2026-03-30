import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';
import { faker } from '@faker-js/faker';

const { Pool } = pg;

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceMin: number;
  priceMax: number;
}

const categories: Category[] = [
  { id: 1, name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories', priceMin: 50, priceMax: 2000 },
  { id: 2, name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items', priceMin: 15, priceMax: 500 },
  { id: 3, name: 'Books', slug: 'books', description: 'Books and publications', priceMin: 8, priceMax: 60 },
  { id: 4, name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies', priceMin: 20, priceMax: 800 },
  { id: 5, name: 'Sports', slug: 'sports', description: 'Sports equipment and gear', priceMin: 25, priceMax: 1500 },
  { id: 6, name: 'Toys', slug: 'toys', description: 'Toys and games', priceMin: 10, priceMax: 300 },
  { id: 7, name: 'Beauty', slug: 'beauty', description: 'Beauty and personal care products', priceMin: 8, priceMax: 250 },
  { id: 8, name: 'Food', slug: 'food', description: 'Food and beverages', priceMin: 5, priceMax: 150 },
  { id: 9, name: 'Automotive', slug: 'automotive', description: 'Automotive parts and accessories', priceMin: 20, priceMax: 1200 },
  { id: 10, name: 'Office', slug: 'office', description: 'Office supplies and equipment', priceMin: 10, priceMax: 600 },
  { id: 11, name: 'Music', slug: 'music', description: 'Musical instruments and equipment', priceMin: 50, priceMax: 3000 },
  { id: 12, name: 'Pets', slug: 'pets', description: 'Pet supplies and accessories', priceMin: 10, priceMax: 200 },
];

interface BulkInsertParams {
  table: string;
  columns: string[];
  rows: unknown[][];
  chunkSize?: number;
}

async function bulkInsert(pool: pg.Pool, { table, columns, rows, chunkSize = 1000 }: BulkInsertParams): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const row of chunk) {
      const placeholders = row.map(() => `$${paramIndex++}`).join(', ');
      values.push(`(${placeholders})`);
      params.push(...row);
    }

    await pool.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values.join(', ')}`,
      params
    );

    console.log(`  Progress: ${Math.min(i + chunkSize, rows.length)}/${rows.length} ${table}`);
  }
}

async function seed() {
  const demoDatabaseUrl = process.env.DEMO_DATABASE_URL;
  
  if (!demoDatabaseUrl) {
    throw new Error('DEMO_DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString: demoDatabaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('connect', () => {
    console.log('Connected to demo database');
  });

  try {
    console.log('Starting demo database seeding...');

    // Create tables
    await pool.query(`
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
    `);
    console.log('Dropped existing tables');

    await pool.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT
      );
    `);
    console.log('Created categories table');

    await pool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        sku TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created products table');

    await pool.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        address_line1 TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'USA',
        zip_code TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        segment TEXT NOT NULL DEFAULT 'standard'
      );
    `);
    console.log('Created customers table');

    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        shipped_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ
      );
    `);
    console.log('Created orders table');

    await pool.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0
      );
    `);
    console.log('Created order_items table');

    await pool.query(`
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        product_id INTEGER REFERENCES products(id),
        order_id INTEGER REFERENCES orders(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        body TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        helpful_votes INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log('Created reviews table');

    // Seed categories
    console.log('Seeding categories...');
    const categoryRows = categories.map(cat => [cat.id, cat.name, cat.slug, cat.description]);
    await bulkInsert(pool, {
      table: 'categories',
      columns: ['id', 'name', 'slug', 'description'],
      rows: categoryRows,
    });
    console.log(`Seeding categories... done (${categories.length})`);

    // Generate and bulk insert products
    console.log('Seeding products...');
    const totalProducts = 500;
    const productRows: (number | string)[][] = [];

    for (let i = 0; i < totalProducts; i++) {
      const category = faker.helpers.arrayElement(categories);
      const name = faker.commerce.productName();
      const slug = faker.helpers.slugify(name).toLowerCase() + '-' + i;
      const price = parseFloat(faker.number.float({ 
        min: category.priceMin, 
        max: category.priceMax, 
        fractionDigits: 2 
      }).toFixed(2));
      const stockQuantity = faker.number.int({ min: 0, max: 500 });
      const sku = `SKU-${category.slug.toUpperCase()}-${String(i).padStart(5, '0')}`;

      productRows.push([category.id, name, slug, faker.commerce.productDescription(), price, stockQuantity, sku]);
    }

    await bulkInsert(pool, {
      table: 'products',
      columns: ['category_id', 'name', 'slug', 'description', 'price', 'stock_quantity', 'sku'],
      rows: productRows,
    });
    console.log(`Seeding products... done (${totalProducts})`);

    // Get product IDs for later use
    const productResult = await pool.query('SELECT id, price FROM products');
    const products = productResult.rows;

    // Generate and bulk insert customers
    console.log('Seeding customers...');
    const totalCustomers = 2000;
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2025-06-30');
    const customerRows: (string | Date)[][] = [];

    for (let i = 0; i < totalCustomers; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      const createdAt = faker.date.between({ from: startDate, to: endDate });
      const segment = faker.helpers.weightedArrayElement([
        { value: 'standard', weight: 60 },
        { value: 'premium', weight: 30 },
        { value: 'vip', weight: 10 },
      ]) as string;

      customerRows.push([
        email, firstName, lastName, faker.phone.number(),
        faker.location.streetAddress(), faker.location.city(), faker.location.state(),
        'USA', faker.location.zipCode(), createdAt, segment
      ]);
    }

    await bulkInsert(pool, {
      table: 'customers',
      columns: ['email', 'first_name', 'last_name', 'phone', 'address_line1', 'city', 'state', 'country', 'zip_code', 'created_at', 'segment'],
      rows: customerRows,
    });
    console.log(`Seeding customers... done (${totalCustomers})`);

    // Get customer IDs
    const customerResult = await pool.query('SELECT id FROM customers');
    const customers = customerResult.rows;

    // Generate and bulk insert orders
    console.log('Seeding orders...');
    const totalOrders = 12000;
    const orderStartDate = new Date('2025-01-01');
    const orderEndDate = new Date('2025-12-31');

    const getSeasonalWeight = (month: number): number => {
      if (month === 11 || month === 12) return 3;
      if (month >= 9 && month <= 10) return 2;
      if (month >= 1 && month <= 2) return 1.5;
      return 1;
    };

    const orderRows: (number | string | Date | null)[][] = [];

    for (let i = 0; i < totalOrders; i++) {
      const customer = faker.helpers.arrayElement(customers);
      const createdAt = faker.date.between({ from: orderStartDate, to: orderEndDate });
      const month = createdAt.getMonth();
      const weight = getSeasonalWeight(month);
      
      let status: string;
      let shippedAt: Date | null = null;
      let deliveredAt: Date | null = null;

      if (Math.random() < weight / 3) {
        status = faker.helpers.weightedArrayElement([
          { value: 'pending', weight: 5 },
          { value: 'processing', weight: 10 },
          { value: 'shipped', weight: 15 },
          { value: 'delivered', weight: 55 },
          { value: 'cancelled', weight: 10 },
          { value: 'refunded', weight: 5 },
        ]) as string;
        
        if (status === 'shipped' || status === 'delivered') {
          shippedAt = faker.date.soon({ days: 5, refDate: createdAt });
        }
        if (status === 'delivered') {
          deliveredAt = faker.date.soon({ days: 10, refDate: createdAt });
        }
      } else {
        status = 'delivered';
      }

      const totalAmount = parseFloat(faker.number.float({ min: 20, max: 5000, fractionDigits: 2 }).toFixed(2));
      const shippingAddress = `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}`;
      const paymentMethod = faker.helpers.weightedArrayElement([
        { value: 'credit_card', weight: 60 },
        { value: 'paypal', weight: 25 },
        { value: 'bank_transfer', weight: 10 },
        { value: 'crypto', weight: 5 },
      ]) as string;

      orderRows.push([
        customer.id, status, totalAmount, shippingAddress, paymentMethod, createdAt, shippedAt, deliveredAt
      ]);

      if ((i + 1) % 2000 === 0) {
        console.log(`  Generated: ${i + 1}/${totalOrders} orders`);
      }
    }

    await bulkInsert(pool, {
      table: 'orders',
      columns: ['customer_id', 'status', 'total_amount', 'shipping_address', 'payment_method', 'created_at', 'shipped_at', 'delivered_at'],
      rows: orderRows,
    });
    console.log(`Seeding orders... done (${totalOrders})`);

    // Get order IDs
    const orderIdsResult = await pool.query('SELECT id FROM orders');
    const orderIds = orderIdsResult.rows.map(r => r.id);

    // Generate and bulk insert order items
    console.log('Seeding order items...');
    const allOrderItems: (number | string | Date | null)[][] = [];

    for (const orderId of orderIds) {
      const numItems = faker.number.int({ min: 1, max: 5 });
      const orderProducts = faker.helpers.arrayElements(products, numItems);

      for (const product of orderProducts) {
        const quantity = faker.number.int({ min: 1, max: 3 });
        const discountPercent = parseFloat(faker.number.float({ min: 0, max: 30, fractionDigits: 2 }).toFixed(2));
        
        allOrderItems.push([orderId, product.id, quantity, product.price, discountPercent]);
      }
    }

    await bulkInsert(pool, {
      table: 'order_items',
      columns: ['order_id', 'product_id', 'quantity', 'unit_price', 'discount_percent'],
      rows: allOrderItems,
    });
    console.log(`Seeding order items... done (${allOrderItems.length})`);

    // Generate and bulk insert reviews
    console.log('Seeding reviews...');
    const deliveredOrdersResult = await pool.query(
      "SELECT id FROM orders WHERE status = 'delivered'"
    );
    const deliveredOrderIds = deliveredOrdersResult.rows.map(r => r.id);
    const reviewableOrders = faker.helpers.arrayElements(deliveredOrderIds, Math.floor(deliveredOrderIds.length * 0.4));

    // Build order to customer map
    const orderCustomerMap = new Map<number, number>();
    for (const orderId of deliveredOrderIds) {
      const idx = orderId - 1;
      if (orderRows[idx] && orderRows[idx][0]) {
        orderCustomerMap.set(orderId, orderRows[idx][0] as number);
      }
    }

    // Build order to products map from order items
    const orderProductsMap = new Map<number, number[]>();
    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      const orderProductIds = allOrderItems
        .filter(item => item[0] === orderId)
        .map(item => item[1] as number);
      orderProductsMap.set(orderId, orderProductIds);
    }

    const reviewRows: (number | string | Date | null)[][] = [];

    for (const orderId of reviewableOrders) {
      const customerId = orderCustomerMap.get(orderId);
      const orderProductIds = orderProductsMap.get(orderId);
      
      if (!customerId || !orderProductIds || orderProductIds.length === 0) continue;

      const productId = faker.helpers.arrayElement(orderProductIds);
      const rating = faker.helpers.weightedArrayElement([
        { value: 1, weight: 5 },
        { value: 2, weight: 10 },
        { value: 3, weight: 20 },
        { value: 4, weight: 35 },
        { value: 5, weight: 30 },
      ]) as number;

      reviewRows.push([
        customerId, productId, orderId, rating,
        faker.lorem.sentence({ min: 3, max: 8 }),
        faker.lorem.paragraph(),
        faker.date.recent({ days: 30 }),
        faker.number.int({ min: 0, max: 50 })
      ]);
    }

    await bulkInsert(pool, {
      table: 'reviews',
      columns: ['customer_id', 'product_id', 'order_id', 'rating', 'title', 'body', 'created_at', 'helpful_votes'],
      rows: reviewRows,
    });
    console.log(`Seeding reviews... done (${reviewRows.length})`);

    // Create indexes
    console.log('Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);');
    console.log('Creating indexes... done');

    console.log('Demo database seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
