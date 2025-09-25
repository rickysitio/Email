const { ProviderManager } = require("../providerManager/providerManager");
const {renderTemplate} = require("./templater");
const { RetryHandler } = require("../retryHandler/retry");
const { logger } = require("../../logger");
const emailHooks = require("../../hooks/emailHooks");

// Create instances that can be properly mocked in tests 
// --> such that we need not to initalize them while testing
let providerManager;
let retryHandler;

//---------- helper method-------
// Initialize instances of provider Manager and passing it to the retryHandler instance
function initializeInstances() {
  if (!providerManager) {
    providerManager = new ProviderManager();
    retryHandler = new RetryHandler(providerManager, { retryDelay: 3000 });
  }
}

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
  // Input validations
  if (!to) {
    throw new Error("Recipient email address (to) is required");
  }
  if (!template) {
    throw new Error("Email template is required");
  }
  if (!source) {
    throw new Error("Email provider source is required");
  }

  // Initialize instances of retry handler and providerManager 
  initializeInstances();

  // Merge default hooks with caller hooks (caller hooks override defaults)
  const allHooks = { ...emailHooks, ...hooks };

  // Ensure providers are loaded (this handles TTL internally)
  try {
    await providerManager.init();
    if (allHooks.onProvidersLoaded) allHooks.onProvidersLoaded({ source });
    logger.info(`[SendEmail function] Provider are loaded`);
  } catch (err) {
    logger.error(
      `[sendEmail function] Failed to load providers: ${err.message}`
    );
    throw err;
  }

  // Render email template
  let renderedTemplate;
  try {
    renderedTemplate = renderTemplate(template, templateData || {});
    //logger.info(`[sendEmail function] Template rendering successfull ${renderedTemplate}`)
  } catch (err) {
    logger.error(
      `[sendEmail function] Template rendering failed: ${err.message}`
    );
    throw err;
  }

  const { subject, html, text } = renderedTemplate;
  logger.info(
    `[sendEmail function] Template rendered for ${to} using template "${template}"`
  );

  // Mail options
  const mailOptions = { to, cc, bcc, subject, html, text, attachments };
  logger.info(`[sendEmail function] Mail options prepared for ${to}`);

  // Send via RetryHandler
  try {
    const { result, provider: actualProvider } =
      await retryHandler.sendWithRetry(source, mailOptions, allHooks);
    logger.info(
      `[sendEmail function] sendEmail completed successfully for ${to} via ${actualProvider}`
    );
    logger.info(
      `[sendEmail function] Email send response: ${JSON.stringify(
        result,
        null,
        2
      )}`
    );

    return { success: true, result };
  } catch (err) {
    logger.error(
      `[sendEmail function] sendEmail failed for ${to} via ${source}: ${err.message}`
    );
    throw err;
  }
}

// Export function to reset instances (useful for testing)
function resetInstances() {
  providerManager = null;
  retryHandler = null;
}

module.exports = { sendEmail, resetInstances };
