

const { ApolloServer } = require('apollo-server');
const gql = require('graphql-tag');
const { typeDefs} = require('../schema');
const { AuthDirective,AccessDirective,  createAuthContext } = require('../auth');
const { createMockMongoStore } = require('../utils');
const { createDataSources } = require('../datasources');
const { createModels } = require('../models');
const resolvers = require('../resolvers');
const contextMock = jest.fn();
const {createTestClient} = require('apollo-server-testing');
let mongostore;
let datasources;
let server;
let client;
/*
const constructTestServer = async ({ context = defaultContext } = {}) => {
   

    mongostore =  await createMockMongoStore();
    const datasources = await createDataSources(mongostore);


    server = new ApolloServer({
      typeDefs,
      resolvers,
      dataSources: () => datasources,
      context,
    });
  
};
  */

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
            access: AccessDirective,
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
        contextMock.mockReturnValue({loggedIn:true, effective_rules:[{resources:["*"],actions:["*"]}]});
        const rs2 = await client.query({query:gql`query users { users {login }}`});
        expect(rs2).not.toMatchObject({errors:expect.anything()});
        expect(rs2).toMatchObject({data:expect.objectContaining({users:[]})});
    });

})

