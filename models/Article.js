const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    title:{type:String},
    tags:{type:String},
    otherhref:{type:String},
    context:{type:String},
    contextText:{type:String},
    mdValue:{type:String},
    createTime:{type:Date,default:Date.now},
    updateTime:{type:Date,default:Date.now},
    star:{type:Number,default:0},
    isTop:{type:Number,default:0},
    
})
module.exports=mongoose.model('Article',schema)