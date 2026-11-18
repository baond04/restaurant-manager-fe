import { Form, Modal } from 'antd'
import { api } from '@/services/api'
import { useRun } from '@/hooks/useApi'

/** Modal thêm/sửa dùng chung. value = {} là thêm mới, có id là sửa. */
export default function FormModal({ value, title, onClose, onSubmit, children, width = 560 }) {
  const [form] = Form.useForm()
  const isNew = !value?.id
  return (
    <Modal open title={`${isNew ? 'Thêm' : 'Sửa'} ${title}`} width={width} okText="Lưu" cancelText="Hủy" onCancel={onClose} onOk={form.submit} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false} initialValues={value} onFinish={(v) => onSubmit(v, isNew).then(onClose, () => {})}>
        {typeof children === 'function' ? children(form) : children}
      </Form>
    </Modal>
  )
}

/** Lưu và xóa một bảng, có thông báo. */
export function useCrud(col, label) {
  const run = useRun()
  return {
    save: (value, data, isNew = !value?.id) => run(() => (isNew ? api.create(col, data) : api.update(col, value.id, data)), isNew ? `Đã thêm ${label}` : 'Đã lưu'),
    remove: (id) => run(() => api.remove(col, id), `Đã xóa ${label}`),
    run,
  }
}
