

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
          //TODO check  - effective_user requiredRole 
          if (! context.loggedIn ) {
            throw new Error("not authorized");
          }
          return resolve.apply(this, args);
        }
      }
    });
  }
}


class AccessDirective extends SchemaDirectiveVisitor {
  visitObject(type) {
    type._requiredActions = this.args.actions;
    type._requiredResources = this.args.resources;
    this.ensureFieldsWrapped(type);
  }
  visitFieldDefinition(field, details) {
    field._requiredActions = this.args.actions;
    field._requiredResources = this.args.resources;
    this.ensureFieldsWrapped(details.objectType);
  }
  ensureFieldsWrapped(objectType) {
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;
    const fields = objectType.getFields();
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      const requiredActions = field._requiredActions || objectType._requiredActions;
      const requiredResources = field._requiredResources || objectType._requiredResources;
      if (requiredActions || requiredResources) {
        field.description += `@access resources: ${requiredResources} actions: ${requiredActions}`;
        field.resolve = async function (...args) {
          const context = args[2];
          if (! context.loggedIn ) {
            throw new Error("not authorized");
          }
          //console.log(`@access resources: ${requiredResources} actions: ${requiredActions}`);

          if (! context.effective_rules ) {
            throw new Error("access denied");
          }
          //find resource in context.effective_rules
          //then check action
          const rrules = context.effective_rules.filter((r)=>{ 
            const rc = requiredResources.every(i=>r.resources.includes(i));
            const ac = requiredActions.every(i=>r.actions.includes(i));
            return rc && ac;
          });
          if (rrules.length==0) {
            throw new Error("access denied");
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
    AccessDirective,
    createAuthContext,
};
  
