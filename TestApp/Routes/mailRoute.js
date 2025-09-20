const express = require("express");
const sendMail = require("../controllers/sendEmail");

const MailRouter = express.Router();

MailRouter.post("/send",
    sendMail
)
module.exports = MailRouter;
