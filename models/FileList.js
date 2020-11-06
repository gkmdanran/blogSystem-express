const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    filename:{type:String},
    useId:{type:String},
})
module.exports=mongoose.model('FileList',schema)