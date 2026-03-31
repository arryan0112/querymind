# QueryMind

QueryMind is a conversational BI platform that lets you ask questions about your data in plain English and instantly get visualizations. It translates natural language queries into SQL, executes them against your database, and automatically generates appropriate charts.

## Features

- **Natural Language to SQL** — Ask questions in plain English and get instant SQL queries
- **Demo Database** — Try the platform with a pre-seeded e-commerce dataset (products, customers, orders, reviews)
- **Auto-Visualizations** — Automatically generates charts based on your data structure
- **Dashboards** — Save charts to create customizable dashboards
- **Shareable Links** — Generate public links to share dashboards with others
- **Responsive Design** — Works beautifully on any screen size
- **Dark/Light Mode** — Toggle between themes

## Quick Start

```bash
# Clone the repository
git clone https://github.com/arryan0112/querymind.git
cd querymind

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

- **Username:** demo
- **Password:** demo1234

## Example Queries

Try these queries with the demo database:

| Category | Example Query |
|----------|---------------|
| Products | "top 5 products" |
| Products | "top 7 most sold products" |
| Products | "products by revenue" |
| Customers | "top 3 customers" |
| Customers | "best customers by spending" |
| Revenue | "monthly revenue" |
| Revenue | "revenue by category" |
| Orders | "recent orders" |
| Orders | "orders by status" |

## Configuration

Create a `.env.local` file with the following variables:

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Secret for NextAuth.js encryption |
| `NEXTAUTH_URL` | Base URL (e.g., http://localhost:3000) |
| `APP_DATABASE_URL` | PostgreSQL connection for app data (users, dashboards) |
| `DEMO_DATABASE_URL` | PostgreSQL connection for demo e-commerce data |
| `DEMO_USERNAME` | Demo login username |
| `DEMO_PASSWORD` | Demo login password |

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| Auth | NextAuth.js |
| AI | Groq / OpenAI / Anthropic |
| Charts | Recharts |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand |

## Security

- **SQL Safety** — Only SELECT queries allowed, no DDL/DML
- **Parameterized Queries** — Prevents SQL injection
- **Row Limits** — Maximum 500 rows per query
- **Query Timeout** — 10 second timeout prevents long-running queries
- **API Keys** — Stored client-side, never sent to server

## License

MIT License