import mysql from "mysql2/promise";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "prod"){
  dotenv.config({ path: ".env.prod" });
} else {
  dotenv.config({ path: ".env.dev" });
}

const config = {
  port: process.env.PORT || 3001,
  api_key: process.env.API_KEY,
  jwtSecret: process.env.JWT_SECRET,
  db : mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || "insitel1234",
    database: process.env.DB_NAME || "intranet_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
} 


export {config};