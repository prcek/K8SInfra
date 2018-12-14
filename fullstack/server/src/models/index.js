
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;




module.exports.createModels = async (mongoose_connection) => {


    const userSchema = new Schema({
        login: {type:String, index: true, unique: true},
        password: String,
    });
      
    const noteSchema = new Schema({
        note: String,
    });
      
    
    const UserModel = mongoose_connection.model('User',userSchema);
    const NoteModel = mongoose_connection.model('Note',noteSchema);
    


    return { 
        UserModel, NoteModel
    }
};