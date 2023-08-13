(function(){"use strict";var e={9962:function(e,t,i){var a=i(9242),n=i(3396),s=i(4870),r=i(7139),l=i(466);function o(){let e=(0,s.iH)({});(0,n.bv)((async()=>{chrome&&(e.value=await chrome.storage.sync.get())}))}var d=[{id:"section-magister-color",group:"Magister",title:"Thema",settings:[{id:"magister-css-experimental",title:"Verbeteringen aan uiterlijk",subtitle:"Veel functies van Study Tools werken mogelijk niet goed als dit is uitgeschakeld.",default:!0},{id:"magister-css-theme",title:"Kleurenthema",type:"SegmentedButton",wizard:"Kies in welk kleurenthema Magister moet worden weergegeven.",require:"magister-css-experimental",default:"auto",options:[{value:"auto",title:"Systeem",icon:"brightness_auto"},{value:"light",title:"Licht",icon:"light_mode"},{value:"dark",title:"Donker",icon:"dark_mode"}]},{id:"color-picker",title:"Accentkleur",version:"2.3.4",type:"ColorPicker",wizard:"Wil je een alternatieve accentkleur kiezen?",require:"magister-css-experimental"},{id:"magister-css-border-radius",title:"Afgeronde hoeken",type:"SlideInput",default:8,defaultFormatted:"8px",suffix:"px",min:0,max:20,step:1,require:"magister-css-experimental"},{id:"magister-css-dark-invert",title:"Inhoud donker maken",subtitle:"[Experimenteel] Studiewijzers en opdrachten donker maken indien het donkere thema actief is.",default:!0,require:"magister-css-experimental"}]},{id:"section-magister-login",group:"Magister",title:"Inloggen",wizard:"Kies de manier van inloggen op je school om automatisch inloggen in te schakelen.",settings:[{id:"magisterLogin-method",title:"Automatisch inloggen",type:"SegmentedButton",default:"microsoft",options:[{value:"microsoft",title:"Met een Microsoft-account"},{value:"password",title:"Met een Magister-wachtwoord"},{value:"off",title:"Uit"}]},{id:"magisterLogin-username",title:"Gebruikersnaam",type:"TextInput",require:"magisterLogin-method!==off"},{id:"magisterLogin-email",title:"E-mailadres",subtitle:"Van het Microsoft-account dat moet worden gekozen.",type:"TextInput",fieldType:"email",require:"magisterLogin-method===microsoft"},{id:"magisterLogin-password",title:"Wachtwoord",type:"TextInput",fieldType:"password",require:"magisterLogin-method===password"}]},{id:"section-magister-overlay",group:"Magister",title:"Overlay",settings:[{id:"magister-overlay-hotkey",title:"Activatietoets",subtitle:"De toets waarmee de overlay opgeroepen kan worden.",type:"KeybindInput",default:"S",require:"magister-css-experimental"},{id:"magister-shortcuts",title:"Sneltoetsen",subtitle:"Houd de activatietoets ingedrukt en druk op een getal op je toetsenbord voor snelle navigatie.",default:!0,require:"magister-overlay-hotkey? magister-css-experimental"},{id:"magister-shortcuts-today",title:"Snellere sneltoetsen",subtitle:"Op de pagina 'Vandaag' zijn sneltoetsen bruikbaar zonder dat je de activatietoets ingedrukt hoeft te houden.",default:!0,require:"magister-overlay-hotkey? magister-shortcuts magister-css-experimental"},{id:"magister-notes-beta2",title:"Notities",subtitle:"Houd de activatietoets ingedrukt om notities weer te geven. Druk op '0' op je toetsenbord om vast te zetten.",default:!1,class:"beta",require:"beta-options magister-overlay-hotkey? magister-css-experimental"}]},{id:"section-magister-sidebar",group:"Magister",title:"Menubalk",settings:[{id:"magister-appbar-week",title:"Weeknummer tonen",default:!0},{id:"magister-appbar-zermelo",title:"Link naar Zermelo tonen"},{id:"magister-appbar-zermelo-url",title:"Webadres Zermelo",subtitle:"Bijvoorbeeld 'school.zportal.nl/app'. Dit hoeft alleen ingevuld te worden als er problemen optreden.",type:"TextInput",require:"magister-appbar-zermelo"},{id:"magister-picture",title:"Profielfoto",type:"SegmentedButton",default:"hide",options:[{value:"show",title:"Originele profielfoto"},{value:"custom",title:"Aangepaste profielfoto"},{value:"hide",title:"Geen profielfoto"}]},{id:"magister-picture-source",title:"Aangepaste profielfoto",type:"ImageInput",require:"magister-picture===custom"}]},{id:"section-magister-today",group:"Magister",title:"Vandaag",settings:[{id:"magister-vd-overhaul",title:"Verbeterde pagina 'Vandaag'",default:!0,require:"magister-css-experimental"},{id:"magister-vd-agendaHeight",title:"Hoogte agenda-items",type:"SlideInput",default:1,defaultFormatted:"1,0×",suffix:"×",min:.5,max:2.5,step:.1,require:"magister-css-experimental magister-vd-overhaul"},{id:"magister-vd-subjects",title:"Aangepaste vaknamen",default:!0,require:"magister-css-experimental magister-vd-overhaul"},{id:"magister-vd-grade",title:"Weergave laatste cijfers",type:"SegmentedButton",default:"full",require:"magister-css-experimental magister-vd-overhaul",options:[{value:"full",title:"Volledig (cijfer weergeven)"},{value:"partial",title:"Gedeeltelijk (cijfer verbergen)"},{value:"off",title:"Uit"}]}]},{id:"section-magister-grades",group:"Magister",title:"Cijfers",settings:[{id:"magister-cf-calculator",title:"Cijfercalculator",subtitle:"Een handige cijfercalculator met grafieken. Je kunt cijfers uit je cijferlijst toevoegen of aangepaste cijfers invoeren. Open met de knop rechtsboven in het cijferoverzicht.",default:!0},{id:"magister-cf-statistics",title:"Cijferstatistieken",subtitle:"[Experimenteel] Verscheidene statistieken en grafiekjes bij je cijfers, met handige filters. Te vinden onder het nieuwe tabblad in de zijbalk van het cijferoverzicht.",default:!0},{id:"magister-cf-backup",title:"Cijferback-up",subtitle:"Biedt de optie om je cijferoverzicht te exporteren en op een later moment weer te importeren. Gebruik met de knop rechtsboven in het cijferoverzicht.",default:!0},{id:"magister-cf-failred",title:"Onvoldoendes rood kleuren",subtitle:"Alleen in het cijferoverzicht.",default:!0}]},{id:"section-magister-studiewijzers",group:"Magister",title:"Studiewijzers",settings:[{id:"magister-sw-display",title:"Weergave studiewijzers",type:"SegmentedButton",require:"magister-css-experimental",default:"grid",options:[{value:"grid",title:"Geordend raster"},{value:"list",title:"Geordende lijst"},{value:"off",title:"Origineel"}]},{id:"magister-sw-period",title:"Periodenummers tonen",subtitle:"In plaats van de naam van de studiewijzer.",default:!0,require:"magister-css-experimental magister-sw-display===grid"},{id:"magister-sw-thisWeek",title:"Naar huidige week scrollen",default:!0}]},{id:"section-magister-gamification-beta",group:"Magister",title:"Gamificatie",settings:[{id:"magister-gamification-beta",title:"Gamificatie",subtitle:"Op de pagina 'Vandaag' kun je jouw punten bekijken. Punten worden toegekend op basis van je prestaties. Lees meer in het scoremenu.",default:!1,class:"beta nofirefox",require:"beta-options magister-css-experimental"}]},{id:"section-magister-values",group:"Magister",title:"Globale waarden",settings:[{id:"magister-periods",title:"Beginweken perioden",subtitle:"Het eerste weeknummer van elke periode, gescheiden door komma's.",type:"TextInput",default:"30, 47, 9"},{id:"magister-subjects",title:"Aangepaste vaknamen",type:"subjects",default:[{name:"Aardrijkskunde",aliases:"ak"},{name:"Bedrijfseconomie",aliases:"beco"},{name:"Beeldende vorming",aliases:"be, bv, kubv"},{name:"Biologie",aliases:"bi, bio"},{name:"Cult. en kunstz. vorming",aliases:"ckv"},{name:"Drama",aliases:"dr, kudr"},{name:"Duits",aliases:"du, dutl, Duitse, Deutsch"},{name:"Economie",aliases:"ec, eco, econ"},{name:"Engels",aliases:"en, entl, Engels, English"},{name:"Frans",aliases:"fa, fatl, Franse, Français"},{name:"Geschiedenis",aliases:"gs"},{name:"Grieks",aliases:"gtc, gr, grtl, Griekse"},{name:"Kunst algemeen",aliases:"ku, kua"},{name:"Latijn",aliases:"ltc, la, latl, Latijnse"},{name:"Levensbeschouwing",aliases:"lv"},{name:"Sport",aliases:"lo, s&b, lichamelijke opvoeding, gym"},{name:"Loopbaan&shy;oriëntatie en -begeleiding",aliases:"lob"},{name:"Maatschappijleer",aliases:"ma, malv"},{name:"Maatschappij&shy;wetenschappen",aliases:"maw"},{name:"Mentor",aliases:"mentoruur, mentoraat"},{name:"Muziek",aliases:"mu, kumu"},{name:"Natuurkunde",aliases:"na, nat"},{name:"Nederlands",aliases:"ne, netl, Nederlandse"},{name:"Scheikunde",aliases:"sk, sch"},{name:"Spaans",aliases:"sp, sptl, Spaanse, Español"},{name:"Wiskunde",aliases:"wi, wa, wb, wc, wd, wisa, wisb, wisc, wisd"}]}]},{id:"section-dev",group:"Study Tools",title:"Opties",settings:[{id:"updates",title:"Updates aanbieden",subtitle:"Melding bij nieuwe versie.",devOnly:!0},{id:"update-notes",title:"Update-informatie weergeven",subtitle:"Een korte melding over de nieuwste update wordt weergegeven als er een nieuwe beschikbaar of onlangs geïnstalleerd is.",default:!0},{id:"beta-options",title:"Experimentele opties",subtitle:"Er verschijnen extra opties voor functies die nog niet af zijn.",class:"beta",default:!1},{id:"beta",title:"Bètaversies aanbieden",subtitle:"Melding bij nieuwe bètaversie. Bevat de laatste bugfixes, maar kan ook nieuwe bugs bevatten. Je hebt altijd de keuze om de versie niet te installeren.",devOnly:!0,class:"beta",require:"beta-options updates"}]}];const u={id:"top-app-bar"},m=(0,n._)("h1",{id:"app-heading"},"Study Tools",-1),c=[m];function g(e,t){return(0,n.wg)(),(0,n.iD)("header",u,c)}var p=i(89);const f={},v=(0,p.Z)(f,[["render",g]]);var b=v,k={__name:"Icon",props:{filled:Boolean},setup(e){return(t,i)=>((0,n.wg)(),(0,n.iD)("span",{"aria-hidden":"true",class:(0,r.C_)(["icon material-symbols-outlined",e.filled?"fill":""])},[(0,n.WI)(t.$slots,"default")],2))}};const h=k;var w=h;const j={id:"navigation-bar"},y=["onClick","active"],_=["active"];var x={__name:"NavigationBar",setup(e){const t=[{id:"appearance",name:"Uiterlijk",icon:"format_paint"},{id:"login",name:"Inloggen",icon:"key"},{id:"functions",name:"Functies",icon:"widgets"},{id:"data",name:"Waarden",icon:"dataset"},{id:"about",name:"Over",icon:"info"}];let i=(0,s.iH)("appearance");return(e,a)=>((0,n.wg)(),(0,n.iD)("div",j,[((0,n.wg)(),(0,n.iD)(n.HY,null,(0,n.Ko)(t,(e=>(0,n._)("div",{key:e.id,class:"navigation-item",onClick:t=>(0,s.dq)(i)?i.value=e.id:i=e.id,active:e.id===(0,s.SU)(i)},[(0,n._)("div",{class:"navigation-item-icon-wrapper",active:e.id===(0,s.SU)(i)},[(0,n.Wm)(w,{filled:e.id===(0,s.SU)(i)},{default:(0,n.w5)((()=>[(0,n.Uk)((0,r.zw)(e.icon),1)])),_:2},1032,["filled"])],8,_),(0,n._)("span",null,(0,r.zw)(e.name),1)],8,y))),64))]))}};const z=x;var S=z;const q={class:"setting switch"},I=["for"],M={class:"setting-title"},U={class:"setting-subtitle"},V=["data-state"],O=["data-state"],D=["id"];var W={__name:"SwitchInput",props:["modelValue","id"],emits:["update:modelValue"],setup(e,{emit:t}){const i=e,s=(0,n.Fl)({get(){return i.modelValue},set(e){t("update:modelValue",e)}});return(t,i)=>((0,n.wg)(),(0,n.iD)("div",q,[(0,n._)("label",{for:e.id},[(0,n._)("div",null,[(0,n._)("h3",M,[(0,n.WI)(t.$slots,"title")]),(0,n._)("span",U,[(0,n.WI)(t.$slots,"subtitle")]),(0,n._)("div",{class:"switch-track","data-state":s.value},[(0,n._)("div",{class:"switch-thumb","data-state":s.value},[(0,n.Wm)(w,{class:"switch-icon","data-state":s.value},{default:(0,n.w5)((()=>[(0,n.Uk)("check")])),_:1},8,["data-state"])],8,O)],8,V)]),(0,n.wy)((0,n._)("input",{type:"checkbox",id:e.id,"onUpdate:modelValue":i[0]||(i[0]=e=>s.value=e)},null,8,D),[[a.e8,s.value]])],8,I)]))}};const B=W;var L=B;const T={class:"setting segmented-button"},C=["for"],E={class:"setting-title"},H={class:"setting-subtitle"},G={class:"button-wrapper"},A=["onClick","data-state"],F={class:"button-segment-text"};var K={__name:"SegmentedButton",props:["modelValue","id","options"],emits:["update:modelValue"],setup(e,{emit:t}){const i=e,a=(0,n.Fl)({get(){return i.modelValue},set(e){t("update:modelValue",e)}});return(t,i)=>((0,n.wg)(),(0,n.iD)("div",T,[(0,n._)("label",{for:e.id},[(0,n._)("div",null,[(0,n._)("h3",E,[(0,n.WI)(t.$slots,"title")]),(0,n._)("span",H,[(0,n.WI)(t.$slots,"subtitle")]),(0,n._)("div",G,[((0,n.wg)(!0),(0,n.iD)(n.HY,null,(0,n.Ko)(e.options,(e=>((0,n.wg)(),(0,n.iD)("button",{class:"button-segment",onClick:t=>a.value=e.value,"data-state":e.value===a.value},[e.icon?((0,n.wg)(),(0,n.j4)(w,{key:0,class:"button-segment-icon"},{default:(0,n.w5)((()=>[(0,n.Uk)((0,r.zw)(e.icon),1)])),_:2},1024)):(0,n.kq)("",!0),(0,n._)("span",F,(0,r.zw)(e.title),1)],8,A)))),256))])])],8,C)]))}};const N=K;var P=N,Y={__name:"App",setup(e){const{y:t}=(0,l.baj)(),i=o();let u=(0,s.iH)({});const m={SwitchInput:L,SegmentedButton:P};return(e,l)=>((0,n.wg)(),(0,n.iD)(n.HY,null,[(0,n.Wm)(b,{"data-scrolled":(0,s.SU)(t)>16},null,8,["data-scrolled"]),(0,n._)("main",null,[(0,n.Uk)((0,r.zw)((0,s.SU)(u))+" "+(0,r.zw)((0,s.SU)(i))+" ",1),(0,n.Wm)(a.W3,{tag:"div",id:"options-container"},{default:(0,n.w5)((()=>[((0,n.wg)(!0),(0,n.iD)(n.HY,null,(0,n.Ko)((0,s.SU)(d),(e=>((0,n.wg)(),(0,n.iD)("div",{key:e.id},[((0,n.wg)(!0),(0,n.iD)(n.HY,null,(0,n.Ko)(e.settings,(e=>((0,n.wg)(),(0,n.j4)((0,n.LL)(m[e.type||"SwitchInput"]),{key:e.id,id:e.id,modelValue:(0,s.SU)(u)[e.id],"onUpdate:modelValue":t=>(0,s.SU)(u)[e.id]=t,options:e.options},{title:(0,n.w5)((()=>[(0,n.Uk)((0,r.zw)(e.title),1)])),subtitle:(0,n.w5)((()=>[(0,n.Uk)((0,r.zw)(e.subtitle),1)])),_:2},1032,["id","modelValue","onUpdate:modelValue","options"])))),128))])))),128))])),_:1})]),(0,n.Wm)(S)],64))}};const $=Y;var Z=$;(0,a.ri)(Z).mount("#app")}},t={};function i(a){var n=t[a];if(void 0!==n)return n.exports;var s=t[a]={exports:{}};return e[a].call(s.exports,s,s.exports,i),s.exports}i.m=e,function(){var e=[];i.O=function(t,a,n,s){if(!a){var r=1/0;for(u=0;u<e.length;u++){a=e[u][0],n=e[u][1],s=e[u][2];for(var l=!0,o=0;o<a.length;o++)(!1&s||r>=s)&&Object.keys(i.O).every((function(e){return i.O[e](a[o])}))?a.splice(o--,1):(l=!1,s<r&&(r=s));if(l){e.splice(u--,1);var d=n();void 0!==d&&(t=d)}}return t}s=s||0;for(var u=e.length;u>0&&e[u-1][2]>s;u--)e[u]=e[u-1];e[u]=[a,n,s]}}(),function(){i.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return i.d(t,{a:t}),t}}(),function(){i.d=function(e,t){for(var a in t)i.o(t,a)&&!i.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})}}(),function(){i.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){var e={143:0};i.O.j=function(t){return 0===e[t]};var t=function(t,a){var n,s,r=a[0],l=a[1],o=a[2],d=0;if(r.some((function(t){return 0!==e[t]}))){for(n in l)i.o(l,n)&&(i.m[n]=l[n]);if(o)var u=o(i)}for(t&&t(a);d<r.length;d++)s=r[d],i.o(e,s)&&e[s]&&e[s][0](),e[s]=0;return i.O(u)},a=self["webpackChunkstudy_tools_popup"]=self["webpackChunkstudy_tools_popup"]||[];a.forEach(t.bind(null,0)),a.push=t.bind(null,a.push.bind(a))}();var a=i.O(void 0,[998],(function(){return i(9962)}));a=i.O(a)})();
//# sourceMappingURL=app.f8f83037.js.map