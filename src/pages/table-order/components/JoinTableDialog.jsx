import { QrCode } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input } from '@/components/ui/input'
import { useCol } from '@/hooks/useApi'

// shortcut: mới nhập mã bàn; máy quét trong trang và PIN của phiên bàn làm ở bước 3.3 của plan.
export default function JoinTableDialog({ open, onOpenChange }) {
  const { data: tables } = useCol('tables')
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const t = tables.find((x) => x.isActive && x.code.toLowerCase() === code.trim().toLowerCase())
    if (!t) return setError('Không tìm thấy bàn')
    setError(''); setCode(''); onOpenChange(false)
    nav(`/t/${t.qrToken}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Gọi món tại bàn" className="max-w-sm font-sans">
        <div className="flex items-center gap-3 rounded-panel bg-brand-50 p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white"><QrCode size={26} aria-hidden="true" /></span>
          <p className="text-s4 text-ink">Quét mã QR trên bàn bằng camera điện thoại</p>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <Field label="Hoặc nhập mã bàn" error={error}>
            {(f) => <Input {...f} value={code} onChange={(e) => setCode(e.target.value)} placeholder="T02" autoCapitalize="characters" autoComplete="off" />}
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={!code.trim()}>Vào bàn</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
