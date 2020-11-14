module.exports=app=>{
    const express=require("express")
    const md5 = require("md5");
    const jwt=require('jsonwebtoken')
    const assert=require('http-assert')
    const router=express.Router()
    const multer=require("multer")
    const fs = require("fs");
    const User=require('../../models/User')
    const Tag=require('../../models/Tag')
    const Article=require('../../models/Article')
    const Picture=require('../../models/Picture')
    const Skin=require('../../models/Skin')
    const Chat=require('../../models/Chat')
    const FileList=require('../../models/FileList')

    const pageFilter=require('../../plugins/pageFilter')
    //文章列表
    router.get('/articles',async(req,res)=>{  
        var {pageNum,pageSize,query,tagquery}=req.query
        if(query=='undefined')
            query=''
        contition = {
            title: new RegExp(`^.*${query}.*$`,'i'),
            tags:new RegExp(`^.*${tagquery}.*$`)
        }
        
        var articles=await Article.find(contition,'title tags contextText createTime star isTop')
        arts=JSON.parse(JSON.stringify(articles))
        var topList=[]
        for(let article of arts){
            article.tagList=[]
            for(let x of article.tags.split(',')){
                const tagobj=await Tag.findOne({_id:x})
                if(tagobj)
                    article.tagList.push(tagobj) 
            }
            if(article.isTop==1){
                topList.push(JSON.parse(JSON.stringify(article)))
                article.isTop=0
            }
                
        }

        res.send({code: 200, data: pageFilter([...topList.reverse(),...arts.reverse()], pageNum, pageSize)})
    })
    //最新文章
    router.get('/newarticles',async(req,res)=>{  
        var articles=await Article.find({},'title createTime')
        var list=articles.length>=5?articles.reverse().slice(4):articles.reverse()
        res.send({code: 200, data: list})
    })
    //具体文章
    router.get('/detailarticle',async(req,res)=>{  
    var {id}=req.query
    
        var article={}
        var tagList=[]
        try {
            article=await Article.findOne({_id:id})
            for(let x of article.tags.split(',')){
                const tagobj=await Tag.findOne({_id:x})
                if(tagobj)
                tagList.push(tagobj) 
            }
            res.send({
                code:200,
                data:{article,tagList}
            })
        } catch (error) {
            res.send({code: 0})
        }
        
        
        // console.log(article)
        
    })
    //标签列表
    router.get('/mytags',async(req,res)=>{  
        var tags=await Tag.find({})
        for(let tag of tags){
            const articles=await Article.find({tags:new RegExp(`^.*${tag._id}.*$`)})
            var list=[]
            for(let art of articles)
                list.push(art._id)
            tag.blogsStrs=list.join(',')
        }  
        res.send({code: 200, data: tags})
    })
    //点赞
    router.post('/love',async(req,res)=>{
        var {id}=req.body
        article=await Article.findOne({_id:id})
        var star=article.star
        Article.updateOne({_id:id},{star:star+1},function(err,res2){
            if(err){

            }else{
                res.send({
                    code:200,
                })
            }
        })
    })
    //按标签获取文章
    router.get('/tagarticles',async(req,res)=>{  
        var {pageNum,pageSize,query,tagquery}=req.query
        if(query=='undefined')
            query=''
        contition = {
            title: new RegExp(`^.*${query}.*$`,'i'),
            tags:new RegExp(`^.*${tagquery}.*$`)
        }
        try {
    
            var tag= await Tag.findById(tagquery)
            var articles=await Article.find(contition,'title tags contextText createTime star isTop')
            arts=JSON.parse(JSON.stringify(articles))
            
            for(let article of arts){
                article.tagList=[]
                for(let x of article.tags.split(',')){
                    const tagobj=await Tag.findOne({_id:x})
                    if(tagobj)
                        article.tagList.push(tagobj) 
                }
            }

            res.send({code: 200, data: pageFilter(arts.reverse(), pageNum, pageSize),tag})
        } catch (error) {
            res.send({code: 0})
        }
    })
    //获取相册
    router.get('/pictures',async(req,res)=>{  
        
    var pictures=await Picture.find({},'count cover createTime tag tagColor title password')
    for(let x of pictures){
        if(x.password!='')
            x.cover=''
    }
    res.send({code: 200, data:pictures})
    })
    router.get('/detailpicture',async(req,res)=>{
        var {id}=req.query
        var picture={}
        try {
            picture=await Picture.findOne({_id:id},'count cover createTime tag tagColor title picDetailList')
        } catch (error) {
            
        }
        res.send({
            code:200,
            data:picture
        })
    })
    router.post('/checkpicpassword',async(req,res)=>{
        
        var {id,password}=req.body
        
        var mdpassword=md5(md5(password)+app.get('secret'))
        try {
            const pic= await Picture.findOne({_id:id})
            if(pic.password==''){
                console.log("yes")
                return res.send({
                    code:200
                })
            }
                
            else if(mdpassword!=pic.password){
                console.log("no")
                return res.send({
                    code:0
                })
            }
            return res.send({
                code:200
            })
        } catch (error) {
            res.send({
                code:0
            })
        }
        
       
    })
    router.get('/getskin',async(req,res)=>{
        var skins=await Skin.find({})
        var date=new Date()
        var month=date.getMonth()+1
        var day=date.getDate()
        month=month<10?'0'+month:month
        day=day<10?'0'+day:day
        var today=month+'-'+day
        var randomSkin=[]
        if(skins.length==0)return res.send({code: 0})
        for(let x of skins){
            if(x.showTime==today){
                return res.send({code: 200, data:x.skinUrl})
            }
            if(x.showTime==null||x.showTime=='')
                randomSkin.push(x)
        }
        if(randomSkin.length==0)
            return res.send({code: 0})
        else{
            var url=randomSkin[Math.round(Math.random()*(randomSkin.length-1))].skinUrl
            return res.send({code: 200, data:url})
        }
            
    })


    app.use('/blog/api',router)
}