const pool = require("../config/db.config")
const checkIfGroupExists = (chatId) => {
    const sql = `SELECT COUNT(*) AS count FROM group_chats WHERE chat_id = ?`;
    
    return new Promise((resolve, reject) => {
        pool.query(sql, [chatId], (err, results) => {
            if (err) {
                console.error("Error checking group existence:", err);
                reject("Error checking group existence");
            } else {
                // Resolve with a boolean: true if the group exists, false otherwise
                resolve(results[0].count > 0);
            }
        });
    });
};


// add chat to database
const addChatToDatabase = async (chatId) => {
    const sql = `INSERT IGNORE INTO group_chats (chat_id) VALUES (?)`;
    try {
        const result = await pool.query(sql, [chatId]);
        console.log("Chat ID insert result:", result);
        console.log("Chat ID inserted successfully");
    } catch (err) {
        console.error("Error inserting chat ID:", err);
    }
};



module.exports={
    checkIfGroupExists,
    addChatToDatabase
}