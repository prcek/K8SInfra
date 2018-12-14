const { gql } = require('apollo-server');

const typeDefs = gql`


  directive @auth(
    requires: Role = ADMIN,
  ) on OBJECT | FIELD_DEFINITION

  enum Role {
    ADMIN
    USER
    UNKNOWN
  }

  type Query {
    launches: [Launch]!
    launch(id: ID!): Launch
    # Queries for the current user
    me: User
    users: [User]! @auth(requires: ADMIN)
    notes: [Note]! @auth(requires: USER)
  }
  type Launch {
    id: ID!
    site: String
    mission: Mission
    rocket: Rocket
    isBooked: Boolean!
  }
  type Rocket {
    id: ID!
    name: String
    type: String
  }

  type Note {
    id: ID!
    note: String @auth(requires: ADMIN)
  }

  type User {
    id: ID!
    login: String!
  }

  type Mission {
    name: String
    missionPatch(size: PatchSize): String
  }

  enum PatchSize {
    SMALL
    LARGE
  }

  type Mutation {
    # if false, signup failed -- check errors
    bookTrips(launchIds: [ID]!): TripUpdateResponse!

    # if false, cancellation failed -- check errors
    cancelTrip(launchId: ID!): TripUpdateResponse!

    login(login: String! password: String!): LoginResponse!
    relogin(login: String): LoginResponse!
    createNote(note: String): Note! @auth(requires: USER)
    createUser(login: String! password: String!): User! @auth(requires: ADMIN)
  }

  type LoginResponse {
    success: Boolean!
    token: String
    user: User
    effective_user: User
  }

  type TripUpdateResponse {
    success: Boolean!
    message: String
    launches: [Launch]
  }
`

module.exports = { 
  typeDefs 
};

