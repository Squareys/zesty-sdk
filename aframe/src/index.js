import { fetchNFT, fetchActiveAd, sendMetric } from './networking';
import { log } from './logger';
import './visibility_check';


AFRAME.registerComponent('zesty-ad', {
  data: {},
  schema: {
    tokenGroup: { type: 'string' },
    publisher: { type: 'string' },
    adURI: { type: 'string' },
    url: { type: 'string' },
  },

  init: function() {
    // This slows down the tick
    this.tick = AFRAME.utils.throttleTick(this.tick, 200, this);
    this.registerEntity()
  },

  registerEntity: function() {
    this.system.registerEntity(this.el, this.data.tokenGroup, this.data.publisher);
  },

  // Every 200ms check for `visible` component
  tick: function() {
    let component = this.el;
    if (component.getAttribute('visible') == false) {
      while (component.firstChild) {
        component.removeChild(component.lastChild);
      }
    }

    if (!!component.getAttribute('visible') && !component.firstChild) {
      this.registerEntity();
    }
  },

  remove: function() {
    this.system.unregisterEntity(this.el);
  },
});


async function loadAd(tokenGroup, publisher) {
  const activeNFT = await fetchNFT(tokenGroup, publisher);
  const activeAd = await fetchActiveAd(activeNFT.uri);

  const img = document.createElement('img');
  img.setAttribute('id', activeAd.uri)
  img.setAttribute('crossorigin', '');
  if (activeAd.data.image) {
    img.setAttribute('src', activeAd.data.image);
    return new Promise((resolve, reject) => {
      img.onload = () => resolve({ img: img, uri: activeAd.uri, cta: activeAd.data.properties.cta });
      img.onerror = () => reject('img load error');
    });
  } else {
    return { id: 'blank' };
  }
}

AFRAME.registerSystem('zesty-ad', {
  entities: [],
  data: {},
  schema: {},

  init: function() {
    this.entities = [];
  },

  registerEntity: function(el, tokenGroup, publisher) {
    if((this.adPromise && this.adPromise.isPending && this.adPromise.isPending()) || this.entities.length) return; // Checks if it is a promise, stops more requests from being made

    const scene = document.querySelector('a-scene');
    let assets = scene.querySelector('a-assets');
    if (!assets) {
      assets = document.createElement('a-assets');
      scene.appendChild(assets);
    }

    log(`Loading tokenGroup: ${tokenGroup}, publisher: ${publisher}`);

    this.adPromise = loadAd(tokenGroup, publisher).then((ad) => {
      if (ad.img) {
        assets.appendChild(ad.img);
      }
      return ad;
    });

    this.adPromise.then((ad) => {
      // don't attach plane if element's visibility is false
      if (el.getAttribute('visible') !== false) {
        const plane = document.createElement('a-plane');
        if (ad.img) {
          plane.setAttribute('src', `#${ad.uri}`);
          // for textures that are 1024x1024, not setting this causes white border
          plane.setAttribute('transparent', 'true');
          plane.setAttribute('shader', 'flat');
        } else {
          // No ad to display, hide the plane texture while still leaving it accessible to raycasters
          plane.setAttribute('material', 'opacity: 0');
        }
        plane.setAttribute('side', 'double');
        plane.setAttribute('class', 'clickable'); // required for BE

        // handle clicks
        plane.onclick = () => {
          const scene = document.querySelector('a-scene');
          scene.exitVR();
          // Open link in new tab
          if (ad.cta) {
            window.open(ad.cta, '_blank');
            sendMetric(
              publisher,
              tokenGroup,
              ad.uri,
              ad.img.src,
              ad.cta,
              'click', // event
              0, // durationInMs
            );
          }};
        el.appendChild(plane);

        // Set ad properties
        el.url = ad.cta;
        el.adURI = ad.uri;
      }
    });

    if (!el.hasAttribute('visibility-check')) {
      el.setAttribute('visibility-check', '');
    }

    this.entities.push(el);
  },

  unregisterEntity: function(el) {
    this.entities = this.entities.filter((sEl) => sEl !== el);
  },
});

AFRAME.registerPrimitive('a-zesty-ad', {
  defaultComponents: {
    'zesty-ad': { tokenGroup: '', publisher: '' },
    'visibility-check': {}
  },
});
