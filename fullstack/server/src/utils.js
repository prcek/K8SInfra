const  {MongoMemoryServer}  = require('mongodb-memory-server');


const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports.paginateResults = ({
  after: cursor,
  pageSize = 20,
  results,
  // can pass in a function to calculate an item's cursor
  getCursor = () => null,
}) => {
  if (pageSize < 1) return [];

  if (!cursor) return results.slice(0, pageSize);
  const cursorIndex = results.findIndex(item => {
    // if an item has a `cursor` on it, use that, otherwise try to generate one
    let itemCursor = item.cursor ? item.cursor : getCursor(item);

    // if there's still not a cursor, return false by default
    return itemCursor ? cursor === itemCursor : false;
  });

  return cursorIndex >= 0
    ? cursorIndex === results.length - 1 // don't let us overflow
      ? []
      : results.slice(
          cursorIndex + 1,
          Math.min(results.length, cursorIndex + 1 + pageSize),
        )
    : results.slice(0, pageSize);

  results.slice(cursorIndex >= 0 ? cursorIndex + 1 : 0, cursorIndex >= 0);
};


module.exports.createMockMongoStore = async (createModels) => {

  const mongod = new MongoMemoryServer();


  const mongoUri = await mongod.getConnectionString();
  const port = await mongod.getPort();
  const dbPath = await mongod.getDbPath();
  const dbName = await mongod.getDbName();

  const mongooseOpts = { // options for mongoose 4.11.3 and above
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    //useMongoClient: true, // remove this line if you use mongoose 5 and above
    useNewUrlParser: true,
    useCreateIndex: true,
  };


  let mongoose_connection = await mongoose.createConnection(mongoUri, mongooseOpts);
  console.log(`MongoDB successfully connected to ${mongoUri}`);
  /*
  mongoose_connection.on('error', (e) => {
    if (e.message.code === 'ETIMEDOUT') {
      console.log(e);
      //mongoose.connect(mongoUri, mongooseOpts);
    }
    console.log(e);
  });

  mongoose_connection.once('open', () => {
    console.log(`MongoDB successfully connected to ${mongoUri}`);
  });
  */

  //const ret = await mongoose.connect(mongoUri,mongooseOpts);
  var admin = new mongoose.mongo.Admin(mongoose_connection.db);
  const info = await admin.buildInfo();
  console.log(`mongodb version ${info.version}`);

/*
  const userSchema = new mongoose.Schema({
    login: {type:String, index: true, unique: true},
    password: String,
  });
  
  const noteSchema = new mongoose.Schema({
    note: String,
  });
  

  const UserModel = mongoose_connection.model('User',userSchema);
  const NoteModel = mongoose_connection.model('Note',noteSchema);
*/
  const models = await createModels(mongoose_connection);

  return {...models,mongod,mongoose_connection};


};


