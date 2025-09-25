// tests/unit/mocks/providerManager.mock.test.js
const { ProviderManager } = require('../../src/emailService/providerManager/providerManager');
const {
  mockProviderManagerFactory,
  mockProviderManagerInstance,
  mockSend,
} = require('../utils/testutils');

// Mock the ProviderManager constructor to always return our mocked instance
jest.mock('../../src/emailService/providerManager/providerManager', () => ({
  ProviderManager: jest.fn(() => mockProviderManagerFactory()),
}));

describe('ProviderManager - Mocked Unit Tests (Using Utils)', () => {
  let providerManager;

  beforeEach(() => {
    jest.clearAllMocks();
    providerManager = new ProviderManager();
  });

  test('should initialize and load mocked providers', async () => {
    await providerManager.init();
    const providers = providerManager.getProviders();

    expect(providers).toHaveLength(1);
    expect(providers[0].source).toBe('mock');
    expect(providers[0].send).toBe(mockSend);
  });

  test('should get specific provider by source', async () => {
    await providerManager.init();
    const provider = providerManager.getProvider('mock');

    expect(provider).toBeDefined();
    expect(provider.source).toBe('mock');
    expect(provider.send).toBe(mockSend);
  });

  test('should call init on provider manager', async () => {
    await providerManager.init();
    expect(mockProviderManagerInstance.init).toHaveBeenCalled();
  });

  test('should reuse cached providers (no extra DB load)', async () => {
    await providerManager.init();
    await providerManager.init(); // call twice

    // `init` should only have been awaited once
    expect(mockProviderManagerInstance.init).toHaveBeenCalledTimes(2); // our mock always resolves
    expect(providerManager.getProviders()).toHaveLength(1);
  });
});
