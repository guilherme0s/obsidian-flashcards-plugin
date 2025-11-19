export interface IHttpClientOptions {
  readonly baseUrl?: string;
  readonly timeout?: number;
  readonly headers?: Record<string, string>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface IHttpRequest {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
}

export interface IHttpResponse<T> {
  readonly status: number;
  readonly data: T;
}

export class HttpError extends Error {
  public readonly status?: number;
  public readonly response?: Response;

  public constructor(message: string, options: { status?: number; response?: Response }) {
    super(message);
    this.name = 'HttpError';
    this.status = options.status;
    this.response = options.response;
  }
}

export class HttpClient {
  private readonly baseUrl?: string;
  private readonly timeout: number;
  private readonly headers: Record<string, string>;

  public constructor(options?: IHttpClientOptions) {
    this.timeout = options?.timeout ?? 15000;
    this.baseUrl = options?.baseUrl;
    this.headers = Object.freeze({ ...(options?.headers ?? {}) });
  }

  public get<T>(url: string, body?: unknown): Promise<IHttpResponse<T>> {
    return this.request<T>({ url, body, method: 'GET' });
  }

  public post<T>(url: string, body?: unknown): Promise<IHttpResponse<T>> {
    return this.request<T>({ url, body, method: 'POST' });
  }

  private async request<T>(req: IHttpRequest): Promise<IHttpResponse<T>> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeout);

    const url = this.buildUrl(req.url);
    const headers = { ...this.headers, ...(req.headers ?? {}) };

    const fetchOpts: RequestInit = {
      method: req.method,
      headers: headers,
      body: serializeBody(req.body, headers),
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, fetchOpts);
      clearTimeout(timeoutHandle);

      const data = (await readResponseBody(response)) as T;
      if (!response.ok) {
        throw new HttpError(response.statusText, {
          status: response.status,
          response: response,
        });
      }

      return {
        data,
        status: response.status,
      };
    } catch (err) {
      clearTimeout(timeoutHandle);

      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`Request to url ${url} timed out after ${this.timeout}ms`);
      }

      throw err;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private buildUrl(inputUrl: string): string {
    if (!this.baseUrl) {
      return inputUrl;
    }
    if (/^https?:\/\//i.test(inputUrl)) {
      return inputUrl;
    }
    const slash = this.baseUrl.endsWith('/') || inputUrl.startsWith('/') ? '' : '/';
    return this.baseUrl + slash + inputUrl;
  }
}

function serializeBody(body: unknown, headers?: Record<string, string>): BodyInit | undefined {
  if (body == null) {
    return undefined;
  }

  const contentType = headers?.['Content-Type']?.toLowerCase();

  if (!contentType || contentType.includes('application/json')) {
    if (typeof body === 'string') {
      return body;
    }
    return JSON.stringify(body);
  }

  return body as BodyInit;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const ct = response.headers.get('Content-Type')?.toLowerCase() ?? '';
  if (ct.includes('application/json')) {
    const txt = await response.text();
    return tryParseJson(txt);
  }
  if (ct.includes('text/')) {
    return response.text();
  }
  return response.arrayBuffer();
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
