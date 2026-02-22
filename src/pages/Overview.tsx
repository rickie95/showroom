import { useEffect, useState } from 'react'
import { AppError, GarageApiV1Client } from '../api'

export default function Overview() {
  const apiClient = new GarageApiV1Client();
  const [health, setHealth] = useState< 'loading' | 'healthy' | 'degraded' | `unreacheable` | `error`>('loading')
  const [healthMessage, setHealthMessage] = useState('')
  const [totalNodes, setTotalNodes] = useState<number | null>(null)
  const [connectedNodes, setConnectedNodes] = useState<number | null>(null)
  const [totalStorageNodes, setTotalStorageNodes] = useState<number | null>(null)
  const [healthyStorageNodes, setHealthyStorageNodes] = useState<number | null>(null)

  const healthLabelMap: Record<typeof health, string> = {
    loading: 'Connecting',
    healthy: 'Healthy',
    degraded: 'Degraded',
    error: `Error`,
    unreacheable: `Not Reacheable`
  }
  const healthClassMap: Record<typeof health, string> = {
    loading: '',
    healthy: 'good',
    degraded: 'bad',
    unreacheable: 'bad',
    error: `error`
  }
  const healthLabel = healthLabelMap[health]
  const healthClass = healthClassMap[health]

  useEffect(() => {
    let active = true
    const loadHealth = async () => {
      setHealth('loading')
      try {
        if (!active) return
        const data = await apiClient.getHealth();

        setTotalNodes(data.knownNodes)
        setConnectedNodes(data.connectedNodes)
        setHealth(data.status)
        setTotalStorageNodes(data.storageNodes)
        setHealthyStorageNodes(data.storageNodesOk)
        setHealthMessage('Cluster is reachable')
      } catch (error) {
        if (!active) return

        if (error instanceof AppError) {
          setHealth('unreacheable')
          setHealthMessage('Cluster is not reachable')
          return
        }
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
