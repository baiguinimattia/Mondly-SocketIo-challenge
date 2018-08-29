var mongoose = require("mongoose")
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema  = new mongoose.Schema({
    username: String,
    password : String,
    nativeLanguage : { type: String, default: 'English' },
    learningLanguage: String
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User" , UserSchema);