module.exports = {
    Query: {
      launches: async (_, __, { dataSources }) =>
        dataSources.launchAPI.getAllLaunches(),
      launch: (_, { id }, { dataSources }) =>
        dataSources.launchAPI.getLaunchById({ launchId: id }),
      me: async (_, __, { dataSources }) =>
        dataSources.userAPI.findOrCreateUser(),
      notes: async (_, __, { dataSources }) =>
        dataSources.noteAPI.getAllNotes(),
    },
    Mutation: {
      createNote: async (_, { note }, { dataSources }) => {
        const new_note = await dataSources.noteAPI.createNote({ note });
        return {
          id: new_note.id,
          note: new_note.note
        };
      }
    }
  };
  