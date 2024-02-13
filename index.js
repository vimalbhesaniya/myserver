require("./db")
const express = require("express");
const data = require("./model");
const network = require("./models/Network");
const cors = require("cors");
const app = express()
const jwt = require("jsonwebtoken")
const { sendMail } = require("./mailServices")
const key = "jobduniya"
const encrypt = require("bcrypt")
const crypto = require("crypto");
const multer = require("multer");
const path = require('path');
const joi = require('@hapi/joi');
// const size=multer({ limits: { fileSize: 10 * 1024 } });
const emailValidator = require('deep-email-validator');

app.use(cors())
app.use(express.json())

function generateOTP(length = 6) {
    const buffer = crypto.randomBytes(Math.ceil(length / 2));
    const OTP = buffer.toString('hex').slice(0, length);
    return OTP;
}

// user registration api
app.post("/add", async (req, res) => {
    // const { email, password } = req.body;
    const email = req.body.email;
    const password = req.body.password;
    const schema = joi.object({
        email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().label("Email_ID"),
        password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(6).max(10).required().label("Password")
        // confirmpassowrd : joi.ref('password')
    })
    let result = schema.validate(req.body);
    if (result.error) {
        res.send(result);
    }
    else {
        if (!email || !password) {
            return res.status(400).send({
                message: "Email or password missing."
            })
        }
        req.body.password = await encrypt.hash(req.body.password, 10);
        const finaldata = new data(req.body);
        data.insertMany(finaldata).then((e) => {
            res.send({ success: true, message: "data saved successfully" })
        }).catch((e) => {
            res.send({ error: e, success: false, message: "Email is already available" })
        })
    }
})

app.post("/submit", async (req, res) => {
    const email = req.body.email;
    // const uname = req.body.uname;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const schema = joi.object({
        // email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().label("Email_ID"),
        fname: joi.string().alphanum().min(3).max(10).required().label("First Name"),
        lname: joi.string().alphanum().min(3).max(10).required().label("Last Name")
    })

    let result = schema.validate({ fname, lname })
    if (result.error) {
        res.send(result);
    } else {
        const user = await data.findOne({ "email": req.body.email })
        if (user) {
            await data.updateOne(
                { email: user.email },
                {
                    $set:
                    {
                        "userName": req.body.uname,
                        "firstName": req.body.fname,
                        "lastName": req.body.lname,
                        "address": req.body.addr,
                        "pincode": req.body.pincode
                    }
                }
            )
            jwt.sign({ user }, key, { expiresIn: "1d" }, (err, token) => {
                err ? res.send("something went wrong") : res.send({ user, token: token, success: true, message: "data saved successfully" })
            })
        } else {
            res.send({ success: false, message: "Somthing Wrong" })
        }
    }
})

// Login Authentication api 
app.post("/login", async (req, res) => {
    if (req.body.password && req.body.email) {
        const email = req.body.email;
        const auth = await data.findOne({ "email": email })
        if (auth) {
            const pwdMatch = await encrypt.compare(req.body.password, auth.password);
            if (pwdMatch) {
                jwt.sign({ auth }, key, { expiresIn: "1d" }, (err, token) => {
                    err ? res.send("something went wrong") : res.send({ auth, token: token, id: auth._id })
                })
            }
            else {
                res.send({ result: "Password incorrect" })
            }
        } else {
            res.send({ result: "User not found" })
        }
    } else {
        res.send({ result: "Somthing wrong" })
    }
})
//forget password 
app.post("/forgot", async (req, res) => {
    const oneTimeOTP = generateOTP();
    const to = req.body.to;
    const user = await data.findOne({ "email": req.body.to })
    if (user) {
        await data.updateOne(
            { username: user.username },
            { $set: { "secretKey": oneTimeOTP } }
        );
        const subject = "Sending Email";
        const html = "<p>One Time OTP : <b>" + oneTimeOTP + "</b></p><br><p>To reset your password, visit the following address:</p><br><a href='http://localhost:3000/ChangePwd?email=" + req.body.to + "'>http://localhost:3000/ChangePwd</a>";
        const result = await sendMail(to, subject, html);
        res.send(result)
    } else {
        res.send({ message: "OTP is not inserted" })
    }
});

