const { DataSource } = require('apollo-datasource');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'iddqd';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

class UserAPI extends DataSource {
  constructor({ store }) {
    super();
    this.store = store;
  }

  initialize(config) {
    this.context = config.context;
  }

  async getMe() {
    if (!this.context.loggedIn) {
      return null;
    }
    const user = await this.store.UserModel.findById(this.context.user.id);
    return user;
  }

  async getAllUsers() {
    return this.store.UserModel.find({});
  }
  async createUser(args) {
    //todo encrypt password
    let salt = bcrypt.genSaltSync();
    const nu = Object.assign({},args);
    nu.password = bcrypt.hashSync( args.password, salt );
    return this.store.UserModel.create(nu);
  }


  async deleteUser(args) {
    const user = await this.store.UserModel.findOne({login:args.login});
    if (!user) {
      return {success:false,error_message:"404 not found"};
    }
    const du = await user.remove();
    return { success:true, user:du}
  }

  async relogin({ login }) {
    if (!this.context.loggedIn) {
      return { success:false };
    }

    const user = await this.store.UserModel.findById(this.context.user.id);
    if (!user) {
      return { success:false };
    }



    let effective_user = null;
    if (this.context.user.id != this.context.effective_user.id) {
      effective_user = await this.store.UserModel.findById(this.context.effective_user.id);
      if (!effective_user) {
        return { success:false };
      }
    } else  {
      effective_user = user;
    }


    if (login && login!==effective_user.login) {
      if (!user.sudo) {
        return { success:false };
      }
      effective_user = await this.store.UserModel.findOne({login});
      if (!effective_user) {
        return { success:false };
      }
    }
 
    const roles = await this.store.RoleModel.find({name: {$in:[...effective_user.roles]} });
    const rules = roles.reduce((res,r)=>{return res.concat(r.rules)},[]);

    const token = jwt.sign({
       user: { id: user.id, login:user.login, roles:user.roles, sudo:user.sudo}, 
       effective_user: { id: effective_user.id, login:effective_user.login, roles: effective_user.roles},
       effective_rules: rules, 
    }, JWT_SECRET,{expiresIn: JWT_EXPIRE});
    return { success: true, token, user, effective_user, effective_rules:rules};
  }
  

  async login({ login, password }) {
    const user = await this.store.UserModel.findOne({login});
    if (!user) {
      return { success: false }
    }
    if (!bcrypt.compareSync( password, user.password )) {
      return { success: false }
    }


    const roles = await this.store.RoleModel.find({name: {$in:[...user.roles]} });
    const rules = roles.reduce((res,r)=>{return res.concat(r.rules)},[]);

    const token = jwt.sign({ 
      user: { id: user.id, login, roles: user.roles, sudo:user.sudo},
      effective_user: { id: user.id, login, roles: user.roles},
      effective_rules: rules, 
    }, JWT_SECRET,{expiresIn: JWT_EXPIRE});
    return { success: true, token, user, effective_user:user, effective_rules:rules};
  }
  async bindRole({ login, role:name }) {
    const user = await this.store.UserModel.findOne({login});
    if (!user) {
      return { success: false , error_message:"404 user not found"}
    }
    const role = await this.store.RoleModel.findOne({name});
    if (!role) {
      return { success: false , error_message:"404 role not found"}
    }
    user.roles = [...new Set([...user.roles,name])];
    await user.save();
    return { success:true };
  }
  async unbindRole({ login, role:name}) {
    const user = await this.store.UserModel.findOne({login});
    if (!user) {
      return { success: false , error_message:"404 user not found"}
    }
    const index = user.roles.indexOf(name);
    if (index > -1) {
        user.roles.splice(index, 1);
        await user.save();
        return { success:true };
    } 
    return { success: false , error_message:"404 role not found"}
  }
 }

module.exports = UserAPI;
