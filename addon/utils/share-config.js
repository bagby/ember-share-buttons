export default {
  enabledNetworks: 0,
  protocol: '//',
  url: window.location.href,
  caption: null,

  ui: {
    flyout: 'sb-top sb-center',
    buttonText: 'Share',
    namespace: 'sb-',
    networkOrder: [],
    collision: false,
  },

  networks: {
    googlePlus: {
      enabled: true,
      url: null
    },
    twitter: {
      enabled: true,
      url: null,
      description: null
    },
    facebook: {
      enabled: true,
      loadSdk: true,
      url: null,
      appId: null,
      title: null,
      caption: null,
      description: null,
      image: null
    },
    pinterest: {
      enabled: true,
      url: null,
      image: null,
      description: null
    },
    reddit: {
      enabled: true,
      url: null,
      title: null
    },
    linkedin: {
      enabled: true,
      url: null,
      title: null,
      description: null
    },
    whatsapp: {
      enabled: true,
      description: null,
      url: null
    },
    email: {
      enabled: true,
      title: null,
      description: null
    }
  }
};
