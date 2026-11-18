import { Button, DatePicker, Descriptions, Input, Select, Table } from 'antd'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/services/api'
import { byId, useAiModel, useCol, useRun } from '@/hooks/useApi'
import { useStaff } from '@/stores/authStore'
import { PageHeader, Toolbar } from '@/components/common/ui'
import { dayjs, fmtDateTime, inRange, matches } from '@/utils/format'

const FEEDBACK = { 1: 'Hữu ích', '-1': 'Chưa hữu ích', 0: 'Chưa đánh giá' }

export default function AiPage() {
  const { can } = useStaff()
  const run = useRun()
  const { data: model, refetch } = useAiModel()
  const { data: chats, isLoading } = useCol('chatSessions')
  const users = byId(useCol('users').data)
  const [q, setQ] = useState('')
  const [fb, setFb] = useState()
  const [cart, setCart] = useState()
  const [range, setRange] = useState([dayjs().subtract(29, 'day'), dayjs()])
  const rows = chats.filter((c) => matches(q, c.title, users[c.customerId]?.fullName) && (fb === undefined || c.feedback === fb) && (cart === undefined || c.addedToCart === cart) && inRange(c.createdAt, range))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <PageHeader title="Trợ lý AI" extra={can('ai:manage') && (
        <Button type="primary" loading={run.pending} onClick={() => run(api.retrain, 'Đã huấn luyện lại mô hình gợi ý').then(() => refetch(), () => {})}>Huấn luyện lại mô hình</Button>
      )} />
      {model && (
        // Chỉ mục RAG tự dựng lại khi thực đơn đổi (AI service so hash), nên không có nút "index lại"
        <Descriptions className="card" style={{ marginBottom: 16 }} column={{ xs: 1, md: 3 }} size="small" items={[
          { label: 'AI service', children: model.status === 'ok' ? 'Đang chạy' : (model.error ?? 'Không kết nối được') },
          { label: 'Mô hình gợi ý (GNN+GCL)', children: model.recommender?.trained ? `Đã huấn luyện · ${model.recommender.n_users} khách, ${model.recommender.n_items} món, ${model.recommender.n_interactions} tương tác` : (model.recommender?.reason ?? 'Chưa huấn luyện') },
          { label: 'Mô hình ngôn ngữ', children: model.llm ?? '—' },
          { label: 'Truy xuất', children: model.retriever ?? '—' },
        ]} />
      )}
      <Toolbar onReset={() => { setQ(''); setFb(); setCart(); setRange([dayjs().subtract(29, 'day'), dayjs()]) }}>
        <Input allowClear prefix={<Search size={16} />} placeholder="Câu hỏi, tên khách" value={q} onChange={(e) => setQ(e.target.value)} />
        <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} format="DD/MM/YYYY" allowClear={false} />
        <Select allowClear placeholder="Phản hồi" value={fb} onChange={setFb} options={[1, -1, 0].map((v) => ({ value: v, label: FEEDBACK[v] }))} />
        <Select allowClear placeholder="Thêm vào giỏ" value={cart} onChange={setCart} options={[{ value: true, label: 'Có' }, { value: false, label: 'Không' }]} />
      </Toolbar>
      <Table rowKey="id" loading={isLoading} dataSource={rows} scroll={{ x: 760 }} pagination={{ hideOnSinglePage: true, pageSize: 10, showTotal: (n) => `${n} hội thoại` }} columns={[
        { title: 'Thời gian', dataIndex: 'createdAt', render: fmtDateTime, width: 150 },
        { title: 'Khách', render: (_, c) => users[c.customerId]?.fullName ?? 'Khách tại bàn' },
        { title: 'Câu hỏi đầu', dataIndex: 'title' },
        { title: 'Số lượt', dataIndex: 'turns', className: 'num' },
        { title: 'Phản hồi', dataIndex: 'feedback', render: (v) => FEEDBACK[v] },
        { title: 'Thêm vào giỏ', dataIndex: 'addedToCart', render: (v) => (v ? 'Có' : 'Không') },
        { title: 'Độ trễ', dataIndex: 'latencyMs', className: 'num', render: (v) => `${(v / 1000).toFixed(1)}s`, sorter: (a, b) => a.latencyMs - b.latencyMs },
      ]} />
    </>
  )
}
