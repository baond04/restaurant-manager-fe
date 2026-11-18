import { Empty } from 'antd'

/** Danh sách dòng đơn giản (antd 6 đã bỏ List). */
export function Rows({ data, children, empty = 'Không có', header, footer }) {
  return (
    <div className="rows">
      {header && <div className="rows-head">{header}</div>}
      {data.length ? <ul>{data.map((x, i) => <li key={x.id ?? i}>{children(x)}</li>)}</ul> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />}
      {footer && <div className="rows-foot">{footer}</div>}
    </div>
  )
}

export function Row({ avatar, title, desc, extra, children }) {
  return (
    <div className="row-item">
      {avatar}
      <div className="row-main">{title && <div className="row-title">{title}</div>}{desc && <div className="muted">{desc}</div>}{children}</div>
      {extra && <div className="row-extra">{extra}</div>}
    </div>
  )
}
