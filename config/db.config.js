const mysql = require("mysql")
require("dotenv").config();
const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    database: process.env.DB,
    password: process.env.PASSWORD,
    connectionLimit: 10
});

pool.getConnection((err)=>{
    if(err){
        console.log(err);
        console.log("db connection error");
        return
    }
    console.log("db connected sucessfully");
})
let group_chats  = `CREATE TABLE IF NOT EXISTS group_chats(
    id INT AUTO_INCREMENT,
    chat_id BIGINT,
    prefered_language VARCHAR(255) DEFAULT english, 
    PRIMARY KEY (id),
    UNIQUE KEY (chat_id)
)`;
pool.query(group_chats,(err,results)=>{
    if(err){
        console.log("ERROR IN CREATING GROUP CHAT TABLE");
        return 
    }
    console.log("group chat table sucessfully created");
})

module.exports = pool;