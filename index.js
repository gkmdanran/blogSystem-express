const express=require("express")
const app=express()
var bodyParser = require('body-parser'); 
app.use(bodyParser.json({ limit: '50mb' }));
app.set('secret','SDFSDGDSGSD')
app.use(require('cors')())
app.use(express.json())
app.use('/uploads',express.static(__dirname+'/uploads'))
require("./routes/admin")(app)
require("./routes/blog")(app)
require("./plugins/db")(app)

app.listen(3000,()=>{
    console.log("App listening on port 3000")
    console.log("http://101.132.68.0:3000")
})
module.exports=app