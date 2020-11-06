const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    skinUrl:{type:String},
    showTime:{type:String},
})
module.exports=mongoose.model('Skin',schema)