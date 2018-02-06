var PageDepth = {
  /**
   * Retrieves the current page depth from the site cookie
   *
   * @returns {Number}
   */
  getPageDepth: function() {
    var cookies = (window.document.cookie + '').split('; ') || [],
      pdCookieValue = -1;

    cookies.forEach(function(cookie) {
      var parts, name, value;

      parts = cookie.split('=');
      name = window.decodeURIComponent(parts.shift());
      value = window.decodeURIComponent(parts.shift());

      // The cookie is named 'pageDepth' ~~~
      if (name === 'pageDepth') {
        pdCookieValue = window.parseInt(value, 10);
      }
    });
    return window.parseInt(pdCookieValue, 10);
  },
  /**
   * Increments page depth of the site cookie
   */
  setPageDepth: function() {
    var cookies = (window.document.cookie + '').split('; ') || [],
      pdCookieValue = -1;

    cookies.forEach(function(cookie) {
      var parts, name, value;

      parts = cookie.split('=');
      name = window.decodeURIComponent(parts.shift());
      value = window.decodeURIComponent(parts.shift());

      // The cookie is named 'pageDepth' ~~~
      if (name === 'pageDepth') {
        pdCookieValue = window.parseInt(value, 10);
      }

    });
    if (pdCookieValue === -1) {
      pdCookieValue = 1;
    } else {
      if (pdCookieValue < 5) {
        pdCookieValue += 1;
      }
    }
    window.document.cookie = 'pageDepth=' + pdCookieValue + '; expires=1; path=/';
  }
};
module.exports = PageDepth;
