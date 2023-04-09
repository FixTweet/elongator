type Credentials = {
  authToken: string
  username: string
  password: string
}

type CredentialList = {
  accounts: Credentials[]
}

import _credentials from '../credentials.json';
const credentials: CredentialList = _credentials;

async function handleRequest(request: Request): Promise<Response> {
  // Extract the URL of the Twitter API endpoint from the incoming request
  const url = new URL(request.url)
  const apiUrl = `https://api.twitter.com${url.pathname}${url.search}`

  // Check if the API endpoint is on the allowlist
  if (!isAllowlisted(apiUrl)) {
    return new Response('Endpoint not allowlisted', { status: 403 })
  }

  // Clone the incoming request and modify its headers
  const headers = new Headers(request.headers)

  // Generate a random auth_token cookie value
  const auth_token = getAuthToken()

  // Merge the incoming cookies with the auth_token cookie
  const existingCookies = request.headers.get('Cookie')
  const cookies = mergeCookies(existingCookies?.toString(), `auth_token=${auth_token}`)
  headers.set('Cookie', cookies)
  headers.delete('Accept-Encoding');

  // Create a new request with the modified properties
  const newRequestInit: RequestInit = {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: request.redirect,
    integrity: request.integrity,
    signal: request.signal
  }
  const newRequest = new Request(apiUrl, newRequestInit)

  // Send the modified request to the Twitter API
  const response = await fetch(newRequest)

  // Read the response body to create a new response with string version of body
  // Decode the response using the TextDecoder API
  const textDecoder = new TextDecoder('utf-8')
  const decodedBody = textDecoder.decode(await response.arrayBuffer()).match(/{.+}/)?.[0] || '{}';

  // Create a new Response object with the decoded body
  const decodedResponse = new Response(decodedBody, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })

  // Print out x-rate-limit-remaining
  const rateLimitRemaining = response.headers.get('x-rate-limit-remaining')
  console.log(`Rate limit remaining for account: ${rateLimitRemaining}`)
  // Print rate limit reset converted to a human readable date
  const rateLimitReset = response.headers.get('x-rate-limit-reset')
  const rateLimitResetDate = new Date(Number(rateLimitReset) * 1000)
  console.log(`Rate limit reset for account: ${rateLimitResetDate}`)

  return decodedResponse
}

function isAllowlisted(apiUrl: string): boolean {
  const allowlist: string[] = [
    '/2/timeline/conversation'
  ]

  const endpointPath = new URL(apiUrl).pathname
  return allowlist.some(endpoint => endpointPath.startsWith(endpoint))
}


function getAuthToken(): string {
  const randomIndex = Math.floor(Math.random() * credentials.accounts.length)
  const randomAccount = credentials.accounts[randomIndex]
  console.log(`Using account ${randomAccount.username}`);
  return randomAccount.authToken
}

function mergeCookies(existingCookies?: string, newCookie?: string): string {
  if (!existingCookies) {
    return newCookie ?? ''
  }

  if (!newCookie) {
    return existingCookies
  }

  const existingCookieMap = parseCookies(existingCookies)
  const newCookieMap = parseCookies(newCookie)

  const mergedCookieMap = { ...existingCookieMap, ...newCookieMap }
  const mergedCookieList = Object.entries(mergedCookieMap).map(([name, value]) => `${name}=${value}`)
  const mergedCookies = mergedCookieList.join('; ')

  return mergedCookies
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookieList = cookieHeader.split(';')
  const cookieMap = cookieList.reduce((map, cookie) => {
    const [name, value] = cookie.trim().split('=')
    map[name] = value
    return map
  }, {} as Record<string, string>)

  return cookieMap
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})