var db=require('../config/connection')
var collection=require('../config/collection')
var bcrypt=require('bcrypt')

module.exports={
    doSignup:(userdata)=>{
        console.log(userdata)
        return new Promise (async(resolve,reject)=>{
            let userExist= await db.get().collection(collection.usercollection).findOne({email:userdata.email})
            if(userExist){

                resolve(null)
            }
            else{
            userdata.password= await bcrypt.hash(userdata.password,10)
       db.get().collection(collection.usercollection).insertOne(userdata).then((data)=>
           resolve(data.ops[0]))
       
            }
        })
       
    },
    doLogin:(logindata)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
           let user=await db.get().collection(collection.usercollection).findOne({email:logindata.email})
           if (user){
               bcrypt.compare(logindata.password,user.password).then((status)=>{ 
                if(status){
                response.user=user
                response.status=status
                resolve(response)
                }
                else
                {
                resolve({status:false})
               }})
           }
           else
           {
            resolve({status:false})
           }

        })
    }
}