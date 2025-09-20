const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    // to console the logs
  new transports.Console(),
  
  // to store error logs only
  new transports.File({ filename: 'logs/email-error.log', level: 'error' }),

  // to store all logs
  new transports.File({ filename: 'logs/email-combined.log' }) 
]
});

module.exports = logger;
