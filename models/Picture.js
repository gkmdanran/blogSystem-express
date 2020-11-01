const mongoose=require("mongoose")
mongoose.set('useFindAndModify', false)
const schema=new mongoose.Schema({
    title:{type:String},
    tag:{type:String},
    tagColor:{type:String},
    count:{type:Number,default:0},
    cover:{type:String,default:''},
    password:{type:String,default:''},
    picDetailList:{type:String,default:''},
    createTime:{type:Date,default:Date.now},
})
module.exports=mongoose.model('Picture',schema)