import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import database from "./database.js";
import { initializeModels } from "../models/index.js";

const seedsDirectory = fileURLToPath(new URL("../seeds/", import.meta.url));
const models = initializeModels(database);
const undo = process.argv.includes("--undo");

try {
  await database.authenticate();
  if (!undo) {
    await database.sync();
  }

  const seedFiles = (await readdir(seedsDirectory))
    .filter((file) => file.endsWith(".seeds.js"))
    .sort();
  if (undo) {
    seedFiles.reverse();
  }

  for (const file of seedFiles) {
    const seedModule = await import(
      pathToFileURL(join(seedsDirectory, file)).href
    );
    const seedAction = undo ? seedModule.undo : seedModule.default;
    if (typeof seedAction !== "function") {
      const actionName = undo ? "undo" : "default";
      throw new Error(`Seed "${file}" must export a ${actionName} function`);
    }

    await seedAction({ ...models, sequelize: database });
  }

  console.log(`${undo ? "Undid" : "Executed"} ${seedFiles.length} seed(s).`);
} catch (error) {
  console.error("Seed execution failed:", error);
  process.exitCode = 1;
} finally {
  await database.close();
}
