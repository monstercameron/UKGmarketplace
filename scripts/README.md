# UKG Classifieds Scripts

This directory contains utility scripts for the UKG Classifieds application.

## Available Scripts

### Database Scripts

- **db-init-seed.js**: Initializes the database tables and seeds them with test data.
  - Usage: `npm run db:init-and-seed`

- **reset-db.js**: Resets the database by deleting the database file and recreating it.
  - Usage: `npm run db:reset`

- **reset-db-safe.js**: Safely resets the database by checking if it's locked before deleting.
  - Usage: `npm run db:reset-safe`

- **reset-db-force.js**: Forcefully resets the database, even if it's locked.
  - Usage: `npm run db:reset-force`

- **find-db-lock.js**: Finds processes that might be locking the database file.
  - Usage: `npm run db:find-lock`

- **seed-db.js**: Seeds the database with test data.
  - Usage: `node scripts/seed-db.js`

- **initdb.js**: Initializes the database tables.
  - Usage: `node scripts/initdb.js`

### Environment Scripts

- **update-env.js**: Updates environment variables in the .env file.
  - Usage: `node scripts/update-env.js`

### Other Scripts

- **test-search.js**: Tests the search functionality.
  - Usage: `node scripts/test-search.js`

## Adding New Scripts

When adding new scripts to this directory, make sure to:

1. Document the script in this README.md file
2. Add an npm script to package.json if appropriate
3. Follow the existing pattern for script organization and documentation 