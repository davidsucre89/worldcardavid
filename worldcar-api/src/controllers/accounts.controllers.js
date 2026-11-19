import { createHash, randomBytes } from "node:crypto";
import { Op, UniqueConstraintError } from "sequelize";
import database from "../config/database.js";
import { initializeModels } from "../models/index.js";
import {
  sendEmail,
  sendWelcomeEmail,
  validateEmailConfiguration,
} from "../general/sendMail.js";

const { Account, Role } = initializeModels(database);
const ACTIVATION_BASE_URL =
  process.env.ACTIVATION_BASE_URL || "http://localhost:3400";
const ACTIVATION_TOKEN_TTL = 24 * 60 * 60 * 1000;
const DEFAULT_ROLE_NAME = "Cliente";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MAX_BYTES = 72;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createActivationToken() {
  const token = randomBytes(32).toString("hex");

  return {
    token,
    activationTokenHash: hashToken(token),
    activationTokenExpiresAt: new Date(Date.now() + ACTIVATION_TOKEN_TTL),
  };
}

function activationUrl(token) {
  const url = new URL("/accounts/activate", ACTIVATION_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

async function sendRegistrationWelcomeEmail(account, token) {
  return sendWelcomeEmail(account, activationUrl(token));
}

async function sendActivationEmail(account, token) {
  return sendEmail({
    to: account.email,
    subject: "Activa tu cuenta",
    text: `Para activar tu cuenta, abre este enlace: ${activationUrl(token)}`,
  });
}

function accountResponse(account) {
  const result = account.toJSON();
  delete result.password;
  delete result.activationTokenHash;
  delete result.activationTokenExpiresAt;
  return result;
}

function validateEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 120 &&
    EMAIL_PATTERN.test(email.trim())
  );
}

function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length > 0 &&
    Buffer.byteLength(password, "utf8") <= PASSWORD_MAX_BYTES
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sendDatabaseError(response, message, error) {
  if (error instanceof UniqueConstraintError) {
    return response.status(409).json({ error: "Email or value already exists" });
  }

  console.error(message, error);
  return response.status(500).json({ error: message });
}

export async function register(request, response) {
  const { email, password, username, person } = request.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    !validateEmail(normalizedEmail) ||
    !validatePassword(password) ||
    typeof username !== "string" ||
    username.trim().length === 0 ||
    username.trim().length > 15 ||
    !isPlainObject(person)
  ) {
    return response.status(400).json({
      error: "Valid email, password, username, and person object are required",
    });
  }

  try {
    validateEmailConfiguration();
  } catch (error) {
    return response.status(503).json({ error: error.message });
  }

  try {
    const role = await Role.findOne({ where: { name: DEFAULT_ROLE_NAME } });
    if (!role) {
      return response.status(503).json({
        error: `Registration requires an existing '${DEFAULT_ROLE_NAME}' role`,
      });
    }

    let account = await Account.findOne({ where: { email: normalizedEmail } });
    if (account?.isActive) {
      return response.status(409).json({ error: "Email is already registered" });
    }

    const activation = createActivationToken();
    if (account) {
      account.set({
        ...activation,
        isActive: false,
      });
      await account.save();
    } else {
      account = await Account.create({
        email: normalizedEmail,
        password,
        username: username.trim(),
        person,
        role_id: role.id,
        isActive: false,
        ...activation,
      });
    }

    try {
      await sendRegistrationWelcomeEmail(account, activation.token);
    } catch (error) {
      console.error("Failed to send account activation email:", error);
      return response.status(502).json({
        error: "Account is pending activation, but the email could not be sent",
      });
    }

    return response.status(201).json({
      message: "Registration successful; check your email to activate the account",
      account: accountResponse(account),
    });
  } catch (error) {
    return sendDatabaseError(response, "Account registration failed", error);
  }
}

export async function getList(_request, response) {
  try {
    const accounts = await Account.findAll({
      attributes: {
        exclude: [
          "password",
          "activationTokenHash",
          "activationTokenExpiresAt",
        ],
      },
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      order: [["id", "ASC"]],
    });

    return response.json(accounts);
  } catch (error) {
    return sendDatabaseError(response, "Could not retrieve accounts", error);
  }
}

