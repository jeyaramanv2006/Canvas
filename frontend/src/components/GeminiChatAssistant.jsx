import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Minus, 
  Send, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  User, 
  Info
} from 'lucide-react';
import { BASE_URL, getToken } from '../api/client';

// Clean Markdown & structured item formatter
function FormattedMessage({ text }) {
  if (!text) return null;

  const blocks = text.split('\n\n');

  return (
    <div className="space-y-3 text-[13px] leading-relaxed">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');

        return (
          <div key={bIdx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              const lTrim = line.trim();
              if (!lTrim) return null;

              // Bullet item (- or * or •)
              if (lTrim.startsWith('- ') || lTrim.startsWith('* ') || lTrim.startsWith('• ')) {
                const content = lTrim.replace(/^[-*•]\s*/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2 text-neutral-300">
                    <span className="text-amber-400/90 select-none text-[11px] mt-0.5">•</span>
                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
                  </div>
                );
              }

              // Numbered item (e.g. 1. Title)
              const numMatch = lTrim.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pt-1 text-white font-medium">
                    <span className="text-amber-400 font-semibold select-none">{numMatch[1]}.</span>
                    <span className="flex-1" dangerouslySetInnerHTML={{ __html: renderInline(numMatch[2]) }} />
                  </div>
                );
              }

              // Regular paragraph or title
              return (
                <p key={lIdx} className="text-neutral-200" dangerouslySetInnerHTML={{ __html: renderInline(lTrim) }} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-neutral-300">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-black/40 text-amber-300 px-1 py-0.5 rounded text-xs font-mono border border-white/5">$1</code>')
    .replace(/\*\*/g, ''); // strip any leftover stray asterisks
}

export default function GeminiChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'How can I help you?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastExecutedSQL, setLastExecutedSQL] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, statusMessage]);

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStatusMessage('');
    setLastExecutedSQL(null);

    // Prepare assistant streaming placeholder
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: '',
        isStreaming: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    abortControllerRef.current = new AbortController();

    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/assistant/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6)
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.status) {
                if (data.status === 'analyzing') {
                  setStatusMessage('Searching records...');
                } else if (data.status === 'querying') {
                  if (data.query) setLastExecutedSQL(data.query);
                } else if (data.status === 'generating') {
                  setStatusMessage('');
                }
              }

              if (data.chunk) {
                setStatusMessage('');
                accumulatedText += data.chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx] && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      text: accumulatedText,
                      isStreaming: true,
                      executedSQL: data.executedSQL || updated[lastIdx].executedSQL || lastExecutedSQL
                    };
                  }
                  return updated;
                });
              }

              if (data.done) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (updated[lastIdx] && updated[lastIdx].role === 'assistant') {
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      isStreaming: false,
                      modelUsed: data.modelUsed, // Authentic model reported by backend API
                      executedSQL: data.executedSQL || lastExecutedSQL
                    };
                  }
                  return updated;
                });
                break;
              }
            } catch {
              // Ignore partial chunk parsing
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]) {
            updated[lastIdx].isStreaming = false;
            updated[lastIdx].text += ' *(Generation stopped)*';
          }
          return updated;
        });
      } else {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]) {
            updated[lastIdx].isStreaming = false;
            updated[lastIdx].text = `⚠️ Error: ${err.message}`;
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setStatusMessage('');
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'How can I help you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button - Apple Glassmorphism Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-black/60 backdrop-blur-2xl border border-white/15 hover:border-amber-400/60 shadow-[0_12px_32px_rgba(0,0,0,0.7)] text-amber-400 hover:scale-105 active:scale-95 transition-all duration-200 group"
          title="Canvass AI"
          aria-label="Open Canvass AI"
        >
          <Sparkles className="w-5 h-5 text-amber-400 transition-transform duration-200 group-hover:rotate-12" />
        </button>
      )}

      {/* Apple Notification Bar Inspired Glassmorphism Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-[#0b0c10]/80 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] shadow-[0_24px_64px_rgba(0,0,0,0.85)] ring-1 ring-inset ring-white/[0.05] rounded-3xl overflow-hidden font-sans
            ${isExpanded 
              ? 'inset-4 sm:inset-10' 
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[410px] h-[82vh] sm:h-[580px] max-h-[85vh]'
            }`}
        >
          {/* Header - Apple Notification Bar Style */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06] backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600/30 via-amber-500/20 to-neutral-800 border border-white/10 flex items-center justify-center shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[13px] text-white tracking-tight flex items-center gap-1.5">
                  Canvass AI
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClear}
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-neutral-400 hover:text-white flex items-center justify-center transition-colors border border-white/[0.04]"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-neutral-400 hover:text-white items-center justify-center transition-colors border border-white/[0.04] hidden sm:flex"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors border border-white/[0.04]"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Apple-style Callout Banner: Specificity Warning with Dismiss Button */}
          {showTip && (
            <div className="px-3 pt-2.5">
              <div className="px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-red-500/[0.05] to-transparent border border-amber-400/20 flex items-start justify-between gap-2 text-[11px] text-amber-200/90 shadow-sm">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <span className="font-semibold text-amber-300">Tip:</span> Ask specific questions (include school names, canvasser, or dates) rather than general queries for accurate results.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTip(false)}
                  className="text-neutral-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
                  title="Dismiss tip"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Messages Container - Clean Frosted Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-red-600/90 to-red-700/85 text-white rounded-br-sm shadow-md shadow-red-950/40 border border-red-500/30'
                      : 'bg-white/[0.05] border border-white/[0.08] text-neutral-100 rounded-bl-sm shadow-sm backdrop-blur-md'
                  }`}
                >
                  <FormattedMessage text={msg.text} />

                  {/* Typing / Streaming Cursor */}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-400 animate-pulse align-middle rounded-full" />
                  )}

                  {/* Authentic Model Attribution & Timestamp */}
                  <div className="flex items-center justify-between gap-2 mt-1.5 text-[10px] text-neutral-400/80">
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="text-amber-400/90 font-mono tracking-tight">
                        model: {msg.modelUsed}
                      </span>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-3 h-3 text-neutral-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Status indicator - Apple Glass Pill */}
            {statusMessage && (
              <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-400/[0.08] border border-amber-400/20 px-3 py-1.5 rounded-full w-fit backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Clean Glassmorphic Input Bar */}
          <div className="p-3 bg-white/[0.02] border-t border-white/[0.06] backdrop-blur-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-white/[0.05] rounded-2xl px-3.5 py-2 border border-white/[0.1] focus-within:border-amber-400/60 focus-within:ring-1 focus-within:ring-amber-400/30 transition-all backdrop-blur-md"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none disabled:opacity-50"
              />

              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-2.5 py-1 text-xs font-medium text-red-300 bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Minus className="w-3 h-3" /> Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-black disabled:opacity-30 disabled:hover:bg-amber-400 transition-all flex items-center justify-center shadow-md shadow-amber-400/20 shrink-0"
                  title="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
