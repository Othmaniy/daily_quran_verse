const pool = require("../config/db.config");
const { isUserAdmin } = require("./permissions");
const { getListOfTranslations } = require("./translation");

const addChatToDatabase = async (chatId) => {
    const sql = `INSERT IGNORE INTO group_chats (chat_id) VALUES (?)`;
    try {
        await pool.query(sql, [chatId]);
        console.log("Chat ID inserted successfully");
    } catch (err) {
        console.error("Error inserting chat ID:", err);
    }
};
const checkIfGroupExists = (chatId) => {
    const sql = `SELECT COUNT(*) AS count FROM group_chats WHERE chat_id = ?`;
    return new Promise((resolve, reject) => {
        pool.query(sql, [chatId], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results[0].count > 0);
            }
        });
    });
};

const updateTranslation = async (chatId, preferredLanguage, languageCode) => {
    const sql = `UPDATE group_chats SET prefered_language = ?, language_code = ? WHERE chat_id = ?`;
    return new Promise((resolve, reject) => {
        pool.query(sql, [preferredLanguage, languageCode, chatId], (err) => {
            if (err) reject(err);
            else resolve("Successfully updated preferred language");
        });
    });
};


const handleBotAddedToGroup = (bot, pool) => {
    bot.on("my_chat_member", async (msg) => {
        console.log(msg);
        const chatId = msg.chat.id;

        // Check if the bot was added to a group
        if (msg.new_chat_member.status === "member") {
            console.log(`Bot added to a new group: ${chatId}`);

            try {
                // Insert or update the group in the database
                await pool.query(
                    "INSERT INTO group_chats (chat_id, language_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE chat_id = chat_id",
                    [chatId, "en"] // Default language set to 'en'
                );

                await bot.sendMessage(chatId, "Hello everyone! I'm here to send daily Quran verses. Use /setTranslation to set your preferred language.");
            } catch (err) {
                console.error("Error registering new group:", err);
            }
        }
    });
};


const userSteps = {}; // Tracks user steps during translation setup

const handleTranslationSetup = (bot, pool) => {
    bot.on("message", async (msg) => {
        console.log(msg);
        const chatId = msg.chat.id;
        const messageText = msg.text;
        const userId = msg.from.id;

        // Handle commands
        if (messageText?.startsWith("/")) {
            const command = messageText.slice(1);

            // /getId command
            if (command === "getId") {
                bot.sendMessage(chatId, `Your group chat ID is ${chatId}`);
            } 
            
            // /setTranslation command
            else if (command === "setTranslation") {
                // Check if the message is from a group and the user is an admin
                if (msg.chat.type === "supergroup" || msg.chat.type === "group") {
                    const isAdmin = await isUserAdmin(bot, chatId, userId);
                    console.log("isadmin "+ isAdmin);
                    if (!isAdmin) {
                        bot.sendMessage(chatId, "You must be an admin to set translations for this group.");
                        return;
                    }
                }

                // Proceed with translation setup
                const translations = await getListOfTranslations();

                const translationOptions = translations.map((translation) => [
                    {
                        text: `${translation.language_name}, ${translation.translated_name.name}`,
                        callback_data: `${translation.id}|${translation.language_name}`,
                    },
                ]);

                bot.sendMessage(chatId, "Please select your preferred translation:", {
                    reply_markup: { inline_keyboard: translationOptions },
                });

                userSteps[chatId] = "selecting_language";
            }
        }

        // Handle group chat ID message after language selection
        if (userSteps[chatId]?.step === "waiting_for_group_id" && messageText && !isNaN(messageText)) {
            const groupChatId = messageText;
            const selectedLanguage = userSteps[chatId].language;
            const languageCode = userSteps[chatId].languageCode;

            const groupExists = await checkIfGroupExists(groupChatId, pool);

            if (groupExists) {
                await updateTranslation(groupChatId, selectedLanguage, languageCode, pool);

                bot.sendMessage(
                    chatId,
                    `Your language (${selectedLanguage}) and group chat ID (${groupChatId}) have been set successfully.`
                );
            } else {
                bot.sendMessage(chatId, "There is no group with the provided group ID.");
            }

            delete userSteps[chatId]; // Reset user step
        }
    });

    // Handle language selection from callback query
    bot.on("callback_query", async (callbackQuery) => {
        const callbackData = callbackQuery.data;
        const [languageCode, languageName] = callbackData.split("|");
        const callbackChatId = callbackQuery.message.chat.id;

        if (userSteps[callbackChatId] === "selecting_language") {
            userSteps[callbackChatId] = {
                step: "waiting_for_group_id",
                language: languageName,
                languageCode: languageCode,
            };

            bot.sendMessage(
                callbackChatId,
                `You selected ${languageName}. Please provide the group chat ID. You can find it by sending /getId to your group.`
            );
        }
    });
};



module.exports = { addChatToDatabase, checkIfGroupExists, updateTranslation,handleBotAddedToGroup,getListOfTranslations,handleTranslationSetup};
