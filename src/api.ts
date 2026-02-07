const baseUrl = (import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '')
const authToken = import.meta.env.VITE_AUTH_TOKEN || ''

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

function buildUrl(path: string) {
  if (!baseUrl) {
    return path
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${authToken}`,
    ...options.headers,
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    const error = new Error(message || `Request failed with ${response.status}`)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

async function requestNoJson(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${authToken}`,
    ...options.headers,
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    const error = new Error(message || `Request failed with ${response.status}`)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }

  return response
}

function jsonBody(data: unknown) {
  return {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }
}

export {
  baseUrl,
  authToken,
  requestJson,
  requestNoJson,
  jsonBody,
}
