import { describe, it, expect } from "vitest";
import { createRateLimiter } from "../../src/rate_limiter/rateLimiter.factory.js";
import { TokenBucket } from "../../src/rate_limiter/algorithms/tokenBucket.algo.js";
import { LeakyBucket } from "../../src/rate_limiter/algorithms/leakyBucket.algo.js";
import { SlidingWindow } from "../../src/rate_limiter/algorithms/slidingWindow.algo.js";
import { client } from "./setup.js";

describe("RateLimiter Factory", () => {
    it("should create TokenBucket", () => {
        const limiter = createRateLimiter({
            algorithm: "token-bucket",
            capacity: 10,
            refillRate: 1,
            client
        });

        expect(limiter).toBeInstanceOf(TokenBucket);
    });

    it("should create LeakyBucket", () => {
        const limiter = createRateLimiter({
            algorithm: "leaky-bucket",
            capacity: 10,
            leakRate: 1,
            client
        });

        expect(limiter).toBeInstanceOf(LeakyBucket);
    });

    it("should create SlidingWindow", () => {
        const limiter = createRateLimiter({
            algorithm: "sliding-window",
            windowSize: 60,
            maxRequests: 10,
            client
        });

        expect(limiter).toBeInstanceOf(SlidingWindow);
    });
});