// Preload only for P-1 test children. Next.js otherwise reads conventional
// .env files from the repository after the strict wrapper has sanitized env.
const fs = require("node:fs");
const path = require("node:path");

const originalStatSync = fs.statSync;
const nextEnvFile = /^\.env(?:\.(?:development|production|test))?(?:\.local)?$/;

function blocksNextEnv(file) {
  return typeof file === "string" && nextEnvFile.test(path.basename(file));
}

fs.statSync = function statSyncWithoutNextEnv(file, ...args) {
  if (blocksNextEnv(file)) {
    const error = new Error("P-1 runner blocks conventional Next env files");
    error.code = "ENOENT";
    throw error;
  }
  return originalStatSync.call(this, file, ...args);
};
