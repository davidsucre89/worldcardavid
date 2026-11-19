import createAccountModel from "./accounts.model.js";
import createRoleModel from "./roles.model.js";

let initializedModels;

export function initializeModels(sequelize) {
  if (initializedModels) {
    if (initializedModels.Account.sequelize !== sequelize) {
      throw new Error("Models are already initialized with another Sequelize instance");
    }

    return initializedModels;
  }

  const Role = createRoleModel(sequelize);
  const Account = createAccountModel(sequelize);

  Role.hasMany(Account, { foreignKey: "role_id", as: "accounts" });
  Account.belongsTo(Role, { foreignKey: "role_id", as: "role" });

  initializedModels = { Account, Role };
  return initializedModels;
}
