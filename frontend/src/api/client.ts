const API_BASE = '/api/v1'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

class ApiClient {
  private csrfToken: string | null = null

  private getCsrfToken(): string {
    if (this.csrfToken) return this.csrfToken
    const match = document.cookie.match(/csrf=([^;]+)/)
    return match ? match[1] ?? '' : ''
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, headers: customHeaders, ...rest } = options
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(customHeaders as Record<string, string> || {}),
    }

    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    if (rest.method && rest.method !== 'GET') {
      headers['X-CSRF-Token'] = this.getCsrfToken()
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...rest,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { code: 'UNKNOWN', message: 'Request failed' } }))
      throw new ApiError(response.status, errorData.error?.code || 'UNKNOWN', errorData.error?.message || 'Request failed')
    }

    if (response.status === 204) return undefined as T
    return response.json()
  }

  get<T>(endpoint: string) { return this.request<T>(endpoint) }
  post<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: 'POST', body }) }
  put<T>(endpoint: string, body?: unknown) { return this.request<T>(endpoint, { method: 'PUT', body }) }
  delete<T>(endpoint: string) { return this.request<T>(endpoint, { method: 'DELETE' }) }

  upload<T>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: 'POST', body: formData })
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = new ApiClient()
