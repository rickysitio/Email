const { sendEmail } = require("Email-package"); 

const sendMail = async (req, res) => {
 try {
    const { to, template, templateData, cc, bcc, attachments, source } = req.body;

    const result = await sendEmail({
      to,
      template,
      templateData,
      cc,
      bcc,
      attachments,
      source,
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = sendMail;






