import Ember from 'ember';
import defaultConfig from '../utils/share-config';
import _ from 'lodash/lodash';
import template from '../templates/components/share-buttons';

const { computed, $ } = Ember;
const { readOnly } = computed;
const capitalize = Ember.String.capitalize;

export default Ember.Component.extend({
  classNames: ['share-buttons'],
  layout: template,
  enabledNetworks: readOnly('shareConfig.ui.enabledNetworks'),
  config: {},

  didInsertElement() {
    this._super.apply(this, arguments);

    let dynamicConfig = {
      title: this._defaultTitle(),
      image: this._defaultImage(),
      description: this._defaultDescription()
    };
    let _config = _.merge({}, defaultConfig, this.get('config'), dynamicConfig);

    this.set('shareConfig', _config);

    // Disable whatsapp display if not a mobile device
    if (_config.networks.whatsapp.enabled && !this._isMobile()) {
      _config.networks.whatsapp.enabled = false;
    }

    // Default order of networks if no network order entered
    if (_config.ui.networkOrder.length === 0) {
      _config.ui.networkOrder = [
        'pinterest',
        'twitter',
        'facebook',
        'whatsapp',
        'googlePlus',
        'reddit',
        'linkedin',
        'email'
      ];
    }

    for (let network of Object.keys(_config.networks)) {
      if (_config.ui.networkOrder.indexOf(network.toString()) < 0) {
        _config.networks[network].enabled = false;
        _config.ui.networkOrder.push(network);
      }
    }

    this._fixFlyout();
    this._detectNetworks();
    this._normalizeNetworkConfiguration();

    // Inject Facebook JS SDK (if Facebook is enabled)
    if (_config.networks.facebook.enabled && _config.networks.facebook.loadSdk) {
      this._injectFacebookSdk();
    }

    //TODO: css hide the disabled networks

    //let networksCon = this.$(`${_config.ui.namespace}social`)[0];
    let networks = this.$('li');

    //instance.addEventListener('click', () =>
      //this._eventToggle(instance, networksCon)
    //);

    let mouseupNetworkListener = (name, network) => {
      return () => {
        this[`_network${capitalize(name)}`](network);
      };
    };

    let hookListener = (when, name) => {
      return () => {
        this._hook(when, name);
      };
    };
    // Add listener to activate networks and close button
    networks.each((i, network) => {
      let $network = $(network);

      if (typeof(network) !== "undefined") {
        let name = $network.attr('data-network');
        let a = $network.find('a')[0];

        $network.addClass(_config.networks[name].class);

        a.addEventListener('mousedown', hookListener('before', name));
        a.addEventListener('mouseup', mouseupNetworkListener(name, network));
        a.addEventListener('click', hookListener('after', name));
      }
    });
  },

  _eventToggle(button, networks) {
    if (this._hasClass(networks, 'active')) {
      this._eventClose(networks);
    } else {
      this._eventOpen(button, networks);
    }
  },

  _eventOpen(button, networks) {
    if (this._hasClass(networks, 'load')) {
      this._removeClass(networks, 'load');
    }
    if (this.collision) {
      this._collisionDetection(button, networks);
    }

    this._addClass(networks, 'active');
  },

  _eventClose(button) {
    this._removeClass(button, 'active');
  },

  _eventListen(button, networks) {
    let dimensions = this._getDimensions(button, networks);
    if (this.listener === null) {
      this.listener = window.setInterval(() =>
        this._adjustClasses(button, networks, dimensions), 100
      );
    } else {
      window.clearInterval(this.listener);
      this.listener = null;
    }
  },

  /**
   * @method _fixFlyout
   * @description Fixes the flyout entered by the user to match their provided
   * namespace
   * @private
   */
  _fixFlyout() {
    let config = this.get('shareConfig');

    let flyouts = config.ui.flyout.split(' ');
    if (flyouts[0].substring(0,config.ui.namespace.length) !== config.ui.namespace) {
      flyouts[0] = `${config.ui.namespace}${flyouts[0]}`;
    }
    if (flyouts[1].substring(0,config.ui.namespace.length) !== config.ui.namespace) {
      flyouts[1] = `${config.ui.namespace}${flyouts[1]}`;
    }
    config.ui.flyout = flyouts.join(' ');
  },

  /**
   * @method _collisionDetection
   * @description Adds listeners the first time a button is clicked to call
   * this._adjustClasses during scrolls and resizes.
   * @private
   *
   * @param {DOMNode} button - share button
   * @param {DOMNode} networks - list of social networks
   */
  _collisionDetection(button, networks) {
    let dimensions = this._getDimensions(button, networks);
    this._adjustClasses(button, networks, dimensions);

    if (!button.classList.contains('clicked')) {
      window.addEventListener('scroll', () =>
        this._adjustClasses(button, dimensions));
      window.addEventListener('resize', () =>
        this._adjustClasses(button, dimensions));
      button.classList.add('clicked');
    }
  },

  /**
   * @method _getDimensions
   * @description Returns an object with the dimensions of the button and
   * label elements of a Share Button.
   * @private
   *
   * @param {DOMNode} button
   * @param {DOMNode} networks
   * @returns {Object}
   */
  _getDimensions(button, networks) {
    return {
      networksWidth: networks.offsetWidth,
      buttonHeight: button.offsetHeight,
      buttonWidth: button.offsetWidth
    };
  },

  /**
   * @method _adjustClasses
   * @description Adjusts the positioning of the list of social networks based
   * off of where the share button is relative to the window.
   *
   * @private
   * @param {DOMNode} button
   * @param {DOMNode} networks
   * @param {Object} dimensions
   */
  _adjustClasses(button, networks, dimensions) {
    let config = this.get('shareConfig');

    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let leftOffset = button.getBoundingClientRect().left +
      dimensions.buttonWidth / 2;
    let rightOffset = windowWidth - leftOffset;
    let topOffset = button.getBoundingClientRect().top +
      dimensions.buttonHeight / 2;
    let position =
      this._findLocation(leftOffset, topOffset, windowWidth, windowHeight);

    if (position[1] === "middle" && position[0] !== "center" &&
        ((position[0] === "left" &&
          windowWidth <= leftOffset + 220 + dimensions.buttonWidth / 2) ||
        (position[0] === "right" &&
          windowWidth <= rightOffset + 220 + dimensions.buttonWidth / 2)
        )
      ) {
        networks.classList.add(`${config.ui.namespace}top`);
        networks.classList.remove(`${config.ui.namespace}middle`);
        networks.classList.remove(`${config.ui.namespace}bottom`);
    }
    else {
      switch(position[0]) {
        case "left":
          networks.classList.add(`${config.ui.namespace}right`);
          networks.classList.remove(`${config.ui.namespace}center`);
          networks.classList.remove(`${config.ui.namespace}left`);
          break;
        case "center":
          if (position[1] !== "top") {
            networks.classList.add(`${config.ui.namespace}top`);
          }
          networks.classList.add(`${config.ui.namespace}center`);
          networks.classList.remove(`${config.ui.namespace}left`);
          networks.classList.remove(`${config.ui.namespace}right`);
          networks.classList.remove(`${config.ui.namespace}middle`);
          break;
        case "right":
          networks.classList.add(`${config.ui.namespace}left`);
          networks.classList.remove(`${config.ui.namespace}center`);
          networks.classList.remove(`${config.ui.namespace}right`);
          break;
      }
      switch(position[1]) {
        case "top":
          networks.classList.add(`${config.ui.namespace}bottom`);
          networks.classList.remove(`${config.ui.namespace}middle`);
          if (position[0] !== "center") {
            networks.classList.remove(`${config.ui.namespace}top`);
          }
          break;
        case "middle":
          if (position[0] !== "center") {
            networks.classList.add(`${config.ui.namespace}middle`);
            networks.classList.remove(`${config.ui.namespace}top`);
          }
          networks.classList.remove(`${config.ui.namespace}bottom`);
          break;
        case "bottom":
          networks.classList.add(`${config.ui.namespace}top`);
          networks.classList.remove(`${config.ui.namespace}middle`);
          networks.classList.remove(`${config.ui.namespace}bottom`);
          break;
      }
    }
  },

  /**
   * @method _findLocation
   * @description Finds the location of the label given by its x and y value
   * with respect to the window width and window height given.
   * @private
   *
   * @param {number} labelX
   * @param {number} labelY
   * @param {number} windowWidth
   * @param {number} windowHeight
   * @returns {Array}
   */
  _findLocation(labelX, labelY, windowWidth, windowHeight) {
    let xPosition = ["left", "center", "right"];
    let yPosition = ["top", "middle", "bottom"];
    let xLocation =
      Math.trunc(3 * (1 - ((windowWidth - labelX) / windowWidth)));
    let yLocation =
      Math.trunc(3 * (1 - ((windowHeight - labelY) / windowHeight)));
    if (xLocation >= 3) {
      xLocation = 2;
    } else if (xLocation <= -1) {
      xLocation = 0;
    }
    if (yLocation >= 3) {
      yLocation = 2;
    } else if (yLocation <= -1) {
      yLocation = 0;
    }
    return [xPosition[xLocation], yPosition[yLocation]];
  },

  _networkFacebook(element) {
    let config = this.get('shareConfig');

    if (config.networks.facebook.loadSdk) {
      if (!window.FB) {
        console.error('The Facebook JS SDK hasn\'t loaded yet.');
        return this._updateHref(element, 'https://www.facebook.com/sharer/sharer.php', {
          u: config.networks.facebook.url
        });
      }
      return window.FB.ui({
        method:'feed',
        name: config.networks.facebook.title,
        link: config.networks.facebook.url,
        picture: config.networks.facebook.image,
        caption: config.networks.facebook.caption,
        description: config.networks.facebook.description
      });
    } else {
      return this._updateHref(
        element,
        'https://www.facebook.com/sharer/sharer.php', {
          u: config.networks.facebook.url
        }
      );
    }
  },

  _networkTwitter(element) {
    let config = this.get('shareConfig');

    this._updateHref(element, 'https://twitter.com/intent/tweet', {
      text: config.networks.twitter.description,
      url: config.networks.twitter.url
    });
  },

  _networkGooglePlus(element) {
    let config = this.get('shareConfig');

    this._updateHref(element, 'https://plus.google.com/share', {
      url: config.networks.googlePlus.url
    });
  },

  _networkPinterest(element) {
    let config = this.get('shareConfig');

    this._updateHref(element, 'https://www.pinterest.com/pin/create/button', {
      url: config.networks.pinterest.url,
      media: config.networks.pinterest.image,
      description: config.networks.pinterest.description
    });
  },

  _networkLinkedin(element) {
    let config = this.get('shareConfig');

    this._updateHref(element, 'https://www.linkedin.com/shareArticle', {
      mini: 'true',
      url: config.networks.linkedin.url,
      title: config.networks.linkedin.title,
      summary: config.networks.linkedin.description
    });
  },

  _networkEmail(element) {
    let config = this.get('shareConfig');

    this._updateHref(element, 'mailto:', {
      subject: config.networks.email.title,
      body: config.networks.email.description
    });
  },

  _networkReddit(element) {
    let config = this.get('shareConfig');

    this._updateHref(element, 'http://www.reddit.com/submit', {
      url: config.networks.reddit.url,
      title: config.networks.reddit.title
    });
  },

  _networkWhatsapp(element) {
    let config = this.get('shareConfig');

    this._updateHref(element, 'whatsapp://send', {
      text: config.networks.whatsapp.description + " " +
        config.networks.whatsapp.url
    });
  },

  _injectFacebookSdk() {
    let config = this.get('shareConfig');
    let bodyTag = $(document).find('body')[0];

    if (!window.FB && config.networks.facebook.appId &&
        !bodyTag.querySelector('#fb-root')) {
      let script = document.createElement('script');
      script.text = `window.fbAsyncInit=function(){FB.init({appId:'${config.networks.facebook.appId}',status:true,xfbml:true})};(function(e,t,n){var r,i=e.getElementsByTagName(t)[0];if (e.getElementById(n)){return}r=e.createElement(t);r.id=n;r.src='//connect.facebook.net/en_US/all.js';i.parentNode.insertBefore(r,i)})(document,'script','facebook-jssdk');`;

      let fbRoot = document.createElement('div');
      fbRoot.id = 'fb-root';

      bodyTag.appendChild(fbRoot);
      bodyTag.appendChild(script);
    }
  },

  _hook(type, network) {
    let config = this.get('shareConfig');

    let fn = config.networks[network][type];

    if (typeof fn === 'function') {
      let opts = fn.call(config.networks[network]);

      if (opts !== undefined) {
        opts = this._normalizeFilterConfigUpdates(opts);
        this.extend(config.networks[network], opts, true);
        this._normalizeNetworkConfiguration();
      }
    }
  },

  _defaultTitle() {
    let content;
    if ((content = (document.querySelector('meta[property="og:title"]') ||
                  document.querySelector('meta[name="twitter:title"]')))) {
      return content.getAttribute('content');
    } else if ((content = document.querySelector('title'))) {
      return content.textContent || content.innerText;
    }
  },

  _defaultImage() {
    let content;
    if ((content = (document.querySelector('meta[property="og:image"]') ||
                    document.querySelector('meta[name="twitter:image"]')))) {
      return content.getAttribute('content');
    }
  },

  _defaultDescription() {
    let content;
    if ((content = (document.querySelector('meta[property="og:description"]') ||
                  document.querySelector('meta[name="twitter:description"]') ||
                  document.querySelector('meta[name="description"]')))) {
      return content.getAttribute('content');
    } else {
      return '';
    }
  },

  _detectNetworks() {
    const config = this.get('shareConfig');

    // Update network-specific configuration with global configurations
    for (let network of Object.keys(config.networks)) {
      for (let option of Object.keys(config.networks[network])) {
        if (config.networks[network][option] === null) {
          config.networks[network][option] = config[option];
        }
      }

      // Check for enabled networks and display them
      if (config.networks[network].enabled) {
        this.class = 'enabled';
        config.enabledNetworks += 1;
      } else {
        this.class = 'disabled';
      }

      config.networks[network].class = this.class;
    }
  },

  _normalizeNetworkConfiguration() {
    const config = this.get('shareConfig');

    // Don't load FB SDK if FB appId isn't present
    if (!config.networks.facebook.appId) {
      config.networks.facebook.loadSdk = false;
    }

    // Encode Twitter description for URL
    if (!!config.networks.twitter.description) {
      if (!this._isEncoded(config.networks.twitter.description)) {
        config.networks.twitter.description = encodeURIComponent(config.networks.twitter.description);
      }
    }

    // Typecast Facebook appId to a String
    if (typeof config.networks.facebook.appId === 'number') {
      config.networks.facebook.appId = config.networks.facebook.appId.toString();
    }
  },

  _normalizeFilterConfigUpdates(opts) {
    let config = this.get('shareConfig');

    if (config.networks.facebook.appId !== opts.appId) {
      console.warn('You are unable to change the Facebook appId after the button has been initialized. Please update your Facebook filters accordingly.');
      delete(opts.appId);
    }

    if (config.networks.facebook.loadSdk !== opts.loadSdk) {
      console.warn('You are unable to change the Facebook loadSdk option after the button has been initialized. Please update your Facebook filters accordingly.');
      delete(opts.appId);
    }

    return opts;
  },

  _updateHref(element, url, params) {
    let config = this.get('shareConfig');

    let encode = url.indexOf('mailto:') >= 0;
    let a = element.getElementsByTagName('a')[0];
    a.setAttribute('href', this._getUrl(url, !encode, params));
    if(!encode && (!config.networks.facebook.loadSdk || element.getAttribute('class') !== 'facebook')) {
      let popup = {
        width: 500,
        height: 350
      };

      popup.top = (screen.height / 2) - (popup.height / 2);
      popup.left = (screen.width / 2)  - (popup.width / 2);

      window.open(
        a.href,
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
  },

  _getUrl(url, encode=false, params={}) {
    let qs = (() => {
      let results = [];
      for (let k of Object.keys(params)) {
        let v = params[k];
        results.push(`${k}=${this._encode(v)}`);
      }
      return results.join('&');
    })();

    if (qs) { qs = `?${qs}`; }

    return url + qs;
  },

  _encode(str) {
    if (typeof str === 'undefined' || str === null || this._isEncoded(str)) {
      return encodeURIComponent(str);
    } else {
      return this.toRFC3986(str);
    }
  },

  open() { this._public('Open'); },
  close() { this._public('Close'); },
  toggle() { this._public('Toggle'); },
  toggleListen() { this._public('Listen'); },

  _public(action) {
    let config = this.get('shareConfig');

    let networks =
      this.$(`${config.ui.namespace}social`)[0];
    this[`_event${action}`](networks);
  },

  _isMobile() {
    return navigator.userAgent.match(/Android|iPhone|PhantomJS/i) &&
           !navigator.userAgent.match(/iPod|iPad/i);
  },

  _isEncoded(str) {
    str = this.toRFC3986(str);
    return decodeURIComponent(str) !== str;
  },

  toRFC3986(s) {
    let tmp = encodeURIComponent(s);
    tmp.replace(/[!'()*]/g, function(c) {
      return `%${c.charCodeAt(0).toString(16)}`;
    });
  }
});
