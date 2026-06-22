// ─────────────────────────────────────────────────────────────
//  TRIP DATA — single source of truth
//  Consumed by index.html (hub) and map.html (interactive map).
//  Edit trip facts HERE; both pages stay in sync.
//
//  Schema note: every LEG carries the original fields
//  (phase, color, dates, who, stay, stops[]) plus optional richer
//  fields. Anything omitted simply doesn't render — sparse legs
//  still look clean.
// ─────────────────────────────────────────────────────────────
window.TRIP = (function () {

  // Crew ------------------------------------------------------------------
  const CREW = ['Peter', 'Matt', 'Sam', 'Grant', 'Brandel'];

  // Leg colour / label maps (include the "meta" legs travel & work that
  // appear only in the day-by-day schedule, not as itinerary cards).
  const LEG_COLORS = {
    portugal: '#1A7A4A',
    naples:   '#D4A030',
    travel:   '#8291AE',
    istanbul: '#1C7293',
    izmir:    '#C04020',
    aegean:   '#3A8C7E',
    work:     '#9E9E9E',
    islands:  '#2980B9',
    crete:    '#E67E22',
    ithaca:   '#8E44AD',
    espana:   '#C0392B',
    nurnberg: '#D4A030',
  };
  const LEG_LABELS = {
    portugal: 'Portugal', naples: 'Naples', travel: 'Travel',
    istanbul: 'Istanbul', izmir: 'İzmir', aegean: 'Aegean Coast', work: 'Work',
    islands: 'Greek Islands', crete: 'Crete 🏍', ithaca: 'Ithaca',
    espana: 'España 🏍', nurnberg: 'Nürnberg',
  };
  const LEG_SHORT = {
    portugal: '🇵🇹 PT', naples: 'Naples', travel: '✈',
    istanbul: 'IST', izmir: 'İzmir', aegean: '🚗 Coast', work: 'Work',
    islands: '🏝 Islands', crete: '🏍 Crete', ithaca: '⚓ Ithaca',
    espana: '🏍 España', nurnberg: '🍺 Nürnb.',
  };

  // Legs ------------------------------------------------------------------
  // Richer optional fields per leg:
  //   summary    — one-line framing of the leg
  //   transport  — how the crew moves on this leg
  //   lodging    — { name, ref, link }  (ref = booking reference)
  //   highlights — string[]  bullet points / must-dos
  //   food       — string[]  food & drink notes
  //   links      — [{ label, url }]
  //   budget     — free-text cost note
  //   tags       — string[]
  const LEGS = [
    {
      id: 'portugal', phase: '🇵🇹 Portugal', color: '#1A7A4A', dates: 'Jun 19–22',
      who: 'Grant · Brandel', stay: 'Lisbon area',
      summary: 'Grant & Brandel warm up in Lisbon before flying east to join the crew.',
      transport: 'Local · then flight Lisbon → İzmir (ADB)',
      highlights: ['Pre-trip days in Lisbon', 'Fly out to İzmir to meet the others'],
      stops: [
        { name: 'Lisbon, Portugal', lat: 38.7223, lng: -9.1393, note: 'Grant & Brandel pre-trip' },
      ],
    },
    {
      id: 'naples', phase: 'Naples', color: '#D4A030', dates: 'Jun 19–22',
      who: 'Peter · Matt · Sam', stay: 'Naples, Italy',
      summary: 'Trip kick-off on the Bay of Naples before the overnight hop to Istanbul.',
      transport: 'Arrive via UA1970/UA966 · depart TK1880 to Istanbul',
      highlights: ['Trip kick-off', 'Pizza in its homeland', 'Evening flight to Istanbul Jun 22'],
      stops: [
        { name: 'Naples, Italy', lat: 40.8518, lng: 14.2681, note: 'Trip kick-off' },
      ],
    },
    {
      id: 'istanbul', phase: 'Istanbul', color: '#1C7293', dates: 'Jun 23',
      who: 'Peter · Matt · Sam', stay: 'Istanbul, Türkiye',
      summary: 'Land at 00:05 and take a full day in the city straddling two continents.',
      transport: 'Arrive TK1880 00:05 · day in Istanbul · drive south Jun 24',
      lodging: { name: 'Istanbul', ref: null, link: null },
      highlights: ['TK1880 arr. 00:05', 'A full day in Istanbul'],
      stops: [
        { name: 'Istanbul, Türkiye', lat: 41.0082, lng: 28.9784, note: 'TK1880 NAP→IST arr. 00:05 Jun 23 · res. U3VWXQ · day in Istanbul' },
      ],
    },
    {
      id: 'aegean', phase: '🚗 Aegean Coast', color: '#3A8C7E', dates: 'Jun 24–25',
      who: 'Peter · Matt · Sam', stay: 'Çanakkale → Cunda (Ayvalık)',
      summary: 'Road trip down the Aegean coast — the plains of Troy and mythic Mount Ida.',
      transport: 'Car · Istanbul → Çanakkale → Cunda',
      highlights: ['Çanakkale Bridge crossing', 'Climb Mount Ida (Kaz Dağı)', 'Night on Cunda island'],
      stops: [
        { name: 'Çanakkale, Türkiye',   lat: 40.1553, lng: 26.4142, note: 'Drive south Jun 24 · overnight' },
        { name: 'Mount Ida (Kaz Dağı)', lat: 39.7167, lng: 26.8500, note: 'Climb Jun 25 · mythic Mt Ida' },
        { name: 'Cunda (Ayvalık)',      lat: 39.3370, lng: 26.6580, note: 'Night Jun 25' },
      ],
    },
    {
      id: 'izmir', phase: 'İzmir', color: '#C04020', dates: 'Jun 26–27',
      who: 'Peter · Matt · Sam · Grant (ADB) · Brandel (ADB)', stay: 'Sığacık / İzmir, Türkiye',
      summary: 'The five reunite: Grant & Brandel fly into İzmir (ADB) and the crew is whole.',
      transport: 'Car along the coast · Grant & Brandel arrive by air (ADB)',
      highlights: ['Crew reunion', 'Seaside Sığacık', 'Stage for the Greek island crossing'],
      stops: [
        { name: 'Sığacık, Türkiye', lat: 38.1969, lng: 26.7869, note: 'Arrive Jun 26' },
        { name: 'İzmir, Türkiye',   lat: 38.4237, lng: 27.1428, note: 'Grant & Brandel fly into ADB — picked up Jun 27 morning' },
      ],
    },
    {
      id: 'islands', phase: '🏝 Greek Islands', color: '#2980B9', dates: 'Jun 28–Jul 1',
      who: 'All five', stay: 'Island hopping — Çeşme ferry across',
      summary: 'Cross from Çeşme and hop down the Aegean: Chios, Samos, Mykonos, Santorini.',
      transport: 'Ferry hopping · Çeşme → Chios → Samos → Mykonos → Santorini',
      highlights: ['Çeşme → Chios crossing', 'Island hopping by ferry', 'Sunset on Santorini'],
      stops: [
        { name: 'Çeşme, Türkiye',    lat: 38.3234, lng: 26.3008, note: 'Ferry crossing to Chios' },
        { name: 'Chios, Greece',     lat: 38.3683, lng: 26.1394, note: '' },
        { name: 'Samos, Greece',     lat: 37.7519, lng: 26.9783, note: '' },
        { name: 'Mykonos, Greece',   lat: 37.4415, lng: 25.3616, note: '' },
        { name: 'Santorini, Greece', lat: 36.3932, lng: 25.4615, note: 'Heading south to Crete' },
      ],
    },
    {
      id: 'crete', phase: '🏍 Crete', color: '#E67E22', dates: 'Jul 1–4',
      who: 'All five', stay: 'Crete — motorcycle',
      summary: 'Ride across Crete from Heraklion west to Chania.',
      transport: 'Motorcycle · Heraklion → Chania',
      highlights: ['Motorcycle the north coast', 'Heraklion → Chania'],
      stops: [
        { name: 'Heraklion, Crete', lat: 35.3387, lng: 25.1442, note: 'Arrive Jul 1' },
        { name: 'Chania, Crete',    lat: 35.5138, lng: 24.0180, note: 'Riding west' },
      ],
    },
    {
      id: 'ithaca', phase: '⚓ Ithaca', color: '#8E44AD', dates: 'Jul 5–7',
      who: 'All five', stay: 'Ithaca — Agent Ithaca',
      summary: 'The nostos — homecoming to Ithaca. Sam flies home from here.',
      transport: 'Ferry round the Peloponnese into the Ionian',
      highlights: ['The final destination', 'Sam departs for home Jul 7'],
      stops: [
        { name: 'Ithaca, Greece', lat: 38.4167, lng: 20.6833, note: 'The final destination' },
      ],
    },
    {
      id: 'espana', phase: '🏍 España', color: '#C0392B', dates: 'Jul 7–12',
      who: 'Peter · Matt · Grant · Brandel', stay: 'Bilbao → Picos → Pamplona → Donostia → Bilbao',
      summary: 'Fly to Bilbao and ride the Basque Country & Picos — timed for the Running of the Bulls.',
      transport: 'Motorcycle loop from Bilbao',
      highlights: ['Picos de Europa riding', '🐂 Running of the Bulls, Pamplona (Jul 11)', 'Pintxos in San Sebastián'],
      food: ['Pintxos crawl in Donostia / San Sebastián'],
      stops: [
        { name: 'Bilbao, Spain',            lat: 43.2630, lng: -2.9350, note: 'Fly in from Greece · Jul 7' },
        { name: 'Picos de Europa',          lat: 43.1937, lng: -4.8406, note: 'Cantabrian mountain riding' },
        { name: 'Pamplona, Spain',          lat: 42.8125, lng: -1.6458, note: '🐂 Running of the Bulls · Jul 11' },
        { name: 'San Sebastián (Donostia)', lat: 43.3183, lng: -1.9812, note: 'Basque Country · Jul 12' },
        { name: 'Bilbao — fly out',         lat: 43.2950, lng: -2.9100, note: 'Return to Bilbao · fly to Nürnberg Jul 13' },
      ],
    },
    {
      id: 'nurnberg', phase: '🍺 Nürnberg', color: '#D4A030', dates: 'Jul 13–14',
      who: 'Peter · Matt · Grant · Brandel', stay: 'Nürnberg — recovery day',
      summary: 'Wind-down and recovery in Nürnberg before heading home.',
      transport: 'Fly Bilbao → Nürnberg',
      highlights: ['Recovery 🍺', 'Trip wind-down'],
      stops: [
        { name: 'Nürnberg, Germany', lat: 49.4521, lng: 11.0767, note: 'Recovery 🍺' },
      ],
    },
  ];

  // Flights ---------------------------------------------------------------
  const FLIGHTS = {
    'UA1970': {
      flight: 'UA 1970', airline: 'United Airlines',
      from: 'Los Angeles (LAX)', to: 'Newark (EWR)',
      dep: 'Jun 19, 2026 · est. morning',
      arr: 'Jun 19, 2026 · est. afternoon',
      res: null, seat: null, cabin: null,
      notes: 'Connecting to UA 966 · Exact times TBC',
      confirmed: false,
    },
    'UA966': {
      flight: 'UA 966', airline: 'United Airlines',
      from: 'Newark (EWR)', to: 'Naples (NAP)',
      dep: 'Jun 19, 2026 · est. evening',
      arr: 'Jun 20, 2026 · est. morning',
      res: null, seat: null, cabin: null,
      notes: 'Overnight transatlantic · Exact times TBC',
      confirmed: false,
    },
    'TK1880': {
      flight: 'TK 1880', airline: 'Turkish Airlines',
      from: 'Naples (NAP)', to: 'Istanbul (IST)',
      dep: 'Jun 22, 2026 · 20:45',
      arr: 'Jun 23, 2026 · 00:05',
      res: 'U3VWXQ', seat: null, cabin: 'Economy — EcoFly',
      notes: 'Peter · Matt · Sam · Cabin baggage only · 1 × 8 kg',
      confirmed: true,
    },
  };

  // Days ------------------------------------------------------------------
  // Per-day fidelity, keyed "m-d" (m: 5=June, 6=July). Every field is
  // optional; the day card synthesises whatever is present together with
  // the leg, the who's-where schedule and any flights.
  //   title    — short headline for the day
  //   legId    — primary leg this day belongs to
  //   summary  — a sentence of context
  //   schedule — [{ time, text, icon }] rough timeline (time is free-text)
  //   flights  — flight keys (see FLIGHTS) happening this day
  //   notes    — free-text aside
  const DAYS = {
    '5-19': { legId: 'naples', title: 'Wheels up', flights: ['UA1970', 'UA966'],
      summary: 'The voyage begins — Peter, Matt & Sam fly LA → Newark → Naples overnight; Grant & Brandel settle into Lisbon.',
      schedule: [
        { time: 'Morning', icon: '🛫', text: 'UA1970 departs Los Angeles (LAX)' },
        { time: 'Evening', icon: '✈', text: 'UA966 Newark → Naples, overnight transatlantic' },
      ] },
    '5-20': { legId: 'naples', title: 'Landfall in Naples',
      summary: 'Touch down on the Bay of Naples in the morning and find our feet.',
      schedule: [{ time: 'Morning', icon: '🛬', text: 'Arrive Naples (NAP)' }] },
    '5-21': { legId: 'naples', title: 'Naples',
      summary: 'A full day in Naples — pizza in its homeland.' },
    '5-22': { legId: 'naples', title: 'Naples → Istanbul', flights: ['TK1880'],
      summary: 'Last of Naples, then the evening hop east across the Aegean world.',
      schedule: [
        { time: 'Day', icon: '🍕', text: 'Final hours in Naples' },
        { time: '20:45', icon: '✈', text: 'TK1880 departs Naples for Istanbul' },
      ] },
    '5-23': { legId: 'istanbul', title: 'Istanbul, two continents',
      summary: 'Land at 00:05 and take a full day in the city on the strait.',
      schedule: [
        { time: '00:05', icon: '🛬', text: 'Arrive Istanbul (IST) · res. U3VWXQ' },
        { time: 'Day', icon: '🕌', text: 'Istanbul — between Europe and Asia' },
      ] },
    '5-24': { legId: 'aegean', title: 'South to Çanakkale',
      summary: 'Pick up the car and drive down the coast toward the plains of Troy.',
      schedule: [
        { time: 'Morning', icon: '🕌', text: 'Last of Istanbul' },
        { time: 'Afternoon', icon: '🚗', text: 'Drive to Çanakkale via the bridge' },
      ] },
    '5-25': { legId: 'aegean', title: 'Mount Ida',
      summary: 'Climb mythic Mount Ida (Kaz Dağı), then on to the island of Cunda for the night.',
      schedule: [
        { time: 'Morning', icon: '🏔', text: 'Climb Mount Ida (Kaz Dağı)' },
        { time: 'Evening', icon: '🌅', text: 'Cross to Cunda (Ayvalık)' },
      ] },
    '5-26': { legId: 'izmir', title: 'Cunda → Sığacık',
      summary: 'Coast road south to the seaside town of Sığacık.',
      schedule: [{ time: 'Afternoon', icon: '🚗', text: 'Drive to Sığacık' }] },
    '5-27': { legId: 'izmir', title: 'The crew reunites',
      summary: 'Grant & Brandel fly into İzmir (ADB); all five together, staging for the island crossing.',
      schedule: [
        { time: 'Morning', icon: '🛬', text: 'Grant & Brandel land at İzmir (ADB) — picked up' },
        { time: 'Day', icon: '⚓', text: 'Provision for the Greek islands' },
      ] },
    '5-28': { legId: 'islands', title: 'Across to Greece',
      summary: 'Ferry from Çeşme over to Chios — the island hop begins.',
      schedule: [{ time: 'Day', icon: '⛴', text: 'Çeşme → Chios crossing' }] },
    '5-29': { legId: 'islands', title: 'Aegean hopping',
      summary: 'Down the chain toward Samos.' },
    '5-30': { legId: 'islands', title: 'Toward the Cyclades',
      summary: 'On toward Mykonos.' },
    '6-1':  { legId: 'crete', title: 'On to Crete',
      summary: 'South past Santorini and over to Heraklion to pick up the bikes.',
      schedule: [{ time: 'Day', icon: '⛴', text: 'Santorini → Heraklion' }] },
    '6-2':  { legId: 'crete', title: 'Riding Crete',
      summary: 'Motorcycle the north coast.' },
    '6-3':  { legId: 'crete', title: 'West to Chania',
      summary: 'Ride west toward Chania.',
      schedule: [{ time: 'Day', icon: '🏍', text: 'Heraklion → Chania' }] },
    '6-4':  { legId: 'crete', title: 'Crete',
      summary: 'Last of Crete before the long ferry to the Ionian.' },
    '6-5':  { legId: 'ithaca', title: 'To Ithaca',
      summary: 'The long ferry round the Peloponnese into the Ionian Sea.',
      schedule: [{ time: 'Day', icon: '⛴', text: 'Round the Peloponnese to Ithaca' }] },
    '6-6':  { legId: 'ithaca', title: 'Ithaca — the nostos',
      summary: 'The homecoming. The journey’s mythic end-point.' },
    '6-7':  { legId: 'ithaca', title: 'Ithaca → Spain',
      summary: 'Sam flies home; the others fly on to Bilbao for the Basque ride.',
      schedule: [
        { time: 'Day', icon: '🛫', text: 'Sam departs for home' },
        { time: 'Day', icon: '✈', text: 'Peter · Matt · Grant · Brandel fly to Bilbao' },
      ] },
    '6-8':  { legId: 'espana', title: 'Basque Country',
      summary: 'Pick up bikes in Bilbao and head for the Picos.' },
    '6-9':  { legId: 'espana', title: 'Picos de Europa',
      summary: 'Cantabrian mountain riding.' },
    '6-10': { legId: 'espana', title: 'Riding on',
      summary: 'Through the mountains toward Navarre.' },
    '6-11': { legId: 'espana', title: 'Pamplona — the bulls',
      summary: 'San Fermín — the Running of the Bulls.',
      schedule: [{ time: 'Morning', icon: '🐂', text: 'Running of the Bulls, Pamplona' }] },
    '6-12': { legId: 'espana', title: 'San Sebastián',
      summary: 'Pintxos and the Bay of La Concha in Donostia.',
      schedule: [{ time: 'Evening', icon: '🍴', text: 'Pintxos crawl in San Sebastián' }] },
    '6-13': { legId: 'nurnberg', title: 'Bilbao → Nürnberg',
      summary: 'Return to Bilbao and fly to Nürnberg.',
      schedule: [{ time: 'Day', icon: '✈', text: 'Bilbao → Nürnberg' }] },
    '6-14': { legId: 'nurnberg', title: 'Recovery',
      summary: 'Wind-down in Nürnberg before heading home. 🍺' },
  };

  // Suggestions / ideas ---------------------------------------------------
  // Shared "starter" ideas, committed in code so the whole crew sees them.
  // Anything added on the page itself is saved per-browser (localStorage),
  // so this list is the shared baseline everyone starts from.
  //   text — the idea
  //   tag  — optional short label (a leg id, a place, a theme)
  const SUGGESTIONS = [
    { text: 'Catch the sunset in Oia, Santorini before heading south to Crete', tag: 'islands' },
    { text: 'Find a proper hammam in Istanbul on the free day', tag: 'istanbul' },
    { text: 'Scout balcony / viewing spots in Pamplona early', tag: 'espana' },
    { text: 'Build a pintxos shortlist for San Sebastián', tag: 'espana' },
  ];

  // Convenience lookups ---------------------------------------------------
  const LEG_BY_ID = {};
  LEGS.forEach(l => { LEG_BY_ID[l.id] = l; });

  return { CREW, LEG_COLORS, LEG_LABELS, LEG_SHORT, LEGS, LEG_BY_ID, FLIGHTS, DAYS, SUGGESTIONS };
})();
