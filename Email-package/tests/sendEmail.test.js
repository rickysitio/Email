const { sendEmail } = require("../src/emailService/sendEmail");
const { MockRetryHandler } = require("./testUtils");

// Mock RetryHandler inside sendEmail
jest.mock("../src/emailService/retry", () => ({
  RetryHandler: require("./testUtils").MockRetryHandler,
}));

describe("sendEmail function", () => {
  it("should return mock messageId", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      template: "welcome",
      templateData: { name: "Ricky" },
      source: "mock",
    });

    expect(result).toEqual({ messageId: "mock-msg-123" });
  });

  it("should handle cc, bcc, and attachments", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      template: "welcome",
      templateData: { name: "Ricky" },
      cc: ["cc@example.com"],
      bcc: ["bcc@example.com"],
      attachments: [{ filename: "file.txt", content: "Hello" }],
      source: "mock",
    });

    expect(result).toHaveProperty("messageId", "mock-msg-123");
  });
});
