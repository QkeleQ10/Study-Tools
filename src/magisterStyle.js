document.addEventListener('DOMContentLoaded', applyStyles)

async function shiftedHslColor(hueOriginal = 207, saturationOriginal = 95, luminanceOriginal = 55, hueWish = 0, saturationWish = 0, luminanceWish = 0, hueForce, saturationForce, luminanceForce) {
    return new Promise((resolve, reject) => {
        let hue, saturation, luminance

        if (hueForce) hue = hueForce
        else if (hueWish <= 207) hue = (hueOriginal / 207) * hueWish
        else if (hueWish > 207) {
            let a = (((360 - hueOriginal) / (360 - 207))),
                b = hueOriginal - a * 207
            hue = a * hueWish + b
        }

        if (saturationForce) saturation = saturationForce
        else if (saturationWish <= 95) saturation = (saturationOriginal / 95) * saturationWish
        else if (saturationWish > 95) {
            let a = (((100 - saturationOriginal) / (100 - 95))),
                b = saturationOriginal - a * 95
            saturation = a * saturationWish + b
        }

        if (luminanceForce) luminance = luminanceForce
        else if (luminanceWish <= 55) luminance = (luminanceOriginal / 55) * luminanceWish
        else if (luminanceWish > 55) {
            let a = (((100 - luminanceOriginal) / (100 - 55))),
                b = luminanceOriginal - a * 55
            luminance = a * luminanceWish + b
        }

        resolve(`hsl(${hue}, ${saturation}%, ${luminance}%)`)
    })
}

