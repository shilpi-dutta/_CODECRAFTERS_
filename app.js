/* app.js
  Handles:
  - Map & markers
  - AR preview (placeholder)
  - Itinerary generator (rule-based)
  - Marketplace (localStorage)
  - Guide registry / simulated blockchain (localStorage)
  - Mock realtime transport (simulated updates)
  - Feedback & sentiment (simple polarity)
  - Chatbot (rule-based ChatGPT-like UI)
  - TTS in multiple Indian languages (browser voices)
  - Analytics collection saved to localStorage
*/

/* ----------------- Utilities & Data ----------------- */

const sampleSites = [
  { id: 'netarhat', name:'Netarhat', lat:23.129, lng:84.372, type:'viewpoint', desc:'Sunset viewpoint, forests and hills' },
  { id: 'hundru', name:'Hundru Falls', lat:23.430, lng:85.302, type:'waterfall', desc:'Tall scenic waterfall near Ranchi' },
  { id: 'betla', name:'Betla National Park', lat:24.007, lng:84.006, type:'wildlife', desc:'Rich biodiversity and wildlife safaris' },
  { id: 'deoghar', name:'Deoghar', lat:24.486, lng:86.695, type:'pilgrimage', desc:'Famous Baidyanath temple and devotional sites' }
];

// quick sentiment lexicon (very small)
const positiveWords = ['good','great','amazing','awesome','love','beautiful','nice','enjoy'];
const negativeWords = ['bad','terrible','hate','poor','worst','disappoint'];

// analytics container (persisted)
function updateAnalytics(updates = {}) {
  let st = JSON.parse(localStorage.getItem('jh_analytics') || '{}');
  st = Object.assign({
    visits: 0,
    transactions: 0,
    verifiedGuides: 0,
    monthLabels: ['Jan','Feb','Mar','Apr','May','Jun'],
    monthVisits: [10,20,30,45,60,80],
    market: [50,30,20,10]
  }, st);
  Object.keys(updates).forEach(k => {
    if (typeof updates[k] === 'number') st[k] = (st[k] || 0) + updates[k];
    else st[k] = updates[k];
  });
  localStorage.setItem('jh_analytics', JSON.stringify(st));
}

/* ----------------- Map & AR ----------------- */

function initMap(){
  const map = L.map('map').setView([23.5,85], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  sampleSites.forEach(s => {
    const m = L.marker([s.lat, s.lng]).addTo(map);
    m.bindPopup(`<b>${s.name}</b><br>${s.desc}<br><button onclick="previewAR('${s.id}')">AR Preview</button>`);
  });
}

function previewAR(siteId){
  const site = sampleSites.find(s=>s.id===siteId);
  alert('AR Preview placeholder for ' + (site?site.name:siteId) + ". This A-Frame scene is customizable.");
}

/* ----------------- Itinerary generator (rule-based) ----------------- */

function generateItinerary(e){
  e.preventDefault();
  const days = parseInt(document.getElementById('days').value || 3);
  const interestsSelect = document.getElementById('interests');
  const selected = Array.from(interestsSelect.selectedOptions).map(x=>x.value);
  const lang = document.getElementById('itLang').value;
  const itinerary = [];

  // Simple mapping of interests to places
  const interestPlaceMap = {
    waterfalls: ['Hundru Falls','Dassam Falls','Jonha Falls'],
    wildlife: ['Betla National Park','Dalma Sanctuary'],
    culture: ['Horo dance, tribal markets, local handicrafts'],
    trekking: ['Netarhat trails','Parasnath region'],
    relax: ['Hill-view homestays and tea gardens']
  };

  for (let d=1; d<=days; d++){
    const day = { day: d, activities: [] };
    selected.forEach((int, idx) => {
      const list = interestPlaceMap[int] || ['Explore local attractions'];
      const place = list[(d+idx) % list.length];
      day.activities.push({ time: `${8 + idx*3}:00`, activity: `Visit ${place}`, tips: `Local tip: try local food near ${place}` });
    });
    if (day.activities.length===0) day.activities.push({ time: '10:00', activity: 'Local sightseeing', tips: 'Explore markets and crafts' });
    itinerary.push(day);
  }

  const resultEl = document.getElementById('itResult');
  resultEl.textContent = JSON.stringify({ days, interests:selected, itinerary }, null, 2);

  // Save analytics
  updateAnalytics({ visits: days });
}

/* ----------------- Marketplace (localStorage) ----------------- */

function loadMarketplace(){
  const grid = document.getElementById('marketGrid');
  grid.innerHTML = '';
  const items = JSON.parse(localStorage.getItem('jh_market') || '[]');
  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'productCard';
    div.innerHTML = `<h4>${it.title}</h4><p>₹${it.price}</p><p><small>by ${it.seller}</small></p>
      <button onclick="buyItem('${it.id}')">Buy</button>`;
    grid.appendChild(div);
  });
}

