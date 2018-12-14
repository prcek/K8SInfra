const { DataSource } = require('apollo-datasource');

class RoleAPI extends DataSource {
  constructor({ store }) {
    super();
    this.store = store;
  }

  initialize(config) {
    this.context = config.context;
  }

  async getAllRoles() {
    return this.store.RoleModel.find({});
  }
  async createRole(args) {
    return this.store.RoleModel.create(args);
  }
  async updateRole(args) {
    const role = await this.store.RoleModel.findOne({name:args.name});
    if (!role) {
      return null;
    }
    role.rules = args.rules;
    const ur = await role.save();
    return ur;//this.store.RoleModel.create(args);
  }

  async deleteRole(args) {
    const role = await this.store.RoleModel.findOne({name:args.name});
    if (!role) {
      return {success:false,error_message:"404 not found"};
    }
    const dr = await role.remove();
    return { success:true, role:dr}
  }

}

module.exports = RoleAPI;
