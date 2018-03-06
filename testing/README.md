
Install HTL's repo
-------------

```
git clone 
cd
npm install
```

Install Bulbs itself
-------------

This is pulled directly from Github because installing via `bower` doesn't install all the dependencies, so we can't run the tests.

```
git clone https://github.com/theonion/bulbs-public-ads-manager
cd bulbs-public-ads-manager
rm -rf .git
npm install
```

Running FMG Tests
-------------

FMG has defined a bunch of Karma-based unit tests. These are fairly important and we shouldn't PR anything that doesn't pass all tests.

```
cd bulbs-public-ads-manager
npm test
```


Building for local testing
--------------

```
npm run-script build
```


Testing in the browser
--------------

Make sure you have built `dist/script.js` before running this

```
# start a server on http://localhost:3001
sudo node server.js
```

You should see ads in Chrome. If not, check the Console for errors.

