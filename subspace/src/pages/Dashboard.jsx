import { useState } from 'react'
import { useSignOut, useUserData } from '@nhost/react'
import { useDeepgramTranscription } from '../hooks/useDeepgramTranscription'

export default function Dashboard() {
  const user = useUserData()
  const { signOut } = useSignOut()
  const {
    isListening,
    status,
    error,
    finalTranscript,
    interimTranscript,
    start,
    stop,
    reset,
  } = useDeepgramTranscription()

  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(finalTranscript.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <strong>Live Speech-to-Text</strong>
          <span className="muted"> — {user?.email}</span>
        </div>
        <button className="link" onClick={signOut}>
          Log out
        </button>
      </header>

      <main className="dash-main">
        <div className="card">
          <div className="controls">
            {!isListening ? (
              <button className="btn-primary" onClick={start}>
                🎙️ Start listening
              </button>
            ) : (
              <button className="btn-danger" onClick={stop}>
                ■ Stop
              </button>
            )}
            <button
              className="btn-ghost"
              onClick={reset}
              disabled={isListening || (!finalTranscript && !interimTranscript)}
            >
              Clear
            </button>
            <button
              className="btn-ghost"
              onClick={handleCopy}
              disabled={!finalTranscript.trim()}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <span className={`status status-${status}`}>
              <span className="dot" /> {status}
            </span>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="transcript" aria-live="polite">
            {finalTranscript || interimTranscript ? (
              <p>
                <span className="final">{finalTranscript}</span>
                <span className="interim">{interimTranscript}</span>
              </p>
            ) : (
              <p className="placeholder">
                Click “Start listening”, allow the mic, and speak — your words
                appear here in real time.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
