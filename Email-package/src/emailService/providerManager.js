//--------------------Caching & refresh logic----------------------------
// ProviderManager.js

const EmailCredential = require('../../db/Schema/smtpconfigs');
const { SmtpProvider } = require("./providers/smtpProvider");
const { logger } = require("../logger");


class ProviderManager {
  constructor(options = {}) {
    this.providers = [];           // Array of SmtpProvider instances
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000; // 5 minutes default TTL
    this.lastLoaded = 0;           // Timestamp of last provider load
    this.initPromise = null;       // To prevent duplicate init calls in concurrency
  }

  
   //Initialize providers
  async init() {
    const now = Date.now();

    // Return early if cache is still valid
    if (this.providers.length > 0 && (now - this.lastLoaded) < this.cacheTTL) {
      logger.info("[ProviderManager] Using cached providers");
      return;
    }

    // Prevent concurrent init calls from double-loading providers
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

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
    this.providers = creds.map(cred => new SmtpProvider(cred));

    // Update cache timestamp
    this.lastLoaded = Date.now();
    logger.info(`[ProviderManager] Loaded ${this.providers.length} providers from DB`);
  } catch (err) {
    logger.error(`[ProviderManager] Failed to load providers from DB: ${err.message}`);
    throw err;
  }
}


  // Manually refresh providers
  async refreshProviders() {
    this.providers = [];
    this.lastLoaded = 0;
    await this.init();
    logger.info("[ProviderManager] Providers refreshed manually");
  }

  
  // // Register a provider manually (optional)
  // register(provider) {
  //   this.providers.push(provider);
  // }

  // Get all loaded providers 
  getProviders() {
    return this.providers;
  }

  // Get a single provider by source name
  getProvider(source) {
    return this.providers.find(p => p.source === source);
  }

  //Send email via a specific provider
  async send(source, mailOptions) {
    if (this.providers.length === 0) {
      throw new Error("No providers registered");
    }

    const provider = this.getProvider(source);
    if (!provider) {
      throw new Error(`Provider not found for source: ${source}`);
    }

    return provider.send(mailOptions);
  }
}

module.exports = { ProviderManager };
