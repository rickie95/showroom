import { useEffect, useState } from 'react'
import { requestJson, requestNoJson } from '../api'
import CopyButton from '../components/CopyButton'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import type { BucketListItem } from '../types'
import type { RouteState } from '../App'
import { ensureArray } from '../utils'

export default function BucketsPage({ onNavigate }: Readonly<{ onNavigate: (route: RouteState) => void }>) {
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
