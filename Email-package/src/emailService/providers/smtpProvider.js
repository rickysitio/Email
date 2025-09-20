
const nodemailer = require("nodemailer");
const logger =require("../../logger");
class SmtpProvider {
  constructor(cred) {
    this.source = cred.source; 
    this.user = cred.user;

    // creating transporter with TLS and secure options
    this.transporter = nodemailer.createTransport({
      host: cred.host,
      port: Number(cred.port),
      secure: cred.secure === true || cred.secure === 'true',
      auth: {
        user: cred.user,
        pass: cred.pass
      },
       tls: {
        rejectUnauthorized: true,
      }
    });
    logger.info(`[SmtpProviderDetails] Initialized provider "${this.source}" with user "${this.user}" and host "${cred.host}"`);
  }

  async init() {
    try {
      await this.transporter.verify();
      
      logger.info(`[SmtpProvider] Connection verified for "${this.source}"`);
      return true;
    } catch (err) {
      logger.error(`[SmtpProvider] Connection verification failed for "${this.source}": ${err.message}`);
      throw err;
    }
  }

  // send mail 
   async send(mail) {

    logger.info(`[SmtpProviderDetails] Sending email via "${this.source}"`);

    logger.info(`[SmtpProviderDetails] To: ${mail.to}, CC: ${mail.cc || "N/A"}, BCC: ${mail.bcc || "N/A"}, Subject: ${mail.subject}`);

    try {
      const result = await this.transporter.sendMail({
        from: this.user,
        ...mail
      });
    logger.info(`[SmtpProviderDetails] Email sent successfully via "${this.source}"`);
      return result;

    } catch (err) {
      logger.error(`[SmtpProviderDetails] Email failed via "${this.source}": ${err.message}`);
      throw err;
    }
  }

}

module.exports = { SmtpProvider };
