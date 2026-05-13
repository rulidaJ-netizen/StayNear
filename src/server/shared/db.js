import mysql from "mysql2";

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

const buildConnectionConfig = () => {
  if (process.env.MYSQL_DATABASE_URL) {
    return parseMysqlUrl(process.env.MYSQL_DATABASE_URL);
  }

  if (/^mysqls?:\/\//i.test(String(process.env.DATABASE_URL || "").trim())) {
    return parseMysqlUrl(process.env.DATABASE_URL);
  }

  return {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "staynear_db2",
    port: Number(process.env.DB_PORT || 3306),
  };
};

const db = mysql.createConnection(buildConnectionConfig());

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

export default db;
export { db };
