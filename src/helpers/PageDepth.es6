export function getPageDepth() {
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

  return window.parseInt(pdCookieValue, 10);
};
