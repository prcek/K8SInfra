const { DataSource } = require('apollo-datasource');
const isEmail = require('isemail');
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
