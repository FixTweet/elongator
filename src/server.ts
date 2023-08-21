type Credentials = {
  authToken: string
  csrfToken: string
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
  const apiUrl = `https://twitter.com${url.pathname}${url.search}`

  // Check if the API endpoint is on the allowlist
  if (!isAllowlisted(apiUrl)) {
    return new Response('Endpoint not allowlisted', { status: 403 })
  }

  // Clone the incoming request and modify its headers
  const headers = new Headers(request.headers)

  let existingCookies = request.headers.get('Cookie');

  // Create a new request with the modified properties
  const newRequestInit: RequestInit = {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: request.redirect,
    integrity: request.integrity,
    signal: request.signal
  }

  // Send the modified request to the Twitter API

  // Read the response body to create a new response with string version of body
  // Decode the response using the TextDecoder API
  const textDecoder = new TextDecoder('utf-8')

  // Send the modified request to the Twitter API
  let response: Response;
  let json: any;
  let errors: boolean;
  let decodedBody: string;

  do {
    errors = false;
    const { authToken, csrfToken } = getRandomAccount();
    let newCookies = `auth_token=${authToken}`;
    /* If GraphQL request, we need to replace x-csrf-token and the ct0 cookie with saved csrfToken
       Unlike REST requests, GraphQL requests require a server csrf token. This restriction does not apply to guest token access. */
    if (apiUrl.includes('graphql')) {
      existingCookies = existingCookies?.replace(/ct0=(.+?);/, '') || '';
      newCookies = `auth_token=${authToken}; ct0=${csrfToken}; `;
      headers.set('x-csrf-token', csrfToken);
    }
    const cookies = mergeCookies(existingCookies?.toString(), newCookies);
    headers.set('Cookie', cookies);
    headers.delete('Accept-Encoding');

    newRequestInit.headers = headers;

    const newRequest = new Request(apiUrl, newRequestInit);
    response = await fetch(newRequest);

    // Read the response body to create a new response with string version of body
    decodedBody = textDecoder.decode(await response.arrayBuffer()).match(/{.+}/)?.[0] || '{}';

    var attempts = 0;

    try {
      attempts++;
      json = JSON.parse(decodedBody);
      if (json.errors) {
        console.log(json.errors);
        console.log(`Account is not working, trying another one...`);
        errors = true;
      }

      // if attempts over 5, return bad gateway
      if (attempts > 5) {
        return new Response('Bad Gateway', { status: 502 })
      }
    } catch (e) {
      console.log('Error parsing JSON:', e);
      errors = true;
    }
  } while (errors);
 

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
    '/i/api/1.1/strato/column/None/tweetId',
    '/i/api/graphql/2ICDjqPd81tulZcYrtpTuQ/TweetResultByRestId'
  ]

  const endpointPath = new URL(apiUrl).pathname

  console.log('endpointPath',endpointPath)
  return allowlist.some(endpoint => endpointPath.startsWith(endpoint))
}


function getRandomAccount(): Credentials {
  const randomIndex = Math.floor(Math.random() * credentials.accounts.length)
  const randomAccount = credentials.accounts[randomIndex]
  console.log(`Using account ${randomAccount.username}`);
  return randomAccount
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

function parseCookies(cookieHeader: string, isGraphQL = false): Record<string, string> {
  const cookieList = cookieHeader.split(';')
  const cookieMap = cookieList.reduce((map, cookie) => {
    const [name, value] = cookie.trim().split('=')
    if (name) {
      map[name] = value
    }
    return map
  }, {} as Record<string, string>)

  return cookieMap
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})