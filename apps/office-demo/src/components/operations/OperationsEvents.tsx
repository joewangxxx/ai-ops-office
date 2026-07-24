import { useEffect, useMemo, useState } from 'react'

type EventOutcome = {
  timestamp: string
  eventId: string
  eventType: string
  sourceSystem: string
  correlationId: string
  result: 'accepted' | 'duplicate' | 'rejected'
  reasonCode?: string
}

type Page = { items: EventOutcome[]; nextCursor: string | null; total: number }

export function OperationsEvents() {
  const initial = new URLSearchParams(window.location.search)
  const [result, setResult] = useState(initial.get('result') ?? 'all')
  const [query, setQuery] = useState(initial.get('query') ?? '')
  const [cursor, setCursor] = useState(initial.get('cursor') ?? '')
  const [previous, setPrevious] = useState<string[]>([])
  const [selected, setSelected] = useState<EventOutcome | null>(null)
  const [page, setPage] = useState<Page>({ items: [], nextCursor: null, total: 0 })
  const [error, setError] = useState<string | null>(null)

  const search = useMemo(() => {
    const value = new URLSearchParams({ limit: '25' })
    if (result !== 'all') value.set('result', result)
    if (query) value.set('query', query)
    if (cursor) value.set('cursor', cursor)
    return value.toString()
  }, [cursor, query, result])

  useEffect(() => {
    let live = true
    void fetch(`/api/internal/events?${search}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Events are unavailable')
        return response.json() as Promise<Page>
      })
      .then((next) => {
        if (!live) return
        setPage(next)
        setError(null)
      })
      .catch((reason) => {
        if (live) setError(reason instanceof Error ? reason.message : 'Events are unavailable')
      })
    return () => { live = false }
  }, [search])

  const update = (next: Record<string, string>) => {
    const url = new URL(window.location.href)
    for (const [key, value] of Object.entries(next)) value ? url.searchParams.set(key, value) : url.searchParams.delete(key)
    window.history.replaceState({}, '', `${url.pathname}${url.search}`)
  }

  const resetCursor = (next: Record<string, string>) => {
    setCursor('')
    setPrevious([])
    update({ ...next, cursor: '' })
  }

  return (
    <main aria-labelledby="events-heading" className="operations-events">
      <div className="operations-page-heading">
        <p className="operations-eyebrow">Sanitized outcome ledger</p>
        <h1 id="events-heading">Events</h1>
        <p>Review accepted, duplicate, and rejected commands without exposing private command bodies.</p>
      </div>
      <div className="operations-filters">
        <label>Search events
          <input aria-label="Search events" onChange={(event) => { setQuery(event.target.value); resetCursor({ query: event.target.value }) }} value={query} />
        </label>
        <label>Result
          <select aria-label="Event result filter" onChange={(event) => { setResult(event.target.value); resetCursor({ result: event.target.value === 'all' ? '' : event.target.value }) }} value={result}>
            <option value="all">All results</option>
            <option value="accepted">Accepted</option>
            <option value="duplicate">Duplicate</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>
      {error ? <p className="operations-notice operations-notice-error" role="alert">{error}</p> : null}
      <p role="status">{page.total} event outcomes</p>
      <table aria-label="Event outcomes">
        <caption>Event outcomes</caption>
        <thead><tr><th>Time</th><th>Event</th><th>Source</th><th>Result</th><th>Reason</th></tr></thead>
        <tbody>{page.items.map((item) => <tr key={`${item.timestamp}-${item.eventId}-${item.result}`}>
          <td><time>{item.timestamp}</time></td>
          <td><button aria-label={`Open ${item.eventId} details`} onClick={() => setSelected(item)} type="button"><code>{item.eventId}</code></button><small>{item.eventType}</small></td>
          <td>{item.sourceSystem}</td><td>{item.result}</td><td>{item.reasonCode ?? 'Not applicable'}</td>
        </tr>)}</tbody>
      </table>
      <nav aria-label="Event pagination">
        <button disabled={!previous.length} onClick={() => { const last = previous.at(-1) ?? ''; setPrevious((items) => items.slice(0, -1)); setCursor(last); update({ cursor: last }) }} type="button">Previous page</button>
        <button disabled={!page.nextCursor} onClick={() => { if (!page.nextCursor) return; setPrevious((items) => [...items, cursor]); setCursor(page.nextCursor); update({ cursor: page.nextCursor }) }} type="button">Next page</button>
      </nav>
      {selected ? <section aria-label={`${selected.eventId} details`} aria-modal="true" className="operations-person-detail" role="dialog">
        <button aria-label="Close event details" onClick={() => setSelected(null)} type="button">Close</button>
        <h2>{selected.eventType}</h2>
        <dl>
          <div><dt>Event ID</dt><dd><code>{selected.eventId}</code></dd></div>
          <div><dt>Correlation ID</dt><dd><code>{selected.correlationId}</code></dd></div>
          <div><dt>Result</dt><dd>{selected.result}</dd></div>
          <div><dt>Reason</dt><dd>{selected.reasonCode ?? 'Not applicable'}</dd></div>
        </dl>
        <a href="/ops/dispatch">Create corrected event</a>
      </section> : null}
    </main>
  )
}
