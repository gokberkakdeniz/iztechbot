const { CronJob } = require("cron");
const { getTodaysMenu } = require("./menu");

class MessageService {
    constructor({todaysMenu, logger, database}) {
        this.todaysMenu = todaysMenu;
        this.logger = logger;
        this.database = database;
    }

    setBot(bot) {
        this.bot = bot;
    }

    init() {
        if (this.job) throw new Error("MessageService is already initialized.");

        this.job = new CronJob("0 0 * * 1-5", async () => {
            this.logger.info("Fetching today's menu...")

            const menu = await getTodaysMenu(this.logger);
            for (const key of Reflect.ownKeys(menu)) {
                this.todaysMenu[key] = menu[key];
            }

            // Skip if no food exists or it is holiday.
            const menuNormal = this.todaysMenu.normal.split("\n");
            if (menuNormal.length === 3 || menuNormal[4] === "  `0`") return;
            
            const connection = await this.database.getConnection();
        
            const ids = await connection.query("SELECT chat_id, menu_type FROM `users` WHERE subscription = 'TRUE'");
            ids.forEach((user) => {
                this.bot.telegram.sendMessage(user.chat_id, menu[user.menu_type.toLowerCase()], { parse_mode: "Markdown" });
            });
            
            connection.end();
        })
    }

    start() {
        if (!this.job) throw new Error("MessageService is not initialized.");
        this.job.start();
    }

    stop() {
        if (!this.job) throw new Error("MessageService is not initialized.");
        this.job.stop();
    }

    isRunning() {
        return this.job.running;
    }
}

module.exports = MessageService