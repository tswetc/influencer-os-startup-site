// Influencer OS V2 runtime — small, dependency-free. Content is never hidden by default:
// the .rv reveal classes are only *activated* by this script adding .js to <html>, and
// every activation path also runs the reveal immediately if IO is unavailable.
(function(){
  'use strict';
  var d=document, w=window;
  d.documentElement.classList.add('js');

  /* header sheet (mobile index) */
  var sheetBtn=d.querySelector('.sheet-btn');
  if(sheetBtn){
    sheetBtn.addEventListener('click',function(){
      var open=d.documentElement.classList.toggle('sheet-open');
      sheetBtn.setAttribute('aria-expanded',open?'true':'false');
      sheetBtn.textContent=open?(sheetBtn.dataset.close||'Close'):(sheetBtn.dataset.menu||sheetBtn.textContent);
    });
    d.addEventListener('keydown',function(e){ if(e.key==='Escape'&&d.documentElement.classList.contains('sheet-open')){ d.documentElement.classList.remove('sheet-open'); sheetBtn.setAttribute('aria-expanded','false'); sheetBtn.textContent=sheetBtn.dataset.menu||sheetBtn.textContent; sheetBtn.focus(); } });
  }

  /* theme toggle (pre-paint boot lives inline in <head>) */
  var tbtn=d.querySelector('.theme-btn');
  if(tbtn){
    var setLabel=function(){ var tl=tbtn.dataset.tl, td=tbtn.dataset.td; tbtn.setAttribute('aria-label', d.documentElement.dataset.theme==='dark'?(td||'Switch to dark theme'):(tl||'Switch to light theme')); };
    setLabel();
    tbtn.addEventListener('click',function(){
      var next=d.documentElement.dataset.theme==='dark'?'light':'dark';
      d.documentElement.dataset.theme=next;
      try{localStorage.setItem('ios2-theme',next);}catch(e){}
      var meta=d.querySelector('meta[name="theme-color"]');
      if(meta) meta.setAttribute('content', next==='dark'?'#0C0C0C':'#FFFFFF');
      setLabel();
    });
  }

  /* reveal-on-view: IO is the enhancement, never a gate. Safety net: force-reveal after 1.4s. */
  var rvs=[].slice.call(d.querySelectorAll('.rv'));
  if(rvs.length){
    var reduce=false;
    try{ reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    var revealAll=function(){ rvs.forEach(function(el){ el.classList.add('on'); }); };
    if(reduce||!('IntersectionObserver' in w)){
      revealAll();
    }else{
      var io=new IntersectionObserver(function(es){
        es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('on'); io.unobserve(en.target); } });
      },{threshold:.12,rootMargin:'0px 0px -4% 0px'});
      rvs.forEach(function(el){ io.observe(el); });
      setTimeout(function(){
        var left=rvs.filter(function(el){ return !el.classList.contains('on'); });
        // anything still unrevealed that sits above the fold or failed IO gets revealed;
        // below-fold items stay pending until scrolled (IO will catch them).
        left.forEach(function(el){
          var r=el.getBoundingClientRect();
          if(r.top < w.innerHeight) el.classList.add('on');
        });
      },1400);
    }
  }

  /* video management: mute-safe autoplay, pause offscreen, reduced-motion respect */
  var vids=[].slice.call(d.querySelectorAll('video[data-io]'));
  if(vids.length){
    var rreduce=false;
    try{ rreduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    if(rreduce){
      vids.forEach(function(v){ v.removeAttribute('autoplay'); v.pause&&v.pause(); });
    } else if('IntersectionObserver' in w){
      var vio=new IntersectionObserver(function(es){
        es.forEach(function(en){
          var v=en.target;
          if(en.isIntersecting){ var p=v.play(); if(p&&p.catch)p.catch(function(){}); }
          else { v.pause(); }
        });
      },{threshold:.25});
      vids.forEach(function(v){ vio.observe(v); });
    }
  }

  /* engine switchboard */
  var sw=d.querySelector('[data-switch]');
  if(sw){
    var tabs=[].slice.call(sw.querySelectorAll('.sw-tab'));
    var select=function(tab){
      tabs.forEach(function(x){
        var on=x===tab;
        x.setAttribute('aria-selected',on?'true':'false');
        x.tabIndex=on?0:-1;
        var p=d.getElementById(x.getAttribute('aria-controls'));
        if(p){ p.classList.toggle('on',on); if(on){p.removeAttribute('hidden');} else {p.setAttribute('hidden','');} }
      });
    };
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){ select(t); });
      t.addEventListener('keydown',function(e){
        var dir=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;
        if(!dir)return;
        e.preventDefault();
        var n=tabs[(i+dir+tabs.length)%tabs.length];
        select(n); n.focus();
      });
    });
  }

  /* demo console: truthful assembly over the product's PUBLIC demo data (June) */
  var con=d.querySelector('[data-console]');
  if(con){
    var C=window.IOS2_CONSOLE;
    var state={world:'diary',scene:C.scenes[0],engine:'NANO',anom:{tooth:true,scar:true,dimple:true,moles:true}};
    var readout=con.querySelector('.readout'), wc=con.querySelector('[data-wc]');
    var engineName=con.querySelector('[data-engine-name]');
    var strengthEl=con.querySelector('[data-strength]'), gapsEl=con.querySelector('[data-gaps]'), glyphsEl=con.querySelector('[data-strength-glyphs]');
    function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;');}
    function render(){
      var parts=[];
      parts.push('WORLD: '+C.worldNames[state.world]);
      parts.push(C.worldPre[state.world]);
      parts.push(C.identity);
      parts.push(C.sceneBody[state.scene]);
      parts.push(C.technique[state.world]);
      var on=(C.anomalies||[]).filter(function(a){return state.anom[a.id];});
      if(on.length>0){
        parts.push('ANOMALY ANCHOR: '+on.map(function(a){return a.phrase;}).join('. ')+'. '+C.anomalyTail);
      } else {
        parts.push(C.anomalyEmpty);
      }
      if(state.engine==='KLING') parts.push(C.motion);
      parts.push('TECHNICAL: '+C.worldTech[state.world]);
      var txt=parts.join('\n');
      readout.innerHTML=txt.split('\n').map(function(line){
        var key=line.split(':')[0];
        if(C.keys.indexOf(key)>-1){ return '<b>'+esc(key)+':</b>'+esc(line.slice(key.length+1)); }
        return esc(line);
      }).join('\n');
      var wcN=txt.split(/\s+/).filter(Boolean).length;
      wc.textContent=wcN;
      var wcWord=con.querySelector('[data-wc-word]');
      if(wcWord&&C.wordForms){
        var m10=wcN%10,m100=wcN%100;
        wcWord.textContent=C.wordForms[(m10===1&&m100!==11)?0:(m10>=2&&m10<=4&&(m100<12||m100>14))?1:2];
      }
      engineName.textContent=C.engineNames[state.engine];
      /* demo strength readout: mirrors the product's weighted model — identity,
         scene and camera are complete in the demo, so the anomaly anchors carry
         the visible weight (10 pts) and the gap list mirrors the meter. */
      var score=70+Math.round(on.length*10/C.anomalies.length);
      if(strengthEl) strengthEl.textContent=score;
      if(glyphsEl) glyphsEl.textContent='▮'.repeat(Math.round(score/10))+'▯'.repeat(10-Math.round(score/10));
      if(gapsEl) gapsEl.textContent=C.strengthGaps[C.anomalies.length-on.length]||'';
    }
    con.addEventListener('click',function(e){
      var btn=e.target.closest('.chip'); if(!btn||btn.disabled) return;
      var group=btn.getAttribute('data-group');
      if(group==='anom'){
        var id=btn.dataset.anom, on=btn.getAttribute('aria-pressed')==='true';
        state.anom[id]=!on;
        btn.setAttribute('aria-pressed', String(!on));
        render();
        return;
      }
      [].forEach.call(con.querySelectorAll('.chip[data-group="'+group+'"]'),function(c){c.setAttribute('aria-pressed','false');});
      btn.setAttribute('aria-pressed','true');
      if(group==='world') state.world=btn.dataset.world;
      if(group==='scene') state.scene=btn.dataset.scene;
      if(group==='engine') state.engine=btn.dataset.engine;
      render();
    });
    render();
  }
})();
