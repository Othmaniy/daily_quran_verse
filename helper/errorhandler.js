const errorHandler =(err,name,from)=>{
    let loggerFunction = console.log;

    loggerFunction("------START------------")
    loggerFunction("error occured in" + name)
    if(from === "axios"){
        if(err.response){
            loggerFunction(err.response.data)
            loggerFunction(err.response.status)
            loggerFunction(err.response.headers)
        }
        else if(err.request){
            loggerFunction(err.request)
        }
        else{
            loggerFunction("error",err)
        }
        loggerFunction(err.toJSON())
    }
    else{
        loggerFunction(err)
    }
    loggerFunction("-----------END---------")
}
module.exports={
    errorHandler
}