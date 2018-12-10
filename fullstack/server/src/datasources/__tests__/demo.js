


const { createMockMongoStore } = require('../../utils');
const NoteAPI = require('../note');



let store;
let UserModel;
let NoteModel;
let noteAPI;



beforeAll(async ()=>{
    console.log("beforeAll")
    store = await createMockMongoStore();
    UserModel = store.UserModel;
    NoteModel = store.NoteModel;
    noteAPI = new NoteAPI({ store });
    noteAPI.initialize({ context: { loggedIn:true, user: { id: 0, roles:["ADMIN"] } } });
});

afterAll( async () => {
    store.mongoose.disconnect();
    store.mongod.stop();
    console.log("afterAll")
});
  


describe('[Mongoose UserModel]',  () => {
    test('UserModel.count is 0', async () => {
        expect(await UserModel.countDocuments()).toEqual(0);
    });
    test('new UserModel', async () => {
        var user = await UserModel.create({login:"foo",password:"bar"});
        expect(user).toMatchObject({login:"foo",password:"bar"});
        //expect(user).not.toHaveProperty('_id');
        //expect(user).not.toHaveProperty('id');
        expect(await UserModel.countDocuments()).toEqual(1);
    });
  
    test('UserModel.count is 1', async () => {
        await expect(UserModel.countDocuments()).resolves.toEqual(1);
    });

    test('new UserModel - duplicate login', async () => {
        await expect(UserModel.create({login:"foo",password:"bar"}) ).rejects.toThrow();
        expect( await UserModel.countDocuments()).toEqual(1);
    });

    test('UserModel.count is still 1', async () => {
        expect(await UserModel.countDocuments()).toEqual(1);
    });

})

describe('[NoteAPI]',  () => {
    test('NoteAPI.notes is []', async () => {
        expect(await noteAPI.getAllNotes()).toEqual([]);
    });
    
    test('NoteAPI new note', async () => {
        expect(await noteAPI.createNote({note:"test"})).toMatchObject({note:"test"});
        expect(await noteAPI.getAllNotes()).toContainEqual(expect.objectContaining({ note: "test", id: expect.anything() }));
    });
    
})
