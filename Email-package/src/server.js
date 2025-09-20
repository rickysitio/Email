// Load environment variables first
require("dotenv").config();

const connectDB = require("../db/mongoConnection");
const { sendEmail } = require("./emailService/sendEmail");
const logger = require("./logger");

// Export sendEmail for external usage
module.exports = { sendEmail };

(async () => {
  try {
    await connectDB();
    logger.info("Server ready, DB connected");
  } catch (err) {
    logger.error("Failed to connect to DB:", err.message);
    process.exit(1);
  }
})();
