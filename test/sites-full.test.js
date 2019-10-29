const assume = require('assume');
const { createFixtureServer, sitePath, spawnFixture } = require('./utils.js');
describe('sites-full', () => {
  it('should see nested requests', async () => {
    const { server, address } = await createFixtureServer(sitePath('full'));
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
    assume(eventsSeen.size).equals(3);
    assume(eventsSeen.has(href)).true();
    assume(eventsSeen.get(href).request.initiator).deep.equals({
      type: 'other'
    });
    assume(eventsSeen.has(`${href}style.css`)).true();
    assume(eventsSeen.get(`${href}style.css`).request.initiator).deep.equals({
      type: 'parser',
      url: href,
      lineNumber: 1
    });
    assume(
      eventsSeen.has("data:text/javascript,console.log('hello world!')")
    ).true();
    assume(
      eventsSeen.get("data:text/javascript,console.log('hello world!')").request
        .initiator
    ).deep.equals({
      type: 'parser',
      url: href,
      lineNumber: 2
    });
  });
});
