import mysql from "mysql2";

const createMissingMysqlError = () =>
  new Error(
    "MySQL is not configured for this deployment. This route still needs to be migrated to Prisma/Supabase."
  );

const parseMysqlUrl = (value) => {
  const databaseUrl = new URL(value);

  return {
    host: databaseUrl.hostname,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace(/^\//, ""),
    port: Number(databaseUrl.port || 3306),
  };
};

const createUnavailableDb = () => {
  const rejectOrCallback = (callback) => {
    const error = createMissingMysqlError();

    if (typeof callback === "function") {
      callback(error);
      return;
    }

    throw error;
  };

  return {
    query(_sql, _params, callback) {
      if (typeof _params === "function") {
        rejectOrCallback(_params);
        return;
      }

      rejectOrCallback(callback);
    },
    beginTransaction(callback) {
      rejectOrCallback(callback);
    },
    commit(callback) {
      rejectOrCallback(callback);
    },
    rollback(callback) {
      rejectOrCallback(callback);
    },
    end(callback) {
      if (typeof callback === "function") {
        callback(null);
      }
    },
    promise() {
      const error = createMissingMysqlError();

      return {
        query: async () => Promise.reject(error),
        beginTransaction: async () => Promise.reject(error),
        commit: async () => Promise.reject(error),
        rollback: async () => Promise.reject(error),
      };
    },
  };
};

const buildConnectionConfig = () => {
  const configuredDatabaseUrl = String(process.env.DATABASE_URL || "").trim();

  if (process.env.MYSQL_DATABASE_URL) {
    return parseMysqlUrl(process.env.MYSQL_DATABASE_URL);
  }

  if (/^mysqls?:\/\//i.test(configuredDatabaseUrl)) {
    return parseMysqlUrl(configuredDatabaseUrl);
  }

  if (/^postgres(ql)?:\/\//i.test(configuredDatabaseUrl)) {
    return null;
  }

  if (
    process.env.DB_HOST ||
    process.env.DB_USER ||
    process.env.DB_PASSWORD ||
    process.env.DB_NAME ||
    process.env.DB_PORT
  ) {
    return {
      host: process.env.DB_HOST || "127.0.0.1",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "staynear_db",
      port: Number(process.env.DB_PORT || 3306),
    };
  }

  return null;
};

const mysqlConfig = buildConnectionConfig();
const db = mysqlConfig
  ? mysql.createConnection(mysqlConfig)
  : createUnavailableDb();

if (mysqlConfig) {
  db.connect((err) => {
    if (err) {
      console.error("Database connection failed:", err);
    } else {
      console.log("Connected to MySQL");
    }
  });
}

export default db;
export { db };
export const isMysqlConfigured = Boolean(mysqlConfig);
