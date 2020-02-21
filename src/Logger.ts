import winston = require('winston');

const loggerFormat = winston.format.printf(({ label, level, message, timestamp }) => `[${label}] ${timestamp} ${level}: ${message}`);

function createLogger(names: string[]) {
    names.forEach((name) => {
        winston.loggers.add(name, {
            format: winston.format.combine(
                winston.format.label({ label: name }),
                winston.format.timestamp(),
                loggerFormat
            ),
            transports: [
                new winston.transports.Console()
            ]
        });
    })
}

const getLogger = (name: string) => winston.loggers.get(name);

export {
    createLogger,
    getLogger
}