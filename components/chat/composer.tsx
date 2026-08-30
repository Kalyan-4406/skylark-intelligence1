import type { FormEvent } from "react";

export function Composer({ value, onChange, onSubmit, disabled }: { value: string; onChange: (value: string) => void; onSubmit: () => void; disabled: boolean }) {
  function submit(event: FormEvent) { event.preventDefault(); if (value.trim() && !disabled) onSubmit(); }
  return <form className="composer" onSubmit={submit}><label htmlFor="business-question" className="sr-only">Ask a business question</label><textarea id="business-question" aria-label="Ask a business question" placeholder="Ask a business question…" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} rows={1} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (value.trim() && !disabled) onSubmit(); } }} /><button type="submit" aria-label="Send question" disabled={disabled || !value.trim()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 16 8-16 8 3-8-3-8Zm3.2 7h7.4L6.5 7l.7 4Zm-.7 6 8.1-4H7.2l-.7 4Z" /></svg></button></form>;
}
