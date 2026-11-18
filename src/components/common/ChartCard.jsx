import { Segmented, Table } from 'antd'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const INK = '#ea580c'
const AXIS = { fontSize: 12, fill: '#7a736c' }
const compact = (n) => (Math.abs(n) >= 1e6 ? `${+(n / 1e6).toFixed(1)}tr` : Math.abs(n) >= 1e3 ? `${Math.round(n / 1e3)}k` : n)

/**
 * Một biểu đồ một chuỗi số (một màu, không cần chú giải) kèm chế độ xem bảng.
 * kind: 'line' | 'bar' | 'hbar'. data: [{ label, value }]. fmt: định dạng giá trị.
 */
export default function ChartCard({ title, data, kind = 'bar', fmt = (v) => v, valueLabel = 'Giá trị', height = 260 }) {
  const [view, setView] = useState('chart')
  const tip = <Tooltip formatter={(v) => [fmt(v), valueLabel]} cursor={{ fill: '#f5f2ee' }} contentStyle={{ borderRadius: 6, borderColor: '#dcd7d0' }} />
  return (
    <section className="card">
      <div className="row-between" style={{ marginBottom: 8 }}>
        <h2 className="card-title" style={{ margin: 0 }}>{title}</h2>
        <Segmented size="small" value={view} onChange={setView} options={[{ value: 'chart', label: 'Biểu đồ' }, { value: 'table', label: 'Bảng' }]} />
      </div>
      {view === 'table' ? (
        <Table size="small" rowKey="label" dataSource={data} pagination={data.length > 8 ? { pageSize: 8 } : false} columns={[
          { title: 'Mục', dataIndex: 'label' },
          { title: valueLabel, dataIndex: 'value', className: 'num', render: fmt, sorter: (a, b) => a.value - b.value },
        ]} />
      ) : (
        <div style={{ height: kind === 'hbar' ? Math.max(160, data.length * 30) : height }} role="img" aria-label={title}>
          <ResponsiveContainer>
            {kind === 'line' ? (
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#ece8e3" />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#dcd7d0' }} minTickGap={16} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={44} />
                {tip}
                <Line dataKey="value" stroke={INK} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            ) : kind === 'hbar' ? (
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={4}>
                <CartesianGrid horizontal={false} stroke="#ece8e3" />
                <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} />
                <YAxis type="category" dataKey="label" tick={AXIS} tickLine={false} axisLine={false} width={130} />
                {tip}
                <Bar dataKey="value" fill={INK} radius={[0, 3, 3, 0]} maxBarSize={14} />
              </BarChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="#ece8e3" />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#dcd7d0' }} minTickGap={8} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compact} width={44} />
                {tip}
                <Bar dataKey="value" fill={INK} radius={[3, 3, 0, 0]} maxBarSize={20} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
