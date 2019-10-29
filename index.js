#!/usr/bin/env node
// eslint complains about jsdoc typescript sometimes
/* eslint-disable valid-jsdoc */
main().catch(e => exit(e.message));

/**
 * @typedef {import('puppeteer').Cookie} Cookie
 * @typedef {import('puppeteer').CDPSession} CDPSession
 */

/**
 * main program logic
 */
async function main() {
  const { locationHREF, cookiesFile, parsedCookiesFile } = await parseArgv(
    process.argv.slice(2)
  );
  /**
   * @type {Cookie[]}
   */
  let cookies;
  try {
    const cookieProcessor = createCookieProcessor(locationHREF);
    cookies = (await parsedCookiesFile).map(cookieProcessor);
  } catch (e) {
    throw new Error(`could not read cookies file ${cookiesFile}: ${e.message}`);
  }
  // setup our browser to spy on network activity
  const { browser, page } = await setupBrowser({ cookies });
  try {
    // navigate the browser to the page wishing to be spied upon
    await page.goto(locationHREF, { timeout: 0, waitUntil: 'networkidle0' });
  } catch (e) {
    throw new Error(`could not finish navigating to page: ${e.message}`);
  } finally {
    await browser.close();
  }
}
/**
 * Parses our command line flags
 * @param {string[]} args
 */
// eslint-disable-next-line max-statements
function parseArgv(args) {
  let locationHREF;
  let cookiesFile;
  /**
   * @type {Promise<Cookie[]>}
   */
  let parsedCookiesFile;

  // defaults
  parsedCookiesFile = Promise.resolve([]);

  // initialized lazily
  const argv = require('minimist')(args);
  const { cookies } = argv;

  if (argv.h || argv.help) {
    exit(
      [
        'usage http-usage: [--cookies <file>] [--help] URL',
        '',
        'Dumps newline delimited JSON for what request/responses a browsers performs on navigating to URL.',
        '',
        '--cookies - a JSON file that is an array of objects with a page "url", cookie "name", and cookie "value"'
      ].join('\n'),
      0
    );
  }

  if (cookies) {
    // disallows having multiple cookie files
    if (Array.isArray(cookies)) {
      throw new Error('--cookies requires a file value');
    }

    const asyncReadFile = require('fs').promises.readFile;
    parsedCookiesFile = asyncReadFile(cookies, 'utf8').then(JSON.parse);
  }

  // disallows having multiple urls being specified to navigate to
  const target = Array.isArray(argv._) ? argv._[0] : argv._;

  if (!target) {
    throw new Error(`could not parse value of URL: ${target}`);
  }

  // this is setup to try and handle `example.com` which doesn't have a
  // specified protocol
  try {
    locationHREF = new URL(target).href;
  } catch (e) {
    try {
      process.stderr.write(
        `could not parse value of URL ${target}: adding protocol\n`
      );
      locationHREF = new URL(`https://${target}`).href;
    } catch (_) {
      throw new Error(`could not parse value of URL: ${target}: ${e.message}`);
    }
  }

  if (typeof locationHREF !== 'string') {
    throw new Error('must specify a URL');
  }

  return { locationHREF, cookiesFile, parsedCookiesFile };
}

/**
 * Spawns a browser and page that is to be spied upon
 * Sets up environment as needed
 * @param {{cookies: Cookie[]}} param0
 */
async function setupBrowser({ cookies }) {
  try {
    const browser = await require('puppeteer').launch({ headless: true });
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    const cdp = await page.target().createCDPSession();
    await snoopBrowser(cdp);
    await setCookies(cdp, cookies);
    return { browser, page };
  } catch (e) {
    throw new Error(`could not setup browser: ${e.message}`);
  }
}

/**
 * Uses devtools protocol session to start spying on a connected browser
 * @param {CDPSession} cdp
 */
async function snoopBrowser(cdp) {
  await cdp.send('Network.enable');
  await cdp.send('Debugger.enable');
  // this is required for situations like
  // img = new Image();
  // img.src = '...';
  // document.body.append(img);
  await cdp.send('Debugger.setAsyncCallStackDepth', { maxDepth: 1 });
  const requests = new Map();
  cdp
    .on('Debugger.paused', () => {
      cdp.send('Debugger.resume');
    })
    .on('Network.requestWillBeSent', event => {
      requests.set(event.requestId, event);
    })
    .on('Network.responseReceived', async responseEvent => {
      const requestEvent = requests.get(responseEvent.requestId);
      requests.delete(responseEvent.requestId);
      dumpJSON(requestEvent, responseEvent);
    });
}

/**
 * Creates a mapper that will properly setup cookies for a given document.
 * @param {string} documentLocationHREF
 */
function createCookieProcessor(documentLocationHREF) {
  /**
   * @param {object} cookieObj
   * @returns {Cookie}
   */
  function mapCookieObject(cookieObj) {
    if (!cookieObj.url) cookieObj.url = new URL(documentLocationHREF).href;
    if (!cookieObj.path)
      cookieObj.path = new URL(documentLocationHREF).pathname;
    if (!cookieObj.httpOnly) cookieObj.httpOnly = false;
    if (!cookieObj.secure) cookieObj.secure = false;
    if (!cookieObj.sameSite) cookieObj.sameSite = 'Lax';
    if (!cookieObj.domain)
      cookieObj.domain = `${new URL(documentLocationHREF).hostname}`;
    return cookieObj;
  }
  return mapCookieObject;
}

/**
 * Sets the browser cookies, useful for login via cookies
 * @param {CDPSession} cdp
 * @param {Cookie[]} cookies
 */
async function setCookies(cdp, cookies) {
  for (const cookie of cookies) {
    try {
      if (!(await cdp.send('Network.setCookie', cookie))) {
        throw new Error('');
      }
    } catch (e) {
      throw new Error(
        `could not set cookie ${JSON.stringify(cookie.name)}${
          e.message ? ` ${e.message}` : ''
        }`
      );
    }
  }
}

/**
 * Prints a stable set of data for a request/response
 * pair from the browser.
 * @param {object} requestEvent
 * @param {object} responseEvent
 */
function dumpJSON(requestEvent, responseEvent) {
  const { response } = responseEvent;
  const { request } = requestEvent;

  process.stdout.write(
    JSON.stringify({
      request: {
        resourceType: requestEvent.type,
        url: request.url,
        method: request.method,
        headers: request.headers,
        initiator: requestEvent.initiator
      },
      response: {
        url: response.url,
        status: response.status,
        headers: response.headers,
        mimeType: response.mimeType
      }
    })
  );
  process.stdout.write('\n');
}

/**
 * Exits the process, useful to ensure message is properly propagated
 * @param {string} msg
 * @param {number} code
 */
function exit(msg, code = 1) {
  process.stderr.write(msg);
  process.stderr.write('\n');
  // eslint-disable-next-line no-process-exit
  process.exit(code);
}
