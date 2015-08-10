<strong><i>:exclamation: THIS REPO SHOULD NOT BE MADE PUBLIC :exclamation:</i></strong>

# bulbs-public-ads-maanger
Ads manager for public side of sites. Fills in ad slots.

## Setup

1. Install via bower, ```<version>``` being the version to depend on:
  ```bash
  $ bower install --save https://0469c955e10241b40fffe0225e29a3c238aadf69:x-oauth-basic@github.com/theonion/bulbs-public-ads-maanger.git\#\<version>
  ```

1. Provide ```adUnits``` module (???????????????)

1. Provide ```adsManager``` as a browserify dependency (????????????????)

1. Require and initialize ```AdsManager``` via a browserified file:
  ```javascript
  var ads = require('adsManager');
  // optionally, pass in true to use debug mode
  ads.init();
  ```

## Development
### Builds
To create a new build:
```bash
$ npm run build
```

### Tests
To run tests:
```bash
$ npm test
```
