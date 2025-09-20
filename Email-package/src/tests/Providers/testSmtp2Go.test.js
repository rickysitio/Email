const { sendEmail } = require("../../server");
// not working currently 
(async () => {
  try {
    await sendEmail({
      to: "rickysahawork@gmail.com",
      template: "welcome",
      templateData: { name: "Ricky" },
      source: "smtp2go" 
    });
    console.log(" Email sent successfully!");
  } catch (err) {
    console.error(" Email failed:", err.message);
  }
})();
