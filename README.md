# FixTweet Elongator

Elongator is an internal proxying service used to circumvent Twitter's restrictions disallowing access to sensitive/NSFW Tweets from the guest API. FixTweet relies on the guest API to provide unauthenticated access to Tweets, so in instances where Twitter excludes Tweets from the guest API, FixTweet will be able to access them through elongator.

FixTweet will redirect requests to Elongator only when the guest API excludes the specified Tweet from its original response. Elongator achieves its purpose by stamping the incoming request with an auth_token from a real Twitter account, and requests are spread out among many accounts for more even rate limit wearing.

This implementation is early, as it started because of Twitter's unannounced change to their API, and currently does not support re-authing with username and password yet, only existing auth tokens.

This method of implementation helps reduce a single point of failure, as [Twitter cannot easily shut down elongator at-will](https://www.engadget.com/twitter-shut-off-its-free-api-and-its-breaking-a-lot-of-apps-222011637.html) without breaking API fundamentals, so preventing FixTweet from functioning with NSFW Tweets will be harder. 

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
