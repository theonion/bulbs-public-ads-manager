var AdUnits = {
  settings: {
    dfpSite: 'onion',
    closeDelay: 1250
  }
};

AdUnits.units = {
  // This is used at the top of the homepage, as well as at the start of every article
  'header': {
    'slotName': 'header',
    'sizes': [
      [[970, 0], [[728, 90], [970, 415], [970, 250], [970, 90], [970, 66], [970, 418]]],
      [[728, 0], [728, 90]],
      [[0, 0], [320, 50]]
    ]
  },

  // Homepage 728's
  'homepage-secondary': {
    'slotName': 'homepage-secondary',
    'sizes': [
      [[1240, 0], [728, 90]],

      [[0, 0], [320, 50]]
      // viewport above needs to be 1370 for .large-thing
      // to accommodate a 728x90 slot
    ]
  },
  'homepage-tertiary': {
    'slotName': 'homepage-tertiary',
    'sizes': [
      [[1240, 0], [728, 90]],
      [[400, 0], [320, 50]],
      [[0, 0], []]
      // viewport above needs to be 1370 for .large-thing
      // to accommodate a 728x90 slot
    ]
  },

  // This one shows up on the homepage & article pages
  'sidebar-primary': {
    'slotName': 'sidebar-primary',
    'sizes': [
      [[1000, 0], [300, 250]],
      [[0, 0], []],
    ]
  },

  // Secondary and tertiary only show up on the homepage
  'sidebar-secondary': {
    'slotName': 'sidebar-secondary',
    'sizes': [
      [[0, 0], [300, 250]],
    ]
  },

  // Tertiary only shows up on the homepage, tablet and up
  'sidebar-tertiary': {
    'slotName': 'sidebar-tertiary',
    'sizes': [
      [[1240, 0], [300, 250]],
      [[0, 0], []]
    ]
  },

  'wallpaper': {
    slotName: 'wallpaper',
    sizes: [
      [[970, 0], [1, 1]],
      [[0, 0], []]
    ]
  },

  'inread': {
    'slotName': 'inread',
    'sizes': [
      [[0,0], [1,1]]
    ]
  },

  'yieldmo': {
    'slotName': 'article-inbetween',
    'sizes': [
      [[0,0], [300,250]]
    ]
  },

};

module.exports = AdUnits;
