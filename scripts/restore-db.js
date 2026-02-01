// scripts/restore-db.js
const fs = require('fs');
const path = require('path');

const initialPath = path.resolve(process.cwd(), 'db.initial.json');
const targetPath = path.resolve(process.cwd(), 'db.json');

try {
  const data = fs.readFileSync(initialPath, 'utf-8');
  fs.writeFileSync(targetPath, data);
  console.log('db.json restored from db.initial.json');
  process.exit(0);
} catch (err) {
  console.error('Failed to restore db.json:', err);
  process.exit(1);
}