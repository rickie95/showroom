import { useEffect, useState } from 'react'
import { authToken, baseUrl, requestJson, requestNoJson } from '../api'

export default function Overview() {
  const [health, setHealth] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [healthMessage, setHealthMessage] = useState('')
  const [totalNodes, setTotalNodes] = useState<number | null>(null)
  const [connectedNodes, setConnectedNodes] = useState<number | null>(null)
  const [totalStorageNodes, setTotalStorageNodes] = useState<number | null>(null)
  const [healthyStorageNodes, setHealthyStorageNodes] = useState<number | null>(null)

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
        const data = await requestJson('v1/health')
        if (!active) return

        setTotalNodes(data.knownNodes)
        setConnectedNodes(data.connectedNodes)
        setTotalStorageNodes(data.storageNodes)
        setHealthyStorageNodes(data.storageNodesOk)
        setHealth('ok')
        setHealthMessage('Cluster reachable')
      } catch (error) {
        if (!active) return
        setHealth('error')
        setHealthMessage(error instanceof Error ? error.message : 'Unavailable')
      }
    }


    loadHealth()
    return () => {
      active = false
    }
  }, [])

  return (
    <div >
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
            <p className="eyebrow">Connected Nodes</p>
            <h4>{connectedNodes ??'?'} / {totalNodes ?? '?'}</h4>
          </div>
          <div className="metric">
            <p className="eyebrow">Storage Nodes</p>
            <h4 className="truncate">{healthyStorageNodes ?? '?'} / {totalStorageNodes ?? '?'}</h4>
          </div>
        </div>
      </section>
    </div>
  )
}
