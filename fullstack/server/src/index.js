require('dotenv').config();


const { ApolloServer } = require('apollo-server');
const { typeDefs} = require('./schema');
const { AuthDirective,createAuthContext } = require('./auth');


const { createStore } = require('./utils');
const { createMockMongoStore } = require('./utils');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');
const NoteAPI = require('./datasources/note');
const resolvers = require('./resolvers');


async function start() {

    const store = createStore();
    const mongostore =  await createMockMongoStore();
    const server = new ApolloServer({ 
        typeDefs,
        resolvers,
        context: createAuthContext(mongostore),
        schemaDirectives: {
            auth:AuthDirective
        },
        dataSources: () => ({
            launchAPI: new LaunchAPI(),
            userAPI: new UserAPI({ store:mongostore }),
            noteAPI: new NoteAPI({ store:mongostore }),
        }),
    });
    const {url} = await server.listen();
    console.log(`🚀 Server ready at  ${url}`);
    return "ok";

}

start().then(ok=>{
    //console.log("started")
})

/*
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at  ${url}`);
});
*/