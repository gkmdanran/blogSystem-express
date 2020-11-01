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
    const pageFilter=require('../../plugins/pageFilter')
    const auth=async(req,res,next)=>{
        const token=String(req.headers.authorization||'').split(' ').pop()
        // console.log(token)
        assert(token,401,{msg:'请先登录'})
        jwt.verify(token,app.get('secret'),async(err,decoded)=>{
            if(err){
                return res.send({
                    code:0,
                    msg:'请先登录'
                })
            }
            // console.log(decoded)
            req.user=await User.findById(decoded.id)
            if(!req.user)return res.send({
                code:0,
                msg:'请先登录'
            })
            // console.log(req.user)
            await next()
        })
        
    }
    router.get('/zhuce',async(req,res)=>{
        User.remove({}, function (err) { // 筛选条件为空即是表示所有
            // console.log("success");
        });
        var password=md5('123456')
        var user = new User({
            userName : 'gkmdanran',                
            password,                           //年龄                   
        });
        user.save(function (err, res) {
            if (err) {
                console.log("Error:" + err);
            }
            else {
                console.log("Res:" + res);
               User.find().then(res=>console.log(res))               
            }
        });
    })
   
    router.post('/login',async(req,res)=>{   
        const {userName,password}=req.body
        const user= await User.findOne({userName,password:md5(password)})
        if(!user){
            return res.send({
                code:0,
                msg:'用户不存在或密码错误'
            })
        }
        const token=jwt.sign({id:user._id},app.get('secret'))
        res.send({
            code:200,
            msg:'登录成功',
            data:{
                userName,
                token, 
            }
        })
    })
    
    router.post('/changepassword',auth,async(req,res)=>{
        const {oldPassword,userName,newPassword}=req.body
        const user= await User.findOne({userName,password:md5(oldPassword)})
        if(!user){
            return res.send({
                code:0,
                msg:'原密码错误修改密码失败'
            })
        }
        if(newPassword.length<6||newPassword.length>12){
            return res.send({
                code:0,
                msg:'请输入6-12位的新密码'
            })
        }
        User.updateOne({userName:userName},{password:md5(newPassword)},function(err,raw){
            if(err){
                res.send({
                    code:0,
                    msg:'服务端错误'
                })
            }else{
                res.send({
                    code:200,
                    msg:'修改成功请重新登录'
                })
            }
            
        })
        
    })

    //标签管理
    router.post('/addtag',auth,async(req,res)=>{
        var {tagName,type}=req.body
        const t= await  Tag.findOne({tagName})
        if(t)
            return res.send({
                code:0,
                msg:'标签已经存在'
            })
        var tag = new Tag({
            tagName:tagName,
            blogsStrs:'',
            type:type,                          //年龄                   
        });
        tag.save(function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'添加失败'
                })
            }
            else {
                res.send({
                    code:200,
                    data:res2,
                    msg:'添加新标签成功'
                })             
            }
        });
    })
    router.get('/tags',auth,async(req,res)=>{  
        var {pageNum,pageSize,query}=req.query
        if(query=='undefined')
        query=''
       
        contition = {tagName: new RegExp(`^.*${query}.*$`,"i")}
        // console.log(req.query)
        var tags=await Tag.find(contition)
        for(let tag of tags){
            const articles=await Article.find({tags:new RegExp(`^.*${tag._id}.*$`)})
            var list=[]
            for(let art of articles)
                list.push(art._id)
            tag.blogsStrs=list.join(',')
        }  
        
        res.send({code: 200, data: pageFilter(tags, pageNum, pageSize)})    
        
    })
    router.post('/deltag',auth,async(req,res)=>{
        console.log(req.body)
        const article=await Article.findOne({tags:new RegExp(`^.*${req.body.id}.*$`)})
        if(article)
            return res.send({
                code:0,
                msg:'标签下存在文章，不能删除'
            })
        const tag=await Tag.deleteOne({_id:req.body.id})
        console.log(tag)
        if(tag.deletedCount>0)
            res.send({
                code:200,
                msg:'删除成功'
            })
        else{
            res.send({
                code:0,
                msg:'删除失败'
            })
        }
    })
        
    //文章管理
    router.post('/addarticle',auth,async(req,res)=>{
        var {title,context,contextText,tags,mdValue}=req.body
        if(title==''||context==''||contextText==''||tags==''||mdValue=='')
            return res.send({
                    code:0,
                    msg:'缺少参数'
                })
        Article.create(req.body,function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'添加失败'
                })
            }
            else {
                // console.log(res2)
                res.send({
                    code:200,
                    data:res2,
                    msg:'发布文章成功'
                })             
            }
        });
    })

    router.get('/articles',auth,async(req,res)=>{  
        var {pageNum,pageSize,query,tagquery}=req.query
        if(query=='undefined')
            query=''
        contition = {
            title: new RegExp(`^.*${query}.*$`,'i'),
            tags:new RegExp(`^.*${tagquery}.*$`)
        }
        
        var articles=await Article.find(contition)
        arts=JSON.parse(JSON.stringify(articles))
        for(let article of arts){
            article.tagList=[]
            for(let x of article.tags.split(',')){
                const tagobj=await Tag.findOne({_id:x})
                if(tagobj)
                    article.tagList.push(tagobj) 
            }
        }
        res.send({code: 200, data: pageFilter(arts, pageNum, pageSize)})
    })

    router.post('/delarticle',auth,async(req,res)=>{
        var delList=req.body.ids.split(",")
        var delcount=0
        for(let item of delList){
            const {deletedCount}=await Article.deleteOne({_id:item})
            delcount+=deletedCount
        }
        console.log(delcount)
        if(delcount==delList.length)
            res.send({
                code:200,
                msg:'删除成功'
            })
        else
        res.send({
            code:0,
            msg:'删除失败'
        })
        
    })
    
    router.get('/detailarticle',auth,async(req,res)=>{  
       var {id}=req.query
       var article={}
       try {
        article=await Article.findOne({_id:id})
       } catch (error) {
           
       }
       
    //    console.log(1,article)
        res.send({
            code:200,
            data:article
        })
    })

    router.post('/editarticle',auth,async(req,res)=>{
        console.log(req.body)
        var {title,context,contextText,tags,mdValue,id}=req.body
        if(title==''||context==''||contextText==''||tags==''||mdValue==''||id=='')
            return res.send({
                    code:0,
                    msg:'缺少参数'
                })
        Article.findByIdAndUpdate(id,{title,context,contextText,tags,mdValue,updateTime:Date.now()},function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'修改失败'
                })
            }
            else {
               
                res.send({
                    code:200,
                    data:res2,
                    msg:'修改文章成功'
                })             
            }
        });
    })

    router.post('/totop',auth,async(req,res)=>{
        var {type,id}=req.body
        Article.findByIdAndUpdate(id,{isTop:type},function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'设置失败'
                })
            }
            else {
               
                res.send({
                    code:200,
                    data:res2,
                    msg:'操作成功'
                })             
            }
        });
    })
    
    //相册管理addpicture
    
    router.post('/addpicture',auth,async(req,res)=>{
        var {title,tag}=req.body
        
        console.log(title)
        var colorArray=['#007acc','#f78787','#89b41e','#ffd664']
        var tagColor=!tag?'':colorArray[Math.round(Math.random()*(colorArray.length-1))]
        if(!title)
            return res.send({
                    code:0,
                    msg:'缺少参数'
                })
            Picture.create({title,tag,tagColor},function (err, res2) {
                if (err) {
                    res.send({
                        code:0,
                        msg:'创建相册失败'
                    })
                }
                else {
                    console.log(res2)
                    res.send({
                        code:200,
                        data:res2,
                        msg:'创建相册成功'
                    })             
                }
            });
    })
    
    router.get('/pictures',auth,async(req,res)=>{  
        
        var pictures=await Picture.find({},'count cover createTime tag tagColor title password')
        
        console.log(pictures)
        res.send({code: 200, data:pictures})
    })
    
    router.post('/delpic',auth,async(req,res)=>{
        var _id=req.body.id
        const {deletedCount}=await Picture.deleteOne({_id,})
        console.log(deletedCount)
        if(deletedCount>0)
            return res.send({code: 200, msg:'删除成功'})
        else
            return res.send({code: 0, msg:'删除失败'})
    })

    router.get('/detailpicture',auth,async(req,res)=>{
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
    
    router.post('/addlist',auth,async(req,res)=>{
        var {filename,id,count}=req.body
        console.log(filename,count)
        var picture=await Picture.findById(id)
        var cover=picture.cover==''?('http://localhost:3000/uploads/'+filename.split(',')[0]):picture.cover
        
        
        Picture.findByIdAndUpdate(id,{picDetailList:filename,count,cover},function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'操作失败'
                })
            }
            else {
                
                res.send({
                    code:200,
                    data:res2,
                    msg:'上传成功'
                })             
            }
        });
        
       
    })

    router.post('/dellist',auth,async(req,res)=>{
        var {filename,id,count,delList}=req.body
        var list=delList.split(',')
        var cover=filename!=''?'http://localhost:3000/uploads/'+filename.split(',')[0]:''
        console.log(cover)
        Picture.findByIdAndUpdate(id,{picDetailList:filename,count,cover},function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'删除失败'
                })
            }
            else {
               
                res.send({
                    code:200,
                    data:res2,
                    msg:'删除成功'
                })             
            }
        });
        for(let x of list){
            var file=x.replace('http://localhost:3000/uploads/','')
            try {
                fs.unlinkSync('./uploads/' + file);
            } catch (error) {
                return res.send({
                    code:0,
                    msg:'删除失败'
                })
            }
            
        }
    })

    router.post('/changecover',auth,async(req,res)=>{
        var {id,cover}=req.body
        Picture.findByIdAndUpdate(id,{cover},function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'修改失败'
                })
            }
            else {
                
                res.send({
                    code:200,
                    data:res2,
                    msg:'设置封面成功'
                })             
            }
        });
    })

    router.post('/editpictures',auth,async(req,res)=>{
        var {id,title,password,tag}=req.body
        console.log(password)
        var mdpassword=password==''?password:md5(md5(password)+app.get('secret'))
        console.log(mdpassword)
        Picture.findByIdAndUpdate(id,{title,password:mdpassword,tag},function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'修改失败'
                })
            }
            else {
                
                res.send({
                    code:200,
                    data:res2,
                    msg:'设置相册成功'
                })             
            }
        });
    })
    //图片上传
    const upload=multer({dest:__dirname+'/../../uploads'})
    router.post("/upload",upload.single('file'),async(req,res)=>{
        const file=req.file
        // console.log(file)
        file.url=`http://localhost:3000/uploads/${file.filename}`
        res.send(req.file)
    })

    app.use('/admin/api',router)
}