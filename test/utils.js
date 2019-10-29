const path = require('path');
const { spawn } = require('child_process');
const { createServer } = require('http');
const serveStatic = require('serve-static');

function fixturePath(...parts) {
  return path.join(__dirname, 'fixtures', ...parts);
}
function sitePath(...parts) {
  return fixturePath('sites', ...parts);
}

function createFixtureServer(root) {
  return new Promise((f, r) => {
    const middleware = serveStatic(root);
    const server = createServer((req, res) => {
      // @ts-ignore
      return middleware(req, res, err => r(err || new Error('File not found')));
    });
    server.listen(0, '0.0.0.0', err => {
      if (err) return r(err);
      f({
        server,
        address: server.address()
      });
    });
  });
}
function spawnFixture(args) {
  return new Promise((f, r) => {
    const stdout = [];
    const stderr = [];
    const child = spawn(process.execPath, [
      path.join(__dirname, '..', 'index.js'),
      ...args
    ])
      .on('exit', code => {
        f({
          code,
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr)
        });
      })
      .on('error', reason => {
        r(reason);
      });
    child.stdout.on('data', d => stdout.push(d));
    child.stderr.on('data', d => stderr.push(d));
  });
}
module.exports = {
  createFixtureServer,
  fixturePath,
  sitePath,
  spawnFixture
};
