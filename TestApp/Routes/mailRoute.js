const express = require("express");
const multer = require("multer");
const sendMail = require("../controllers/sendEmail");

const upload = multer(); // memory storage by default
const MailRouter = express.Router();

MailRouter.post("/send",
    upload.array("attachments"), // multiple files from form-data
    sendMail
);

module.exports = MailRouter;
