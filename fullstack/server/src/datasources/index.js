
const UserAPI = require('./user');
const NoteAPI = require('./note');


module.exports.createDataSources = async (store) => {
   return { 
        userAPI: new UserAPI({ store }),
        noteAPI: new NoteAPI({ store })
    }
};