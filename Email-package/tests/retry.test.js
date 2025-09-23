const { RetryHandler } = require("../src/emailService/retry");

describe('RetryHandler', () => {
  let retryHandler;
  let attempts;

  beforeEach(() => {
    attempts = 0;

    // Succeed on second attempt (not third)
    const mockSend = async () => {
      attempts++;
      if (attempts < 2) throw new Error('fail');
      return { messageId: 'mock-msg-123', to: 'test@example.com', subject: 'Retry Test', provider: 'mock' };
    };

    // Shared provider instance!
    const mockProvider = { source: 'mock', send: mockSend };

    retryHandler = new RetryHandler({
      getProviders: () => [mockProvider],
      getProvider: () => mockProvider,
      init: async () => true,
    });

    retryHandler.sleep = async () => {}; // avoid real delay
  });

  test('should retry until success', async () => {
    const result = await retryHandler.sendWithRetry('mock', { to: 'test@example.com', subject: 'Retry Test' });

    expect(result.result.messageId).toBe('mock-msg-123');
    expect(attempts).toBe(2); // retried once (so 2 attempts)
  });

  test('should succeed on first attempt', async () => {
    attempts = 2; // >= 2 makes first call succeed

    const result = await retryHandler.sendWithRetry('mock', { to: 'success@example.com', subject: 'Retry Test' });

    expect(result.result.messageId).toBe('mock-msg-123');
    expect(attempts).toBe(3); // just one attempt for this test
  });
});
