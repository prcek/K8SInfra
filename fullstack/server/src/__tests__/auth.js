

const { ApolloServer } = require('apollo-server');
const gql = require('graphql-tag');
const { AuthDirective,AccessDirective,createAuthContext } = require('../auth');
const { createMockMongoStore } = require('../utils');
const { createDataSources } = require('../datasources');
const { createModels } = require('../models');
const contextMock = jest.fn();
const {createTestClient} = require('apollo-server-testing');
let datasources;
let authContext;
let server;
let client;


const typeDefs = gql`
  directive @access(
    resources: [String],
    actions: [String] 
  ) on OBJECT | FIELD_DEFINITION

  directive @auth on OBJECT | FIELD_DEFINITION

  type User {
    id: ID!
    login: String!
  }

   type Query {
    users: [User]! @access(resources:["users"],actions:["list"])
    me: User! @auth
    hello: String 
  }
 
`
const resolvers = {
    Query: {
        users: jest.fn(),
        me:jest.fn(),
        hello:jest.fn()
    }
}


beforeAll(async ()=>{
    console.log("beforeAll")
    store = await createMockMongoStore(createModels);
    datasources = await createDataSources(store);
    authContext = createAuthContext(store);
    server = new ApolloServer({
        typeDefs,
        resolvers,
        dataSources: () => datasources,
        context:contextMock,
        schemaDirectives: {
            auth:AuthDirective,
            access:AccessDirective
        },
      });
    client = createTestClient(server);
});

afterAll( async () => {
    store.mongoose_connection.close();
    store.mongod.stop();
    console.log("afterAll")
});


describe('[integration]',  () => {
    test('loggedIn, loggedOut, accessDirective, authDirective', async () => {
        contextMock.mockReturnValue({loggedIn:false});
        resolvers.Query.me.mockReturnValue({id:"0", login:"user"});
        const rs = await client.query({query:gql`query users { users {login }}`});
        expect(rs).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"not authorized"})])});
        contextMock.mockReturnValue({loggedIn:false});
        const rs2 = await client.query({query:gql`query me { me { login } }`});
        expect(rs2).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"not authorized"})])});
        contextMock.mockReturnValue({loggedIn:false});
        resolvers.Query.hello.mockReturnValue("kitty");
        const rs3 = await client.query({query:gql`query me { hello }`});
        expect(rs3).toMatchObject({data:{hello:"kitty"}});

        contextMock.mockReturnValue({loggedIn:true});
        expect(await client.query({query:gql`query users { users {login }}`})).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["view"],resources:["roles"]}]});
        resolvers.Query.users.mockReturnValue([]);
        expect(await client.query({query:gql`query users { users {login }}`})).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(0);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["list"],resources:["roles"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(0);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["view"],resources:["users"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(0);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["list"],resources:["users"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).not.toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(1);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["list","delete"],resources:["users"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).not.toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(2);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["list","delete"],resources:["roles","users"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).not.toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(3);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["list"],resources:["note"]},{actions:["list","delete"],resources:["roles","users"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).not.toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(4);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["list"],resources:["note"]},{actions:["delete"],resources:["roles","users"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(4);


        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["list","delete"],resources:["*"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).not.toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(5);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["*"],resources:["users"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).not.toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(6);

        contextMock.mockReturnValue({loggedIn:true,effective_rules:[{actions:["*"],resources:["*"]}]});
        expect(await client.query({query:gql`query users { users {login }}`})).not.toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(7);
 
    });


    test('create user, create role, bind role, login, check access', async () => {
        expect(await datasources.userAPI.createUser({login:"admin",password:"secret"})).toMatchObject({login:"admin"});
        expect(await datasources.roleAPI.createRole({name:"auditor",rules:[{actions:["list"],resources:["users"]}]})).toMatchObject({name:"auditor"});
        expect(await datasources.userAPI.bindRole({login:"admin", role:"auditor"})).toMatchObject({success:true});



        const lr = await datasources.userAPI.login({login:"admin",password:"secret"});
        expect(lr).toEqual(expect.objectContaining({
            success:true,
            token:expect.any(String),
            user:expect.objectContaining({id:expect.any(String),login:"admin"}),
            effective_user:expect.objectContaining({id:expect.any(String),login:"admin"}),
            effective_rules:expect.any(Array)
        }));   
        const ac = await authContext({req:{headers:{authorization:"Bearer "+lr.token}}});
        contextMock.mockReturnValue(ac);
        resolvers.Query.users.mockReset();
        resolvers.Query.users.mockReturnValue([]);
        expect(await client.query({query:gql`query users { users {login }}`})).not.toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(1);

        expect(await datasources.userAPI.unbindRole({login:"admin", role:"auditor"})).toMatchObject({success:true});


        const lr2 = await datasources.userAPI.relogin({});
        expect(lr2).toEqual(expect.objectContaining({
            success:true,
            token:expect.any(String),
            user:expect.objectContaining({id:expect.any(String),login:"admin"}),
            effective_user:expect.objectContaining({id:expect.any(String),login:"admin"}),
            effective_rules:expect.any(Array)
        }));   
        const ac2 = await authContext({req:{headers:{authorization:"Bearer "+lr2.token}}});
        contextMock.mockReturnValue(ac2);
        expect(await client.query({query:gql`query users { users {login }}`})).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"access denied"})])});
        expect(resolvers.Query.users.mock.calls.length).toBe(1);

    });

})

