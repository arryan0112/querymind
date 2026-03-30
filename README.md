# QueryMind

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)

QueryMind is a conversational BI platform that lets you ask questions about your data in plain English and instantly get visualizations.

## What it does

QueryMind uses AI to translate natural language questions into SQL queries, executes them against your database, and automatically generates appropriate visualizations. Key features include:

- **Text-to-SQL**: Ask questions in plain English and get SQL queries automatically
- **Demo Database**: Try the platform with a pre-seeded e-commerce dataset
- **Schema Analysis**: Automatic database introspection with LLM-generated summaries
- **Auto Charts**: Intelligent chart type recommendations based on your data
- **Dashboards**: Save visualizations and arrange them in shareable dashboards
- **Sharing**: Generate public links to share dashboards with others

## Live demo

Try the live demo at: **https://your-domain.vercel.app**

Credentials:
- Username: `demo`
- Password: `demo1234`

## Screenshots

![Chat interface](./screenshots/chat.png)

*Note: Add screenshots before deployment.*

## Tech stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | Next.js 16 | Full-stack React framework |
| Language | TypeScript | Type safety |
| Database | PostgreSQL | Data storage |
| ORM | pg | PostgreSQL client |
| Auth | NextAuth.js | Authentication |
| AI | Anthropic/OpenAI/Groq | SQL generation |
| Charts | Recharts | Data visualization |
| UI | Tailwind + shadcn/ui | Styling |
| State | Zustand | Client state |

## Quick start (local development)

```bash
git clone https://github.com/arryan0112/querymind.git
cd queryMind
npm install
cp .env.example .env.local
# Edit .env.local with your values (see Configuration section)
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

Create a `.env.local` file with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_SECRET` | Secret for NextAuth.js encryption | Yes |
| `NEXTAUTH_URL` | Base URL for auth (e.g., http://localhost:3000) | Yes |
| `APP_DATABASE_URL` | PostgreSQL connection string for app data (users, dashboards) | Yes |
| `DEMO_DATABASE_URL` | PostgreSQL connection string for demo e-commerce data | Yes |
| `DEMO_USERNAME` | Username for demo login | Yes |
| `DEMO_PASSWORD` | Password for demo login | Yes |

## Architecture

### Schema Introspection Flow
1. User connects to a database
2. Server introspects schema: tables, columns, foreign keys, row counts, sample values
3. Schema is cached in memory (30 min TTL) for fast queries
4. LLM generates a human-readable summary of the database

### SQL Generation Pipeline
1. User asks a question in natural language
2. System builds a prompt with: schema, conversation history, current question
3. LLM generates a SELECT query
4. Query is validated (safety check + SELECT-only)
5. Query executes against user's database with row/timeout limits
6. Results are returned with auto-generated chart recommendations

### Safety Mechanisms
- **SQL Validation**: Only SELECT queries allowed (no DROP, DELETE, UPDATE, etc.)
- **Parameterization**: All user input passed via parameterized queries
- **Row Limits**: Max 500 rows per query (prevents huge result sets)
- **Timeout**: 10 second query timeout
- **API Key Handling**: Keys stored client-side, never sent to our servers

### Connection Registry
- In-memory Map keyed by `${userId}:${connectionId}`
- 30-minute TTL per connection
- Note: Production should use Redis for persistence across restarts

## Example queries

Try these queries against the demo database:

1. "What were the top 5 products by revenue last month?"
2. "Show me order count by day for the past 30 days"
3. "Which customers have placed more than 10 orders but never left a review?"
4. "Compare revenue by category this quarter vs last quarter"
5. "What is the average order value by customer segment?"

## Security

- **API Keys**: Never stored server-side, passed directly to AI providers
- **SQL Safety**: All queries validated before execution, no DDL/DML allowed
- **Parameterized Queries**: Prevents SQL injection throughout
- **Row Limits**: Enforced 500-row maximum
- **Rate Limiting**: 20 queries/minute per user (in-memory, production should use Redis)

## Known Limitations

- **Connection Registry**: In-memory storage resets on server restart (production: use Redis)
- **Rate Limiting**: In-memory implementation (production: use Redis)
- **Database Support**: PostgreSQL only (currently)

## Deployment

### Vercel (Recommended)

1. Fork this repository
2. Import in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
docker build -t querymind .
docker run -p 3000:3000 -e .env.local querymind
```

## License

MIT
