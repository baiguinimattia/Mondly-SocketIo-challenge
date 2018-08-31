var mongoose = require("mongoose")

var RoomSchema  = new mongoose.Schema({
        name : {type : String , default : "name"},
        roomNo : Number ,
        sockets : Array,
        pressedReady : { type: Number, default: 0 },
        games : Array,
        state : {type : Boolean , default : false}
});

module.exports = mongoose.model("Room" , RoomSchema);