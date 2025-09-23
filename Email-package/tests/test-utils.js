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

// Mock ProviderManager
class MockProviderManager {
  getProviders() {
    return [new MockSmtpProvider({ source: "mock" })];
  }

  getProvider(source) {
    return new MockSmtpProvider({ source });
  }

  async init() {
    return true;
  }
}

// Suppress console logs during tests
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

module.exports = {
  MockSmtpProvider,
  MockProviderManager,
};
