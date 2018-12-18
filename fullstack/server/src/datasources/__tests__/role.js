const { createMockMongoStore } = require('../../utils');
const { createAuthContext } = require('../../auth');
const { createModels } = require('../../models');

const RoleAPI = require('../role');


let store;
let roleAPI;

beforeAll(async ()=>{
    console.log("beforeAll")
    store = await createMockMongoStore(createModels);
    roleAPI = new RoleAPI({ store });
    roleAPI.initialize({ context: {  } });
});

afterAll( async () => {
    store.mongoose_connection.close();
    store.mongod.stop();
    console.log("afterAll")
});


describe('[RoleAPI]', () => {
    test('start empty', async ()=>{
        expect(await store.RoleModel.countDocuments()).toEqual(0);
        expect(await roleAPI.getAllRoles()).toEqual([]);
    });
    test('create role', async () => {
        expect(await roleAPI.createRole({name:"admin",rules:[{actions:["delete","view"],resources:["roles"]}]})).toMatchObject({name:"admin"});
        const all_roles = await roleAPI.getAllRoles();
        expect(all_roles).toEqual(expect.any(Array));
        expect(all_roles).toHaveLength(1);
        expect(all_roles).toContainEqual(expect.objectContaining({name:"admin"}))
        await expect(roleAPI.createRole({name:"admin",rules:[{actions:["delete","view"],resources:["roles"]}]}) ).rejects.toThrow();
    });
   
    test('update role', async () => {
        expect(await roleAPI.createRole({name:"user",rules:[{actions:["view"],resources:["roles"]}]})).toMatchObject({name:"user"});
        expect(await roleAPI.updateRole({name:"user",rules:[{actions:["view","update"],resources:["roles"]}]})).toMatchObject({name:"user"});
        const all_roles = await roleAPI.getAllRoles();
        expect(all_roles).toEqual(expect.any(Array));
        expect(all_roles).toContainEqual(expect.objectContaining({
                name:"user",
                rules:expect.arrayContaining([expect.objectContaining({
                    resources:expect.arrayContaining(["roles"]),
                    actions:expect.arrayContaining(["view","update"]),
                })])
        }));

        expect(await roleAPI.updateRole({name:"missing_user",rules:[{actions:["view","update"],resources:["roles"]}]})).toMatchObject({success:false});

    });

    test('delete role', async () => {
        const all_roles = await roleAPI.getAllRoles();
        expect(await roleAPI.createRole({name:"dummy",rules:[{actions:["view"],resources:["roles"]}]})).toMatchObject({name:"dummy"});
        expect(await roleAPI.getAllRoles()).toHaveLength(all_roles.length+1);
        expect(await roleAPI.deleteRole({name:"dummy"})).toMatchObject({success:true});
        expect(await roleAPI.getAllRoles()).toHaveLength(all_roles.length);
        expect(await roleAPI.deleteRole({name:"dummy"})).toMatchObject({success:false});
    });





})