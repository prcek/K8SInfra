const { createMockMongoStore } = require('../../utils');
const { createAuthContext } = require('../../auth');

const UserAPI = require('../user');


let store;
let UserModel;
let userAPI;
let authContext;

beforeAll(async ()=>{
    console.log("beforeAll")
    store = await createMockMongoStore();
    UserModel = store.UserModel;
    userAPI = new UserAPI({ store });
    userAPI.initialize({ context: {  } });
    authContext = createAuthContext(store);
    //userAPI.initialize({ context: { loggedIn:true, user: { id: 0, roles:["ADMIN"] } } });
});

afterAll( async () => {
    store.mongoose_connection.close();
    store.mongod.stop();
    console.log("afterAll")
});


describe('[UserAPI]', () => {
    test('start empty', async ()=>{
        expect(await UserModel.countDocuments()).toEqual(0);
        expect(await userAPI.getAllUsers()).toEqual([]);
    });
    test('no me', async () => {
        expect(await userAPI.getMe()).toBeNull();
        //userAPI.initialize({ context: { loggedIn:true, user: { id: 0, roles:["ADMIN"] } } });
        //expect(await userAPI.getMe()).not.toBeNull();
        //expect(await noteAPI.createNote({note:"test"})).toMatchObject({note:"test"});
        //expect(await noteAPI.getAllNotes()).toContainEqual(expect.objectContaining({ note: "test", id: expect.anything() }));
     
    });
    test('create user', async () => {
        expect(await userAPI.createUser({login:"admin",password:"secret"})).toMatchObject({login:"admin"});
        const all_users = await userAPI.getAllUsers();
        expect(all_users).toEqual(expect.any(Array));
        expect(all_users).toHaveLength(1);
        expect(all_users).toContainEqual(expect.objectContaining({login:"admin",password:expect.any(String)}))
        expect(all_users[0].password).not.toEqual("secret");
        expect(all_users[0].password.length).toBeGreaterThan(10);
    });

    test('login user', async () => {
        expect(await userAPI.login({login:"missing login",password:"wrong password"})).toMatchObject({success:false});
        expect(await userAPI.login({login:"admin",password:"wrong password"})).toMatchObject({success:false});
        const lr = await userAPI.login({login:"admin",password:"secret"});
        expect(lr).toEqual(expect.objectContaining({success:true,token:expect.any(String),user:expect.objectContaining({id:expect.any(String),login:"admin"})}));   
        const ac = await authContext({req:{headers:{authorization:"Bearer "+lr.token}}});
        expect(ac).toMatchObject({loggedIn:true,user:{id:lr.user.id,login:"admin"}});
        userAPI.initialize({ context: ac});
        expect(await userAPI.getMe()).toMatchObject({login:"admin"});
    });
    test('login expired', async () =>{ 
        const lr = await userAPI.login({login:"admin",password:"secret"});
        expect(lr).toEqual(expect.objectContaining({success:true,token:expect.any(String),user:expect.objectContaining({id:expect.any(String),login:"admin"})}));   
        const realDateNow = Date.now.bind(global.Date);
        let now = new Date();
        now.setTime(now.getTime() + (61*60*1000));
        const dateNowStub = jest.fn(() => now.getTime());
        global.Date.now = dateNowStub;
        const ac = await authContext({req:{headers:{authorization:"Bearer "+lr.token}}});
        expect(ac).toMatchObject({loggedIn:false});
        userAPI.initialize({ context: ac});
        expect(await userAPI.getMe()).toBeNull();
        global.Date.now = realDateNow;
    });

    test('relogin',async ()=>{
        const lr = await userAPI.login({login:"admin",password:"secret"});
        expect(lr).toEqual(expect.objectContaining({success:true,token:expect.any(String),user:expect.objectContaining({id:expect.any(String),login:"admin"})}));
        const ac = await authContext({req:{headers:{authorization:"Bearer "+lr.token}}});
        expect(ac).toMatchObject({loggedIn:true,user:{id:lr.user.id,login:"admin"}});
        userAPI.initialize({ context: ac});
        const rlr = await userAPI.relogin({});
        expect(rlr).toEqual(expect.objectContaining({success:true,token:expect.any(String),user:expect.objectContaining({id:expect.any(String),login:"admin"})}));
    });


})