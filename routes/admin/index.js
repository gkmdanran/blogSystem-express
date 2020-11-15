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
    const auth=async(req,res,next)=>{
        const token=String(req.headers.authorization||'').split(' ').pop()
        assert(token,401,{msg:'请先登录'})
        jwt.verify(token,app.get('secret'),async(err,decoded)=>{
            if(err){
                return res.send({
                    code:0,
                    msg:'请先登录'
                })
            }
            req.user=await User.findById(decoded.id)
            if(!req.user)return res.send({
                code:0,
                msg:'请先登录'
            })
            await next()
        })
        
    }
    router.get('/zhuce',async(req,res)=>{
        User.remove({}, function (err) { // 筛选条件为空即是表示所有
        });
        var password=md5('123456')
        var user = new User({
            userName : 'gkmdanran',                
            password,                           //年龄                   
        });
        user.save(function (err, res) {
            if (err) {
                // console.log("Error:" + err);
            }
            else {
                // console.log("Res:" + res);
               User.find().then(res=>console.log(res))               
            }
        });
    })
   

    


    router.post('/checklogin',auth,(req,res)=>{
        return res.send({code:200})
    })
    

    //登录
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
    //修改密码
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
    //添加标签
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
    //获取标签
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
    //删除标签
    router.post('/deltag',auth,async(req,res)=>{
        
        const article=await Article.findOne({tags:new RegExp(`^.*${req.body.id}.*$`)})
        if(article)
            return res.send({
                code:0,
                msg:'标签下存在文章，不能删除'
            })
        const tag=await Tag.deleteOne({_id:req.body.id})
        
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
    //添加博客
    router.post('/addarticle',auth,async(req,res)=>{
        var {title,context,contextText,tags,mdValue}=req.body.article

        var {imgs}=req.body
        if(title==''||context==''||contextText==''||tags==''||mdValue=='')
            return res.send({
                    code:0,
                    msg:'缺少参数'
                })
        Article.create(req.body.article,function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'添加失败'
                })
            }
            else {
                for(let x of imgs.split(',')){
                    FileList.updateOne({filename:x.split('/uploads/')[1]},{useId:res2._id},function(err,res2){
                        
                    })
                }
                
                res.send({
                    code:200,
                    data:res2,
                    msg:'发布文章成功'
                })             
            }
        });
    })
    //获取博客
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
        res.send({code: 200, data: pageFilter(arts.reverse(), pageNum, pageSize)})
    })
    //删除博客
    router.post('/delarticle',auth,async(req,res)=>{
        var delList=req.body.ids.split(",")
        var delcount=0
        for(let item of delList){
            const {deletedCount}=await Article.deleteOne({_id:item})
            await FileList.updateMany({useId:item},{useId:''})
            delcount+=deletedCount
        }
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
    //获取详情
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
    //修改博客
    router.post('/editarticle',auth,async(req,res)=>{
        // console.log(req.body)
        var {title,context,contextText,tags,mdValue,id,imgs,otherhref}=req.body
        if(title==''||context==''||contextText==''||tags==''||mdValue==''||id=='')
            return res.send({
                    code:0,
                    msg:'缺少参数'
                })
        await FileList.updateMany({useId:id},{useId:''})
        for(let x of imgs.split(',')){
            // console.log(x.split('/uploads/')[1])
            FileList.updateOne({filename:x.split('/uploads/')[1]},{useId:id},function(err,res22){
            })
        }
        Article.findByIdAndUpdate(id,{title,context,otherhref,contextText,tags,mdValue,updateTime:Date.now()},function (err, res2) {
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
    //置顶博客
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
    router.post('/addfile',auth,async(req,res)=>{
        var {filename}=req.body
        FileList.create({filename,useId:''},function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'上传文件失败'
                })
            }
            else {
                // console.log(res2)
                res.send({
                    code:200,
                    data:res2,
                    msg:'上传文件成功'
                })             
            }
        });
       
    })


//相册管理addpicture
    //添加相册
    router.post('/addpicture',auth,async(req,res)=>{
        var {title,tag}=req.body
        
        
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
                    // console.log(res2)
                    res.send({
                        code:200,
                        data:res2,
                        msg:'创建相册成功'
                    })             
                }
            });
    })
    //获取相册
    router.get('/pictures',auth,async(req,res)=>{  
        
        var pictures=await Picture.find({},'count cover createTime tag tagColor title password')
        
        
        res.send({code: 200, data:pictures})
    })
    //删除相册
    router.post('/delpic',auth,async(req,res)=>{
        var _id=req.body.id
        const {deletedCount}=await Picture.deleteOne({_id,})
        
        if(deletedCount>0)
            return res.send({code: 200, msg:'删除成功'})
        else
            return res.send({code: 0, msg:'删除失败'})
    })
    //获取详情
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
    //添加图片
    router.post('/addlist',auth,async(req,res)=>{
        var {filename,id,count}=req.body
        
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
    //删除图片
    router.post('/dellist',auth,async(req,res)=>{
        var {filename,id,count,delList}=req.body
        var list=delList.split(',')
        var cover=filename!=''?'http://localhost:3000/uploads/'+filename.split(',')[0]:''
        
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
    //更换封面
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
    //设置相册
    router.post('/editpictures',auth,async(req,res)=>{
        var {id,title,password,tag}=req.body
        
        var mdpassword=password==''?password:md5(md5(password)+app.get('secret'))
        
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

//皮肤管理
    //获取皮肤
    router.get('/skins',auth,async(req,res)=>{  
        var skins=await Skin.find({})
        // console.log(skins)
        res.send({code: 200, data:skins})
    })
    //删除皮肤
    router.post('/deluploads',auth,async(req,res)=>{  
        var {filename}=req.body
        if(filename!=''){
            fs.unlinkSync('./uploads/' + filename);
            res.send({
                code:200,
                msg:'删除缓存文件成功'
            })
        }
            
    })
    //添加皮肤
    router.post('/addskin',auth,async(req,res)=>{
        var {showTime,skinUrl}=req.body
        
        Skin.create({showTime,skinUrl},function (err, res2) {
            if (err) {
                res.send({
                    code:0,
                    msg:'添加皮肤失败'
                })
            }
            else {
               
                res.send({
                    code:200,
                    data:res2,
                    msg:'添加皮肤成功'
                })             
            }
        });
    })
    //删除皮肤
    router.post('/delskin',auth,async(req,res)=>{
        var _id=req.body.id
        const {deletedCount}=await Skin.deleteOne({_id,})
        fs.unlinkSync('./uploads/' + req.body.filename);
        // console.log(deletedCount)
        if(deletedCount>0)
            return res.send({code: 200, msg:'删除成功'})
        else
            return res.send({code: 0, msg:'删除失败'})
    })

//留言管理
    //查询留言
    router.get('/chats',auth,async(req,res)=>{  
        var {pageNum,pageSize,queryPeople,queryDate}=req.query
        // console.log(queryDate)
        if(queryPeople=='undefined')
            queryPeople=''
        
        var contition = {
            chatName: new RegExp(`^.*${queryPeople}.*$`,'i'),
        }
        if(queryDate!=''&&queryDate!='null'){
            var start=new Date(queryDate)
            var year=new Date(queryDate).getFullYear()
            var month=new Date(queryDate).getMonth()+1
            var nextday=new Date(queryDate).getDate()+1
            month=month<10?'0'+month:month
            nextday=nextday<10?'0'+nextday:nextday
            var endTime=year+'-'+month+'-'+nextday
            var end=new Date(endTime)
            // console.log(start,end)
            contition['createTime']={$gte: start, $lt: end}
        }
        
        var chats=await Chat.find(contition)
        res.send({code: 200, data: pageFilter(chats.reverse(), pageNum, pageSize)})
    })
    //删除留言
    router.post('/delchats',auth,async(req,res)=>{
        var delList=req.body.ids.split(",")
        var delcount=0
        for(let item of delList){
            const {deletedCount}=await Chat.deleteOne({_id:item})
            delcount+=deletedCount
        }
        
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

//文件清理
    //查询文件
    router.get('/getfilelists',auth,async(req,res)=>{  
        var lists=await FileList.find({})
        res.send({code: 200, data:lists})
    })
    //删除文件
    router.get('/clearfile',auth,async(req,res)=>{ 
        var files=await FileList.find({useId:''})
        // console.log(files)
        for(let x of files){
            fs.unlinkSync('./uploads/' + x.filename);
        }
        await FileList.deleteMany({useId:''});
        res.send({
            code:200,
            msg:'清理成功'
        })
    })
//图片上传
    const upload=multer({dest:__dirname+'/../../uploads'})
    router.post("/upload",auth,upload.single('file'),async(req,res)=>{
        const file=req.file
        // console.log(file)
        file.url=`http://localhost:3000/uploads/${file.filename}`
        res.send(req.file)
    })

    app.use('/admin/api',router)
}