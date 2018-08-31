var mongoose = require("mongoose")

var LeaderboardSchema  = new mongoose.Schema({
    username : String,
    points : {type : Number , default : 0}
});

module.exports = mongoose.model("Leaderboard" , LeaderboardSchema);