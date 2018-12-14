module.exports = {
    Query: {
      me: async (_, __, { dataSources }) =>
        dataSources.userAPI.getMe(),
      notes: async (_, __, { dataSources }) =>
        dataSources.noteAPI.getAllNotes(),
      users: async (_, __, { dataSources }) =>
        dataSources.userAPI.getAllUsers(),
      roles: async (_, __, { dataSources }) =>
        dataSources.roleAPI.getAllRoles(),
    },
    Mutation: {
      createNote: async (_, { note }, { dataSources }) => {
        return dataSources.noteAPI.createNote({ note });
      },
      createUser: async (_, { login, password }, { dataSources }) => {
        return dataSources.userAPI.createUser({ login,password });
      },
      createRole: async (_, { name, rules }, { dataSources }) => {
        return dataSources.roleAPI.createRole({ name,rules });
      },
      login: async (_, { login, password }, { dataSources }) => 
        dataSources.userAPI.login({ login,password }), 
      relogin: async (_, { login }, { dataSources }) => 
        dataSources.userAPI.relogin({ login }), 

      }
  };
  