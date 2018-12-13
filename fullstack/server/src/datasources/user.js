const { DataSource } = require('apollo-datasource');
const isEmail = require('isemail');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'iddqd';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '3h';

class UserAPI extends DataSource {
  constructor({ store }) {
    super();
    this.store = store;
  }

  initialize(config) {
    this.context = config.context;
  }

  async getMe() {
   // const email =
   //   this.context && this.context.user ? this.context.user.email : emailArg;
   // if (!email || !isEmail.validate(email)) return null;

   // const users = await this.store.users.findOrCreate({ where: { email } });
    return null;
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



  async login({ login, password }) {
    const user = await this.store.UserModel.findOne({login});
    if (!user) {
      return { success: false }
    }
    if (!bcrypt.compareSync( password, user.password )) {
      return { success: false }
    }

    const token = jwt.sign({ user: { id: user.id, login, roles:["ADMIN","USER","VIEW"]} }, JWT_SECRET,{expiresIn: JWT_EXPIRE});
    return { success: true, token, user};
  }

 }

module.exports = UserAPI;
