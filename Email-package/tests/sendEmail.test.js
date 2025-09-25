// Mock send function for providers
const mockSend = jest.fn().mockResolvedValue({ messageId: 'abc' });

// Create a mock instance that we can reference directly
const mockProviderManagerInstance = {
  init: jest.fn().mockResolvedValue(),
  getProviders: jest.fn(() => [{ source: 'mock', send: mockSend }]),
  getProvider: jest.fn(() => ({ source: 'mock', send: mockSend })),
};

// Mock ProviderManager class to return our mock instance
jest.mock('../src/emailService/providerManager/providerManager', () => {
  return {
    ProviderManager: jest.fn().mockImplementation(() => mockProviderManagerInstance)
  };
});

// Mock the template renderer
jest.mock('../src/emailService/sendEmail/templater', () => ({
  renderTemplate: jest.fn(() => ({ subject: 'Hi', html: '<p>Hello</p>', text: 'Hello' }))
}));

// Mock RetryHandler
const mockRetryHandler = {
  sendWithRetry: jest.fn().mockResolvedValue({
    result: { messageId: 'abc' },
    provider: 'mock'
  })
};

jest.mock('../src/emailService/retryHandler/retry', () => ({
  RetryHandler: jest.fn().mockImplementation(() => mockRetryHandler)
}));

// Mock default email hooks
jest.mock('../src/hooks/emailHooks', () => ({
  onSendStart: jest.fn(),
  onFinalSuccess: jest.fn(),
  onError: jest.fn(),
}));

// Now import sendEmail AFTER mocks
const { sendEmail } = require('../src/emailService/sendEmail/sendEmail');
const templater = require('../src/emailService/sendEmail/templater');
const emailHooks = require('../src/hooks/emailHooks');

