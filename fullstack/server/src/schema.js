const { gql } = require('apollo-server');

const typeDefs = gql`


  directive @access(
    resources: [String],
    actions: [String] 
  ) on OBJECT | FIELD_DEFINITION

  directive @auth on OBJECT | FIELD_DEFINITION

  input RuleInput {
    resources:[String]
    actions:[String]
  }

  type Rule {
    resources:[String]
    actions:[String]
  }

  type Role {
    name: String!
    rules: [Rule]!
  }

  type Query {
    launches: [Launch]!
    launch(id: ID!): Launch
    # Queries for the current user
    me: User
    users: [User]! @access(resources:["users"],actions:["list"])
    notes: [Note]! @auth
    roles: [Role]! @access(resources:["roles"],actions:["list"])

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
    note: String @auth
  }

  type User {
    id: ID!
    login: String!
    sudo: Boolean
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
    createNote(note: String): Note! @auth
   
    createRole(name: String! rules:[RuleInput]!): Role! 
    updateRole(name: String! rules:[RuleInput]!): Role! 
    deleteRole(name: String!): Response 
   
    createUser(login: String! password: String!, sudo:Boolean): User! @access(resources:["users"],actions:["new"])
    bindRole(login:String! role:String): Response 
    unbindRole(login:String! role:String): Response
  }

  type Response {
    success: Boolean!
    error_message: String
  }

  type LoginResponse {
    success: Boolean!
    token: String
    user: User
    effective_user: User
    effective_rules: [Rule]
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

