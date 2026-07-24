import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProjectionConnectionState } from '../../hooks/useOfficeBackend'

type Diagnostics = {
  health: {
    overall: string
    gateway: string
    ledger: string
    projection: string
    epoch: number
    revision: number
    lastSequence: number
    activeMotionCount: number
    motionQueueCount: number
  }
  runtime: {
    pendingDeliveryCount: number
    awaitingAcceptanceCount: number
    collectingCount: number
    activeWorkCount: number
  }
}

type RejectedEvent = { reasonCode: string }

function humanize(value: string) {
  return value.replace(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function OperationsSystem({
  connectionState,
  onReset,
}: {
  connectionState: ProjectionConnectionState
  onReset: () => Promise<unknown>
}) {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null)
  const [rejections, setRejections] = useState<RejectedEvent[]>([])
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [value, setValue] = useState('')
  const [resetting, setResetting] = useState(false)
  const dismissRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try {
        const [diagnosticResponse, rejectedResponse] = await Promise.all([
          fetch('/api/internal/diagnostics'),
          fetch('/api/internal/rejected-events?limit=50'),
        ])
        if (!diagnosticResponse.ok) throw new Error('Diagnostics are temporarily unavailable.')
        if (!rejectedResponse.ok) throw new Error('Rejected-event summary is temporarily unavailable.')
        const [nextDiagnostics, nextRejected] = await Promise.all([diagnosticResponse.json(), rejectedResponse.json()])
        if (!active) return
        setDiagnostics(nextDiagnostics)
        setRejections(Array.isArray(nextRejected) ? nextRejected : Array.isArray(nextRejected.items) ? nextRejected.items : [])
        setError('')
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Diagnostics are temporarily unavailable.')
      }
    }
    void refresh()
    const interval = window.setInterval(() => {
      if (!document.hidden) void refresh()
    }, 5000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (confirming) dismissRef.current?.focus()
  }, [confirming])

  const rejectionCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of rejections) counts.set(item.reasonCode || 'unknown', (counts.get(item.reasonCode || 'unknown') ?? 0) + 1)
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right))
  }, [rejections])

  const downloadBundle = async () => {
    try {
      const response = await fetch('/api/internal/diagnostic-bundle')
      if (!response.ok) throw new Error('Diagnostic bundle could not be created.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'office-demo-diagnostics.json'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Diagnostic bundle could not be created.')
    }
  }

  const reset = async () => {
    if (value !== 'RESET') return
    setResetting(true)
    try {
      await onReset()
      setConfirming(false)
      setValue('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Projection reset could not be submitted.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <main className="operations-system" aria-labelledby="system-heading">
      <div className="operations-page-heading">
        <p className="eyebrow">Internal diagnostics</p>
        <h1 id="system-heading">System</h1>
        <p>Observe the event gateway and projection runtime. Operations here never edit the projection directly.</p>
      </div>
      {error ? <p className="operations-notice operations-notice-error" role="alert">{error}</p> : null}
      {!diagnostics ? <p role="status">Loading system diagnostics…</p> : (
        <div className="system-sections">
          <section aria-labelledby="health-heading">
            <h2 id="health-heading">System Health</h2>
            <dl>
              <div><dt>Overall</dt><dd>{humanize(diagnostics.health.overall)}</dd></div>
              <div><dt>Gateway</dt><dd>{humanize(diagnostics.health.gateway)}</dd></div>
              <div><dt>Ledger</dt><dd>{humanize(diagnostics.health.ledger)}</dd></div>
              <div><dt>Projection</dt><dd>{humanize(diagnostics.health.projection)}</dd></div>
              <div><dt>Epoch</dt><dd>{diagnostics.health.epoch}</dd></div>
              <div><dt>Revision</dt><dd>{diagnostics.health.revision}</dd></div>
              <div><dt>Last sequence</dt><dd>{diagnostics.health.lastSequence}</dd></div>
            </dl>
          </section>
          <section aria-labelledby="runtime-heading">
            <h2 id="runtime-heading">Projection Runtime</h2>
            <dl>
              <div><dt>Delivering</dt><dd>{diagnostics.runtime.pendingDeliveryCount}</dd></div>
              <div><dt>Awaiting acceptance</dt><dd>{diagnostics.runtime.awaitingAcceptanceCount}</dd></div>
              <div><dt>Collecting</dt><dd>{diagnostics.runtime.collectingCount}</dd></div>
              <div><dt>Active work</dt><dd>{diagnostics.runtime.activeWorkCount}</dd></div>
              <div><dt>Active motions</dt><dd>{diagnostics.health.activeMotionCount}</dd></div>
              <div><dt>Queued motions</dt><dd>{diagnostics.health.motionQueueCount}</dd></div>
            </dl>
          </section>
        </div>
      )}
      <section aria-labelledby="connection-heading">
        <h2 id="connection-heading">Live Connection</h2>
        <p role="status">{humanize(connectionState.mode)}</p>
      </section>
      <section aria-labelledby="rejections-heading">
        <h2 id="rejections-heading">Rejected Event Summary</h2>
        {rejectionCounts.length ? <ul>{rejectionCounts.map(([reason, count]) => <li key={reason}>{humanize(reason)}: {count}</li>)}</ul> : <p>No rejected events are retained.</p>}
        <a href="/ops/events?result=rejected">Review rejected events</a>
      </section>
      <section aria-labelledby="bundle-heading">
        <h2 id="bundle-heading">Diagnostic Bundle</h2>
        <p>Download a sanitized snapshot for incident analysis.</p>
        <button type="button" onClick={() => void downloadBundle()}>Download diagnostic bundle</button>
      </section>
      <section aria-labelledby="reset-heading" className="system-reset">
        <h2 id="reset-heading">Reset Projection</h2>
        <p>Creates a new projection epoch. The event ledger is retained.</p>
        <button type="button" onClick={() => setConfirming(true)}>Reset Projection</button>
      </section>
      {confirming ? <div className="operations-dialog-backdrop" role="presentation">
        <section className="operations-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-confirm-title" onKeyDown={(event) => { if (event.key === 'Escape' && !resetting) setConfirming(false) }}>
          <h2 id="reset-confirm-title">Confirm projection reset</h2>
          <p>Type <strong>RESET</strong> to submit a standard projection reset event.</p>
          <label>Type RESET to confirm<input value={value} onChange={(event) => setValue(event.target.value)} /></label>
          <div className="operations-dialog-actions">
            <button type="button" ref={dismissRef} onClick={() => setConfirming(false)} disabled={resetting}>Cancel</button>
            <button type="button" onClick={() => void reset()} disabled={value !== 'RESET' || resetting}>{resetting ? 'Resetting…' : 'Confirm Reset'}</button>
          </div>
        </section>
      </div> : null}
    </main>
  )
}
