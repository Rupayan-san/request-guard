import { describe, it, expect } from 'vitest';
import { SlidingWindow } from '../../src/rate_limiter/algorithms/slidingWindow.algo.js';
import { client } from './setup.js';


describe('SlidingWindow', () => {
    it('should allow requests when under the limit', async () => {
        const slidingWindow = new SlidingWindow(10, 3, client);
        const userId = `test-${Date.now()}`;

        const first = await slidingWindow.allowRequest(userId);
        const second = await slidingWindow.allowRequest(userId);
        const third = await slidingWindow.allowRequest(userId);

        expect(first).toBe(true);
        expect(second).toBe(true);
        expect(third).toBe(true);
    });


    it('should reject requests when the limit is reached', async () => {
        const slidingWindow = new SlidingWindow(10, 3, client);
        const userId = `test-${Date.now()}`;

        await slidingWindow.allowRequest(userId);
        await slidingWindow.allowRequest(userId);
        await slidingWindow.allowRequest(userId);

        const fourth = await slidingWindow.allowRequest(userId);

        expect(fourth).toBe(false);
    });


    it('should allow requests after the window expires', async () => {
        const slidingWindow = new SlidingWindow(1, 2, client);
        const userId = `test-${Date.now()}`;

        const first = await slidingWindow.allowRequest(userId);
        const second = await slidingWindow.allowRequest(userId);

        expect(first).toBe(true);
        expect(second).toBe(true);

        const third = await slidingWindow.allowRequest(userId);

        expect(third).toBe(false);

        await new Promise(resolve => setTimeout(resolve, 1100));

        const fourth = await slidingWindow.allowRequest(userId);

        expect(fourth).toBe(true);
    });


    it('should maintain independent windows for different users', async () => {
        const slidingWindow = new SlidingWindow(10, 2, client);

        const user1 = `user1-${Date.now()}`;
        const user2 = `user2-${Date.now()}`;

        await slidingWindow.allowRequest(user1);
        await slidingWindow.allowRequest(user1);

        const user1Third = await slidingWindow.allowRequest(user1);
        expect(user1Third).toBe(false);

        const user2First = await slidingWindow.allowRequest(user2);
        expect(user2First).toBe(true);
    });


    it('should not exceed the limit with concurrent requests', async () => {
        const slidingWindow = new SlidingWindow(10, 5, client);
        const userId = `concurrent-${Date.now()}`;

        const results = await Promise.all(
            Array.from({ length: 20 }, () =>
                slidingWindow.allowRequest(userId)
            )
        );

        const allowed = results.filter(result => result === true);

        expect(allowed.length).toBe(5);
    });
});
