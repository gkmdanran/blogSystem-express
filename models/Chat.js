const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    chatName:{type:String},
    chatContent:{type:String},
    chatWay:{type:String},
    createTime:{type:Date,default:Date.now},
})
module.exports=mongoose.model('Chat',schema)
