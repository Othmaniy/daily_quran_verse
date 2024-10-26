const {getAxiosInstance}=require("./axios")
const {errorHandler}=require("./errorhandler")
const token = "7653707024:AAE9oeSly5-Y2W_xFwfY6kKnfQPO2H179jM";
const BASEURL =`https://api.telegram.org/bot${token}`
const axiosInstance = getAxiosInstance(BASEURL); 

const sendMessage =(chatId,messageText)=>{
    return axiosInstance
    .get("sendMessage",{
        chat_id:chatId,
        text:messageText
    })
    .catch((ex)=>{
        errorHandler(ex,"sendMesage","axios")
    })
}
const handleMessage=async(messageObj)=>{
    const messageText =messageObj.text;
    if(!messageText){
        errorHandler("No message text","handle message");
        return "";
    }
    try {
        const chatId =messageObj.chat.id;
        if(messageText.charAt(0)==="/"){
            const command=messageText.substr(1);
            switch(command){
                case "start":
                return sendMessage(chatId,"I am daily quran verse bot i will send quran verses daily to these group inshaallah")
                default:
                 sendMessage(chatId,"invalid command")
            }            
        }
        else{
            sendMessage(chatId,messageText)
        }
    }
    catch(err){
        errorHandler(err,"handlemessage")
    }
}
module.exports={
    sendMessage,
    handleMessage
}
