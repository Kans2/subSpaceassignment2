import { useCallback, useEffect, useRef, useState } from 'react'

const DG_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY

// Deepgram live streaming endpoint. interim_results gives us the "updating in
// real time" effect; smart_format adds punctuation/casing.
const DG_URL =
  'wss://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&interim_results=true'

// Pick a container/codec the current browser can actually record. Chrome/Edge
// support webm; Safari only does mp4. Deepgram auto-detects either.
function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  if (typeof MediaRecorder === 'undefined') return null
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

/**
 * Captures mic audio in the browser and streams it to Deepgram over a
 * WebSocket, exposing a live-updating transcript.
 *
 * status: 'idle' | 'connecting' | 'listening' | 'error'
 */
export function useDeepgramTranscription() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')

  const socketRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)

  const cleanup = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop()
      } catch {
        /* already stopped */
      }
    }
    recorderRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    if (socketRef.current) {
      const s = socketRef.current
      socketRef.current = null
      if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING) {
        try {
          s.close()
        } catch {
          /* noop */
        }
      }
    }
    setInterimTranscript('')
  }, [])

  const stop = useCallback(() => {
    cleanup()
    setStatus('idle')
  }, [cleanup])

  const start = useCallback(async () => {
    setError('')

    if (!DG_KEY) {
      setError('Deepgram API key missing. Set VITE_DEEPGRAM_API_KEY in subspace/.env')
      setStatus('error')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser does not support microphone capture. Try Chrome or Edge.')
      setStatus('error')
      return
    }

    const mimeType = pickMimeType()

    try {
      setStatus('connecting')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Authenticate from the browser using the WebSocket subprotocol.
      const socket = new WebSocket(DG_URL, ['token', DG_KEY])
      socketRef.current = socket

      socket.onopen = () => {
        setStatus('listening')

        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream)
        recorderRef.current = recorder

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data)
          }
        }
        // Emit a chunk every 250ms for low-latency streaming.
        recorder.start(250)
      }

      socket.onmessage = (message) => {
        let data
        try {
          data = JSON.parse(message.data)
        } catch {
          return
        }

        const alt = data?.channel?.alternatives?.[0]
        const text = alt?.transcript
        if (!text) return

        if (data.is_final) {
          setFinalTranscript((prev) => (prev ? `${prev} ${text}` : text))
          setInterimTranscript('')
        } else {
          setInterimTranscript(text)
        }
      }

      socket.onerror = () => {
        setError('Connection to Deepgram failed. Check the API key and network.')
        setStatus('error')
        cleanup()
      }

      socket.onclose = (e) => {
        // 1000 = normal close (we stopped). Anything else while listening is a
        // fault — tear down the mic/recorder so it doesn't keep running.
        if (e.code !== 1000 && socketRef.current) {
          setError('Deepgram closed the connection.')
          setStatus('error')
          cleanup()
        }
      }
    } catch (err) {
      setError(err?.message || 'Could not access the microphone.')
      setStatus('error')
      cleanup()
    }
  }, [cleanup])

  const reset = useCallback(() => {
    setFinalTranscript('')
    setInterimTranscript('')
    setError('')
  }, [])

  // Stop everything if the component unmounts mid-stream.
  useEffect(() => cleanup, [cleanup])

  return {
    isListening: status === 'listening' || status === 'connecting',
    status,
    error,
    finalTranscript,
    interimTranscript,
    start,
    stop,
    reset,
  }
}
