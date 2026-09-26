import { describe, expect, it } from 'vitest';
import { TokenBucket } from '../../src/rate_limiter/algorithms/tokenBucket.algo.js';
import { client } from './setup.js';


describe('TokenBucket', () => {
  it('should allow requests when tokens are available', async () => {
    const bucket = new TokenBucket(5, 1, client); // 5 tokens, refill rate of 1 token per second
    const userId = `test-${Date.now()}`;
    const result = await bucket.allowRequest(userId);
    expect(result).toBe(true);
  });


  it('should deny requests when tokens are not available', async () => {
    const bucket = new TokenBucket(1, 0, client);
    const userId = `test-${Date.now()}`;
    const firstRequest = await bucket.allowRequest(userId);
    expect(firstRequest).toBe(true);

    const secondRequest = await bucket.allowRequest(userId);
    expect(secondRequest).toBe(false);
  });


  it('should deny requests when tokens are not available and then allow after refill', async () => {
    const bucket = new TokenBucket(1, 1, client);
    const userId = `test-${Date.now()}`;

    const firstRequest = await bucket.allowRequest(userId);
    expect(firstRequest).toBe(true);

    const secondRequest = await bucket.allowRequest(userId);
    expect(secondRequest).toBe(false);

    const waitTime = 1100; // Wait for 1.1 seconds to ensure refill
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    const thirdRequest = await bucket.allowRequest(userId);
    expect(thirdRequest).toBe(true);
  });


  it('should handle multiple users independently with unique buckets', async () => {
    const bucket = new TokenBucket(1, 1, client);
    const userId1 = `user1-${Date.now()}`;
    const userId2 = `user2-${Date.now()}`;

    const firstRequestUser1 = await bucket.allowRequest(userId1);
    expect(firstRequestUser1).toBe(true);

    const secondRequestUser1 = await bucket.allowRequest(userId1);
    expect(secondRequestUser1).toBe(false);

    const firstRequestUser2 = await bucket.allowRequest(userId2);
    expect(firstRequestUser2).toBe(true);

    const secondRequestUser2 = await bucket.allowRequest(userId2);
    expect(secondRequestUser2).toBe(false);
  });


  it('should not fill tokens beyond capacity', async () => {
    const bucket = new TokenBucket(2, 1, client);
    const userId = `test-${Date.now()}`;
    
    const firstRequest = await bucket.allowRequest(userId);
    expect(firstRequest).toBe(true);
    
    const secondRequest = await bucket.allowRequest(userId);
    expect(secondRequest).toBe(true);

    const waitTime = 3000; // Wait for 3 seconds to ensure refill
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    const thirdRequest = await bucket.allowRequest(userId);
    expect(thirdRequest).toBe(true);

    const fourthRequest = await bucket.allowRequest(userId);
    expect(fourthRequest).toBe(true);

    const fifthRequest = await bucket.allowRequest(userId);
    expect(fifthRequest).toBe(false);
  });


  it('should not exceed capacity with concurrent requests', async () => {
    const bucket = new TokenBucket(5, 0, client);
    const userId = `concurrent-${Date.now()}`;

    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
          bucket.allowRequest(userId)
      )
    );

    const allowedRequests = results.filter(
        result => result === true
    );

    expect(allowedRequests.length).toBe(5);
});
});