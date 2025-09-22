// tests/test-utils.js
const { RetryHandler } = require("../src/emailService/retry");

// Mock SmtpProvider
class MockSmtpProvider {
  constructor(cred) {
    this.source = cred.source || "mock";
  }

  async init() {
    return true; // always succeed
  }

  async send(mail) {
    return {
      messageId: "mock-msg-123",
      to: mail.to,
      subject: mail.subject,
      provider: this.source,
    };
  }
}

// Mock RetryHandler
class MockRetryHandler extends RetryHandler {
  async sendWithRetry(source, mailOptions) {
    return { result: { messageId: "mock-msg-123" }, provider: source || "mock" };
  }
}

// Mock ProviderManager
class MockProviderManager {
  getProviders() {
    return [new MockSmtpProvider({ source: "mock" })];
  }

  getProvider(source) {
    return new MockSmtpProvider({ source });
  }
}

// Suppress console logs during tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks(); // restores all mocks safely
});

module.exports = {
  MockSmtpProvider,
  MockRetryHandler,
  MockProviderManager,
};
