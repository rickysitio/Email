const { sendEmail } = require("../../server");
// not working currently 
(async () => {
  try {
    await sendEmail({
      to: "rickys@itio.in",
      template: "welcome",
      templateData: { name: "Ricky" },
      source: "outlook" 
    });
    console.log(" Email sent successfully!");
  } catch (err) {
    console.error(" Email failed:", err.message);
  }
})();
