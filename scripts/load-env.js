/**
 * Environment Variable Loader for Node.js Scripts
 *
 * Loads environment variables for Cloud Canvas
 * Supports only 2 environments: development and production
 *
 * Usage:
 *   const { loadEnvironment } = require('./load-env');
 *   loadEnvironment('dev'); // loads .env.development
 *   loadEnvironment('prod'); // loads .env.production
 */

const path = require("path");
const fs = require("fs");

// Get project root directory (one level up from scripts folder)
const PROJECT_ROOT = path.join(__dirname, "..");

/**
 * Load environment variables from a file if it exists
 * @param {string} filePath - Path to the .env file
 */
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(
      `📋 Loading environment from: ${path.relative(PROJECT_ROOT, filePath)}`
    );
    require("dotenv").config({ path: filePath });
    return true;
  }
  return false;
}

/**
 * Load environment variables for specified stage
 * @param {string} stage - Stage name (dev, prod)
 */
function loadEnvironment(stage = "dev") {
  // Map stage to environment file
  let envFile;
  switch (stage) {
    case "prod":
    case "production":
      envFile = ".env.production";
      break;
    case "dev":
    case "development":
    default:
      envFile = ".env.development";
      break;
  }

  console.log(
    `🌍 Loading environment configuration for: ${stage} (${envFile})`
  );

  const envPath = path.join(PROJECT_ROOT, envFile);
  if (loadEnvFile(envPath)) {
    console.log(`✅ Loaded environment from: ${envFile}`);
  } else {
    console.log(
      `⚠️  Environment file ${envFile} not found. Using system environment variables only.`
    );
  }

  return stage;
}

module.exports = {
  loadEnvironment,
  PROJECT_ROOT,
};
