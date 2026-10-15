import { Pool } from "pg";

export const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "auth_db",
    password: "singhdatabase",
    port: 5432,  //postgreSQL default network port 
});