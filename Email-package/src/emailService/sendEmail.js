const { ProviderManager } = require("./providerManager");
const templater = require("./templater");
const { RetryHandler } = require("./retry");
const { logger } = require("../logger");
const emailHooks = require("../hooks/emailHooks");

const providerManager = new ProviderManager();
const retryHandler = new RetryHandler(providerManager, { retryDelay: 3000 });

async function sendEmail({
  to,
  template,
  templateData,
  cc = [],
  bcc = [],
  attachments = [],
  source,
  hooks = emailHooks
}) {
  // Merge default hooks & caller hooks
  const allHooks = { ...emailHooks, ...hooks };

  // Ensure providers are loaded
  if (providerManager.getProviders().length === 0) {
    try {
      await providerManager.init();
      logger.info(`[sendEmail function] Providers loaded from DB`);
      if (allHooks.onProvidersLoaded) allHooks.onProvidersLoaded({ source });
    } catch (err) {
      logger.error(`[sendEmail function] Failed to load providers: ${err.message}`);
      throw err;
    }
  }

  // Render email template
  const { subject, html, text } = templater.renderTemplate(template, templateData);
  logger.info(`[sendEmail function] Template rendered for ${to} using template "${template}"`);

  // Mail options
  const mailOptions = { to, cc, bcc, subject, html, text, attachments };
  logger.info(`[sendEmail function] Mail options prepared for ${to}`);

  // // Trigger onSendStart hook
  // if (allHooks.onSendStart) {
  //   allHooks.onSendStart({ to, source });
  //   logger.info(`[sendEmail function]  Sending ${to} via ${source}....`);
  // }

  // Send via RetryHandler
  try {
    const { result, provider: actualProvider } = await retryHandler.sendWithRetry(
      source,
      mailOptions,
      allHooks
    );
    logger.info(`[sendEmail function] sendEmail completed successfully for ${to} via ${actualProvider}`);
    return result;
  } catch (err) {
    logger.error(`[sendEmail function] sendEmail failed for ${to} via ${source}: ${err.message}`);
    throw err;
  }
}

module.exports = { sendEmail };
