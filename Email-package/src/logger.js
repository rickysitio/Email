const { createLogger, format, transports } = require('winston');

// Main logger for general and error logs
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/email-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/email-combined.log' }),
    new transports.File({
      filename: 'logs/email-monitor.log',
      level: 'info',
      format: format.combine(format((info) => (info.label === "MONITORING" ? info : false))())
    })
  ]
});

module.exports = { logger };
