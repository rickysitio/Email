
//----------via db call ----------

const EmailCredential = require('../../db/Schema/smtpconfigs');
const { SmtpProvider } = require("./providers/smtpProvider"); 

class ProviderManager {
  constructor() {
    this.providers = [];
  }

  // fetch credentials from DB and register providers
  async init() {
    const creds = await EmailCredential.find(); // all provider configs

    creds.forEach(cred => {
      const provider = new SmtpProvider(cred); 
      this.register(provider);
    });
  }

  register(provider) {
    this.providers.push(provider);
  }

  getProviders() {
    return this.providers;
  }

  getProvider(source) {
    return this.providers.find(p => p.source === source);
  }

  async send(source, mailOptions) {
    if (this.providers.length === 0) throw new Error("No providers registered");

    const provider = this.getProvider(source);
    if (!provider) throw new Error(`Provider not found for source: ${source}`);

    return provider.send(mailOptions);
  }
}

module.exports = { ProviderManager };
