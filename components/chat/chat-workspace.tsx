"use client";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatResponse } from "@/lib/agent/types";
import { Composer } from "./composer";
import { BrandMark, MarkdownMessage } from "./message";
import { SourceStatus } from "./source-status";
import { Suggestions } from "./suggestions";

interface DisplayMessage extends ChatMessage { id: string }

export function ChatWorkspace() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]); const [value, setValue] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [mode, setMode] = useState<"monday" | "demo" | "unknown">("unknown"); const [ready, setReady] = useState(false); const [fetchedAt, setFetchedAt] = useState<string>(); const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch("/api/health").then((response) => response.json()).then((body) => { setMode(body.configuration?.dataSource ?? "unknown"); setReady(true); }).catch(() => setReady(false)); }, []);

  async function sendQuestion(question: string) {
    const content = question.trim(); if (!content || loading) return;
    const userMessage: DisplayMessage = { id: crypto.randomUUID(), role: "user", content }; const history = [...messages, userMessage]; setMessages(history); setValue(""); setError(null); setLoading(true);
    try { const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.map(({ role, content: text }) => ({ role, content: text })) }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error?.message ?? "Analysis is temporarily unavailable."); const answer = body as ChatResponse; setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: answer.markdown }]); if (answer.source) { setMode(answer.source.mode); setFetchedAt(answer.source.fetchedAt); setReady(true); } }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Analysis is temporarily unavailable."); } finally { setLoading(false); }
  }

  const title = messages.find((message) => message.role === "user")?.content ?? "New analysis";
  return <div className="app-shell"><header className="app-header"><a className="brand" href="#main"><BrandMark /><span>Skylark Intelligence</span></a><div className="header-source"><span className={`health-dot ${ready ? "is-ready" : ""}`} />{mode === "demo" ? "Demo data · 2 workbooks" : "monday.com · 2 boards"}</div><button className="new-analysis" type="button" onClick={() => { setMessages([]); setError(null); setValue(""); }}><span aria-hidden="true">＋</span> New analysis</button></header><aside className="left-rail"><div className="rail-label">Conversations</div><button className="conversation-item is-active" type="button"><strong>{title}</strong><span>{messages.length ? "Current session" : "Ready to begin"}</span></button><SourceStatus mode={mode} ready={ready} fetchedAt={fetchedAt} /></aside><main className="conversation" id="main"><div className="conversation-inner"><section className="welcome"><h1>What does the business need to know?</h1><p>Ask about pipeline health, delivery risk, sector performance, or leadership priorities.</p><Suggestions onSelect={sendQuestion} disabled={loading} /></section><section className="messages" aria-live="polite" aria-busy={loading}>{messages.map((message) => <article className={`message ${message.role}`} key={message.id}>{message.role === "assistant" && <BrandMark />}<div className="message-body">{message.role === "assistant" ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}</div></article>)}{loading && <div className="thinking"><BrandMark /><span>Reviewing both boards</span><i /><i /><i /></div>}{error && <div className="error-message" role="alert"><strong>Analysis unavailable</strong><span>{error}</span></div>}<div ref={endRef} /></section></div><div className="composer-dock"><Composer value={value} onChange={setValue} onSubmit={() => sendQuestion(value)} disabled={loading} /><p>Answers include data-quality caveats.</p></div></main></div>;
}
