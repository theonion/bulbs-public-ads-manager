describe('Ad Units', function() {
  var adUnits = require('./ad-units');

  describe('#resetClasses', function() {
    var parentAdElement;

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      parentAdElement.className = 'pinned mobile kargo';
      $('body').append(parentAdElement);
      adUnits.resetClasses(parentAdElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    it('removes `pinned` class', function() {
      expect($(parentAdElement).hasClass('pinned')).to.be.false;
    });

    it('removes `mobile` class', function() {
      expect($(parentAdElement).hasClass('mobile')).to.be.false;
    });

    it('removes `kargo` class', function() {
      expect($(parentAdElement).hasClass('kargo')).to.be.false;
    });
  });

  describe('#makeAdTogglable', function() {
    var parentAdElement;
    var adElement;

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      parentAdElement.id = 'parent-ad-element';
      adElement = document.createElement('div');
      parentAdElement.appendChild(adElement);
      $('body').append(parentAdElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    describe('always', function() {
      beforeEach(function() {
        adUnits.makeAdTogglable(adElement);
      });

      it('adds the pinned class to the parent', function() {
        expect($(parentAdElement).hasClass('pinned')).to.be.true;
      });

      it('adds the hide-toggle-btn class to the parent', function() {
        expect($(parentAdElement).hasClass('hide-toggle-btn')).to.be.true;
      });

      it('adds the open class to the parent', function() {
        expect($(parentAdElement).hasClass('pinned')).to.be.true;
      });

      it('appends the toggle button over the ad element', function() {
        var toggleButton = adElement.parentElement.children[1];
        expect($(toggleButton).hasClass('toggle-btn')).to.be.true;
      });
    });

    describe('delayAdToggle()', function () {
      it('is called by makeAdTogglable', function () {
        var delayAdToggle = spyOn(adUnits, 'delayAdToggle');
        adUnits.makeAdTogglable(adElement);
        expect(delayAdToggle.called).to.be.true;
      });

      it('removes the hide-toggle-btn class from the parent', function() {
        expect($(parentAdElement).hasClass('hide-toggle-btn')).to.be.false;
      });
    });
  });

  describe('#toggleAd', function() {
    var parentAdElement, adElement, toggleButton;

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      parentAdElement.id = 'parent-ad-element';
      parentAdElement.className = 'open';
      adElement = document.createElement('div');
      adElement.id = 'ad-slot';
      toggleButton = document.createElement('div');
      toggleButton.className = 'toggle-btn open';
      parentAdElement.appendChild(adElement);
      parentAdElement.appendChild(toggleButton);
      $('body').append(parentAdElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    it('changes class of toggle button from open to closed', function() {
      expect($(toggleButton).hasClass('open')).to.be.true;
      expect($(toggleButton).hasClass('closed')).to.be.false;
      adUnits.toggleAd(adElement);
      expect($(toggleButton).hasClass('open')).to.be.false;
      expect($(toggleButton).hasClass('closed')).to.be.true;
    });

    it('changes class of parent element from open to closed', function() {
      expect($(parentAdElement).hasClass('open')).to.be.true;
      expect($(parentAdElement).hasClass('closed')).to.be.false;
      adUnits.toggleAd(adElement);
      expect($(parentAdElement).hasClass('open')).to.be.false;
      expect($(parentAdElement).hasClass('closed')).to.be.true;
    });
  });

  describe('#delayAdToggle', function() {
    var parentAdElement, adElement, toggleButton;

    beforeEach(function(done) {
      parentAdElement = document.createElement('div');
      parentAdElement.className = 'hide-toggle-btn';
      adElement = document.createElement('div');
      adElement.id = 'ad-slot';
      parentAdElement.appendChild(adElement);
      toggleButton = document.createElement('div');
      toggleButton.className = 'toggle-btn open';
      adElement.parentElement.appendChild(toggleButton);
      $('body').append(parentAdElement);
      adUnits.toggleDelay = 200;
      TestHelper.stub(adUnits, 'toggleAd');
      TestHelper.stub(adUnits, 'initToggleHandler');
      adUnits.delayAdToggle(adElement, toggleButton);
      setTimeout(function() {
        done();
      }, 250);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    it('calls toggle ad after the delay', function() {
      expect(adUnits.toggleAd.calledWith(adElement)).to.be.true;
    });

    it('calls initToggleHandler after the delay', function() {
      expect(adUnits.initToggleHandler.calledWith(adElement, toggleButton)).to.be.true;
    });

    it('removes the hide-toggle-btn class from the parent', function() {
      expect($(parentAdElement).hasClass('hide-toggle-btn')).to.be.false;
    });
  });

  describe('#setupMobileSlotClasses', function() {
    var parentAdElement;

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      adElement = document.createElement('div');
      adElement.id = 'ad-slot';
      parentAdElement.appendChild(adElement);
      $('body').append(parentAdElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    describe('always', function() {
      beforeEach(function() {
        var e = {
          slot: {
            L: ''
          }
        };
        adUnits.setupMobileSlotClasses(e, adElement);
      });

      it('adds the `mobile` class to the parent', function() {
        expect($(parentAdElement).hasClass('mobile')).to.be.true;
      });
    });

    describe('kargo unit', function() {
      beforeEach(function() {
        var e = {
          slot: {
            L: 'something-kargo-something'
          }
        };
        adUnits.setupMobileSlotClasses(e, adElement);
      });

      it('adds `kargo` class to the parent', function() {
        expect($(parentAdElement).hasClass('kargo')).to.be.true;
      });
    });

    describe('non-kargo unit', function() {
      beforeEach(function() {
        var e = {
          slot: {
            L: ''
          }
        };
        adUnits.setupMobileSlotClasses(e, parentAdElement);
      });

      it('does not add kargo class', function() {
        expect($(parentAdElement).hasClass('kargo')).to.be.false;
      });
    });
  });

  describe('#handleMobileHeaderSlot', function() {
    var parentAdElement;
    var e = {};

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      adElement = document.createElement('div');
      adElement.id = 'ad-slot';
      parentAdElement.appendChild(adElement);
      $('body').append(parentAdElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    describe('parent does not have `header-wrapper`', function() {
      it('does not setup mobile slot classes', function() {
        sinon.stub(adUnits, 'setupMobileSlotClasses');
        adUnits.handleMobileHeaderSlot(e, adElement);
        expect(adUnits.setupMobileSlotClasses.called).to.be.false;
      });

      it('makes ad togglable', function() {
        sinon.stub(adUnits, 'makeAdTogglable');
        adUnits.handleMobileHeaderSlot(e, adElement);
        expect(adUnits.makeAdTogglable.calledWith(adElement)).to.be.true;
      });
    });

    describe('parent has header wrapper', function() {
      beforeEach(function() {
        $(parentAdElement).addClass('header-wrapper');
        adUnits.handleMobileHeaderSlot(e, adElement);
      });

      it('makes ad closeable', function() {
        expect(adUnits.makeAdTogglable.calledWith(adElement)).to.be.true;
      });

      it('sets up mobile slot classes', function() {
        expect(adUnits.setupMobileSlotClasses.calledWith(e, adElement)).to.be.true;
      });
    });
  });

  describe('#handleLeaderboardHeaderSlot', function() {
    var parentAdElement;
    var e = {};

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      $('body').append(parentAdElement);
      adUnits.handleLeaderboardHeaderSlot(e, parentAdElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    it('makes the ad closeable', function() {
      expect(adUnits.makeAdTogglable.calledWith(parentAdElement)).to.be.true;
    });
  });

  describe('#handlePagePushHeaderSlot', function() {
    var parentAdElement, adElement, adIframe;
    var e = {
      slot: {
        getSlotElementId: function() {
          return 'ad-slot';
        }
      }
    };

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      adElement = document.createElement('div');
      adElement.id = 'ad-slot';
      adElement.className = 'collapsed';
      adIframe = document.createElement('iframe');
      adElement.appendChild(adIframe);
      parentAdElement.appendChild(adElement);
      $('body').append(parentAdElement);
      TestHelper.stub(adUnits, 'prepPagePushIframe');
      adUnits.handlePagePushHeaderSlot(e, adElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    it('adds page-push to parent element', function() {
      expect($(parentAdElement).hasClass('page-push')).to.be.true;
    });

    it('collapses the ad by default', function() {
      expect($(adElement).hasClass('collapsed')).to.be.false;
    });

    it('preps the page push iframe', function() {
      expect(adUnits.prepPagePushIframe.called).to.be.true;
    });
  });

  describe('#handleSuperHeroHeaderSlot', function() {
    var parentAdElement, adElement, adIframe;
    var e = {
      slot: {
        getSlotElementId: function() {
          return 'ad-slot';
        }
      }
    };

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      adElement = document.createElement('div');
      adElement.id = 'ad-slot';
      parentAdElement.appendChild(adElement);
      $('body').append(parentAdElement);
      adUnits.handleSuperHeroHeaderSlot(e, adElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    it('adds super-hero to parent element', function() {
      expect($(parentAdElement).hasClass('super-hero')).to.be.true;
    });

    it('sets the parent element style height', function() {
      expect(parentAdElement.style.height).not.to.be.empty;
    });
  });

  describe('#prepPagePushIframe', function() {
    var parentAdElement, adElement, adIframe;

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      adElement = document.createElement('div');
      adElement.id = 'ad-slot';
      adElement.className = 'collapsed';
      adIframe = document.createElement('iframe');
      adElement.appendChild(adIframe);
      parentAdElement.appendChild(adElement);
      $('body').append(parentAdElement);
      adUnits.prepPagePushIframe(adElement, adIframe);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    it('removes collapsed class when expand event fired', function(done) {
      adElement.className = 'collapsed';
      var event = new Event('PagePush:Expand');
      var iframeDoc = adIframe.contentDocument || adIframe.contentWindow.document;
      iframeDoc.dispatchEvent(event);
      setTimeout(function() {
        expect($(adElement).hasClass('collapsed')).to.be.false;
        done();
      }, 100);
    });

    it('adds collapsed class when collapsed event fired', function(done) {
      adElement.className = '';
      var event = new Event('PagePush:Collapse');
      var iframeDoc = adIframe.contentDocument || adIframe.contentWindow.document;
      iframeDoc.dispatchEvent(event);
      setTimeout(function() {
        expect($(adElement).hasClass('collapsed')).to.be.true;
        done();
      }, 100);
    });
  });

  describe('#headerSlotRenderEnded', function() {
    var parentAdElement, adElement;

    beforeEach(function() {
      parentAdElement = document.createElement('div');
      parentAdElement.id = 'parent-ad-element';
      adElement = document.createElement('div');
      adElement.id = 'ad-slot';
      parentAdElement.appendChild(adElement);
      $('body').append(parentAdElement);
    });

    afterEach(function() {
      document.body.removeChild(parentAdElement);
    });

    it('resets all the classes', function() {
      sinon.stub(adUnits, 'resetClasses');
      adUnits.headerSlotRenderEnded({ size: [320, 50]}, adElement);
      expect(adUnits.resetClasses.calledWith(parentAdElement)).to.be.true;
    });

    it('defers to `handleMobileHeaderSlot` if 320x50', function() {
      sinon.stub(adUnits, 'handleMobileHeaderSlot');
      var e = { size: [320, 50]};
      adUnits.headerSlotRenderEnded(e, adElement);
      expect(adUnits.handleMobileHeaderSlot.calledWith(e, adElement)).to.be.true;
    });

    it('defers to `handleLeaderboardHeaderSlot` if 728x90', function() {
      sinon.stub(adUnits, 'handleLeaderboardHeaderSlot');
      var e = { size: [728, 90]};
      adUnits.headerSlotRenderEnded(e, adElement);
      expect(adUnits.handleLeaderboardHeaderSlot.calledWith(e, adElement)).to.be.true;
    });

    it('defers to `handlePagePushHeaderSlot` if 1x1', function() {
      sinon.stub(adUnits, 'handlePagePushHeaderSlot');
      var e = { size: [1, 1]};
      adUnits.headerSlotRenderEnded(e, adElement);
      expect(adUnits.handlePagePushHeaderSlot.calledWith(e, adElement)).to.be.true;
    });

    it('defers to `handleSuperHeroHeaderSlot` if 1280x720', function() {
      sinon.stub(adUnits, 'handleSuperHeroHeaderSlot');
      var e = { size: [1280, 720]};
      adUnits.headerSlotRenderEnded(e, adElement);
      expect(adUnits.handleSuperHeroHeaderSlot.calledWith(e, adElement)).to.be.true;
    });
  });

  describe('header slot config', function() {
    it('matches up to the DFP `header` slot name', function() {
      expect(adUnits.units.header.slotName).to.equal('header');
    });

    it('allows these slots on desktop', function() {
      expect(adUnits.units.header.sizes[0]).to.eql([[970, 0], [[728, 90], [1,1], [970, 415], [970, 250], [970, 90], [1280, 720]]]);
    });

    it('allows these slots on tablet', function() {
      expect(adUnits.units.header.sizes[1]).to.eql([[728, 0], [[1, 1], [728, 90], [1280, 720]]]);
    });

    it('allows these slots on mobile', function() {
      expect(adUnits.units.header.sizes[2]).to.eql([[0, 0], [[1,1], [320, 50], [300, 250], [1280, 720]]]);
    });

    it('sets up `headerSlotRenderEnded` as the callback', function() {
      expect(adUnits.units.header.onSlotRenderEnded).to.equal(adUnits.headerSlotRenderEnded);
    });
  });
});
