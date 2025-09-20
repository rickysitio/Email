const { sendEmail } = require("../../server");

(async () => {
  try {
    await sendEmail({
      to: "rickysahawork@gmail.com",
      template: "welcome",
      templateData: { name: "Ricky" },
      source: "mailgun" 
    });
    console.log(" Email sent successfully!");
  } catch (err) {
    console.error(" Email failed:", err.message);
  }
})();
