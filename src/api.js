/*
 * Petit adaptateur : expose window.claude.use('db') avec la même interface
 * que la base des artefacts Claude (collection().onSnapshot, doc().update…),
 * mais branché sur le serveur du carnet (API /api/*). Synchronisation par
 * interrogation régulière : chaque appareil voit les changements des autres
 * en quelques secondes.
 */
(function(){
  var POLL_MS = 8000;
  var cache = { recipes:{}, months:{}, courses:{}, settings:{} };
  var rev = 0, started = false, colSubs = {}, docSubs = {};

  function xhr(method, url, body, cb){
    var r = new XMLHttpRequest();
    r.open(method, url, true);
    r.withCredentials = true;
    if (body !== undefined) r.setRequestHeader('Content-Type', 'application/json');
    r.onreadystatechange = function(){
      if (r.readyState !== 4) return;
      var data = null; try { data = JSON.parse(r.responseText); } catch (e) {}
      cb(r.status, data);
    };
    r.onerror = function(){ cb(0, null); };
    r.send(body === undefined ? null : (typeof body === 'string' ? body : JSON.stringify(body)));
  }
  window.carnetApi = { xhr: xhr };

  function docSnap(id, data){ return { id: id, exists: !!data, data: function(){ return data || undefined; }, metadata: { fromCache: false, hasPendingWrites: false } }; }
  function colSnap(col){
    var docs = Object.keys(cache[col]).sort().map(function(id){ return docSnap(id, cache[col][id]); });
    return { docs: docs, size: docs.length, empty: !docs.length, docChanges: function(){ return []; } };
  }
  function notify(changedCols, changedDocs){
    changedCols.forEach(function(col){ (colSubs[col] || []).forEach(function(f){ try { f(colSnap(col)); } catch (e) { console.error(e); } }); });
    changedDocs.forEach(function(path){ var p = path.split('/'); (docSubs[path] || []).forEach(function(f){ try { f(docSnap(p[1], cache[p[0]][p[1]])); } catch (e) { console.error(e); } }); });
  }
  function pull(cb){
    xhr('GET', 'api/state?since=' + rev, undefined, function(st, data){
      if (st === 401) { showLogin(); return; }
      if (st !== 200 || !data) { if (cb) cb(false); return; }
      var cols = [], docs = [];
      Object.keys(data.collections || {}).forEach(function(col){
        var ch = data.collections[col]; var ids = Object.keys(ch);
        if (!cache[col]) cache[col] = {};
        if (ids.length) cols.push(col);
        ids.forEach(function(id){ if (ch[id] === null) delete cache[col][id]; else cache[col][id] = ch[id]; docs.push(col + '/' + id); });
      });
      rev = data.rev;
      if (cb) cb(true);
      if (cols.length) notify(cols, docs);
    });
  }
  function loop(){ setTimeout(function(){ if (document.hidden) { loop(); return; } pull(function(){ loop(); }); }, POLL_MS); }
  document.addEventListener('visibilitychange', function(){ if (!document.hidden && started) pull(); });

  function write(method, col, id, data){
    return new Promise(function(resolve, reject){
      xhr(method, 'api/doc/' + col + '/' + encodeURIComponent(id), data, function(st, res){
        if (st === 200) {
          if (data && method === 'PUT') cache[col][id] = data;
          else if (data && method === 'PATCH' && cache[col][id]) { Object.keys(data).forEach(function(k){ cache[col][id][k] = data[k]; }); }
          resolve(); return;
        }
        if (st === 404 && method === 'PATCH') { write('PUT', col, id, data).then(resolve, reject); return; }
        if (st === 401) showLogin();
        reject({ code: st === 0 ? 'unavailable' : 'invalid_argument', message: (res && res.error) || 'Erreur ' + st });
      });
    });
  }
  function docRef(path){
    var p = path.split('/'); var col = p[0], id = p[1];
    return {
      id: id, path: path,
      get: function(){ return Promise.resolve(docSnap(id, cache[col][id])); },
      set: function(d){ return write('PUT', col, id, d); },
      update: function(d){ return write('PATCH', col, id, d); },
      'delete': function(){ return new Promise(function(res){ xhr('DELETE', 'api/doc/' + col + '/' + encodeURIComponent(id), undefined, function(){ delete cache[col][id]; res(); }); }); },
      onSnapshot: function(next){ (docSubs[path] = docSubs[path] || []).push(next); setTimeout(function(){ next(docSnap(id, cache[col][id])); }, 0); return function(){}; }
    };
  }
  var db = {
    doc: docRef,
    collection: function(col){
      return {
        path: col,
        doc: function(id){ return docRef(col + '/' + id); },
        onSnapshot: function(next){ (colSubs[col] = colSubs[col] || []).push(next); setTimeout(function(){ next(colSnap(col)); }, 0); return function(){}; }
      };
    }
  };

  var readyResolve = null;
  var ready = new Promise(function(res){ readyResolve = res; });
  function boot(){
    pull(function(ok){
      if (!ok) { setTimeout(boot, 3000); return; }
      if (!started) { started = true; hideLogin(); readyResolve(db); loop(); }
    });
  }

  // ---------- écran de connexion ----------
  function showLogin(){
    var el = document.getElementById('login');
    if (el) { el.hidden = false; return; }
    el = document.createElement('div'); el.id = 'login'; el.className = 'login';
    el.innerHTML = '<form class="login-box" id="login-form"><span class="eyebrow">Mon carnet de cuisine</span><h1 class="display">Carnet des repas</h1>' +
      '<label for="login-pw">Mot de passe</label><input id="login-pw" type="password" autocomplete="current-password" autofocus>' +
      '<p class="login-err" id="login-err" hidden></p><button class="btn primary big" type="submit">Entrer</button>' +
      '<p class="hint small">Sur la tablette, tu resteras connecté pendant un an.</p></form>';
    document.body.appendChild(el);
    document.getElementById('login-form').addEventListener('submit', function(e){
      e.preventDefault();
      var pw = document.getElementById('login-pw').value;
      var err = document.getElementById('login-err');
      xhr('POST', 'api/login', { password: pw }, function(st, res){
        if (st === 200) { err.hidden = true; boot(); }
        else { err.textContent = (res && res.error) || 'Connexion impossible.'; err.hidden = false; }
      });
    });
  }
  function hideLogin(){ var el = document.getElementById('login'); if (el) el.hidden = true; }

  xhr('GET', 'api/me', undefined, function(st, me){
    if (st === 200 && me && !me.authed) showLogin();
    else boot();
  });

  window.claude = { use: function(name){ return name === 'db' ? ready : Promise.resolve(null); } };
})();
