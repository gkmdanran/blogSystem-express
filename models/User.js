const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    userName:{type:String},
    password:{type:String}
})
module.exports=mongoose.model('User',schema)