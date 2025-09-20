const logger = require("../logger")

// helper function for 3sec wait 
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class RetryHandler {
  constructor(providerManager, options = {}) {
    this.providerManager = providerManager;
    this.retryDelay = options.retryDelay || 3000; // 3s default
  }

  async sendWithRetry(source, mailOptions, hooks = {}) {
    const providers = this.providerManager.getProviders();
    if (!providers || providers.length === 0) {
      throw new Error("No providers available");
    }

    // Start with requested provider
    let currentProvider = this.providerManager.getProvider(source);
    if (!currentProvider) {
      throw new Error(`Provider not found for source: ${source}`);
    }

    const triedProviders = new Set();
    let isFirstProvider = true;
    let attemptCount = 1;

    while (currentProvider) {
      triedProviders.add(currentProvider.source);

    // Trigger onSendStart for first attempt of provider
    if (attemptCount === 1 && hooks.onSendStart) {
        hooks.onSendStart({ to: mailOptions.to, source: currentProvider.source });
    }

      try {
        const result = await currentProvider.send(mailOptions);

        // Fire first attempt success
        if (attemptCount === 1 && hooks.onSendSuccess) {
          hooks.onSendSuccess({ to: mailOptions.to, source: currentProvider.source });
        }

        // Fire final success
        if (hooks.onFinalSuccess) {
          hooks.onFinalSuccess({ to: mailOptions.to, provider: currentProvider.source });
        }

        return result;

      } catch (err) {
        logger.warn(`[RetryHandler] Attempt failed with ${currentProvider.source}: ${err.message}`);

        if (isFirstProvider) {

          // --- Special handling for the desired source ---
          if (this.isProviderError(err)) {
            logger.error(`[RetryHandler] Provider-level error (quota/auth). Moving immediately to next provider...`);
          } else {
            logger.info(`[RetryHandler] Retrying same provider "${currentProvider.source}" after ${this.retryDelay}ms...`);

            await sleep(this.retryDelay);

            try {
              const retryResult = await currentProvider.send(mailOptions);

              if (hooks.onFinalSuccess) {
                hooks.onFinalSuccess({ to: mailOptions.to, provider: currentProvider.source });
              }

              return retryResult;

            } catch (retryErr) {
              logger.warn(`[RetryHandler] Retry also failed with ${currentProvider.source}: ${retryErr.message}`);
            }
          }
          isFirstProvider = false; 
          // from now on, no retries with the same provider
        }
      }

  // Move to next provider
      const nextProvider = this.getNextProvider(currentProvider.source, providers, triedProviders);

      if (nextProvider) {
        logger.info(`[RetryHandler] Switching to next provider: ${nextProvider.source} in ${this.retryDelay}ms`);

        if (hooks.onProviderSwitch) {
          hooks.onProviderSwitch({
            to: mailOptions.to,
            fromProvider: currentProvider.source,
            toProvider: nextProvider.source
          });
        }

        await sleep(this.retryDelay);
      }
      currentProvider = nextProvider;
      attemptCount = 1; 
      // reset attempt count for new provider
    }

    // All providers failed
    if (hooks.onFinalFailure) {
      hooks.onFinalFailure({ to: mailOptions.to, attemptedProviders: Array.from(triedProviders) });
    }
    logger.error("[RetryHandler] All providers failed to send the email");
    throw new Error("All providers failed to send the email");
  }

  // Classify provider-level fatal errors
  isProviderError(error) {
    const fatalErrors = ["quota", "limit", "auth", "invalid", "blocked"];
    return fatalErrors.some(keyword =>
      error.message.toLowerCase().includes(keyword)
    );
  }

  getNextProvider(currentSource, providers, triedProviders) {
    const remaining = providers.filter(p => !triedProviders.has(p.source));
    return remaining.length > 0 ? remaining[0] : null;
  }
}

module.exports = { RetryHandler };
