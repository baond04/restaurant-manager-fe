import { Button, Form, Input, Select, Tabs } from 'antd'
import { useNavigate } from 'react-router'
import { useState } from 'react'
import { DEMO_CUSTOMERS, DEMO_PASSWORD } from '@/constants/demoAccounts'
import { api, signIn } from '@/services/api'
import { useRun } from '@/hooks/useApi'
import { useAuth } from '@/stores/authStore'

export default function CustomerLogin() {
  const setSession = useAuth((s) => s.setSession)
  const nav = useNavigate()
  const run = useRun()
  const [form] = Form.useForm()
  const [busy, setBusy] = useState(false)

  const submit = ({ email, password }) => {
    setBusy(true)
    signIn(email.trim(), password, 'CUSTOMER')
      .then(() => nav('/'), (e) => form.setFields([{ name: 'password', errors: [e.message] }]))
      .finally(() => setBusy(false))
  }
  const register = (v) => run(() => api.register(v), 'Đã tạo tài khoản').then((r) => { setSession(r); nav('/') }, () => {})

  return (
    <div className="auth-split">
      <img src="/img/interior.jpg" alt="" />
      <div className="auth-panel">
        <div className="auth-box">
          <Tabs items={[
            { key: 'in', label: 'Đăng nhập', children: (
              <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
                {DEMO_CUSTOMERS.length > 0 && (
                  <Form.Item label="Tài khoản demo">
                    <Select placeholder="Chọn nhanh" onChange={(email) => form.setFieldsValue({ email, password: DEMO_PASSWORD })} options={DEMO_CUSTOMERS.map((u) => ({ value: u.email, label: u.label }))} />
                  </Form.Item>
                )}
                <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email' }]}><Input autoComplete="username" /></Form.Item>
                <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}><Input.Password autoComplete="current-password" /></Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={busy}>Đăng nhập</Button>
              </Form>
            ) },
            { key: 'up', label: 'Đăng ký', children: (
              <Form layout="vertical" onFinish={register} requiredMark={false}>
                <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}><Input autoComplete="name" /></Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}><Input autoComplete="email" /></Form.Item>
                <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, pattern: /^0\d{9}$/, message: 'Số điện thoại 10 số' }]}><Input autoComplete="tel" /></Form.Item>
                <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 8, message: 'Ít nhất 8 ký tự' }]}><Input.Password autoComplete="new-password" /></Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={run.pending}>Tạo tài khoản</Button>
              </Form>
            ) },
          ]} />
        </div>
      </div>
    </div>
  )
}
