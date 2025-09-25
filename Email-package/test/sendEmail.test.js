const mockSend = jest.fn().mockResolvedValue({ messageId: 'abc' });

const mockProviderManagerInstance = {
  init: jest.fn().mockResolvedValue(),
  getProviders: jest.fn(() => [{ source: 'mock', send: mockSend }]),
  getProvider: jest.fn(() => ({ source: 'mock', send: mockSend })),
};

jest.mock('../src/emailService/providerManager/providerManager', () => ({
  ProviderManager: jest.fn(() => mockProviderManagerInstance)
}));

jest.mock('../src/emailService/utils/templater', () => ({
  renderTemplate: jest.fn(() => ({ subject: 'Hi', html: '<p>Hello</p>', text: 'Hello' }))
}));

const mockRetryHandler = {
  sendWithRetry: jest.fn().mockResolvedValue({ result: { messageId: 'abc' }, provider: 'mock' })
};

jest.mock('../src/emailService/retryHandler/retry', () => ({
  RetryHandler: jest.fn(() => mockRetryHandler)
}));

jest.mock('../src/emailService/hooks/emailHooks', () => ({
  onSendStart: jest.fn(),
  onFinalSuccess: jest.fn(),
  onError: jest.fn(),
}));

const { sendEmail } = require('../src/emailService/sendEmail/sendEmail');
const templater = require('../src/emailService/utils/templater');
const emailHooks = require('../src/emailService/hooks/emailHooks');

describe('sendEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends email successfully with minimal parameters', async () => {
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

  test('renders template with provided data', async () => {
    await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: { name: 'John' },
      source: 'mock'
    });

    expect(templater.renderTemplate).toHaveBeenCalledWith('welcome', { name: 'John' });
  });

  test('initializes providers before sending', async () => {
    await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    expect(mockProviderManagerInstance.init).toHaveBeenCalled();
  });

  test('merges custom hooks with default hooks', async () => {
    const customHooks = { onCustom: jest.fn() };
    await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock',
      hooks: customHooks
    });

    const hooksUsed = mockRetryHandler.sendWithRetry.mock.calls[0][2];
    expect(hooksUsed).toEqual(expect.objectContaining({ ...emailHooks, ...customHooks }));
  });

  test('passes correct mailOptions to RetryHandler', async () => {
    await sendEmail({
      to: 'integration@example.com',
      template: 'integration',
      templateData: { test: 'data' },
      source: 'mock'
    });

    const mailOptions = mockRetryHandler.sendWithRetry.mock.calls[0][1];
    expect(mailOptions).toEqual(expect.objectContaining({
      to: 'integration@example.com',
      subject: 'Hi',
      html: '<p>Hello</p>',
      text: 'Hello'
    }));
  });

  test('handles missing required parameters gracefully', async () => {
  const result = await sendEmail({ template: 'welcome', templateData: {}, source: 'mock' });
  expect(result.success).toBe(false);
  expect(result.error).toBe('Recipient email address (to) is required');
});


  test('handles empty arrays for cc, bcc, attachments', async () => {
    await sendEmail({
      to: 'test@example.com',
      cc: [],
      bcc: [],
      attachments: [],
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    const mailOptions = mockRetryHandler.sendWithRetry.mock.calls[0][1];
    expect(mailOptions.cc).toEqual([]);
    expect(mailOptions.bcc).toEqual([]);
    expect(mailOptions.attachments).toEqual([]);
  });

  test('handles multiple recipients in to field', async () => {
    await sendEmail({
      to: 'test1@example.com,test2@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    const mailOptions = mockRetryHandler.sendWithRetry.mock.calls[0][1];
    expect(mailOptions.to).toBe('test1@example.com,test2@example.com');
  });
});
