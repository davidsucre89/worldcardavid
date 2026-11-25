import "dotenv/config";
import nodemailer from "nodemailer";
import { createWelcomeEmailTemplate } from "../config/email/emailTemplates.js";

export function validateEmailConfiguration() {
  const { EMAIL_ADMIN, EMAIL_ADMIN_PASSWORD, SMTP_HOST } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);
  const secureValue = process.env.SMTP_SECURE?.toLowerCase();

  if (!EMAIL_ADMIN || !EMAIL_ADMIN_PASSWORD || !SMTP_HOST) {
    throw new Error(
      "Email requires EMAIL_ADMIN, EMAIL_ADMIN_PASSWORD, and SMTP_HOST",
    );
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid TCP port");
  }

  if (secureValue && !["true", "false"].includes(secureValue)) {
    throw new Error("SMTP_SECURE must be true or false");
  }

  return {
    host: SMTP_HOST,
    port,
    secure: secureValue ? secureValue === "true" : port === 465,
    user: EMAIL_ADMIN,
    password: EMAIL_ADMIN_PASSWORD,
  };
}

export async function sendEmail({ to, subject, text, html }) {
  if (!to || !subject || (!text && !html)) {
    throw new Error("Email requires a recipient, subject, and body");
  }

  const configuration = validateEmailConfiguration();
  const transporter = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    auth: {
      user: configuration.user,
      pass: configuration.password,
    },
  });

  try {
    return await transporter.sendMail({
      from: configuration.user,
      to,
      subject,
      text,
      html,
    });
  } finally {
    transporter.close();
  }
}

export async function sendWelcomeEmail(account, activationLink) {
  if (!account?.email || !account?.username) {
    throw new Error("A registered account with email and username is required");
  }

  const message = createWelcomeEmailTemplate(account.username, activationLink);

  return sendEmail({
    to: account.email,
    ...message,
  });
}