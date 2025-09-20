const mongoose = require("mongoose");

const smtpconfigs = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
    },
    host: { 
      type: String,
      required: true 
      },
    port: {
       type: Number,
        required: true 
      },
    secure: {
       type: Boolean,
        required: true 
      },
    user: {
           type: String,
           required: true 
          },
    pass: {
          type: String,
           required: true 
          },
  },
);

module.exports = mongoose.model("smtpconfigs", smtpconfigs);
