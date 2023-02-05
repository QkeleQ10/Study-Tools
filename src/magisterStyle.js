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
    --st-highlight-background: ${await shiftedHslColor(207, 78, 96, hueWish, saturationWish, luminanceWish, undefined, undefined, 96)};
    --st-highlight-warn: #fff0f5;
    --st-total-background: #cdf4cd;
    --st-primary-color: #333333;
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
}`,
        darkThemeCss = `:root {
    --st-widget-heading-font: 600 16px/44px 'arboria', sans-serif;
    --st-secondary-font-family: 'open-sans', sans-serif;
    --st-body-background: #121212;
    --st-primary-background: #161616;
    --st-highlight-background: ${await shiftedHslColor(207, 33, 10, hueWish, saturationWish, luminanceWish, undefined, undefined, 10)};
    --st-highlight-warn: #511f1f;
    --st-total-background: #2f462f;
    --st-primary-color: #fff;
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
    color-scheme: dark;
}`,
        rootVars = `${lightThemeCss}
${await getSetting('magister-css-dark-auto') ? '@media (prefers-color-scheme: dark) {' : ''}
${await getSetting('magister-css-dark') ? darkThemeCss : ''}
${await getSetting('magister-css-dark-auto') ? '}' : ''}`

    // INVERSION!!

    createStyle(rootVars + `
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
    transition: filter .1s
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
    filter: brightness(.85)
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
}`, 'study-tools-essential')

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
    height: calc(100vh + 1px)
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
.studiewijzer-onderdeel>div.block>div.content:not(#studiewijzer-detail-container div, #studiewijzer-detail-container ul) {
    border: var(--st-widget-border);
    border-radius: var(--st-widget-border-radius)
}

.content.content-auto.background-white li>span,
.content.content-auto.background-white li>strong {
    color: #000
}

.agenda-text-icon,
.cijfers-k-grid.k-grid .grade.herkansingKolom.heeftonderliggendekolommen,
.cijfers-k-grid.k-grid .grade.vrijstellingcolumn,
.k-scheduler-weekview .k-scheduler-table .k-today,
.k-scheduler-workWeekview .k-scheduler-table .k-today,
.ng-scope td.vrijstelling,
.versions li.selected,
.versions li:hover,
.k-scheduler .k-event.k-state-selected, 
.cijfers-k-grid.k-grid .k-selectable .k-state-selected .grade,
.alert,
.k-dropdown .k-dropdown-wrap.k-state-active,
.projects li.selected {
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
td.k-group-cell, #studiewijzer-container div.studiewijzer-list>ul>li, #studiewijzer-container div.studiewijzer-list div.head, #studiewijzer-container div.studiewijzer-list>ul>li:hover, .projects li:hover {
    background: var(--st-primary-background)
}

.cijfers-k-grid.k-grid .grade.gemiddeldecolumn {
    background: var(--st-total-background) !important;
    background-color: var(--st-total-background) !important;
    color: var(--st-primary-color) !important
}

.block h3, #studiewijzer-container div.studiewijzer-list div.head {
    box-shadow: var(--st-widget-edges-box-shadow)
}

footer.endlink {
    border-radius: 0 0 8px 8px
}

a:not(.user-content a), table.table-grid-layout td a {
    color: var(--st-a-color);
    text-decoration: none;
    overflow-wrap: anywhere
}

.alert a:hover,
.k-dropdown .k-dropdown-wrap.k-state-hover,
.k-scheduler-dayview .k-scheduler-header .k-scheduler-table th,
.k-scheduler-weekview .k-scheduler-header .k-scheduler-table th,
.k-scheduler-workWeekview .k-scheduler-header .k-scheduler-table th,
table.table-grid-layout tr:hover,
.cijfers-k-grid.k-grid .k-grid-content tr,
.cijfers-k-grid.k-grid .k-grid-content tr.k-alt,
.k-grid-header,
#cijfers-container aside .widget .cijfer-berekend tr, form .radio input[type=radio]~label, fieldset .radio input[type=radio]~label {
    background-color: var(--st-primary-background) !important;
    box-shadow: none !important
}

.cijfers-k-grid.k-grid .grade.herkansingKolom, .cijfers-k-grid.k-grid .grade.eloopdracht,
table.table-grid-layout tr, table.table-grid-layout td {
    background-color: var(--st-primary-background) !important;
    color: var(--st-primary-color)
}

#cijfers-container .main div.content-container-cijfers,
.cijfers-k-grid.k-grid .grade.empty,
.cijfers-k-grid.k-grid .k-grid-content,
.cijfers-k-grid.k-grid .k-grid-header th.k-header,
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
input[type=checkbox]+label span {
    border-color: var(--st-primary-border-color) !important;
    outline-color: var(--st-primary-border-color) !important
}

ul>li:has(a):not(:has(.content)):hover,
.k-dropdown-wrap.k-state-hover,
.k-scheduler .k-event:hover,
.sm-grid.k-grid .k-grid-content tr:hover,
.sources li:hover,
.widget .list li.active,
.widget .list li.no-data a:hover,
.widget .list li.no-data:hover,
.widget .list li:hover,
table.table-grid-layout tr:hover, #st-vd-schedule>ul>li:hover, #st-vd a:hover,
.k-dropdown .k-dropdown-wrap.k-state-active,
input[type=radio]~label:hover {
    filter: brightness(.85);
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
form .radio input[type=radio]:checked~label {
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
.k-scheduler .k-event.k-state-selected, .cijfers-k-grid.k-grid .k-selectable .k-state-selected .grade, .k-dropdown .k-input, .k-dropdown .k-state-focused .k-input {
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
    filter: brightness(.85)
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
`, 'study-tools-experimental')

        createStyle(`.block.grade-widget{background:var(--st-primary-background)}.block.grade-widget .content{overflow:hidden}.block.grade-widget.st-grade-widget-yes{background:linear-gradient(45deg,var(--st-accent-primary),var(--st-accent-secondary))}.block.grade-widget *{background:0 0!important;border:none!important}.block.grade-widget.st-grade-widget-yes *{color:#fff!important}#cijfers-leerling .last-grade{display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;width:100%;height:70%;margin:0;padding:8px}#cijfers-leerling .block.grade-widget:not(.st-grade-widget-yes) .last-grade{color:var(--st-primary-color)}#cijfers-leerling .last-grade span.cijfer{font-family:var(--st-widget-heading-font);max-width:100%;width:fit-content}.block.grade-widget footer,.block.grade-widget h3{box-shadow:none}#cijfers-leerling .last-grade span.omschrijving{font:var(--st-widget-heading-font)}.block.grade-widget footer a{text-decoration:none;font-family:open-sans,sans-serif;font-size:0}.block.grade-widget footer a:before{content:'Alle cijfers ';text-transform:none;font-size:11px;position:relative}.block.grade-widget ul.arrow-list{translate:0 100px;position:absolute;display:flex;height:1em;width:100%;gap:2em}.block.grade-widget ul.arrow-list:after{content:'•';opacity:.5;position:absolute;left:50%;translate:-2px;top:1em}.block.grade-widget ul.arrow-list>li{width:50%;font-family:open-sans,sans-serif}.block.grade-widget ul.arrow-list>li a:after{content:none}.block.grade-widget ul.arrow-list>li a{padding:0}.block.grade-widget ul.arrow-list>li:first-child{text-align:right}`, 'study-tools-vd-gradewidget')
    }

    if (await getSetting('magister-vd-overhaul')) {
        createStyle(`
section.main .content-container:has(#vandaagschermtop) {
    display: none !important
}

#vandaag-container .main {
    padding-top: 85px !important;
}
        
#st-vd {
    display: grid;
    grid-template: 
        'schedule notifications' 1fr
        / 1fr auto;
    gap: 25px;
    position: relative;
    height: 100%;
}

@media (max-width:1150px) {
    #st-vd {
        grid-template: 
            'schedule' 1fr
            'notifications' auto
            / 1fr
    }
}

#st-vd *[onclick] {
    cursor: pointer;
    transition: filter 200ms, transform 200ms;
}

#st-vd *[onclick]:hover {
    filter: brightness(.85);
}

#st-vd-schedule {
    position: relative;
    min-width: 300px;
}

#st-vd-schedule>a {
    position: absolute;
    top: 0;
    right: 0;
    padding: 10px;
    margin: -10px;
    font-family: 'Font Awesome 5 Pro';
    font-weight: 500;
    font-size: 20px;
    user-select: none;
    transition: filter 200ms, transform 200ms;
}

#st-vd-schedule>a:hover {
    transform: rotate(15deg) scale(1.3);
}

#st-vd-schedule>a:active {
    transform: rotate(180deg) scale(.8);
}

#st-vd-schedule>ul {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: scale 200ms, translate 200ms;
}

#st-vd-schedule>ul:empty:after, #st-vd-schedule>ul:has(li[data-filler]:first-child:last-child):after {
    content: 'Geen afspraken';
    position: absolute;
    top: 35px;
    font: var(--st-widget-heading-font);
    opacity: .6;
}

#st-vd-schedule>ul[data-hidden] {
    scale: 0 1;
    translate: -50%;
    pointer-events: none;
}

#st-vd-schedule>ul[data-tomorrow][data-hidden] {
    scale: 0 1;
    translate: 50%;
    pointer-events: none;
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

#st-vd-schedule>ul:not([data-tomorrow])>li[data-past] {
    opacity: 0.6;
}

#st-vd-schedule>ul>li[data-filler]>span:nth-child(1) {
    position: absolute;
    top: 14px;
    font-weight: 600;
}

#st-vd-schedule>ul>li[data-filler]>span:nth-child(1):after {
    content: attr(data-filler)
}

#st-vd-schedule>ul:not([data-tomorrow])>li[data-current]:not([data-filler])>span:nth-child(1):after {
    content: " (nu)"
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

#st-vd-notifications:not(:empty):before {
    content: 'Meldingen';
    padding: 0 25px;
    font: var(--st-widget-heading-font);
}

#st-vd-notifications {
    min-width: 300px;
    min-height: 60px;
    color: var(--st-primary-color);
    border: var(--st-widget-border);
    border-radius: var(--st-widget-border-radius);
    font-family: var(--st-secondary-font-family);
    overflow: hidden;
}

#st-vd-notifications:empty:after {
    content: 'Geen meldingen';
    position: absolute;
    top: 50%;
    translate: 0 -50%;
    width: 100%;
    font: var(--st-widget-heading-font);
    padding: 0 25px;
    opacity: .6;
}

#st-vd-notifications>*,#st-vd-unread-notification>li:not(:first-child) {
    border-top: var(--st-widget-border);
}

#st-vd-grade-notification {
    font: var(--st-widget-heading-font);
    font-size: 32px;
    line-height: 80px;
    text-align: center;
    color: #fff;
    background: linear-gradient(45deg,var(--st-accent-primary),var(--st-accent-secondary));
}

#st-vd-grade-notification:before {
    display: inline-block;
    translate: -10px -4px;
    content: attr(data-grade-prefix);
    font-size: 16px;
}

#st-vd-unread-notification {
    font: var(--st-widget-heading-font);
    font-size: 16px;
    line-height: 60px;
    text-align: start;
}

#st-vd-unread-notification>li {
    padding: 0 25px;
    color: var(--st-primar-color);
    background: linear-gradient(45deg,var(--st-highlight-background),var(--st-primary-background));
}

#st-vd-unread-assignment-notification:before {
    content: attr(data-assignments) ' opdrachten: ';
}

#st-vd-unread-assignment-notification>span {
    font: var(--st-widget-heading-font);
    font-size: 16px;
    font-weight: normal;
    line-height: normal;
}

#st-vd-unread-assignment-notification>span:not(:last-child):after {
    content: ' • ';
    opacity: .6;
}
`, 'study-tools-vd-overhaul')
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