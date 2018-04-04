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




### Dependencies

`google gpt` - The main google library that provides access to the DFP ad server.

`index exchange` - Header bidding wrapper. This library wraps functions contained within google gpt. It conducts a front-end auction where ad networks compete for the best price. Once each price, the price is appended to the corresponding ad call, which directs the request to the correct campaign in DFP. Each price range for each bidder maps to line item creative inside google DFP. 

These price-based lines are auto generated ahead of time through index exchange via the google DFP API. These lines are created at the time of integration and aren't generally modified unless there's a major change to index's internal API.

`amazon aps` - APS is amazon's header bidding wrapper. It is similar to index, but at the current time it is only capable of delivering amazon product ads. There are future plans to add addiotional bidders to this wrapper.

### Features and Terminology

`SRA` - Single request Architecture. Allows multiple ad request to be consolidated into the same http request. The benefits of this are both load time performance as elimination of async issues pertaining to the order in which ads are returned. According to google, SRA is the only way to guarantee roadblock delivery. Additional docs [here](https://support.google.com/dfp_premium/answer/177277?hl=en)

`Correlator` - A correlator is a randomly generated number which is sent alongside each ad request. Ad requests made within a 30 second window keep the same correlator. This value is used to tie ad impressions to a single pageview. This becomes most relevant when roadblocks (aka takeovers) are in play. If a multiple-ad takeover is delivered through DFP, the correlator will tie together each request to ensure that ads are delivered together.

The downside to this is that ad requests with mathching correlators can only deliver each creative contained in the corresponding line item once. So for example if a direct (takeover) campaign contains only 2 ads, but a page has 4 ad slots on it, 2 of the ad slots won't deliver an ad.

`eagerLoad` - Indicates that an ad request is made immediately on page load. The opposite of this is often called dynamically loaded or waypoint loaded.

`key value / targeting` - These are essentially query string parameters appended to each ad call. These may specify things like price, adzone, meta tags, or audience id.

`slotRenderEnded` - The GPT function callback which executes once an ad has been returned. Note that this function will run regardless of if an ad is empty or not. It is only an indicator of a successful API response from DFP.

## Development

### Tests
To run tests:
```bash
$ npm test
```

Tests will run on travis-ci as part of the pull request process.
The tests are primarily comprised of Sinon Mocks And Stubs. We try to maintain code coverage as new functions are added.

#### Dependencies
This project should never have outside, frontend dependencies since it really should be one of, if not, _the_ first JS to run on the page. Otherwise, potential ad views could be lost.

### Build Prebid

Download the latest version of PrebidJS

```
$ git clone https://github.com/prebid/Prebid.js.git
$ cd Prebid.js
$ git checkout 1.6.0 # optional
$ npm install
$ curl -o modules/criteoBidAdapter.js "https://raw.githubusercontent.com/criteo-forks/Prebid.js/criteo-1.0/modules/criteoBidAdapter.js"
```

Build the prebid.js binary, including only the specified adapters

```
gulp build --modules=aolBidAdapter,openxBidAdapter,rubiconBidAdapter,appnexusBidAdapter,yieldmoBidAdapter,criteoBidAdapter
```


### Testing Prebid Examples

There is an `examples` directory which contains a test page, ad map, minimal webpack file needed to build a standalone test page running on a local server.



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
