require("dotenv").config()
import Markup = require('telegraf/markup')
import moment = require("moment");

import TelegramBot from 'telegraf';
import { Logger } from 'winston';

import { getMenu, Menu } from './Menu'
import Database from './Database';
import MessageService from './MessageService';
import { getLogger } from './Logger'

const helpMessage = `/yardim yardım menüsünü göster.
/menu - Günün menüsünü göster.
/menu <dün|bugün|yarın|13.09.2018> - Belirtilen güne ait yemek menüsünü göster.
/ayarlar - ayarlar menüsünü açar

Not: "yarın" yerine "yarin" gibi kullanımlar seçeneklerde geçerlidir. Örnek: /menu dun`

export default class Bot {
    private bot;
    private logger: Logger;
    private database: Database;
    private todaysMenu: Menu;
    private adminChatId: string | number;
    private messageService: MessageService;
    private launched: boolean;

    constructor(database: Database, todaysMenu: Menu) {
        this.bot = new TelegramBot(process.env.BOT_TOKEN);
        this.database = database;
        this.todaysMenu = todaysMenu;
        this.adminChatId = process.env.BOT_ADMIN_CHAT_ID;
        this.logger = getLogger("bot");
        this.messageService = new MessageService({ todaysMenu, database, bot: this });
        this.init()
        this.launched = false;
    }

    launch() {
        if (this.launched) throw new Error("The bot is already launched!")
        this.messageService.start();
        this.bot.launch();
        this.launched = true;
    }

    private init() {
        this.bot.catch(this.errorHandler.bind(this));
        this.bot.help(this.helpHandler.bind(this));
        this.bot.start(this.startHandler.bind(this));
        this.bot.command("yardim", this.helpHandler.bind(this));
        this.bot.command("ayarlar", this.settingsHandler.bind(this));
        this.bot.command("menu", this.menuHandler.bind(this));
        this.bot.command("admin", this.adminMenuHandler.bind(this));
        this.bot.action(/subscription=(?<answer>TRUE|FALSE)/u, this.subscriptionHandler.bind(this));
        this.bot.action(/menu_type=(?<answer>NORMAL|VEGAN|VEGETARIAN)/u, this.menuTypeHandler.bind(this));
        this.bot.action(/set_subscriptions=(?<answer>DISABLE|START)/u, this.adminSubscriptionStatusHandler.bind(this));
        this.bot.action(/service=(?<answer>STOP|START)/u, this.adminServiceStatusHandler.bind(this));
    }

    sendMessage(chatId: string | number, message: string, config: object) {
        this.bot.telegram.sendMessage(chatId, message, config);
    }

    private async errorHandler(err) {
        if (err.code === 403) { // If user blocked the bot, delete him/her from database.
            const chatId = err.on.payload.chat_id;
            const query = await this.database.deleteUser(chatId);
            if (query.isOk()) {
                this.logger.info(`user (${chatId}) deleted. (reason: bot is blocked).`);
            } else {
                this.logger.error(`could not delete user (${chatId}) (reason: ${query.unwrapErr()}).`);
            }
        } else {
            this.logger.error(err.message);
        }
    }

