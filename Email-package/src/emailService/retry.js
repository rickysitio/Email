const { logger } = require("../logger");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class RetryHandler {
  constructor(providerManager, options = {}) {
    this.providerManager = providerManager;
    this.retryDelay = options.retryDelay || 3000;
  }

  async sendWithRetry(source, mailOptions, hooks = {}) {
    const providers = this.providerManager.getProviders();
    if (!providers.length) throw new Error("No providers available");

    let currentProvider = this.providerManager.getProvider(source);
    if (!currentProvider) throw new Error(`Provider not found for source: ${source}`);

    const triedProviders = new Set();
    let isFirstProvider = true;

    this._fireHook(hooks, "onSendStart", { to: mailOptions.to, source: currentProvider.source });

    while (currentProvider) {
      triedProviders.add(currentProvider.source);

      try {
        const result = await this._attemptSend(currentProvider, mailOptions, hooks, isFirstProvider);
        return { result, provider: currentProvider.source };
      } catch (err) {
        if (hooks.onError) hooks.onError({ to: mailOptions.to, provider: currentProvider.source, error: err });
        logger.warn(`[RetryHandler] Failed attempt via ${currentProvider.source}: ${err.message}`);
      }

      // Switch to next provider
      const nextProvider = this._getNextProvider(currentProvider, providers, triedProviders);
      if (!nextProvider) break;

      logger.info(`[RetryHandler] Switching provider from ${currentProvider.source} to ${nextProvider.source}`);
      if (hooks.onProviderSwitch) hooks.onProviderSwitch({ to: mailOptions.to, fromProvider: currentProvider.source, toProvider: nextProvider.source });
      await sleep(this.retryDelay);

      currentProvider = nextProvider;
      isFirstProvider = false;
    }

    if (hooks.onFinalFailure) hooks.onFinalFailure({ to: mailOptions.to, attemptedProviders: Array.from(triedProviders) });
    throw new Error("All providers failed to send the email");
  }


  //----------------- Helper function-----------------
  
  // Handle a single provider attempt, including retry for first provider
  async _attemptSend(provider, mailOptions, hooks, isFirstProvider) {
    try {
      const result = await provider.send(mailOptions);
      this._fireFinalSuccess(hooks, mailOptions.to, provider.source, result);
      return result;
    } catch (err) {
      if (isFirstProvider && !this._isProviderError(err)) {
        // Retry first provider once
        if (hooks.onRetry) hooks.onRetry({ to: mailOptions.to, provider: provider.source, attempt: 2 });
        logger.info(`[RetryHandler] Retrying ${provider.source} after ${this.retryDelay}ms...`);
        await sleep(this.retryDelay);

        const retryResult = await provider.send(mailOptions);
        this._fireFinalSuccess(hooks, mailOptions.to, provider.source, retryResult);
        return retryResult;
      }
      throw err;
    }
  }

  _fireFinalSuccess(hooks, to, provider, result) {
    if (hooks.onFinalSuccess) {
      hooks.onFinalSuccess({
        to,
        provider,
        envelopeTime: result.envelopeTime,
        messageTime: result.messageTime,
      });
    }
  }

  _fireHook(hooks, hookName, payload) {
    if (hooks[hookName]) hooks[hookName](payload);
  }

  _isProviderError(err) {
    const fatalErrors = ["quota", "limit", "auth", "invalid", "blocked"];
    return fatalErrors.some((kw) => err.message.toLowerCase().includes(kw));
  }

  _getNextProvider(currentProvider, providers, triedProviders) {
    return providers.find((p) => !triedProviders.has(p.source)) || null;
  }
}

module.exports = { RetryHandler };
