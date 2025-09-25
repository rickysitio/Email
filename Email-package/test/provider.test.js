//-----------------------Mock utilities----------------------------------

// Mock the database schema
jest.mock('../db/Schema/smtpconfigs', () => ({
  find: jest.fn(() => Promise.resolve([
    {
      source: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 'test@gmail.com', pass: 'testpass' }
    },
    {
      source: 'elasticmail',
      host: 'smtp.elasticemail.com',
      port: 2525,
      secure: false,
      auth: { user: 'test@elastic.com', pass: 'testpass' }
    }
  ]))
}));

// Mock the SMTP provider
jest.mock('../src/emailService/providers/smtpProvider', () => ({
  SmtpProvider: jest.fn().mockImplementation((config) => ({
    source: config.source,
    config: config,
    send: jest.fn().mockResolvedValue({ messageId: `mock-${config.source}-${Date.now()}` })
  }))
}));

// Mock the logger
jest.mock('../src/emailService/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));


// ----------Real instance of Provider Manager------
// (for other testing others methods except db calls)

// Import ProviderManager 
const { ProviderManager } = require('../src/emailService/providerManager/providerManager');

describe('ProviderManager', () => {
  let providerManager;

  // Reset mocks and create new instance before each test
  beforeEach(async () => {
    jest.clearAllMocks();
    providerManager = new ProviderManager();
  });


  //-------------------- Tests-----------------------------

  test('should initialize and load providers from database', async () => {
    await providerManager.init();
    const providers = providerManager.getProviders();
    expect(providers).toHaveLength(2);
    expect(providers[0].source).toBe('gmail');
    expect(providers[1].source).toBe('elasticmail');
  });

  test('should use cached providers on subsequent init calls', async () => {
    const EmailCredential = require('../db/Schema/smtpconfigs');

    await providerManager.init();
    await providerManager.init(); // Second call should use cache

    expect(EmailCredential.find).toHaveBeenCalledTimes(1);
  });

  test('should get specific provider by source', async () => {
    await providerManager.init();

    const provider = providerManager.getProvider('gmail');
    expect(provider).toBeDefined();
    expect(provider.source).toBe('gmail');
  });


  // refresh provider method exist in Provider Manager
  //but still it is not called in the actual api logic as it is just as the helper method.
  // can be use in future
  test('should refresh providers manually', async () => {
    const EmailCredential = require('../db/Schema/smtpconfigs');

    await providerManager.init();
    await providerManager.refreshProviders();

    expect(EmailCredential.find).toHaveBeenCalledTimes(2);
  });


  test('should handle database errors gracefully', async () => {
    const EmailCredential = require('../db/Schema/smtpconfigs');
    EmailCredential.find.mockRejectedValueOnce(new Error('DB connection failed'));

    await expect(providerManager.init()).rejects.toThrow('DB connection failed');
  });

  // DB concurrency check for duplicate cache provider
  test('should prevent concurrent initialization', async () => {
    const EmailCredential = require('../db/Schema/smtpconfigs');

    const initPromises = [
      providerManager.init(),
      providerManager.init(),
      providerManager.init()
    ];

    await Promise.all(initPromises);

    expect(EmailCredential.find).toHaveBeenCalledTimes(1); // concurrency safe
  });
});
