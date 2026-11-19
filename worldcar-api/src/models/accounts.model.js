import bcrypt from "bcrypt";
import { DataTypes, Model } from "sequelize";

class Account extends Model {
  async comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

export default function createAccountModel(sequelize) {
  Account.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      person: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      activationTokenHash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },
      activationTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Account",
      tableName: "accounts",
      timestamps: false,
      hooks: {
        beforeCreate: async (account) => {
          account.password = await bcrypt.hash(account.password, 12);
        },
        beforeUpdate: async (account) => {
          if (account.changed("password")) {
            account.password = await bcrypt.hash(account.password, 12);
          }
        },
      },
    },
  );

  return Account;
}