describe('sendEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear call history for mocks
  });

  //-------------------- Basic Success Tests ---------------------------------
  
  test('should send email successfully with minimal parameters', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    expect(result.success).toBe(true);
    expect(result.result.messageId).toBe('abc');
    expect(mockRetryHandler.sendWithRetry).toHaveBeenCalledTimes(1);
  });

  test('should send email with all optional parameters', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      attachments: [{ filename: 'test.pdf', content: 'base64content' }],
      template: 'welcome',
      templateData: { name: 'John' },
      source: 'mock'
    });

    expect(result.success).toBe(true);
    expect(result.result.messageId).toBe('abc');
    
    // Verify mailOptions were passed correctly to RetryHandler
    const callArgs = mockRetryHandler.sendWithRetry.mock.calls[0];
    const mailOptions = callArgs[1];
    
    expect(mailOptions).toEqual({
      to: 'test@example.com',
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      subject: 'Hi',
      html: '<p>Hello</p>',
      text: 'Hello',
      attachments: [{ filename: 'test.pdf', content: 'base64content' }]
    });
  });

  //-------------------- Template Rendering Tests ---------------------------------

  test('should render template with provided data', async () => {
    await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: { name: 'John', email: 'john@example.com' },
      source: 'mock'
    });

    expect(templater.renderTemplate).toHaveBeenCalledWith(
      'welcome', 
      { name: 'John', email: 'john@example.com' }
    );
  });

  test('should handle template rendering with empty data', async () => {
    await sendEmail({
      to: 'test@example.com',
      template: 'simple',
      templateData: {},
      source: 'mock'
    });

    expect(templater.renderTemplate).toHaveBeenCalledWith('simple', {});
  });

  //-------------------- Provider Management Tests ---------------------------------

  test('should initialize providers before sending', async () => {
    await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    expect(mockProviderManagerInstance.init).toHaveBeenCalledTimes(1);
  });

  test('should handle provider initialization failure', async () => {
    mockProviderManagerInstance.init.mockRejectedValueOnce(new Error('Provider init failed'));

    await expect(
      sendEmail({
        to: 'test@example.com',
        template: 'welcome',
        templateData: {},
        source: 'mock'
      })
    ).rejects.toThrow('Provider init failed');
  });

  //-------------------- Hooks Tests ---------------------------------

  test('should use default hooks when no custom hooks provided', async () => {
    await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    // Verify that RetryHandler was called with merged hooks
    const callArgs = mockRetryHandler.sendWithRetry.mock.calls[0];
    const hooksUsed = callArgs[2];
    
    expect(hooksUsed).toEqual(expect.objectContaining(emailHooks));
  });

  test('should merge custom hooks with default hooks', async () => {
    const customHooks = {
      onSendStart: jest.fn(),
      onCustomEvent: jest.fn()
    };

    await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock',
      hooks: customHooks
    });

    const callArgs = mockRetryHandler.sendWithRetry.mock.calls[0];
    const hooksUsed = callArgs[2];
    
    // Should contain both default and custom hooks
    expect(hooksUsed).toEqual(expect.objectContaining({
      ...emailHooks,
      ...customHooks
    }));
  });

  test('should call onProvidersLoaded hook if provided', async () => {
    const customHooks = {
      onProvidersLoaded: jest.fn()
    };

    await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock',
      hooks: customHooks
    });

    expect(customHooks.onProvidersLoaded).toHaveBeenCalledWith({ source: 'mock' });
  });

  //-------------------- Error Handling Tests ---------------------------------

  test('should handle RetryHandler sending failure', async () => {
    mockRetryHandler.sendWithRetry.mockRejectedValueOnce(new Error('All providers failed'));

    await expect(
      sendEmail({
        to: 'test@example.com',
        template: 'welcome',
        templateData: {},
        source: 'mock'
      })
    ).rejects.toThrow('All providers failed');
  });

  test('should handle template rendering failure', async () => {
    templater.renderTemplate.mockImplementationOnce(() => {
      throw new Error('Template not found');
    });

    await expect(
      sendEmail({
        to: 'test@example.com',
        template: 'nonexistent',
        templateData: {},
        source: 'mock'
      })
    ).rejects.toThrow('Template not found');
  });

  //-------------------- Parameter Validation Tests ---------------------------------

  test('should handle missing required parameters gracefully', async () => {
    await expect(
      sendEmail({
        // Missing 'to' parameter
        template: 'welcome',
        templateData: {},
        source: 'mock'
      })
    ).rejects.toThrow('Recipient email address (to) is required');
  });

  //-------------------- Integration Tests ---------------------------------

  test('should pass correct parameters to RetryHandler.sendWithRetry', async () => {
    await sendEmail({
      to: 'integration@example.com',
      template: 'integration',
      templateData: { test: 'data' },
      source: 'testProvider'
    });

    expect(mockRetryHandler.sendWithRetry).toHaveBeenCalledWith(
      'testProvider',
      expect.objectContaining({
        to: 'integration@example.com',
        subject: 'Hi',
        html: '<p>Hello</p>',
        text: 'Hello'
      }),
      expect.any(Object) // hooks
    );
  });

  test('should return success response with correct structure', async () => {
    mockRetryHandler.sendWithRetry.mockResolvedValueOnce({
      result: { 
        messageId: 'test-123',
        envelopeTime: 100,
        messageTime: 200
      },
      provider: 'gmail'
    });

    const result = await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'gmail'
    });

    expect(result).toEqual({
      success: true,
      result: {
        messageId: 'test-123',
        envelopeTime: 100,
        messageTime: 200
      }
    });
  });

  //-------------------- Edge Cases Tests ---------------------------------

  test('should handle empty arrays for cc, bcc, attachments', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      cc: [],
      bcc: [],
      attachments: [],
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    expect(result.success).toBe(true);
    
    const callArgs = mockRetryHandler.sendWithRetry.mock.calls[0];
    const mailOptions = callArgs[1];
    
    expect(mailOptions.cc).toEqual([]);
    expect(mailOptions.bcc).toEqual([]);
    expect(mailOptions.attachments).toEqual([]);
  });

  test('should handle multiple recipients in to field', async () => {
    await sendEmail({
      to: 'test1@example.com,test2@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    const callArgs = mockRetryHandler.sendWithRetry.mock.calls[0];
    const mailOptions = callArgs[1];
    
    expect(mailOptions.to).toBe('test1@example.com,test2@example.com');
  });
});