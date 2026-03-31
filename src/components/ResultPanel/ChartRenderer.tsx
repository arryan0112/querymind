'use client';

import { memo } from 'react';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartRecommendation } from '@/types';
import { Button } from '@/components/ui/button';

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

interface ChartRendererProps {
  type: ChartRecommendation['type'];
  columns: string[];
  rows: Record<string, unknown>[];
  title: string;
  onTypeChange?: (type: ChartRecommendation['type']) => void;
}

function ChartRenderer({
  type,
  columns,
  rows,
  title,
  onTypeChange,
}: ChartRendererProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  const chartTypes: ChartRecommendation['type'][] = [
    'bar',
    'line',
    'area',
    'pie',
    'scatter',
    'grouped_bar',
  ];

  const formatDateLabel = (val: unknown): string => {
    if (val instanceof Date) {
      return val.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return String(val);
  };

  const getLabelColumn = () => {
    const dateCol = columns.find((col) => {
      const sample = rows[0]?.[col];
      return (
        sample instanceof Date ||
        (typeof sample === 'string' && (sample.match(/^\d{4}-\d{2}-\d{2}/) || sample.match(/^\d{4}-\d{2}-\d{2}T/) || sample.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)))
      );
    });
    if (dateCol) return dateCol;
    
    const nameColumns = ['name', 'title', 'label', 'product_name', 'category', 'segment', 'status', 'country', 'state', 'city', 'first_name', 'last_name', 'email'];
    for (const col of nameColumns) {
      if (columns.includes(col)) return col;
    }
    
    return columns[0];
  };

  const isDateColumn = (col: string): boolean => {
    const sample = rows[0]?.[col];
    if (sample instanceof Date) return true;
    if (typeof sample === 'string') {
      return !!(sample.match(/^\d{4}-\d{2}-\d{2}/) || sample.match(/^\d{4}-\d{2}-\d{2}T/) || sample.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));
    }
    return false;
  };

  const getData = () => {
    const labelCol = getLabelColumn();
    const isDate = isDateColumn(labelCol);
    return rows.map((row, idx) => {
      const obj: Record<string, unknown> = { _index: idx };
      columns.forEach((col) => {
        const val = row[col];
        if (col === labelCol) {
          obj.label = isDate ? formatDateLabel(val) : String(val);
          obj[labelCol] = val;
        } else if (typeof val === 'number') {
          obj[col] = val;
        } else if (typeof val === 'string' && val !== '' && !isNaN(Number(val))) {
          obj[col] = Number(val);
        } else {
          obj[col] = String(val);
        }
      });
      return obj;
    });
  };

  const data = getData();
  const labelCol = getLabelColumn();

  const getNumericColumns = () => {
    return columns.filter((col) => {
      return rows.some((row) => {
        const val = row[col];
        return typeof val === 'number' || (typeof val === 'string' && val !== '' && !isNaN(Number(val)));
      });
    });
  };

  const renderChart = () => {
    const xCol = labelCol;
    const numericCols = getNumericColumns();

    switch (type) {
      case 'bar':
      case 'grouped_bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(_label, payload) => String(payload?.[0]?.payload?.label || '')}
              />
              <Legend />
              {numericCols.slice(0, type === 'grouped_bar' ? 5 : 1).map((col, i) => (
                <Bar
                  key={col}
                  dataKey={col}
                  name={col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  fill={COLORS[i % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
      case 'area':
        const ChartComponent = type === 'area' ? AreaChart : LineChart;
        const DataComponent = type === 'area' ? Area : Line;
        return (
          <ResponsiveContainer width="100%" height={320}>
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(_label, payload) => String(payload?.[0]?.payload?.label || '')}
              />
              <Legend />
              {numericCols.slice(0, 3).map((col, i) => (
                <DataComponent
                  key={col}
                  type="monotone"
                  dataKey={col}
                  name={col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  stroke={COLORS[i % COLORS.length]}
                  fill={type === 'area' ? COLORS[i % COLORS.length] : undefined}
                  fillOpacity={type === 'area' ? 0.3 : undefined}
                />
              ))}
            </ChartComponent>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = data.slice(0, 8).map((d, i) => ({
          name: d.label || `Item ${i + 1}`,
          value: d[numericCols[0]] || 0,
        }));
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: unknown) => [Number(value).toLocaleString(), 'Value']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        const xNumeric = numericCols[0] || columns[0];
        const yNumeric = numericCols[1] || numericCols[0] || columns[1];
        return (
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey={xNumeric} name={xNumeric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} tick={{ fontSize: 12 }} />
              <YAxis dataKey={yNumeric} name={yNumeric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Table view only
          </div>
        );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">{title}</h3>
        {onTypeChange && (
          <div className="flex gap-1">
            {chartTypes.map((t) => (
              <Button
                key={t}
                variant={type === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTypeChange(t)}
                className="text-xs px-2 py-1"
              >
                {t === 'grouped_bar' ? 'Group' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>
      {renderChart()}
    </div>
  );
}

const memoizedChartRenderer = memo(ChartRenderer, (prev, next) => {
  return prev.rows === next.rows && prev.type === next.type;
});

export { memoizedChartRenderer as ChartRenderer };
