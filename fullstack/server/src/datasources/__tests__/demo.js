


const { createMockMongoStore } = require('../../utils');

let store;
let UserModel;
let NoteModel;

beforeAll(async ()=>{
    console.log("beforeAll")
    store = await createMockMongoStore();
    UserModel = store.UserModel;
    NoteMode = store.NoteModel;
});

afterAll( async () => {
    store.mongoose.disconnect();
    store.mongod.stop();
    console.log("afterAll")
});
  


describe('[DemoAPI.Mongoose 1]',  () => {
    test('UserModel.count is 0', async () => {
        expect(await UserModel.countDocuments()).toEqual(0);
    });
    it('new UserModel', async () => {
        var user = await UserModel.create({login:"foo",password:"bar"});
        expect(user).toMatchObject({login:"foo",password:"bar"});
        //expect(user).not.toHaveProperty('_id');
        //expect(user).not.toHaveProperty('id');
        expect(await UserModel.countDocuments()).toEqual(1);
    });
  
    it('UserModel.count is 1', async () => {
        await expect(UserModel.countDocuments()).resolves.toEqual(1);
    });

    it('new UserModel - duplicate login', async () => {
        await expect(UserModel.create({login:"foo",password:"bar"}) ).rejects.toThrow();
        expect( await UserModel.countDocuments()).toEqual(1);
    });

    it('UserModel.count is still 1', async () => {
        expect(await UserModel.countDocuments()).toEqual(1);
    });

})

