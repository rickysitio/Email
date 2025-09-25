// tests/integration/providerManager.integration.test.js
jest.mock('../../db/Schema/smtpconfigs', () => ({
  find: jest.fn(() => Promise.resolve([
    { source: 'gmail', host: 'smtp.gmail.com', port: 587, secure: false, user: 'test@gmail.com', pass: 'testpass' },
    { source: 'elasticmail', host: 'smtp.elasticemail.com', port: 2525, secure: false, user: 'test@elastic.com', pass: 'testpass' }
  ]))
}));


const { ProviderManager } = require('../../src/emailService/providerManager/providerManager');

describe('ProviderManager - Integration Tests', () => {
  let providerManager;

  beforeEach(() => {
    jest.clearAllMocks();
    providerManager = new ProviderManager();
  });

  test('should initialize and load providers from database', async () => {
    await providerManager.init();
    const providers = providerManager.getProviders();
    expect(providers).toHaveLength(2);
    expect(providers[0].source).toBe('gmail');
    expect(providers[1].source).toBe('elasticmail');
  });

  test('should use cached providers on subsequent init calls', async () => {
    const EmailCredential = require('../../db/Schema/smtpconfigs');
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

  test('should refresh providers manually', async () => {
    const EmailCredential = require('../../db/Schema/smtpconfigs');
    await providerManager.init();
    await providerManager.refreshProviders();
    expect(EmailCredential.find).toHaveBeenCalledTimes(2);
  });

  test('should handle database errors gracefully', async () => {
    const EmailCredential = require('../../db/Schema/smtpconfigs');
    EmailCredential.find.mockRejectedValueOnce(new Error('DB connection failed'));
    await expect(providerManager.init()).rejects.toThrow('DB connection failed');
  });

  test('should prevent concurrent initialization', async () => {
    const EmailCredential = require('../../db/Schema/smtpconfigs');
    const initPromises = [providerManager.init(), providerManager.init(), providerManager.init()];
    await Promise.all(initPromises);
    expect(EmailCredential.find).toHaveBeenCalledTimes(1);
  });
});
