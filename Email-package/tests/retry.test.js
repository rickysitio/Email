const { MockRetryHandler } = require("./testUtils");

describe("RetryHandler", () => {
  it("should return mock result from sendWithRetry", async () => {
    const retryHandler = new MockRetryHandler({});
    const res = await retryHandler.sendWithRetry("mock", { to: "a@b.com" });
    expect(res).toEqual({ result: { messageId: "mock-msg-123" }, provider: "mock" });
  });
});
