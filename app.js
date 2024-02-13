require("./db")
const express = require("express");
const data = require("./model");
const multer = require("multer")
const app = express()

const storage=multer.diskStorage({
    destination: "public/images",
    filename:(req,res,cb)=>{
        cb(null,res.fieldname+Date.now()+".jpg")
    }
})

const upload=multer({
    storage:storage
}).single("myfile")

app.use(express.json())
app.get("/" ,  async (req , res ) =>{
    data.find().then((e) => {
        res.status(201).send(e)
    }).catch((e)=>res.status(404).send(e));
})

 


app.listen(5500, () => console.log("server started..."))

