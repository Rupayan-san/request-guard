# Request Guard

Redis-based rate limiting and semantic caching for Node.js applications.

## Features

* Token Bucket rate limiting
* Leaky Bucket rate limiting
* Sliding Window rate limiting
* Redis-backed state
* Semantic caching for LLM responses
* Pluggable LLM and embedding providers
* TypeScript support
* ESM support

## Installation

```bash
npm install @rupayan-das/request-guard redis
```

Make sure Redis is running and accessible from your application.

Semantic caching requires Redis with vector search support, such as Redis Stack.

## Rate Limiting

### Using the Factory

```ts
import { createRateLimiter } from "@rupayan-das/request-guard";
import { createClient } from "redis";

const client = createClient({
  url: "redis://localhost:6379",
});

await client.connect();

const rateLimiter = createRateLimiter({
  algorithm: "token-bucket",
  capacity: 10,
  refillRate: 1,
  client,
});

const allowed = await rateLimiter.allowRequest("user-123");

console.log(allowed);
```

`allowRequest()` returns `true` when the request is allowed and `false` when the rate limit has been exceeded.

## Available Algorithms

### Token Bucket

```ts
const rateLimiter = createRateLimiter({
  algorithm: "token-bucket",
  capacity: 10,
  refillRate: 1,
  client,
});
```

* `capacity`: Maximum number of tokens in the bucket.
* `refillRate`: Number of tokens added per second.

### Leaky Bucket

```ts
const rateLimiter = createRateLimiter({
  algorithm: "leaky-bucket",
  capacity: 10,
  leakRate: 1,
  client,
});
```

* `capacity`: Maximum bucket capacity.
* `leakRate`: Number of requests processed per second.

### Sliding Window

```ts
const rateLimiter = createRateLimiter({
  algorithm: "sliding-window",
  windowSize: 60,
  maxRequests: 10,
  client,
});
```

* `windowSize`: Window duration in seconds.
* `maxRequests`: Maximum number of requests allowed within the window.

## Semantic Cache

Semantic caching uses embeddings to determine whether a new query is sufficiently similar to a previously cached query.

```ts
import { SemanticCache } from "@rupayan-das/request-guard";

const cache = new SemanticCache({
  client,
  embeddingProvider,
  llmProvider,
  threshold: 0.6,
});

const response = await cache.getOrGenerate(
  "Explain how Redis works"
);

console.log(response);
```

If a sufficiently similar query exists in the cache, its cached response is returned instead of generating a new LLM response.

The default similarity threshold is `0.6`.

A higher threshold requires queries to be more similar to produce a cache hit. A lower threshold allows more loosely related queries to use cached responses.

## Providers

The semantic cache does not depend on a specific AI provider.

You provide implementations of the `EmbeddingProvider` and `LLMProvider` interfaces.

### Embedding Provider

```ts
interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
}
```

> **Note:** The embedding provider must return vectors with the same dimensionality configured in the Redis vector index.

### LLM Provider

```ts
interface LLMProvider {
  askLLM(prompt: string): Promise<string>;
}
```

This allows the semantic cache to work with different LLM and embedding providers.

For example, you can implement these interfaces using OpenAI, Anthropic, Gemini, a local model, or another provider.

## Direct Algorithm Usage

The individual rate limiting algorithms can also be instantiated directly.

```ts
import { TokenBucket } from "@rupayan-das/request-guard";

const limiter = new TokenBucket(
  10,
  1,
  client
);

const allowed = await limiter.allowRequest("user-123");

console.log(allowed);
```

The same approach can be used with `LeakyBucket` and `SlidingWindow`.

## API

### `createRateLimiter(options)`

Creates a rate limiter using one of the supported algorithms:

* `token-bucket`
* `leaky-bucket`
* `sliding-window`

### `SemanticCache(options)`

Creates a semantic cache using:

* A Redis client
* An embedding provider
* An LLM provider
* An optional similarity threshold

### `allowRequest(userId)`

Checks whether a request should be allowed for the specified user.

Returns:

```ts
Promise<boolean>
```

* `true`: Request is allowed.
* `false`: Rate limit has been exceeded.

### `getOrGenerate(query)`

Checks the semantic cache for a sufficiently similar query.

* Returns the cached response on a cache hit.
* Calls the configured LLM provider on a cache miss.
* Stores the generated response in the semantic cache.

Returns:

```ts
Promise<string>
```

## Redis

The rate limiter uses Redis to store rate limiting state.

The semantic cache uses Redis to store cached queries, responses, and embeddings and to perform vector similarity searches.

Make sure your Redis instance is accessible from your Node.js application.

## Requirements

* Node.js `>= 20`
* Redis with vector search support for semantic caching

## License

MIT

## Repository

Source code and issue tracking:

https://github.com/Rupayan-san/request-guard