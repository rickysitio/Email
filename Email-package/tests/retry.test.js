const { RetryHandler } = require("../src/emailService/retry");

describe('RetryHandler', () => {
  let retryHandler;
  let attempts;

  beforeEach(() => {
    attempts = 0;

    // ---------------- Mock send method ----------------
    // This simulates a provider sending email.
    // It fails on the first attempt, then succeeds on the second.

    const mockSend = async () => {
      attempts++;
      if (attempts < 2) throw new Error('fail');
      return { messageId: 'mock-msg-123', to: 'test@example.com', subject: 'Retry Test', provider: 'mock' };
    };

    // Mock provider object
    const mockProvider = { source: 'mock', send: mockSend };

     // ---------------- Create RetryHandler instance ----------------
    // Injecting a mocked providerManager interface

    retryHandler = new RetryHandler({
      getProviders: () => [mockProvider],
      getProvider: () => mockProvider,
      init: async () => true,
    });

     // Override sleep to avoid real-time delay during tests
    retryHandler.sleep = async () => {}; // avoid real delay
  });

  
  // ------------------------test--------------------------
  test('should retry until success', async () => {
    const result = await retryHandler.sendWithRetry('mock', { to: 'test@example.com', subject: 'Retry Test' });

    // Check that sendWithRetry eventually succeeded
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
