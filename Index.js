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
        const rows = await queryDatabase('SELECT chat_id FROM group_chats');
        console.log("Chat IDs: ", rows);

        if (!Array.isArray(rows) || rows.length === 0) {
            console.log("No chat IDs found.");
            return;
        }
        const verse = await getDailyVerse();

        for (const row of rows) {
            const chatId = row.chat_id;
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

//scheduler i=using cron
//scheduler start
// cron.schedule('*/2 * * * *', async () => {
//     console.log("Running daily verse scheduler...");
//     await sendDailyVerse();
// }); 

//scheduler end
const getDailyVerse=async()=>{
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
    const amharicTextResponse = await axios.get(`https://api.quran.com/api/v4/quran/translations/87?verse_key=${verse_key}`)
    const amharicVerse= amharicTextResponse.data.translations[0].text;
    console.log("amharic verse");
    console.log(amharicVerse);
    // return {
    //     arabic: arabicVerse,
    //     amharic: amharicVerse,
    //     verseKey: verse_key
    // };
    // console.log(`Random verse in Arabic: ${verse_key} - ${text_uthmani}`);
    // console.log(response.data);
    // const {text,surah,numberInSurah}=response.data.data;
     return `arabic verse of the day:\n${arabicVerse}\namharic verse: ${amharicVerse}\nsurah:
     ${arabicName}(${englishName}), ${verse_key}`;

}
const getListOfTranslations =async()=>{
const response = await axios.get("https://api.quran.com/api/v4/resources/translations")
    console.log("response from list of translations");
    console.log(response.data.translations);
    // const numberOfTranslations = response.data.data.translations.length;
    const numberOfTranslations =response.data.translations.length;
    console.log("numberof translations "+numberOfTranslations);

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
app.post('*', async (req, res) => {
    const update = req.body;
    // const messageText = update?.message?.text;
    console.log('Incoming request from Telegram:', update);  // Log the full body
    console.log("New chat member detected");
    console.log(update?.message?.new_chat_members);
    if (update.message) {
        const messageText = update?.message?.text;
        const chatId = update.message.chat.id;
        if(update.message.new_chat_members){
            const newMembers = update.message.new_chat_members;
            for (const member of newMembers) {
                if (member.id === 7653707024) {  
                    console.log(`Bot added to the group: ${chatId}`);
                    await addChatToDatabase(chatId);  
                    bot.sendMessage(chatId, 'Thank you for adding me! I will send daily Quran verses Inshallah.');
                } else {
                    console.log(`New human member added: ${member.first_name} in chat ${chatId}`);
                } 
            }
        }
        if( update?.message?.text?.charAt(0) === "/"){
            const messageText =update.message.text;
            const command = messageText.substr(1);
            // Command to start setting translation
            if(command=="getId"){
                bot.sendMessage(chatId,`your group groupchatid is ${chatId}`)
            }
            else if (command === "setTranslation"  &&update.message.chat.type =="private" ) {
                await bot.sendMessage(chatId, "Please select your language (e.g., English, Amharic):");
                userSteps[chatId] = 'waiting_for_language'; // Track that we are waiting for a language selection
            }
          }
        else if (userSteps[chatId] === 'waiting_for_language' && messageText) {
            if (messageText.toLowerCase().includes("english") || messageText.toLowerCase().includes("amharic")) {
                const selectedLanguage = messageText;
                await bot.sendMessage(chatId, `You selected ${selectedLanguage}. Please provide the group chat ID: you can get your group chat id by sending message to your group and send /getId`);
                userSteps[chatId] = { step: 'waiting_for_group_id', language: selectedLanguage }; // Move to next step
            } else {
                await bot.sendMessage(chatId, "Invalid language. Please select either 'English' or 'Amharic'.");
            }
        }
        // Handle group chat ID after language is selected
        else if (userSteps[chatId]?.step === 'waiting_for_group_id' && messageText && !isNaN(messageText)) {
            const groupChatId = messageText;
            const selectedLanguage = userSteps[chatId].language;
    
            await bot.sendMessage(chatId, `Your language (${selectedLanguage}) and group chat ID (${groupChatId}) have been set successfully.`);
            
            // Save the selected language and groupChatId to your database
            // await saveTranslationSettings(chatId, selectedLanguage, groupChatId);
    
            // Reset user step
            delete userSteps[chatId];
        } 
        // Handle invalid inputs
        else if (userSteps[chatId]) {
            await bot.sendMessage(chatId, "Please follow the instructions. Start by selecting a valid language.");
        }
    }
    //with user steps
    // if (update.message) {
     
    // } 
    // Handle language selection after /setTranslation

    res.send('OK');
})

app.listen("5000",(req,res)=>{
    console.log("server is listening");
})
// A simple in-memory map to track users' current step