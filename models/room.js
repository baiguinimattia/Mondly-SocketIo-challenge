var mongoose = require("mongoose")

var RoomSchema  = new mongoose.Schema({
        name : {type : String , default : "name"},
        roomNo : Number ,
        sockets : Array,
        pressedReady : { type: Number, default: 0 },
});

module.exports = mongoose.model("Room" , RoomSchema);