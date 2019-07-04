const mariadb = require("mariadb");

class Database {
    constructor(logger) {
        this.initialized = false;
        this.logger = logger;
    }

    async init() {
        try {
            const pool = mariadb.createPool({
                host: process.env.DB_HOST,
                database: "iztechbot",
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                connectionLimit: process.env.DB_CONNECTION_LIMIT
            });
            (await pool.getConnection()).end();
            this.pool = pool;
            this.initialized = true;
        } catch (err) {
            this.logger.error("Could not create database pool: " + err.message);
            this.logger.error("Exiting...");
            process.exit(1);
        }
    }

    getPool() {
        if (!this.initialized) {
            this.logger.error("Database object should be initialized!");
            process.exit(1);
        }

        return this.pool;
    }

    async getConnection() {
        if (!this.initialized) {
            this.logger.error("Database object should be initialized!");
            process.exit(1);
        }

        let connection = null;
        try {
            connection = await this.pool.getConnection();
        } catch (err) {
            this.logger.error(err.message)
            if (connection) connection.end();
        }
        return connection;
    }
}

module.exports = Database;