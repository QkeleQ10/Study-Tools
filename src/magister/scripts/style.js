document.addEventListener('DOMContentLoaded', applyStyles)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'styles-updated') {
        applyStyles()
    }
})

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
    if (chrome?.storage) syncedStorage = await getFromStorageMultiple(null, 'sync', true)

    let hueWish = syncedStorage.color.h,
        saturationWish = syncedStorage.color.s,
        luminanceWish = syncedStorage.color.l,
        borderRadius = syncedStorage.shape

    if (new Date().getMonth() === 11 && new Date().getDate() >= 8 && new Date().getDate() <= 14 && new Date().getDay() === 5 || new Date().getTime() >= new Date(new Date().getFullYear(), 11, 8 + (5 - new Date(new Date().getFullYear(), 11, 1).getDay())).getTime() && new Date().getMonth() === 11) {
        hueWish = 266, saturationWish = 51, luminanceWish = 41
    }

    let lightThemeCss = `:root {
    --st-font-primary: 600 16px/44px 'arboria', sans-serif;
    --st-font-family-primary: 'arboria', sans-serif;
    --st-font-family-secondary: 'open-sans', sans-serif;
    --st-background-primary: #ffffff;
    --st-background-secondary: #ffffff;
    --st-background-tertiary: #f5f5f5;
    --st-background-overlay: #fffffff5;
    --st-background-transparent: #ffffffbb;
    --st-highlight-primary: ${await shiftedHslColor(207, 78, 96, hueWish, saturationWish, luminanceWish, undefined, undefined, 96)};
    --st-highlight-subtle: #f2f9ff;
    --st-highlight-ok: #b6fadf;
    --st-highlight-warn: #ffd4e2;
    --st-highlight-info: #dceefd;
    --st-foreground-primary: #333333;
    --st-foreground-insignificant: #888;
    --st-foreground-accent: ${await shiftedHslColor(207, 78, 43, hueWish, saturationWish, luminanceWish, undefined, undefined, 43)};
    --st-border-color: #e7e7e7;
    --st-border: 1px solid var(--st-border-color);
    --st-border-radius: ${borderRadius}px;
    --st-accent-primary: ${await shiftedHslColor(207, 95, 55, hueWish, saturationWish, luminanceWish)};
    --st-accent-secondary: ${await shiftedHslColor(207, 95, 47, hueWish, saturationWish, luminanceWish)};
    --st-accent-ok: #339e7c;
    --st-accent-warn: #e94f4f;
    --st-contrast-accent: #fff /*color-contrast(var(--st-accent-primary) vs #fff, #333333)*/;
    --st-shadow-value: 150;
    --st-shadow-alpha: .5;
    --st-hover-brightness: .8;
}`,
        darkThemeCss = `:root {
    --st-font-primary: 600 16px/44px 'arboria', sans-serif;
    --st-font-family-primary: 'arboria', sans-serif;
    --st-font-family-secondary: 'open-sans', sans-serif;
    --st-background-primary: #121212;
    --st-background-secondary: #161616;
    --st-background-tertiary: #0c0c0c;
    --st-background-overlay: #121212f5;
    --st-background-transparent: #121212bb;
    --st-highlight-primary: ${await shiftedHslColor(207, 33, 10, hueWish, saturationWish, luminanceWish, undefined, undefined, 10)};
    --st-highlight-subtle: #181f24;
    --st-highlight-ok: #1a4c38;
    --st-highlight-warn: #511f1f;
    --st-highlight-info: #0f314d;
    --st-foreground-primary: #fff;
    --st-foreground-insignificant: #888;
    --st-foreground-accent: ${await shiftedHslColor(207, 53, 55, hueWish, saturationWish, luminanceWish, undefined, undefined, 55)};
    --st-border-color: #333;
    --st-border: 1px solid var(--st-border-color);
    --st-border-radius: ${borderRadius}px;
    --st-accent-primary: ${await shiftedHslColor(207, 63, 25, hueWish, saturationWish, luminanceWish)};
    --st-accent-secondary: ${await shiftedHslColor(207, 63, 17, hueWish, saturationWish, luminanceWish)};
    --st-accent-ok: #339e7c;
    --st-accent-warn: #e94f4f;
    --st-contrast-accent: #fff /*color-contrast(var(--st-accent-primary) vs #fff, #333333)*/;
    --st-shadow-value: 10;
    --st-shadow-alpha: .7;
    --st-hover-brightness: 1.4;
    color-scheme: dark;
}`,
        invertCss = `
#studiewijzer-detail-container .clearfix.user-content {
    background-color: var(--st-background-primary);
    color: var(--st-foreground-primary);
}

#studiewijzer-detail-container .clearfix.user-content * {
    color: var(--st-foreground-primary);
}
        `,
        rootVars = `${lightThemeCss}
${syncedStorage.theme === 'auto' ? '@media (prefers-color-scheme: dark) {' : ''}
${syncedStorage.theme !== 'light' ? darkThemeCss : ''}
${syncedStorage['magister-css-dark-invert'] ? invertCss : ''}
${syncedStorage.theme === 'auto' ? '}' : ''}`

    createStyle(rootVars, 'study-tools-root-vars')

    if (!syncedStorage['disable-css']) {
        createStyle(`.block h3,
.block h4 {
    border-bottom: var(--st-border)
}


.block h4,
footer.endlink {
    box-shadow: none;
    border-top: var(--st-border)
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
input[type=switch]+label span,
.agenda-lesdashboard .lesvak-prev-next .content-auto .list li:hover, .agenda-lesdashboard .lesvak-prev-next .content-auto .list a:hover,
.agenda-lesdashboard .lesvak-prev-next .content-auto span.icon-up-arrow.prev:hover, .agenda-lesdashboard .lesvak-prev-next .content-auto span.icon-up-arrow.next:hover {
    background: var(--st-background-primary) !important
}

.block h3 b {
    font: var(--st-font-primary);
    color: var(--st-foreground-primary)
}

.block,
.content-container,
.studiewijzer-onderdeel>div.block>div.content:not(#studiewijzer-detail-container div, #studiewijzer-detail-container ul),
#cijfers-container .main div.content-container-cijfers, dna-card,
.opdracht-versions ul {
    border: var(--st-border);
    border-radius: var(--st-border-radius)
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
.agenda-lesdashboard aside .agenda-list li a.current,
.k-list-container .k-item.k-state-focused.k-state-selected,
.k-calendar td.range-select,
.k-calendar .k-content tbody td.k-other-month.k-state-hover, .k-calendar .k-content tbody td.k-state-focused, .k-calendar .k-content tbody td.k-state-hover, .k-calendar .k-content tbody td.k-state-selected,
.k-calendar .k-header .k-state-hover,
.column-container li.selected, .column-container li.checked {
    background: var(--st-highlight-primary) !important;
    background-color: var(--st-highlight-primary) !important
}

.k-calendar .k-content tbody td.k-other-month.k-state-hover a, .k-calendar .k-content tbody td.k-state-focused a, .k-calendar .k-content tbody td.k-state-hover a, .k-calendar .k-content tbody td.k-state-selected a {
    background: none !important;
    background-color: none !important;
}

.agenda-text-icon, .text-icon, .agenda-text-icon.outline[icon-type=information] {
    background-color: var(--st-highlight-warn) !important;
    border: var(--st-border);
    border-radius: calc(var(--st-border-radius) / 2);
    color: var(--st-foreground-primary) !important;
}

.text-icon[icon-type=information], .agenda-text-icon[icon-type=information] {
    background: var(--st-highlight-info) !important;
}

.agenda-text-icon[icon-type=ok] {
    background: var(--st-highlight-ok) !important
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
.cijfers-k-grid.k-grid .k-grid-header th.k-header,
div.ngRow.odd, div.ngRow.even,
dna-card,
.k-calendar .k-header {
    background: var(--st-background-secondary)
}

.block h3, #studiewijzer-container div.studiewijzer-list div.head,
table.table-grid-layout th {
    box-shadow: none;
}

footer.endlink {
    border-radius: 0 0 8px 8px
}

a:not(.user-content a, .st-button, .st-keyboard-hint), table.table-grid-layout td a,
.k-calendar .k-header .k-nav-fast {
    color: var(--st-foreground-accent);
    text-decoration: none;
    overflow-wrap: anywhere
}

.collapsed-menu .popup-menu h3,
.collapsed-menu #faux-label,
.appbar .menu-button>a:hover>span,
.collapsed-menu .popup-menu ul li a:hover {
    color: var(--st-foreground-accent);
}

aside .tabs li.active {
    border-color: var(--st-foreground-accent);
}

.alert a:hover,
.k-dropdown .k-dropdown-wrap.k-state-hover,
.k-scheduler-dayview .k-scheduler-header .k-scheduler-table th,
.k-scheduler-weekview .k-scheduler-header .k-scheduler-table th,
.k-scheduler-workWeekview .k-scheduler-header .k-scheduler-table th,
table.table-grid-layout tr:hover,
.k-grid-header,
#cijfers-container aside .widget .cijfer-berekend tr, form .radio input[type=radio]~label, fieldset .radio input[type=radio]~label,
.wizzard div.sheet div.grid-col div.ngHeaderContainer, div.ngHeaderCell, .column-container h3, #bronnen-container .bronnen-quota-label {
    background-color: var(--st-background-secondary) !important;
    box-shadow: none !important
}

table.table-grid-layout tr, table.table-grid-layout td,
#cijfers-container .main div.content-container-cijfers,
div.ngRow:hover>:not(.unselectable),
.card,
form input[type=text], form input[type=password], form input[type=search], form input[type=email], form input[type=url], form input[type=tel], form input[type=number], fieldset input[type=text], fieldset input[type=password], fieldset input[type=search], fieldset input[type=email], fieldset input[type=url], fieldset input[type=tel], fieldset input[type=number],
.settings-container .widget .multi-line li:hover,
#agenda-afspraak-bewerken-container .k-datepicker .k-picker-wrap,
.k-editor .k-content,
.k-editable-area,
.k-list-container, html body .k-popup.k-list-container .k-item,
.k-calendar thead th, .k-calendar .k-header *, .column-container h3, #bronnen-container .bronnen-quota-label {
    background-color: var(--st-background-secondary) !important;
    color: var(--st-foreground-primary)
}

table:not(.clearfix.user-content table),
table.table-grid-layout td,
.ngGrid {
    background: var(--st-background-primary) !important;
    color: var(--st-foreground-primary);
    border-color: var(--st-border-color) !important
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
input[type=switch]+label span, 
.collapsed-menu .popup-menu,
.collapsed-menu #faux-label,
.appbar .menu-button>a:hover>span,
#vandaag-container .grade-widget ul,
.widget .dualcolumn-list li,
#cijfers-container .main div.content-container-cijfers,
div.ngCell,
dna-card,
.card,
form input[type=text], form input[type=password], form input[type=search], form input[type=email], form input[type=url], form input[type=tel], form input[type=number], fieldset input[type=text], fieldset input[type=password], fieldset input[type=search], fieldset input[type=email], fieldset input[type=url], fieldset input[type=tel], fieldset input[type=number],
.settings-container ul.multi-line,
#agenda-afspraak-bewerken-container .k-datepicker .k-picker-wrap,
html body .k-popup.k-list-container .k-item,
.k-popup.k-list-container,
.k-list-container.k-state-border-up .k-list,
.opdracht-versions ul,
.agenda-lesdashboard span,
.bottom_border,
.k-calendar,
.k-calendar td.range-select,
.k-calendar .k-content tbody td.k-other-month.k-state-hover, .k-calendar .k-content tbody td.k-state-focused, .k-calendar .k-content tbody td.k-state-hover, .k-calendar .k-content tbody td.k-state-selected {
    border-color: var(--st-border-color) !important;
    outline-color: var(--st-border-color) !important
}

.collapsed-menu .popup-menu::after,
.collapsed-menu li:hover span::after,
.appbar .menu-button>a:hover>span::after {
    border-right: 5px solid var(--st-border-color) !important;
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
table.table-grid-layout tr:hover,
.k-dropdown .k-dropdown-wrap.k-state-active,
input[type=radio]~label:hover,
.collapsed-menu .popup-menu ul li a:hover,
div.ngRow:hover>:not(.unselectable) {
    filter: brightness(var(--st-hover-brightness));
    transition: filter 200ms, transform 200ms;
}

.widget .list li.no-data a:hover,
.widget .list li.no-data:hover {
    cursor: default
}

.tabs,
.widget .list {
    border-bottom: var(--st-border)
}

.widget .list li {
    border-top: var(--st-border)
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
span:not(.st-title, .st-subtitle, .caption, .k-dropdown, .user-content span),
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
.toast em,
div.ngCell, div.ngCellText, div.ngVerticalBar, div.ngHeaderCell, div.ngHeaderContainer,
li.k-item, span.k-input {
    font-family: var(--st-font-family-secondary);
    color: var(--st-foreground-primary)
}

a.k-link.k-nav-fast {
    font-family: var(--st-font-family-secondary) !important;
}

div.ngVerticalBar {
    background-color: var(--st-border-color);
}

.k-scheduler-table td,
.k-scheduler-table th,
.k-scheduler-table th strong,
.k-calendar .k-content *,
.k-calendar .k-content tbody td.k-other-month.k-state-hover a, .k-calendar .k-content tbody td.k-state-focused a, .k-calendar .k-content tbody td.k-state-hover a, .k-calendar .k-content tbody td.k-state-selected a {
    font-family: var(--st-font-family-secondary) !important;
    color: var(--st-foreground-primary) !important
}

.alt-nrblock i,
.k-scheduler .k-event.k-state-selected, .k-dropdown .k-input, .k-dropdown .k-state-focused .k-input,
div.faux.popup-menu>ul>li.submenu>a,
.k-list-container .k-item.k-state-focused.k-state-selected,
.k-calendar .k-content tbody td.k-other-month.k-state-hover, .k-calendar .k-content tbody td.k-state-focused, .k-calendar .k-content tbody td.k-state-hover, .k-calendar .k-content tbody td.k-state-selected {
    color: var(--st-foreground-primary) !important
}

.menu a,
.menu a span {
    color: var(--st-contrast-accent) !important
}

.k-scheduler .afspraak .afspraak-info>.title .schoolHour,
span.nrblock {
    background: var(--st-foreground-primary) !important;
    color: var(--st-background-secondary) !important;
    font-family: var(--st-font-family-secondary);
    font-weight: 700 !important;
    border-radius: calc(var(--st-border-radius) / 2);
    aspect-ratio: 1;
    width: auto;
    height: 15px;
    padding: 2px;
    text-align: center;
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
    background: var(--st-accent-primary);
    transition: background 200ms;
}

.appbar-host,
.main-menu>li.active>a,
.main-menu>li>a:hover {
    background: var(--st-accent-secondary);
    transition: background 200ms;
}

aside, aside .block,
.main-menu>li.active>a,
.main-menu>li>a:hover,
.opdracht-versions ul li {
    border-radius: var(--st-border-radius);
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

.cijfers-k-grid.k-grid .grade {
    user-select: none;
}

.cijfers-k-grid.k-grid .k-grid-header th.k-header, .cijfers-k-grid.k-grid .grade.herkansingKolom, .cijfers-k-grid.k-grid .k-grid-content tr td span, .cijfers-k-grid.k-grid .grade.eloopdracht, .column-container .rest-column, .column-container .first-column {
    background-color: var(--st-background-secondary) !important;
}

.cijfers-k-grid.k-grid .grade.empty {
    background: var(--st-background-tertiary) !important;
}

.cijfers-k-grid.k-grid .k-grid-content, .cijfers-k-grid.k-grid .k-grid-content tr, .cijfers-k-grid.k-grid .k-grid-content tr.k-alt {
    background: var(--st-background-primary);
}

.cijfers-k-grid.k-grid .grade.herkansingKolom.heeftonderliggendekolommen, .cijfers-k-grid.k-grid .grade.vrijstellingcolumn {
    background-color: var(--st-highlight-subtle) !important;
}

.cijfers-k-grid.k-grid .grade.gemiddeldecolumn {
    background-color: var(--st-highlight-ok) !important;
}

.cijfers-k-grid.k-grid .k-selectable .k-state-selected .grade {
    color: var(--st-foreground-primary);
    filter: brightness(var(--st-hover-brightness));
}

.dvd-screensaver {
    position: absolute;
    translate: -90px -30px;
    background: #0000ff;
    padding: 16px;
    z-index: 99999;
    animation: moveX 4s linear 0s infinite alternate, moveY 6.8s linear 0s infinite alternate, rainbow 5s linear 0s infinite;
}

.sidecolumn aside .head-bar,
.k-calendar tbody tr td {
    padding: 0;
}

.k-calendar tbody tr td {
    height: 30px;
}

.k-calendar .k-content tbody td.k-today a, .k-calendar .k-content .k-link {
    margin-left: 0;
    padding: 0;
}

td#calendar_cell_selected {
    background-color: var(--st-accent-primary) !important;
    border-color: var(--st-accent-primary) !important;
}

td#calendar_cell_selected>a {
    color: #fff !important;
}

td.k-other-month {
    background-image: none !important;
}

td.k-other-month a {
    opacity: .3;
}

aside .tabs {
    display: flex;
}

aside .tabs li {
    width: auto;
    flex-grow: 2;
    transition: filter 200ms;
}

aside .tabs li.active, aside .tabs li:hover {
    border: none;
    font-weight: 400;
}

aside .tabs li:after {
  content: '';
  display: block;
  margin-top: 38px;
  top: 0;
  left: 50%;
  translate: -50% 1px;
  height: 0px;
  width: 0px;
  background: var(--st-accent-primary);
  border-radius: 3px 3px 0 0;
  transition: width 200ms ease, height 200ms ease, translate 200ms ease;
}

aside .tabs li:hover:after {
  width: 20px;
  height: 3px;
  translate: -50%;
}

aside .tabs:not(.st-cf-sc-override) li.active:after {
  width: calc(100% - 24px);
  height: 3px;
  translate: -50%;
}

dna-card-title.disabled {
    color: var(--st-foreground-primary) !important;
}

dna-card {
    --box-shadow: 0 2px 4px 0 rgba(var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-alpha)) !important;
}

.container > dna-breadcrumbs, .container > dna-page-header, dna-button-group, dna-button, :host, :host([default]), ::slotted(a[href]), dna-breadcrumbs > dna-breadcrumb > a {
    --title-color: var(--st-foreground-accent);
    --color: var(--st-foreground-accent);
    --background: var(--st-foreground-accent);
    --dna-text-color: var(--st-foreground-accent);
    --separator-color: var(--st-foreground-accent);
    --background-secondary: var(--st-foreground-accent);
    --radius: var(--st-border-radius);
}

dna-button[variant=primary] {
    --color: var(--st-contrast-accent);
    --background: var(--st-accent-primary);
}

dna-breadcrumbs > dna-breadcrumb > a,
.podium header h1 {
    --color: var(--st-foreground-accent) !important;
}

dna-button:not([variant=primary], [fill=clear]) {
    --color: var(--st-foreground-accent);
    --background: var(--st-background-secondary);
    border-color: var(--st-accent-primary);
}

dna-button:hover {
    filter: brightness(var(--st-hover-brightness));
}

dna-card-title.ng-binding, dna-card-title, .content.content-auto.background-white, .opdrachten-details-row, .gegevens-container, .empty-message, .label, .capitalize.ng-binding, .examen-cijfer.ng-binding {
    color: var(--st-foreground-primary);
}

.overdue,.overdue *{color:grey!important}

.studiewijzer-onderdeel div.fold div.content {
    height: auto;
    overflow: hidden !important;
    opacity: 0;
}

.content.content-auto {
    grid-template-rows: 1fr;
    display: grid;
    overflow: hidden !important;
    transition: grid-template-rows 200ms, opacity 200ms;
}

.content.content-auto>* {
    overflow: hidden !important;
}

.fold .content.content-auto {
    grid-template-rows: 0fr;
}

.clearfix.user-content {
    transition: padding 200ms;
}

.fold .clearfix.user-content {
    padding-block: 0 !important;
}

.block h3 strong, .block h3 strong.ng-hide:not(.ng-hide-animate) {
    line-height: 25px;
    min-height: 0;
    max-height: 0;
    display: block !important;
    overflow: hidden !important;
    transition: min-height 200ms, max-height 200ms;
}

.fold h3 strong {
    line-height: 25px;
    min-height: 35px;
    max-height: 35px;
}

#studiewijzer-detail-container .content {
    min-height: 0;
}

footer.endlink {
    display: none;
}

.studiewijzer-onderdeel .block.ng-scope {
    overflow: hidden !important;
    transition: box-shadow 200ms, margin 200ms;
}

.sources>li {
    max-height: 39px;
    transition: max-height 200ms;
}

.sources>li:has(div>ul) {
    max-height: none;
}

.fold .sources>li, .fold .sources>li:has(div>ul) {
    max-height: 0;
    border-top: none !important;
}

.icon-down-arrow:before, .icon-up-arrow:before, .k-calendar .k-header .k-i-arrow-w:after, .k-calendar .k-header .k-i-arrow-e:after {
    content: '' !important;
    font: 400 24px/44px "Font Awesome 5 Pro" !important;
    transition: rotate 200ms, translate 200ms;
}

.icon-up-arrow:before {
    rotate: 180deg;
}

.block.fold .icon-up-arrow:before {
    rotate: 0deg;
}

.icon-up-arrow.prev:before, .k-calendar .k-header .k-i-arrow-w:after {
    rotate: 90deg;
}

.icon-up-arrow.next:before, .k-calendar .k-header .k-i-arrow-e:after {
    rotate: -90deg;
}

.studiewijzer-onderdeel:has(h3 b:active, .icon-down-arrow:active) .icon-down-arrow:before,
h3:active> .icon-down-arrow:before,
.block.fold .icon-up-arrow:active:before {
    translate: 0 6px;
}

.studiewijzer-onderdeel:has(h3 b:active, .icon-up-arrow:active) .icon-up-arrow:before,
h3:active> .icon-up-arrow:before {
    translate: 0 -6px;
}

.icon-up-arrow.prev:active:before, .k-calendar .k-header .k-i-arrow-w:active:after {
    translate: -6px 0;
}

.icon-up-arrow.next:active:before, .k-calendar .k-header .k-i-arrow-e:active:after {
    translate: 6px 0;
}

.k-calendar .k-header .k-i-arrow-e:after, .k-calendar .k-header .k-i-arrow-w:after {
    border: none !important;
    height: auto !important;
    width: auto !important;
    top: -5px !important;
    left: -20px !important;
}

.k-calendar .k-header .k-i-arrow-w:after {
    left: 14px !important;
}

.k-calendar .k-header .k-link.k-nav-prev, .k-calendar .k-header .k-link.k-nav-next {
    height: auto !important;
    width: auto !important;
}

.block.fold.disabled {
    opacity: .3;
    pointer-events: none;
}

.main .widget.wide {
    padding-right: 0px;
}

#agenda-section .content-container {
    padding: 8px;
}

.studiewijzer-onderdeel .block:not(.fold) {
    box-shadow: 0 0 8px 0 rgba(var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-alpha));
    margin-block: 8px;
}

#studiewijzer-detail-container .content-container.widget-container.studiewijzer-content-container {
    padding: 8px 0 0 8px !important;
    margin-left: -8px;
    margin-top: -8px;
    max-width: calc(100vw - 647px);
    width: calc(100% + 8px);
    max-height: none;
    height: calc(100% + 8px);
}

#studiewijzer-detail-container .content-container.widget-container.studiewijzer-content-container.menu-is-collapsed {
    max-width: calc(100vw - 469px);
}
`, 'study-tools')
    }

    if (Math.random() < 0.003) createStyle(`span.st-title:after { content: '🧡' !important; font-size: 9px !important; margin-bottom: -100%; }`, 'study-tools-easter-egg')

    if (syncedStorage['magister-vd-overhaul']) {
        createStyle(`
#vandaag-container .main .content-container {
    display: none !important;
}

#vandaag-container .main {
    padding-top: 85px !important;
}
`, 'study-tools-vd-overhaul')
    }

    if (syncedStorage['magister-sw-display'] === 'grid') {
        createStyle(`
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

    if (syncedStorage['magister-cf-failred']) {
        createStyle(`.grade[title^="5,0"],.grade[title^="5,1"],.grade[title^="5,2"],.grade[title^="5,3"],.grade[title^="5,4"],.grade[title^="1,"],.grade[title^="2,"],.grade[title^="3,"],.grade[title^="4,"]{background-color:var(--st-highlight-warn) !important;color:var(--st-accent-warn) !important;font-weight:700}`, 'study-tools-cf-failred')
    }

    if (syncedStorage['magister-picture'] === 'custom' && syncedStorage['magister-picture-source']?.length > 10) {
        createStyle(`.menu-button figure img,.photo.photo-high img{content: url("${syncedStorage['magister-picture-source']}")}`, 'study-tools-appbar-hidePicture')
    } else if (syncedStorage['magister-picture'] !== 'show') {
        createStyle(`.menu-button figure img,.photo.photo-high img{display: none}`, 'study-tools-appbar-hidePicture')
    }
}