export async function getById(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid account ID is required" });
  }

  try {
    const account = await Account.findByPk(id, {
      attributes: {
        exclude: [
          "password",
          "activationTokenHash",
          "activationTokenExpiresAt",
        ],
      },
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    if (!account) {
      return response.status(404).json({ error: "Account not found" });
    }

    return response.json(account);
  } catch (error) {
    return sendDatabaseError(response, "Could not retrieve account", error);
  }
}

export async function update(request, response) {
  const id = Number(request.params.id);
  const body = request.body ?? {};
  const allowedFields = ["email", "username", "person", "password", "role_id"];

  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid account ID is required" });
  }

  if (
    !isPlainObject(body) ||
    Object.keys(body).length === 0 ||
    Object.keys(body).some((field) => !allowedFields.includes(field))
  ) {
    return response.status(400).json({ error: "No valid account fields provided" });
  }

  const changes = {};
  if (Object.hasOwn(body, "email")) {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!validateEmail(email)) {
      return response.status(400).json({ error: "A valid email is required" });
    }
    changes.email = email;
  }

  if (Object.hasOwn(body, "username")) {
    if (
      typeof body.username !== "string" ||
      body.username.trim().length === 0 ||
      body.username.trim().length > 15
    ) {
      return response.status(400).json({ error: "A valid username is required" });
    }
    changes.username = body.username.trim();
  }

  if (Object.hasOwn(body, "person")) {
    if (!isPlainObject(body.person)) {
      return response.status(400).json({ error: "Person must be an object" });
    }
    changes.person = body.person;
  }

  if (Object.hasOwn(body, "password")) {
    if (!validatePassword(body.password)) {
      return response.status(400).json({ error: "A valid password is required" });
    }
    changes.password = body.password;
  }

  if (Object.hasOwn(body, "role_id")) {
    if (!Number.isInteger(body.role_id) || body.role_id < 1) {
      return response.status(400).json({ error: "A valid role_id is required" });
    }
    changes.role_id = body.role_id;
  }

  const emailChanged = Object.hasOwn(changes, "email");
  if (emailChanged) {
    try {
      validateEmailConfiguration();
    } catch (error) {
      return response.status(503).json({ error: error.message });
    }
  }

  try {
    const account = await Account.findByPk(id);
    if (!account) {
      return response.status(404).json({ error: "Account not found" });
    }

    if (changes.role_id) {
      const role = await Role.findByPk(changes.role_id);
      if (!role) {
        return response.status(400).json({ error: "Role not found" });
      }
    }

    const needsActivation = emailChanged && changes.email !== account.email;
    let activation;
    if (needsActivation) {
      activation = createActivationToken();
      Object.assign(changes, activation, { isActive: false });
    }

    account.set(changes);
    await account.save();

    if (needsActivation) {
      try {
        await sendActivationEmail(account, activation.token);
      } catch (error) {
        console.error("Failed to send updated account activation email:", error);
        return response.status(502).json({
          error: "Account was updated but the new email could not be verified",
        });
      }
    }

    return response.json({
      message: "Account updated successfully",
      account: accountResponse(account),
    });
  } catch (error) {
    return sendDatabaseError(response, "Account update failed", error);
  }
}

export async function remove(request, response) {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return response.status(400).json({ error: "A valid account ID is required" });
  }

  if (request.account?.id === id) {
    return response.status(400).json({ error: "You cannot delete your own account" });
  }

  try {
    const account = await Account.findByPk(id);
    if (!account) {
      return response.status(404).json({ error: "Account not found" });
    }

    await account.destroy();
    return response.status(204).end();
  } catch (error) {
    return sendDatabaseError(response, "Account deletion failed", error);
  }
}

export async function activate(request, response) {
  const token = request.query.token;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return response.status(400).json({ error: "A valid activation token is required" });
  }

  try {
    const account = await Account.findOne({
      where: {
        activationTokenHash: hashToken(token),
        activationTokenExpiresAt: { [Op.gt]: new Date() },
        isActive: false,
      },
    });

    if (!account) {
      return response.status(400).json({ error: "Activation token is invalid or expired" });
    }

    account.set({
      isActive: true,
      activationTokenHash: null,
      activationTokenExpiresAt: null,
    });
    await account.save();

    return response.json({ message: "Account activated successfully" });
  } catch (error) {
    return sendDatabaseError(response, "Account activation failed", error);
  }
}
