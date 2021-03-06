const { createMockMongoStore } = require('../../utils');
const { createAuthContext } = require('../../auth');
const { createModels } = require('../../models');

const UserAPI = require('../user');
const RoleAPI = require('../role');


let store;
let UserModel;
let userAPI;
let roleAPI;
let authContext;

beforeAll(async ()=>{
    console.log("beforeAll")
    store = await createMockMongoStore(createModels);
    UserModel = store.UserModel;
    userAPI = new UserAPI({ store });
    userAPI.initialize({ context: {  } });
    roleAPI = new RoleAPI({ store });
    roleAPI.initialize({ context: {  } });
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
        expect(lr).toEqual(expect.objectContaining({
            success:true,
            token:expect.any(String),
            user:expect.objectContaining({id:expect.any(String),login:"admin"}),
            effective_user:expect.objectContaining({id:expect.any(String),login:"admin"}),
            effective_rules:expect.any(Array)
        }));   
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

    test('relogin #2',async ()=>{
        expect(await userAPI.createUser({login:"root",password:"secret"})).toMatchObject({login:"root"});
        const lr = await userAPI.login({login:"root",password:"secret"});
        expect(lr).toEqual(expect.objectContaining({success:true,token:expect.any(String),user:expect.objectContaining({id:expect.any(String),login:"root"})}));
        const ac = await authContext({req:{headers:{authorization:"Bearer "+lr.token}}});
        expect(ac).toMatchObject({loggedIn:true,user:{id:lr.user.id,login:"root"}});
        userAPI.initialize({ context: ac});
        expect(await userAPI.deleteUser({login:"root"})).toMatchObject({success:true});  
        const rlr = await userAPI.relogin({});
        expect(rlr).toEqual(expect.objectContaining({success:false}));
        expect(await userAPI.deleteUser({login:"root"})).toMatchObject({success:false});  
    });

    test('sudo relogin',async ()=>{
        expect(await userAPI.createUser({login:"power",password:"secret", sudo:true})).toMatchObject({login:"power"});
        expect(await userAPI.createUser({login:"bfu",password:"dummy"})).toMatchObject({login:"bfu"});

        const lr = await userAPI.login({login:"power",password:"secret"});
        expect(lr).toEqual(expect.objectContaining({success:true,token:expect.any(String),user:expect.objectContaining({id:expect.any(String),login:"power"}),effective_user:expect.objectContaining({id:expect.any(String),login:"power"})}));
        let ac = await authContext({req:{headers:{authorization:"Bearer "+lr.token}}});
        expect(ac).toMatchObject({loggedIn:true,user:{id:lr.user.id,login:"power"},effective_user:{id:lr.user.id,login:"power"}});
        userAPI.initialize({ context: ac});
        let rlr = await userAPI.relogin({login:"bfu"});        
        expect(rlr).toEqual(expect.objectContaining({success:true,user:expect.objectContaining({id:expect.any(String),login:"power"}),effective_user:expect.objectContaining({id:expect.any(String),login:"bfu"})}));

        ac = await authContext({req:{headers:{authorization:"Bearer "+rlr.token}}});
        expect(ac).toMatchObject({loggedIn:true,user:{id:lr.user.id,login:"power"},effective_user:{id:rlr.effective_user.id,login:"bfu"}});
        userAPI.initialize({ context: ac});

        rlr = await userAPI.relogin({});        
        expect(rlr).toEqual(expect.objectContaining({success:true,user:expect.objectContaining({id:lr.user.id,login:"power"}),effective_user:expect.objectContaining({id:expect.any(String),login:"bfu"})}));

        rlr = await userAPI.relogin({login:"missing_user"});        
        expect(rlr).toEqual(expect.objectContaining({success:false}));


        rlr = await userAPI.relogin({login:"power"});        
        expect(rlr).toEqual(expect.objectContaining({success:true,user:expect.objectContaining({id:expect.any(String),login:"power"}),effective_user:expect.objectContaining({id:lr.user.id,login:"power"})}));

    });




    test('role binding', async ()=>{
        expect(await userAPI.unbindRole({login:"joe", role:"tester"})).toMatchObject({success:false});
        expect(await userAPI.createUser({login:"joe",password:"secret"})).toMatchObject({login:"joe"});
        expect(await userAPI.unbindRole({login:"joe", role:"tester"})).toMatchObject({success:false});
        expect(await roleAPI.createRole({name:"tester",rules:[{actions:["view"],resources:["tests"]}]})).toMatchObject({name:"tester"});
        expect(await userAPI.bindRole({login:"joe", role:"tester"})).toMatchObject({success:true});
      
        expect(await roleAPI.createRole({name:"auditor",rules:[{actions:["view"],resources:["audits"]}]})).toMatchObject({name:"auditor"});
        expect(await userAPI.bindRole({login:"joe", role:"auditor"})).toMatchObject({success:true});
      

        const lr = await userAPI.login({login:"joe",password:"secret"});
        expect(lr).toEqual(expect.objectContaining({success:true,token:expect.any(String),
            user:expect.objectContaining({id:expect.any(String),login:"joe"}),
            effective_user:expect.objectContaining({id:expect.any(String),login:"joe"}),
            effective_rules:expect.arrayContaining([expect.objectContaining({
                actions:expect.arrayContaining(['view']),
                resources:expect.arrayContaining(['audits']) })]),
        }));   

        expect(await userAPI.unbindRole({login:"joe", role:"tester"})).toMatchObject({success:true});
        expect(await userAPI.unbindRole({login:"joe", role:"auditor"})).toMatchObject({success:true});
        expect(await userAPI.unbindRole({login:"joe", role:"tester"})).toMatchObject({success:false});
        expect(await userAPI.unbindRole({login:"joe", role:"auditor"})).toMatchObject({success:false});

        expect(await userAPI.bindRole({login:"missing_user", role:"auditor"})).toMatchObject({success:false});
        expect(await userAPI.bindRole({login:"joe", role:"missing_role"})).toMatchObject({success:false});

    });


})