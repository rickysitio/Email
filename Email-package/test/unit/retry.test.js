// tests/unit/retryHandler.test.js
const { RetryHandler } = require('../../src/emailService/retryHandler/retry');
const {
  _fireFinalSuccess,
  _fireHook,
  _isProviderError,
  _getNextProvider,
  sleep,
} = require('../../src/emailService/utils/helper');

// Mock all helper functions
jest.mock('../../src/emailService/utils/helper', () => ({
  sleep: jest.fn(() => Promise.resolve()),
  _fireFinalSuccess: jest.fn(),
  _fireHook: jest.fn(),
  _isProviderError: jest.fn(),
  _getNextProvider: jest.fn(),
}));

describe('RetryHandler - Unit Tests', () => {
  let retryHandler;
  let providers;
  let mockProviderManager;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockSendProvider1 = jest.fn()
      .mockRejectedValueOnce(new Error('temporary error'))
      .mockResolvedValueOnce({ messageId: 'msg-1' });

    const mockSendProvider2 = jest.fn()
      .mockResolvedValue({ messageId: 'msg-2' });

    providers = [
      { source: 'provider1', send: mockSendProvider1 },
      { source: 'provider2', send: mockSendProvider2 },
    ];

    mockProviderManager = {
      getProviders: jest.fn(() => providers),
      getProvider: jest.fn((source) => providers.find(p => p.source === source) || null),
      init: jest.fn().mockResolvedValue(true),
    };

    retryHandler = new RetryHandler(mockProviderManager, { retryDelay: 10 });

    // Default: all errors are retryable unless overridden
    _isProviderError.mockReturnValue(false);
    _getNextProvider.mockImplementation((current, all, tried) =>
      all.find((p) => !tried.has(p.source)) || null
    );
  });

  test('retries first provider once on retryable error and succeeds', async () => {
    const hooks = { onSendStart: jest.fn(), onRetry: jest.fn(), onFinalSuccess: jest.fn(), onError: jest.fn() };

    const result = await retryHandler.sendWithRetry('provider1', { to: 'test@example.com' }, hooks);

    expect(result.result.messageId).toBe('msg-1');
    expect(providers[0].send).toHaveBeenCalledTimes(2);
    expect(hooks.onRetry).toHaveBeenCalledTimes(1);
    expect(_fireFinalSuccess).toHaveBeenCalledWith(hooks, 'test@example.com', 'provider1', { messageId: 'msg-1' });
  });

  test('calls onError and switches provider after first provider fails twice', async () => {
    providers[0].send = jest.fn()
      .mockRejectedValueOnce(new Error('temporary error'))
      .mockRejectedValueOnce(new Error('temporary error again'));

    const hooks = { onSendStart: jest.fn(), onRetry: jest.fn(), onError: jest.fn(), onProviderSwitch: jest.fn(), onFinalSuccess: jest.fn() };

    const result = await retryHandler.sendWithRetry('provider1', { to: 'test@example.com' }, hooks);

    expect(result.result.messageId).toBe('msg-2');
    expect(hooks.onError).toHaveBeenCalledTimes(1);
    expect(hooks.onProviderSwitch).toHaveBeenCalledTimes(1);
  });

  test('switches to next provider immediately if error is fatal', async () => {
    _isProviderError.mockReturnValue(true); // simulate fatal error
    providers[0].send = jest.fn().mockRejectedValue(new Error('quota exceeded'));

    const hooks = { onSendStart: jest.fn(), onProviderSwitch: jest.fn(), onFinalSuccess: jest.fn(), onError: jest.fn() };

    const result = await retryHandler.sendWithRetry('provider1', { to: 'test@example.com' }, hooks);

    expect(result.result.messageId).toBe('msg-2');
    expect(hooks.onProviderSwitch).toHaveBeenCalled();
  });

  test('throws error after all providers fail', async () => {
    providers[0].send = jest.fn().mockRejectedValue(new Error('auth failed'));
    providers[1].send = jest.fn().mockRejectedValue(new Error('auth failed'));

    const hooks = { onSendStart: jest.fn(), onFinalFailure: jest.fn(), onError: jest.fn(), onProviderSwitch: jest.fn() };

    await expect(
      retryHandler.sendWithRetry('provider1', { to: 'fail@example.com' }, hooks)
    ).rejects.toThrow('All providers failed to send the email');

    expect(hooks.onFinalFailure).toHaveBeenCalledWith({
      to: 'fail@example.com',
      attemptedProviders: ['provider1', 'provider2'],
    });
  });

  test('handles provider not found error', async () => {
    await expect(
      retryHandler.sendWithRetry('nonexistent', { to: 'test@example.com' })
    ).rejects.toThrow('Provider not found for source: nonexistent');
  });

  test('handles no providers available error', async () => {
    mockProviderManager.getProviders.mockReturnValue([]);
    await expect(
      retryHandler.sendWithRetry('provider1', { to: 'test@example.com' })
    ).rejects.toThrow('No providers available');
  });

  test('fires onSendStart hook before sending', async () => {
    const hooks = { onSendStart: jest.fn() };
    await retryHandler.sendWithRetry('provider1', { to: 'test@example.com' }, hooks);

    expect(_fireHook).toHaveBeenCalledWith(hooks, 'onSendStart', {
      to: 'test@example.com',
      source: 'provider1',
    });
  });
});
