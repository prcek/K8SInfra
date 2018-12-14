
const UserAPI = require('./user');
const NoteAPI = require('./note');
const RoleAPI = require('./role');


module.exports.createDataSources = async (store) => {
   return { 
        userAPI: new UserAPI({ store }),
        noteAPI: new NoteAPI({ store }),
        roleAPI: new RoleAPI({ store })
    }
};