var mongoose = require("mongoose")

var ExerciseSchema  = new mongoose.Schema({
    indicator : Number,
    type : { type: String, default: 'vocabulary' },
    instruction : {type : String , default : "Fill in the blanks with the most appropriate option."},
    statement : String,
    variants : Array,
    worth : { type: Number, default: 9 },
    response : String,
    extra : String
});

module.exports = mongoose.model("Exercise" , ExerciseSchema);