const nodemailer = require("nodemailer");
const {logger} =require("../utils/logger");
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
    logger.info(`[SmtpProvider] Initialized provider "${this.source}" with user "${this.user}" and host "${cred.host}"`);
   

  }

  // send mail --> actual send mail which sends the mail 
   async send(mail) {
    logger.info(`[SmtpProvider] Sending email via "${this.source}"`);
    logger.info(`[SmtpProvider] To: ${mail.to}, CC: ${mail.cc || "N/A"}, BCC: ${mail.bcc || "N/A"}, Subject: ${mail.subject}`);

    try {
      const result = await this.transporter.sendMail({
        from: this.user,
        to: mail.to,
        cc: mail.cc,
        bcc: mail.bcc,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        attachments: mail.attachments
      });
      return result;
      

    } catch (err) {
      logger.error(`[SmtpProvider] Sending Email failed via "${this.source}": ${err.message}`);
      throw err;
    }
  }

}
module.exports = { SmtpProvider };
