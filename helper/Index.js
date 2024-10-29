
const {handleMessage,sendMessage}=require("./Telegram")
const {errorHandler}=require("./errorhandler")
const handler =async (req,method)=>{
    try{
        if(method==="Get"){
            console.log("get request");
        }
        // console.log(req);
        const {body} = req;
        // console.log(body);
        if(body && body.message){
            const messageObj=body.message;
            await handleMessage(messageObj);
            return "success";;
        }
        return "unknown request"
    }
    catch(err){
       return  errorHandler(err,"main index handler")
    }
}

// app.post('*', async (req, res) => {
//     const update = req.body;
//     console.log('Incoming request from Telegram:', update);

//     if (update.message) {
//         console.log("Message update detected");
        
//         const chatId = update.message.chat.id;
        
//         // New chat member handling
//         if (update.message.new_chat_members) {
//             const newMembers = update.message.new_chat_members;

//             for (const member of newMembers) {
//                 if (member.id === 7653707024) {
//                     console.log(`Bot added to the group: ${chatId}`);
//                     await addChatToDatabase(chatId);
//                     bot.sendMessage(chatId, 'Thank you for adding me! I will send daily Quran verses Inshallah.');
//                 } else {
//                     console.log(`New human member added: ${member.first_name} in chat ${chatId}`);
//                 }
//             }
//         }

//         // Command and translation logic
//         if (update.message.text && update.message.text.charAt(0) === "/") {
//             const messageText = update.message.text;
//             const command = messageText.substr(1);

//             if (command === "getId") {
//                 bot.sendMessage(chatId, `Your group chat ID is ${chatId}`);
//             } else if (command === "setTranslation" && update.message.chat.type === "private") {
//                 await bot.sendMessage(chatId, "Please select your language (e.g., English, Amharic):");
//                 userSteps[chatId] = 'waiting_for_language';
//             }
//         }
//     } else if (update.my_chat_member) {
//         console.log("Chat member update detected");
//         // Additional handling for non-message updates, if needed
//     }

//     res.sendStatus(200);
// });

module.exports={handler}