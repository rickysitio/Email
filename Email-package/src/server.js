// Load environment variables first
require("dotenv").config();

const connectDB = require("../db/mongoConnection");
const { sendEmail } = require("./emailService/sendEmail/sendEmail");
const {logger} = require("./emailService/utils/logger");

// Export sendEmail for external usage
module.exports = { sendEmail };

(async () => {
  try {
    await connectDB();
    logger.info("[Email-Package Server] Server ready, DB connected");
  } catch (err) {
    logger.error("[Email-Package Server] Failed to connect to DB:", err.message);
    process.exit(1);
  }
})();
