require("dotenv").config()
const logger = require("./app/logger");
const Database = require("./app/db");
const botInit = require("./app/bot");
const MessageService = require("./app/service");
const { getTodaysMenu } = require("./app/menu");

logger.info("Started!")

const main = async () => {
    logger.info("Connecting to database...");
    const database = new Database(logger);
    await database.init();
    logger.info("Connected to database.");

    logger.info("Fetching today's menu...");
    const todaysMenu = await getTodaysMenu(logger);
    logger.info("Today's menu has been fetched.");

    process.on('SIGINT', () => {
        logger.info('SIGINT signal received, exiting...');
        database.getPool().end();
        process.exit(2);
    });

    logger.info("Message service starting...")
    const job = new MessageService({todaysMenu, logger, database});

    logger.info("Bot launching...")
    const bot = botInit({logger, todaysMenu, database, job, adminChatId: process.env.BOT_ADMIN_CHAT_ID});

    job.setBot(bot);
    job.init();
    job.start();
    logger.info("Message service started.")

    bot.launch();
    logger.info("Bot has ben launched.");
}

main();
