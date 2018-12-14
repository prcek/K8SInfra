
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;




module.exports.createModels = async (mongoose_connection) => {


    const roleSchema = new Schema({
        name: {type:String, index: true, unique: true},
        rules: [{resources:[String], actions:[String]}],
    });


    const userSchema = new Schema({
        login: {type:String, index: true, unique: true},
        password: String,
        roles: [String],
    });
      
    const noteSchema = new Schema({
        note: String,
    });
      
    
    const UserModel = mongoose_connection.model('User',userSchema);
    const NoteModel = mongoose_connection.model('Note',noteSchema);
    const RoleModel = mongoose_connection.model('Role',roleSchema);
    


    return { 
        UserModel, NoteModel, RoleModel
    }
};