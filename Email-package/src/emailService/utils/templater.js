// src/emailService/templater.js
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

function renderTemplate(templateName, data = {}) {

 const templatesDir = path.join(__dirname, "..", "templates");
  console.log("templatesDir -->", templatesDir);


  // subject template load
  const subjectPath = path.join(templatesDir,`subject.hbs`);
  console.log(subjectPath)

  const subjectTemplate = fs.existsSync(subjectPath)
    ? fs.readFileSync(subjectPath, "utf-8")
    : "";
    //console.log(subjectTemplate);
    
  // body template load
  const bodyPath = path.join(templatesDir, `${templateName}.hbs`);
  const bodyTemplate = fs.existsSync(bodyPath)
    ? fs.readFileSync(bodyPath, "utf-8")
    : "";

  // compile with handlebars--. in order to parse thml data into strings/Text 
  const compiledSubject = Handlebars.compile(subjectTemplate);
  const compiledBody = Handlebars.compile(bodyTemplate);

  // returning the template data  as object 
  return {
    subject: compiledSubject(data),
    html: compiledBody(data),
    text: compiledBody(data).replace(/<[^>]*>/g, ""), // fallback plain text
  };
}

module.exports = { renderTemplate };
