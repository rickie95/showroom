import { useEffect, useState } from 'react'
import './App.css'
import { authToken, baseUrl } from './api'
import Overview from './pages/Overview'
import BucketsPage from './pages/BucketsPage'
import KeysPage from './pages/KeysPage'
import BucketDetail from './pages/BucketDetail'

export type RouteState =
  | { page: 'overview' }
  | { page: 'buckets' }
  | { page: 'keys' }
  | { page: 'bucket'; bucketId: string }

function parseHash(hash: string): RouteState {
  const cleaned = hash.replace('#', '').trim()
  if (cleaned.startsWith('bucket/')) {
    const bucketId = cleaned.replace('bucket/', '').trim()
    if (bucketId) {
      return { page: 'bucket', bucketId }
    }
  }
  if (cleaned === 'buckets') {
    return { page: 'buckets' }
  }
  if (cleaned === 'keys') {
    return { page: 'keys' }
  }
  return { page: 'overview' }
}

function App() {
  const [route, setRoute] = useState<RouteState>(() =>
    parseHash(globalThis.location?.hash ?? ''),
  )

  useEffect(() => {
    const handleHash = () => setRoute(parseHash(globalThis.location?.hash ?? ''))
    globalThis.addEventListener('hashchange', handleHash)
    return () => globalThis.removeEventListener('hashchange', handleHash)
  }, [])

  const envMissing = !baseUrl || !authToken

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          {/* <div className="brand-mark">S</div> */}
          <div>
            <h1>Showroom</h1>
            <p className="eyebrow">Garage Console</p>
          </div>
        </div>
        <nav className="nav">
          <a className={route.page === 'overview' ? 'active' : ''} href="#overview">
            Overview
          </a>
          <a className={route.page === 'buckets' ? 'active' : ''} href="#buckets">
            Buckets
          </a>
          <a className={route.page === 'keys' ? 'active' : ''} href="#keys">
            Keys
          </a>
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h2>{route.page === 'bucket' ? 'Bucket detail' : route.page}</h2>
          </div>
          <div className="topbar-actions">
          </div>
        </header>
        {envMissing ? (
          <section className="callout">
            <h3>Environment setup</h3>
            <p>
              Configure <span className="mono">VITE_BASE_URL</span> and{' '}
              <span className="mono">VITE_AUTH_TOKEN</span> to make authenticated requests.
            </p>
          </section>
        ) : null}
        {route.page === 'overview' ? <Overview /> : null}
        {route.page === 'buckets' ? <BucketsPage onNavigate={setRoute} /> : null}
        {route.page === 'keys' ? <KeysPage /> : null}
        {route.page === 'bucket' ? <BucketDetail bucketId={route.bucketId} /> : null}
      </main>
    </div>
  )
}

export default App
