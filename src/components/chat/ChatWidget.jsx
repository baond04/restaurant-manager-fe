import { CalendarDays, Eye, Plus, SendHorizontal, Sparkles, Star, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { DishPhoto, Money } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { byId, useCol } from '@/hooks/useApi'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'

const SUGGESTIONS = ['Gợi ý món cho 4 người, không ăn cay', 'Có món chay không?', 'Tối nay còn bàn cho 6 người không?']

/**
 * Trợ lý chỉ hỏi đáp, không tự đặt bàn hay gọi món. Việc web đã có thì đưa nút dẫn sang trang đó (bảng ý định → điều hướng, báo cáo mục 3.7).
 * Ở trang gọi món tại bàn (có onAdd), khách bấm "Thêm" để đưa món vào giỏ và vẫn tự bấm gửi món.
 */
function actionsFor(res) {
  const people = res.constraints?.party_size
  if (res.intent === 'BAN_TRONG') return [{ to: `/booking${people ? `?guests=${people}` : ''}`, label: 'Đặt bàn', icon: CalendarDays }]
  if (res.intent === 'PHAN_HOI') return [{ to: '/account?tab=orders', label: 'Viết đánh giá', icon: Star }]
  return []
}

export default function ChatWidget({ open, onClose, onAdd }) {
  const items = byId(useCol('items').data)
  const [msgs, setMsgs] = useState([{ role: 'ai', text: 'Chào bạn, bạn muốn ăn gì hôm nay?' }])
  const [sessionId, setSessionId] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)
  const scroll = () => setTimeout(() => end.current?.scrollIntoView({ behavior: 'smooth' }), 50)

  const ask = (q) => {
    if (!q.trim() || busy) return
    setMsgs((m) => [...m, { role: 'me', text: q }])
    setText('')
    setBusy(true)
    api.chat(sessionId, q)
      .then((r) => {
        setSessionId(r.sessionId)
        const picks = (r.itemIds ?? []).map((id) => items[id]).filter(Boolean)
        setMsgs((m) => [...m, { role: 'ai', text: r.reply, items: picks, actions: actionsFor(r), feedback: 0 }])
      }, (e) => setMsgs((m) => [...m, { role: 'ai', text: e.message, error: true }]))
      .finally(() => { setBusy(false); scroll() })
  }
  const rate = (i, v) => {
    const next = msgs[i].feedback === v ? 0 : v
    setMsgs((m) => m.map((x, k) => (k === i ? { ...x, feedback: next } : x)))
    if (sessionId) api.chatFeedback(sessionId, next).catch(() => {})
  }
  const add = (i, it) => {
    onAdd(it, 'CHATBOT')
    if (sessionId) api.chatFeedback(sessionId, msgs[i].feedback ?? 0, true).catch(() => {})
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent title={<span className="flex items-center gap-2"><Sparkles size={18} className="text-brand-700" aria-hidden="true" />Trợ lý nhà hàng</span>} className="font-sans">
        <div aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-brand-50 p-4">
          {msgs.map((m, i) => (
            <div key={i} className={cn('max-w-[88%] rounded-site px-4 py-2.5 text-s4', m.role === 'me' ? 'ml-auto rounded-br-md bg-brand-700 text-white' : 'rounded-bl-md bg-white text-ink', m.error && 'text-danger')}>
              <p className="whitespace-pre-line">{m.text}</p>
              {m.items?.map((it) => (
                <div key={it.id} className="mt-2 flex items-center gap-3 border-t border-brand-100 pt-2">
                  <DishPhoto src={it.image} className="size-11 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{it.name}</span><Money value={it.price} className="text-s5 text-brand-700" /></span>
                  {onAdd
                    ? <Button size="sm" variant="secondary" onClick={() => add(i, it)}><Plus size={14} aria-hidden="true" />Thêm</Button>
                    : <Button size="sm" variant="ghost" asChild><Link to={`/menu?q=${encodeURIComponent(it.name)}`} onClick={onClose}><Eye size={14} aria-hidden="true" />Xem</Link></Button>}
                </div>
              ))}
              {m.actions?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.actions.map(({ to, label, icon: Icon }) => (
                    <Button key={to} size="sm" asChild><Link to={to} onClick={onClose}><Icon size={14} aria-hidden="true" />{label}</Link></Button>
                  ))}
                </div>
              )}
              {m.role === 'ai' && i > 0 && !m.error && (
                <div className="mt-1.5 flex gap-1">
                  <Button variant={m.feedback === 1 ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Hữu ích" aria-pressed={m.feedback === 1} onClick={() => rate(i, 1)}><ThumbsUp size={14} aria-hidden="true" /></Button>
                  <Button variant={m.feedback === -1 ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Chưa hữu ích" aria-pressed={m.feedback === -1} onClick={() => rate(i, -1)}><ThumbsDown size={14} aria-hidden="true" /></Button>
                </div>
              )}
            </div>
          ))}
          {busy && <div className="w-fit rounded-site rounded-bl-md bg-white px-4 py-2.5 text-s4 text-ink-soft">Đang trả lời…</div>}
          <div ref={end} />
        </div>
        <div className="shrink-0 space-y-2 border-t border-brand-100 p-3">
          {msgs.length === 1 && <div className="flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <Button key={s} size="sm" variant="outline" className="h-auto min-h-8 py-1.5 text-left whitespace-normal" onClick={() => ask(s)}>{s}</Button>)}</div>}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(text) }}>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập câu hỏi" aria-label="Câu hỏi" maxLength={500} />
            <Button type="submit" size="icon" aria-label="Gửi" disabled={!text.trim() || busy}><SendHorizontal size={16} aria-hidden="true" /></Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
