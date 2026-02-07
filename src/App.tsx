import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { authToken, baseUrl, jsonBody, requestJson, requestNoJson } from './api'
import CopyButton from './components/CopyButton'
import Modal from './components/Modal'
import Spinner from './components/Spinner'
import type { BucketDetails, BucketListItem, KeyCreateResponse, KeyListItem } from './types'
import { ensureArray, formatBytes, formatCount } from './utils'

type RouteState =
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
        <div className="sidebar-footer">
          <div className="badge">Auth header required</div>
          <p className="muted">{baseUrl || 'Missing VITE_BASE_URL'}</p>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Storage control</p>
            <h2>{route.page === 'bucket' ? 'Bucket detail' : route.page}</h2>
          </div>
          <div className="topbar-actions">
            <div className={envMissing ? 'badge danger' : 'badge success'}>
              {envMissing ? 'Missing env' : 'Connected'}
            </div>
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

function Overview() {
  const [health, setHealth] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [healthMessage, setHealthMessage] = useState('')
  const [buckets, setBuckets] = useState<BucketListItem[]>([])
  const [bucketError, setBucketError] = useState('')
  const [loadingBuckets, setLoadingBuckets] = useState(false)

  const healthLabelMap: Record<typeof health, string> = {
    idle: 'Degraded',
    loading: 'Checking',
    ok: 'Healthy',
    error: 'Degraded',
  }
  const healthClassMap: Record<typeof health, string> = {
    idle: '',
    loading: '',
    ok: 'good',
    error: 'bad',
  }
  const healthLabel = healthLabelMap[health]
  const healthClass = healthClassMap[health]

  useEffect(() => {
    let active = true
    const loadHealth = async () => {
      setHealth('loading')
      try {
        await requestNoJson('v1/health')
        if (!active) return
        setHealth('ok')
        setHealthMessage('Cluster reachable')
      } catch (error) {
        if (!active) return
        setHealth('error')
        setHealthMessage(error instanceof Error ? error.message : 'Unavailable')
      }
    }

    const loadBuckets = async () => {
      setLoadingBuckets(true)
      setBucketError('')
      try {
        const data = await requestJson<BucketListItem[]>('/v1/bucket?list')
        if (!active) return
        setBuckets(data.slice(0, 10))
      } catch (error) {
        if (!active) return
        setBucketError(error instanceof Error ? error.message : 'Unable to load buckets')
      } finally {
        if (active) setLoadingBuckets(false)
      }
    }

    loadHealth()
    loadBuckets()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="grid two">
      <section className="panel">
        <div className="panel-header">
          <h3>Cluster health</h3>
          <span className={`status ${healthClass}`}>
            {healthLabel}
          </span>
        </div>
        <p className="muted">{healthMessage || 'Awaiting response'}</p>
        <div className="metric-grid">
          <div className="metric">
            <p className="eyebrow">Auth header</p>
            <h4>{authToken ? 'Attached' : 'Missing'}</h4>
          </div>
          <div className="metric">
            <p className="eyebrow">API base</p>
            <h4 className="truncate">{baseUrl || 'Not set'}</h4>
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h3>Recent buckets</h3>
          <a className="link" href="#buckets">
            View all
          </a>
        </div>
        {loadingBuckets ? <Spinner /> : null}
        {bucketError ? <p className="error-text">{bucketError}</p> : null}
        <ul className="list">
          {buckets.map((bucket) => (
            <li key={bucket.id}>
              <div>
                <p className="mono">{bucket.id}</p>
                <p className="muted">{ensureArray(bucket.globalAliases).join(', ') || 'No alias'}</p>
              </div>
              <a className="ghost-button" href={`#bucket/${bucket.id}`}>
                Details
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function BucketsPage({ onNavigate }: Readonly<{ onNavigate: (route: RouteState) => void }>) {
  const [buckets, setBuckets] = useState<BucketListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [localAliasBucket, setLocalAliasBucket] = useState<BucketListItem | null>(null)
  const [deleteBucket, setDeleteBucket] = useState<BucketListItem | null>(null)
  const [deleteInput, setDeleteInput] = useState('')

  const loadBuckets = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await requestJson<BucketListItem[]>('/v1/bucket?list')
      setBuckets(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load buckets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBuckets()
  }, [])

  const handleDelete = async () => {
    if (!deleteBucket) return
    try {
      await requestNoJson(`/v1/bucket?id=${encodeURIComponent(deleteBucket.id)}`, {
        method: 'DELETE',
      })
      setDeleteBucket(null)
      setDeleteInput('')
      await loadBuckets()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to delete bucket')
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>Bucket inventory</h3>
          <p className="muted">All buckets currently stored in Garage.</p>
        </div>
        <button className="primary-button" type="button">
          New Bucket
        </button>
      </div>
      {loading ? <Spinner /> : null}
      {error ? <p className="error-text">{error}</p> : null}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Global aliases</th>
              <th>Local aliases</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr key={bucket.id}>
                <td className="mono">{bucket.id}</td>
                <td>{ensureArray(bucket.globalAliases).join(', ') || 'None'}</td>
                <td>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setLocalAliasBucket(bucket)}
                  >
                    View local aliases
                  </button>
                </td>
                <td className="actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      globalThis.location.hash = `#bucket/${bucket.id}`
                      onNavigate({ page: 'bucket', bucketId: bucket.id })
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="ghost-button danger"
                    type="button"
                    onClick={() => setDeleteBucket(bucket)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {localAliasBucket ? (
        <Modal title="Local aliases" onClose={() => setLocalAliasBucket(null)}>
          <div className="table-wrapper compact">
            <table>
              <thead>
                <tr>
                  <th>Alias</th>
                  <th>Access key</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ensureArray(localAliasBucket.localAliases).map((alias, index) => {
                  const keyId = alias.accessKeyId || alias.accessKeyid || ''
                  return (
                    <tr key={`${alias.alias}-${index}`}>
                      <td>{alias.alias}</td>
                      <td className="mono">{keyId}</td>
                      <td>
                        {keyId ? <CopyButton className="ghost-button" value={keyId} /> : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Modal>
      ) : null}

      {deleteBucket ? (
        <Modal
          title="Delete bucket"
          onClose={() => {
            setDeleteBucket(null)
            setDeleteInput('')
          }}
          actions={
            <button
              className="primary-button danger"
              type="button"
              disabled={deleteInput !== deleteBucket.id}
              onClick={handleDelete}
            >
              Confirm delete
            </button>
          }
        >
          <p>
            This action removes the bucket. Type the bucket ID to unlock deletion.
          </p>
          <div className="stack">
            <div>
              <p className="eyebrow">Bucket ID</p>
              <p className="mono">{deleteBucket.id}</p>
            </div>
            <div>
              <p className="eyebrow">Global aliases</p>
              <p>{ensureArray(deleteBucket.globalAliases).join(', ') || 'None'}</p>
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(event) => setDeleteInput(event.target.value)}
              placeholder="Enter bucket id"
            />
          </div>
        </Modal>
      ) : null}
    </section>
  )
}

function KeysPage() {
  const [keys, setKeys] = useState<KeyListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editKey, setEditKey] = useState<KeyListItem | null>(null)
  const [deleteKey, setDeleteKey] = useState<KeyListItem | null>(null)
  const [deleteInput, setDeleteInput] = useState('')

  const loadKeys = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await requestJson<KeyListItem[]>('v1/key?list')
      setKeys(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  const handleDelete = async () => {
    if (!deleteKey) return
    try {
      await requestNoJson(`/v1/key?id=${encodeURIComponent(deleteKey.id)}`, {
        method: 'DELETE',
      })
      setDeleteKey(null)
      setDeleteInput('')
      await loadKeys()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to delete key')
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>Access keys</h3>
          <p className="muted">Provision and manage storage keys.</p>
        </div>
        <div className="action-row">
          <button className="ghost-button" type="button" onClick={() => setImportOpen(true)}>
            Import Key
          </button>
          <button className="primary-button" type="button" onClick={() => setCreateOpen(true)}>
            New Key
          </button>
        </div>
      </div>
      {loading ? <Spinner /> : null}
      {error ? <p className="error-text">{error}</p> : null}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td className="mono">{key.id}</td>
                <td>{key.name || 'Unnamed'}</td>
                <td className="actions">
                  <button className="ghost-button" type="button" onClick={() => setEditKey(key)}>
                    Edit
                  </button>
                  <button
                    className="ghost-button danger"
                    type="button"
                    onClick={() => setDeleteKey(key)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen ? (
        <KeyCreateModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false)
            loadKeys()
          }}
        />
      ) : null}

      {importOpen ? (
        <Modal title="Import key" onClose={() => setImportOpen(false)}>
          <p>Key import is not defined in the current specs.</p>
        </Modal>
      ) : null}

      {editKey ? (
        <KeyEditModal
          keyItem={editKey}
          onClose={() => setEditKey(null)}
          onSaved={() => {
            setEditKey(null)
            loadKeys()
          }}
        />
      ) : null}

      {deleteKey ? (
        <Modal
          title="Delete key"
          onClose={() => {
            setDeleteKey(null)
            setDeleteInput('')
          }}
          actions={
            <button
              className="primary-button danger"
              type="button"
              disabled={deleteInput !== deleteKey.id}
              onClick={handleDelete}
            >
              Confirm delete
            </button>
          }
        >
          <p>Type the key ID to unlock deletion.</p>
          <div className="stack">
            <div>
              <p className="eyebrow">Key ID</p>
              <p className="mono">{deleteKey.id}</p>
            </div>
            <div>
              <p className="eyebrow">Name</p>
              <p>{deleteKey.name || 'Unnamed'}</p>
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(event) => setDeleteInput(event.target.value)}
              placeholder="Enter key id"
            />
          </div>
        </Modal>
      ) : null}
    </section>
  )
}

function KeyCreateModal({
  onClose,
  onCreated,
}: Readonly<{ onClose: () => void; onCreated: () => void }>) {
  const [name, setName] = useState('')
  const [allowCreate, setAllowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<KeyCreateResponse | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: name || null,
        allow: allowCreate ? { createBucket: true } : null,
        deny: allowCreate ? null : { createBucket: true },
      }
      const response = await requestJson<KeyCreateResponse>('/key', {
        method: 'POST',
        ...jsonBody(payload),
      })
      setCreated(response)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to create key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Create new key"
      onClose={onClose}
      actions={
        created ? (
          <button className="primary-button" type="button" onClick={onCreated}>
            Done
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        )
      }
    >
      {created ? (
        <div className="stack">
          <div>
            <p className="eyebrow">Access key ID</p>
            <p className="mono">{created.accessKeyId}</p>
            <CopyButton className="ghost-button" value={created.accessKeyId} />
          </div>
          <div>
            <p className="eyebrow">Secret access key</p>
            <p className="mono">{created.secretAccessKey}</p>
            <CopyButton className="ghost-button" value={created.secretAccessKey} />
          </div>
        </div>
      ) : (
        <div className="stack">
          <label>
            <span>Key name (optional)</span>
            <input value={name} onChange={(event) => setName(event.target.value)} type="text" />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={allowCreate}
              onChange={(event) => setAllowCreate(event.target.checked)}
            />
            <span>Allow this key to create new buckets</span>
          </label>
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      )}
    </Modal>
  )
}

function KeyEditModal({
  keyItem,
  onClose,
  onSaved,
}: Readonly<{
  keyItem: KeyListItem
  onClose: () => void
  onSaved: () => void
}>) {
  const [name, setName] = useState(keyItem.name || '')
  const [allowCreate, setAllowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const loadDetails = async () => {
      setLoadingInfo(true)
      try {
        const response = await requestJson<{ name?: string | null; permissions?: { createBucket?: boolean } }>(
          `/v1/key?id=${encodeURIComponent(keyItem.id)}`,
        )
        if (!active) return
        if (response.name !== undefined && response.name !== null) {
          setName(response.name)
        }
        setAllowCreate(Boolean(response.permissions?.createBucket))
      } catch {
        if (!active) return
        setAllowCreate(false)
      } finally {
        if (active) setLoadingInfo(false)
      }
    }
    loadDetails()
    return () => {
      active = false
    }
  }, [keyItem.id])

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: name || null,
        allow: allowCreate ? { createBucket: true } : null,
        deny: allowCreate ? null : { createBucket: true },
      }
      await requestJson(`/v1/key?id=${encodeURIComponent(keyItem.id)}`, {
        method: 'POST',
        ...jsonBody(payload),
      })
      onSaved()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Edit key"
      onClose={onClose}
      actions={
        <button className="primary-button" type="button" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      }
    >
      <div className="stack">
        <div>
          <p className="eyebrow">Key ID</p>
          <p className="mono">{keyItem.id}</p>
        </div>
        <label>
          <span>Key name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} type="text" />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={allowCreate}
            onChange={(event) => setAllowCreate(event.target.checked)}
            disabled={loadingInfo}
          />
          <span>Allow this key to create new buckets</span>
        </label>
        {loadingInfo ? <Spinner /> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}

function BucketDetail({ bucketId }: Readonly<{ bucketId: string }>) {
  const [details, setDetails] = useState<BucketDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [addKeyOpen, setAddKeyOpen] = useState(false)

  const loadDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await requestJson<BucketDetails>(
        `/v1/bucket?id=${encodeURIComponent(bucketId)}`,
      )
      setDetails(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load bucket details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetails()
  }, [bucketId])

  const handleDelete = async () => {
    try {
      await requestNoJson(`/v1/bucket?id=${encodeURIComponent(bucketId)}`, {
        method: 'DELETE',
      })
      globalThis.location.hash = '#buckets'
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to delete bucket')
    }
  }

  const stats = useMemo(() => {
    return {
      objects: formatCount(details?.objects ?? null),
      bytes: formatBytes(details?.bytes ?? null),
      maxSize:
        details?.quotas?.maxSize === null || details?.quotas?.maxSize === undefined
          ? 'Unlimited'
          : formatBytes(details?.quotas?.maxSize),
      maxObjects:
        details?.quotas?.maxObjects === null || details?.quotas?.maxObjects === undefined
          ? 'Unlimited'
          : formatCount(details?.quotas?.maxObjects),
    }
  }, [details])

  return (
    <div className="stack">
      <div className="page-actions">
        <div>
          <p className="eyebrow">Bucket ID</p>
          <p className="mono">{bucketId}</p>
        </div>
        <button className="primary-button danger" type="button" onClick={() => setDeleteOpen(true)}>
          Delete
        </button>
      </div>
      {loading ? <Spinner /> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {details ? (
        <>
          <div className="grid four">
            <div className="metric">
              <p className="eyebrow">Objects</p>
              <h4>{stats.objects}</h4>
            </div>
            <div className="metric">
              <p className="eyebrow">Data stored</p>
              <h4>{stats.bytes}</h4>
            </div>
            <div className="metric">
              <p className="eyebrow">Quota max size</p>
              <h4>{stats.maxSize}</h4>
            </div>
            <div className="metric">
              <p className="eyebrow">Quota max objects</p>
              <h4>{stats.maxObjects}</h4>
            </div>
          </div>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Keys with access</h3>
                <p className="muted">Manage permissions for this bucket.</p>
              </div>
              <button className="primary-button" type="button" onClick={() => setAddKeyOpen(true)}>
                Add Key
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Access key</th>
                    <th>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {ensureArray(details.keys).map((key) => (
                    <tr key={key.accessKeyId}>
                      <td>{key.name || 'Unnamed'}</td>
                      <td className="mono">
                        {key.accessKeyId}
                        <CopyButton className="ghost-button" value={key.accessKeyId} />
                      </td>
                      <td className="permissions">
                        <label className="checkbox">
                          <input type="checkbox" checked={key.permissions.read} readOnly />
                          <span>Read</span>
                        </label>
                        <label className="checkbox">
                          <input type="checkbox" checked={key.permissions.write} readOnly />
                          <span>Write</span>
                        </label>
                        <label className="checkbox">
                          <input type="checkbox" checked={key.permissions.owner} readOnly />
                          <span>Owner</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {addKeyOpen ? (
        <AddKeyModal
          bucketId={bucketId}
          onClose={() => setAddKeyOpen(false)}
          onAdded={() => {
            setAddKeyOpen(false)
            loadDetails()
          }}
        />
      ) : null}

      {deleteOpen ? (
        <Modal
          title="Delete bucket"
          onClose={() => {
            setDeleteOpen(false)
            setDeleteInput('')
          }}
          actions={
            <button
              className="primary-button danger"
              type="button"
              disabled={deleteInput !== bucketId}
              onClick={handleDelete}
            >
              Confirm delete
            </button>
          }
        >
          <p>Type the bucket ID to unlock deletion.</p>
          <div className="stack">
            <div>
              <p className="eyebrow">Bucket ID</p>
              <p className="mono">{bucketId}</p>
            </div>
            <div>
              <p className="eyebrow">Global aliases</p>
              <p>{ensureArray(details?.globalAliases).join(', ') || 'None'}</p>
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(event) => setDeleteInput(event.target.value)}
              placeholder="Enter bucket id"
            />
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function AddKeyModal({
  bucketId,
  onClose,
  onAdded,
}: Readonly<{
  bucketId: string
  onClose: () => void
  onAdded: () => void
}>) {
  const [keys, setKeys] = useState<KeyListItem[]>([])
  const [selectedKey, setSelectedKey] = useState('')
  const [permissions, setPermissions] = useState({ read: true, write: false, owner: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const loadKeys = async () => {
      try {
        const data = await requestJson<KeyListItem[]>('/key?list')
        if (!active) return
        setKeys(data)
        setSelectedKey(data[0]?.id || '')
      } catch (error) {
        if (!active) return
        setError(error instanceof Error ? error.message : 'Unable to load keys')
      }
    }
    loadKeys()
    return () => {
      active = false
    }
  }, [])

  const handleAdd = async () => {
    if (!selectedKey) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        bucketId,
        accessKeyId: selectedKey,
        permissions,
      }
      await requestJson('/v1/bucket/allow', {
        method: 'POST',
        ...jsonBody(payload),
      })
      onAdded()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to add key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Add key to bucket"
      onClose={onClose}
      actions={
        <button className="primary-button" type="button" onClick={handleAdd} disabled={loading}>
          {loading ? 'Adding...' : 'Add'}
        </button>
      }
    >
      <div className="stack">
        <label>
          <span>Select key</span>
          <select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>
            {keys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.name || key.id}
              </option>
            ))}
          </select>
        </label>
        <div className="permissions">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={permissions.read}
              onChange={(event) =>
                setPermissions((prev) => ({
                  ...prev,
                  read: event.target.checked,
                }))
              }
            />
            <span>Read</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={permissions.write}
              onChange={(event) =>
                setPermissions((prev) => ({
                  ...prev,
                  write: event.target.checked,
                }))
              }
            />
            <span>Write</span>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={permissions.owner}
              onChange={(event) =>
                setPermissions((prev) => ({
                  ...prev,
                  owner: event.target.checked,
                }))
              }
            />
            <span>Owner</span>
          </label>
        </div>
        {loading ? <Spinner /> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </Modal>
  )
}

export default App
