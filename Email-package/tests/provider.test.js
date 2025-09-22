const { MockSmtpProvider } = require("./testUtils");

describe("SmtpProvider", () => {
  it("should send email and return mock response", async () => {
    const provider = new MockSmtpProvider({ source: "mock" });
    await provider.init();
    const result = await provider.send({ to: "a@b.com", subject: "Hello" });
    expect(result).toEqual({
      messageId: "mock-msg-123",
      to: "a@b.com",
      subject: "Hello",
      provider: "mock",
    });
  });
});
