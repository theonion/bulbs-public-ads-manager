# Testing Prebid integration withs bulbs

The following steps show how to build a test page that shows a single ad unit running Prebid.

## Key Files

```
examples/app.js - combines bulbs + ad map
examples/webpack.config.js - build app.js
examples/public/index.html - test page
examples/dist/script.js - the compiled result from webpack
examples/server.js - runs a local server for the test page
```

## Setup / build

```
cd /path/to/bulbs-public-ads-manager/examples
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