# FixTweet Elongator

Elongator is an internal proxying service used to circumvent Twitter's restrictions disallowing access to sensitive/NSFW Tweets from the guest API. FixTweet relies on the guest API to provide unauthenticated access to Tweets, so in instances where Twitter excludes Tweets from the guest API, FixTweet will be able to access them through elongator.

Elongator works by stamping the incoming request with an auth_token and csrf token from a real Twitter account, and requests are spread out among many accounts for more even rate-limit wearing. For GraphQL requests, we also include valid per-account csrf tokens which is required for GraphQL functionality.

You can pull the auth_token and csrf token from the headers of outgoing requests from your proxy account (i.e. Looking through Cookies or Network tab in your browser's dev tools)

This method of implementation helps reduce a single point of failure, as Twitter cannot easily shut down elongator at-will without otherwise breaking the compatibiltiy of their API for existing clients, so we have a buffer to fix changes they may make as they arise.

**Warning**: It is possible that Twitter can lock individual accounts. Usually, Twitter will lock accounts for automated activity up to 2 times and generally not ask again afterwards as long as you don't post tweets, etc.

`credentials.json` has a password field but we do not currently use it for anything. Originally, we were going to have a system to re-authenticate if necessary, but this turned out unnecessary; auth tokens don't seem to expire for a really long time (if not indefinitely) so that is unlikely to affect you any time soon.

## Setup

### Requirements

* Latest LTS Node.js, and NPM
* Basic understanding of Cloudflare Workers and Service Bindings
* A _lot_ of Twitter accounts

### Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Set up credentials in `credentials.json`
4. Configure `wrangler.toml` with your Cloudflare account ID
5. `npm run reload` to upload the worker to Cloudflare and open a log
6. Make sure FixTweet is set up with your elongator service binding in its `wrangler.toml`
