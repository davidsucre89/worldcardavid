import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
} from "sequelize";
import database from "../config/database.js";
import { initializeModels } from "../models/index.js";

const { Account, Role } = initializeModels(database);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateName(name) {
  return typeof name === "string" && name.trim().length > 0 && name.trim().length <= 30;
}

function validateDescription(description) {
  return (
    description === null ||
    (typeof description === "string" && description.length <= 100)
  );
}

function sendRoleError(response, message, error) {
  if (error instanceof UniqueConstraintError) {
    return response.status(409).json({ error: "Role name already exists" });
  }

  if (error instanceof ForeignKeyConstraintError) {
    return response.status(409).json({
      error: "Role cannot be deleted while accounts are assigned to it",
    });
  }

  console.error(message, error);
  return response.status(500).json({ error: message });
}

export async function create(request, response) {
  const body = request.body;

  if (
    !isPlainObject(body) ||
    !validateName(body.name) ||
    body.menu === undefined ||
    body.menu === null ||
    (body.description !== undefined && !validateDescription(body.description))
  ) {
    return response.status(400).json({
      error: "A valid name and non-null menu are required; description must be at most 100 characters",
    });
  }

  try {
    const role = await Role.create({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      menu: body.menu,
    });

    return response.status(201).json(role);
  } catch (error) {
    return sendRoleError(response, "Role creation failed", error);
  }
}

export async function getList(_request, response) {
  try {
    const roles = await Role.findAll({ order: [["id", "ASC"]] });
    return response.json(roles);
  } catch (error) {
    return sendRoleError(response, "Could not retrieve roles", error);
  }
}

export async function getById(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid role ID is required" });
  }

  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return response.status(404).json({ error: "Role not found" });
    }

    return response.json(role);
  } catch (error) {
    return sendRoleError(response, "Could not retrieve role", error);
  }
}

export async function update(request, response) {
  const id = Number(request.params.id);
  const body = request.body;
  const allowedFields = ["name", "description", "menu", "isActive"];

  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid role ID is required" });
  }

  if (
    !isPlainObject(body) ||
    Object.keys(body).length === 0 ||
    Object.keys(body).some((field) => !allowedFields.includes(field))
  ) {
    return response.status(400).json({ error: "No valid role fields provided" });
  }

  const changes = {};
  if (Object.hasOwn(body, "name")) {
    if (!validateName(body.name)) {
      return response.status(400).json({ error: "A valid role name is required" });
    }
    changes.name = body.name.trim();
  }

  if (Object.hasOwn(body, "description")) {
    if (!validateDescription(body.description)) {
      return response.status(400).json({
        error: "Description must be null or a string of at most 100 characters",
      });
    }
    changes.description = body.description?.trim() || null;
  }

  if (Object.hasOwn(body, "menu")) {
    if (body.menu === null) {
      return response.status(400).json({ error: "Menu cannot be null" });
    }
    changes.menu = body.menu;
  }

  if (Object.hasOwn(body, "isActive")) {
    if (typeof body.isActive !== "boolean") {
      return response.status(400).json({ error: "isActive must be a boolean" });
    }
    changes.isActive = body.isActive;
  }

  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return response.status(404).json({ error: "Role not found" });
    }

    await role.update(changes);
    return response.json(role);
  } catch (error) {
    return sendRoleError(response, "Role update failed", error);
  }
}

export async function remove(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid role ID is required" });
  }

  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return response.status(404).json({ error: "Role not found" });
    }

    if (await Account.count({ where: { role_id: id } })) {
      return response.status(409).json({
        error: "Role cannot be deleted while accounts are assigned to it",
      });
    }

    await role.destroy();
    return response.status(204).end();
  } catch (error) {
    return sendRoleError(response, "Role deletion failed", error);
  }
}