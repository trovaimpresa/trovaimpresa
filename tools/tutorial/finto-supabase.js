/* Finto Supabase per registrare i video tutorial: dati di esempio, niente rete. */
(function(){
  var UID='u-demo', OGGI=new Date(), d=function(n){var x=new Date(OGGI);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);};
  var T={
    imprese:[{id:1,user_id:UID,email:'demo@trovaimpresa.com',piano:'premium',premium_scadenza:'2030-01-01',premium_pagato:true,tipo:'impresa',
      nome_attivita:'Edil Rossi',nome:'Mario Rossi',telefono:'333 1234567',citta:'Rieti',provincia:'Rieti',regione:'Lazio',mestiere:'Muratore',
      gestionale_attivo:true,gestionale_scadenza:'2030-01-01',chat_pro:false,vetrina_attiva:true,descrizione:'Ristrutturazioni',partita_iva:'01234567890',logo:null,indirizzo:'Via Roma 1'}],
    gest_mestieri:[{id:'m1',user_id:UID,nome:'Ristrutturazioni',icona:'🏗️',colore:'#0a2a4d',ordine:1}],
    gest_azienda:[{user_id:UID,ragione_sociale:'Edil Rossi',piva:'01234567890',telefono_az:'333 1234567',indirizzo:'Via Roma 1',citta:'Rieti',cap:'02100',provincia:'RI',email:'demo@trovaimpresa.com'}],
    gest_clienti:[
      {id:'c1',user_id:UID,mestiere_id:'m1',nome:'Giulia Bianchi',telefono:'347 1112223',email:'giulia@esempio.it',indirizzo:'Via Garibaldi 12, Rieti',tipo:'privato',created_at:d(-40)},
      {id:'c2',user_id:UID,mestiere_id:'m1',nome:'Condominio Le Rose',telefono:'0746 200300',indirizzo:'Viale Maraini 8, Rieti',tipo:'condominio',created_at:d(-30)},
      {id:'c3',user_id:UID,mestiere_id:'m1',nome:'Luca Verdi',telefono:'340 5556667',indirizzo:'Via Cintia 4, Rieti',tipo:'privato',created_at:d(-12)},
      {id:'c4',user_id:UID,mestiere_id:'m1',nome:'Mario Neri',telefono:'339 0001112',tipo:'privato',created_at:d(-60),eliminato_il:d(-2)+'T10:00:00Z'}],
    gest_operatori:[
      {id:'o1',user_id:UID,mestiere_id:'m1',nome:'Wahid',telefono:'333 2223334',mansione:'Muratore',costo_orario:22,ruolo:'operaio',created_at:d(-90)},
      {id:'o2',user_id:UID,mestiere_id:'m1',nome:'Luis',telefono:'333 4445556',mansione:'Manovale',costo_orario:18,ruolo:'operaio',created_at:d(-80)}],
    gest_preventivi:[
      {id:'p1',user_id:UID,mestiere_id:'m1',numero:3,titolo:'Rifacimento bagno',cliente_id:'c1',stato:'inviato',data:d(-3),iva_perc:10,created_at:d(-3)},
      {id:'p2',user_id:UID,mestiere_id:'m1',numero:2,titolo:'Tinteggiatura vano scale',cliente_id:'c2',stato:'accettato',data:d(-15),iva_perc:22,created_at:d(-15)},
      {id:'p3',user_id:UID,mestiere_id:'m1',numero:1,titolo:'Massetto e pavimento cucina',cliente_id:'c3',stato:'bozza',data:d(-1),iva_perc:10,created_at:d(-20)}],
    gest_preventivo_righe:[
      {id:'r1',preventivo_id:'p1',descrizione:'Demolizione e smaltimento',qta:1,prezzo:900,unita:'a corpo'},
      {id:'r2',preventivo_id:'p1',descrizione:'Posa piastrelle',qta:18,prezzo:45,unita:'mq'},
      {id:'r3',preventivo_id:'p2',descrizione:'Tinteggiatura pareti',qta:220,prezzo:9,unita:'mq'},
      {id:'r4',preventivo_id:'p3',descrizione:'Massetto',qta:25,prezzo:22,unita:'mq'},
      {id:'r5',preventivo_id:'p3',descrizione:'Posa pavimento',qta:25,prezzo:30,unita:'mq'}],
    gest_lavori:[
      {id:'l1',user_id:UID,mestiere_id:'m1',descrizione:'Tinteggiatura vano scale',cliente_id:'c2',dove:'Viale Maraini 8, Rieti',data:d(2),stato:'da_fare',importo:1980,created_at:d(-14)},
      {id:'l2',user_id:UID,mestiere_id:'m1',descrizione:'Riparazione tetto',cliente_id:'c3',dove:'Via Cintia 4, Rieti',data:d(-5),stato:'in_corso',importo:3200,created_at:d(-25)}],
    ai_accounts:[{user_id:UID,plan:'ai',monthly_quota:100,used_this_month:3,extra_credits:0}]
  };
  var nid=1000;
  function v0(x){return x===undefined?null:x;}
  function righe(t){return T[t]||(T[t]=[]);}
  function B(t){
    var st={t:t,op:'select',single:false,maybe:false,payload:null,f:[]};
    var b={};
    b.is=function(k,v){st.f.push(['__is',k,v]);return b;};
    b.not=function(k,op,v){if(op==='is')st.f.push(['__not',k,v]);return b;};
    ['select','order','limit','range','or','neq','in','gte','lte','lt','gt','ilike','like','filter','match','contains','overlaps','textSearch','returns','csv','abortSignal'].forEach(function(m){
      b[m]=function(){ if(m==='select'&&st.op==='select'){} return b; };
    });
    b.eq=function(k,v){st.f.push([k,v]);return b;};
    b.single=function(){st.single=true;return b;};
    b.maybeSingle=function(){st.single=true;st.maybe=true;return b;};
    b.insert=function(p){st.op='insert';st.payload=p;return b;};
    b.upsert=function(p){st.op='insert';st.payload=p;return b;};
    b.update=function(p){st.op='update';st.payload=p;return b;};
    b.delete=function(){st.op='delete';return b;};
    function filtra(r){return st.f.every(function(f){
      if(f[0]==='__is') return v0(r[f[1]])===v0(f[2]);
      if(f[0]==='__not') return v0(r[f[1]])!==v0(f[2]);
      if(['user_id','mestiere_id'].indexOf(f[0])>=0) return true; return r[f[0]]===undefined||String(r[f[0]])===String(f[1]);});}
    function esegui(){
      var R=righe(st.t), out;
      if(st.op==='insert'){var a=Array.isArray(st.payload)?st.payload:[st.payload];out=a.map(function(x){var y=Object.assign({id:'n'+(nid++),created_at:new Date().toISOString(),user_id:UID},x);R.push(y);return y;});}
      else if(st.op==='update'){out=R.filter(filtra);out.forEach(function(r){Object.assign(r,st.payload);});}
      else if(st.op==='delete'){out=R.filter(filtra);T[st.t]=R.filter(function(r){return out.indexOf(r)<0;});}
      else out=R.filter(filtra).slice();
      var data=st.single?(out[0]||null):out;
      return {data:data,error:null,count:Array.isArray(out)?out.length:0,status:200};
    }
    b.then=function(ok,ko){return new Promise(function(r){setTimeout(r,30);}).then(esegui).then(ok,ko);};
    b.catch=function(f){return b.then(null,f);};
    return b;
  }
  var SESS={access_token:'demo',user:{id:UID,email:'demo@trovaimpresa.com',user_metadata:{}}};
  function client(){
    return {
      from:B,
      rpc:function(){var p=Promise.resolve({data:null,error:null});return p;},
      auth:{
        getSession:function(){return Promise.resolve({data:{session:SESS},error:null});},
        getUser:function(){return Promise.resolve({data:{user:SESS.user},error:null});},
        onAuthStateChange:function(cb){setTimeout(function(){cb('SIGNED_IN',SESS);},50);return {data:{subscription:{unsubscribe:function(){}}}};},
        signOut:function(){return Promise.resolve({error:null});},
        refreshSession:function(){return Promise.resolve({data:{session:SESS},error:null});}
      },
      storage:{from:function(){return {
        getPublicUrl:function(p){return {data:{publicUrl:'/img/trovaimpresa-logo.svg'}};},
        createSignedUrl:function(){return Promise.resolve({data:{signedUrl:'/img/trovaimpresa-logo.svg'},error:null});},
        list:function(){return Promise.resolve({data:[],error:null});},
        upload:function(){return Promise.resolve({data:{path:'x'},error:null});},
        remove:function(){return Promise.resolve({data:[],error:null});}};}},
      channel:function(){var c={on:function(){return c;},subscribe:function(){return c;},unsubscribe:function(){}};return c;},
      removeChannel:function(){},
      functions:{invoke:function(){return Promise.resolve({data:null,error:null});}}
    };
  }
  window.supabase={createClient:client};
})();
