export type KeyListItem = {
  id: string
  name?: string | null
}

export type BucketListItem = {
  id: string
  globalAliases?: string[]
  localAliases?: Array<{
    alias: string
    accessKeyId?: string
    accessKeyid?: string
  }>
}

export type BucketDetails = {
  id: string
  globalAliases?: string[]
  websiteAccess?: boolean
  websiteConfig?: {
    indexDocument?: string
    errorDocument?: string
  } | null
  keys?: Array<{
    accessKeyId: string
    name?: string | null
    permissions: {
      read: boolean
      write: boolean
      owner: boolean
    }
    bucketLocalAliases?: string[]
  }>
  objects?: number
  bytes?: number
  unfinishedUploads?: number
  quotas?: {
    maxSize?: number | null
    maxObjects?: number | null
  }
}

export type KeyCreateResponse = {
  name?: string | null
  accessKeyId: string
  secretAccessKey: string
  permissions?: {
    createBucket: boolean
  }
}
