const emailHooks = {
  onSendStart: ({ to, source }) => {
    console.log(`[MONITORING HOOK] Sending email to ${to} via ${source}...`);
  },

  onSendSuccess: ({ to, source }) => {
    console.log(`[MONITORING HOOK] First attempt success for ${to} via ${source}`);
  },

  onRetry: ({ to, provider, attempt }) => {
    console.log(`[MONITORING HOOK] Retry attempt ${attempt} for ${to} via ${provider}`);
  },

  onProviderSwitch: ({ to, fromProvider, toProvider }) => {
    console.log(`[MONITORING HOOK] Switching provider from ${fromProvider} to ${toProvider} for ${to}`);
  },

  onFinalSuccess: ({ to, provider }) => {
    console.log(`[MONITORING HOOK] Email sent successfully to ${to} via ${provider}`);
  },

  onFinalFailure: ({ to, attemptedProviders }) => {
    console.log(`[MONITORING HOOK] Failed to send email to ${to}. Attempted providers: ${attemptedProviders.join(", ")}`);
  }
};

module.exports = emailHooks;
