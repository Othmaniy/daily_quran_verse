const TelegramBot = require('node-telegram-bot-api');
require("dotenv").config();
const axios = require('axios');
const cron = require('node-cron');
const token=process.env.TOKEN;
const bot = new TelegramBot(token, { polling: false });
const express = require("express");
const pool = require("./config/db.config");
const { handler } = require('./helper/Index');
const app = express();
app.use(express.json());
console.log("telegram token"+token);
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
//to be deleted it is not  working
//start
bot.on('new_chat_members', async (msg) => {
    console.log("on new chat members function working");
    console.log('New member added to group', msg.chat.id);
    const chatId = msg.chat.id;
    await addChatToDatabase(chatId);
    bot.sendMessage(chatId, 'Thank you for adding me! I will send daily Quran verses Inshallah.');
});

//end

// const updateTranslation = (pereferedLanguage)=>{
//     const sql = `UPDATE group_chats SET prefered_language`;
//     pool.query(sql,(err,results)=>{
//         if(err){
//             console.log(err);
//         }
//         return "sucessfully updated"
//     })
// }
const sendDailyVerse = async () => {
    console.log("Fetching chat IDs...");

    // Use a Promise wrapper for the MySQL pool.query method
    const queryDatabase = (sql) => {
        return new Promise((resolve, reject) => {
            pool.query(sql, (error, results) => {
                if (error) {
                    return reject(error);
                }
                resolve(results);
            });
        });
    };

    try {
        const rows = await queryDatabase('SELECT chat_id,language_code FROM group_chats');
        console.log("Chat Ida and language code ", rows);


        if (!Array.isArray(rows) || rows.length === 0) {
            console.log("No chat IDs found.");
            return;
        }
        

        for (const row of rows) {
            const chatId = row.chat_id;
            const languageCode=row.language_code;
            const verse = await getDailyVerse(languageCode);
            console.log(`Sending verse to ${chatId}`);
            try {
                await bot.sendMessage(chatId, verse);
            } catch (err) {
                console.error(`Failed to send verse to ${chatId}:`, err);
            }
        }
    } catch (err) {
        console.error("Error fetching chat IDs:", err);
    }
};

//scheduler using cron
//scheduler start
// cron.schedule('*/2 * * * *', async () => {
//     console.log("Running daily verse scheduler...");
//     await sendDailyVerse();
// }); 

//scheduler end
const getDailyVerse=async(languageCode=840)=>{
    // const response  = await axios.get(`http://api.alquran.cloud/v1/ayah/random`);
    //from qura.doc.com
    const verseResponse = await axios.get('https://api.quran.com/api/v4/verses/random');
    const verseData = verseResponse.data.verse;
    console.log("versedata");
    console.log(verseData);
    const {verse_key}=verseData
    const[surahNumber,ayahNumber] = verse_key.split(":");
    console.log("surah number"+surahNumber);
    console.log("ayah number"+ayahNumber);
    console.log(verse_key);
    console.log(verseData);
  const getSurahDetails = await axios.get(`https://api.quran.com/api/v4/chapters/${surahNumber}`)
  const arabicName=getSurahDetails.data.chapter.name_arabic;
  const englishName= getSurahDetails.data.chapter.translated_name.name;
  console.log("englishname" + englishName);
  console.log("arabic shnam e" + arabicName);
    //fetching arabic text
    const  arabicTextResponse = await axios.get(`https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${verse_key}`)
    console.log("arabic text response");
    console.log(arabicTextResponse.data);
    const arabicVerse= arabicTextResponse.data.verses[0].text_uthmani
    console.log(arabicVerse);
    console.log("response from quran api");
    //fetching amharic verse 
    const translatedTextResponse = await axios.get(`https://api.quran.com/api/v4/quran/translations/${languageCode}?verse_key=${verse_key}`)
    const translatedVerse = translatedTextResponse.data.translations[0].text;
    console.log("translated verse");
    console.log(translatedVerse);
    // return {
    //     arabic: arabicVerse,
    //     amharic: amharicVerse,
    //     verseKey: verse_key
    // };
    // console.log(`Random verse in Arabic: ${verse_key} - ${text_uthmani}`);
    // console.log(response.data);
    // const {text,surah,numberInSurah}=response.data.data;
     return `arabic verse of the day:\n${arabicVerse}\ntranslated verse: ${translatedVerse}\nsurah:
     ${arabicName}(${englishName}), ${verse_key}`;

}

