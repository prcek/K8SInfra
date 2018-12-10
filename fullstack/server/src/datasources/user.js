const { DataSource } = require('apollo-datasource');
const isEmail = require('isemail');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'iddqd';

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

  async login({ login, password }) {

    const token = jwt.sign({ user: { id: 0, login, role:"ADMIN"} }, JWT_SECRET);

    return { success: true, token};
  }

 }

module.exports = UserAPI;
