

const { ApolloServer } = require('apollo-server');
const gql = require('graphql-tag');
const { AuthDirective,AccessDirective,createAuthContext } = require('../auth');
const { createMockMongoStore } = require('../utils');
const { createDataSources } = require('../datasources');
const { createModels } = require('../models');
const contextMock = jest.fn();
const {createTestClient} = require('apollo-server-testing');
let datasources;
let server;
let client;


const typeDefs = gql`
  directive @access(
    resources: [String],
    actions: [String] 
  ) on OBJECT | FIELD_DEFINITION


  type User {
    id: ID!
    login: String!
  }

   type Query {
    users: [User]! @access(resources:["users"],actions:["list"])
  }
 
`
const resolvers = {
    Query: {
        users: jest.fn()
    }
}


beforeAll(async ()=>{
    console.log("beforeAll")
    store = await createMockMongoStore(createModels);
    datasources = await createDataSources(store);
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
    test('loggedIn, loggedOut, authDirective', async () => {
        //expect(await client.query({query:gql`query me { me {login }}`})).not.toMatchObject({errors:expect.anything()})
        contextMock.mockReturnValue({loggedIn:false});
        const rs = await client.query({query:gql`query users { users {login }}`});
        expect(rs).toMatchObject({errors:expect.arrayContaining([expect.objectContaining({message:"not authorized"})])});
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

        //contextMock.mockReturnValue({loggedIn:true,effective_rules:[]});
        //resolvers.Query.users.mockReturnValue([]);
        //const rs3 = await client.query({query:gql`query users { users {login }}`});
        //expect(rs3).not.toMatchObject({errors:expect.anything()});
        //expect(rs3).toMatchObject({data:expect.objectContaining({users:[]})});
    });

})