let ListOfTranslations=[]
const getListOfTranslations =async()=>{
const response = await axios.get("https://api.quran.com/api/v4/resources/translations")
    console.log("response from list of translations");
    console.log(response.data.translations);
    // const numberOfTranslations = response.data.data.translations.length;
    const numberOfTranslations =response.data.translations.length;
    console.log("numberof translations "+numberOfTranslations);
    console.log("list of translations");
    console.log(response.data.translations);
    ListOfTranslations=response.data.translations
    console.log(numberOfTranslations.length);
    return ListOfTranslations
//    const ListOfTranslations=response.data.translations
//    console.log(ListOfTranslations);
}
// getListOfTranslations();
// getDailyVerse()
//check is user is admin for that group to change language
const isAdmin =()=>{
    return;
}
app.post('/sendVerseNow', async (req, res) => {
    const avilableTranslations=["english",""]
    console.log("send verse now function triggered");
    await sendDailyVerse();
    res.send('Verse sent to all group chats.');
});

const userSteps = {};
const updateTranslation = (chatId, preferredLanguage,languageCode) => {
    const sql = `UPDATE group_chats SET prefered_language = ?, language_code=? WHERE chat_id = ?`;
    pool.query(sql, [preferredLanguage,languageCode,chatId], (err, results) => {
        if (err) {
            console.log("Error updating preferred language:", err);
        } else {
            console.log("Successfully updated preferred language");
        }
    });
};

app.post('*', async (req, res) => {
    const update = req.body;
    const chatId = update.message ? update.message.chat.id : update.callback_query?.message?.chat?.id;
    const messageText = update.message?.text;

    console.log("Incoming request from Telegram:", update);

    // Handling new members
    if (update.message?.new_chat_members) {
        const newMembers = update.message.new_chat_members;
        for (const member of newMembers) {
            if (member.id === 7653707024) {
                console.log(`Bot added to the group: ${chatId}`);
                await addChatToDatabase(chatId);
                bot.sendMessage(chatId, 'Thank you for adding me! I will send daily Quran verses Inshallah.');
            }
        }
    }

    // Command handling
    if (messageText?.startsWith("/")) {
        const command = messageText.slice(1);

        if (command === "getId") {
            bot.sendMessage(chatId, `Your group chat ID is ${chatId}`);
        } else if (command === "setTranslation" && update.message.chat.type === "private") {
            // Start translation setup    
            // const translationOptions = translations.map((translation) => [{
            //     text: translation.label,
            //     callback_data: translation.code
            // }]);
            const translations = await getListOfTranslations();
            console.log("get traslations response");
            console.log(translations);
            const translationOptions= translations.map((translation)=>[{
                text:`${translation.language_name},${(translation.translated_name.name)}`,
                callback_data:`${translation.id}|${translation.language_name}`
            }])
            bot.sendMessage(chatId, "Please select your preferred translation:", {
                reply_markup: { inline_keyboard: translationOptions }
            });

            userSteps[chatId] = 'selecting_language';
        }
    }

    // Handling language selection from callback query
    if (update.callback_query) {
        const callbackData=update.callback_query.data;
        const [languageCode,languageName]=callbackData.split("|")
        console.log("language id and language name");
        console.log(languageCode,languageName);
        const callbackChatId = update.callback_query.message.chat.id;
        // console.log("update chat");
        console.log(update.callback_query.message.chat);
        if (userSteps[callbackChatId] === 'selecting_language') {
            // Set user step to 'waiting_for_group_id'
            userSteps[callbackChatId] = { step: 'waiting_for_group_id', language: languageName,languageCode:languageCode }
            bot.sendMessage(callbackChatId, `You selected ${languageName}. Please provide the group chat ID. You can find it by sending /getId to your group.`);
        }
    }

    // Handling group chat ID message after language selection
    if (userSteps[chatId]?.step === 'waiting_for_group_id' && messageText && !isNaN(messageText)) {
        const groupChatId = messageText;
        console.log("group chat id "+groupChatId);
        const selectedLanguage = userSteps[chatId].language;
        const languageCode=userSteps[chatId].languageCode;
        // Update the language in the database
        const updateResponse = await updateTranslation(groupChatId, selectedLanguage,languageCode);
        console.log(updateResponse);
        bot.sendMessage(chatId, `Your language (${selectedLanguage}) and group chat ID (${groupChatId}) have been set successfully.`);
        // Reset user step
        delete userSteps[chatId];
    } 

    res.send('OK');
});



const translations = [
    { label: "English", code: "en" },
    { label: "Amharic", code: "am" },
    { label: "Arabic", code: "ar" },
    { label: "French", code: "fr" }
];
app.listen("5000",(req,res)=>{
    console.log("server is listening");
})
// A simple in-memory map to track users' current step