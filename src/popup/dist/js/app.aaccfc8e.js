(function(){"use strict";var e={3430:function(e,t,a){var i=a(9242),l=a(3396),n=a(4870),s=a(7139),o=a(6367),u=[{id:"appearance",settings:[{id:"theme",title:"Kleurenschema",type:"SegmentedButton",wizard:"Kies in welk kleurenthema Magister moet worden weergegeven.",default:"auto",options:[{value:"auto",title:"Systeem",icon:"brightness_auto"},{value:"light",title:"Licht",icon:"light_mode"},{value:"dark",title:"Donker",icon:"dark_mode"}]},{id:"color",title:"Accentkleur",type:"ColorPicker",default:{h:207,s:95,l:55},wizard:"Wil je een alternatieve accentkleur kiezen?"},{id:"shape",title:"Afgeronde hoeken",type:"SlideInput",default:8,format:"px",decimals:0,min:0,max:20,step:1},{id:"magister-css-dark-invert",title:"Inhoud donker maken",subtitle:"Studiewijzers en opdrachten donker maken indien het donkere thema actief is.",conditions:[{settingId:"beta-options",operator:"equal",value:!0}],default:!0},{id:"magister-appbar-week",title:"Weeknummer in zijbalk",default:!0},{id:"magister-picture",title:"Profielfoto",type:"SegmentedButton",default:"hide",options:[{value:"show",title:"Schoolfoto",icon:"photo_camera_front"},{value:"custom",title:"Aangepast",icon:"add_photo_alternate"},{value:"hide",title:"Verbergen",icon:"visibility_off"}]},{id:"magister-picture-source",title:"Profielfoto kiezen",type:"ImageInput",conditions:[{settingId:"magister-picture",operator:"equal",value:"custom"}]},{id:"magister-cf-failred",title:"Onvoldoendes rood kleuren",subtitle:"Alleen in het cijferoverzicht.",default:!0}]},{id:"login",wizard:"Kies de manier van inloggen op je school om automatisch inloggen in te schakelen.",settings:[{id:"magisterLogin-method",title:"Automatisch inloggen",subtitle:"Log automatisch in met je Microsoft-account of met een Magister-wachtwoord.",type:"SegmentedButton",default:"microsoft",options:[{value:"microsoft",title:"Microsoft"},{value:"password",title:"Wachtwoord"},{value:"off",title:"Uit"}]},{id:"magisterLogin-username",title:"Gebruikersnaam",type:"TextInput",conditions:[{settingId:"magisterLogin-method",operator:"not equal",value:"off"}]},{id:"magisterLogin-email",title:"E-mailadres",subtitle:"Van het Microsoft-account dat moet worden gekozen.",type:"TextInput",fieldType:"email",conditions:[{settingId:"magisterLogin-method",operator:"equal",value:"microsoft"}]},{id:"magisterLogin-password",title:"Wachtwoord",type:"TextInput",fieldType:"password",conditions:[{settingId:"magisterLogin-method",operator:"equal",value:"password"}]}]},{id:"enhancements",settings:[{id:"magister-vd-overhaul",title:"Verbeterd startscherm",default:!0},{id:"magister-vd-agendaHeight",title:"Hoogte agenda",type:"SlideInput",default:1,format:"percent",decimals:0,min:.5,max:2.5,step:.01,conditions:[{settingId:"magister-vd-overhaul",operator:"equal",value:!0}]},{id:"vd-subjects-display",title:"Vaknotatie in agenda",type:"SegmentedButton",default:"custom",conditions:[{settingId:"magister-vd-overhaul",operator:"equal",value:!0}],options:[{value:"custom",title:"Vaknamen",icon:"notes"},{value:"default",title:"Vakafkortingen",icon:"short_text"}]},{id:"subjects",title:"Vaknamen bewerken",subtitle:"Geef vaknamen en de bijbehorende afkortingen en aliassen op, zodat Study Tools weet welke studiewijzers bij elkaar horen.",type:"SubjectEditor",conditions:[{settingId:"magister-vd-overhaul",operator:"equal",value:!0}],default:[{name:"Aardrijkskunde",aliases:"ak"},{name:"Bedrijfseconomie",aliases:"beco"},{name:"Beeldende vorming",aliases:"be, bv, kubv"},{name:"Biologie",aliases:"bi, bio"},{name:"Cult. en kunstz. vorming",aliases:"ckv"},{name:"Drama",aliases:"dr, kudr"},{name:"Duits",aliases:"du, dutl, Duitse, Deutsch"},{name:"Economie",aliases:"ec, eco, econ"},{name:"Engels",aliases:"en, entl, Engels, English"},{name:"Frans",aliases:"fa, fatl, Franse, Français"},{name:"Geschiedenis",aliases:"gs"},{name:"Grieks",aliases:"gtc, gr, grtl, Griekse"},{name:"Kunst algemeen",aliases:"ku, kua"},{name:"Latijn",aliases:"ltc, la, latl, Latijnse"},{name:"Levensbeschouwing",aliases:"lv"},{name:"Sport",aliases:"lo, s&b, lichamelijke opvoeding, gym"},{name:"Loopbaan&shy;oriëntatie en -begeleiding",aliases:"lob"},{name:"Maatschappijleer",aliases:"ma, malv"},{name:"Maatschappij&shy;wetenschappen",aliases:"maw"},{name:"Mentor",aliases:"mentoruur, mentoraat"},{name:"Muziek",aliases:"mu, kumu"},{name:"Natuurkunde",aliases:"na, nat"},{name:"Nederlands",aliases:"ne, netl, Nederlandse"},{name:"Scheikunde",aliases:"sk, sch"},{name:"Spaans",aliases:"sp, sptl, Spaanse, Español"},{name:"Wiskunde",aliases:"wi, wa, wb, wc, wd, wisa, wisb, wisc, wisd"}]},{id:"magister-vd-grade",title:"Laatste cijfer op startscherm",subtitle:"Toon het laatste cijfer op het startscherm, laat alleen zien hoeveel nieuwe cijfers er zijn of toon helemaal niets.",type:"SegmentedButton",default:"full",conditions:[{settingId:"magister-vd-overhaul",operator:"equal",value:!0}],options:[{value:"full",title:"Volledig",icon:"star"},{value:"partial",title:"Aantal",icon:"app_badging"},{value:"off",title:"Verbergen",icon:"visibility_off"}]},{id:"magister-cf-calculator",title:"Cijfercalculator",subtitle:"Zie wat je moet halen of wat je komt te staan op basis van je cijferlijst en/of aangepaste cijfers.",default:!0},{id:"magister-cf-statistics",title:"Cijferstatistieken",subtitle:"Nieuw tabblad in het cijferoverzicht met statistieken, grafiekjes en handige filters.",default:!0},{id:"magister-cf-backup",title:"Cijferback-up",subtitle:"Knop in het cijferoverzicht om je cijferlijst te exporteren en te importeren.",default:!0,links:[{icon:"upload",label:"Cijferback-up importeren",href:"https://qkeleq10.github.io/studytools/grades"}]},{id:"magister-sw-display",title:"Studiewijzers ordenen",subtitle:"Studiewijzers zullen worden gegroepeerd op vaknaam en periodenummer.",type:"SegmentedButton",default:"grid",options:[{value:"grid",title:"Raster",icon:"grid_view"},{value:"list",title:"Lijst",icon:"sort"},{value:"off",title:"Uit",icon:"block"}]},{id:"subjects",title:"Vaknamen bewerken",subtitle:"Geef vaknamen en de bijbehorende afkortingen en aliassen op, zodat Study Tools weet welke studiewijzers bij elkaar horen.",type:"SubjectEditor",default:[{name:"Aardrijkskunde",aliases:"ak"},{name:"Bedrijfseconomie",aliases:"beco"},{name:"Beeldende vorming",aliases:"be, bv, kubv"},{name:"Biologie",aliases:"bi, bio"},{name:"Cult. en kunstz. vorming",aliases:"ckv"},{name:"Drama",aliases:"dr, kudr"},{name:"Duits",aliases:"du, dutl, Duitse, Deutsch"},{name:"Economie",aliases:"ec, eco, econ"},{name:"Engels",aliases:"en, entl, Engels, English"},{name:"Frans",aliases:"fa, fatl, Franse, Français"},{name:"Geschiedenis",aliases:"gs"},{name:"Grieks",aliases:"gtc, gr, grtl, Griekse"},{name:"Kunst algemeen",aliases:"ku, kua"},{name:"Latijn",aliases:"ltc, la, latl, Latijnse"},{name:"Levensbeschouwing",aliases:"lv"},{name:"Sport",aliases:"lo, s&b, lichamelijke opvoeding, gym"},{name:"Loopbaan&shy;oriëntatie en -begeleiding",aliases:"lob"},{name:"Maatschappijleer",aliases:"ma, malv"},{name:"Maatschappij&shy;wetenschappen",aliases:"maw"},{name:"Mentor",aliases:"mentoruur, mentoraat"},{name:"Muziek",aliases:"mu, kumu"},{name:"Natuurkunde",aliases:"na, nat"},{name:"Nederlands",aliases:"ne, netl, Nederlandse"},{name:"Scheikunde",aliases:"sk, sch"},{name:"Spaans",aliases:"sp, sptl, Spaanse, Español"},{name:"Wiskunde",aliases:"wi, wa, wb, wc, wd, wisa, wisb, wisc, wisd"}]},{id:"periods",title:"Perioden bewerken",subtitle:"Dit wordt gebruikt om de huidige periode te bepalen en om studiewijzers te groeperen.",type:"PeriodEditor",default:[30,47,9]},{id:"magister-sw-period",title:"Periodenummers bij studiewijzers",subtitle:"In plaats van de naam van de studiewijzer.",default:!0,conditions:[{settingId:"magister-sw-display",operator:"equal",value:"grid"}]},{id:"sw-current-week-behavior",title:"Huidige week in studiewijzer",type:"SegmentedButton",default:"focus",options:[{value:"focus",title:"Scrollen",icon:"bolt"},{value:"highlight",title:"Markeren",icon:"ink_highlighter"},{value:"off",title:"Uit",icon:"block"}]}]},{id:"overlay",settings:[{id:"magister-overlay-hotkey",title:"Activatietoets",subtitle:"Deze toets activeert de overlay en sneltoetsen.",type:"KeyPicker",default:"S"},{id:"magister-shortcuts",title:"Sneltoetsen",subtitle:"Houd de activatietoets ingedrukt en druk op een getal op je toetsenbord voor snelle navigatie.",default:!0,conditions:[{settingId:"magister-overlay-hotkey",operator:"defined"}]},{id:"magister-shortcuts-today",title:"Snellere sneltoetsen",subtitle:"Op de startpagina zijn sneltoetsen bruikbaar zonder de activatietoets ingedrukt te hoeven houden.",default:!0,conditions:[{settingId:"magister-overlay-hotkey",operator:"defined"},{settingId:"magister-shortcuts",operator:"equal",value:!0}]},{id:"notes-enabled",title:"Notitieblok",default:!1,conditions:[{settingId:"magister-overlay-hotkey",operator:"defined"},{settingId:"beta-options",operator:"equal",value:!0}]}]},{id:"about",settings:[{id:"update-notes",title:"Update-informatie weergeven",subtitle:"Af en toe een korte melding over de nieuwste updates weergeven.",default:!0},{id:"beta-options",title:"Experimentele opties",subtitle:"Er verschijnen extra opties voor functies die nog niet af zijn.",default:!1},{id:"updates",title:"Melding bij beschikbare update",conditions:[{settingId:"beta-options",operator:"equal",value:!0}]},{id:"beta",title:"Melding bij beschikbare bèta-update",subtitle:"Bèta-builds bevatten de laatste bugfixes, maar kunnen ook nieuwe bugs bevatten.",conditions:[{settingId:"updates",operator:"equal",value:!0},{settingId:"beta-options",operator:"equal",value:!0}]},{id:"disable-css",title:"Algemene CSS-modificaties uitschakelen",subtitle:"Veel functies van Study Tools werken mogelijk niet.",default:!1,conditions:[{settingId:"beta-options",operator:"equal",value:!0}]}]}];function r(){let e=(0,n.iH)({});function t(){e.value.color&&(document.documentElement.style.setProperty("--palette-primary-hue",e.value.color.h),document.documentElement.style.setProperty("--palette-primary-saturation",`${e.value.color.s}%`),document.documentElement.style.setProperty("--palette-primary-luminance",`${e.value.color.l}%`)),e.value.theme&&(document.documentElement.setAttribute("theme",e.value.theme),"auto"===e.value.theme&&window.matchMedia?.("(prefers-color-scheme: dark)").matches&&document.documentElement.setAttribute("theme","auto dark"))}return(0,l.bv)((()=>{chrome?.storage?.sync&&(chrome.storage.sync.get().then((t=>{e.value=t,u.forEach((t=>{t.settings.forEach((t=>{"undefined"===typeof e.value[t.id]&&(e.value[t.id]=t.default)}))}))})),e.value["openedPopup"]=chrome?.runtime?.getManifest()?.version)})),(0,l.m0)((()=>{chrome?.storage?.sync&&chrome.storage.sync.set(e.value),chrome?.tabs&&chrome.tabs.query({},(e=>{e&&e.forEach((e=>{e&&chrome.tabs.sendMessage(e.id,{type:"styles-updated"})}))})),t()})),e}var d={__name:"Icon",props:{filled:Boolean},setup(e){return(t,a)=>((0,l.wg)(),(0,l.iD)("span",{"aria-hidden":"true",class:(0,s.C_)(["icon material-symbols-outlined",e.filled?"fill":""])},[(0,l.WI)(t.$slots,"default")],2))}};const c=d;var m=c;const p=["active"],v=["active"],g={class:"dialog-title center"},f={class:"dialog-description"},h={class:"dialog-actions"};var b={__name:"Dialog",props:["active"],emits:["update:active"],setup(e,{emit:t}){const a=e,i=()=>{t("update:active",!1)};return(e,t)=>((0,l.wg)(),(0,l.iD)(l.HY,null,[(0,l._)("div",{class:"scrim",active:a.active,onClick:i},null,8,p),(0,l._)("div",{class:"dialog",active:a.active},[(0,l.Wm)(m,{class:"dialog-icon"},{default:(0,l.w5)((()=>[(0,l.WI)(e.$slots,"icon")])),_:3}),(0,l._)("h2",g,[(0,l.WI)(e.$slots,"headline")]),(0,l._)("span",f,[(0,l.WI)(e.$slots,"text")]),(0,l._)("div",h,[(0,l.WI)(e.$slots,"buttons")])],8,v)],64))}};const k=b;var w=k;const _=["data-scrolled"],y=(0,l._)("h1",{id:"app-heading"},"Study Tools",-1),j={id:"top-app-bar-buttons"};var I={__name:"TopAppBar",props:["scrolled"],emits:["resetSettings"],setup(e,{emit:t}){const a=e,i=(0,n.iH)(!1);function s(){t("resetSettings"),i.value=!1}return(e,t)=>((0,l.wg)(),(0,l.iD)(l.HY,null,[(0,l._)("header",{id:"top-app-bar","data-scrolled":a.scrolled},[y,(0,l._)("div",j,[(0,l._)("button",{class:"icon-button",onClick:t[0]||(t[0]=e=>i.value=!0)},[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("restart_alt")])),_:1})])])],8,_),(0,l.Wm)(w,{active:i.value,"onUpdate:active":t[2]||(t[2]=e=>i.value=e)},{icon:(0,l.w5)((()=>[(0,l.Uk)("restart_alt")])),headline:(0,l.w5)((()=>[(0,l.Uk)("Voorkeuren wissen?")])),text:(0,l.w5)((()=>[(0,l.Uk)("Hiermee stel je alle instellingen van Study Tools in op de standaardwaarden.")])),buttons:(0,l.w5)((()=>[(0,l._)("button",{onClick:t[1]||(t[1]=e=>i.value=!1)},"Annuleren"),(0,l._)("button",{onClick:s},"Wissen")])),_:1},8,["active"])],64))}};const S=I;var W=S;const U={id:"navigation-bar"},V=["onClick","active"],D=["active"];var z={__name:"NavigationBar",props:["modelValue"],emits:["update:modelValue","scrollToTop"],setup(e,{emit:t}){const a=e,i=(0,l.Fl)({get(){return a.modelValue},set(e){t("update:modelValue",e)}}),n=[{id:"appearance",name:"Uiterlijk",icon:"format_paint"},{id:"login",name:"Inloggen",icon:"key"},{id:"enhancements",name:"Verbeteringen",icon:"handyman"},{id:"overlay",name:"Overlay",icon:"layers"},{id:"about",name:"Over",icon:"info"}];function o(e){let a=i.value!==e;i.value=e,t("scrollToTop",a)}return(e,t)=>((0,l.wg)(),(0,l.iD)("nav",U,[((0,l.wg)(),(0,l.iD)(l.HY,null,(0,l.Ko)(n,(e=>(0,l._)("button",{key:e.id,class:"navigation-item",onClick:t=>o(e.id),active:e.id===i.value},[(0,l._)("div",{class:"navigation-item-icon-wrapper",active:e.id===i.value},[(0,l.Wm)(m,{filled:e.id===i.value},{default:(0,l.w5)((()=>[(0,l.Uk)((0,s.zw)(e.icon),1)])),_:2},1032,["filled"])],8,D),(0,l._)("span",null,(0,s.zw)(e.name),1)],8,V))),64))]))}};const C=z;var x=C;const E=["for"],L={class:"setting-title"},$={class:"setting-subtitle"},H=["data-state"],T=["data-state"],q=["id"];var M={__name:"SwitchInput",props:["modelValue","id"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,u=(0,n.iH)(null),{height:r}=(0,o.h4X)(u),d=(0,l.Fl)({get(){return a.modelValue},set(e){t("update:modelValue",e)}});return(t,a)=>((0,l.wg)(),(0,l.iD)("label",{class:(0,s.C_)(["setting switch",{tall:(0,n.SU)(r)>70}]),for:e.id,ref_key:"label",ref:u},[(0,l._)("div",null,[(0,l._)("h3",L,[(0,l.WI)(t.$slots,"title")]),(0,l._)("span",$,[(0,l.WI)(t.$slots,"subtitle")])]),(0,l._)("div",{class:"switch-track","data-state":d.value},[(0,l._)("div",{class:"switch-thumb","data-state":d.value},[(0,l.Wm)(m,{class:"switch-icon","data-state":d.value},{default:(0,l.w5)((()=>[(0,l.Uk)("check")])),_:1},8,["data-state"])],8,T)],8,H),(0,l.wy)((0,l._)("input",{type:"checkbox",id:e.id,"onUpdate:modelValue":a[0]||(a[0]=e=>d.value=e)},null,8,q),[[i.e8,d.value]])],10,E))}};const F=M;var P=F;const O={class:"setting segmented-button"},A={class:"setting-title"},B={class:"setting-subtitle"},K={class:"button-wrapper"},N=["onClick","data-state","data-has-icon"],Y={class:"button-segment-icon-wrapper"},G={class:"button-segment-text"};var R={__name:"SegmentedButton",props:["modelValue","id","setting"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,n=(0,l.Fl)({get(){return a.modelValue},set(e){t("update:modelValue",e)}});return(t,a)=>((0,l.wg)(),(0,l.iD)("div",O,[(0,l._)("div",null,[(0,l._)("h3",A,[(0,l.WI)(t.$slots,"title")]),(0,l._)("span",B,[(0,l.WI)(t.$slots,"subtitle")])]),(0,l._)("div",K,[((0,l.wg)(!0),(0,l.iD)(l.HY,null,(0,l.Ko)(e.setting.options,(e=>((0,l.wg)(),(0,l.iD)("button",{key:e.value,class:"button-segment",onClick:t=>n.value=e.value,"data-state":e.value===n.value,"data-has-icon":!!e.icon},[(0,l._)("div",Y,[(0,l.Wm)(i.uT,{name:"icon"},{default:(0,l.w5)((()=>[e.value===n.value?((0,l.wg)(),(0,l.j4)(m,{key:"selected",class:"button-segment-icon selected"},{default:(0,l.w5)((()=>[(0,l.Uk)("check ")])),_:1})):e.icon?((0,l.wg)(),(0,l.j4)(m,{key:"icon",class:"button-segment-icon"},{default:(0,l.w5)((()=>[(0,l.Uk)((0,s.zw)(e.icon),1)])),_:2},1024)):(0,l.kq)("",!0)])),_:2},1024)]),(0,l._)("span",G,(0,s.zw)(e.title),1)],8,N)))),128))])]))}};const Z=R;var X=Z;const J=["for"],Q=["type","id"],ee={class:"border-cutout"},te={class:"setting-title"},ae={class:"setting-subtitle"};var ie={__name:"TextInput",props:["modelValue","id","setting"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,n=(0,l.Fl)({get(){return a.modelValue},set(e){t("update:modelValue",e)}});return(t,a)=>((0,l.wg)(),(0,l.iD)("label",{class:"setting text",for:e.id},[(0,l.wy)((0,l._)("input",{class:"text-input",type:e.setting.fieldType||"input",id:e.id,"onUpdate:modelValue":a[0]||(a[0]=e=>n.value=e),placeholder:" ",autocomplete:"off"},null,8,Q),[[i.YZ,n.value,void 0,{lazy:!0}]]),(0,l._)("div",ee,[(0,l.WI)(t.$slots,"title")]),(0,l._)("h3",te,[(0,l.WI)(t.$slots,"title")]),(0,l._)("span",ae,[(0,l.WI)(t.$slots,"subtitle")])],8,J))}};const le=ie;var ne=le,se=a(8303),oe=a.n(se);const ue={class:"setting slider"},re={class:"setting-title"},de={class:"setting-subtitle"};var ce={__name:"SlideInput",props:["modelValue","id","setting"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,i=(0,l.Fl)({get(){return a.modelValue},set(e){t("update:modelValue",e)}});function s(e){let t=a.setting.decimals||0;if(!a.setting.format)return Number(e).toLocaleString("nl-NL",{minimumFractionDigits:t,maximumFractionDigits:t});switch(a.setting.format){case"percent":return Number(e).toLocaleString("nl-NL",{style:"percent",minimumFractionDigits:t,maximumFractionDigits:t});default:return Number(e).toLocaleString("nl-NL",{minimumFractionDigits:t,maximumFractionDigits:t})+"px"}}return(t,a)=>((0,l.wg)(),(0,l.iD)("div",ue,[(0,l._)("div",null,[(0,l._)("h3",re,[(0,l.WI)(t.$slots,"title")]),(0,l._)("span",de,[(0,l.WI)(t.$slots,"subtitle")])]),(0,l.Wm)((0,n.SU)(oe()),{min:e.setting.min,max:e.setting.max,interval:e.setting.step,duration:.2,"tooltip-formatter":e=>s(e),"tooltip-style":{},modelValue:i.value,"onUpdate:modelValue":a[0]||(a[0]=e=>i.value=e),modelModifiers:{lazy:!0}},null,8,["min","max","interval","tooltip-formatter","modelValue"])]))}};const me=ce;var pe=me,ve=a(3390),ge=a(5472);const fe=["active"],he=["active"];var be={__name:"BottomSheet",props:["active","handle"],emits:["update:active"],setup(e,{emit:t}){const a=e,i=()=>{t("update:active",!1)};return(t,n)=>((0,l.wg)(),(0,l.iD)(l.HY,null,[(0,l._)("div",{class:"scrim",active:a.active,onClick:i},null,8,fe),(0,l._)("div",{class:"bottom-sheet",active:a.active},[e.handle?((0,l.wg)(),(0,l.iD)("div",{key:0,class:"bottom-sheet-handle",onClick:i})):(0,l.kq)("",!0),(0,l.WI)(t.$slots,"content")],8,he)],64))}};const ke=be;var we=ke;const _e={class:"setting color-picker"},ye={class:"setting-title"},je={class:"setting-subtitle"},Ie={class:"swatches-wrapper"},Se=["onClick","data-state"],We=["data-state"],Ue=(0,l._)("span",{class:"supporting-text"},"Kleur kiezen",-1),Ve=(0,l._)("span",null,"Pipet",-1);var De={__name:"ColorPicker",props:["modelValue","id"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,o=(0,l.Fl)({get(){return a.modelValue||u[0]},set(e){t("update:modelValue",ve.w$.toHSLObject(e))}}),u=[{h:207,s:95,l:55},{h:161,s:51,l:41},{h:90,s:41,l:41},{h:40,s:51,l:41},{h:1,s:51,l:41},{h:341,s:61,l:41},{h:290,s:41,l:41},{h:240,s:41,l:41}],r=window.EyeDropper;let d=(0,n.iH)(!1);function c(e,t){return Math.abs(e.h-t.h)<1&&Math.abs(e.s-t.s)<1&&Math.abs(e.l-t.l)<1}function p(){const e=new EyeDropper;d.value=!1,e.open().then((e=>{o.value=e.sRGBHex}))}return(e,t)=>((0,l.wg)(),(0,l.iD)("div",_e,[(0,l._)("div",null,[(0,l._)("h3",ye,[(0,l.WI)(e.$slots,"title")]),(0,l._)("span",je,[(0,l.WI)(e.$slots,"subtitle")])]),(0,l._)("div",Ie,[((0,l.wg)(),(0,l.iD)(l.HY,null,(0,l.Ko)(u,((e,t)=>(0,l._)("button",{key:t,class:"swatch",style:(0,s.j5)({"--h":e.h,"--s":e.s,"--l":e.l}),onClick:t=>o.value=e,"data-state":c(o.value,e)},[(0,l.Wm)(i.uT,{name:"swatch-check"},{default:(0,l.w5)((()=>[c(o.value,e)?((0,l.wg)(),(0,l.j4)(m,{key:0},{default:(0,l.w5)((()=>[(0,l.Uk)("check")])),_:1})):(0,l.kq)("",!0)])),_:2},1024)],12,Se))),64)),(0,l._)("button",{class:"custom-swatch",style:(0,s.j5)({"--h":o.value.h,"--s":o.value.s,"--l":o.value.l}),onClick:t[0]||(t[0]=e=>(0,n.dq)(d)?d.value=!(0,n.SU)(d):d=!(0,n.SU)(d)),"data-state":u.every((e=>!c(o.value,e)))},[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("palette")])),_:1})],12,We)]),(0,l.Wm)(we,{active:(0,n.SU)(d),"onUpdate:active":t[2]||(t[2]=e=>(0,n.dq)(d)?d.value=e:d=e),activeModifiers:{lazy:!0},handle:!0},{content:(0,l.w5)((()=>[Ue,(0,l.Wm)((0,n.SU)(ge.z),{"is-widget":"","picker-type":"chrome","disable-history":"","disable-alpha":"",lang:"En","pure-color":o.value,"onUpdate:pureColor":t[1]||(t[1]=e=>o.value=e),"pure-colorModifiers":{lazy:!0}},null,8,["pure-color"]),(0,n.SU)(r)?((0,l.wg)(),(0,l.iD)("button",{key:0,class:"bottom-sheet-action",onClick:p},[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("colorize")])),_:1}),Ve])):(0,l.kq)("",!0)])),_:1},8,["active"])]))}};const ze=De;var Ce=ze;const xe={class:"setting key-picker",ref:"label"},Ee={class:"setting-title"},Le={class:"setting-subtitle"},$e=(0,l._)("span",{class:"supporting-text"},"Druk op een toets",-1);var He={__name:"KeyPicker",props:["modelValue","id"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,i=(0,l.Fl)({get(){return a.modelValue},set(e){t("update:modelValue",e)}});let o=(0,n.iH)(!1),u=(0,n.iH)(!1);function r(){o.value=!0,document.addEventListener("keydown",(e=>{o.value&&(i.value=e.key,u.value=!0,setTimeout((()=>{o.value=!1,u.value=!1}),1e3))}),{once:!0})}function d(e){return e?" "===e?"Spatie":e.charAt(0).toUpperCase()+e.slice(1):e}return(e,t)=>((0,l.wg)(),(0,l.iD)("div",xe,[(0,l._)("div",{class:"key-picker-click-layer",onClick:r},[(0,l._)("div",null,[(0,l._)("h3",Ee,[(0,l.WI)(e.$slots,"title")]),(0,l._)("span",Le,[(0,l.WI)(e.$slots,"subtitle"),(0,l.Uk)(" ("+(0,s.zw)(d(i.value))+") ",1)])]),(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("chevron_right")])),_:1})]),(0,l.Wm)(we,{active:(0,n.SU)(o),"onUpdate:active":t[0]||(t[0]=e=>(0,n.dq)(o)?o.value=e:o=e),handle:!0},{content:(0,l.w5)((()=>[$e,(0,l._)("span",{class:(0,s.C_)(["key-picker-selected",{selected:(0,n.SU)(u)}])},(0,s.zw)(d(i.value)),3)])),_:1},8,["active"])],512))}};const Te=He;var qe=Te;const Me={class:"setting image-input",ref:"label"},Fe=["src"],Pe={key:1,class:"image-input-avatar"},Oe={class:"setting-title"},Ae={class:"setting-subtitle"},Be=(0,l._)("span",{class:"supporting-text"},"Gekozen afbeelding",-1),Ke={class:"image-wrapper"},Ne=["src"],Ye={key:1,class:"image-picker-selected"},Ge={class:"supporting-text"},Re=(0,l._)("br",null,null,-1),Ze=(0,l._)("div",{class:"what-next"},[(0,l.Uk)(" Afbeelding plakken "),(0,l._)("span",{class:"keybind"},"Ctrl"),(0,l._)("span",{class:"keybind"},"V")],-1),Xe=["id"],Je=(0,l._)("span",null,"Afbeelding uploaden",-1),Qe=56,et=.3;var tt={__name:"ImageInput",props:["modelValue","id"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,i=(0,l.Fl)({get(){return a.modelValue},set(e){t("update:modelValue",e)}}),o=(0,n.iH)(null);let u=(0,n.iH)(!1),r=(0,n.iH)(!1);function d(){u.value=!0,document.addEventListener("paste",(e=>{u.value&&(o.value.files=e.clipboardData.files,c())}),{once:!0})}function c(){const e=o.value.files[0];if(e){const t=new FileReader;t.onload=function(){const e=new Image;e.onload=function(){const t=document.createElement("canvas"),a=t.getContext("2d");t.width=Qe,t.height=Qe,a.drawImage(e,0,0,Qe,Qe),i.value=t.toDataURL("image/webp",et)||t.toDataURL("image/jpeg",et),r.value=!0},e.src=t.result,setTimeout((()=>{u.value=!1,r.value=!1}),1e3)},t.readAsDataURL(e)}}return(t,a)=>((0,l.wg)(),(0,l.iD)("div",Me,[(0,l._)("div",{class:"image-input-click-layer",onClick:d},[i.value?((0,l.wg)(),(0,l.iD)("img",{key:0,class:(0,s.C_)(["image-input-avatar",{selected:(0,n.SU)(r)}]),src:i.value,width:"40",height:"40"},null,10,Fe)):((0,l.wg)(),(0,l.iD)("div",Pe,[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("add_photo_alternate")])),_:1})])),(0,l._)("div",null,[(0,l._)("h3",Oe,[(0,l.WI)(t.$slots,"title")]),(0,l._)("span",Ae,[(0,l.WI)(t.$slots,"subtitle")])]),(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("chevron_right")])),_:1})]),(0,l.Wm)(we,{active:(0,n.SU)(u),"onUpdate:active":a[1]||(a[1]=e=>(0,n.dq)(u)?u.value=e:u=e),handle:!0},{content:(0,l.w5)((()=>[Be,(0,l._)("div",Ke,[i.value?((0,l.wg)(),(0,l.iD)("img",{key:0,class:(0,s.C_)(["image-picker-selected",{selected:(0,n.SU)(r)}]),src:i.value,width:"56",height:"56"},null,10,Ne)):((0,l.wg)(),(0,l.iD)("div",Ye,[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("add_photo_alternate")])),_:1})])),(0,l._)("span",Ge,[(0,l.Uk)((0,s.zw)((i.value||"").length.toLocaleString("nl-NL"))+" bytes",1),Re,(0,l.Uk)("De afbeelding is verkleind en gecomprimeerd, maar het effect is op Magister niet merkbaar.")])]),Ze,(0,l._)("input",{type:"file",id:e.id,ref_key:"input",ref:o,accept:"image/*",onChange:c},null,40,Xe),(0,l._)("button",{class:"bottom-sheet-action",onClick:a[0]||(a[0]=e=>o.value.click())},[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("drive_folder_upload")])),_:1}),Je])])),_:1},8,["active"])],512))}};const at=tt;var it=at;const lt={class:"chip-label"},nt=(0,l._)("div",{class:"state-layer chip-state-layer"},null,-1);var st={__name:"Chip",props:["type"],setup(e){const t=e;return(e,a)=>((0,l.wg)(),(0,l.iD)("button",{class:(0,s.C_)(["chip",t.type||"assist"])},[(0,l.Wm)(m,{class:"chip-icon"},{default:(0,l.w5)((()=>[(0,l.WI)(e.$slots,"icon")])),_:3}),(0,l._)("span",lt,[(0,l.WI)(e.$slots,"label")]),nt],2))}};const ot=st;var ut=ot;const rt=["active","tabindex"],dt=["scrolled"],ct={class:"fullscreen-dialog-title"},mt={class:"fullscreen-dialog-actions"};var pt={__name:"DialogFullscreen",props:["active","fullscreen"],emits:["update:active"],setup(e,{emit:t}){const a=e,i=()=>{t("update:active",!1)},s=(0,n.iH)(null),{y:u}=(0,o.vO3)(s);return(e,t)=>((0,l.wg)(),(0,l.iD)("div",{class:"fullscreen-dialog",active:a.active,tabindex:a.active?0:-1},[(0,l._)("div",{class:"fullscreen-dialog-header",scrolled:(0,n.SU)(u)>16},[(0,l._)("button",{class:"fullscreen-dialog-close",onClick:i},[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("close")])),_:1})]),(0,l._)("h2",ct,[(0,l.WI)(e.$slots,"headline")]),(0,l._)("div",mt,[(0,l.WI)(e.$slots,"buttons")])],8,dt),(0,l._)("span",{class:"fullscreen-dialog-content",ref_key:"content",ref:s},[(0,l.WI)(e.$slots,"content")],512)],8,rt))}};const vt=pt;var gt=vt;const ft={class:"inline-setting"},ht=(0,l._)("br",null,null,-1),bt=(0,l._)("br",null,null,-1),kt=(0,l._)("div",{class:"subject-example"},[(0,l._)("span",null,"Weergavenaam vak"),(0,l._)("span",null,"Aliassen")],-1),wt=["value","onInput"],_t=["value","onInput"],yt=["onClick"];var jt={__name:"SubjectEditor",props:["modelValue"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,s=(0,l.Fl)({get(){return"object"===typeof a.modelValue?Object.values(a.modelValue):a.modelValue},set(e){t("update:modelValue",e)}}),o=(0,n.iH)(!1);function u(e){let t=[...s.value];t.splice(e,1),s.value=t}function r(e,t){let a=[...s.value];a[e]=t,s.value=a}return(e,t)=>((0,l.wg)(),(0,l.iD)("div",ft,[(0,l.Wm)(ut,{onClick:t[0]||(t[0]=e=>o.value=!0)},{icon:(0,l.w5)((()=>[(0,l.Uk)("edit_note")])),label:(0,l.w5)((()=>[(0,l.WI)(e.$slots,"title")])),_:3}),(0,l.Wm)(gt,{fullscreen:"",active:o.value,"onUpdate:active":t[2]||(t[2]=e=>o.value=e)},{headline:(0,l.w5)((()=>[(0,l.WI)(e.$slots,"title")])),content:(0,l.w5)((()=>[(0,l.WI)(e.$slots,"subtitle"),ht,bt,kt,(0,l.Wm)(i.W3,{name:"editor",tag:"ul",class:"subjects-list"},{default:(0,l.w5)((()=>[((0,l.wg)(!0),(0,l.iD)(l.HY,null,(0,l.Ko)(s.value,((e,t)=>((0,l.wg)(),(0,l.iD)("li",{key:t,class:"subject-wrapper"},[(0,l._)("input",{class:"text-input",type:"input",value:s.value[t].name,onInput:e=>r(t,{name:e.target.value,aliases:s.value[t].aliases}),placeholder:" ",autocomplete:"off",spellcheck:"false"},null,40,wt),(0,l._)("input",{class:"text-input",type:"input",value:s.value[t].aliases,onInput:e=>r(t,{name:s.value[t].name,aliases:e.target.value}),placeholder:" ",autocomplete:"off",spellcheck:"false"},null,40,_t),(0,l._)("button",{class:"period-remove",onClick:e=>u(t)},[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("delete")])),_:1})],8,yt)])))),128))])),_:1})])),buttons:(0,l.w5)((()=>[(0,l._)("button",{onClick:t[1]||(t[1]=e=>s.value=[...s.value,{name:"",aliases:""}])},"Toevoegen")])),_:3},8,["active"])]))}};const It=jt;var St=It;const Wt={class:"inline-setting"},Ut=(0,l._)("br",null,null,-1),Vt=(0,l._)("br",null,null,-1),Dt={class:"period-index"},zt=(0,l._)("span",{class:"period-interfix"},"week",-1),Ct=["value","onInput"],xt=(0,l._)("span",{class:"period-interfix"},"tot",-1),Et={class:"period-end"},Lt=["onClick"];var $t={__name:"PeriodEditor",props:["modelValue"],emits:["update:modelValue"],setup(e,{emit:t}){const a=e,o=(0,l.Fl)({get(){return"object"===typeof a.modelValue?Object.values(a.modelValue):a.modelValue},set(e){console.log(e),t("update:modelValue",e)}}),u=(0,n.iH)(!1);function r(e){let t=[...o.value];t.splice(e,1),o.value=t}function d(e,t){let a=[...o.value];a[e]=t,o.value=a}return(e,t)=>((0,l.wg)(),(0,l.iD)("div",Wt,[(0,l.Wm)(ut,{onClick:t[0]||(t[0]=e=>u.value=!0)},{icon:(0,l.w5)((()=>[(0,l.Uk)("edit_calendar")])),label:(0,l.w5)((()=>[(0,l.WI)(e.$slots,"title")])),_:3}),(0,l.Wm)(gt,{fullscreen:"",active:u.value,"onUpdate:active":t[2]||(t[2]=e=>u.value=e)},{headline:(0,l.w5)((()=>[(0,l.WI)(e.$slots,"title")])),content:(0,l.w5)((()=>[(0,l.WI)(e.$slots,"subtitle"),Ut,Vt,(0,l.Wm)(i.W3,{name:"editor",tag:"ul",class:"periods-list"},{default:(0,l.w5)((()=>[((0,l.wg)(!0),(0,l.iD)(l.HY,null,(0,l.Ko)(o.value,((e,t)=>((0,l.wg)(),(0,l.iD)("li",{key:t+1,class:"period-wrapper"},[(0,l._)("span",Dt,"Periode "+(0,s.zw)(t+1),1),zt,(0,l._)("input",{class:"text-input",type:"number",value:o.value[t],onInput:e=>d(t,Number(e.target.value)),placeholder:" ",autocomplete:"off",min:"1",max:"52"},null,40,Ct),xt,(0,l._)("span",Et,(0,s.zw)(o.value[(t+1)%o.value.length]||"?"),1),(0,l._)("button",{class:"period-remove",onClick:e=>r(t)},[(0,l.Wm)(m,null,{default:(0,l.w5)((()=>[(0,l.Uk)("delete")])),_:1})],8,Lt)])))),128))])),_:1})])),buttons:(0,l.w5)((()=>[(0,l._)("button",{onClick:t[1]||(t[1]=e=>o.value=[...o.value,void 0])},"Toevoegen")])),_:3},8,["active"])]))}};const Ht=$t;var Tt=Ht;const qt={id:"about"};function Mt(e,t){return(0,l.wg)(),(0,l.iD)("div",qt," This is the about section! ")}var Ft=a(89);const Pt={},Ot=(0,Ft.Z)(Pt,[["render",Mt]]);var At=Ot;const Bt={id:"options-container"};var Kt={__name:"App",setup(e){const t=(0,n.iH)(null),{y:a}=(0,o.vO3)(t),d=r(),c={SwitchInput:P,SegmentedButton:X,TextInput:ne,SlideInput:pe,ColorPicker:Ce,KeyPicker:qe,ImageInput:it,SubjectEditor:St,PeriodEditor:Tt};let m=(0,n.iH)("appearance"),p=(0,n.iH)("");function v(e){let t=!0;return e?.conditions&&e.conditions.forEach((e=>{let a;switch(e.settingId&&(a=d.value[e.settingId]),e.operator){case"equal":a!==e.value&&(t=!1);break;case"not equal":a===e.value&&(t=!1);break;case"defined":a||(t=!1);break}})),t}function g(){u.forEach((e=>{e.settings.forEach((e=>{d.value[e.id]=e.default}))}))}function f(e){t.value.scrollTo({top:0,left:0,behavior:e?"instant":"smooth"})}function h(e){window.open(e,"_blank","noreferrer")}return setTimeout((()=>{p.value="list"}),200),(e,o)=>((0,l.wg)(),(0,l.iD)(l.HY,null,[(0,l.Wm)(W,{scrolled:(0,n.SU)(a)>16,onResetSettings:g},null,8,["scrolled"]),(0,l._)("main",{id:"main",ref_key:"main",ref:t},[(0,l._)("div",Bt,[(0,l.wy)((0,l.Wm)(At,{key:"about"},null,512),[[i.F8,"about"===(0,n.SU)(m)]]),((0,l.wg)(!0),(0,l.iD)(l.HY,null,(0,l.Ko)((0,n.SU)(u),(e=>(0,l.wy)(((0,l.wg)(),(0,l.j4)(i.W3,{tag:"div",name:(0,n.SU)(p),mode:"out-in",key:e.id},{default:(0,l.w5)((()=>[((0,l.wg)(!0),(0,l.iD)(l.HY,null,(0,l.Ko)(e.settings,(e=>(0,l.wy)(((0,l.wg)(),(0,l.iD)("div",{class:(0,s.C_)(["setting-wrapper",{visible:v(e)}]),key:e.id},[((0,l.wg)(),(0,l.j4)((0,l.LL)(c[e.type||"SwitchInput"]),{setting:e,id:e.id,modelValue:(0,n.SU)(d)[e.id],"onUpdate:modelValue":t=>(0,n.SU)(d)[e.id]=t},{title:(0,l.w5)((()=>[(0,l.Uk)((0,s.zw)(e.title),1)])),subtitle:(0,l.w5)((()=>[(0,l.Uk)((0,s.zw)(e.subtitle),1)])),_:2},1032,["setting","id","modelValue","onUpdate:modelValue"])),((0,l.wg)(!0),(0,l.iD)(l.HY,null,(0,l.Ko)(e.links,(e=>((0,l.wg)(),(0,l.j4)(ut,{key:e.label,onClick:t=>h(e.href)},{icon:(0,l.w5)((()=>[(0,l.Uk)((0,s.zw)(e.icon),1)])),label:(0,l.w5)((()=>[(0,l.Uk)((0,s.zw)(e.label),1)])),_:2},1032,["onClick"])))),128))],2)),[[i.F8,v(e)]]))),128))])),_:2},1032,["name"])),[[i.F8,e.id===(0,n.SU)(m)]]))),128))])],512),(0,l.Wm)(x,{modelValue:(0,n.SU)(m),"onUpdate:modelValue":o[0]||(o[0]=e=>(0,n.dq)(m)?m.value=e:m=e),onScrollToTop:f},null,8,["modelValue"])],64))}};const Nt=Kt;var Yt=Nt;(0,i.ri)(Yt).mount("#app")}},t={};function a(i){var l=t[i];if(void 0!==l)return l.exports;var n=t[i]={exports:{}};return e[i].call(n.exports,n,n.exports,a),n.exports}a.m=e,function(){var e=[];a.O=function(t,i,l,n){if(!i){var s=1/0;for(d=0;d<e.length;d++){i=e[d][0],l=e[d][1],n=e[d][2];for(var o=!0,u=0;u<i.length;u++)(!1&n||s>=n)&&Object.keys(a.O).every((function(e){return a.O[e](i[u])}))?i.splice(u--,1):(o=!1,n<s&&(s=n));if(o){e.splice(d--,1);var r=l();void 0!==r&&(t=r)}}return t}n=n||0;for(var d=e.length;d>0&&e[d-1][2]>n;d--)e[d]=e[d-1];e[d]=[i,l,n]}}(),function(){a.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return a.d(t,{a:t}),t}}(),function(){a.d=function(e,t){for(var i in t)a.o(t,i)&&!a.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:t[i]})}}(),function(){a.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){var e={143:0};a.O.j=function(t){return 0===e[t]};var t=function(t,i){var l,n,s=i[0],o=i[1],u=i[2],r=0;if(s.some((function(t){return 0!==e[t]}))){for(l in o)a.o(o,l)&&(a.m[l]=o[l]);if(u)var d=u(a)}for(t&&t(i);r<s.length;r++)n=s[r],a.o(e,n)&&e[n]&&e[n][0](),e[n]=0;return a.O(d)},i=self["webpackChunkstudy_tools_popup"]=self["webpackChunkstudy_tools_popup"]||[];i.forEach(t.bind(null,0)),i.push=t.bind(null,i.push.bind(i))}();var i=a.O(void 0,[998],(function(){return a(3430)}));i=a.O(i)})();
//# sourceMappingURL=app.aaccfc8e.js.map