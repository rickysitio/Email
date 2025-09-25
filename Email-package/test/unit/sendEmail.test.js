// tests/unit/sendEmail.test.js
const {
  mockTemplateRender,
  mockRetryHandler,
  mockProviderManagerInstance,
  mockProviderManagerFactory,
  emailHooks,
} = require("../utils/testutils");

// ---------- Mock modules ----------
jest.mock(
  "../../src/emailService/providerManager/providerManager",
  () => ({
    ProviderManager: jest.fn(() => mockProviderManagerFactory()),
  })
);

jest.mock("../../src/emailService/utils/templater", () => ({
  renderTemplate: mockTemplateRender,
}));

jest.mock("../../src/emailService/retryHandler/retry", () => ({
  RetryHandler: jest.fn(() => mockRetryHandler), // use mockRetryHandler
}));

// Use actual emailHooks for default hooks
jest.mock(
  "../../src/emailService/hooks/emailHooks",
  () => jest.requireActual("../../src/emailService/hooks/emailHooks")
);

// ---------- Import module under test ----------
const { sendEmail, resetInstances } = require("../../src/emailService/sendEmail/sendEmail");

describe("sendEmail - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetInstances(); // reset providerManager and retryHandler singletons
  });

  test("sends email successfully with minimal parameters", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      template: "welcome",
      templateData: {},
      source: "mock",
    });

    expect(result.success).toBe(true);
    expect(result.result.messageId).toBe("abc");
    expect(mockRetryHandler.sendWithRetry).toHaveBeenCalledTimes(1);
  });

  test("renders template with provided data", async () => {
    await sendEmail({
      to: "test@example.com",
      template: "welcome",
      templateData: { name: "John" },
      source: "mock",
    });

    expect(mockTemplateRender).toHaveBeenCalledWith("welcome", { name: "John" });
  });

  test("initializes providers before sending", async () => {
    await sendEmail({
      to: "test@example.com",
      template: "welcome",
      templateData: {},
      source: "mock",
    });

    expect(mockProviderManagerInstance.init).toHaveBeenCalled();
  });

  test("merges custom hooks with default hooks", async () => {
    const customHooks = { onCustom: jest.fn() };

    await sendEmail({
      to: "test@example.com",
      template: "welcome",
      templateData: {},
      source: "mock",
      hooks: customHooks,
    });

    const hooksUsed = mockRetryHandler.sendWithRetry.mock.calls[0][2];

    expect(hooksUsed).toMatchObject({
      onError: expect.any(Function),
      onFinalFailure: expect.any(Function),
      onFinalSuccess: expect.any(Function),
      onProviderSwitch: expect.any(Function),
      onRetry: expect.any(Function),
      onSendStart: expect.any(Function),
      ...customHooks, // include custom hooks
    });
  });

  test("passes correct mailOptions to RetryHandler", async () => {
    await sendEmail({
      to: "integration@example.com",
      template: "integration",
      templateData: { test: "data" },
      source: "mock",
    });

    const mailOptions = mockRetryHandler.sendWithRetry.mock.calls[0][1];
    expect(mailOptions).toEqual(
      expect.objectContaining({
        to: "integration@example.com",
        subject: "Hi",
        html: "<p>Hello</p>",
        text: "Hello",
      })
    );
  });

  test("handles missing required parameters gracefully", async () => {
    const result = await sendEmail({
      template: "welcome",
      templateData: {},
      source: "mock",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Recipient email address (to) is required");
  });

  test("handles empty arrays for cc, bcc, attachments", async () => {
    await sendEmail({
      to: "test@example.com",
      cc: [],
      bcc: [],
      attachments: [],
      template: "welcome",
      templateData: {},
      source: "mock",
    });

    const mailOptions = mockRetryHandler.sendWithRetry.mock.calls[0][1];
    expect(mailOptions.cc).toEqual([]);
    expect(mailOptions.bcc).toEqual([]);
    expect(mailOptions.attachments).toEqual([]);
  });

  test("handles multiple recipients in to field", async () => {
    await sendEmail({
      to: ["test1@example.com", "test2@example.com"],
      template: "welcome",
      templateData: {},
      source: "mock",
    });

    const mailOptions = mockRetryHandler.sendWithRetry.mock.calls[0][1];
    expect(mailOptions.to).toEqual(["test1@example.com", "test2@example.com"]);
  });
});


