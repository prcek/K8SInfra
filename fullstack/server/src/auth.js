

const { SchemaDirectiveVisitor } = require('apollo-server');
const { defaultFieldResolver } = require("graphql");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'iddqd';

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    type._requiredAuthRole = this.args.requires;
    this.ensureFieldsWrapped(type);
  }
  visitFieldDefinition(field, details) {
    field._requiredAuthRole = this.args.requires;
    this.ensureFieldsWrapped(details.objectType);
  }
  ensureFieldsWrapped(objectType) {
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;
    const fields = objectType.getFields();
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      const requiredRole = field._requiredAuthRole || objectType._requiredAuthRole;
      if (requiredRole) {
        field.description += `@auth ${requiredRole}`;
        field.resolve = async function (...args) {
          const context = args[2];
          //TODO check  - requiredRole
          if (! context.loggedIn ) {
            throw new Error("not authorized");
          }
          return resolve.apply(this, args);
        }
      }
    });
  }
}

const createAuthContext = (store) => {
    return async ({req}) => {
        let token = null; 

        if ( req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
          token =  req.headers.authorization.split(' ')[1];
        } else {  
           //TODO cookie or query 
        }
        
        if (token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return { loggedIn: true, user: decoded.user};
          } catch(err) {

          }
        }

        return { loggedIn:false };
    };
}

  

module.exports = { 
    AuthDirective,
    createAuthContext,
};
  
