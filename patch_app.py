"""Adapte le code du carnet (issu de l'artefact) à l'app autonome :
mode tablette, import/export, messages d'erreur, changement de jour."""
import sys
p = sys.argv[1]
h = open(p).read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (a[:90], h.count(a)); h = h.replace(a, b)

# message hors ligne
i = h.index("    if(S.status==='unavailable'){app.innerHTML=")
j = h.index("\n", i)
h = h[:i] + "    if(S.status==='unavailable'){app.innerHTML=hero('<span class=\"eyebrow\">Mon carnet de cuisine</span><h1 class=\"display\">Carnet des repas</h1>')+'<div class=\"wrap\"><p class=\"state\">Impossible de joindre le serveur du carnet. Vérifie la connexion internet, puis recharge la page.</p></div>';return}" + h[j:]

# mode tablette : #tablette dans l'adresse
rep("  S.tab=TABS.includes(h)?h:'today';", "  S.tab=TABS.includes(h)?h:'today';\n  S.kiosk=(h==='tablette'||h==='kiosque');\n  if(S.kiosk)document.documentElement.className+=' kiosk-mode';")
rep("""  function render(){
    if(S.cook&&S.recipes[S.cook.id]){app.innerHTML=renderCook();return}""", """  function render(){
    if(S.cook&&S.recipes[S.cook.id]){app.innerHTML=renderCook();return}
    if(S.kiosk&&S.status==='ok'){pickMonth();const km=S.monthId?S.months[S.monthId]:null;app.innerHTML=S.recipeId&&S.recipes[S.recipeId]?'<div class="wrap kwrap">'+renderRecipe(S.recipeId)+'</div>':renderKiosk(km);return}""")
rep("    if(act==='back'){const f=S.from;", "    if(act==='back'&&S.kiosk){S.recipeId=null;render();window.scrollTo({top:0});return}\n    if(act==='back'){const f=S.from;")
rep("  function openRecipe(id,from){", "  function openRecipe(id,from){\n    if(S.kiosk){S.recipeId=id;S.from='kiosk';render();window.scrollTo({top:0});return}\n    return openRecipeFull(id,from)}\n  function openRecipeFull(id,from){")

KIOSK = r"""
  // ---- Mode tablette (écran de cuisine)
  const JOURS_FR=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  function clockText(){const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
  function renderKiosk(m){
    const d=new Date();
    let html='<div class="kiosk"><header class="k-head"><div><span class="eyebrow">Mon carnet de cuisine</span><h1 class="display k-date">'+JOURS_FR[d.getDay()]+' '+d.getDate()+' '+MOIS[d.getMonth()]+'</h1></div><div class="k-clock" id="k-clock">'+clockText()+'</div></header>';
    if(!m){return html+'<p class="state">Aucun planning en cours.</p></div>'}
    const t=findDay(m,TODAY);
    if(t)html+='<div class="k-meals">'+bigMeal(t,'midi')+bigMeal(t,'soir')+'</div>';
    else html+='<p class="state">Rien de prévu aujourd\'hui.</p>';
    const tm=findDay(m,TOMORROW_G);
    html+='<div class="k-bottom">';
    if(tm){
      const thaws=['midi','soir'].map(sl=>{const x=tm.d[sl]||{};const r=x.recipeId&&S.recipes[x.recipeId];const n=(!x.off&&!x.leftover)?thawNote(r):'';return n?{sl,x,n}:null}).filter(Boolean);
      if(thaws.length)html+='<section class="thaw k-card"><h3 class="serif">'+ICON_SNOW+'Ce soir, pour demain</h3><ul>'+thaws.map(o=>'<li><b>'+esc(o.x.name)+'</b> : '+esc(o.n.replace(/^la veille( au soir)?,?\s*/i,''))+'</li>').join('')+'</ul></section>';
      const lab=x=>!x?'—':x.off==='site'?'Sur site':x.off==='commande'?'Commande':x.name;
      html+='<section class="tomorrow k-card"><div class="eyebrow">Demain · '+esc(tm.d.day.toLowerCase())+'</div><div class="tc-row"><span class="slot midi">Midi</span><span>'+esc(lab(tm.d.midi))+'</span></div><div class="tc-row"><span class="slot soir">Soir</span><span>'+esc(lab(tm.d.soir))+'</span></div></section>';
    }
    html+='</div></div>';
    return html;
  }
  setInterval(function(){
    const el=document.getElementById('k-clock');if(el)el.textContent=clockText();
    // nouveau jour : on recharge pour repartir sur la bonne date
    if(iso(new Date())!==TODAY)location.reload();
  },30000);
  // en mode tablette, on revient à l'écran du jour après 20 min sans toucher l'écran
  let idleT=null;
  function resetIdle(){if(!S.kiosk)return;clearTimeout(idleT);idleT=setTimeout(function(){if(S.cook&&S.timers.some(t=>!t.done))return resetIdle();S.cook=null;S.recipeId=null;render()},20*60000)}
  ['touchstart','click','keydown'].forEach(function(ev){document.addEventListener(ev,resetIdle,true)});
  resetIdle();

  // ---- Données : export / import
  function renderData(){
    return '<section class="hsec data"><h2 class="serif">Données</h2><p class="hint small">Pour sauvegarder le carnet, ou importer le planning que Claude t\'a préparé.</p>'+
      '<div class="data-row"><a class="btn" href="api/export" download>Exporter (fichier JSON)</a>'+
      '<label class="btn primary" for="import-file">Importer un fichier</label><input type="file" id="import-file" accept=".json,application/json" hidden></div>'+
      '<p class="hint small">L\'import ajoute ou remplace les recettes, plannings et listes du fichier, sans effacer le reste. Une sauvegarde est faite avant chaque import.</p>'+
      '<p class="hint small">Écran de cuisine pour la tablette : ouvre <b>'+esc(location.origin+location.pathname)+'#tablette</b></p></section>';
  }
  app.addEventListener('change',function(e){
    if(e.target.id!=='import-file')return;
    const f=e.target.files&&e.target.files[0];if(!f)return;
    const rd=new FileReader();
    rd.onload=function(){
      let body;try{body=JSON.parse(rd.result)}catch(err){toast('Ce fichier n\'est pas un JSON valide.');return}
      window.carnetApi.xhr('POST','api/import?mode=merge',body,function(st,res){
        if(st===200){toast((res.imported||0)+' éléments importés');setTimeout(function(){location.reload()},1200)}
        else toast((res&&res.error)||'Import impossible.');
      });
    };
    rd.readAsText(f);
  });

  // ---- actions"""
rep("\n  // ---- actions", KIOSK)
# ajoute la section Données en bas de l'historique
i = h.index("  function renderHist(){")
j = h.index("    return html;\n  }\n  function hl(", i)
h = h[:j] + "    html+=renderData();\n" + h[j:]
open(p, 'w').write(h)
print('app patché')
