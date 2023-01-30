document.addEventListener('DOMContentLoaded', applyStyles)

async function applyStyles() {
    let lightThemeCss = `:root {
    --st-widget-heading-font: 600 16px/44px 'arboria', sans-serif;
    --st-secondary-font-family: 'open-sans', sans-serif;
    --st-body-background: #fff;
    --st-primary-background: #fff;
    --st-highlight-background: #efeffd;
    --st-total-background: #cdf4cd;
    --st-primary-color: #333;
    --st-primary-border-color: #e7e7e7;
    --st-widget-border: 1px solid var(--st-primary-border-color);
    --st-widget-border-radius: 8px;
    --st-widget-edges-box-shadow: none;
    --st-a-color: #188cc1;
}`,
        darkThemeCss = `:root {
    --st-widget-heading-font: 600 16px/44px 'arboria', sans-serif;
    --st-secondary-font-family: 'open-sans', sans-serif;
    --st-body-background: #121212;
    --st-primary-background: #161616;
    --st-highlight-background: #20202c;
    --st-total-background: #2f462f;
    --st-primary-color: #fff;
    --st-primary-border-color: #333;f
    --st-widget-border: 1px solid var(--st-primary-border-color);
    --st-widget-border-radius: 8px;
    --st-widget-edges-box-shadow: none;
    --st-a-color: #50a3c9;
    --st-accent-primary: #174367;
    --st-accent-secondary: #0b2f4c;
    color-scheme: dark;
}`,
        invertCss = `.clearfix.user-content:not(.st-stopinvert),.content.content-auto.background-white:not(.st-stopinvert){filter:invert(1) hue-rotate(180deg)}.clearfix.user-content:not(.st-stopinvert) *:not([color]), .comment.ng-binding.ng-scope, .content.content-auto.background-white:not(.st-stopinvert) *:not([color]){color:#000}.clearfix.user-content:not(.st-stopinvert) iframe,.clearfix.user-content:not(.st-stopinvert) img,.content.content-auto.background-white:not(.st-stopinvert) iframe,.content.content-auto.background-white:not(.st-stopinvert) img{filter:invert(1) hue-rotate(-180deg)}.block .content.background-white{background-color:#ededed}.clearfix.user-content,.content.content-auto.background-white,.content.content-auto.background-white *{font-weight:700}`,
        rootVars = `${lightThemeCss}
${await getSetting('magister-css-dark-auto') ? '@media (prefers-color-scheme: dark) {' : ''}
${await getSetting('magister-css-dark') ? darkThemeCss + (await getSetting('magister-css-dark-invert') ? invertCss : '') : ''}
${await getSetting('magister-css-dark-auto') ? '}' : ''}`

    createStyle(rootVars + `#st-appbar-week{color:#fff;font-family:arboria,sans-serif;font-weight:700;font-size:16px;text-align:center;opacity:.5}#st-sw-container{display:none;height:100%;overflow-y:auto}#st-sw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16em,1fr));gap:1em;align-content:start;padding:1px}.st-sw-subject{display:grid;grid-template-rows:4.5rem;align-items:stretch;background-color:var(--st-primary-background);border-radius:5px;border:var(--st-widget-border);overflow:hidden}.st-sw-subject>button{position:relative;outline:0;border:none;background-color:var(--st-primary-background);color:var(--st-primary-color);cursor:pointer;transition:filter .1s}.st-sw-subject>button:first-child{height:4.5rem;font-size:19px;font-family:open-sans,sans-serif;border-bottom:var(--st-widget-border);background:var(--st-highlight-background)}.st-sw-subject>button:not(:first-child){min-height:1.75rem;font-size:1.1em;font-family:open-sans,sans-serif}.st-sw-subject>button:not(:first-child):hover:after{position:absolute;max-height:100%;width:100%;top:50%;left:50%;transform:translate(-50%,-50%);background-color:var(--st-primary-background);font-size:10px;content:attr(data-title);padding:3px}.st-current,.st-sw-2{font-weight:700}.st-obsolete,.st-obsolete span,.st-sw-0{color:#888!important}.st-sw-compact{grid-template-rows:auto!important;font-size:10px}.st-sw-compact>button:first-child{height:auto!important;font-size:1.5em;padding:5px 0}.st-current:hover,.st-obsolete:hover,.st-sw-subject>button:hover,.st-sw-selected,.st-sw-subject:has(.st-sw-selected)>button:first-child{filter:brightness(.9)}.st-current-sw>div>div>footer.endlink,.st-current-sw>div>h3,.st-current-sw>div>h3>b{background:var(--st-highlight-background);font-weight:700}@media (min-width:1400px){#st-sw-grid{grid-template-columns:repeat(auto-fit,minmax(20em,1fr))}}`, 'study-tools-essential')

    if (await getSetting('magister-css-experimental')) {
        createStyle(`.block h3,.block h4{border-bottom:var(--st-widget-border)}.block h4,footer.endlink{box-shadow:var(--st-widget-edges-box-shadow);border-top:var(--st-widget-border)}body,html{height:calc(100vh + 1px)}.k-block,.k-widget,body,div.loading-overlay{background:var(--st-body-background)}.block h3 b{font:var(--st-widget-heading-font);color:var(--st-primary-color)}.block,.content-container,.k-dropdown .k-dropdown-wrap.k-state-default,.studiewijzer-onderdeel>div.block>div.content:not(#studiewijzer-detail-container div,#studiewijzer-detail-container ul){border:var(--st-widget-border);border-radius:var(--st-widget-border-radius)}.content.content-auto.background-white li>span,.content.content-auto.background-white li>strong{color:#000}.agenda-text-icon,.cijfers-k-grid.k-grid .grade.herkansingKolom.heeftonderliggendekolommen,.cijfers-k-grid.k-grid .grade.vrijstellingcolumn,.k-scheduler-weekview .k-scheduler-table .k-today,.k-scheduler-workWeekview .k-scheduler-table .k-today,.ng-scope td.vrijstelling,.versions li.selected,.versions li:hover,.k-scheduler .k-event.k-state-selected{background:var(--st-highlight-background)!important;background-color:var(--st-highlight-background)!important}#studiewijzer-detail-container .content>ul.sources,#studiewijzer-detail-container .studiewijzer-onderdeel div.content.coloring-blauw .sources li ul,.block,.block .content,.block .content form,.block h4,.k-dropdown .k-dropdown-wrap.k-state-default,.k-dropdown .k-dropdown-wrap.k-state-hover,.k-grouping-row td,.k-header,.k-multiselect .k-button,.k-multiselect-wrap,.k-resize-handle-inner,div[role=gridcell],.k-scheduler .k-event,.k-scheduler .k-event:hover,.k-scheduler-dayview .k-scheduler-table .k-nonwork-hour,.k-scheduler-weekview .k-scheduler-table .k-nonwork-hour,.k-scheduler-workWeekview .k-scheduler-table .k-nonwork-hour,.sm-grid.k-grid .k-grid-content tr,.sm-grid.k-grid .k-grid-content tr.k-state-selected,.sm-grid.k-grid .k-grid-content tr.k-state-selected .k-state-focused,.sm-grid.k-grid .k-grid-content tr.k-state-selected.k-state-focused,.sm-grid.k-grid .k-grid-content tr:hover,.sources li:hover,.studiewijzer-onderdeel>div.block>div.content,.widget .list li.active,.widget .list li.no-data a:hover,.widget .list li.no-data:hover,.widget .list li:hover,.widget li,aside .block .content,dl.list-dl,footer.endlink,table.table-grid-layout th,td.k-group-cell{background:var(--st-primary-background)}.cijfers-k-grid.k-grid .grade.gemiddeldecolumn{background:var(--st-total-background)!important;background-color:var(--st-total-background)!important;color:var(--st-primary-color)!important}.block h3{box-shadow:var(--st-widget-edges-box-shadow)}footer.endlink{border-radius:0 0 8px 8px}a,.endlink a,table.table-grid-layout td a{color:var(--st-a-color);text-decoration:none;overflow-wrap:anywhere}.alert a:hover,.k-dropdown .k-dropdown-wrap.k-state-hover,.k-scheduler-dayview .k-scheduler-header .k-scheduler-table th,.k-scheduler-weekview .k-scheduler-header .k-scheduler-table th,.k-scheduler-workWeekview .k-scheduler-header .k-scheduler-table th,table.table-grid-layout tr:hover,.cijfers-k-grid.k-grid .k-grid-content tr, .cijfers-k-grid.k-grid .k-grid-content tr.k-alt,.k-grid-header,#cijfers-container aside .widget .cijfer-berekend tr{background-color:var(--st-primary-background)!important;box-shadow:none!important}.cijfers-k-grid.k-grid .grade.herkansingKolom{background-color:var(--st-primary-background)!important;color:var(--st-primary-color)!important}#cijfers-container .main div.content-container-cijfers,.cijfers-k-grid.k-grid .grade.empty,.cijfers-k-grid.k-grid .k-grid-content,.cijfers-k-grid.k-grid .k-grid-header th.k-header,table,table.table-grid-layout td{background:var(--st-body-background)!important;color:var(--st-primary-color);border-color:var(--st-primary-border-color)!important}.k-grid-header,.k-multiselect .k-button,.k-multiselect.k-header,.studiewijzer-onderdeel div.content ul>li,.widget li,dl.list-dl dd,dl.list-dl dt,table *{border-color:var(--st-primary-border-color)!important}.k-dropdown-wrap.k-state-hover,.k-scheduler .k-event:hover,.sm-grid.k-grid .k-grid-content tr:hover,.sources li:hover,.widget .list li.active,.widget .list li.no-data a:hover,.widget .list li.no-data:hover,.widget .list li:hover,table.table-grid-layout tr:hover{filter:brightness(.8);transition:filter .2s}.widget .list li.no-data a:hover,.widget .list li.no-data:hover{cursor:default}.tabs,.widget .list{border-bottom:var(--st-widget-border)}.widget .list li{border-top:var(--st-widget-border)}.block .content .title,.block h4,.k-dropdown-wrap .k-input,.k-scheduler-dayview .k-scheduler-table td,.k-scheduler-dayview .k-scheduler-table th,.k-scheduler-dayview .k-scheduler-times table.k-scheduler-table th strong,.k-scheduler-weekview .k-scheduler-table td,.k-scheduler-weekview .k-scheduler-table th,.k-scheduler-weekview .k-scheduler-times table.k-scheduler-table th strong,.k-scheduler-workWeekview .k-scheduler-table td,.k-scheduler-workWeekview .k-scheduler-table th,.k-scheduler-workWeekview .k-scheduler-times table.k-scheduler-table th strong,.studiewijzer-onderdeel div.content ul.sources ul>li>a,.subtitle,.tabs li a,.widget .list li a,a.ng-binding,dd,span:not(.caption,.k-dropdown),dl.list-dl dd,dl.list-dl dt,dna-breadcrumb,dt,fieldset label,form label,h4,label,p,strong,td,th,.k-scheduler .k-event,.block .content p{font-family:var(--st-secondary-font-family);color:var(--st-primary-color)}.alt-nrblock i,.k-scheduler .k-event.k-state-selected{color:var(--st-primary-color)!important}.menu a,.menu a span{color: #fff!important}.k-scheduler .afspraak .afspraak-info>.title .schoolHour,span.nrblock{background:var(--st-primary-color)!important;color:var(--st-primary-background)!important;font-family:var(--st-secondary-font-family)}.endlink a:first-letter{text-transform:uppercase}.endlink a{text-decoration:none;translate:-2px -2px}.endlink a:hover{filter:brightness(.8)}.widget .endlink a:after{content:'⏵';font-size:16px;position:relative;top:1px;left:2px}.menu-footer,.appbar>div>a,a.appbar-button,.menu-host{background:var(--st-accent-primary)}.appbar-host{background:var(--st-accent-secondary)}`, 'study-tools-experimental')

        createStyle(`.block.grade-widget{background:var(--st-primary-background)}.block.grade-widget .content{overflow:hidden}.block.grade-widget.st-grade-widget-yes{background:linear-gradient(45deg,var(--st-accent-primary),var(--st-accent-secondary))}.block.grade-widget *{background:0 0!important;border:none!important}.block.grade-widget.st-grade-widget-yes *{color:#fff!important}#cijfers-leerling .last-grade{display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;width:100%;height:70%;margin:0;padding:8px}#cijfers-leerling .block.grade-widget:not(.st-grade-widget-yes) .last-grade{color:var(--st-primary-color)}#cijfers-leerling .last-grade span.cijfer{font-family:var(--st-widget-heading-font);max-width:100%;width:fit-content}.block.grade-widget footer,.block.grade-widget h3{box-shadow:none}#cijfers-leerling .last-grade span.omschrijving{font:var(--st-widget-heading-font)}.block.grade-widget footer a{text-decoration:none;font-family:open-sans,sans-serif;font-size:0}.block.grade-widget footer a:before{content:'Alle cijfers ';text-transform:none;font-size:11px;position:relative}.block.grade-widget ul.arrow-list{translate:0 100px;position:absolute;display:flex;height:1em;width:100%;gap:2em}.block.grade-widget ul.arrow-list:after{content:'•';opacity:.5;position:absolute;left:50%;translate:-2px;top:1em}.block.grade-widget ul.arrow-list>li{width:50%;font-family:open-sans,sans-serif}.block.grade-widget ul.arrow-list>li a:after{content:none}.block.grade-widget ul.arrow-list>li a{padding:0}.block.grade-widget ul.arrow-list>li:first-child{text-align:right}`, 'study-tools-vd-gradewidget')
    }

    if (await getSetting('magister-vd-deblue')) {
        createStyle(`.widget .agenda-list li.alert{border-left:unset!important;background-color:unset!important}.widget .agenda-list li.alert span.time:after,.widget .agenda-list li.alert span.time:before{content:unset}`, 'study-tools-vd-deblue')
    }

    if (await getSetting('magister-cf-failred')) {
        createStyle(`.grade[title="5,0"],.grade[title="5,1"],.grade[title="5,2"],.grade[title="5,3"],.grade[title="5,4"],.grade[title^="1,"],.grade[title^="2,"],.grade[title^="3,"],.grade[title^="4,"]{background-color:lavenderBlush !important;color:red !important;font-weight:700}`, 'study-tools-cf-failred')
    }

    if (await getSetting('magister-op-oldgrey')) {
        createStyle(`.overdue,.overdue *{color:grey!important}`, 'study-tools-op-oldred')
    }

    if (await getSetting('magister-appbar-hidePicture')) {
        createStyle(`.menu-button figure img{display: none}`, 'study-tools-appbar-hidePicture')
    }

    if (await getSetting('magister-vd-gradewidget')) {
        // Now always enabled if experimental CSS is enabled
    }

}