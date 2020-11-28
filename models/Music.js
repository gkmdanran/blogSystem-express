const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    title:{type:String},
    pic:{type:String},
    src:{type:String},
    artist:{type:String},
    cloudID:{type:String},
    lrc:{type:String},
})
module.exports=mongoose.model('Music',schema)
