const Telegraf = require("telegraf");
const Markup = require("telegraf/markup");
const moment = require("moment");
const { getMenu } = require("./menu");

const helpMessage = `/yardim yardım menüsünü göster.
/menu - Günün menüsünü göster.
/menu <dün|bugün|yarın|13.09.2018> - Belirtilen güne ait yemek menüsünü göster.
/ayarlar - ayarlar menüsünü açar

Not: "yarın" yerine "yarin" gibi kullanımlar seçeneklerde geçerlidir. Örnek: /menu dun`

module.exports = ({logger, todaysMenu, database, adminChatId, job}) => {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    bot.catch(async (err) => {
        if (err.code === 403) { //If user blocked the bot, delete him/her from database.
            const connection = await database.getConnection();
            const chatId = err.on.payload.chat_id;
            await connection.query("DELETE FROM `users` WHERE chat_id = (?)", [chatId]);
            logger.error(`${chatId} is deleted from database (Bot is blocked).`);
        } else {
            logger.error(err.message);
        }
    });

    bot.start((ctx) => {
        const helloMessage = `Merhaba ${ctx.chat.first_name}, beni kullanarak istediğin zaman yemekhane menüsünü görebilirsin. Hatta abone olarak istediğin günlük olarak mesaj alabilirsin.`;

        return ctx.reply(helloMessage)
            .then(async () => {
                try {
                    const connection = await database.getConnection();
                    await connection.query('INSERT INTO users (chat_id) VALUES (?)', [ctx.chat.id]);
                    connection.end();
                } catch (err) {
                    if (err.code !== "ER_DUP_ENTRY") throw err;
                }

                return ctx.reply("Abone olmak ister misin?", Markup.inlineKeyboard([
                    Markup.callbackButton("Hayır", "subscription=FALSE"),
                    Markup.callbackButton("Evet", "subscription=TRUE")
                ]).oneTime().resize().extra());
            })
            .then(() => {
                return ctx.reply("Varsayılan olarak hangi menüyü görmek istersin?", Markup.inlineKeyboard([
                    Markup.callbackButton("Normal", "menu_type=NORMAL"),
                    Markup.callbackButton("Vegan", "menu_type=VEGAN"),
                    Markup.callbackButton("Vejetaryen", "menu_type=VEGETARIAN")
                ]).oneTime().resize().extra());
            });
    });

    bot.command("ayarlar", async (ctx) => {
        try {
            const connection = await database.getConnection();
            await connection.query('INSERT INTO users (chat_id) VALUES (?)', [ctx.chat.id]);
            connection.end();
        } catch (err) {
            if (err.code !== "ER_DUP_ENTRY") throw err;
        }

        return ctx.reply("Abone olmak ister misin?", Markup.inlineKeyboard([
                Markup.callbackButton("Hayır", "subscription=FALSE"),
                Markup.callbackButton("Evet", "subscription=TRUE")
            ]).oneTime().resize().extra())
            .then(() => {
                return ctx.reply("Varsayılan olarak hangi menüyü görmek istersin?", Markup.inlineKeyboard([
                    Markup.callbackButton("Normal", "menu_type=NORMAL"),
                    Markup.callbackButton("Vegan", "menu_type=VEGAN"),
                    Markup.callbackButton("Vejetaryen", "menu_type=VEGETARIAN")
                ]).oneTime().resize().extra());
            });
    });

    bot.action(/subscription=(?<answer>TRUE|FALSE)/u, async (ctx) => {
        const {
            answer
        } = ctx.match.groups;

        const connection = await database.getConnection();
        await connection.query('UPDATE users SET subscription=(?) WHERE chat_id=(?)', [
            answer,
            ctx.chat.id
        ]);
        connection.end();

        return ctx.editMessageText("Anlaşıldı!")
            .then(() => ctx.answerCbQuery(answer === "TRUE" ? "Harika!" : "Düzenli olarak mesaj almayacaksın."));
    });

    bot.action(/menu_type=(?<answer>NORMAL|VEGAN|VEGETARIAN)/u, async (ctx) => {
        const { answer } = ctx.match.groups;

        const connection = await database.getConnection();
        await connection.query('UPDATE users SET menu_type=(?) WHERE chat_id=(?)', [
            answer,
            ctx.chat.id
        ]);
        connection.end();

        return ctx.editMessageText("Anlaşıldı!");
    });

    bot.help((ctx) => {
        ctx.reply(helpMessage)
    });

    bot.command("yardim", (ctx) => {
        ctx.reply(helpMessage)
    });

    bot.command("menu", async (ctx) => {
        const parameter = ctx.update.message.text.split(" ").slice(1)[0] || "";

        let menus = {};
        if (parameter === "" || parameter === "bugün" || parameter === "bugun") {
            menus = todaysMenu;
        } else {
            if (parameter === "dun" || parameter === "dün") {
                menus.date = moment().subtract(1, "days").format("DD.MM.YYYY");
            } else if (parameter === "yarın" || parameter === "yarin") {
                menus.date = moment().add(1, "days").format("DD.MM.YYYY");
            } else {
                menus.date = parameter
            }

            try {
                menus.normal = await getMenu(menus.date, "normal", logger);
                menus.vegan = await getMenu(menus.date, "vegan", logger);
                menus.vegetarian = await getMenu(menus.date, "vegetarian", logger);
            } catch (err) {
                return ctx.replyWithMarkdown(err.code === "ERR_INVALID_DATE" ? err.message : "Bir şeyler oldu, bilemiyorum...");
            }
        }
        const connection = await database.getConnection();
        const result = await connection.query("SELECT menu_type FROM users WHERE chat_id = (?)", [ctx.chat.id]);
        const menuType = result[0].menu_type.toLowerCase();
        return ctx.replyWithMarkdown(menus[menuType]);
    });

    bot.command("admin", async (ctx) => {
        if (ctx.chat.id == adminChatId) {
            const connection = await database.getConnection();
            const totalUserCount = (await connection.query("SELECT COUNT(*) FROM `users` WHERE 1"))[0]["COUNT(*)"]
            const subUserCount = (await connection.query("SELECT COUNT(*) FROM `users` WHERE subscription = 'TRUE'"))[0]["COUNT(*)"]
            const unsubUserCount = (await connection.query("SELECT COUNT(*) FROM `users` WHERE subscription = 'FALSE'"))[0]["COUNT(*)"]
            const disabledSubUserCount = totalUserCount - subUserCount - unsubUserCount;
            const isJobRunning = job.isRunning();
            const stats = [
                "```İstatistikler```",
                `Toplam kullanıcı sayısı: \`${totalUserCount}\``,
                `Abone kullanıcı sayısı: \`${subUserCount}\``,
                `Abone olmayan kullanıcı sayısı: \`${unsubUserCount}\``,
                `Aboneliği devre dışı bırakılmış kullanıcı sayısı: \`${disabledSubUserCount}\``,
                `\`\`\`Durum\`\`\``,
                `Mesaj servisi: ${isJobRunning ? "açık" : "kapalı"}`
            ];

            return ctx.replyWithMarkdown(stats.join("\n"))
                .then(() => {
                    return ctx.reply("Mesaj servisini", Markup.inlineKeyboard([
                        Markup.callbackButton(isJobRunning ? "Durdur" : "Başlat", "service=" + (isJobRunning ? "STOP" : "START"))
                    ]).oneTime().resize().extra())
                })
                .then(() => {
                    return ctx.reply("Tüm abonelikleri", Markup.inlineKeyboard([
                        Markup.callbackButton("Dondur", "set_subscriptions=DISABLE"),
                        Markup.callbackButton("Tekrar başlat", "set_subscriptions=START")                        
                    ]).oneTime().resize().extra())
                });
        }
    });

    bot.action(/set_subscriptions=(?<answer>DISABLE|START)/u, async (ctx) => {
        const { answer } = ctx.match.groups;

        const connection = await database.getConnection();
        if (answer === "DISABLE") {
            await connection.query("UPDATE users SET subscription='DISABLED' WHERE subscription='TRUE'", []);
        } else {
            await connection.query("UPDATE users SET subscription='TRUE' WHERE subscription='DISABLED'", []);
        }
        connection.end();

        return ctx.answerCbQuery("Anlaşıldı!");
    });

    bot.action(/service=(?<answer>STOP|START)/u, async (ctx) => {
        const { answer } = ctx.match.groups;

        if (answer === "STOP") {
            logger.info("Stopping message service...");
            job.stop();
            logger.info("Message service is " + (job.isRunning() ? "running." : "stopped."));
        } else {
            logger.info("Starting message service...");
            job.start();
            logger.info("Message service is " + (job.isRunning() ? "running." : "stopped."));
        }
        
        return ctx.editMessageText("Mesaj servisini", Markup.inlineKeyboard([
                Markup.callbackButton(answer === "STOP" ? "Başlat" : "Durdur", "service=" + (answer === "STOP" ? "START" : "STOP"))
            ]).oneTime().resize().extra())
    });

    return bot;
}