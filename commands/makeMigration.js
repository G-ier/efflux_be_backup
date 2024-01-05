const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createMigrationAndHardLink(migrationName) {
  try {
    // Step 1: Create Knex migration file
    const migrationCommand = `knex migrate:make ${migrationName} --env staging`;
    execSync(migrationCommand, { stdio: 'inherit' });

    // Step 2: Create a hard link to the migration file
    const migrationsDir = path.join(__dirname, '..', 'migrations', 'staging');
    const latestMigration = getLatestFile(migrationsDir);

    const sourcePath = path.join(migrationsDir, latestMigration);
    const targetPath = path.join(__dirname, '..', 'migrations', 'production', latestMigration);

    createHardLink(sourcePath, targetPath);
  } catch (error) {
    console.error('Error:', error);
  }
}

function getLatestFile(directory) {
  const files = fs.readdirSync(directory);
  return files.sort((a, b) => fs.statSync(path.join(directory, b)).mtime - fs.statSync(path.join(directory, a)).mtime)[0];
}

function createHardLink(source, target) {
  try {
    fs.linkSync(source, target);
    console.log(`Hard link created from ${source} to ${target}`);
  } catch (error) {
    console.error('Error creating hard link:', error);
  }
}

// Get migration name from command line argument
const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Please provide a migration name.');
  process.exit(1);
}

createMigrationAndHardLink(migrationName);
