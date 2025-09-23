// tests/sendEmail.test.js

// Mock send function for providers
const mockSend = jest.fn().mockResolvedValue({ messageId: 'abc' });

// Mock ProviderManager class
jest.mock('../src/emailService/providerManager', () => {
  return {
    ProviderManager: jest.fn().mockImplementation(() => ({
      init: jest.fn().mockResolvedValue(),
      getProviders: jest.fn(() => [{ source: 'mock', send: mockSend }]),
      getProvider: jest.fn(() => ({ source: 'mock', send: mockSend })),
    }))
  };
});

// Mock the template renderer
jest.mock('../src/emailService/templater', () => ({
  renderTemplate: jest.fn(() => ({ subject: 'Hi', html: '<p>Hello</p>', text: 'Hello' }))
}));

// Now import sendEmail AFTER mocks
const { sendEmail } = require('../src/emailService/sendEmail');

describe('sendEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear call history for mocks
  });

  test('should send email successfully', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      template: 'welcome',
      templateData: {},
      source: 'mock'
    });

    expect(result.success).toBe(true);
    expect(result.result.messageId).toBe('abc');
    expect(mockSend).toHaveBeenCalledTimes(1); // Ensure provider send is called
  });
});