    private async startHandler(ctx) {
        const helloMessage = `Merhaba ${ctx.chat.first_name}, beni kullanarak istediğin zaman yemekhane menüsünü görebilirsin. Hatta abone olarak istediğin günlük olarak mesaj alabilirsin.`;

        return ctx.reply(helloMessage)
            .then(async () => {
                const chatId = ctx.chat.id;
                const query = await this.database.addUser(chatId);

                if (query.isOk()) {
                    this.logger.info(`user (${chatId}) registered.`);
                } else if (query.unwrapErr() !== "ER_DUP_ENTRY") {
                    this.logger.error(`could not add user (${chatId}) (reason: ${query.unwrapErr()}).`);
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
    }

    private async settingsHandler(ctx) {
        const chatId = ctx.chat.id;
        const query = await this.database.addUser(chatId);

        if (query.isOk()) {
            this.logger.info(`user (${chatId}) registered.`);
        } else if (query.unwrapErr() !== "ER_DUP_ENTRY") {
            this.logger.error(`could not add user (${chatId}) (reason: ${query.unwrapErr()}).`);
            return ctx.reply("Bir şeyler oldu, tekrar deneyiniz.")
        }

        return ctx.reply("Abone olmak ister misin?", Markup.inlineKeyboard([
                Markup.callbackButton("Hayır", "subscription=FALSE"),
                Markup.callbackButton("Evet", "subscription=TRUE")
            ])
            .oneTime().resize().extra())
            .then(() => {
                return ctx.reply("Varsayılan olarak hangi menüyü görmek istersin?", Markup.inlineKeyboard([
                    Markup.callbackButton("Normal", "menu_type=NORMAL"),
                    Markup.callbackButton("Vegan", "menu_type=VEGAN"),
                    Markup.callbackButton("Vejetaryen", "menu_type=VEGETARIAN")
                ]).oneTime().resize().extra());
            });
    }

    private async subscriptionHandler(ctx) {
        const { answer } = ctx.match.groups;

        const chatId = ctx.chat.id;
        const query = await this.database.updateUser(chatId, { subscription: answer });

        if (query.isErr()) {
            this.logger.error(`could not update user (${chatId}) (reason: ${query.unwrapErr()}).`);
            return;
        }

        return ctx.editMessageText("Anlaşıldı!")
            .then(() => ctx.answerCbQuery(answer === "TRUE" ? "Harika!" : "Düzenli olarak mesaj almayacaksın."));
    }

    private async menuTypeHandler(ctx) {
        const { answer } = ctx.match.groups;

        const chatId = ctx.chat.id;
        const query = await this.database.updateUser(chatId, { menu_type: answer });

        if (query.isErr()) {
            this.logger.error(`could not update user (${chatId}) (reason: ${query.unwrapErr()}).`);
        }

        return ctx.editMessageText("Anlaşıldı!");
    }

    private async helpHandler(ctx) {
        ctx.reply(helpMessage)
    }

    private async menuHandler(ctx) {
        const parameter = ctx.update.message.text.split(" ").slice(1)[0] || "";
        const chatId = ctx.chat.id;
        const query = await this.database.getUser(chatId);

        if (query.isErr()) {
            this.logger.error(`could not get user (${chatId}) info (reason: ${query.unwrapErr()}).`);
            return ctx.replyWithMarkdown("Bir hata oluştu, sonra tekrar deneyiniz.");
        }

        const menuType = query.unwrap().menu_type.toLowerCase();

        if (parameter === "" || parameter === "bugün" || parameter === "bugun") {
            return ctx.replyWithMarkdown(this.todaysMenu[menuType]);
        } else {
            let date = parameter, menu = null;
            if (parameter === "dun" || parameter === "dün") {
                date = moment().subtract(1, "days").format("DD.MM.YYYY");
            } else if (parameter === "yarın" || parameter === "yarin") {
                date = moment().add(1, "days").format("DD.MM.YYYY");
            }

            try {
                menu = await getMenu(date, menuType.toLowerCase() || "normal");
                return ctx.replyWithMarkdown(menu);
            } catch (err) {
                if (err.code === "ERR_INVALID_DATE") {
                    return ctx.replyWithMarkdown(err.message);
                }

                this.logger.error(err.message)
                return ctx.replyWithMarkdown("Bir hata oluştu, sonra tekrar deneyiniz.");
            }
        }
        
    }
    
    private async adminMenuHandler(ctx) {
        if (ctx.chat.id == this.adminChatId) {
            try {
                const userCountBySubscription = (await this.database.getUserCountBy("subscription")).unwrap();
                const userCountByMenuType = (await this.database.getUserCountBy("menu_type")).unwrap();

                const activeSubUserCount = userCountBySubscription.TRUE;
                const deactiveSubsUserCound = userCountBySubscription.DISABLED;
                const unsubUserCount = userCountBySubscription.FALSE;
                const subUserCount = activeSubUserCount + deactiveSubsUserCound;
                const totalUserCount = activeSubUserCount + deactiveSubsUserCound + unsubUserCount;
                
                const normalUserCount = userCountByMenuType.NORMAL;
                const veganUserCount = userCountByMenuType.VEGAN;
                const vegetarianUserCount = userCountByMenuType.VEGETARIAN;
                

                const isJobRunning = this.messageService.isRunning();
                const stats = [
                    "```İstatistikler```",
                    `Toplam kullanıcı sayısı: \`${totalUserCount}\``,
                    `Abone kullanıcı sayısı: \`${subUserCount} (aktif: ${activeSubUserCount}, pasif: ${deactiveSubsUserCound})\``,
                    `Abone olmayan kullanıcı sayısı: \`${unsubUserCount}\``,
                    `Normal kullanıcı sayısı: \`${normalUserCount}\``,
                    `Vegan kullanıcı sayısı: \`${veganUserCount}\``,
                    `Vejetaryan kullanıcı sayısı: \`${vegetarianUserCount}\``,
                    `\n\n`,
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
            } catch (e) {
                this.logger.error(e.message);
                return ctx.reply("Bir hata oluştu, sonra tekrar deneyiniz.");
            }
        }
    }

    private async adminSubscriptionStatusHandler(ctx) {
        const { answer } = ctx.match.groups;

        if (answer === "DISABLE") {
            await this.database.query("UPDATE users SET subscription='DISABLED' WHERE subscription='TRUE'", []);
        } else {
            await this.database.query("UPDATE users SET subscription='TRUE' WHERE subscription='DISABLED'", []);
        }

        return ctx.answerCbQuery("Anlaşıldı!");
    }

    private async adminServiceStatusHandler(ctx) {
        const { answer } = ctx.match.groups;

        if (answer === "STOP") {
            this.logger.info("Stopping message service...");
            this.messageService.stop();
            this.logger.info("Message service is " + (this.messageService.isRunning() ? "running." : "stopped."));
        } else {
            this.logger.info("Starting message service...");
            this.messageService.start();
            this.logger.info("Message service is " + (this.messageService.isRunning() ? "running." : "stopped."));
        }
        
        return ctx.editMessageText("Mesaj servisini", Markup.inlineKeyboard([
                Markup.callbackButton(answer === "STOP" ? "Başlat" : "Durdur", "service=" + (answer === "STOP" ? "START" : "STOP"))
            ]).oneTime().resize().extra())
    }
}