const roles = [
  {
    name: "Admin",
    description: "Administrador del sistema",
    menu: [],
    isActive: true,
  },
  {
    name: "Vendedor",
    description: "Vendedor",
    menu: [],
    isActive: true,
  },
  {
    name: "Cliente",
    description: "Cliente",
    menu: [],
    isActive: true,
  },
];

export default async function seedRoles({ Role }) {
  const legacyNames = [
    ["admin", "Admin"],
    ["user", "Cliente"],
  ];

  for (const [legacyName, roleName] of legacyNames) {
    const [existingRole, legacyRole] = await Promise.all([
      Role.findOne({ where: { name: roleName } }),
      Role.findOne({ where: { name: legacyName } }),
    ]);

    if (!existingRole && legacyRole) {
      await legacyRole.update({ name: roleName });
      console.log(`Renamed legacy role "${legacyName}" to "${roleName}".`);
    }
  }

  for (const role of roles) {
    const [, created] = await Role.findOrCreate({
      where: { name: role.name },
      defaults: role,
    });

    console.log(
      created ? `Inserted role "${role.name}".` : `Role "${role.name}" already exists.`,
    );
  }
}

export async function undo({ Role, Account, sequelize }) {
  const transaction = await sequelize.transaction();

  try {
    const seededRoles = await Role.findAll({
      where: { name: roles.map(({ name }) => name) },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const roleIds = seededRoles.map(({ id }) => id);

    if (roleIds.length > 0) {
      const accountCount = await Account.count({
        where: { role_id: roleIds },
        transaction,
      });

      if (accountCount > 0) {
        throw new Error(
          `Cannot undo roles seed: ${accountCount} account(s) are assigned to seeded roles`,
        );
      }

      await Role.destroy({ where: { id: roleIds }, transaction });
    }

    await transaction.commit();
    console.log(`Removed ${roleIds.length} seeded role(s).`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
