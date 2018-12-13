require('dotenv').config();


const { ApolloServer } = require('apollo-server');
const { typeDefs} = require('./schema');
const { AuthDirective,createAuthContext } = require('./auth');


//const { createServer } = require('./utils');
const { createMockMongoStore } = require('./utils');
const { createDataSources } = require('./datasources');

const resolvers = require('./resolvers');


async function start() {

    const mongostore =  await createMockMongoStore();
    const datasources = await createDataSources(mongostore);
    

    const admin_user = await datasources.userAPI.createUser({login:"admin",password:"secret"});

    console.log("default admin user created",admin_user);
    const server = new ApolloServer({ 
        typeDefs,
        resolvers,
        context: createAuthContext(mongostore),
        schemaDirectives: {
            auth:AuthDirective
        },
        dataSources: ()=>datasources,
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