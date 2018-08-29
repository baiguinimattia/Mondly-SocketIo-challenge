var mongoose = require("mongoose")

var SocketSchema  = new mongoose.Schema({
    username : String,
    roomNo : { type: Number, default: -1 },
    socketId : String,
    nativeLanguage : { type: String, default: 'English' },
    learningLanguage : { type: String, default: 'English' },
    hasLeft : { type: Boolean, default: false },
});

module.exports = mongoose.model("Socket" , SocketSchema);