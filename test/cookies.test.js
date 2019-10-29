const assume = require('assume');
const {
  createFixtureServer,
  fixturePath,
  sitePath,
  spawnFixture
} = require('./utils.js');
describe('--cookies', () => {
  it('should require a value', async () => {
    const { code, stdout } = await spawnFixture(['--cookies']);
    assume(code).equals(1);
    assume(stdout.length).equals(0);
  });
  it('should reject JSON missing a name', async () => {
    const { code, stdout } = await spawnFixture([
      '--cookies',
      fixturePath('invalid-cookies-missing-name.json')
    ]);
    assume(code).equals(1);
    assume(stdout.length).equals(0);
  });
  it('should reject JSON missing a value', async () => {
    const { code, stdout } = await spawnFixture([
      '--cookies',
      fixturePath('invalid-cookies-missing-value.json')
    ]);
    assume(code).equals(1);
    assume(stdout.length).equals(0);
  });
  it("should reject JSON that isn't an array", async () => {
    const { code, stdout } = await spawnFixture([
      '--cookies',
      fixturePath('invalid-cookies-not-array.json')
    ]);
    assume(code).equals(1);
    assume(stdout.length).equals(0);
  });
  it('should accept valid JSON ', async () => {
    const { server, address } = await createFixtureServer(sitePath('simple'));
    after(() => {
      server.close();
    });
    const href = `http://${address.address}:${address.port}/`;
    const { code, stdout } = await spawnFixture([
      '--cookies',
      fixturePath('valid-cookies.json'),
      href
    ]);
    assume(code).equals(0);
    `${stdout}`.split(/\n/).every(s => {
      if (s === '') return true;
      JSON.parse(s);
      return true;
    });
  });
});
