const EmailCredential = require("../../../db/Schema/smtpconfigs");
const { SmtpProvider } = require("../providers/smtpProvider");
const { logger } = require("../utils/logger");

class ProviderManager {
  constructor(options = {}) {
    if (ProviderManager.instance) return ProviderManager.instance;

    // Array of SmtpProvider instances
    this.providers = [];
    // 5 minutes default TTL
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000;
    // Timestamp of last provider load
    this.lastLoaded = 0;
    // To prevent duplicate init calls in concurrency
    this.initPromise = null;
  }

  //Initialize providers method with cache or db call
  async init() {
    const now = Date.now();

    // Return early if cache is still valid
    if (this.providers.length > 0 && now - this.lastLoaded < this.cacheTTL) {
      logger.info("[ProviderManager] Using cached providers");
      return;
    }

    // Prevent concurrent init calls from double-loading providers
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    // loads from db and mark promise null
    this.initPromise = this._loadProvidersFromDB();
    await this.initPromise;
    this.initPromise = null;
  }

  //Internal method to fetch providers from DB
  async _loadProvidersFromDB() {
    try {
      // Fetch all providers from DB
      const creds = await EmailCredential.find();

      // Map each credential to a provider instance
      // in order to get the send method of smtpProvider into the instance of provider
      this.providers = creds.map((cred) => new SmtpProvider(cred));

      // Update cache timestamp
      this.lastLoaded = Date.now();
      logger.info(
        `[ProviderManager] Loaded ${this.providers.length} providers from DB`
      );
    } catch (err) {
      logger.error(
        `[ProviderManager] Failed to load providers from DB: ${err.message}`
      );
      throw err;
    }
  }

  // Get all loaded providers method
  getProviders() {
    return this.providers;
  }

  // Get a single provider method by source name
  getProvider(source) {
    return this.providers.find((p) => p.source === source);
  }

  // Manually refresh providers method --> if within TTL, credentials gets changed
  //then we can use this method in order to forcefully refresh the cache Providers
  //and update them without rerun of the server.(Helper function not using it anywhere currently)
  async refreshProviders() {
    this.providers = [];
    this.lastLoaded = 0;
    await this.init();
    logger.info("[ProviderManager] Providers refreshed manually");
  }
}

module.exports = { ProviderManager };
