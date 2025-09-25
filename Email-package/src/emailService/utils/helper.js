const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function _fireFinalSuccess(hooks, to, provider, result) {
  if (hooks.onFinalSuccess) {
    hooks.onFinalSuccess({
      to,
      provider,
      envelopeTime: result.envelopeTime,
      messageTime: result.messageTime,
    });
  }
}

function _fireHook(hooks, hookName, payload) {
  if (hooks[hookName]) hooks[hookName](payload);
}

function _isProviderError(err) {
  const fatalErrors = ["quota", "limit", "auth", "invalid", "blocked"];
  return fatalErrors.some((kw) => err.message.toLowerCase().includes(kw));
}

function _getNextProvider(currentProvider, providers, triedProviders) {
    return providers.find((p) => !triedProviders.has(p.source)) || null;
  }

module.exports = { _fireFinalSuccess, _fireHook, _isProviderError,_getNextProvider,sleep };
