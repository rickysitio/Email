const { sendEmail } = require("Email-package");

const parseJSONSafe = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return Array.isArray(value) ? value : [value];
  }
};

const sendMail = async (req, res) => {
  try {
    const { to, template, source } = req.body;

    const templateData = parseJSONSafe(req.body.templateData, {});
    const cc = parseJSONSafe(req.body.cc, []);
    const bcc = parseJSONSafe(req.body.bcc, []);

    const attachments = req.files?.map(file => ({
      filename: file.originalname,
      content: file.buffer
    })) || [];

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
};

module.exports = sendMail;
