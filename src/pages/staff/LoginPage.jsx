import { Button, Form, Input, Select } from 'antd'
import { UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { DEMO_PASSWORD, DEMO_STAFF } from '@/constants/demoAccounts'
import { signIn } from '@/services/api'

export default function StaffLogin() {
  const nav = useNavigate()
  const [form] = Form.useForm()
  const [busy, setBusy] = useState(false)

  const submit = ({ email, password }) => {
    setBusy(true)
    signIn(email.trim(), password, 'STAFF')
      .then(() => nav('/staff'), (e) => form.setFields([{ name: 'password', errors: [e.message] }]))
      .finally(() => setBusy(false))
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ padding: 0, marginBottom: 20 }}><UtensilsCrossed size={22} aria-hidden="true" /> Nhà Hàng Cam</div>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Đăng nhập nhân viên</h1>
        <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
          {DEMO_STAFF.length > 0 && (
            <Form.Item label="Tài khoản demo">
              <Select placeholder="Chọn nhanh một tài khoản" onChange={(email) => form.setFieldsValue({ email, password: DEMO_PASSWORD })}
                options={DEMO_STAFF.map((u) => ({ value: u.email, label: u.label }))} />
            </Form.Item>
          )}
          <Form.Item name="email" label="Email hoặc số điện thoại" rules={[{ required: true, message: 'Nhập email' }]}><Input autoComplete="username" /></Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}><Input.Password autoComplete="current-password" /></Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={busy}>Đăng nhập</Button>
        </Form>
      </div>
    </div>
  )
}
