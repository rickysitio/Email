// src/utils/validators.js
function validateEmailInput({ to, template, source }) {
  if (!to) throw new Error("Recipient email address (to) is required");
  if (!template) throw new Error("Email template is required");
  if (!source) throw new Error("Email provider source is required");
}

module.exports = { validateEmailInput };
