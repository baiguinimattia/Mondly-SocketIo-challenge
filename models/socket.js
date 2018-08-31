var mongoose = require("mongoose")

var SocketSchema  = new mongoose.Schema({
    username : String,
    roomNo : Number,
    socketId : String,
    nativeLanguage : { type: String, default: 'English' },
    learningLanguage : { type: String, default: 'English' },
    hasLeft : { type: Boolean, default: false },
    points : {type : Number , default : 0},
    currentGame : {type : Number , default : 0}
});

module.exports = mongoose.model("Socket" , SocketSchema);