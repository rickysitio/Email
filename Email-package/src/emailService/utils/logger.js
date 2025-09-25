// const { createLogger, format, transports } = require('winston');

// // Main logger for general and error logs
// const logger = createLogger({
//   level: 'info',
//   format: format.combine(
//     format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
//   ),
//   transports: [
//     new transports.Console(),
//     new transports.File({ filename: 'logs/email-error.log', level: 'error' }),
//     new transports.File({ filename: 'logs/email-combined.log' }),
//     new transports.File({
//       filename: 'logs/email-monitor.log',
//       level: 'info',
//       format: format.combine(format((info) => (info.label === "MONITORING" ? info : false))())
//     })
//   ]
// });

// module.exports = { logger };

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

// Set logs directory to the root logs folder (outside Email-package)
const logDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Main logger for general and error logs
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    // Logs to console
    new transports.Console(),
    
    // Error logs
    new transports.File({ filename: path.join(logDir, 'email-error.log'), level: 'error' }),
    
    // Combined logs
    new transports.File({ filename: path.join(logDir, 'email-combined.log') }),
    
    // Monitoring logs (filtered by label)
    new transports.File({
      filename: path.join(logDir, 'email-monitor.log'),
      level: 'info',
      format: format.combine(
        format((info) => (info.label === "MONITORING" ? info : false))()
      )
    })
  ]
});

module.exports = { logger };
