const winston = require("winston");

const loggerFormat = winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`);

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.label({ label: "main" }),
        winston.format.timestamp(),
        loggerFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'iztechbot.log',
            timestamp: true,
            colorize: false
        })
    ]
});

module.exports = logger;