const { logger } = require("../logger");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class RetryHandler {
  constructor(providerManager, options = {}) {
    this.providerManager = providerManager;
    this.retryDelay = options.retryDelay || 3000;
  }

  async sendWithRetry(source, mailOptions, hooks = {}) {
    const providers = this.providerManager.getProviders();
    if (!providers || providers.length === 0) {
      logger.error(`[RetryHandler] No providers available`);
      throw new Error("No providers available");
    }

    let currentProvider = this.providerManager.getProvider(source);
    if (!currentProvider) {
      logger.error(`[RetryHandler] Provider not found for source: ${source}`);
      throw new Error(`Provider not found for source: ${source}`);
    }

    const triedProviders = [];
    let isFirstProvider = true;
    let attemptCount = 1;

    // Fire onSendStart hook (monitoring)
    if (hooks.onSendStart) {
      hooks.onSendStart({ to: mailOptions.to, source: currentProvider.source });
    }

    while (currentProvider) {
      triedProviders.push(currentProvider.source);
      logger.info(`[RetryHandler] Attempting to send email via ${currentProvider.source}`);

      try {
        const result = await currentProvider.send(mailOptions);
        logger.info(`[RetryHandler] Email sent via ${currentProvider.source}`);

        if (attemptCount === 1 && hooks.onSendSuccess) {
          hooks.onSendSuccess({ to: mailOptions.to, source: currentProvider.source });
        }

        if (hooks.onFinalSuccess) {
          hooks.onFinalSuccess({ to: mailOptions.to, provider: currentProvider.source });
        }

        return { result, provider: currentProvider.source };
      } catch (err) {
        logger.warn(`[RetryHandler] Attempt ${attemptCount} failed with ${currentProvider.source}: ${err.message}`);

        if (isFirstProvider) {
          if (this.isProviderError(err)) {
            logger.error(`[RetryHandler] Provider-level error (quota/auth). Switching provider immediately...`);
          } else {
            // Retry same provider once
            if (hooks.onRetry) {
              hooks.onRetry({ to: mailOptions.to, provider: currentProvider.source, attempt: attemptCount + 1 });
            }

            logger.info(`[RetryHandler] Retrying ${currentProvider.source} after ${this.retryDelay}ms...`);
            await sleep(this.retryDelay);

            try {
              const retryResult = await currentProvider.send(mailOptions);
              logger.info(`[RetryHandler] Retry successful via ${currentProvider.source}`);

              if (hooks.onFinalSuccess) {
                hooks.onFinalSuccess({ to: mailOptions.to, provider: currentProvider.source });
              }

              return { result: retryResult, provider: currentProvider.source };
            } catch (retryErr) {
              logger.warn(`[RetryHandler] Retry failed with ${currentProvider.source}: ${retryErr.message}`);
            }
          }

          isFirstProvider = false;
        }
      }

      const nextProvider = this.getNextProvider(currentProvider.source, providers, new Set(triedProviders));
      if (nextProvider) {
        logger.info(`[RetryHandler] Switching provider from ${currentProvider.source} to ${nextProvider.source}`);
        if (hooks.onProviderSwitch) {
          hooks.onProviderSwitch({ to: mailOptions.to, fromProvider: currentProvider.source, toProvider: nextProvider.source });
        }
        await sleep(this.retryDelay);
      }

      currentProvider = nextProvider;
      attemptCount = 1;
    }

    logger.error(`[RetryHandler] All providers failed to send email to ${mailOptions.to}`);
    if (hooks.onFinalFailure) {
      hooks.onFinalFailure({ to: mailOptions.to, attemptedProviders: triedProviders });
    }

    throw new Error("All providers failed to send the email");
  }

  isProviderError(error) {
    const fatalErrors = ["quota", "limit", "auth", "invalid", "blocked"];
    return fatalErrors.some((keyword) => error.message.toLowerCase().includes(keyword));
  }

  getNextProvider(currentSource, providers, triedProviders) {
    const remaining = providers.filter((p) => !triedProviders.has(p.source));
    return remaining.length > 0 ? remaining[0] : null;
  }
}

module.exports = { RetryHandler };
