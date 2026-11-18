import { App, Button, Upload } from 'antd'
import { ImagePlus, X } from 'lucide-react'

const MAX_MB = 2
const MAX_SIDE = 480

/** Thu nhỏ ảnh để lưu trong localStorage. Bản thật: upload lên BE (jpg, png, webp, tối đa 2MB; spec mục 10). */
function toSmallDataUrl(file) {
  return new Promise((ok, fail) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const c = Object.assign(document.createElement('canvas'), { width: img.width * k, height: img.height * k })
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      ok(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = fail
    img.src = URL.createObjectURL(file)
  })
}

/** Ô chọn ảnh, dùng trong Form.Item (nhận value, onChange). */
export default function ImageInput({ value, onChange }) {
  const { message } = App.useApp()
  const pick = (file) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) message.error('Chỉ nhận ảnh jpg, png, webp')
    else if (file.size > MAX_MB * 1024 * 1024) message.error(`Ảnh tối đa ${MAX_MB}MB`)
    else toSmallDataUrl(file).then(onChange, () => message.error('Không đọc được ảnh'))
    return false // không tải lên ngay, chỉ đọc ở trình duyệt
  }
  return (
    <div className="row-gap">
      {value && <img src={value} alt="" width={64} height={64} className="thumb" />}
      <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={pick}>
        <Button icon={<ImagePlus size={16} />}>{value ? 'Đổi ảnh' : 'Chọn ảnh'}</Button>
      </Upload>
      {value && <Button type="text" aria-label="Bỏ ảnh" icon={<X size={16} />} onClick={() => onChange(null)} />}
    </div>
  )
}
