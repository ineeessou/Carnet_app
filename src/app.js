
(function(){
  const app=document.getElementById('app');
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=o=>JSON.parse(JSON.stringify(o));
  const store=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
  const load=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
  const MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const fmt=iso=>{if(!iso)return'';const p=iso.split('-').map(Number);return p[2]+' '+MOIS[p[1]-1]};
  const now=new Date();
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const TOMORROW_G=iso(new Date(now.getTime()+864e5));
  const TODAY=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const ICON_UP='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 14.2 6.9 13.2C3 9.7.5 7.4.5 4.6.5 2.4 2.2.7 4.4.7c1.2 0 2.4.6 3.1 1.5h1C9.2 1.3 10.4.7 11.6.7c2.2 0 3.9 1.7 3.9 3.9 0 2.8-2.5 5.1-6.4 8.6z"/></svg>';
  const ICON_DOWN='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M3.5 3.5l9 9m0-9-9 9"/></svg>';
  const ICON_BOOK='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M2 3.2c2-.9 4-.9 6 .6 2-1.5 4-1.5 6-.6v9.6c-2-.9-4-.9-6 .6-2-1.5-4-1.5-6-.6zM8 3.8v9.6"/></svg>';
  const ICON_DEV={thermomix:'<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M3 5h10l-1.2 8.2a1 1 0 0 1-1 .8H5.2a1 1 0 0 1-1-.8zM5.5 5V3.5h5V5M13 7h1.5v3H12.6"/></svg>',airfryer:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="10" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M5.5 9h5M6 5.5h4"/></svg>'};
  const ICON_SWAP='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 2.5v11M1.5 11 4 13.5 6.5 11M12 13.5v-11M9.5 5 12 2.5 14.5 5"/></svg>';
  const ICON_MORE='<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3.5" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12.5" cy="8" r="1.5" fill="currentColor"/></svg>';
  const ICON_PEN='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M10.5 2.5l3 3L6 13H3v-3z"/></svg>';
  const ICON_PLAY='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M4 2.8v10.4a.6.6 0 0 0 .9.5l8.3-5.2a.6.6 0 0 0 0-1L4.9 2.3a.6.6 0 0 0-.9.5z"/></svg>';
  const ICON_SNOW='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8 1.5v13M2.4 4.8l11.2 6.4M2.4 11.2l11.2-6.4M6 2.8 8 4.5l2-1.7M6 13.2l2-1.7 2 1.7"/></svg>';
  const ICON_X='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 4l8 8m0-8-8 8"/></svg>';
  const ICON_BACK='<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 3 5 8l5 5"/></svg>';

  const S={status:'loading',months:{},lists:{},prefs:null,recipes:{},recipeId:null,q:'',cuisine:'',snacks:[],snackType:'',snackNow:false,monthId:load('month'),listId:load('list'),
    tab:'plan',editing:null,confirmReset:false,readOnly:false,dirty:false};
  const TABS=['today','plan','courses','frigo','recettes','historique'];
  const h=(location.hash||'').slice(1);
  S.tab=TABS.includes(h)?h:'today';
  S.kiosk=(h==='tablette'||h==='kiosque');
  if(S.kiosk)document.documentElement.className+=' kiosk-mode';
  S.cook=null;S.timers=[];

  let db=null;
  const pending={};

  function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{t.hidden=true},2600)}

  function queue(path,fields){
    const p=pending[path]||(pending[path]={data:{},timer:null,busy:false});
    Object.assign(p.data,fields);
    clearTimeout(p.timer);
    p.timer=setTimeout(()=>flush(path),400);
  }
  async function flush(path){
    const p=pending[path];if(!p||p.busy)return;
    const data=p.data;p.data={};p.busy=true;
    try{await db.doc(path).update(data)}
    catch(e){
      const code=e&&e.code;
      if(code==='unavailable'&&!p.retried){p.retried=true;p.data=Object.assign({},data,p.data);p.busy=false;setTimeout(()=>flush(path),700+Math.random()*700);return}
      if(code==='invalid_argument'){S.readOnly=true;toast('Cette page est en lecture seule pour toi.');render()}
      else toast("L'enregistrement n'a pas abouti. Réessaie dans un instant.");
    }
    p.busy=false;p.retried=false;
    if(Object.keys(p.data).length)flush(path);else delete pending[path];
  }

  function requestRender(){
    const a=document.activeElement;
    if(S.editing||(a&&app.contains(a)&&(a.tagName==='INPUT'&&a.type==='text'||a.tagName==='TEXTAREA'))){S.dirty=true;return}
    render();
  }
  app.addEventListener('focusout',()=>{setTimeout(()=>{if(S.dirty&&!S.editing){S.dirty=false;render()}},50)});

  function monthsSorted(){return Object.entries(S.months).map(([id,m])=>Object.assign({id},m)).sort((a,b)=>String(a.start).localeCompare(String(b.start)))}
  function activeMonths(){return monthsSorted().filter(m=>!m.end||m.end>=TODAY)}
  function pickMonth(){
    const ms=activeMonths();if(!ms.length){S.monthId=null;return}
    if(S.monthId&&ms.find(m=>m.id===S.monthId))return;
    const tm=new Date(now.getTime()+864e5),TOMORROW=tm.getFullYear()+'-'+String(tm.getMonth()+1).padStart(2,'0')+'-'+String(tm.getDate()).padStart(2,'0');
    const live=ms.filter(m=>m.start<=TOMORROW&&TODAY<=m.end);
    const cur=live[live.length-1]||ms.find(m=>m.start>TODAY)||ms[ms.length-1];
    S.monthId=cur.id;
  }
  function listsForMonth(){return Object.entries(S.lists).map(([id,l])=>Object.assign({id},l)).filter(l=>l.monthId===S.monthId).sort((a,b)=>(a.order||0)-(b.order||0))}
  function pickList(){const ls=listsForMonth();if(!ls.length){S.listId=null;return null}if(!ls.find(l=>l.id===S.listId)){const open=ls.find(l=>l.sections.some(s=>s.items.some(i=>!i.done)));S.listId=(open||ls[ls.length-1]).id}return S.lists[S.listId]}

  function hero(inner){return '<header class="hero"><div class="wrap hero-in">'+inner+'</div></header>'}
  function todayCard(m){
    if(!m)return '';
    let found=null;
    m.weeks.forEach(w=>w.days.forEach(d=>{if(!found&&d.date>=TODAY)found=d}));
    if(!found)return '';
    const lab=x=>!x?'—':x.off==='site'?'Sur site':x.off==='commande'?'Commande':x.name;
    const title=found.date===TODAY?'Aujourd\'hui':'Prochain repas · '+found.day.toLowerCase()+' '+fmt(found.date);
    return '<div class="today-card"><span class="hand">'+esc(title)+'</span><div class="tc-row"><span class="slot midi">Midi</span><span>'+esc(lab(found.midi))+'</span></div><div class="tc-row"><span class="slot soir">Soir</span><span>'+esc(lab(found.soir))+'</span></div></div>';
  }
  function render(){
    if(S.cook&&S.recipes[S.cook.id]){app.innerHTML=renderCook();return}
    if(S.kiosk&&S.status==='ok'){pickMonth();const km=S.monthId?S.months[S.monthId]:null;app.innerHTML=S.recipeId&&S.recipes[S.recipeId]?'<div class="wrap kwrap">'+renderRecipe(S.recipeId)+'</div>':renderKiosk(km);return}
    if(S.status==='loading'){app.innerHTML=hero('<span class="eyebrow">Mon carnet de cuisine</span><h1 class="display">Chargement…</h1>');return}
    if(S.status==='unavailable'){app.innerHTML=hero('<span class="eyebrow">Mon carnet de cuisine</span><h1 class="display">Carnet des repas</h1>')+'<div class="wrap"><p class="state">Impossible de joindre le serveur du carnet. Vérifie la connexion internet, puis recharge la page.</p></div>';return}
    pickMonth();
    const m=S.monthId?S.months[S.monthId]:null;
    const list=pickList();
    const left=list?list.sections.reduce((n,s)=>n+s.items.filter(i=>!i.done).length,0):0;
    let top='<div class="hero-text"><span class="eyebrow">Mon carnet de cuisine</span>';
    top+='<h1 class="display">'+esc(m?m.label:'Aucun mois planifié')+'</h1>';
    if(m)top+='<span class="range">du '+fmt(m.start)+' au '+fmt(m.end)+' · anti-inflammatoire, saveurs du Maroc et d\'ailleurs</span>';
    const ms=activeMonths();
    if(ms.length>1)top+='<div class="months" role="group" aria-label="Mois">'+ms.map(x=>'<button class="mchip" data-act="month" data-id="'+esc(x.id)+'" aria-pressed="'+(x.id===S.monthId)+'">'+esc(x.label)+'</button>').join('')+'</div>';
    top+='</div>'+(S.tab==='today'?'':todayCard(m));
    let html=hero(top)+'<div class="wrap">';
    html+='<nav class="tabs" role="tablist">'+
      tabBtn('today','Aujourd\'hui','')+
      tabBtn('plan','Planning','')+
      tabBtn('courses','Courses',list?'<span class="count">'+left+'</span>':'')+
      tabBtn('frigo','Frigo','')+
      tabBtn('recettes','Recettes','')+
      tabBtn('historique','Historique','')+'</nav>';
    html+='<main class="'+(S.readOnly?'ro':'')+'">';
    if(S.tab==='today')html+=renderToday(m);
    else if(S.tab==='plan')html+=renderPlan(m);
    else if(S.tab==='frigo')html+=renderFrigo();
    else if(S.tab==='courses')html+=renderCourses(list);
    else if(S.tab==='recettes')html+=S.recipeId&&S.recipes[S.recipeId]?renderRecipe(S.recipeId):renderRecipes();
    else html+=renderHist();
    html+='</main></div>';
    app.innerHTML=html;
    {const nav=app.querySelector('.tabs'),t=nav&&nav.querySelector('[aria-selected="true"]');if(t&&(t.offsetLeft+t.offsetWidth>nav.scrollLeft+nav.clientWidth||t.offsetLeft<nav.scrollLeft))nav.scrollLeft=Math.max(0,t.offsetLeft-16)}
    if(S.editing){const ta=document.getElementById('edit-meal');if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length)}}
  }
  function tabBtn(id,label,extra){return '<button class="tab" role="tab" data-act="tab" data-id="'+id+'" aria-selected="'+(S.tab===id)+'">'+label+extra+'</button>'}

  function renderPlan(m){
    if(!m)return '<p class="empty">Aucun planning pour l\'instant. Demande à Claude de préparer le mois.</p>';
    let html='';
    if(S.swap){const sx=S.months[S.monthId].weeks[S.swap.w].days[S.swap.d][S.swap.slot]||{};html+='<div class="swapbar" role="status"><span>Où veux-tu mettre <b>'+esc(sx.off?(sx.off==='site'?'Sur site':'Commande'):sx.name)+'</b> ? Touche le repas avec lequel l\'échanger.</span><button class="btn" data-act="swapcancel">Annuler</button></div>';}
    else if(!S.readOnly)html+='<p class="hint">Touche le nom d\'un plat pour ouvrir sa recette. Le cœur = fait, la croix = pas envie (Claude réutilisera ses ingrédients). Le bouton « … » sert à échanger deux repas de place ou à changer un plat.</p>';
    m.weeks.forEach((w,wi)=>{
      if(!w.days.some(d=>d.date>=TODAY))return;
      const first=w.days.find(d=>d.date>=TODAY),last=w.days[w.days.length-1];
      html+='<section class="week"><div class="week-head"><h2 class="serif">'+esc(w.label)+'</h2><span class="range">'+fmt(first.date)+' – '+fmt(last.date)+'</span></div>';
      w.days.forEach((d,di)=>{
        if(d.date<TODAY)return;
        const we=/samedi|dimanche/i.test(d.day);
        const today=d.date===TODAY;
        html+='<div class="day'+(we?' we':'')+(today?' today':'')+'"><div class="dhead"><div class="dname">'+esc(d.day)+'</div><div class="ddate">'+fmt(d.date)+'</div>'+(today?'<span class="pill">Aujourd\'hui</span>':'')+'</div><div class="meals">'+
          meal(wi,di,'midi','Midi',d.midi)+meal(wi,di,'soir','Soir',d.soir)+'</div></div>';
      });
      html+='</section>';
    });
    return html;
  }
  function meal(wi,di,slot,label,x){
    x=x||{name:'',rating:0};
    const ed=S.editing&&S.editing.w===wi&&S.editing.d===di&&S.editing.slot===slot;
    const key='data-w="'+wi+'" data-d="'+di+'" data-slot="'+slot+'"';
    const lab='<span class="mlabel '+slot+'">'+label+'</span>';
    if(ed){
      return '<div class="meal">'+lab+'<div class="editbox"><textarea class="edit" id="edit-meal" '+key+' aria-label="'+label+'" placeholder="Nom du plat">'+esc(x.name)+'</textarea>'+
        '<div class="editbar"><button class="btn primary" data-act="save" '+key+'>Enregistrer</button><button class="btn" data-act="off" data-v="site" '+key+'>Sur site</button><button class="btn" data-act="off" data-v="commande" '+key+'>Commande</button><button class="btn" data-act="cancel">Annuler</button></div></div><div></div></div>';
    }
    const isSrc=S.swap&&S.swap.w===wi&&S.swap.d===di&&S.swap.slot===slot;
    if(S.swap){
      const txt=x.off?(x.off==='site'?'Sur site':'Commande'):(x.name||'—');
      if(isSrc)return '<div class="meal swap-src">'+lab+'<div class="mcell"><span class="mname">'+esc(txt)+'</span><span class="mmeta">Repas à déplacer</span></div><div></div></div>';
      return '<button class="meal swap-target" data-act="swapto" '+key+'>'+lab+'<span class="mcell"><span class="mname">'+esc(txt)+'</span><span class="mmeta">Toucher pour échanger</span></span><span class="swap-ico" aria-hidden="true">'+ICON_SWAP+'</span></button>';
    }
    const open=S.menu&&S.menu.w===wi&&S.menu.d===di&&S.menu.slot===slot;
    const more=S.readOnly?'':'<button class="rb more" data-act="menu" '+key+' aria-expanded="'+open+'" aria-label="Plus d\'options" title="Plus d\'options">'+ICON_MORE+'</button>';
    const menu=open?'<div class="mmenu"><button class="btn sm" data-act="swap" '+key+'>'+ICON_SWAP+'Échanger de place</button><button class="btn sm" data-act="edit" '+key+'>'+ICON_PEN+'Changer le plat</button>'+(x.off?'':'<button class="btn sm" data-act="off" data-v="site" '+key+'>Sur site</button><button class="btn sm" data-act="off" data-v="commande" '+key+'>Commande</button>')+'</div>':'';
    if(x.off){
      const txt=x.off==='site'?'Sur site, pas de repas à prévoir':'Commande à emporter';
      return '<div class="meal off">'+lab+'<div class="mcell"><span class="offchip '+esc(x.off)+'">'+txt+'</span></div><div class="rate">'+more+'</div>'+menu+'</div>';
    }
    const r=x.recipeId&&S.recipes[x.recipeId];
    const meta=r?'<span class="mmeta">'+ICON_BOOK+totalTime(r)+(bestOf(r)!=='classique'?' · '+DEV[bestOf(r)]:'')+(x.leftover?' · restes':'')+'</span>':(x.leftover?'<span class="mmeta">restes</span>':'');
    const name=r?'<button class="mname link" data-act="recipe" data-id="'+esc(x.recipeId)+'">'+esc(x.name||r.title)+'</button>':'<span class="mname">'+esc(x.name||'—')+'</span>';
    const body='<div class="mcell">'+name+meta+'</div>';
    const rate=S.readOnly?'<div></div>':'<div class="rate"><button class="rb good" data-act="rate" data-v="1" '+key+' aria-pressed="'+(x.rating===1)+'" aria-label="Fait" title="Fait">'+ICON_UP+'</button><button class="rb bad" data-act="rate" data-v="-1" '+key+' aria-pressed="'+(x.rating===-1)+'" aria-label="Pas envie" title="Pas envie">'+ICON_DOWN+'</button>'+more+'</div>';
    return '<div class="meal">'+lab+body+rate+menu+'</div>';
  }

  function renderCourses(list){
    const ls=listsForMonth();
    if(!list)return '<p class="empty">Pas encore de liste de courses pour ce mois. Demande à Claude de la préparer.</p>';
    let html='';
    if(ls.length>1)html+='<div class="lists" role="group" aria-label="Listes">'+ls.map(l=>'<button class="mchip" data-act="list" data-id="'+esc(l.id)+'" aria-pressed="'+(l.id===S.listId)+'">'+esc(l.label)+'</button>').join('')+'</div>';
    const total=list.sections.reduce((n,s)=>n+s.items.length,0);
    const done=list.sections.reduce((n,s)=>n+s.items.filter(i=>i.done).length,0);
    html+='<div class="progress"><div class="row"><span><strong>'+done+' / '+total+'</strong> articles pris · '+esc(list.label)+(list.people?' · pour '+list.people+' personnes':'')+'</span>'+(S.readOnly||!done?'':'<button class="btn" data-act="askreset">Tout décocher</button>')+'</div><div class="bar"><span style="width:'+(total?Math.round(done/total*100):0)+'%"></span></div></div>';
    html+='<p class="hint small">Ce que tu as déjà à la maison se gère dans l\'onglet <button class="inline-link" data-act="tab" data-id="frigo">Frigo</button>.</p>';
    if(S.confirmReset)html+='<div class="confirm" role="alert"><span>Décocher les '+done+' articles pris ?</span><button class="btn danger" data-act="reset">Décocher</button><button class="btn" data-act="cancelreset">Annuler</button></div>';
    list.sections.forEach((s,si)=>{
      const rest=s.items.filter(i=>!i.done).length;
      html+='<section class="shop"><h2 class="serif">'+esc(s.title)+'</h2><div class="sub">'+esc(s.sub||'')+(s.sub?' · ':'')+rest+' à prendre</div>';
      s.items.forEach(it=>{
        const id='it-'+esc(S.listId)+'-'+esc(it.id);
        html+='<div class="item'+(it.done?' done':'')+'"><input type="checkbox" id="'+id+'" data-act="check" data-s="'+si+'" data-i="'+esc(it.id)+'"'+(it.done?' checked':'')+(S.readOnly?' disabled':'')+'><label for="'+id+'">'+esc(it.text)+'</label>'+(it.added&&!S.readOnly?'<button class="del" data-act="del" data-s="'+si+'" data-i="'+esc(it.id)+'" aria-label="Retirer '+esc(it.text)+'">×</button>':'')+'</div>';
      });
      if(!S.readOnly)html+='<form class="add" data-s="'+si+'"><input type="text" id="add-'+si+'" placeholder="Ajouter un article" aria-label="Ajouter un article à '+esc(s.title)+'"><button class="btn primary" type="submit">Ajouter</button></form>';
      html+='</section>';
    });
    return html;
  }

  function renderHist(){
    const ms=monthsSorted().reverse();
    let meals=[];
    ms.forEach(m=>m.weeks.forEach(w=>w.days.forEach(d=>['midi','soir'].forEach(sl=>{if(d[sl]&&d[sl].name&&!d[sl].off)meals.push({name:d[sl].name,rating:d[sl].rating||0,month:m.label,date:d.date})}))));
    ms.forEach(m=>(m.log||[]).forEach(x=>{if(x&&x.name)meals.push({name:x.name,rating:x.rating||0,month:m.label,date:x.date||''})}));
    const good=meals.filter(x=>x.rating===1),bad=meals.filter(x=>x.rating===-1);
    let html='<div class="stats"><div class="stat"><b>'+meals.length+'</b><span>repas planifiés</span></div><div class="stat"><b>'+good.length+'</b><span>faits</span></div><div class="stat"><b>'+bad.length+'</b><span>pas envie</span></div></div>';
    html+='<div class="note hsec"><b>Pour le mois suivant</b> : demande à Claude « Prépare le planning du mois prochain à partir de mon carnet ». Il repart de cet historique pour proposer des plats nouveaux, tient compte des plats faits et écarte ceux marqués « pas envie ».</div>';
    html+='<section class="hsec"><h2 class="serif">Faits</h2>'+hl(good,'Rien de noté pour l\'instant. Touche le cœur à côté d\'un plat du planning.')+'</section>';
    html+='<section class="hsec"><h2 class="serif">Pas envie</h2>'+hl(bad,'Aucun plat écarté pour l\'instant.')+'</section>';
    html+='<section class="hsec"><h2 class="serif">Mois passés et en cours</h2>';
    ms.forEach(m=>{
      const lab=x=>!x?'—':x.off==='site'?'sur site':x.off==='commande'?'commande':x.name;
      const n=m.weeks.reduce((a,w)=>a+w.days.reduce((b,d)=>b+['midi','soir'].filter(sl=>d[sl]&&d[sl].name&&!d[sl].off).length,0),0);
      html+='<details class="month"'+(m.id===S.monthId?' open':'')+'><summary>'+esc(m.label)+' <small>· '+n+' repas · du '+fmt(m.start)+' au '+fmt(m.end)+'</small></summary>';
      m.weeks.forEach(w=>{html+='<div class="eyebrow" style="margin-top:10px">'+esc(w.label)+'</div><ol>';w.days.forEach(d=>{html+='<li>'+esc(d.day)+' : '+esc(lab(d.midi))+' / '+esc(lab(d.soir))+'</li>'});html+='</ol>'});
      html+='</details>';
    });
    html+='</section>';
    const p=S.prefs;
    if(p){
      html+='<section class="hsec"><h2 class="serif">Vos repères</h2>';
      if(p.avoid&&p.avoid.length)html+='<div class="eyebrow">À éviter</div><div class="chips">'+p.avoid.map(a=>'<span class="chip no">'+esc(a)+'</span>').join('')+'</div>';
      if(p.likes&&p.likes.length)html+='<div class="eyebrow">Envies</div><div class="chips">'+p.likes.map(a=>'<span class="chip yes">'+esc(a)+'</span>').join('')+'</div>';
      if(p.principles&&p.principles.length)html+='<div class="eyebrow">Principes</div><ul class="principles">'+p.principles.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul>';
      html+='</section>';
    }
    html+=renderData();
    return html;
  }
  function hl(arr,empty){
    if(!arr.length)return '<p class="empty">'+esc(empty)+'</p>';
    return '<ul class="hlist">'+arr.map(x=>'<li><span>'+esc(x.name)+'</span><small>'+esc(x.month)+'</small></li>').join('')+'</ul>';
  }

  // ---- recettes
  function fmtMin(t){return t>=60?Math.floor(t/60)+' h'+(t%60?' '+String(t%60).padStart(2,'0'):''):t+' min'}
  const DEV={thermomix:'Thermomix',airfryer:'Airfryer'};
  function bestOf(r){const b=r.devices&&r.devices.best;return b&&r.devices.variants&&r.devices.variants[b]?b:'classique'}
  function methodTime(r,m){const v=m&&m!=='classique'&&r.devices&&r.devices.variants&&r.devices.variants[m];return v&&v.time?v.time:(r.prep||0)+(r.cook||0)}
  function totalTime(r){return fmtMin(methodTime(r,bestOf(r)))}
  function devTag(r){const b=bestOf(r);return b==='classique'?'':'<span class="dtag d-'+b+'">'+ICON_DEV[b]+DEV[b]+'</span>'}
  function plannedFor(id){
    const out=[];
    monthsSorted().forEach(m=>m.weeks.forEach(w=>w.days.forEach(d=>['midi','soir'].forEach(sl=>{const x=d[sl];if(x&&x.recipeId===id&&!x.leftover&&!x.off)out.push({date:d.date,day:d.day,slot:sl})}))));
    return out;
  }
  function norm(s){return String(s||'').toLowerCase().replace(/\u0153/g,'oe').normalize('NFD').replace(/[̀-ͯ]/g,'')}
  function recipeMatches(r){
    if(S.cuisine&&r.cuisine!==S.cuisine)return false;
    if(S.dev&&!(r.devices&&r.devices.variants&&r.devices.variants[S.dev]))return false;
    if(!S.q)return true;
    const q=norm(S.q);
    return norm(r.title).includes(q)||(r.ingredients||[]).some(i=>norm(i.item).includes(q));
  }
  function recipeCards(){
    const all=Object.entries(S.recipes).map(([id,r])=>Object.assign({id},r));
    const withDate=all.map(r=>{const p=plannedFor(r.id);return Object.assign(r,{next:(p.find(x=>x.date>=TODAY)||p[p.length-1]||null)})});
    const list=withDate.filter(recipeMatches).sort((a,b)=>{
      const ad=a.next?a.next.date:'9999',bd=b.next?b.next.date:'9999';
      const au=ad>=TODAY?0:1,bu=bd>=TODAY?0:1;
      return au-bu||ad.localeCompare(bd)||a.title.localeCompare(b.title);
    });
    if(!list.length)return '<p class="empty">Aucune recette ne correspond. Essaie un autre mot, comme « poulet » ou « tajine ».</p>';
    return list.map(r=>'<button class="rcard" data-act="recipe" data-id="'+esc(r.id)+'"><span class="rtitle">'+esc(r.title)+'</span><span class="rmeta"><span class="tag c-'+esc(norm(r.cuisine).replace(/[^a-z]/g,''))+'">'+esc(r.cuisine)+'</span>'+devTag(r)+totalTime(r)+' · '+esc(r.difficulty)+(r.next?' · '+(r.next.date>=TODAY?'prévu ':'fait ')+esc(r.next.day.toLowerCase())+' '+fmt(r.next.date):'')+'</span></button>').join('');
  }
  function renderRecipes(){
    const n=Object.keys(S.recipes).length;
    if(!n)return '<p class="empty">Pas encore de recettes. Demande à Claude de les ajouter.</p>';
    const cuisines=[...new Set(Object.values(S.recipes).map(r=>r.cuisine))].sort();
    let html='<div class="rsearch"><input type="text" id="recipe-q" placeholder="Chercher un plat ou un ingrédient" aria-label="Chercher une recette" value="'+esc(S.q)+'"></div>';
    html+='<div class="chips-row" role="group" aria-label="Cuisine"><button class="mchip" data-act="cuisine" data-id="" aria-pressed="'+(!S.cuisine)+'">Toutes · '+n+'</button>'+cuisines.map(c=>'<button class="mchip" data-act="cuisine" data-id="'+esc(c)+'" aria-pressed="'+(S.cuisine===c)+'">'+esc(c)+'</button>').join('')+'</div>';
    html+='<div class="chips-row dev-row" role="group" aria-label="Appareil"><span class="eyebrow">Faisable au</span>'+['thermomix','airfryer'].map(d=>'<button class="mchip" data-act="dev" data-id="'+d+'" aria-pressed="'+(S.dev===d)+'">'+ICON_DEV[d]+DEV[d]+'</button>').join('')+'</div>';
    html+='<div id="rlist" class="rlist">'+recipeCards()+'</div>';
    return html;
  }
  function renderRecipe(id){
    const r=S.recipes[id];const p=plannedFor(id);
    const vars=(r.devices&&r.devices.variants)||{};
    S.method=S.method||{};
    let meth=S.method[id]||bestOf(r);if(meth!=='classique'&&!vars[meth])meth='classique';
    const v=meth==='classique'?null:vars[meth];
    const steps=v?v.steps:(r.steps||[]);
    let html='<button class="back" data-act="back">'+ICON_BACK+(S.kiosk?'Retour':S.from==='plan'?'Retour au planning':'Toutes les recettes')+'</button>';
    html+='<article class="recipe"><span class="eyebrow">'+esc(r.cuisine)+' · '+esc(r.moment)+'</span><h2 class="serif rh">'+esc(r.title)+'</h2>';
    const opts=['classique'].concat(['thermomix','airfryer'].filter(d=>vars[d]));
    if(opts.length>1){
      const lab=d=>d==='classique'?esc((r.devices&&r.devices.classicLabel)||'Classique'):ICON_DEV[d]+DEV[d];
      html+='<div class="methods" role="tablist" aria-label="Méthode">'+opts.map(d=>'<button class="meth'+(d===meth?' on':'')+'" role="tab" aria-selected="'+(d===meth)+'" data-act="meth" data-id="'+esc(id)+'" data-m="'+d+'">'+lab(d)+(d===bestOf(r)?'<small>conseillé</small>':'')+'</button>').join('')+'</div>';
    }
    html+='<button class="btn primary cookbtn" data-act="cook" data-id="'+esc(id)+'">'+ICON_PLAY+'Mode cuisine</button>';
    html+='<dl class="facts"><div><dt>Portions</dt><dd>'+esc(r.servings)+'</dd></div>'+(v?'<div><dt>Temps total</dt><dd>'+fmtMin(methodTime(r,meth))+'</dd></div><div><dt>Méthode</dt><dd>'+DEV[meth]+'</dd></div>':'<div><dt>Préparation</dt><dd>'+esc(r.prep)+' min</dd></div><div><dt>Cuisson</dt><dd>'+(r.cook?esc(r.cook)+' min':'aucune')+'</dd></div>')+'<div><dt>Niveau</dt><dd>'+esc(r.difficulty)+'</dd></div></dl>';
    if(r.adapt&&r.adapt.length)html+='<section class="adapt"><h3 class="serif">Pour cette fois</h3><ul>'+r.adapt.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></section>';
    if(p.length)html+='<p class="planned">Au planning : '+p.map(x=>esc(x.day.toLowerCase())+' '+fmt(x.date)+' '+(x.slot==='midi'?'midi':'soir')).join(', ')+'</p>';
    html+='<div class="rgrid"><section><h3 class="serif">Ingrédients</h3>';
    const groups=[];(r.ingredients||[]).forEach(i=>{const g=i.group||'';let gr=groups.find(x=>x.g===g);if(!gr){gr={g,items:[]};groups.push(gr)}gr.items.push(i)});
    groups.forEach(gr=>{if(gr.g)html+='<div class="eyebrow ig">'+esc(gr.g)+'</div>';html+='<ul class="ing">'+gr.items.map(i=>'<li><span class="qty">'+esc(i.qty)+'</span><span>'+esc(i.item)+'</span></li>').join('')+'</ul>'});
    html+='</section><section><h3 class="serif">Étapes</h3><ol class="steps">'+steps.map((s,k)=>'<li><button class="step'+(S.stepsDone&&S.stepsDone[id+':'+meth+':'+k]?' done':'')+'" data-act="step" data-id="'+esc(id+':'+meth)+'" data-k="'+k+'"><span class="sn">'+(k+1)+'</span><span>'+esc(s)+'</span></button></li>').join('')+'</ol>';
    html+='<p class="hint small">Touche une étape pour la barrer pendant que tu cuisines.</p></section></div>';
    const tips=(v&&v.tips&&v.tips.length?v.tips:[]).concat(r.tips||[]);
    if(tips.length)html+='<section class="tips"><h3 class="serif">Astuces</h3><ul>'+tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></section>';
    if(r.leftovers)html+='<section class="tips left"><h3 class="serif">Pour les restes</h3><p>'+esc(r.leftovers)+'</p></section>';
    html+='</article>';
    return html;
  }
  function openRecipe(id,from){
    if(S.kiosk){S.recipeId=id;S.from='kiosk';render();window.scrollTo({top:0});return}
    return openRecipeFull(id,from)}
  function openRecipeFull(id,from){S.from=from||S.tab;S.tab='recettes';S.recipeId=id;store('tab','recettes');render();window.scrollTo({top:0})}

  // ---- collations
  function listTexts(){const out=[];listsForMonth().forEach(l=>l.sections.forEach(s=>s.items.forEach(i=>out.push(norm(i.text)))));return out}
  function ingStatus(i,texts){if(i.home)return 'home';if(i.match&&texts.some(t=>t.includes(norm(i.match))))return 'have';return 'missing'}
  function snackReady(s,texts){return s.ingredients.every(i=>i.optional||ingStatus(i,texts)!=='missing')}
  function renderSnacks(){
    const all=S.snacks||[];
    if(!all.length)return '<p class="empty">Pas encore d\'idées de collations. Demande à Claude d\'en ajouter.</p>';
    const texts=listTexts();
    const ready=all.filter(s=>snackReady(s,texts)).length;
    let html='<div class="snack-sum"><span class="hand">'+ready+' idées sur '+all.length+'</span><span>faisables avec ce que tu as à la maison et ta liste de courses.</span></div>';
    const f=[['','Toutes'],['Salé','Salé'],['Sucré','Sucré'],['ahead','À préparer le dimanche']];
    html+='<div class="chips-row" role="group" aria-label="Type">'+f.map(([v,l])=>'<button class="mchip" data-act="stype" data-id="'+v+'" aria-pressed="'+(S.snackType===v)+'">'+l+'</button>').join('')+
      '<button class="mchip now" data-act="snow" aria-pressed="'+S.snackNow+'">Faisables maintenant</button></div>';
    const list=all.filter(s=>(!S.snackType||(S.snackType==='ahead'?s.ahead:s.type===S.snackType))&&(!S.snackNow||snackReady(s,texts)))
      .sort((a,b)=>(snackReady(b,texts)-snackReady(a,texts))||a.time-b.time);
    if(!list.length)return html+'<p class="empty">Aucune idée pour ce filtre.</p>';
    html+='<div class="snacks">'+list.map(s=>{
      const ok=snackReady(s,texts);
      const missing=s.ingredients.filter(i=>!i.optional&&ingStatus(i,texts)==='missing'&&i.buy);
      const buys=[...new Set(missing.map(i=>i.buy))];
      return '<article class="snack'+(ok?' ok':'')+'"><div class="snack-head"><h3 class="display">'+esc(s.title)+'</h3><span class="tag '+(s.type==='Sucré'?'t-sweet':'t-salt')+'">'+esc(s.type)+'</span></div>'+
        '<div class="snack-meta">'+esc(s.time)+' min'+(s.ahead?' · à préparer à l\'avance':'')+' · '+(ok?'<b class="okc">prête avec tes courses</b>':'<b class="noc">il manque '+missing.length+' ingrédient'+(missing.length>1?'s':'')+'</b>')+'</div>'+
        '<ul class="sing">'+s.ingredients.map(i=>{const st=ingStatus(i,texts);return '<li class="'+st+'"><span class="dot" aria-hidden="true"></span><span>'+esc(i.name)+(i.optional?' <em>(facultatif)</em>':'')+'</span><small>'+(st==='have'?'sur ta liste':st==='home'?'à la maison':'à acheter')+'</small></li>'}).join('')+'</ul>'+
        '<ol class="ssteps">'+s.steps.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>'+
        (s.tip?'<p class="stip">'+esc(s.tip)+'</p>':'')+
        (buys.length&&!S.readOnly&&pickList()?'<button class="btn primary sm" data-act="snackbuy" data-id="'+esc(s.id)+'">Ajouter '+(buys.length>1?'les '+buys.length+' ingrédients':'l\'ingrédient')+' à la liste</button>':'')+
      '</article>'}).join('')+'</div>';
    return html;
  }
  function addSnackToList(id){
    const s=(S.snacks||[]).find(x=>x.id===id);const l=pickList();if(!s||!l)return;
    const texts=listTexts();
    const buys=[...new Set(s.ingredients.filter(i=>!i.optional&&ingStatus(i,texts)==='missing'&&i.buy).map(i=>i.buy))];
    if(!buys.length)return;
    const sections=clone(l.sections);
    let sec=sections.find(x=>x.title==='Collations');
    if(!sec){sec={title:'Collations',sub:'ajouté depuis l\'onglet Collations',items:[]};sections.push(sec)}
    const have=new Set(sections.flatMap(x=>x.items.map(i=>norm(i.text))));
    buys.forEach(b=>{if(!have.has(norm(b)))sec.items.push({id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),text:b,done:false,added:true})});
    l.sections=sections;queue('courses/'+S.listId,{sections});render();
    toast(buys.length>1?buys.length+' ingrédients ajoutés à la liste':'Ajouté à la liste');
  }

  // ---- Aujourd'hui
  function findDay(m,date){if(!m)return null;for(let wi=0;wi<m.weeks.length;wi++){const ds=m.weeks[wi].days;for(let di=0;di<ds.length;di++)if(ds[di].date===date)return {wi,di,d:ds[di]}}return null}
  function thawNote(r){
    if(!r)return '';
    const first=(r.steps&&r.steps[0])||'';
    if(/^la veille/i.test(first))return first;
    const frozen=(r.ingredients||[]).filter(i=>/congel|cong[ée]lateur|surgel/i.test(i.item||''));
    if(frozen.length)return 'Sors du congélateur et mets au frigo : '+frozen.map(i=>(i.qty?i.qty+' ':'')+i.item.replace(/\s*\(.*?\)\s*/g,' ').trim()).join(', ')+'.';
    return '';
  }
  function bigMeal(f,slot){
    const x=f.d[slot]||{};const key='data-w="'+f.wi+'" data-d="'+f.di+'" data-slot="'+slot+'"';
    const label=slot==='midi'?'Midi':'Soir';
    if(x.off)return '<article class="bigmeal off"><span class="mlabel '+slot+'">'+label+'</span><p class="bm-name">'+(x.off==='site'?'Sur site, pas de repas à prévoir':'Commande à emporter')+'</p></article>';
    const r=x.recipeId&&S.recipes[x.recipeId];
    let html='<article class="bigmeal'+(x.rating===1?' done':x.rating===-1?' nope':'')+'"><span class="mlabel '+slot+'">'+label+'</span>';
    html+=r?'<button class="bm-name link" data-act="recipe" data-id="'+esc(x.recipeId)+'">'+esc(x.name||r.title)+'</button>':'<p class="bm-name">'+esc(x.name||'—')+'</p>';
    if(r)html+='<p class="bm-meta">'+totalTime(r)+(bestOf(r)!=='classique'?' · '+DEV[bestOf(r)]:'')+(x.leftover?' · restes à réchauffer':'')+'</p>';
    html+='<div class="bm-actions">';
    if(r&&!x.leftover)html+='<button class="btn primary" data-act="cook" data-id="'+esc(x.recipeId)+'">'+ICON_PLAY+'Cuisiner</button>';
    if(!S.readOnly)html+='<button class="btn'+(x.rating===1?' on-good':'')+'" data-act="rate" data-v="1" '+key+' aria-pressed="'+(x.rating===1)+'">'+ICON_UP+'Fait</button><button class="btn'+(x.rating===-1?' on-bad':'')+'" data-act="rate" data-v="-1" '+key+' aria-pressed="'+(x.rating===-1)+'">'+ICON_DOWN+'Pas envie</button>';
    html+='</div></article>';
    return html;
  }
  function renderToday(m){
    if(!m)return '<p class="empty">Aucun planning pour l\'instant. Demande à Claude de préparer le mois.</p>';
    let html='';
    const t=findDay(m,TODAY);
    if(t){
      html+='<section class="tsec"><h2 class="display th">Aujourd\'hui <small>'+esc(t.d.day.toLowerCase())+' '+fmt(t.d.date)+'</small></h2><div class="bigmeals">'+bigMeal(t,'midi')+bigMeal(t,'soir')+'</div></section>';
    }
    const tm=findDay(m,TOMORROW_G);
    if(tm){
      const thaws=['midi','soir'].map(sl=>{const x=tm.d[sl]||{};const r=x.recipeId&&S.recipes[x.recipeId];const n=(!x.off&&!x.leftover)?thawNote(r):'';return n?{sl,x,n}:null}).filter(Boolean);
      if(thaws.length)html+='<section class="thaw"><h3 class="serif">'+ICON_SNOW+'À faire ce soir pour demain</h3><ul>'+thaws.map(o=>'<li><b>'+esc(o.x.name)+'</b> (demain '+o.sl+') : '+esc(o.n.replace(/^la veille( au soir)?,?\s*/i,''))+'</li>').join('')+'</ul></section>';
      const lab=x=>!x?'—':x.off==='site'?'Sur site':x.off==='commande'?'Commande':x.name;
      html+='<section class="tomorrow"><div class="eyebrow">Demain · '+esc(tm.d.day.toLowerCase())+' '+fmt(tm.d.date)+'</div><div class="tc-row"><span class="slot midi">Midi</span><span>'+esc(lab(tm.d.midi))+'</span></div><div class="tc-row"><span class="slot soir">Soir</span><span>'+esc(lab(tm.d.soir))+'</span></div></section>';
    }
    // catch-up: past unmarked meals
    const late=[];
    m.weeks.forEach((w,wi)=>w.days.forEach((d,di)=>{if(d.date>=TODAY||d.date<m.start)return;['midi','soir'].forEach(sl=>{const x=d[sl]||{};if(!x.off&&x.name&&!x.rating&&!x.skipped)late.push({wi,di,sl,d,x})})}));
    if(late.length&&!S.readOnly){
      const show=late.slice(-8).reverse();
      html+='<section class="catchup"><h3 class="serif">Repas passés à cocher <span class="count">'+late.length+'</span></h3><p class="hint small">Dis-moi ce qui s\'est vraiment passé : ça garde le frigo et le planning justes.</p><ul>'+show.map(o=>{const key='data-w="'+o.wi+'" data-d="'+o.di+'" data-slot="'+o.sl+'"';return '<li><div><b>'+esc(o.x.name)+'</b><small>'+esc(o.d.day.toLowerCase())+' '+fmt(o.d.date)+' · '+o.sl+'</small></div><div class="cu-btns"><button class="btn sm" data-act="rate" data-v="1" '+key+'>Fait</button><button class="btn sm" data-act="skip" '+key+'>Pas fait</button><button class="btn sm" data-act="rate" data-v="-1" '+key+'>Pas envie</button></div></li>'}).join('')+'</ul></section>';
    }
    return html;
  }

  // ---- Frigo
  const STOCK_SECTIONS=[['fresh','Frigo','Légumes, fruits, frais'],['freezer','Congélateur','Viandes, poissons, surgelés'],['pantry','Placard','Féculents, conserves, épices']];
  function renderFrigo(){
    const st=S.stock||{};
    let html='<p class="hint">Touche la croix quand un produit est fini, ajoute ce que tu achètes. Claude s\'en sert pour te proposer les prochains repas.</p><div class="frigo">';
    STOCK_SECTIONS.forEach(([k,t,sub])=>{
      const arr=st[k]||[];
      html+='<section class="fsec"><h2 class="serif">'+t+' <small>'+arr.length+'</small></h2><p class="sub">'+sub+'</p><ul class="fitems">'+arr.map((x,i)=>'<li><span>'+esc(x)+'</span>'+(S.readOnly?'':'<button class="fdel" data-act="stockdel" data-k="'+k+'" data-i="'+i+'" aria-label="Retirer '+esc(x)+'">'+ICON_X+'</button>')+'</li>').join('')+(arr.length?'':'<li class="empty">Vide</li>')+'</ul>';
      if(!S.readOnly)html+='<form class="add stockadd" data-k="'+k+'"><input type="text" id="stock-'+k+'" placeholder="Ajouter (ex. 2 courgettes)" aria-label="Ajouter au '+t.toLowerCase()+'"><button class="btn primary" type="submit">Ajouter</button></form>';
      html+='</section>';
    });
    html+='</div>';
    const l=pickList();
    if(l&&!S.readOnly){const n=l.sections.reduce((a,s)=>a+s.items.filter(i=>i.done&&!i.stored).length,0);if(n)html+='<div class="note store"><span><b>'+n+' article'+(n>1?'s':'')+'</b> coché'+(n>1?'s':'')+' dans ta liste de courses ne '+(n>1?'sont':'est')+' pas encore rangé'+(n>1?'s':'')+' ici.</span><button class="btn primary" data-act="storeall">Ranger mes courses</button></div>';}
    return html;
  }
  function guessSection(t){const n=norm(t);
    if(/surgel|congel|poulet|dinde|boeuf|agneau|steak|hache|saumon|cabillaud|merlu|dorade|poisson|crevette|maquereau|encornet|calamar/.test(n))return 'freezer';
    if(/boite|conserve|riz|pate|semoule|boulgour|quinoa|lentille|farine|chapelure|panko|epice|cumin|paprika|curcuma|huile|vinaigre|sauce|moutarde|miel|sucre|levure|noix|amande|cacahuete|nouille|tortilla|origan|thym|cannelle|harissa|capre|cornichon|olive|concentre|lait de coco|feuilles de brick|mayonnaise|sriracha/.test(n))return 'pantry';
    return 'fresh'}
  function saveStock(k){queue('settings/stock',{[k]:S.stock[k]})}

  // ---- Mode cuisine
  function cookSteps(id){const r=S.recipes[id];const vars=(r.devices&&r.devices.variants)||{};let meth=(S.method&&S.method[id])||bestOf(r);if(meth!=='classique'&&!vars[meth])meth='classique';const v=meth==='classique'?null:vars[meth];return {r,meth,steps:v?v.steps:(r.steps||[])}}
  function stepMinutes(s){const m=s.match(/(\d+)\s*(?:à|-)\s*(\d+)\s*min/i)||s.match(/(\d+)\s*min/i);if(!m)return 0;return +(m[2]||m[1])}
  function renderCook(){
    const {r,meth,steps}=cookSteps(S.cook.id);const i=Math.min(S.cook.i,steps.length-1);const s=steps[i]||'';
    const mins=stepMinutes(s);
    let html='<div class="cook"><header class="ck-top"><button class="btn" data-act="cookclose">'+ICON_X+'Fermer</button><div class="ck-title"><span class="eyebrow">'+(meth==='classique'?'Mode cuisine':DEV[meth])+'</span><b>'+esc(r.title)+'</b></div></header>';
    html+='<div class="ck-progress" aria-hidden="true">'+steps.map((_,k)=>'<span class="'+(k<i?'past':k===i?'cur':'')+'"></span>').join('')+'</div>';
    html+='<p class="ck-count">Étape '+(i+1)+' sur '+steps.length+'</p><p class="ck-step">'+esc(s)+'</p>';
    if(mins)html+='<button class="btn timerbtn" data-act="timer" data-min="'+mins+'" data-label="Étape '+(i+1)+'">'+ICON_PLAY+'Lancer un minuteur de '+mins+' min</button>';
    if(S.timers.length)html+='<div class="ck-timers">'+S.timers.map(t=>'<div class="tmr'+(t.done?' done':'')+'" data-tid="'+t.id+'"><span>'+esc(t.label)+'</span><b class="tmr-v">'+fmtLeft(t)+'</b><button class="fdel" data-act="timerdel" data-id="'+t.id+'" aria-label="Arrêter">'+ICON_X+'</button></div>').join('')+'</div>';
    html+='<details class="ck-ing"><summary>Ingrédients</summary><ul>'+(r.ingredients||[]).map(x=>'<li><b>'+esc(x.qty||'')+'</b> '+esc(x.item)+'</li>').join('')+'</ul></details>';
    html+='<nav class="ck-nav"><button class="btn big" data-act="cookprev"'+(i===0?' disabled':'')+'>Précédent</button>'+(i<steps.length-1?'<button class="btn primary big" data-act="cooknext">Suivant</button>':'<button class="btn primary big" data-act="cookdone">Terminé</button>')+'</nav></div>';
    return html;
  }
  function fmtLeft(t){if(t.done)return 'Terminé';const ms=Math.max(0,t.end-Date.now());const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
  let tick=null;
  function startTick(){if(tick)return;tick=setInterval(()=>{let any=false;S.timers.forEach(t=>{if(t.done)return;any=true;if(Date.now()>=t.end){t.done=true;ring(t)}const el=document.querySelector('.tmr[data-tid="'+t.id+'"] .tmr-v');if(el)el.textContent=fmtLeft(t);if(t.done){const box=document.querySelector('.tmr[data-tid="'+t.id+'"]');if(box)box.classList.add('done')}});if(!any){clearInterval(tick);tick=null}},500)}
  let actx=null;
  function ring(t){toast('Minuteur terminé : '+t.label);try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}
    try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();[0,0.35,0.7].forEach(o=>{const g=actx.createGain(),osc=actx.createOscillator();osc.frequency.value=880;osc.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(0.0001,actx.currentTime+o);g.gain.exponentialRampToValueAtTime(0.3,actx.currentTime+o+0.02);g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+o+0.3);osc.start(actx.currentTime+o);osc.stop(actx.currentTime+o+0.32)})}catch(e){}}
  let wake=null;
  async function lockScreen(){try{if('wakeLock' in navigator)wake=await navigator.wakeLock.request('screen')}catch(e){wake=null}}
  function unlockScreen(){try{wake&&wake.release()}catch(e){}wake=null}
  document.addEventListener('visibilitychange',()=>{if(S.cook&&document.visibilityState==='visible')lockScreen()});

  // ---- Mode tablette (écran de cuisine)
  const MOIS_LONG=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const JOURS_FR=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  function clockText(){const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
  function renderKiosk(m){
    const d=new Date();
    let html='<div class="kiosk"><header class="k-head"><div><span class="eyebrow">Mon carnet de cuisine</span><h1 class="display k-date">'+(function(j){return j.charAt(0).toUpperCase()+j.slice(1)})(JOURS_FR[d.getDay()])+' '+d.getDate()+' '+MOIS_LONG[d.getMonth()]+'</h1></div><div class="k-clock" id="k-clock">'+clockText()+'</div></header>';
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

  // ---- actions
  function setMeal(wi,di,slot,patch){
    const m=S.months[S.monthId];if(!m)return;
    const weeks=clone(m.weeks);
    weeks[wi].days[di][slot]=Object.assign({name:'',rating:0},weeks[wi].days[di][slot],patch);
    if(patch.off===null)delete weeks[wi].days[di][slot].off;
    if(patch.skipped===null)delete weeks[wi].days[di][slot].skipped;
    ['recipeId','leftover'].forEach(k=>{if(patch[k]===null)delete weeks[wi].days[di][slot][k]});
    m.weeks=weeks;
    queue('months/'+S.monthId,{weeks});
  }
  function swapMeals(a,b){
    S.swap=null;
    if(!a||!b||(a.w===b.w&&a.d===b.d&&a.slot===b.slot)){render();return}
    const m=S.months[S.monthId];if(!m){render();return}
    const weeks=clone(m.weeks);
    const A=weeks[a.w].days[a.d],B=weeks[b.w].days[b.d];
    const tmp=A[a.slot];A[a.slot]=B[b.slot];B[b.slot]=tmp;
    m.weeks=weeks;queue('months/'+S.monthId,{weeks});render();
    toast('Repas échangés : '+B.day.toLowerCase()+' '+(b.slot==='midi'?'midi':'soir')+' ↔ '+A.day.toLowerCase()+' '+(a.slot==='midi'?'midi':'soir'));
  }
  function saveEdit(ta){
    if(!S.editing)return;
    const {w,d,slot}=S.editing;S.editing=null;
    const v=ta.value.trim();
    const cur=S.months[S.monthId].weeks[w].days[d][slot]||{};
    if(v&&(v!==cur.name||cur.off))setMeal(w,d,slot,{name:v,rating:0,off:null,recipeId:null,leftover:null});
    S.dirty=false;render();
  }
  app.addEventListener('click',e=>{
    const b=e.target.closest('[data-act]');if(!b||b.tagName==='INPUT')return;
    const act=b.dataset.act;
    if(act==='tab'){S.tab=b.dataset.id;S.recipeId=null;S.swap=null;S.menu=null;store('tab',S.tab);S.confirmReset=false;render();window.scrollTo({top:0});return}
    if(act==='recipe'){openRecipe(b.dataset.id,S.tab==='recettes'?'recettes':S.tab);return}
    if(act==='back'&&S.kiosk){S.recipeId=null;render();window.scrollTo({top:0});return}
    if(act==='back'){const f=S.from;S.recipeId=null;if(f&&f!=='recettes'){S.tab=f;store('tab',f)}render();window.scrollTo({top:0});return}
    if(act==='cuisine'){S.cuisine=b.dataset.id;render();return}
    if(act==='dev'){S.dev=S.dev===b.dataset.id?'':b.dataset.id;render();return}
    if(act==='meth'){S.method=S.method||{};S.method[b.dataset.id]=b.dataset.m;render();return}
    if(act==='stype'){S.snackType=b.dataset.id;render();return}
    if(act==='snow'){S.snackNow=!S.snackNow;render();return}
    if(act==='step'){S.stepsDone=S.stepsDone||{};const k=b.dataset.id+':'+b.dataset.k;S.stepsDone[k]=!S.stepsDone[k];b.classList.toggle('done',S.stepsDone[k]);return}
    if(act==='month'){S.monthId=b.dataset.id;store('month',S.monthId);S.listId=null;render();return}
    if(act==='list'){S.listId=b.dataset.id;store('list',S.listId);S.confirmReset=false;render();return}
    if(S.readOnly)return;
    if(act==='cook'){S.cook={id:b.dataset.id,i:0};try{actx=actx||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}lockScreen();render();window.scrollTo({top:0});return}
    if(act==='cookclose'||act==='cookdone'){S.cook=null;unlockScreen();render();if(act==='cookdone')toast('Bon appétit !');return}
    if(act==='cooknext'){S.cook.i++;render();window.scrollTo({top:0});return}
    if(act==='cookprev'){S.cook.i=Math.max(0,S.cook.i-1);render();window.scrollTo({top:0});return}
    if(act==='timer'){S.timers.push({id:'t'+Date.now(),label:b.dataset.label+' · '+S.recipes[S.cook.id].title,end:Date.now()+(+b.dataset.min)*60000,done:false});startTick();render();return}
    if(act==='timerdel'){S.timers=S.timers.filter(t=>t.id!==b.dataset.id);render();return}
    if(act==='menu'){const k={w:+b.dataset.w,d:+b.dataset.d,slot:b.dataset.slot};S.menu=(S.menu&&S.menu.w===k.w&&S.menu.d===k.d&&S.menu.slot===k.slot)?null:k;render();return}
    if(act==='swap'){S.swap={w:+b.dataset.w,d:+b.dataset.d,slot:b.dataset.slot};S.menu=null;render();return}
    if(act==='swapcancel'){S.swap=null;render();return}
    if(act==='swapto'){swapMeals(S.swap,{w:+b.dataset.w,d:+b.dataset.d,slot:b.dataset.slot});return}
    if(act==='edit'){S.editing={w:+b.dataset.w,d:+b.dataset.d,slot:b.dataset.slot};S.menu=null;render();return}
    if(act==='save'){const ta=document.getElementById('edit-meal');if(ta)saveEdit(ta);return}
    if(act==='cancel'){S.editing=null;S.dirty=false;render();return}
    if(act==='off'){const wi=+b.dataset.w,di=+b.dataset.d,slot=b.dataset.slot;S.editing=null;S.menu=null;S.dirty=false;setMeal(wi,di,slot,{name:'',rating:0,off:b.dataset.v,recipeId:null,leftover:null});render();return}
    if(act==='rate'){
      const wi=+b.dataset.w,di=+b.dataset.d,slot=b.dataset.slot,v=+b.dataset.v;
      const cur=S.months[S.monthId].weeks[wi].days[di][slot];
      setMeal(wi,di,slot,{rating:cur&&cur.rating===v?0:v,skipped:null});render();return;
    }
    if(act==='snackbuy'){addSnackToList(b.dataset.id);return}
    if(act==='skip'){setMeal(+b.dataset.w,+b.dataset.d,b.dataset.slot,{skipped:true});render();toast('Noté : pas fait');return}
    if(act==='stockdel'){const k=b.dataset.k;S.stock=Object.assign({},S.stock);S.stock[k]=(S.stock[k]||[]).filter((_,i)=>i!==+b.dataset.i);saveStock(k);render();return}
    if(act==='storeall'){const l=S.lists[S.listId];if(!l)return;S.stock=Object.assign({fresh:[],freezer:[],pantry:[]},S.stock);const sections=clone(l.sections);const touched=new Set();let n=0;
      sections.forEach(s=>s.items.forEach(i=>{if(i.done&&!i.stored){const name=i.text.replace(/\s*·.*$/,'').replace(/\s*\(.*?\)\s*/g,' ').trim();const k=guessSection(name);S.stock[k]=(S.stock[k]||[]).concat(name);touched.add(k);i.stored=true;n++}}));
      touched.forEach(saveStock);l.sections=sections;queue('courses/'+S.listId,{sections});render();toast(n+' article'+(n>1?'s':'')+' rangé'+(n>1?'s':''));return}
    if(act==='askreset'){S.confirmReset=true;render();return}
    if(act==='cancelreset'){S.confirmReset=false;render();return}
    if(act==='reset'){const l=S.lists[S.listId];const sections=clone(l.sections);sections.forEach(s=>s.items.forEach(i=>i.done=false));l.sections=sections;S.confirmReset=false;queue('courses/'+S.listId,{sections});render();toast('Liste remise à zéro');return}
    if(act==='del'){const l=S.lists[S.listId];const sections=clone(l.sections);const s=sections[+b.dataset.s];s.items=s.items.filter(i=>i.id!==b.dataset.i);l.sections=sections;queue('courses/'+S.listId,{sections});render();return}
  });
  app.addEventListener('change',e=>{
    const c=e.target;if(c.dataset.act!=='check'||S.readOnly)return;
    const l=S.lists[S.listId];const sections=clone(l.sections);
    const it=sections[+c.dataset.s].items.find(i=>i.id===c.dataset.i);if(!it)return;
    it.done=c.checked;l.sections=sections;queue('courses/'+S.listId,{sections});render();
  });
  app.addEventListener('submit',e=>{
    const sf=e.target.closest('form.stockadd');
    if(sf){e.preventDefault();const inp=sf.querySelector('input');const v=inp.value.trim();if(!v)return;const k=sf.dataset.k;S.stock=Object.assign({},S.stock);S.stock[k]=(S.stock[k]||[]).concat(v);saveStock(k);inp.value='';S.dirty=false;render();const again=document.getElementById('stock-'+k);if(again)again.focus();return}
    const f=e.target.closest('form.add');if(!f)return;e.preventDefault();
    const inp=f.querySelector('input');const v=inp.value.trim();if(!v)return;
    const l=S.lists[S.listId];const sections=clone(l.sections);
    sections[+f.dataset.s].items.push({id:'a'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),text:v,done:false,added:true});
    l.sections=sections;queue('courses/'+S.listId,{sections});inp.value='';S.dirty=false;render();
    const again=document.getElementById(inp.id);if(again)again.focus();
  });
  app.addEventListener('input',e=>{
    if(e.target.id!=='recipe-q')return;
    S.q=e.target.value;const l=document.getElementById('rlist');if(l)l.innerHTML=recipeCards();
  });
  document.addEventListener('keydown',e=>{
    if(!S.cook||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    const n=cookSteps(S.cook.id).steps.length;
    if(e.key==='ArrowRight'&&S.cook.i<n-1){S.cook.i++;render()}
    if(e.key==='ArrowLeft'&&S.cook.i>0){S.cook.i--;render()}
    if(e.key==='Escape'){S.cook=null;unlockScreen();render()}
  });
  app.addEventListener('keydown',e=>{
    if(e.target.id!=='edit-meal')return;
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();saveEdit(e.target)}
    if(e.key==='Escape'){S.editing=null;S.dirty=false;render()}
  });

  // ---- data
  function start(){
    const c=window.claude;
    if(!c||typeof c.use!=='function'){S.status='unavailable';render();return}
    c.use('db').then(d=>{
      if(!d){S.status='unavailable';render();return}
      db=d;let got=0;const ready=()=>{if(++got>=2&&S.status==='loading'){S.status='ok';render()}};
      const onErr=()=>{if(S.status==='loading'){S.status='unavailable';render()}};
      db.collection('months').onSnapshot(snap=>{
        const next={};snap.docs.forEach(doc=>{const p=pending['months/'+doc.id];next[doc.id]=p&&S.months[doc.id]?S.months[doc.id]:clone(doc.data())});
        S.months=next;if(S.status==='loading')ready();else requestRender();
      },onErr);
      db.collection('courses').onSnapshot(snap=>{
        const next={};snap.docs.forEach(doc=>{const p=pending['courses/'+doc.id];next[doc.id]=p&&S.lists[doc.id]?S.lists[doc.id]:clone(doc.data())});
        S.lists=next;if(S.status==='loading')ready();else requestRender();
      },onErr);
      db.doc('settings/snacks').onSnapshot(s=>{S.snacks=s.exists&&Array.isArray(s.data().items)?s.data().items:[];if(S.status!=='loading')requestRender()},()=>{});
      db.doc('settings/stock').onSnapshot(s=>{S.stock=s.exists?s.data():null;if(S.status!=='loading')requestRender()},()=>{});
      db.doc('settings/prefs').onSnapshot(s=>{S.prefs=s.exists?clone(s.data()):null;if(S.status!=='loading')requestRender()},()=>{});
      db.collection('recipes').onSnapshot(snap=>{const next={};snap.docs.forEach(doc=>{next[doc.id]=doc.data()});S.recipes=next;if(S.status!=='loading')requestRender()},()=>{});
    },()=>{S.status='unavailable';render()});
  }
  render();start();
})();
