# Contributing to http-interception

Thanks for taking the time to contribute!

## Submitting an Issue

We will try to respond to every issue. The issues that get the
quickest response are the ones that are easiest to respond to. The
issues that are easiest to respond to usually include the
following:

* A small self sufficient code example to reproduce the issue.
* For requests for help, a small self sufficient code example that
  illustrates what you're currently attempting to implement.
* For API feature requests, links to supporting API documentation or
  examples from other libraries using puppeteer.

## Submitting a Pull Request

The most useful PRs ensure the following:

1. Include tests with your PR. Check out [`test/`](test) for adding
unit tests. See the testing section in
[README.md](README.md#testing) for
tips on running tests.
1. Run `npm test` locally. Fix any issues before submitting your PR.
    1. Running `npm test` will format your code automatically.
1. After submitting a PR, Travis CI tests will run. Fix any issues
Travis CI reports.

## Publishing a new release

If you're a maintainer use `npm run release` to start the release
process and follow the instructions printed to the console.
