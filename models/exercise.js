var mongoose = require("mongoose")

var ExerciseSchema  = new mongoose.Schema({
    type : { type: String, default: 'Choose' },
    statement : String,
    variants : Array,
    worth : { type: Number, default: 9 },
    response : String,
    extra : String
});

module.exports = mongoose.model("Exercise" , ExerciseSchema);