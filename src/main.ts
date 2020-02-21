require("dotenv").config()
import Database from './Database';
import { getTodaysMenu } from './Menu';
import { createLogger, getLogger } from './Logger'
import Bot from './Bot';

createLogger(["main", "bot", "service"]);
const logger = getLogger("main");

function die(message: string, code: number, database?: Database) {
    return (val) => {
        logger.error(`${message} (${val})`);
        if (database) database.close();
        process.exit(code);
    }
}

async function main() {
    const database = (await Database.new()).unwrapOrElse(die("could not connect to database", 1));    
    logger.info("connected to database.");

    const todaysMenu = (await getTodaysMenu()).unwrapOrElse(die("could not retrive the menu", 2, database));
    logger.info("the menu is fetched.");

    process.on('SIGINT', die("SIGINT signal received, exiting...", 0, database));
    process.on('SIGTERM', die("SIGTERM signal received, exiting...", 0, database));

    const bot = new Bot(database, todaysMenu);
    bot.launch();
    logger.info("the bot is launched.");
}

main()