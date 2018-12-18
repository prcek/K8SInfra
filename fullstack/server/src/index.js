require('dotenv').config();


const { ApolloServer } = require('apollo-server');
const { typeDefs} = require('./schema');
const { AuthDirective,AccessDirective, createAuthContext } = require('./auth');


//const { createServer } = require('./utils');
const { createMockMongoStore } = require('./utils');
const { createDataSources } = require('./datasources');
const { createModels } = require('./models');

const resolvers = require('./resolvers');


async function start() {

    const mongostore =  await createMockMongoStore(createModels);
    const datasources = await createDataSources(mongostore);
    

    const admin_user = await datasources.userAPI.createUser({login:"admin",password:"secret",sudo:true});
    const admin_role = await datasources.roleAPI.createRole({name:"admin",rules:[{actions:["*"],resources:["*"]}]});
    const bind_result = await datasources.userAPI.bindRole({login:"admin", role:"admin"});
   
    console.log("default admin user created",admin_user);
    console.log("default role admin created",admin_role);
    console.log("bind admin role",bind_result);

    const server = new ApolloServer({ 
        typeDefs,
        resolvers,
        context: createAuthContext(mongostore),
        schemaDirectives: {
            auth:AuthDirective,
            access:AccessDirective,
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