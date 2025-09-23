const { logger } = require("../logger");

const emailHooks = {
  onSendStart: ({ to, source }) => {
    logger.info(`[MONITORING] Sending email to ${to} via ${source}...`, {
      label: "MONITORING",
    });
  },

  onError: ({ to, provider, error }) => {
    logger.error(
      `[MONITORING] Error sending email to ${to} via ${provider}: ${error.message}`,
      { label: "MONITORING" }
    );
  },

  onSendSuccess: ({ to, source }) => {
    logger.info(`[MONITORING] First attempt success for ${to} via ${source}`, {
      label: "MONITORING",
    });
  },

  onRetry: ({ to, provider, attempt }) => {
    logger.warn(
      `[MONITORING] Retry attempt ${attempt} for ${to} via ${provider}`,
      { label: "MONITORING" }
    );
  },

  onProviderSwitch: ({ to, fromProvider, toProvider }) => {
    logger.warn(
      `[MONITORING] Switching provider from ${fromProvider} to ${toProvider} for ${to}`,
      { label: "MONITORING" }
    );
  },

  onFinalSuccess: ({ to, provider, durationMs, envelopeTime, messageTime }) => {
  logger.info(
    `[MONITORING] Email sent successfully to ${to} via ${provider}| Envelope Time: ${envelopeTime}ms | Message Time: ${messageTime}ms`,
    { label: "MONITORING" }
  );
},

  onFinalFailure: ({ to, attemptedProviders }) => {
    logger.error(
      `[MONITORING] Failed to send email to ${to}. Attempted providers: ${attemptedProviders.join(
        ", "
      )}`,
      { label: "MONITORING" }
    );
  },
};

module.exports = emailHooks;
