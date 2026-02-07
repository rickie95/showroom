function formatBytes(bytes?: number | null) {
  if (bytes === null || bytes === undefined) {
    return 'Unknown'
  }

  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, order)
  return `${value.toFixed(value >= 100 || order === 0 ? 0 : 2)} ${units[order]}`
}

function formatCount(value?: number | null) {
  if (value === null || value === undefined) {
    return 'Unknown'
  }
  return value.toLocaleString('en-US')
}

function ensureArray<T>(value?: T[] | null) {
  return Array.isArray(value) ? value : []
}

export { formatBytes, formatCount, ensureArray }
