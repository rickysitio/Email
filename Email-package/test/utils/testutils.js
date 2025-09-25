// const jestMock = require('jest-mock');

// // ---------- Template Utils ----------
// const mockTemplateRender = jest.fn(() => ({
//   subject: 'Hi',
//   html: '<p>Hello</p>',
//   text: 'Hello',
// }));

// // ---------- Hooks Utils ----------
// const emailHooks = {
//   onSendStart: jest.fn(),
//   onFinalSuccess: jest.fn(),
//   onError: jest.fn(),
//   onRetry: jest.fn(),
//   onProviderSwitch: jest.fn(),
//   onFinalFailure: jest.fn(),
//   onSuccess: jest.fn(),
//   onProvidersLoaded: jest.fn(),
// };

// // ---------- Retry Handler Mock ----------
// const mockRetryHandler = {
//   sendWithRetry: jest.fn(async (source, mailOptions, hooks) => {
//   return { 
//     result: { messageId: "abc" }, // wrapped in 'result' to match sendEmail
//     provider: "mock"
//   };
// }),

// };





// // ---------- SmtpProvider Mock ----------
// const mockSend = jest.fn().mockResolvedValue({ messageId: 'abc' });

// const mockSmtpProvider = jest.fn().mockImplementation(() => ({
//   source: 'mock',
//   user: 'test@gmail.com',
//   send: mockSend,
// }));

// // ---------- Provider Manager Mock ----------
// const mockProviderManagerInstance = {
//   init: jest.fn().mockResolvedValue(),
//   getProviders: jest.fn(() => [{ source: 'mock', send: mockSend }]),
//   getProvider: jest.fn(() => ({ source: 'mock', send: mockSend })),
// };

// const mockProviderManagerFactory = jest.fn(() => mockProviderManagerInstance);

// // ---------- sendEmail Mock ----------
// const mockSendEmail = jest.fn().mockResolvedValue({
//   success: true,
//   result: { messageId: 'abc' },
// });

// // ---------- Helper Functions Mock ----------
// const mockHelperFunctions = {
//   _fireFinalSuccess: jest.fn(),
//   _fireHook: jest.fn(),
//   _isProviderError: jest.fn(() => false),
//   _getNextProvider: jest.fn((current, providers, tried) =>
//     providers.find((p) => !tried.has(p.source)) || null
//   ),
//   sleep: jest.fn(() => Promise.resolve()),
// };

// module.exports = {
//   mockTemplateRender,
//   emailHooks,
//   mockRetryHandler,
//   mockSend,
//   mockSmtpProvider,
//   mockProviderManagerInstance,
//   mockProviderManagerFactory,
//   mockSendEmail,
//   mockHelperFunctions,
// };

const jestMock = require('jest-mock');

// ---------- Template Utils ----------
const mockTemplateRender = jest.fn(() => ({
  subject: 'Hi',
  html: '<p>Hello</p>',
  text: 'Hello',
}));

// ---------- Hooks Utils ----------
const emailHooks = {
  onSendStart: jest.fn(),
  onFinalSuccess: jest.fn(),
  onError: jest.fn(),
  onRetry: jest.fn(),
  onProviderSwitch: jest.fn(),
  onFinalFailure: jest.fn(),
  onSuccess: jest.fn(),
  onProvidersLoaded: jest.fn(),
};

// ---------- Retry Handler Mock ----------
const mockRetryHandler = {
  sendWithRetry: jest.fn(async (source, mailOptions, hooks) => ({
    result: { messageId: 'abc' }, // wrapped in 'result'
    provider: 'mock',
  })),
};

// simulate failure
const mockRetryHandlerFailure = {
  sendWithRetry: jest.fn(async () => ({
    success: false,
    error: 'All providers failed',
  })),
};

// ---------- SmtpProvider Mock ----------
const mockSend = jest.fn().mockResolvedValue({ messageId: 'abc' });

const mockSmtpProvider = jest.fn().mockImplementation(() => ({
  source: 'mock',
  user: 'test@gmail.com',
  send: mockSend,
}));

// ---------- Provider Manager Mock ----------
const mockProviderManagerInstance = {
  init: jest.fn().mockResolvedValue(),
  getProviders: jest.fn(() => [{ source: 'mock', send: mockSend }]),
  getProvider: jest.fn(() => ({ source: 'mock', send: mockSend })),
};

const mockProviderManagerFactory = jest.fn(() => mockProviderManagerInstance);

// ---------- sendEmail Mock ----------
const mockSendEmail = jest.fn().mockResolvedValue({
  success: true,
  result: { messageId: 'abc' },
});

// ---------- Helper Functions Mock ----------
const mockHelperFunctions = {
  _fireFinalSuccess: jest.fn(),
  _fireHook: jest.fn(),
  _isProviderError: jest.fn(() => false),
  _getNextProvider: jest.fn((current, providers, tried) =>
    providers.find((p) => !tried.has(p.source)) || null
  ),
  sleep: jest.fn(() => Promise.resolve()),
};

module.exports = {
  mockTemplateRender,
  emailHooks,
  mockRetryHandler,
  mockRetryHandlerFailure,
  mockSend,
  mockSmtpProvider,
  mockProviderManagerInstance,
  mockProviderManagerFactory,
  mockSendEmail,
  mockHelperFunctions,
};
