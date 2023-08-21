# FixTweet Elongator

Elongator is an internal proxying service used to circumvent Twitter's restrictions disallowing access to sensitive/NSFW Tweets from the guest API. FixTweet relies on the guest API to provide unauthenticated access to Tweets, so in instances where Twitter excludes Tweets from the guest API, FixTweet will be able to access them through elongator.

FixTweet will redirect requests to Elongator only when the guest API excludes the specified Tweet from its original response. Elongator achieves its purpose by stamping the incoming request with an auth_token from a real Twitter account, and requests are spread out among many accounts for more even rate limit wearing. For GraphQL requests, we also include valid per-account csrf tokens which is required for GraphQL functionality.

This implementation is still quite basic, as it started because of Twitter's unannounced change to their API, and currently does not support re-authing with username and password yet, only existing auth/csrf tokens.

This method of implementation helps reduce a single point of failure, as Twitter cannot easily shut down elongator at-will without otherwise breaking their API, so preventing FixTweet from functioning with NSFW Tweets is made harder. 

**Warning**: It is possible that Twitter can lock individual accounts. Elongator will auto-recover by picking a new account if it happens to pick a locked account. However, it is important to monitor the Twitter accounts to make sure they work. Elongator will spit out errors in the event an account is locked.

Currently, we do not support automatically logging in to Twitter using the accounts. While the username and password fields are present, the password field is not used yet.

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
