// Saves data in json files (src/data/users.json etc).
// Node handles many requests at the same time, so two requests could write the same file
// together and lose data. To avoid that every read/write goes through one queue
// and runs one after another.
const fs = require('fs/promises');
const path = require('path');
const { dataDir } = require('../config/env');
const AppError = require('./AppError');

let queue = Promise.resolve();

function runInQueue(job) {
  const result = queue.then(job);
  queue = result.catch(() => {}); // a failed job should not block the next ones
  return result;
}

function getPath(name) {
  // path.basename so nobody can use '../' to reach other folders
  return path.join(dataDir, path.basename(name) + '.json');
}

async function readFile(name) {
  try {
    const text = await fs.readFile(getPath(name), 'utf8');
    return text.trim() ? JSON.parse(text) : [];
  } catch (err) {
    if (err.code === 'ENOENT') return []; // file not created yet
    console.error('read error:', err.message);
    throw new AppError(500, 'Could not read ' + name + ' data', 'STORAGE_ERROR');
  }
}

async function writeFile(name, data) {
  const file = getPath(name);
  try {
    await fs.mkdir(dataDir, { recursive: true });
    // write to a temp file first, then rename, so the real file never ends up half written
    await fs.writeFile(file + '.tmp', JSON.stringify(data, null, 2));
    await fs.rename(file + '.tmp', file);
  } catch (err) {
    console.error('write error:', err.message);
    throw new AppError(500, 'Could not save ' + name + ' data', 'STORAGE_ERROR');
  }
}

// get all records of 'users', 'projects' or 'tasks'
function getAll(name) {
  return runInQueue(() => readFile(name));
}

// read -> change -> save, all in one go. 'change' gets the array and can edit it directly.
// If change throws an error nothing is saved.
function change(name, changeFn) {
  return runInQueue(async () => {
    const data = await readFile(name);
    const result = await changeFn(data);
    await writeFile(name, data);
    return result;
  });
}

module.exports = { getAll, change };