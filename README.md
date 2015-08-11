<strong><i>:exclamation: THIS REPO SHOULD NOT BE MADE PUBLIC :exclamation:</i></strong>

# bulbs-public-ads-manager
Ads manager for public side of sites. Fills in ad slots.

## Setup

1. Install via bower, ```<version>``` being the version to depend on:
  ```bash
  $ bower install --save https://0469c955e10241b40fffe0225e29a3c238aadf69:x-oauth-basic@github.com/theonion/bulbs-public-ads-manager.git\#\<version>
  ```

1. Create a browserify pipeline, with an argument specifying where to find the
    ```bulbs.ads.units``` module. In this particular example, it has been
    provided to the pipeline browserify setting:

  ```python
  PIPELINE_BROWSERIFY_ARGUMENTS = "-r {}:{}".format(os.path.join(STATIC_ROOT, "adUnits.js"), "bulbs.ads.units")
  ```

1. Require and initialize the ads manager code via a browserified file (path may differ
  based on configuration):

  ```javascript
  var adsManager = require('./bower_components/bulbs-public-ads-manager/src/manager');

  adsManager.init();
  ```

## Development

### Tests
To run tests:
```bash
$ npm test
```

### Notes
#### Dependencies
This project should never have outside, frontend dependencies since it really should be one of, if not, _the_ first JS to run on the page. Otherwise, potential ad views could be lost.