function addMarketItem(e){
  e.preventDefault();
  const title = document.getElementById('mTitle').value.trim();
  const price = Number(document.getElementById('mPrice').value);
  const seller = document.getElementById('mSeller').value.trim();
  const items = JSON.parse(localStorage.getItem('jh_market') || '[]');
  const id = 'prod_'+Date.now();
  items.push({ id, title, price, seller });
  localStorage.setItem('jh_market', JSON.stringify(items));
  document.getElementById('mTitle').value = document.getElementById('mPrice').value = document.getElementById('mSeller').value = '';
  loadMarketplace();
  updateAnalytics({ transactions: 1 });
}

function buyItem(id){
  // simulate payment and record tx
  const tx = { tx: '0x' + Math.floor(Math.random()*1e16).toString(16), item:id, time: new Date().toISOString() };
  const txs = JSON.parse(localStorage.getItem('jh_txs') || '[]');
  txs.push(tx);
  localStorage.setItem('jh_txs', JSON.stringify(txs));
  alert('Payment simulated. Tx: ' + tx.tx);
  updateAnalytics({ transactions: 1 });
}

/* ----------------- Guides & Simulated Blockchain ----------------- */

function loadGuides(){
  const list = document.getElementById('guidesList');
  list.innerHTML = '';
  const guides = JSON.parse(localStorage.getItem('jh_guides') || '[]');
  guides.forEach(g => {
    const div = document.createElement('div');
    div.className='guideBox';
    div.innerHTML = `<h4>${g.name}</h4><p>Location: ${g.location || 'N/A'}</p>
      <p>Verified: <b>${g.verified ? 'Yes' : 'No'}</b></p>
      <p>Reg ID: ${g.regId}</p>
      <button onclick="adminToggleVerify('${g.regId}')">${g.verified ? 'Revoke' : 'Verify'}</button>
      <button onclick="viewCertificate('${g.regId}')">View Cert</button>`;
    list.appendChild(div);
  });
}

function registerGuide(e){
  e.preventDefault();
  const name = document.getElementById('gName').value.trim();
  const location = document.getElementById('gLocation').value.trim();
  const guides = JSON.parse(localStorage.getItem('jh_guides') || '[]');
  const regId = 'GID' + Date.now().toString(16);
  guides.push({ regId, name, location, verified: false, cert: null });
  localStorage.setItem('jh_guides', JSON.stringify(guides));
  document.getElementById('gName').value = document.getElementById('gLocation').value = '';
  loadGuides();
}

function adminVerifyAll(){
  let guides = JSON.parse(localStorage.getItem('jh_guides') || '[]');
  guides = guides.map(g => ({ ...g, verified: true, cert: g.cert || issueCert(g) }));
  localStorage.setItem('jh_guides', JSON.stringify(guides));
  alert('All guides verified (simulated). Certificates issued.');
  loadGuides();
  // update analytics
  updateAnalytics({ verifiedGuides: guides.filter(x=>x.verified).length });
}

function adminToggleVerify(regId){
  const guides = JSON.parse(localStorage.getItem('jh_guides') || '[]');
  const idx = guides.findIndex(g=>g.regId===regId);
  if (idx>=0){
    guides[idx].verified = !guides[idx].verified;
    if (guides[idx].verified && !guides[idx].cert) guides[idx].cert = issueCert(guides[idx]);
    localStorage.setItem('jh_guides', JSON.stringify(guides));
    loadGuides();
    updateAnalytics({ verifiedGuides: guides.filter(x=>x.verified).length });
  }
}

