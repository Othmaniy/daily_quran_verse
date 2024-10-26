
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
module.exports={handler}