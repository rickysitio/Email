const { logger } = require("../utils/logger");

const {
  sleep,
  _fireFinalSuccess,
  _fireHook,
  _isProviderError,
  _getNextProvider,
} = require("../utils/helper");

class RetryHandler {
  constructor(providerManager, options = {}) {
    this.providerManager = providerManager;
    this.retryDelay = options.retryDelay || 3000;
  }
  // Handle a single provider attempt, including retry for first provider
  async _attemptSend(provider, mailOptions, hooks, isFirstProvider) {
    try {
      const result = await provider.send(mailOptions);
      _fireFinalSuccess(hooks, mailOptions.to, provider.source, result);
      return result;
    } catch (err) {
      // handle hook + logging
      if (hooks.onError)
        hooks.onError({
          to: mailOptions.to,
          provider: provider.source,
          error: err,
        });
      logger.warn(
        `[RetryHandler] Failed attempt via ${provider.source}: ${err.message}`
      );

      // retry only if first provider and non-fatal error
      if (isFirstProvider && !_isProviderError(err)) {
        if (hooks.onRetry)
          hooks.onRetry({
            to: mailOptions.to,
            provider: provider.source,
            attempt: 2,
          });
        await sleep(this.retryDelay);
        const retryResult = await provider.send(mailOptions);
        _fireFinalSuccess(hooks, mailOptions.to, provider.source, retryResult);
        return retryResult;
      }

      throw err; // otherwise throw
    }
  }
  
  // ----------send Method with retry logic------------------------
  async sendWithRetry(source, mailOptions, hooks = {}) {
    // Ensure there are providers loaded
    const providers = this.providerManager.getProviders();
    if (!providers.length) {
      logger.error(`[No providers available in the memory]`);
      throw new Error("No providers available");
    }

    // Get the provider instance for the requested source
    let currentProvider = this.providerManager.getProvider(source);

    if (!currentProvider) {
      logger.error(
        `[retryHandler] Provider not found fro the specific source:${source}`
      );
      throw new Error(`Provider not found for source: ${source}`);
    }

    // Track which providers have been attempted
    const triedProviders = new Set();

    // Flag to retry first provider once
    let isFirstProvider = true;

    // Intialising the  monitoring hook
    _fireHook(hooks, "onSendStart", {
      to: mailOptions.to,
      source: currentProvider.source,
    });

    // while loop till there are providers
    while (currentProvider) {
      triedProviders.add(currentProvider.source);

      const result = await this._attemptSend(
        currentProvider,
        mailOptions,
        hooks,
        isFirstProvider
      ).catch(() => null);

      if (result) return { result, provider: currentProvider.source };

      const nextProvider = _getNextProvider(
        currentProvider,
        providers,
        triedProviders
      );
      if (!nextProvider) {
        if (hooks.onFinalFailure)
          hooks.onFinalFailure({
            to: mailOptions.to,
            attemptedProviders: Array.from(triedProviders),
          });
        logger.error("[Retry Handler] All providers failed to send the email");
        throw new Error("All providers failed to send the email");
      }

      if (hooks.onProviderSwitch)
        hooks.onProviderSwitch({
          to: mailOptions.to,
          fromProvider: currentProvider.source,
          toProvider: nextProvider.source,
        });

      await sleep(this.retryDelay);
      currentProvider = nextProvider;
      isFirstProvider = false;
    }
  }
}

module.exports = { RetryHandler };
