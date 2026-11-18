import { useEffect, useState } from 'react'

const stripHtml = (s) => new DOMParser().parseFromString(s || '', 'text/html').body.textContent

export default function CreditsPage() {
  const [rows, setRows] = useState([])
  useEffect(() => { fetch('/img/credits.json').then((r) => r.json()).then((d) => setRows(Object.values(d)), () => setRows([])) }, [])
  return (
    <div className="wrap page">
      <h1 className="page-title">Nguồn ảnh</h1>
      <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
        {rows.map((r) => <li key={r.page}><a href={r.page} target="_blank" rel="noreferrer">{r.title.replace(/^File:/, '')}</a> · {stripHtml(r.artist)} · {r.license}</li>)}
      </ul>
    </div>
  )
}