app.put("/changePwd", async (req, res) => {
    const ConOTP = req.body.otp;
    const user = await data.findOne({ "email": req.body.email })
    // res.send(user)
    if (ConOTP === user.secretKey) {
        try {
            if (req.body.password && req.body.email) {
                req.body.password = await encrypt.hash(req.body.password, 10);
                const user = await data.findOne({ "email": req.body.email })
                if (user) {
                    await data.updateOne(
                        { username: user.username },
                        { $set: { "password": req.body.password, "secretKey": "" } }
                    );
                    res.send({ success: true });
                }
                else {
                    res.send({ success: false, message: "User Not Found" })
                }
            } else {
                res.send({ success: false, message: "Not get data in body" })
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    } else {
        res.send({ success: false, message: "OTP are not Valid" })
    }
})
// get all users 
const verifyToken = (req, res, next) => {
    let token = req.headers['authorization']
    console.warn("called ", token);
    if (token) {
        jwt.verify(token, key, (err, valid) => {
            err ? res.send({ unauthorized: "invalid token" }) : next()
        })
    }
    else {
        res.send({ result: "provide a token from headers" })
    }
}

app.get("/users", verifyToken, async (req, res) => {
    const users = await data.find().select("-password");
    res.send(users);
})

app.get("/checkisvalid", verifyToken, async (req, res) => {
    res.send({ authorized: "You are Authorized" });
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destinationPath = path.join(__dirname, 'uploads');
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage, limits: { files: 5 } });
app.post('/upload', upload.single('files'), (req, res) => {
    console.log('File uploaded:', req.files);
    res.status(200).json({ message: 'File uploaded successfully.' });
});

app.post("/uploads", upload.array("files"), (req, res) => {
    const files = req.files;

    if (Array.isArray(files) && files.length > 0) {
        res.json(files);
    } else {
        throw new Error("File upload unsuccessful");
    }
});

app.get("/user", async (req, res) => {
    const str = req.query.str;
    if (str) {
        let list = await data.find({ $or: [{ "email": { $regex: new RegExp(str, 'i') } }, { "firstName": { $regex: new RegExp(str, 'i') } }, { "lastName": { $regex: new RegExp(str, 'i') } }] });
        res.send(list);
    } else {
        let list = await data.find();
        res.send(list);
    }
})

// app.get("/search", async (req, res) => {
//     let list = await data.find({"email":req.query.email});
//     res.send(list);
// })

app.post("/connectUser", async (req, res) => {
    // res.send(req.body);
    if (req.body.targetid && req.body.userid) {
        const finaldata = new network(req.body);
        const list=await network.findOne(req.body);
        if(list){
            await network.updateOne(
                { targetid: req.body.targetid },
                { $set: { "status": 1 } }
            )
            res.send({ success: true, message:"Connect User" });
        }else{
            network.insertMany(finaldata).then((e) => {
                res.send({ success: true, message: "data saved successfully" })
            }).catch((e) => {
                res.send({ error: e, success: false, message: "not sent connect request" })
            })
        }
    }
})

app.put("/leaveUser", async (req, res) => {
    const targetid = req.body.targetid;
    const userid = req.body.userid;
    const list = await network.find({ $and: [{ "userid": userid }, { "targetid": targetid }] });
    if (list) {
        await network.updateOne(
            { targetid: targetid },
            { $set: { "status": 0 } }
        )
        res.send({ success: true, message:"Leave User" });
    }else {
        res.send({ success: false, message: "Data Not Found" })
    }
})

app.get("/fetchconnect", async (req, res) => {
    let a = await network.find({ "userid": req.query.userid });
    res.send(a);
})

// app.get("/Userconnect",async(req,res)=>{
//     const list=await data.find();
//     res.send(list);
// })

app.listen(5500, () => console.log("server started..."))    