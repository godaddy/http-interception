# `@godaddy/http-interception`

Dumps requests and responses as newline delimited JSON that a browser performs
when visiting a web page. This allows for ease of scripting that wishes to
inspect what resources are used beyond parsing the HTML for links.

## Author

* [Bradley Farias](https://github.com/bmeck)

## Installation

```console
npm --global install @godaddy/http-interception
```

## Basic usage

```console
http-interception https://www.example.com
```

[https://www.example.com](https://www.example.com) will be visited in an
incognito window via [`puppeteer`](https://github.com/GoogleChrome/puppeteer).

## Setting cookies for login behavior

```console
http-interception --cookies cookies.json https://www.example.com
```

```jsonc
// cookies.json
// an array of cookie descriptors
[
  {
    "name": "foo",
    "value": "bar"

    // defaults to the navigation URL
    // will fill "domain" and "path" automatically, prefer this
    // "url"?: "https://www.example.com"

    // never include port
    // "domain"?: "www.example.com",
    // "path"?: "/",

    // our defaults are very Lax
    // "sameSite"?: "Lax",
    // "httpOnly"?: false,
    // "secure"?: false,

    // defaults to a session cookie
    // example of having a 1 minute cookie
    // "expires"?: Date.now() / 1000 + 60
  },

  {
    // this is a common foo bar in Japanese
    "name": "hoge",
    "value": "piyo"
  }
]
```

More info on cookies is on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie).

## Contributing

See the [Issues](issues) if you're interested in helping out; and look over
the [CONTRIBUTING.md](CONTRIBUTING.md) before submitting new Issues and Pull
Requests.

## Communication

For feature requests, and bugs please use GitHub issues.

Otherwise, use the [GoDaddy OSS Slack](https://godaddy-oss-slack.herokuapp.com/).

## Testing

Run the tests with:

```console
npm test
```

## License

[MIT](LICENSE)
