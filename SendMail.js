const express = require("express");
var nodemailer = require('nodemailer');
const app = express()

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vishalagajera@gmail.com',
    pass: 'aiwzyftarolruzpp'
  }
});

var mailOptions = {
  from: 'vishalagajera@gmail.com',
  to: 'ritalibhimani@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 500');
});