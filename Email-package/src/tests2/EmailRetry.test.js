const { sendEmail } = require("../server");

(async () => {
  try {
    await sendEmail({
      to: "rickys@itio.in",
      template: "welcome",
      templateData: { name: "Ricky" },
      source: "gmail" 
    });
    console.log(" Email sent successfully!");
  } catch (err) {
    console.error(" Email failed:", err.message);
  }
})();
