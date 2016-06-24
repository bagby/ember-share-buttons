import Ember from 'ember';
import template from '../templates/components/share-buttons';
import $ from 'jquery';

const defaultNetworks = [
  'pinterest',
  'twitter',
  'facebook',
  'whatsapp',
  'googlePlus',
  'reddit',
  'linkedin',
  'email'
];

export default Ember.Component.extend({
  classNames: ['share-buttons'],
  layout: template,
  config: null,
  tagName: 'ul',

  didReceiveAttrs() {
    let config = this.get('config');
    let networks;
    if (config && config.networks) {
      networks = config.networks.map(expandNetworkConfig)
        .filter(n => defaultNetworks.indexOf(n.name) !== -1);
    } else {
      networks = defaultNetworks.map(expandNetworkConfig);
    }
    this.set('networks', networks);
  },

  shareActions: {
    facebook(config) {
      if (config.appId == null || !window.FB) {
        openPopup('https://www.facebook.com/sharer/sharer.php', {
          u: this.url()
        });
      } else {
        window.FB.ui({
          method:'feed',
          name: this.title(),
          link: this.url(),
          picture: this.image(),
          caption: this.caption(),
          description: this.description()
        });
      }
    },
    twitter() {
      openPopup('https://twitter.com/intent/tweet', {
        text: this.description(),
        url: this.url()
      });
    },
    googlePlus() {
      openPopup('https://plus.google.com/share', {
        url: this.url()
      });
    },
    pinterest() {
      openPopup('https://www.pinterest.com/pin/create/button', {
        url: this.url(),
        media: this.image(),
        description: this.description()
      });
    },
    linkedin() {
      openPopup('https://www.linkedin.com/shareArticle', {
        mini: 'true',
        url: this.url(),
        title: this.title(),
        summary: this.description()
      });
    },

    email() {
      openPopup('mailto:', {
        subject: this.title(),
        body: `${this.description()}\n${this.url()}`
      });
    },

    reddit() {
      openPopup('http://www.reddit.com/submit', {
        url: this.url(),
        title: this.title()
      });
    },

    whatsapp() {
      openPopup('whatsapp://send', {
        text: `${this.description} ${this.url()}`
      });
    }
  },

  actions: {
    share(network) {
      let fn = this.shareActions[network.name];
      if (fn) {
        fn.call(this, network);
      }
    }
  },

  didInsertElement() {
    this._super.apply(this, arguments);

    let facebookConfig = this.get('networks').find(n => n.name === 'facebook');
    if (facebookConfig && facebookConfig.appId != null) {
      injectFacebookSdk(facebookConfig.appId);
    }
  },

  url() {
    return window.location.href;
  },

  title() {
    let content;
    if ((content = (document.querySelector('meta[property="og:title"]') ||
                  document.querySelector('meta[name="twitter:title"]')))) {
      return content.getAttribute('content');
    } else if ((content = document.querySelector('title'))) {
      return content.textContent || content.innerText;
    }
  },

  image() {
    let content;
    if ((content = (document.querySelector('meta[property="og:image"]') ||
                    document.querySelector('meta[name="twitter:image"]')))) {
      return content.getAttribute('content');
    }
  },

  caption() {
  },

  description() {
    let content;
    if ((content = (document.querySelector('meta[property="og:description"]') ||
                  document.querySelector('meta[name="twitter:description"]') ||
                  document.querySelector('meta[name="description"]')))) {
      return content.getAttribute('content');
    } else {
      return '';
    }
  }
});

function expandNetworkConfig(entry) {
  if (typeof entry === 'string') {
    return { name: entry };
  } else {
    return entry;
  }
}

function injectFacebookSdk(appId) {
  let bodyTag = $(document).find('body')[0];

  if (!window.FB && !bodyTag.querySelector('#fb-root')) {
    let script = document.createElement('script');
    script.text = `window.fbAsyncInit=function(){FB.init({appId:'${appId}',status:true,xfbml:true})};(function(e,t,n){var r,i=e.getElementsByTagName(t)[0];if (e.getElementById(n)){return}r=e.createElement(t);r.id=n;r.src='//connect.facebook.net/en_US/all.js';i.parentNode.insertBefore(r,i)})(document,'script','facebook-jssdk');`;

    let fbRoot = document.createElement('div');
    fbRoot.id = 'fb-root';

    bodyTag.appendChild(fbRoot);
    bodyTag.appendChild(script);
  }
}

function openPopup(target, params) {

  let qs = Object.keys(params)
    .filter(k => params[k])
    .map(k => `${k}=${toRFC3986(params[k])}`).join('&');

  if (qs) {
    target = `${target}?${qs}`;
  }

  let popup = {
    width: 500,
    height: 350
  };

  popup.top = (screen.height / 2) - (popup.height / 2);
  popup.left = (screen.width / 2)  - (popup.width / 2);

  window.open(
    target,
    'targetWindow', `
          toolbar=no,
          location=no,
          status=no,
          menubar=no,
          scrollbars=yes,
          resizable=yes,
          left=${popup.left},
          top=${popup.top},
          width=${popup.width},
          height=${popup.height}
        `
  );
}

function toRFC3986(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, function(c) {
    return `%${c.charCodeAt(0).toString(16)}`;
  });
}
