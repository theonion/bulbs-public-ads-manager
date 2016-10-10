# bulbs-public-ads-manager
Ads manager for public side of sites. Fills in ad slots.

## Setup

1. Install via bower, ```<version>``` being the version to depend on:
  ```bash
  $ bower install --save https://github.com/theonion/bulbs-public-ads-manager.git\#\<version>
  ```

1. Require and initialize the ads manager code via a browserified file (path may differ
  based on configuration):

  ```javascript
  var adsManager = require('./bower_components/bulbs-public-ads-manager/src/manager');

  adsManager.init(); // Returns a reference to the AdManager if needed further on the page
  ```

1. Ensure ad code is referenced as high as possible on the page, preferably as one of the first things that loads, so that no ad impressions are lost.

## Development

### Tests
To run tests:
```bash
$ npm test
```

Tests will run on travis-ci as part of the pull request process.

### Notes
#### Dependencies
This project should never have outside, frontend dependencies since it really should be one of, if not, _the_ first JS to run on the page. Otherwise, potential ad views could be lost.

## Creating a new release

* inside of your ```bower.json``` and ```package.json``` files update the version in accordance with [semver](http://semver.org/)
* Create a tag for your release
```bash
$ git tag <tag version number>
```
* push tag
```bash
$ git push origin --tags
```
