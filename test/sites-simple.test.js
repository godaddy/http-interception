const assume = require('assume');
const { createFixtureServer, sitePath, spawnFixture } = require('./utils.js');
describe('sites-simple', () => {
  it('should see requests', async () => {
    const { server, address } = await createFixtureServer(sitePath('simple'));
    after(() => {
      server.close();
    });
    const href = `http://${address.address}:${address.port}/`;
    const { code, stdout } = await spawnFixture([href]);
    assume(code).equals(0);
    const eventsSeen = new Map(
      `${stdout}`
        .split(/\n/)
        .filter(Boolean)
        .map(s => {
          const event = JSON.parse(s);
          return [event.request.url, event];
        })
    );
    assume(eventsSeen.size).equals(1);
    assume(eventsSeen.has(href)).true();
    assume(eventsSeen.get(href).request.initiator).deep.equals({
      type: 'other'
    });
  });
});
