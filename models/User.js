import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type : String, required: true, unique: true},
    password: {type: String, required: true},
    notlp: {type: String, required: true},
    quiz : [{percoobaan:{type : Number} , quizname:{type : String}, score:{type : Number}}],
    suggestions:[{modulename : {type : String}, suggestion: {type : String}}]
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true }); 

const UserModel = mongoose.model("User", UserSchema);

export { UserModel as User };