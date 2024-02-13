const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    address: {
      type: String,
    },
    pincode:{
      type:String
    },
    birthdate: {
      type: Date,
    },
    profileImage: {
      type: String,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    secretKey:{
      type: String,
      unique: true
    }
  });
  
  
const data = mongoose.model("users" , userSchema);
module.exports =data