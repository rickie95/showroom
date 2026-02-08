export interface HealthInfo {
    status: string
    knownNodes: number
    connectedNodes: number
    storageNodes: number
    storageNodesOk: number
}

export interface Bucket {
  id: string
  globalAliases: Array<string>
  localAliases: Array<string>
}

export interface Key {
    id: string
    name?: string | null
    permissions: {
        read: boolean
        write: boolean
        owner: boolean
    }
    bucketLocalAliases?: string[]
}

export interface BucketDetails {
    id: string
    globalAliases: Array<string>
    websiteAccess?: boolean
    keys: Array<Key>
    objects?: number
    bytes?: number
    quotas?: {
        maxSize?: number | null
        maxObjects?: number | null
    }
}