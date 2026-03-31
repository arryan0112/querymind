import pg from 'pg';
import type { SchemaAnalysis, TableSchema } from '@/types';

const { Pool } = pg;

const demoDatabaseUrl = process.env.DEMO_DATABASE_URL;

if (!demoDatabaseUrl) {
  throw new Error('DEMO_DATABASE_URL environment variable is not set');
}

export const demoPool = new Pool({
  connectionString: demoDatabaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

demoPool.on('connect', () => {
  console.log('Demo database pool: new client connected');
});

export const demoSchema: SchemaAnalysis = {
  tables: [
    {
      tableName: 'categories',
      columns: [
        { columnName: 'id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'name', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'slug', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'description', dataType: 'text', isNullable: true, columnDefault: null },
      ],
      foreignKeys: [],
      sampleValues: { name: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'] },
      rowCount: 12,
    },
    {
      tableName: 'products',
      columns: [
        { columnName: 'id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'category_id', dataType: 'integer', isNullable: true, columnDefault: null },
        { columnName: 'name', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'slug', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'description', dataType: 'text', isNullable: true, columnDefault: null },
        { columnName: 'price', dataType: 'numeric', isNullable: false, columnDefault: null },
        { columnName: 'stock_quantity', dataType: 'integer', isNullable: false, columnDefault: '0' },
        { columnName: 'sku', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'created_at', dataType: 'timestamp with time zone', isNullable: true, columnDefault: 'NOW()' },
      ],
      foreignKeys: [
        { columnName: 'category_id', referencedTable: 'categories', referencedColumn: 'id' }
      ],
      sampleValues: { name: ['Ergonomic Steel Chair', 'Gorgeous Concrete Hat', 'Rustic Bronze Table'], price: ['50.00', '150.00', '500.00'] },
      rowCount: 500,
    },
    {
      tableName: 'customers',
      columns: [
        { columnName: 'id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'email', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'first_name', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'last_name', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'phone', dataType: 'text', isNullable: true, columnDefault: null },
        { columnName: 'address_line1', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'city', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'state', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'country', dataType: 'text', isNullable: true, columnDefault: "'USA'" },
        { columnName: 'zip_code', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'created_at', dataType: 'timestamp with time zone', isNullable: true, columnDefault: 'NOW()' },
        { columnName: 'segment', dataType: 'text', isNullable: true, columnDefault: "'standard'" },
      ],
      foreignKeys: [],
      sampleValues: { first_name: ['John', 'Jane', 'Bob'], last_name: ['Smith', 'Doe', 'Johnson'], city: ['New York', 'Los Angeles', 'Chicago'], state: ['NY', 'CA', 'IL'], segment: ['standard', 'premium', 'vip'] },
      rowCount: 2000,
    },
    {
      tableName: 'orders',
      columns: [
        { columnName: 'id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'customer_id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'status', dataType: 'text', isNullable: false, columnDefault: "'pending'" },
        { columnName: 'total_amount', dataType: 'numeric', isNullable: false, columnDefault: null },
        { columnName: 'shipping_address', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'payment_method', dataType: 'text', isNullable: false, columnDefault: null },
        { columnName: 'created_at', dataType: 'timestamp with time zone', isNullable: true, columnDefault: 'NOW()' },
        { columnName: 'shipped_at', dataType: 'timestamp with time zone', isNullable: true, columnDefault: null },
        { columnName: 'delivered_at', dataType: 'timestamp with time zone', isNullable: true, columnDefault: null },
      ],
      foreignKeys: [
        { columnName: 'customer_id', referencedTable: 'customers', referencedColumn: 'id' }
      ],
      sampleValues: { status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], payment_method: ['credit_card', 'paypal', 'bank_transfer'] },
      rowCount: 12000,
    },
    {
      tableName: 'order_items',
      columns: [
        { columnName: 'id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'order_id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'product_id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'quantity', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'unit_price', dataType: 'numeric', isNullable: false, columnDefault: null },
        { columnName: 'discount_percent', dataType: 'numeric', isNullable: false, columnDefault: '0' },
      ],
      foreignKeys: [
        { columnName: 'order_id', referencedTable: 'orders', referencedColumn: 'id' },
        { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id' }
      ],
      sampleValues: { quantity: ['1', '2', '3'], discount_percent: ['0.00', '10.00', '20.00'] },
      rowCount: 30000,
    },
    {
      tableName: 'reviews',
      columns: [
        { columnName: 'id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'customer_id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'product_id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'order_id', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'rating', dataType: 'integer', isNullable: false, columnDefault: null },
        { columnName: 'title', dataType: 'text', isNullable: true, columnDefault: null },
        { columnName: 'body', dataType: 'text', isNullable: true, columnDefault: null },
        { columnName: 'created_at', dataType: 'timestamp with time zone', isNullable: true, columnDefault: 'NOW()' },
        { columnName: 'helpful_votes', dataType: 'integer', isNullable: true, columnDefault: '0' },
      ],
      foreignKeys: [
        { columnName: 'customer_id', referencedTable: 'customers', referencedColumn: 'id' },
        { columnName: 'product_id', referencedTable: 'products', referencedColumn: 'id' },
        { columnName: 'order_id', referencedTable: 'orders', referencedColumn: 'id' }
      ],
      sampleValues: { rating: ['1', '2', '3', '4', '5'], title: ['Great product!', 'Not bad', 'Could be better'] },
      rowCount: 4800,
    },
  ],
  relationships: [
    'orders.customer_id -> customers.id (many-to-one)',
    'order_items.order_id -> orders.id (many-to-one)',
    'order_items.product_id -> products.id (many-to-one)',
    'products.category_id -> categories.id (many-to-one)',
    'reviews.customer_id -> customers.id (many-to-one)',
    'reviews.product_id -> products.id (many-to-one)',
    'reviews.order_id -> orders.id (many-to-one)',
  ],
  summary: 'E-commerce database with categories, products, customers, orders, order_items, and reviews tables. Customers can place orders containing multiple products. Order items track quantity and price for each product. Products belong to categories. Customers have segments (standard, premium, vip). Orders have statuses (pending, processing, shipped, delivered, cancelled).',
  analyzedAt: new Date().toISOString(),
};
