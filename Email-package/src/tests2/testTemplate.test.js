// src/testTemplate.js
const { renderTemplate } = require("../emailService/templater");

const output = renderTemplate("welcome", { name: "Ricky" });

console.log("Subject:", output.subject);
console.log("HTML:", output.html);
console.log("Text:", output.text);
