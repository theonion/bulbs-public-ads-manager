# Testing Prebid integration withs bulbs

The following steps show how to build a test page that shows a single ad unit running Prebid.

## Key Files

```
testing/entry.js - combines bulbs + ad map
testing/ad_map.js - ad unit and prebid configuration
testing/webpack.js - webpack file to build bulbs + entry.js
testing/static/index.html - test page with a single ad unit
testing/dist/script.js - the compiled result of running webpack (gets loaded by "index.html")
```

## Setup / build

```
cd /path/to/bulbs-public-ads-manager/testing
npm install
npm run build
```

## Start server with modified host file

The following command will start a server, shadowing /etc/hosts while the server is running

```
sudo npm run up example.com
```

## Visit test page

Navigate to http://example.com

It is important to run the test page on `example.com` (or some real-ish domain) and NOT on localhost. For testing purposes, AppNexus never seems to bid on `localhost`.
