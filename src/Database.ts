import { Pool, createPool, createConnection} from 'mariadb';
import { Result, Ok, Err } from './Result';

interface User {
    chat_id: string | number;
    menu_type: "NORMAL" | "VEGAN" | "VEGETARIAN";
    subscription: "TRUE" | "FALSE" | "DISABLED";
}

interface UserSettings {
    menu_type?: "NORMAL" | "VEGAN" | "VEGETARIAN";
    subscription?: "TRUE" | "FALSE" | "DISABLED";
}

interface CountObject {
    FALSE?: number;
    DISABLED?: number;
    TRUE?: number;
    VEGAN?: number;
    VEGETARIAN?: number;
    NORMAL?: number;
}


export default class Database {
    private pool: Pool;

    static async new() : Promise<Result<Database, string>> {
        const config = {
            host: process.env.DB_HOST || "localhost",
            database: process.env.DB_NAME || "iztechbot",
            user: process.env.DB_USER || "iztechbot_admin",
            password: process.env.DB_PASSWORD,
            connectionLimit: Number.parseInt(process.env.DB_CONNECTION_LIMIT || "5")
        }

        // Test config by creating new connection instead of a pool since createPool cannot be caught by try-catch.
        try {
            (await createConnection(config)).end();
        } catch (e) {
            return new Err(`${e.message} [${e.code}]`)
        }

        const db = new Database();
        db.pool = createPool(config);
        return new Ok(db);
    }
    
    private constructor() {
    }
    
    async close() {
        return await this.pool.end();
    }

    async getConnection() {
        return await this.pool.getConnection();
    }

    async query(sql: string, values?: any) : Promise<Result<any, string>> {
        try {
            const result = await this.pool.query(sql, values)
            return new Ok<any, string>(result);
        } catch (e) {
            return new Err<any, string>(e.code || e.message);
        }    
    }

    async deleteUser(chatId: number | string) : Promise<Result<any, string>> {
        return await this.query("DELETE FROM users WHERE chat_id = (?)", [chatId]);
    }

    async addUser(chatId: number | string) : Promise<Result<any, string>> {
        return await this.query("INSERT INTO users (chat_id) VALUES (?)", [chatId]);
    }

    async updateUser(chatId: number | string, newValues: UserSettings) : Promise<Result<any, string>> {
        const names = [];
        if (newValues.subscription) names.push("subscription=(?)");
        if (newValues.menu_type) names.push("menu_type=(?)");

        const values = [];
        if (newValues.subscription !== undefined) values.push(newValues.subscription);
        if (newValues.menu_type !== undefined) values.push(newValues.menu_type);
        values.push(chatId);

        const sql = `UPDATE users SET ${names.join(",")} WHERE chat_id=(?)`;

        return await this.query(sql, values)
    }

    async getUser(chatId: number | string) : Promise<Result<any, string>> {
        const result = await this.query("SELECT chat_id, menu_type FROM users WHERE chat_id = (?)", [chatId]);
        if (result.isOk()) {
            return new Ok<User[], string>(result.unwrap()[0]);
        }
        return result;
    }

    async getUserCountBy(category: "subscription" | "menu_type") : Promise<Result<CountObject, string>> {
        const query = await this.query(`SELECT ${category}, COUNT(*) AS \`count\` FROM users GROUP BY ${category}`);
        if (query.isOk()) {
            const ru = query.unwrap();
            let result: CountObject = {};
            if (category === "subscription") {
                result = {
                    "FALSE": 0,
                    "TRUE": 0,
                    "DISABLED": 0
                };
            } else if (category === "menu_type") {
                result = {
                    "NORMAL": 0,
                    "VEGAN": 0,
                    "VEGETARIAN": 0
                };
            }
            for (const key in ru) {
                if (ru.hasOwnProperty(key) && ru[key].hasOwnProperty("count") && ru[key].hasOwnProperty(category)) {
                    result[ru[key][category]] = ru[key]["count"]
                }
            }
            return new Ok<object, string>(result);
        }
        return query;
    }

    async getSubscribedUsers() {
        const result = await this.query("SELECT chat_id, menu_type FROM `users` WHERE subscription = 'TRUE'");
        if (result.isOk()) {
            return new Ok<User[], string>(result.unwrap());
        }
        return result;
    }
}