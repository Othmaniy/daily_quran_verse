const axios = require("axios");
const getAxiosInstance=(BASEURL,headers={})=>{
  return {
    get(method,params){
        return axios.get(`/${method}`,{
          baseURL:BASEURL,
          params,
          headers
      })
       
    },
    post(method,data){
         return axios({
            method:"post",
            baseURL:BASEURL,
            url:`${method}`,
            data,
            headers
         })
    }
  }
}
module.exports={getAxiosInstance}