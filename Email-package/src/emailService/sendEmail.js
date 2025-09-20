const { ProviderManager } = require("./providerManager");
const templater = require("./templater");
const { RetryHandler } = require("./retry");
const logger = require("../logger");
const emailHooks = require("../hooks/emailHooks")

const providerManager = new ProviderManager();

const retryHandler = new RetryHandler(providerManager, { retryDelay: 3000 });


async function sendEmail({
    to,
    template,
    templateData,
    cc,
    bcc,
    attachments,
    source,
    hooks = emailHooks }) {
  


  //merging the caller hooks & backend hooks
  const allHooks = { ...emailHooks, ...hooks };


  // ensure providers are loaded (with caching)
  if (providerManager.getProviders().length === 0) {
    await providerManager.init();
    logger.info("[sendEmail] Providers loaded from DB");
  }
  

  // Render templates
  const { subject, html, text } = templater.renderTemplate(template, templateData);

  // Mail options
  const mailOptions = {
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      attachments 
    };

    // Trigger onSendStart hook
    if (allHooks.onSendStart) allHooks.onSendStart({ to, source });


    
  // Send via RetryHandler (includes retry + fallback logic)
  return retryHandler.sendWithRetry(source, mailOptions, allHooks);

  }
module.exports = { sendEmail };