function issueCert(g){
  // simulated certificate object with pseudo tx
  const cert = { certId: 'CERT'+Math.floor(Math.random()*1e8).toString(16), issuedAt: new Date().toISOString(), tx: '0x' + Math.floor(Math.random()*1e16).toString(16) };
  return cert;
}

function issueCertificates(){
  let guides = JSON.parse(localStorage.getItem('jh_guides') || '[]');
  guides = guides.map(g => g.cert ? g : { ...g, cert: issueCert(g), verified: true });
  localStorage.setItem('jh_guides', JSON.stringify(guides));
  alert('Certificates issued for all guides.');
  loadGuides();
  updateAnalytics({ verifiedGuides: guides.filter(x=>x.verified).length });
}

function viewCertificate(regId){
  const guides = JSON.parse(localStorage.getItem('jh_guides') || '[]');
  const g = guides.find(x=>x.regId===regId);
  if (!g) return alert('Guide not found.');
  alert('Certificate:\n' + JSON.stringify(g.cert || { info:'No certificate issued' }, null, 2));
}

/* ----------------- Real-time transport (mock) ----------------- */

let mockVehicles = [
  { id:'bus-1', lat:23.35, lng:85.30, eta: 20 },
  { id:'bus-2', lat:23.5, lng:85.0, eta: 12 }
];

function startTransportSimulation(){
  setInterval(() => {
    // update positions a little and emit to UI
    mockVehicles = mockVehicles.map(v => ({ ...v, lat: v.lat + (Math.random()-0.5)*0.01, lng: v.lng + (Math.random()-0.5)*0.01, eta: Math.max(1, v.eta + Math.floor((Math.random()-0.5)*5)) }));
    const area = document.getElementById('transportArea');
    area.innerHTML = '<ul>' + mockVehicles.map(v => `<li>${v.id} — ETA: ${v.eta} mins — loc: ${v.lat.toFixed(3)}, ${v.lng.toFixed(3)}</li>`).join('') + '</ul>';
  }, 4000);
}

function shareLocation(){
  if (!navigator.geolocation) return alert('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    alert('Your location sent (demo): ' + latitude.toFixed(4) + ',' + longitude.toFixed(4));
    updateAnalytics({ visits: 1 });
  }, err => alert('Unable to fetch location'));
}

/* ----------------- Feedback & sentiment ----------------- */

function sendFeedback(){
  const text = document.getElementById('feedbackText').value || '';
  if (!text.trim()) { alert('Write feedback'); return; }
  // naive sentiment
  const t = text.toLowerCase();
  let score = 0;
  positiveWords.forEach(w => { if (t.includes(w)) score++; });
  negativeWords.forEach(w => { if (t.includes(w)) score--; });
  const sentiment = score > 0 ? 'positive' : (score < 0 ? 'negative' : 'neutral');
  document.getElementById('sentimentResult').innerText = `Sentiment: ${sentiment} (score ${score})`;
  // push to analytics store
  const fb = JSON.parse(localStorage.getItem('jh_feedback') || '[]');
  fb.push({ text, sentiment, at: new Date().toISOString() });
  localStorage.setItem('jh_feedback', JSON.stringify(fb));
  updateAnalytics({ visits: 1 });
  document.getElementById('feedbackText').value = '';
}

/* ----------------- Chatbot (rule-based, TTS) ----------------- */

let ttsLang = 'en-IN';
let lastBotReply = '';

function changeTTSlang(){
  const sel = document.getElementById('ttsLang');
  ttsLang = sel.value;
}

function openChat(){
  document.getElementById('chatWindow').classList.remove('hidden');
}

function closeChat(){
  document.getElementById('chatWindow').classList.add('hidden');
}

document.getElementById('chatIcon').addEventListener('click', ()=> {
  const win = document.getElementById('chatWindow');
  win.classList.toggle('hidden');
});

