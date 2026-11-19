import "dotenv/config";
import express from "express";
import database from "./src/config/database.js";
import { initializeModels } from "./src/models/index.js";
import accountsRoutes from "./src/routes/accounts.routes.js";
import rolesRoutes from "./src/routes/roles.routes.js";

const port = Number(process.env.APP_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("APP_PORT must be a valid TCP port");
}

initializeModels(database);

const app = express();

app.use(express.json());
app.use("/accounts", accountsRoutes);
app.use("/roles", rolesRoutes);

app.get("/health", async (_request, response) => {
  try {
    await database.authenticate();
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check database connection failed:", error.message);
    response.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

try {
  try {
    await database.authenticate();
  } catch (error) {
    console.error("Database connection unavailable; starting API in degraded mode:", error.message);
  }

  const server = app.listen(port, () => {
    console.log(`worldcar-api listening on port ${port}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      server.close(async () => {
        await database.close();
        process.exit(0);
      });
    });
  }
} catch (error) {
  console.error("Failed to start worldcar-api:", error);
  await database.close();
  process.exitCode = 1;
}