import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
    username : {type : String, required: true, unique : true},
    password : {type : String, required: true}
})

AdminSchema.index({ username: 1 }, { unique: true });

const AdminModel = mongoose.model("Admin", AdminSchema)


export {AdminModel as Admin}