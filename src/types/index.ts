export type LLMProvider = 'anthropic' | 'openai' | 'groq';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
}

export const DEFAULT_MODELS: Record<LLMProvider, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o',
  groq: 'llama-3.3-70b-versatile',
};

export interface DbConnection {
  id: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
}

export interface ForeignKey {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKey[];
  sampleValues: Record<string, unknown[]>;
  rowCount: number;
}

export interface SchemaAnalysis {
  tables: TableSchema[];
  relationships: string[];
  summary: string;
  analyzedAt: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  sql: string;
}

export interface ChartRecommendation {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'table' | 'grouped_bar' | 'area';
  xAxis?: string;
  yAxis?: string | string[];
  title: string;
  reasoning: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  queryResult?: QueryResult;
  chartRecommendation?: ChartRecommendation;
  timestamp: string;
  error?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  sql: string;
  naturalLanguageQuery: string;
  chartType: ChartRecommendation['type'];
  chartConfig: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
  columns?: string[];
  rows?: Record<string, unknown>[];
  createdAt?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}