function sendChat(){
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  addChatMessage('user', text);
  input.value = '';
  // rule-based responses
  const resp = getBotResponse(text);
  addChatMessage('bot', resp);
  lastBotReply = resp;
  speakText(resp);
  // analytics: increment visits
  updateAnalytics({ visits: 1 });
}

function addChatMessage(who, text){
  const log = document.getElementById('chatLog');
  const p = document.createElement('p');
  p.className = who === 'user' ? 'user' : 'bot';
  p.innerText = text;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

function speakText(text){
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = ttsLang || 'en-IN';
  // try to pick voice matching lang
  const voices = speechSynthesis.getVoices();
  const v = voices.find(x => x.lang && x.lang.toLowerCase().startsWith(utter.lang.split('-')[0])) || voices.find(x => x.lang && x.lang.includes('IN')) || voices[0];
  if (v) utter.voice = v;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function speakLast(){
  if (lastBotReply) speakText(lastBotReply);
}

/* Simple pattern-based "AI" engine */
function getBotResponse(msg){
  const m = msg.toLowerCase();
  // greetings
  if (/(hi|hello|namaste|johar)/i.test(m)) return "Johar! Welcome to Johar Jharkhand. I can help with places, food, itineraries, guides and marketplace.";
  if (m.includes('food')) return "Famous Jharkhand foods include Dhuska, Rugra, Chilka Roti, and local drinks like Handia. Try them in local markets.";
  if (m.includes('waterfall') || m.includes('falls')) return "Check Hundru Falls, Dassam Falls, Jonha Falls and Hundru near Ranchi for beautiful waterfalls.";
  if (m.includes('places') || m.includes('visit') || m.includes('tour')) {
    return "Top places: Netarhat (sunsets), Hundru Falls (waterfall), Betla National Park (wildlife), Deoghar (pilgrimage). I can create an itinerary for you — tell me days and interests.";
  }
  if (m.includes('itinerary') || m.includes('plan')) {
    // a mini itinerary suggestion
    return "Tell me how many days you have and what interests (waterfalls, wildlife, culture, trekking). Example: '3 days, waterfalls and culture'.";
  }
  if (m.includes('guide')) {
    return "You can register as or find local guides. Use the Guide Registry on the page — guides can be verified and issued certificates (simulated).";
  }
  if (m.includes('market') || m.includes('handicraft')) {
    return "Visit the Marketplace to discover local tribal handicrafts, homestays and events. You can buy items with simulated payments.";
  }
  if (m.includes('festival')) {
    return "Important festivals: Sarhul (spring), Karma (harvest), Sohrai (festival of cattle), Tusu (regional harvest festival).";
  }
  if (m.includes('help') || m.includes('what can you do')) {
    return "I can generate itineraries, speak in multiple Indian languages, show map & AR preview, simulate payments, and analyze feedback. Ask me any question about Jharkhand!";
  }
  // fallback: try to match site names
  for (const s of sampleSites) {
    if (m.includes(s.name.toLowerCase()) || m.includes(s.id)) return `${s.name}: ${s.desc}. Located at approx ${s.lat}, ${s.lng}.`;
  }
  // Last fallback: echo + offer options
  return "Sorry, I don't know exactly — ask about places, food, festivals, guides, marketplace or say 'plan itinerary'.";
}

/* ----------------- Initialize app ----------------- */

window.addEventListener('load', () => {
  // map
  try { initMap(); } catch (e) { console.warn('Map init failed', e); }
  // marketplace
  if (!localStorage.getItem('jh_market')) localStorage.setItem('jh_market', JSON.stringify([
    { id:'prod_1', title:'Tribal Necklace (Handmade)', price:350, seller:'Asha Artisans' },
    { id:'prod_2', title:'Netarhat Homestay (2 nights)', price:2500, seller:'Sunita Stays' }
  ]));
  loadMarketplace();
  // guides default
  if (!localStorage.getItem('jh_guides')) localStorage.setItem('jh_guides', JSON.stringify([]));
  loadGuides();
  // transport simulation
  startTransportSimulation();
  // initialize analytics if missing
  if (!localStorage.getItem('jh_analytics')) updateAnalytics({});
  // TTS voices may be async; pre-load
  speechSynthesis.getVoices();
});