const assume = require('assume');
const { createFixtureServer, sitePath, spawnFixture } = require('./utils.js');
describe('sites-async-stack', () => {
  it('should see async img request', async () => {
    const { server, address } = await createFixtureServer(
      sitePath('async-stack')
    );
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
    assume(eventsSeen.size).equals(2);
    assume(eventsSeen.has(href)).true();
    assume(
      eventsSeen.has(
        'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs='
      )
    ).true();
    assume(
      eventsSeen.get(
        'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs='
      ).request.initiator.stack
    ).exists();
    assume(eventsSeen.get(href).request.initiator).deep.equals({
      type: 'other'
    });
  });
});
