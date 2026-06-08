/**
 * odyssey-overlay.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Self-contained Leaflet overlay module for the Homer's Odyssey epic locations.
 *
 * USAGE
 * ─────
 * 1. Include Leaflet on the page (CSS + JS) before this file.
 * 2. Call initOdysseyOverlay(map) with your Leaflet map instance.
 * 3. Call overlay.show() / overlay.hide() / overlay.toggle() to control it.
 * 4. Use overlay.fitBounds() to zoom to the full epic route.
 *
 * EXAMPLE
 * ───────
 *   const map = L.map('map');
 *   // ... set up your tile layer, initial view, etc.
 *   const overlay = initOdysseyOverlay(map);
 *
 *   document.getElementById('my-toggle-btn').addEventListener('click', () => {
 *     overlay.toggle();
 *   });
 *
 * DEPENDENCIES
 * ────────────
 *   - Leaflet 1.x (https://leafletjs.com/)
 *   - No other dependencies. Fonts are self-contained inline styles.
 *
 * RETURNS
 * ───────
 *   { show, hide, toggle, fitBounds, isVisible, layerGroup }
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory;          // CommonJS / Node
  } else {
    root.initOdysseyOverlay = factory; // browser global
  }
}(typeof self !== 'undefined' ? self : this, function initOdysseyOverlay(map) {

  // ── CONFIDENCE COLOURS ────────────────────────────────────────────────────
  // Three tiers map to gold shades; darker = more scholarly consensus.
  const CONF_FILL = {
    high: '#C8881C',  // widely accepted (Troy, Scylla/Charybdis, Corfu, Ithaca)
    mid:  '#D4A84B',  // ancient tradition / debated
    low:  '#E0C878',  // speculative identification
  };
  const CONF_LABEL = {
    high: 'Widely accepted',
    mid:  'Debated / ancient tradition',
    low:  'Speculative identification',
  };

  // ── LOCATION DATA ─────────────────────────────────────────────────────────
  // Each entry represents one stop on Odysseus's journey.
  // Coordinates follow the western-Mediterranean scholarly interpretation
  // (Strabo, Victor Bérard, Tim Severin et al.). No consensus exists —
  // label accordingly in any UI you build.
  //
  // Fields:
  //   n        {number}  Step number in journey order (1–14)
  //   name     {string}  English / common name
  //   greek    {string}  Ancient Greek name (Unicode)
  //   book     {string}  Odyssey book reference
  //   event    {string}  One-paragraph plot summary of what happens here
  //   proposed {string}  Proposed modern geographic identification
  //   conf     {string}  'high' | 'mid' | 'low' — scholarly confidence
  //   lat      {number}  Latitude (WGS84)
  //   lng      {number}  Longitude (WGS84)
  const LOCATIONS = [
    {
      n: 1, name: 'Troy', greek: 'Ἴλιος', book: 'Book I (recalled)',
      event: 'After ten years of war and the sack of Troy, Odysseus sets sail for Ithaca. The long journey home begins.',
      proposed: 'Hisarlık, Çanakkale, Turkey',
      conf: 'high', lat: 39.957, lng: 26.239,
    },
    {
      n: 2, name: 'Cicones — Ismarus', greek: 'Κίκονες', book: 'Book IX',
      event: 'Odysseus sacks the city of Ismarus. His men linger to feast; the Cicones regroup and slaughter seventy-two of his crew.',
      proposed: 'Near Maroneia, Thrace, NE Greece',
      conf: 'mid', lat: 40.87, lng: 25.53,
    },
    {
      n: 3, name: 'Lotus-Eaters', greek: 'Λωτοφάγοι', book: 'Book IX',
      event: 'Three scouts eat the lotus fruit and lose all desire to return home. Odysseus drags them weeping back to the ships.',
      proposed: 'Djerba (ancient Meninx), Tunisia',
      conf: 'low', lat: 33.83, lng: 10.85,
    },
    {
      n: 4, name: 'Cyclops — Polyphemus', greek: 'Πολύφημος', book: 'Book IX',
      event: 'The one-eyed giant traps the crew and devours six men. Odysseus blinds him with a burning stake and escapes — but shouts his name, drawing Poseidon\'s lasting wrath.',
      proposed: 'Mount Etna, Sicily, Italy',
      conf: 'mid', lat: 37.75, lng: 15.00,
    },
    {
      n: 5, name: 'Aeolus — Island of Winds', greek: 'Αἴολος', book: 'Book X',
      event: 'The keeper of the winds gives Odysseus a bag containing all adverse gales. Within sight of Ithaca, the greedy crew open it; the ships are blown all the way back.',
      proposed: 'Lipari (Aeolian Islands), Sicily, Italy',
      conf: 'mid', lat: 38.48, lng: 14.95,
    },
    {
      n: 6, name: 'Laestrygonians', greek: 'Λαιστρυγόνες', book: 'Book X',
      event: 'Giant cannibals hurl boulders from the cliffs, sinking eleven of twelve ships. Only Odysseus\'s own vessel escapes.',
      proposed: 'Bonifacio, between Corsica & Sardinia',
      conf: 'low', lat: 41.39, lng: 9.16,
    },
    {
      n: 7, name: 'Circe — Aeaea', greek: 'Κίρκη · Αἰαίη', book: 'Book X',
      event: 'The goddess-witch transforms half the crew into swine. Protected by the herb moly, Odysseus resists her magic. The crew remains on the island for a full year.',
      proposed: 'Monte Circeo, Lazio, Italy',
      conf: 'mid', lat: 41.23, lng: 13.05,
    },
    {
      n: 8, name: 'Land of the Dead — Nekyia', greek: 'Νέκυια', book: 'Book XI',
      event: 'At the edge of the world, Odysseus summons the shades. He speaks with the prophet Tiresias, his dead mother, and the ghosts of Achilles and Agamemnon.',
      proposed: 'Cumae (Cape Miseno), near Naples, Italy',
      conf: 'mid', lat: 40.85, lng: 14.06,
    },
    {
      n: 9, name: 'The Sirens', greek: 'Σειρῆνες', book: 'Book XII',
      event: 'Lashed to the mast, Odysseus alone hears the Sirens\' irresistible song. The crew row with beeswax sealing their ears.',
      proposed: 'Li Galli Islands, near Positano, Italy',
      conf: 'mid', lat: 40.57, lng: 14.43,
    },
    {
      n: 10, name: 'Scylla & Charybdis', greek: 'Σκύλλα καὶ Χάρυβδις', book: 'Book XII',
      event: 'Steering between the six-headed Scylla and the deadly whirlpool, Odysseus chooses the lesser evil. Six men are snatched from the deck.',
      proposed: 'Strait of Messina, Italy / Sicily',
      conf: 'high', lat: 38.22, lng: 15.64,
    },
    {
      n: 11, name: "Thrinacia — Sun's Cattle", greek: 'Θρινακία', book: 'Book XII',
      event: 'Becalmed and starving, the crew slaughter the sacred cattle of Helios against Odysseus\'s warnings. Zeus destroys the ship; Odysseus alone survives.',
      proposed: 'Sicily, Italy',
      conf: 'mid', lat: 37.60, lng: 14.02,
    },
    {
      n: 12, name: 'Calypso — Ogygia', greek: 'Ὠγυγία', book: 'Books V & VII',
      event: 'The sole survivor washes ashore. The nymph Calypso keeps Odysseus for seven years before the gods order his release.',
      proposed: 'Gozo, Malta (Callimachus); also Gibraltar proposed',
      conf: 'low', lat: 36.04, lng: 14.37,
    },
    {
      n: 13, name: 'Phaeacians — Scheria', greek: 'Σχερία', book: 'Books VI–XIII',
      event: 'Found on the shore by princess Nausicaä. The Phaeacians host Odysseus, hear his full tale, and sail him home to Ithaca overnight.',
      proposed: 'Corfu (Kerkyra), Greece',
      conf: 'high', lat: 39.62, lng: 19.92,
    },
    {
      n: 14, name: 'Ithaca — Home', greek: 'Ἰθάκη', book: 'Books XIII–XXIV',
      event: 'Home at last — twenty years after leaving for Troy. Odysseus strings his great bow, slaughters the suitors, and is reunited with Penelope.',
      proposed: 'Ithaki island, Ionian Islands, Greece',
      conf: 'high', lat: 38.37, lng: 20.72,
    },
  ];

  // ── MARKER ICON ───────────────────────────────────────────────────────────
  // Returns a Leaflet divIcon: a gold numbered circle sized to confidence level.
  function makeIcon(n, conf) {
    const fill = CONF_FILL[conf];
    return L.divIcon({
      className: '',
      html:
        '<div style="' +
          'width:26px;height:26px;' +
          'background:' + fill + ';' +
          'border:2px solid #1A1209;' +
          'border-radius:50%;' +
          'display:flex;align-items:center;justify-content:center;' +
          'font-family:Cinzel,Georgia,serif;' +
          'font-size:8.5px;font-weight:700;color:#1A1209;line-height:1;' +
          'box-shadow:0 1px 4px rgba(0,0,0,0.3);' +
        '">' + n + '</div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -16],
    });
  }

  // ── POPUP HTML ────────────────────────────────────────────────────────────
  // Inline-styled so no external stylesheet is required.
  function makePopup(loc) {
    var gold = '#C8881C', crimson = '#8B1A1A', ink = '#1A1209';
    var fill = CONF_FILL[loc.conf];
    return (
      '<div style="max-width:240px;font-family:Georgia,serif;">' +
        '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">' +
          '<div style="width:22px;height:22px;flex-shrink:0;background:' + fill + ';' +
            'border:1.5px solid ' + ink + ';border-radius:50%;' +
            'display:flex;align-items:center;justify-content:center;' +
            'font-family:Georgia,serif;font-size:8px;font-weight:700;color:' + ink + ';">' +
            loc.n +
          '</div>' +
          '<div>' +
            '<div style="font-family:Georgia,serif;font-size:13px;font-weight:700;color:' + ink + ';line-height:1.2;">' + loc.name + '</div>' +
            '<div style="font-size:12px;color:#888;font-style:italic;">' + loc.greek + '</div>' +
            '<div style="font-size:9px;letter-spacing:0.1em;color:' + crimson + ';text-transform:uppercase;margin-top:2px;">' + loc.book + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:12.5px;color:#333;line-height:1.4;' +
          'border-left:2px solid ' + gold + ';padding-left:8px;' +
          'font-style:italic;margin-bottom:7px;">' +
          loc.event +
        '</div>' +
        '<div style="font-size:11.5px;color:#666;margin-bottom:3px;">📍 ' + loc.proposed + '</div>' +
        '<div style="font-size:8.5px;letter-spacing:0.08em;text-transform:uppercase;color:#8B6010;">' +
          CONF_LABEL[loc.conf] +
        '</div>' +
      '</div>'
    );
  }

  // ── BUILD LAYER GROUP ─────────────────────────────────────────────────────
  var layerGroup = L.layerGroup();
  var routeLL = LOCATIONS.map(function (loc) { return [loc.lat, loc.lng]; });

  // Dashed route line connecting all stops in journey order
  L.polyline(routeLL, {
    color: '#C8881C',
    weight: 2.5,
    opacity: 0.65,
    dashArray: '8,10',
  }).addTo(layerGroup);

  // One marker per location
  LOCATIONS.forEach(function (loc) {
    L.marker([loc.lat, loc.lng], { icon: makeIcon(loc.n, loc.conf) })
      .bindPopup(makePopup(loc), { maxWidth: 270 })
      .addTo(layerGroup);
  });

  // ── PUBLIC API ────────────────────────────────────────────────────────────
  var visible = false;

  return {
    /** Show the overlay on the map. */
    show: function () {
      if (!visible) { layerGroup.addTo(map); visible = true; }
    },
    /** Remove the overlay from the map. */
    hide: function () {
      if (visible) { map.removeLayer(layerGroup); visible = false; }
    },
    /** Toggle visibility. Returns the new visible state. */
    toggle: function () {
      visible ? this.hide() : this.show();
      return visible;
    },
    /** Zoom the map to show the full Odyssey route. */
    fitBounds: function (options) {
      map.fitBounds(routeLL, Object.assign({ padding: [50, 50], maxZoom: 7 }, options || {}));
    },
    /** Whether the overlay is currently shown. */
    isVisible: function () { return visible; },
    /** The raw Leaflet layerGroup — attach custom event listeners if needed. */
    layerGroup: layerGroup,
    /** The raw location data array — useful for building custom legends or lists. */
    locations: LOCATIONS,
    /** Confidence fill colours — useful for building a legend. */
    confidenceColors: CONF_FILL,
    /** Confidence labels — useful for building a legend. */
    confidenceLabels: CONF_LABEL,
  };

}));
