module.exports = {
    Query: {
      me: async (_, __, { dataSources }) =>
        dataSources.userAPI.getMe(),
      notes: async (_, __, { dataSources }) =>
        dataSources.noteAPI.getAllNotes(),
      users: async (_, __, { dataSources }) =>
        dataSources.userAPI.getAllUsers(),
    },
    Mutation: {
      createNote: async (_, { note }, { dataSources }) => {
        return dataSources.noteAPI.createNote({ note });
      },
      createUser: async (_, { login, password }, { dataSources }) => {
        return dataSources.userAPI.createUser({ login,password });
      },
      login: async (_, { login, password }, { dataSources }) => 
        dataSources.userAPI.login({ login,password }), 
    }
  };
  