import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { tokens } from '../theme';

/**
 * Reusable area chart with the Pulse violet gradient style.
 * Props:
 *   data     – array of { date, value } objects
 *   dataKey  – key for the value axis (default: "value")
 *   mini     – boolean, renders a compact sparkline when true
 *   xKey     – key for the x-axis (default: "date")
 *   label    – optional axis label
 */
export default function TrendChart({ data = [], dataKey = 'value', xKey = 'date', mini = false, label }) {
  const chartHeight = mini ? 60 : 280;
  const gradientId = `pulseGradient-${dataKey}-${mini ? 'mini' : 'full'}`;

  if (data.length === 0) {
    return (
      <Box sx={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No data yet
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={data} margin={mini ? { top: 4, right: 4, left: 0, bottom: 0 } : { top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tokens.chartGradientStart} stopOpacity={1} />
            <stop offset="100%" stopColor={tokens.chartGradientEnd} stopOpacity={1} />
          </linearGradient>
        </defs>

        {!mini && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={tokens.chartGrid}
            vertical={false}
          />
        )}

        {!mini && (
          <XAxis
            dataKey={xKey}
            stroke={tokens.chartAxis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
        )}

        {!mini && (
          <YAxis
            stroke={tokens.chartAxis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={40}
            label={label ? { value: label, angle: -90, position: 'insideLeft', fill: tokens.chartAxis, fontSize: 12 } : undefined}
          />
        )}

        {!mini && (
          <Tooltip
            contentStyle={{
              backgroundColor: tokens.surfaceRaised,
              border: `1px solid ${tokens.borderViolet}`,
              borderRadius: 8,
              color: tokens.text,
              fontSize: 13,
            }}
            labelStyle={{ color: tokens.chartAxis }}
            cursor={{ stroke: tokens.violet, strokeWidth: 1, strokeDasharray: '4 4' }}
          />
        )}

        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={tokens.violetBright}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={mini ? false : { r: 4, fill: tokens.violetBright, stroke: tokens.page, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
