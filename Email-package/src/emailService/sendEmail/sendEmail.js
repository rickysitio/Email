const { ProviderManager } = require("../providerManager/providerManager");
const { renderTemplate } = require("../utils/templater");
const { RetryHandler } = require("../retryHandler/retry");
const { logger } = require("../utils/logger");
const emailHooks = require("../hooks/emailHooks");
const { validateEmailInput } = require("../utils/validator");
const { _fireHook } = require("../utils/helper")

// Create instances that can be properly mocked in tests
let providerManager;
let retryHandler;

//---------- helper fucntion-------
// Initialize instances of providerManager and passing it to retryHandler
function initializeInstances() {
  if (!providerManager) {
    providerManager = new ProviderManager();
    retryHandler = new RetryHandler(providerManager, { retryDelay: 3000 });
  }
}
//function to reset instances (useful for testing)
function resetInstances() {
  providerManager = null;
  retryHandler = null;
}

//--------- SendEmail Function---------
async function sendEmail({
  to,
  template,
  templateData,
  cc = [],
  bcc = [],
  attachments = [],
  source,
  hooks = {},
}) {
  try {
    // Input validations
    validateEmailInput({ to, template, source });

    // Initialize instances
    initializeInstances();

    // Merge default hooks with caller hooks
    const allHooks = { ...emailHooks, ...hooks };

    // Load providers
    await providerManager.init();
    _fireHook(allHooks, "onProvidersLoaded", { source });
    logger.info(`[sendEmail] Providers are loaded`);

    // Render email template
    const renderedTemplate = renderTemplate(template, templateData || {});
    const { subject, html, text } = renderedTemplate;
    logger.info(
      `[sendEmail] Template rendered for ${to} using template "${template}"`
    );

    // Prepare mail options
    const mailOptions = { to, cc, bcc, subject, html, text, attachments };
    logger.info(`[sendEmail] Mail options prepared for ${to}`);

    // Send email via RetryHandler
    const { result, provider: actualProvider } =
      await retryHandler.sendWithRetry(source, mailOptions, allHooks);
    logger.info(
      `[sendEmail] Email sent successfully for ${to} via ${actualProvider}`
    );
    logger.info(
      `[sendEmail] Email send response: ${JSON.stringify(result, null, 2)}`
    );

     _fireHook(allHooks, "onSuccess", {
      to,
      result,
      provider: actualProvider,
    });

    return { success: true, result };
  } catch (err) {
    logger.error(
      `[sendEmail] Failed for ${to || "unknown recipient"} via ${
        source || "unknown source"
      }: ${err.message}`
    );
     _fireHook({ ...emailHooks, ...hooks }, "onError", {
      to,
      error: err,
      provider: source,
    });
    return { success: false, error: err.message };
  }
}

module.exports = { sendEmail, resetInstances };
