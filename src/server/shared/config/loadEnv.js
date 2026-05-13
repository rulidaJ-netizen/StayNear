import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../..");

const envFiles = [
  { name: ".env", override: false },
  { name: ".env.local", override: true },
];

envFiles.forEach(({ name, override }) => {
  const envPath = path.join(rootDir, name);

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override });
  }
});
