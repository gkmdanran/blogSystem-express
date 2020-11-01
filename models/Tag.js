const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    tagName:{type:String},
    blogsStrs:{type:String},
    type:{type:String},
})
module.exports=mongoose.model('Tag',schema)