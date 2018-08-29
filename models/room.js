var mongoose = require("mongoose")

var RoomSchema  = new mongoose.Schema({
        name : String,
        roomNo : Number ,
        sockets : Array
});

module.exports = mongoose.model("Room" , RoomSchema);