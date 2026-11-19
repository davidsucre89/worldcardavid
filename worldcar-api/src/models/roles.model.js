import { DataTypes, Model } from "sequelize";

class Role extends Model {}

export default function createRoleModel(sequelize) {
  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      menu: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    },
    {
      sequelize,
      modelName: "Role",
      tableName: "roles",
      timestamps: false,
    },
  );

  return Role;
}