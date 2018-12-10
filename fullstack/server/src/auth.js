

const { gql, SchemaDirectiveVisitor } = require('apollo-server');
const { defaultFieldResolver } = require("graphql");
class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    this.ensureFieldsWrapped(type);
    type._requiredAuthRole = this.args.requires;
  }
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRole = this.args.requires;
  }
  ensureFieldsWrapped(objectType) {
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;
    const fields = objectType.getFields();
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      field.resolve = async function (...args) {
        console.log("wrapped field resolver");
        return resolve.apply(this, args);
      }
    });
  }
}

const createAuthContext = (store) => {
    return async ({req}) => {
        const auth = (req.headers && req.headers.authorization) || '';
        const notes = await store.NoteModel.find({});
        return { auth:true };
    };
}

  

module.exports = { 
    AuthDirective,
    createAuthContext,
};
  
