const AdZone = require('./AdZone');

describe('AdZone', function() {
  describe('#getQueryParameter', function() {
    describe('with query string param', function() {
      it('returns the query param value', function() {
        const windowStub = {
          location: {
            search: '?adzone=foo'
          }
        };

        expect(AdZone.getQueryParameter(windowStub, 'adzone')).toEqual('foo');
      });
    });

    describe('with no query string params', function() {
      it('returns an empty string if missing query param', function() {
        const windowStub = {
          location: {
            search: '?adzone=foo'
          }
        };

        expect(AdZone.getQueryParameter(windowStub, 'missing')).toEqual('');
      });

      it('returns an empty string if completely empty params', function() {
        const windowStub = {
          location: {
            search: ''
          }
        };

        expect(AdZone.getQueryParameter(windowStub, 'missing')).toEqual('');
      });
    });
  });

  describe('#forcedAdZone', function () {
    describe('forced ad zone query param is present, but kinja is not on window', function () {
      beforeEach(function () {
        delete window.kinja;
      });

      it('returns the forced ad zone param', function () {
        const windowStub = {
          location: {
            search: '?adzone=reductress'
          }
        };

        expect(AdZone.forcedAdZone(windowStub)).toEqual('reductress');
      });
    });

    describe('kinja is not on window', function() {
      beforeEach(function() {
        delete window.kinja;
      });

      it('returns null', function() {
        expect(AdZone.forcedAdZone()).toEqual(null);
      });
    });

    describe('forced ad zone query param present', function() {
      beforeEach(function() {
        window.kinja = {};
      });

      it('returns the forced ad zone param', function() {
        const windowStub = {
          location: {
            search: '?adzone=foo'
          }
        };

        expect(AdZone.forcedAdZone(windowStub)).toEqual('foo');
      });
    });

    describe('forced collapsed zone specified based on blog rule', function() {
      beforeEach(function() {
        window.kinja = {
          postMeta: {
            tags: ['gamergate', 'foo', 'bar', 'baz']
          }
        };
      });

      it('returns blog rule forced ad zone', function() {
        const windowStub = {
          location: {
            search: '?adzone=reductress'
          }
        };

        expect(AdZone.forcedAdZone(windowStub)).toEqual('collapse');
      });

      it('returns blog rule forced ad zone only if no - non collapse', function() {
        const windowStub = {
          location: {
            search: '?adzone=reductress'
          }
        };

        window.kinja.postMeta.tags.push('wyts');

        expect(AdZone.forcedAdZone(windowStub)).toEqual(null);
      });
    });

    describe('post has specific forced ad zone', function() {
      beforeEach(function() {
        window.kinja = {
          postMeta: {
            tags: [],
            post: {
              adZone: 'someThing'
            }
          }
        };
      });

      it('returns blog rule forced ad zone', function() {
        const windowStub = {
          location: {
            search: ''
          }
        };

        expect(AdZone.forcedAdZone(windowStub)).toEqual('someThing');
      });
    });
  });
});
