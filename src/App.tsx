import { useEffect, useState } from 'react'
import './App.css'
import Modal from './components/Modal'
import { clearApiConfig, getApiConfig, saveApiConfig } from './apiConfig'
import type { ApiConfig } from './apiConfig'
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

function LoginModal({
  config,
  onClose,
  onSaved,
  onCleared,
}: Readonly<{
  config: ApiConfig;
  onClose: () => void;
  onSaved: (config: ApiConfig) => void;
  onCleared: () => void;
}>) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl)
  const [authToken, setAuthToken] = useState(config.authToken)
  const [error, setError] = useState('')

  const handleSave = () => {
    const nextConfig = {
      baseUrl: baseUrl.trim(),
      authToken: authToken.trim(),
    }

    if (!nextConfig.baseUrl || !nextConfig.authToken) {
      setError('Both the base URL and auth token are required.')
      return
    }

    saveApiConfig(nextConfig)
    onSaved(nextConfig)
  }

  const handleClear = () => {
    clearApiConfig()
    onCleared()
  }

  return (
    <Modal
      title="Connection settings"
      onClose={onClose}
      actions={
        <>
          <button className="ghost-button danger" type="button" onClick={handleClear}>
            Clear saved login
          </button>
          <button className="primary-button" type="button" onClick={handleSave}>
            Save
          </button>
        </>
      }
    >
      <div className="stack">
        <label>
          <span>Base URL</span>
          <input
            type="url"
            value={baseUrl}
            onChange={(event) => {
              setError('')
              setBaseUrl(event.target.value)
            }}
            placeholder="https://garage.example.com"
          />
        </label>
        <label>
          <span>Auth token</span>
          <input
            type="password"
            value={authToken}
            onChange={(event) => {
              setError('')
              setAuthToken(event.target.value)
            }}
            placeholder="Paste your auth token"
          />
        </label>
        <p className="muted">Saved in browser cookies for this device.</p>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}

function App() {
  const [route, setRoute] = useState<RouteState>(() =>
    parseHash(globalThis.location?.hash ?? ''),
  )
  const [config, setConfig] = useState<ApiConfig>(() => getApiConfig())
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    const handleHash = () => setRoute(parseHash(globalThis.location?.hash ?? ''))
    globalThis.addEventListener('hashchange', handleHash)
    return () => globalThis.removeEventListener('hashchange', handleHash)
  }, [])

  const configured = Boolean(config.baseUrl && config.authToken)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
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
            {configured ? (
              <span className="connection-pill mono">{config.baseUrl}</span>
            ) : null}
            <button className="ghost-button" type="button" onClick={() => setLoginOpen(true)}>
              {configured ? 'Change connection' : 'Log in'}
            </button>
            {configured ? (
              <button
                className="ghost-button danger"
                type="button"
                onClick={() => {
                  clearApiConfig()
                  setConfig(getApiConfig())
                }}
              >
                Clear cookies
              </button>
            ) : null}
          </div>
        </header>
        {!configured ? (
          <section className="callout">
            <h3>Connect to Garage</h3>
            <p>
              Open the login form to save your base URL and auth token in cookies.
            </p>
            <button className="primary-button" type="button" onClick={() => setLoginOpen(true)}>
              Log in
            </button>
          </section>
        ) : (
          <div key={`${config.baseUrl}|${config.authToken}`}>
            {route.page === 'overview' ? <Overview /> : null}
            {route.page === 'buckets' ? <BucketsPage onNavigate={setRoute} /> : null}
            {route.page === 'keys' ? <KeysPage /> : null}
            {route.page === 'bucket' ? <BucketDetail bucketId={route.bucketId} /> : null}
          </div>
        )}
      </main>
      {loginOpen ? (
        <LoginModal
          config={config}
          onClose={() => setLoginOpen(false)}
          onSaved={(nextConfig) => {
            setConfig(nextConfig)
            setLoginOpen(false)
          }}
          onCleared={() => {
            setConfig(getApiConfig())
            setLoginOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

export default App