async function applyStyles() {
    const hueWish = await getSetting('magister-css-hue'),
        saturationWish = await getSetting('magister-css-saturation'),
        luminanceWish = await getSetting('magister-css-luminance')

    let lightThemeCss = `:root {
    --st-widget-heading-font: 600 16px/44px 'arboria', sans-serif;
    --st-secondary-font-family: 'open-sans', sans-serif;
    --st-body-background: #ffffff;
    --st-primary-background: #ffffff;
    --st-inactive-background: #f5f5f5;
    --st-overlay-background: #fffffff5;
    --st-highlight-background: ${await shiftedHslColor(207, 78, 96, hueWish, saturationWish, luminanceWish, undefined, undefined, 96)};
    --st-highlight-ok: #81e3bc;
    --st-highlight-warn: #fff0f5;
    --st-highlight-info: #dceefd;
    --st-total-background: #cdf4cd;
    --st-primary-color: #333333;
    --st-insignificant-color: #888;
    --st-primary-border-color: #e7e7e7;
    --st-widget-border: 1px solid var(--st-primary-border-color);
    --st-widget-border-radius: 8px;
    --st-widget-edges-box-shadow: none;
    --st-a-color: ${await shiftedHslColor(207, 78, 43, hueWish, saturationWish, luminanceWish, undefined, undefined, 43)};
    --st-accent-primary: ${await shiftedHslColor(207, 95, 55, hueWish, saturationWish, luminanceWish)};
    --st-accent-secondary: ${await shiftedHslColor(207, 95, 47, hueWish, saturationWish, luminanceWish)};
    --st-accent-ok: #00965a;
    --st-accent-warn: #e94f4f;
    --st-accent-info: #016695;
    --st-hover-brightness: .8;
}`,
        darkThemeCss = `:root {
    --st-widget-heading-font: 600 16px/44px 'arboria', sans-serif;
    --st-secondary-font-family: 'open-sans', sans-serif;
    --st-body-background: #121212;
    --st-primary-background: #161616;
    --st-inactive-background: #0c0c0c;
    --st-overlay-background: #121212f5;
    --st-highlight-background: ${await shiftedHslColor(207, 33, 10, hueWish, saturationWish, luminanceWish, undefined, undefined, 10)};
    --st-highlight-ok: #1a4c38;
    --st-highlight-warn: #511f1f;
    --st-highlight-info: #101a22;
    --st-total-background: #2f462f;
    --st-primary-color: #fff;
    --st-insignificant-color: #888;
    --st-primary-border-color: #333;
    --st-widget-border: 1px solid var(--st-primary-border-color);
    --st-widget-border-radius: 8px;
    --st-widget-edges-box-shadow: none;
    --st-a-color: ${await shiftedHslColor(207, 53, 55, hueWish, saturationWish, luminanceWish, undefined, undefined, 55)};
    --st-accent-primary: ${await shiftedHslColor(207, 63, 25, hueWish, saturationWish, luminanceWish)};
    --st-accent-secondary: ${await shiftedHslColor(207, 63, 17, hueWish, saturationWish, luminanceWish)};
    --st-accent-ok: #00965a;
    --st-accent-warn: #e94f4f;
    --st-accent-info: #016695;
    --st-hover-brightness: 1.4;
    color-scheme: dark;
}`,
        invertCss = `
    .user-content, .content-auto.background-white {
        filter: invert(1) hue-rotate(180deg);
    }

    .user-content ul, .user-content font, .user-content span, .user-content p, .block .content .user-content p, #opdracht-detail .list li.onecol p {
        color: #000;
    }
    
    .user-content iframe:not(:fullscreen), .user-content img {
        filter: invert(1) hue-rotate(180deg);
    }
    
    .content-auto.background-white {
        background: #fff !important;
        color: #000 !important;
    }`,
        rootVars = `${lightThemeCss}
${await getSetting('magister-css-dark-auto') ? '@media (prefers-color-scheme: dark) {' : ''}
${await getSetting('magister-css-dark') ? darkThemeCss : ''}
${await getSetting('magister-css-dark-invert') ? invertCss : ''}
${await getSetting('magister-css-dark-auto') ? '}' : ''}`

    createStyle(rootVars + `
#st-snackbars > div {
    font: 16px arboria, sans-serif;
    background-color: var(--st-primary-background);
    color: var(--st-primary-color);
    border: var(--st-widget-border);
    border-radius: var(--st-widget-border-radius);
}

.st-button {
    height: 32px;
    padding: 6px 16px;
    background: var(--st-accent-primary);
    font-family: var(--st-secondary-font-family);
    font-size: 14px;
    font-weight: 600;
    border: none;
    outline: none;
    border-radius: var(--st-widget-border-radius);
    color: #fff;
    cursor: pointer;
    transition: filter 200ms, transform 200ms;
}

.st-button:hover, .st-button:focus {
    filter: brightness(var(--st-hover-brightness));
}

.st-button:active {
    transform: scale(.9);
}

.st-button[data-icon]:before {
    content: attr(data-icon);
    font-family: 'Font Awesome 5 Pro';
    font-weight: 500;
    font-size: 18px;
    vertical-align: -2px;
    margin-right: 10px;
}

.st-button[disabled] {
    pointer-events: none;
    opacity: .5;
}

.st-sw-subject,
.st-sw-subject>button {
    background-color: var(--st-primary-background)
}

#st-appbar-week,
.st-current,
.st-sw-2 {
    font-weight: 700
}

#st-vd-schedule>ul>li[data-current],
.st-sw-subject>button:first-child {
    background: var(--st-highlight-background)
}

#st-appbar-week {
    color: #fff;
    font-family: arboria, sans-serif;
    font-size: 16px;
    text-align: center;
    opacity: .5
}

#st-sw-container {
    display: none;
    height: 100%;
    overflow-y: auto
}

#st-sw-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16em, 1fr));
    gap: 1em;
    align-content: start;
    padding: 1px
}

.st-sw-subject {
    display: grid;
    grid-template-rows: 4.5rem;
    align-items: stretch;
    border-radius: var(--st-widget-border-radius);
    border: var(--st-widget-border);
    overflow: hidden
}

.st-sw-subject>button {
    position: relative;
    outline: 0;
    border: none;
    color: var(--st-primary-color);
    cursor: pointer;
    transition: filter 200ms;
}

.st-sw-subject>button:first-child {
    height: 4.5rem;
    font-size: 19px;
    font-family: open-sans, sans-serif;
    border-bottom: var(--st-widget-border)
}

.st-sw-subject>button:not(:first-child) {
    min-height: 1.75rem;
    font-size: 1.1em;
    font-family: open-sans, sans-serif
}

.st-sw-subject>button:not(:first-child):hover:after {
    position: absolute;
    max-height: 100%;
    width: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--st-primary-background);
    font-size: 10px;
    content: attr(data-title);
    padding: 3px
}

.st-obsolete,
.st-obsolete span,
.st-sw-0 {
    color: #888 !important
}

.st-sw-compact {
    grid-template-rows: auto !important;
    font-size: 10px
}

.st-sw-compact>button:first-child {
    height: auto !important;
    font-size: 1.5em;
    padding: 5px 0
}

.st-current:hover,
.st-obsolete:hover,
.st-sw-selected,
.st-sw-subject:has(.st-sw-selected)>button:first-child,
.st-sw-subject>button:hover {
    filter: brightness(var(--st-hover-brightness))
}

.st-current-sw>div>div>footer.endlink,
.st-current-sw>div>h3,
.st-current-sw>div>h3>b {
    background: var(--st-highlight-background);
    font-weight: 700
}

@media (min-width:1400px) {
    #st-sw-grid {
        grid-template-columns: repeat(auto-fit, minmax(20em, 1fr))
    }
}`, 'study-tools-mandatory')

    if (await getSetting('magister-css-experimental')) {
        createStyle(`.block h3,
.block h4 {
    border-bottom: var(--st-widget-border)
}

.block h4,
footer.endlink {
    box-shadow: var(--st-widget-edges-box-shadow);
    border-top: var(--st-widget-border)
}

body,
html {
    height: 100vh;
    box-sizing: border-box;
}

.k-block,
.k-widget,
body,
div.loading-overlay,
input[type=checkbox]+label span {
    background: var(--st-body-background)
}

.block h3 b {
    font: var(--st-widget-heading-font);
    color: var(--st-primary-color)
}

.block,
.content-container,
.studiewijzer-onderdeel>div.block>div.content:not(#studiewijzer-detail-container div, #studiewijzer-detail-container ul),
#cijfers-container .main div.content-container-cijfers {
    border: var(--st-widget-border);
    border-radius: var(--st-widget-border-radius)
}

.content.content-auto.background-white li>span,
.content.content-auto.background-white li>strong {
    color: #000
}

.agenda-text-icon,
.k-scheduler-weekview .k-scheduler-table .k-today,
.k-scheduler-workWeekview .k-scheduler-table .k-today,
.ng-scope td.vrijstelling,
.versions li.selected,
.versions li:hover,
.k-scheduler .k-event.k-state-selected,
.alert,
.k-dropdown .k-dropdown-wrap.k-state-active,
.projects li.selected,
.agenda-lesdashboard aside .agenda-list li a.current {
    background: var(--st-highlight-background) !important;
    background-color: var(--st-highlight-background) !important
}

.agenda-text-icon[icon-type=ok] {
    background: var(--st-accent-ok) !important
}

#studiewijzer-detail-container .content>ul.sources,
#studiewijzer-detail-container .studiewijzer-onderdeel div.content.coloring-blauw .sources li ul,
.block,
.block .content,
.block .content form,
.block h4,
.k-dropdown .k-dropdown-wrap.k-state-default,
.k-dropdown .k-dropdown-wrap.k-state-hover,
.k-grouping-row td,
.k-header,
.k-multiselect .k-button,
.k-multiselect-wrap,
.k-resize-handle-inner,
div[role=gridcell],
.k-scheduler .k-event,
.k-scheduler .k-event:hover,
.k-scheduler-dayview .k-scheduler-table .k-nonwork-hour,
.k-scheduler-weekview .k-scheduler-table .k-nonwork-hour,
.k-scheduler-workWeekview .k-scheduler-table .k-nonwork-hour,
.sm-grid.k-grid .k-grid-content tr,
.sm-grid.k-grid .k-grid-content tr.k-state-selected,
.sm-grid.k-grid .k-grid-content tr.k-state-selected .k-state-focused,
.sm-grid.k-grid .k-grid-content tr.k-state-selected.k-state-focused,
.sm-grid.k-grid .k-grid-content tr:hover,
.sources li:hover,
.studiewijzer-onderdeel>div.block>div.content,
.widget .list li.active,
.widget .list li.no-data a:hover,
.widget .list li.no-data:hover,
.widget .list li:hover,
.widget li,
aside .block .content,
dl.list-dl,
footer.endlink,
table.table-grid-layout th,
td.k-group-cell, #studiewijzer-container div.studiewijzer-list>ul>li, #studiewijzer-container div.studiewijzer-list div.head, #studiewijzer-container div.studiewijzer-list>ul>li:hover, .projects li:hover,
.collapsed-menu .popup-menu,
.collapsed-menu #faux-label,
.appbar .menu-button>a:hover>span,
.collapsed-menu .popup-menu ul li a:hover,
.toast,
.alert-toast i,
#vandaag-container .grade-widget ul,
.cijfers-k-grid.k-grid .k-grid-header th.k-header {
    background: var(--st-primary-background)
}

.block h3, #studiewijzer-container div.studiewijzer-list div.head,
table.table-grid-layout th {
    box-shadow: var(--st-widget-edges-box-shadow)
}

footer.endlink {
    border-radius: 0 0 8px 8px
}

a:not(.user-content a, .st-button), table.table-grid-layout td a {
    color: var(--st-a-color);
    text-decoration: none;
    overflow-wrap: anywhere
}

.collapsed-menu .popup-menu h3,
.collapsed-menu #faux-label,
.appbar .menu-button>a:hover>span,
.collapsed-menu .popup-menu ul li a:hover {
    color: var(--st-a-color);
}

.alert a:hover,
.k-dropdown .k-dropdown-wrap.k-state-hover,
.k-scheduler-dayview .k-scheduler-header .k-scheduler-table th,
.k-scheduler-weekview .k-scheduler-header .k-scheduler-table th,
.k-scheduler-workWeekview .k-scheduler-header .k-scheduler-table th,
table.table-grid-layout tr:hover,
.k-grid-header,
#cijfers-container aside .widget .cijfer-berekend tr, form .radio input[type=radio]~label, fieldset .radio input[type=radio]~label {
    background-color: var(--st-primary-background) !important;
    box-shadow: none !important
}

table.table-grid-layout tr, table.table-grid-layout td,
#cijfers-container .main div.content-container-cijfers {
    background-color: var(--st-primary-background) !important;
    color: var(--st-primary-color)
}

table,
table.table-grid-layout td,  {
    background: var(--st-body-background) !important;
    color: var(--st-primary-color);
    border-color: var(--st-primary-border-color) !important
}

.k-grid-header,
.k-multiselect .k-button,
.k-multiselect.k-header,
.widget li,
dl.list-dl dd,
dl.list-dl dt,
table *, #studiewijzer-container div.studiewijzer-list>ul>li, #studiewijzer-container div.studiewijzer-list div.head, #studiewijzer-container div.studiewijzer-list>ul>li>a>span, #studiewijzer-container div.studiewijzer-list div.head span:first-child, 
form .radio input[type=radio]~label, fieldset .radio input[type=radio]~label,
.k-dropdown .k-dropdown-wrap.k-state-default,
.projects li.selected, .projects li:hover,
.studiewijzer-onderdeel div.content ul>li,
table.table-grid-layout,
input[type=checkbox]+label span, 
.collapsed-menu .popup-menu,
.collapsed-menu #faux-label,
.appbar .menu-button>a:hover>span,
#vandaag-container .grade-widget ul,
.widget .dualcolumn-list li,
#cijfers-container .main div.content-container-cijfers {
    border-color: var(--st-primary-border-color) !important;
    outline-color: var(--st-primary-border-color) !important
}

.collapsed-menu .popup-menu::after,
.collapsed-menu li:hover span::after,
.appbar .menu-button>a:hover>span::after {
    border-right: 5px solid var(--st-primary-border-color) !important;
    left: -5px;
}

ul:not(.main-menu)>li:has(a):not(:has(.content)):hover,
.k-dropdown-wrap.k-state-hover,
.k-scheduler .k-event:hover,
.sm-grid.k-grid .k-grid-content tr:hover,
.sources li:hover,
.widget .list li.active,
.widget .list li.no-data a:hover,
.widget .list li.no-data:hover,
.widget .list li:hover,
table.table-grid-layout tr:hover, #st-vd-schedule>ul>li:hover,
.k-dropdown .k-dropdown-wrap.k-state-active,
input[type=radio]~label:hover,
.collapsed-menu .popup-menu ul li a:hover {
    filter: brightness(var(--st-hover-brightness));
    transition: filter 200ms, transform 200ms;
}

.widget .list li.no-data a:hover,
.widget .list li.no-data:hover {
    cursor: default
}

.tabs,
.widget .list {
    border-bottom: var(--st-widget-border)
}

.widget .list li {
    border-top: var(--st-widget-border)
}

.sm-grid.k-grid .k-grid-content tr {
    height: 40px !important
}

.block .content .title,
.block h4,
.k-dropdown-wrap .k-input,
.studiewijzer-onderdeel div.content ul.sources ul>li>a,
.subtitle,
.tabs li a,
.widget .list li a,
a.ng-binding,
dd,
span:not(.caption, .k-dropdown, .user-content span),
dl.list-dl dd,
dl.list-dl dt,
dna-breadcrumb,
dt,
fieldset label,
form label,
h4,
label,
p:not(.user-content p),
strong,
td,
th,
.k-scheduler .k-event,
.block .content p:not(.user-content p),
form .radio input[type=radio]:checked~label,
.toast em {
    font-family: var(--st-secondary-font-family);
    color: var(--st-primary-color)
}

.k-scheduler-table td,
.k-scheduler-table th,
.k-scheduler-table th strong {
    font-family: var(--st-secondary-font-family) !important;
    color: var(--st-primary-color) !important
}

.alt-nrblock i,
.k-scheduler .k-event.k-state-selected, .k-dropdown .k-input, .k-dropdown .k-state-focused .k-input {
    color: var(--st-primary-color) !important
}

.menu a,
.menu a span {
    color: #fff !important
}

.k-scheduler .afspraak .afspraak-info>.title .schoolHour,
span.nrblock {
    background: var(--st-primary-color) !important;
    color: var(--st-primary-background) !important;
    font-family: var(--st-secondary-font-family)
}

.endlink a:first-letter {
    text-transform: uppercase
}

.endlink a {
    text-decoration: none;
    translate: -2px -2px
}

.endlink a:hover {
    filter: brightness(var(--st-hover-brightness))
}

.widget .endlink a:after {
    content: '⏵';
    font-size: 16px;
    position: relative;
    top: 1px;
    left: 2px
}

.menu-footer,
.appbar>div>a,
a.appbar-button,
.menu-host {
    background: var(--st-accent-primary)
}

.appbar-host,
.main-menu>li.active>a,
.main-menu>li>a:hover {
    background: var(--st-accent-secondary)
}

.main-menu li.children>a::after {
    content: '';
    transition: transform 200ms, translate 200ms;
}

.main-menu li.children:active>a::after {
    translate: 0 6px;
}

.main-menu li.expanded>a::after {
    transform: rotate(180deg);
}

.main-menu li.expanded:active>a::after {
    translate: 0 -6px;
}

.alert-toast:before {
    background-color: var(--st-accent-warn);
}

.alert-toast, .alert-toast i {
    border-color: var(--st-accent-warn);
}

.cijfers-k-grid.k-grid .k-grid-header th.k-header, .cijfers-k-grid.k-grid .grade.herkansingKolom, .cijfers-k-grid.k-grid .k-grid-content tr td span, .cijfers-k-grid.k-grid .grade.eloopdracht {
    background-color: var(--st-primary-background) !important;
}

.cijfers-k-grid.k-grid .grade.empty {
    background: var(--st-inactive-background) !important;
}

.cijfers-k-grid.k-grid .k-grid-content, .cijfers-k-grid.k-grid .k-grid-content tr, .cijfers-k-grid.k-grid .k-grid-content tr.k-alt {
    background: var(--st-body-background);
}

.cijfers-k-grid.k-grid .grade.herkansingKolom.heeftonderliggendekolommen {
    background-color: var(--st-highlight-info) !important;
}

.cijfers-k-grid.k-grid .grade.gemiddeldecolumn {
    background-color: var(--st-highlight-ok) !important;
}

.cijfers-k-grid.k-grid .k-selectable .k-state-selected .grade {
    color: var(--st-primary-color);
    filter: brightness(var(--st-hover-brightness));
}

.dvd-screensaver {
    position: absolute;
    translate: -90px -30px;
    mix-blend-mode: exclusion;
    z-index: 99999;
    animation: moveX 4s linear 0s infinite alternate, moveY 6.8s linear 0s infinite alternate;
}

@keyframes moveX {
  from { left: 0; } to { left: calc(100vw - 168px); }
}

@keyframes moveY {
  from { top: 0; } to { top: calc(100vh - 37px); }
}
`, 'study-tools-experimental')
    }

    if (await getSetting('magister-vd-overhaul')) {
        createStyle(`
#vandaag-container .main .content-container {
    display: none !important;
}

#vandaag-container .main {
    padding-top: 85px !important;
}

#st-vd-header {
    position: absolute;
    top: 0;
    left: 0;
    height: 85px;
    width: 100%;
    display: flex;
    padding: 2rem 1.5rem 1rem;
    background: var(--st-body-background);
    z-index: 1000;
    transition: opacity
}

#st-vd-header>span {
    font: 700 28px / 2rem arboria, sans-serif;
    color: var(--st-a-color);
    transition: opacity 500ms;
}

#st-vd-header[data-transition]>span {
    opacity: 0
}

#st-vd-header>span:after {
    content: ".";
    display: inline-block;
    width: 3px;
    color: #ff8205;
}

#st-vd-header>span:first-letter {
    text-transform: capitalize;
}
        
#st-vd {
    display: grid;
    grid-template: 
        'schedule notifications' 1fr
        / calc(65% - 25px) 35%;
    gap: 25px;
    position: relative;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
}

#st-vd *[onclick] {
    cursor: pointer;
    transition: color 200ms, filter 200ms, transform 200ms;
}

#st-vd *[onclick]:hover, #st-vd *[href]:hover, #st-vd-notifications > #st-vd-grade-notification[onclick]:hover {
    color: var(--st-a-color);
    filter: brightness(var(--st-hover-brightness));
}

#st-vd a:hover, #st-vd-notifications > li:hover:before {
    transform: scale(1.3);
}

#st-vd a:active, #st-vd-notifications > li:active:before {
    transform: scale(.8);
}

#st-vd>* {
    position: relative;
}

#st-vd>*:not([data-ready]):after {
    content: 'Wachten op items...';
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    font: var(--st-widget-heading-font);
    line-height: normal;
    opacity: .6;
}

#st-vd-schedule {
    grid-area: schedule;
}

#st-vd-schedule>div {
    display: flex;
    gap: 20px;
    position: absolute;
    top: 10px;
    right: 0;
}

#st-vd-schedule>div>a {
    font-family: 'Font Awesome 5 Pro';
    font-weight: 500;
    font-size: 20px;
    user-select: none;
    padding: 10px;
    margin: -10px;
    transition: filter 200ms, transform 200ms;
}

ul:only-of-type ~ div>#st-vd-schedule-switch, #st-vd-schedule-switch[data-hidden], #st-vd-schedule>ul[data-tomorrow]:not(:has(li:not([data-filler]))) {
    display: none;
}

#st-vd-schedule-switch:hover {
    transform: rotate(15deg) scale(1.3);
}

#st-vd-schedule-switch:active {
    transform: rotate(180deg) scale(.8);
}

#st-vd-schedule>ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: scale 200ms;
}

#st-vd-schedule[data-ready]>ul:not(:has(li:not([data-filler]))):after {
    content: 'Geen items';
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    font: var(--st-widget-heading-font);
    opacity: .6;
}

#st-vd-schedule>ul[data-hidden] {
    scale: 1 0;
}

#st-vd-schedule>ul:before {
    content: 'Rooster van vandaag';
    font: var(--st-widget-heading-font);
}

#st-vd-schedule>ul[data-tomorrow]:before {
    content: attr(data-tomorrow);
    font: var(--st-widget-heading-font);
}

#st-vd-schedule>ul>li {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 45px;
    padding: 6px 10px 6px 40px;
    overflow: hidden;
    background: var(--st-primary-background);
    color: var(--st-primary-color);
    border: var(--st-widget-border);
    border-radius: var(--st-widget-border-radius);
    font-family: var(--st-secondary-font-family);
}

#st-vd-schedule>ul>li[data-filler] {
    background: none;
    border: none;
    margin: -10px 0;
    max-height: 120px;
    opacity: 0.6;
    pointer-events: none;
}

#st-vd-schedule>ul>li[data-filler]:last-child {
    display: none;
}

#st-vd-schedule>ul>li[data-filler]:before {
    content: '';
    height: 100%;
    border-left: 2px dashed #ccc;
    margin: 30px 0 10px;
}

#st-vd-schedule>ul:not([data-tomorrow])>li[data-current] {
    background: var(--st-highlight-background) !important;
}

#st-vd-schedule>ul:not([data-tomorrow])>li[data-past]>span:nth-child(3) {
    opacity: 0.5;
}

#st-vd-schedule>ul>li[data-filler]>span:nth-child(1) {
    position: absolute;
    top: 14px;
    font-weight: 600;
}

#st-vd-schedule>ul>li[data-filler]>span:nth-child(1):after {
    content: ' ' attr(data-filler)
}

#st-vd-schedule>ul:not([data-tomorrow])>li[data-current]:not([data-filler])>span:nth-child(1):after {
    content: ' (nu)'
}

#st-vd-schedule>ul>li:not([data-filler])>span:nth-child(2) {
    font-size: 14px;
}

#st-vd-schedule>ul>li:not([data-filler])>span:nth-child(3) {
    position: absolute;
    top: 0;
    left: 0;
    width: 30px;
    height: 100%;
    text-align: center;
    background: var(--st-highlight-background);
    font: var(--st-widget-heading-font);
    z-index: 3;
    line-height: 40px;
}

#st-vd-schedule>ul>li[data-current]:not([data-filler])>span:nth-child(3) {
    background: var(--st-accent-primary);
    color: #fff;
}

#st-vd-schedule>ul>li:not([data-filler])>span:nth-child(4) {
    position: absolute;
    top: 6px;
    right: 6px;
    border-radius: 6px;
    padding: 6px 10px;
    background: var(--st-accent-primary);
    color: #fff;
}

#st-vd-schedule>ul>li:not([data-filler]):has(span:nth-child(4)) {
    background: linear-gradient(45deg, var(--st-primary-background), var(--st-highlight-background));
}

#st-vd-notifications {
    color: var(--st-primary-color);
    border: var(--st-widget-border);
    border-radius: var(--st-widget-border-radius);
    font: var(--st-widget-heading-font);
    grid-area: notifications;
}

#st-vd-notifications:before {
    content: 'Meldingen';
    display: block;
    padding: 15px 25px;
    width: 100%;
    font: var(--st-widget-heading-font);
    line-height: normal;
    border-bottom: var(--st-widget-border);
}

#st-vd-notifications:empty {
    display: none;
}

#st-vd-notifications > li {
    position: relative;
    padding: 20px 60px 20px 25px;
    line-height: normal;
    color: var(--st-primary-color);
    background: linear-gradient(45deg,var(--st-highlight-background),var(--st-primary-background));
    border-bottom: var(--st-widget-border);
}

#st-vd-notifications > li:first-letter {
    text-transform: capitalize;
}

#st-vd-notifications > li[data-insignificant], #st-vd-notifications > #st-vd-grade-notification[data-insignificant] {
    color: var(--st-insignificant-color) !important;
    background: var(--st-body-background);
}

#st-vd-notifications > li[data-additional-info]:after {
    content: '\\A' attr(data-additional-info);
    opacity: 0.8;
    font-weight: 400;
    white-space: pre; 
}

#st-vd-notifications > li:before {
    content: attr(data-icon);
    position: absolute;
    right: 25px;
    width: 22px;
    text-align: center;
    font-family: 'Font Awesome 5 Pro';
    font-weight: 500;
    font-size: 20px;
    transition: transform 200ms;
}

#st-vd-notifications > #st-vd-grade-notification {
    color: #fff !important;
    background: linear-gradient(45deg,var(--st-accent-primary),var(--st-accent-secondary));
}

#st-vd-grade-notification-span {
    display: inline-block;
    translate: 3px;
    color: #fff !important;
    font: var(--st-widget-heading-font);
    font-size: 24px;
    line-height: 0px;
}

@media (max-width:1100px) {
    #st-vd {
        grid-template: 
        'schedule' 1fr
        'notifications' auto
        / 1fr;
    }

    #st-vd-notifications {
        height: max-content;
        overflow: hidden;
    }

    #st-vd-notifications > li[data-insignificant], #st-vd-notifications > #st-vd-grade-notification[data-insignificant] {
        display: none;
    }
}
`, 'study-tools-vd-overhaul')
    }

    if (true) {
        createStyle(`
#st-cf-cl {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: var(--st-overlay-background);
    color: var(--st-primary-color);
    z-index: 99999;
    transition: translate 200ms, opacity 200ms;
}

#st-cf-cl[data-step="0"] {
    opacity: 0;
    pointer-events: none !important;
    user-select: none !important;
}

#st-cf-cl-title {
    position: absolute;
    top: 40px;
    left: 23px;
    font: 700 28px / 2rem arboria, sans-serif;
    color: var(--st-a-color);
}

#st-cf-cl-title:after {
    content: ".";
    display: inline-block;
    width: 3px;
    color: #ff8205;
}

#st-cf-cl-subtitle {
    position: absolute;
    top: 80px;
    left: 23px;
    font: 14px var(--st-secondary-font-family);
}

#st-cf-cl-added {
    position: absolute;
    top: 154px;
    right: 16px;
    width: 425px;
    height: calc(100% - 550px);
    padding: 0 16px;
    overflow: auto;
    font-size: 14px;
    line-height: 28px;
    border-radius: var(--st-widget-border-radius) var(--st-widget-border-radius) 0 0;
    border: var(--st-widget-border);
    border-bottom: none;
}

#st-cf-cl-added:before {
    content: 'Toegevoegde cijfers\\A';
    white-space: pre-wrap;
    font: var(--st-widget-heading-font);
}

#st-cf-cl-mean {
    position: absolute;
    bottom: 343px;
    right: 16px;
    width: 425px;
    height: 53px;
    padding: 3px 16px;
    font: var(--st-widget-heading-font);
    font-size: 20px;
    border: var(--st-widget-border);
}

#st-cf-cl-mean:before {
    content: "Gemiddelde: ";
    font: var(--st-widget-heading-font);
    color: var(--st-primary-color);
}

#st-cf-cl-future-desc {
    position: absolute;
    display: block;
    height: 320px;
    width: 425px;
    bottom: 24px;
    right: 16px;
    padding: 40px 16px 16px;
    font-size: 12px;
    font-weight: normal;
    border: var(--st-widget-border);
    border-radius: 0 0 var(--st-widget-border-radius) var(--st-widget-border-radius);
}

#st-cf-cl-future-desc:before {
    position: absolute;
    bottom: 275px;
    content: 'Toekomstig cijfer';
    font: var(--st-widget-heading-font);
    color: var(--st-primary-color);
}

#st-cf-cl-future-desc:after {
    position: absolute;
    bottom: 287px;
    right: 80px;
    content: 'Weging';
    font-family: var(--st-secondary-font);
    font-size: 14px;
    color: var(--st-primary-color);
}

#st-cf-cl #st-cf-cl-future-weight {
    bottom: 306px;
    right: 32px;
    top: auto;
}

#st-cf-cl:not([data-step="2"]) #st-cf-cl-future-weight, #st-cf-cl:not([data-step="2"]) #st-cf-cl-future-desc:after {
    display: none;
}

#st-cf-cl-canvas {
    position: absolute;
    right: 16px;
    bottom: 25px;
    z-index: 2;
}

#st-cf-cl:not([data-step="2"]) #st-cf-cl-canvas, #st-cf-cl:not([data-step="2"]) #st-cf-cl-canvas-highlight {
    pointer-events: none;
    display: none;
}

#st-cf-cl-canvas-highlight {
    position: absolute;
    width: 4px;
    translate: -2px;
    height: 250px;
    bottom: 25px;
    opacity: 0;
    background: var(--st-accent-primary);
    pointer-events: none;
    transition: opacity 200ms;
}

#st-cf-cl-canvas-highlight.show {
    opacity: .4;
}

#st-cf-cl-mean.insufficient {
    color: var(--st-accent-warn);
}

#st-cf-cl-open, #st-cf-cl-closer {
    position: absolute;
    top: 35px;
    right: 28px;
    z-index: 99999;
}

#st-cf-cl-add-table {
    position: absolute;
    top: 35px;
    right: 205px;
}

#st-cf-cl-add-custom {
    position: absolute;
    top: 75px;
    right: 28px;
}

#st-cf-cl input[type=number] {
    position: absolute;
    top: 75px;
    right: 318px;
    width: 60px;
    height: 32px;
    font-family: var(--st-secondary-font-family);
    font-size: 14px;
    padding: 6px;
    background: var(--st-primary-background);
    border: 2px solid var(--st-accent-primary);
    border-radius: var(--st-widget-border-radius);
}

#st-cf-cl #st-cf-cl-add-custom-weight {
    right: 253px;
}

aside.st-appear-top {
    z-index: 999999;
    background: var(--st-primary-background);
}
`, 'study-tools-cf-calculator')
    }

    if (await getSetting('magister-sw-grid')) {
        createStyle(`
#st-sw-container {
    display: block !important
}

#studiewijzer-container aside,
#studiewijzer-container .content-container,
#studiewijzer-detail-container .widget.full-height .block {
    display: none !important;
}

#studiewijzer-container {
    padding-right: 8px
}

.sidecolumn section.main {
    padding-bottom: 0 !important
}`, 'study-tools-sw-grid')
    }

    if (await getSetting('magister-cf-failred')) {
        createStyle(`.grade[title="5,0"],.grade[title="5,1"],.grade[title="5,2"],.grade[title="5,3"],.grade[title="5,4"],.grade[title^="1,"],.grade[title^="2,"],.grade[title^="3,"],.grade[title^="4,"]{background-color:var(--st-highlight-warn) !important;color:var(--st-accent-warn) !important;font-weight:700}`, 'study-tools-cf-failred')
    }

    if (await getSetting('magister-op-oldgrey')) {
        createStyle(`.overdue,.overdue *{color:grey!important}`, 'study-tools-op-oldred')
    }

    if (await getSetting('magister-appbar-hidePicture')) {
        createStyle(`.menu-button figure img{display: none}`, 'study-tools-appbar-hidePicture')
    }
}