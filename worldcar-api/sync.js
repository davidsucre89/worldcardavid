import database from "./src/config/database.js";
import { initializeModels } from "./src/models/index.js";

initializeModels(database);

try {
  await database.authenticate();
  console.log("Database connection established.");

  await database.sync({alter:true});
  console.log("Database synchronized successfully.");
} catch (error) {
  console.error("Database synchronization failed:", error);
  process.exitCode = 1;
} finally {
      await database.close();
}