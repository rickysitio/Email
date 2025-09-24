const { RetryHandler } = require("../src/emailService/retryHandler/retry");

describe("RetryHandler", () => {
  let retryHandler;
  let providers;
  let mockProviderManager;

  beforeEach(() => {
    // Mock send for provider1:
    // First call fails (retryable error), triggers retry logic and onError hook.
    // Second call succeeds, triggers onRetry and onFinalSuccess hooks.
    const mockSendProvider1 = jest.fn()
      .mockRejectedValueOnce(new Error("temporary error"))
      .mockResolvedValueOnce({ 
        messageId: "msg-1", 
        envelopeTime: 100, 
        messageTime: 200 
      });

    // Mock send for provider2: always succeeds
    const mockSendProvider2 = jest.fn().mockResolvedValue({ 
      messageId: "msg-2",
      envelopeTime: 150,
      messageTime: 250
    });

    providers = [
      {
        source: "provider1",
        send: mockSendProvider1,
      },
      {
        source: "provider2", 
        send: mockSendProvider2,
      },
    ];

    mockProviderManager = {
      getProviders: jest.fn(() => providers),
      getProvider: jest.fn((source) => {
        return providers.find(p => p.source === source) || null;
      }),
      init: jest.fn().mockResolvedValue(true),
    };

    retryHandler = new RetryHandler(mockProviderManager, { retryDelay: 10 });
  });


  //-----------------tests------------------
  
  test("should retry first provider once on retryable error and succeed", async () => {
    const hooks = {
      onSendStart: jest.fn(),
      onRetry: jest.fn(),
      onFinalSuccess: jest.fn(),
      onError: jest.fn(),
    };

    const result = await retryHandler.sendWithRetry(
      "provider1", 
      { to: "test@example.com" }, 
      hooks
    );

    // Verify the result
    expect(result.result.messageId).toBe("msg-1");
    expect(result.provider).toBe("provider1");
    
    // Verify provider1 was called twice (initial + retry)
    expect(providers[0].send).toHaveBeenCalledTimes(2);
    
    // Verify hooks were called correctly
    expect(hooks.onSendStart).toHaveBeenCalledWith({
      to: "test@example.com",
      source: "provider1"
    });
    
    // Note: onError is NOT called in this scenario because the error is handled internally
    // during retry logic. The error only triggers onError if it causes a provider switch.
    expect(hooks.onError).toHaveBeenCalledTimes(0);
    
    expect(hooks.onRetry).toHaveBeenCalledTimes(1);
    expect(hooks.onRetry).toHaveBeenCalledWith({
      to: "test@example.com",
      provider: "provider1",
      attempt: 2
    });
    expect(hooks.onFinalSuccess).toHaveBeenCalledTimes(1);
    expect(hooks.onFinalSuccess).toHaveBeenCalledWith({
      to: "test@example.com",
      provider: "provider1",
      envelopeTime: 100,
      messageTime: 200
    });
  });

  test("should call onError when retry fails and switches provider", async () => {
    // Provider1 fails twice (retryable error both times), then switches to provider2
    providers[0].send = jest.fn()
      .mockRejectedValueOnce(new Error("temporary error"))
      .mockRejectedValueOnce(new Error("temporary error again"));

    const hooks = {
      onSendStart: jest.fn(),
      onRetry: jest.fn(),
      onError: jest.fn(),
      onProviderSwitch: jest.fn(),
      onFinalSuccess: jest.fn(),
    };

    const result = await retryHandler.sendWithRetry(
      "provider1", 
      { to: "test@example.com" }, 
      hooks
    );

    // Should succeed with provider2
    expect(result.result.messageId).toBe("msg-2");
    expect(result.provider).toBe("provider2");
    
    // Verify provider1 was called twice (initial + retry), then provider2 once
    expect(providers[0].send).toHaveBeenCalledTimes(2);
    expect(providers[1].send).toHaveBeenCalledTimes(1);
    
    // Verify hooks
    expect(hooks.onRetry).toHaveBeenCalledTimes(1);
    expect(hooks.onError).toHaveBeenCalledTimes(1); // Called after retry fails
    expect(hooks.onProviderSwitch).toHaveBeenCalledTimes(1);
    expect(hooks.onFinalSuccess).toHaveBeenCalledTimes(1);
  });

  test("should switch to next provider if first provider fails fatally", async () => {
    // Override provider1 to always fail fatally (no retry)
    providers[0].send = jest.fn().mockRejectedValue(new Error("quota exceeded"));

    const hooks = {
      onSendStart: jest.fn(),
      onProviderSwitch: jest.fn(),
      onFinalSuccess: jest.fn(),
      onError: jest.fn(),
    };

    const result = await retryHandler.sendWithRetry(
      "provider1", 
      { to: "test@example.com" }, 
      hooks
    );

    // Verify the result came from provider2
    expect(result.result.messageId).toBe("msg-2");
    expect(result.provider).toBe("provider2");
    
    // Verify provider usage
    expect(providers[0].send).toHaveBeenCalledTimes(1);
    expect(providers[1].send).toHaveBeenCalledTimes(1);
    
    // Verify hooks
    expect(hooks.onSendStart).toHaveBeenCalledWith({
      to: "test@example.com",
      source: "provider1"
    });
    expect(hooks.onError).toHaveBeenCalledWith({
      to: "test@example.com",
      provider: "provider1",
      error: expect.any(Error)
    });
    expect(hooks.onProviderSwitch).toHaveBeenCalledWith({
      to: "test@example.com",
      fromProvider: "provider1",
      toProvider: "provider2",
    });
    expect(hooks.onFinalSuccess).toHaveBeenCalledWith({
      to: "test@example.com",
      provider: "provider2",
      envelopeTime: 150,
      messageTime: 250
    });
  });

  test("should throw error after all providers fail", async () => {
    // Both providers fail fatally
    providers[0].send = jest.fn().mockRejectedValue(new Error("auth failed"));
    providers[1].send = jest.fn().mockRejectedValue(new Error("auth failed"));

    const hooks = {
      onSendStart: jest.fn(),
      onFinalFailure: jest.fn(),
      onError: jest.fn(),
      onProviderSwitch: jest.fn(),
    };

    await expect(
      retryHandler.sendWithRetry("provider1", { to: "fail@example.com" }, hooks)
    ).rejects.toThrow("All providers failed to send the email");

    // Verify both providers were attempted
    expect(providers[0].send).toHaveBeenCalledTimes(1);
    expect(providers[1].send).toHaveBeenCalledTimes(1);
    
    // Verify hooks
    expect(hooks.onSendStart).toHaveBeenCalledWith({
      to: "fail@example.com",
      source: "provider1"
    });
    expect(hooks.onError).toHaveBeenCalledTimes(2); // once per provider failure
    expect(hooks.onProviderSwitch).toHaveBeenCalledWith({
      to: "fail@example.com",
      fromProvider: "provider1",
      toProvider: "provider2"
    });
    expect(hooks.onFinalFailure).toHaveBeenCalledWith({
      to: "fail@example.com",
      attemptedProviders: ["provider1", "provider2"],
    });
  });

  test("should handle provider not found error", async () => {
    await expect(
      retryHandler.sendWithRetry("nonexistent", { to: "test@example.com" })
    ).rejects.toThrow("Provider not found for source: nonexistent");
  });

  test("should handle no providers available error", async () => {
    mockProviderManager.getProviders.mockReturnValue([]);
    
    await expect(
      retryHandler.sendWithRetry("provider1", { to: "test@example.com" })
    ).rejects.toThrow("No providers available");
  });

  test("should not retry on provider error (fatal)", async () => {
    // Provider1 fails with a fatal error (contains "auth")
    providers[0].send = jest.fn().mockRejectedValue(new Error("Authentication failed"));
    
    const hooks = {
      onSendStart: jest.fn(),
      onError: jest.fn(),
      onProviderSwitch: jest.fn(),
      onFinalSuccess: jest.fn(),
    };

    const result = await retryHandler.sendWithRetry(
      "provider1", 
      { to: "test@example.com" }, 
      hooks
    );

    // Should switch to provider2 without retrying provider1
    expect(result.result.messageId).toBe("msg-2");
    expect(result.provider).toBe("provider2");
    expect(providers[0].send).toHaveBeenCalledTimes(1); // No retry
    expect(providers[1].send).toHaveBeenCalledTimes(1);
    expect(hooks.onProviderSwitch).toHaveBeenCalled();
  });
});