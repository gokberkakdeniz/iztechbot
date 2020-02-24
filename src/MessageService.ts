import { CronJob } from 'cron';
import { Logger } from 'winston';
import { getLogger } from './Logger';
import { getTodaysMenu, Menu } from './Menu';
import Database from './Database';
import Bot from './Bot';

export default class MessageService {
    private todaysMenu: Menu;
    private logger: Logger;
    private database: Database;
    private bot: Bot;
    private job: CronJob;

    constructor({ todaysMenu, database, bot }) {
        this.todaysMenu = todaysMenu;
        this.logger = getLogger("service");
        this.database = database;
        this.bot = bot;
        
        this.init();
    }

    private init() {
        this.job = new CronJob("0 0 * * 1-5", async () => {
            // try {
                const menu = (await getTodaysMenu()).unwrap();
                this.logger.info("the menu fetched.");

                for (const key of Reflect.ownKeys(menu)) {
                    this.todaysMenu[key] = menu[key];
                }

                // Skip if no food exists or it is holiday.
                const menuNormal = this.todaysMenu.normal.split("\n");
                if (menuNormal.length === 3 || menuNormal[4] === "  `0`") return;
                        
                const ids = (await this.database.getSubscribedUsers()).unwrap();

                ids.forEach((user) => {
                    this.bot.sendMessage(user.chat_id, menu[user.menu_type.toLowerCase()], { parse_mode: "Markdown" });
                });
            // } catch(e) {
            //     this.logger.error(e);
            // }
        })
    }

    start() {
        this.job.start();
        this.logger.info("service started.");
    }

    stop() {
        this.job.stop();
        this.logger.info("service stopped.");
    }

    isRunning() {
        return this.job.running;
    }
}