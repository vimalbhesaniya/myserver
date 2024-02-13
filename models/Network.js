const mongoose = require("mongoose");

const networkSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
      },
      targetid: {
        type:String,
        required:true
      },
      status:{
        type:Number,
        // required:true
        enum : [0,1],
        default:1
      }
});
const network = mongoose.model("networks", networkSchema);
module.exports = network