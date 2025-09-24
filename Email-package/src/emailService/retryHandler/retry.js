const { logger } = require("../../logger");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class RetryHandler {
  constructor(providerManager, options = {}) {
    this.providerManager = providerManager;
    this.retryDelay = options.retryDelay || 3000;
  }

  // send Method with retry logic
  async sendWithRetry(source, mailOptions, hooks = {}) {
    // Ensure there are providers loaded
    const providers = this.providerManager.getProviders();
    if (!providers.length) throw new Error("No providers available");

    // Get the provider instance for the requested source
    let currentProvider = this.providerManager.getProvider(source);
    if (!currentProvider)
      throw new Error(`Provider not found for source: ${source}`);

    // Track which providers have been attempted
    const triedProviders = new Set();

    // Flag to retry first provider once
    let isFirstProvider = true;

    // Intialising the  monitoring hook
    this._fireHook(hooks, "onSendStart", {
      to: mailOptions.to,
      source: currentProvider.source,
    });

    // while loop till there are providers
    while (currentProvider) {
      triedProviders.add(currentProvider.source);

      try {
        const result = await this._attemptSend(
          currentProvider,
          mailOptions,
          hooks,
          isFirstProvider
        );
        return {
          result,
          provider: currentProvider.source,
        };
      } catch (err) {
        if (hooks.onError)
          hooks.onError({
            to: mailOptions.to,
            provider: currentProvider.source,
            error: err,
          });
        logger.warn(
          `[RetryHandler] Failed attempt via ${currentProvider.source}: ${err.message}`
        );
      }

      // Switch to next provider
      const nextProvider = this._getNextProvider(
        currentProvider,
        providers,
        triedProviders
      );
      if (!nextProvider) break;

      logger.info(
        `[RetryHandler] Switching provider from ${currentProvider.source} to ${nextProvider.source}`
      );

      if (hooks.onProviderSwitch)
        hooks.onProviderSwitch({
          to: mailOptions.to,
          fromProvider: currentProvider.source,
          toProvider: nextProvider.source,
        });

      // Wait before trying the next provider
      await sleep(this.retryDelay);

      // adding the nextprovider into current provider
      currentProvider = nextProvider;
      isFirstProvider = false;
    }

    // when while loop breaks and final failure occured
    if (hooks.onFinalFailure)
      hooks.onFinalFailure({
        to: mailOptions.to,
        attemptedProviders: Array.from(triedProviders),
      });
    throw new Error("All providers failed to send the email");
  }

  //----------------- Helper functions-----------------

  // Handle a single provider attempt, including retry for first provider
  async _attemptSend(provider, mailOptions, hooks, isFirstProvider) {
    try {
      // Attempt to send email via the provider
      const result = await provider.send(mailOptions);

      this._fireFinalSuccess(hooks, mailOptions.to, provider.source, result);
      return result;
    } catch (err) {
      // Retry first provider once again if the error is **not a provider error**
      if (isFirstProvider && !this._isProviderError(err)) {
        // Retry first provider once again
        if (hooks.onRetry)
          hooks.onRetry({
            to: mailOptions.to,
            provider: provider.source,
            attempt: 2,
          });

        logger.info(
          `[RetryHandler] Retrying ${provider.source} after ${this.retryDelay}ms...`
        );

        await sleep(this.retryDelay);

        const retryResult = await provider.send(mailOptions);

        this._fireFinalSuccess(
          hooks,
          mailOptions.to,
          provider.source,
          retryResult
        );
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
