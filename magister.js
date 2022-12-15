init()

async function vandaag() {
    if (!await getSetting('magister-vd-deblue')) return
    let blueItems = await getElement('ul.agenda-list>li.alert', true),
        changedHeader = await getElement('h4[data-ng-bind-template*="Wijzigingen voor"]')
    if (blueItems) blueItems.forEach(e => e.classList.remove("alert"))
    if (changedHeader) changedHeader.innerHTML = changedHeader.innerHTML.replace("Wijzigingen voor", "Rooster voor")
}


async function agenda() {
    if (await getSetting('magister-ag-large')) {
        let agendaItems = await getElement('tr.ng-scope', true)
        agendaItems.forEach(e => e.style.height = "40px")
    }
}

async function studiewijzers() {
    if (!await getSetting('magister-sw-sort')) return
    let elementMain = await getElement('section.main'),
        elementOldContainer = await getElement('.content-container'),
        elementNewContainer = document.createElement('div'),
        elementGrid = document.createElement('div'),
        elementUl = await getElement('.studiewijzer-list>ul'),
        settingGrid = await getSetting('magister-sw-grid'),
        settingShowPeriod = await getSetting('magister-sw-period'),
        settingSubjects = await getSetting('magister-subjects'),
        currentPeriod = await getPeriodNumber(),
        nodeList = await getElement('li[data-ng-repeat="studiewijzer in items"]', true),
        nodeArray = [...nodeList],
        mappedArray = nodeArray.map(elem => {
            let title = elem.firstElementChild.firstElementChild.innerText,
                subject = "Geen vak",
                period = 0,
                priority,
                periodTextIndex = title.search(/(t(hema)?|p(eriod(e)?)?)(\s|\d)/i)

            settingSubjects.forEach(subjectEntry => {
                testArray = `${subjectEntry.name},${subjectEntry.aliases}`.split(',')
                testArray.forEach(testString => {
                    if ((new RegExp(`^(${testString.trim()})$|^(${testString.trim()})[^a-z]|[^a-z](${testString.trim()})$|[^a-z](${testString.trim()})[^a-z]`, 'i')).test(title)) subject = subjectEntry.name
                })
            })

            if (periodTextIndex > 0) {
                let periodNumberSearchString = title.slice(periodTextIndex),
                    periodNumberIndex = periodNumberSearchString.search(/[1-9]/i)
                if (periodNumberIndex > 0) period = Number(periodNumberSearchString.charAt(periodNumberIndex))
            }

            if (period === currentPeriod) priority = 2
            else if (period > 0) priority = 0
            else priority = 1

            return { elem, title, period, subject, priority }
        }).sort((a, b) => settingGrid ? (a.subject.localeCompare(b.subject) || a.period - b.period) : (b.priority - a.priority || a.subject.localeCompare(b.subject)))

    if (settingGrid) {
        elementOldContainer.style.display = 'none'
        elementMain.appendChild(elementNewContainer)
        elementNewContainer.classList.add('st-sw-container')
        elementNewContainer.appendChild(elementGrid)
        elementGrid.classList.add('st-sw-grid')
        const hideLink = document.createElement('a')
        document.querySelector('div#idWeergave div').appendChild(hideLink)
        hideLink.outerHTML = `<a onclick="document.querySelector('.st-sw-container').style.display = 'none'; document.querySelector('.content-container').style.display = 'unset'; this.remove()" style="opacity:.5;text-decoration:underline">Weergave herstellen</a>`
    }

    mappedArray.forEach(async ({ elem, title, period, subject, priority }) => {
        if (settingGrid) {
            let itemButton = document.createElement('button'),
                subjectWrapper
            if (document.querySelector(`div[data-subject='${subject}']`)) {
                subjectWrapper = document.querySelector(`div[data-subject='${subject}']`)
            } else {
                subjectWrapper = document.createElement('div')
                elementGrid.appendChild(subjectWrapper)
                subjectWrapper.classList.add('st-sw-subject')
                subjectWrapper.dataset.subject = subject
                let defaultItemButton = document.createElement('button')
                defaultItemButton.innerText = subject
                subjectWrapper.appendChild(defaultItemButton)
                defaultItemButton.setAttribute('onclick', 'this.parentElement.lastElementChild.click()')
            }
            if (settingShowPeriod) {
                itemButton.innerText = period ? `periode ${period}` : "geen periode"
                itemButton.dataset.title = title
            } else {
                itemButton.innerText = title
                itemButton.style.fontSize = '11px'
                itemButton.style.minHeight = '2rem'
            }
            itemButton.classList.add(`st-sw-${priority}`)
            itemButton.setAttribute('onclick', `document.querySelector('li[data-title="${title}"]>a').click()`)
            subjectWrapper.appendChild(itemButton)
            elem.dataset.title = title
        } else {
            elementUl.appendChild(elem)
            elem.firstElementChild.lastElementChild.innerText = subject
            switch (priority) {
                case 2:
                    elem.classList.add('st-current')
                    elem.setAttribute('title', "Deze studiewijzer is actueel.")
                    break

                case 1:
                    elem.setAttribute('title', "Er kon geen periodenummer worden gedetecteerd.")
                    break

                default:
                    elem.classList.add('st-obsolete')
                    elem.setAttribute('title', `Deze studiewijzer is van periode ${period}.`)
                    break
            }
        }

    })
}

async function studiewijzer() {
    if (await getSetting('magister-sw-thisWeek')) {
        let titles = await getElement('li.studiewijzer-onderdeel>div.block>h3>b.ng-binding', true),
            regex = new RegExp(`(?<![0-9])(${await getWeekNumber()}){1}(?![0-9])`, "g")

        titles.forEach(title => {
            if (regex.test(title.innerHTML)) {
                let top = title.parentElement,
                    bottom = top.nextElementSibling.lastElementChild,
                    li = top.parentElement.parentElement
                li.classList.add('st-current-sw')
                top.setAttribute('title', "De titel van dit kopje komt overeen met het huidige weeknummer.")
                bottom.scrollIntoView({ behavior: 'smooth', block: 'center' })
                title.click()
            }
        })
    }
}

// Run when the extension and page are loaded
async function init() {
    popstate()
    applyStyles()

    window.addEventListener('popstate', popstate)
    window.addEventListener('locationchange', popstate)

    let appbar = await getElement(".appbar")

    if (await getSetting('magister-appbar-zermelo')) {
        let appbarZermelo = document.createElement("div")
        appbar.firstElementChild.after(appbarZermelo)
        appbarZermelo.outerHTML = `
    <div class="menu-button">
        <a id="zermelo-menu" href="https://${window.location.hostname.split('.')[0]}.zportal.nl/app" target="_blank">
            <img src="https://raw.githubusercontent.com/QkeleQ10/QkeleQ10.github.io/main/img/zermelo.png" width="36" style="border-radius: 100%">
            <span>Zermelo</span>
        </a>
    </div>`}

    if (await getSetting('magister-appbar-week')) {
        let appbarWeek = document.createElement("h1")
        appbarWeek.innerText = `wk ${await getWeekNumber()}`
        appbarWeek.setAttribute('style', `color:#fff;font-family:arboria,sans-serif;font-weight:700;font-size:16px;text-align:center`)
        appbar.prepend(appbarWeek)
    }

    if (await getSetting('magister-appbar-hidePicture')) {
        let userImg = await getElement("#user-menu img")
        userImg.style.display = "none"
    }

    let userMenuLink = await getElement('#user-menu')
    userMenuLink.addEventListener('click', async () => {
        let logoutLink = await getElement('.user-menu ul li:nth-child(3) a')
        logoutLink.addEventListener('click', async () => {
            await setSetting('force-logout', new Date().getTime(), 'local')
        })
    })
}

// Run when the URL changes
async function popstate() {
    const href = document.location.href.split('?')[0]

    if (href.endsWith('/vandaag')) vandaag()
    else if (href.endsWith('/agenda')) agenda()
    else if (href.endsWith('/studiewijzer')) studiewijzers()
    else if (href.includes('/studiewijzer/')) studiewijzer()
}

async function applyStyles() {
    createStyle(`.st-sw-container{height:100%;overflow-y:auto}.st-sw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16em,1fr));gap:1em;align-content:start;padding:1px}.st-sw-subject{display:grid;grid-template-rows:4.5rem;align-items:stretch;background-color:#fff;border-radius:5px;border:none;outline:#ccc solid 1px;overflow:hidden}.st-sw-subject>button{position:relative;outline:0;border:none;background-color:#fff;cursor:pointer;transition:filter .1s}.st-sw-subject>button:first-child{height:4.5rem;font-size:18px;font-family:open-sans,sans-serif;border-bottom:1px solid #ccc;background:#f8f8ff}.st-sw-subject>button:not(:first-child){min-height:1.75rem;font-size:12px;font-family:open-sans,sans-serif}.st-sw-subject>button:not(:first-child):hover:after{position:absolute;max-height:100%;width:100%;top:50%;left:50%;transform:translate(-50%,-50%);background-color:#fff;font-size:11px;content:attr(data-title)}.st-current,.st-sw-2{font-weight:700}.st-obsolete,.st-obsolete span,.st-sw-0{color:#888!important}.st-current:hover,.st-obsolete:hover,.st-sw-subject>button:hover{filter:brightness(.9)}.st-current-sw>div>div>footer.endlink,.st-current-sw>div>h3,.st-current-sw>div>h3>b{background:#f0f8ff;font-weight:700}@media (min-width:1400px){.st-sw-grid{grid-template-columns:repeat(auto-fit,minmax(20em,1fr))}}`, 'study-tools')

    if (await getSetting('magister-cf-failred')) {
        createStyle(`.grade[title="5,0"],.grade[title="5,1"],.grade[title="5,2"],.grade[title="5,3"],.grade[title="5,4"],.grade[title^="1,"],.grade[title^="2,"],.grade[title^="3,"],.grade[title^="4,"]{background-color:lavenderBlush !important;color:red !important;font-weight:700}`, 'study-tools-cf-failred')
    }

    if (await getSetting('magister-op-oldgrey')) {
        createStyle(`.overdue,.overdue *{color:grey!important}`, 'study-tools-op-oldred')
    }

    if (await getSetting('magister-vd-gradewidget')) {
        let lastGrade = await getElement('.block.grade-widget span.cijfer')
        lastGrade.innerText = '-'
        console.log(lastGrade.innerText, lastGrade.innerText.includes('-'))
        if (lastGrade.innerText.includes('-')) lastGrade.parentElement.parentElement.parentElement.classList.add('st-grade-widget-no')
        createStyle(`.block.grade-widget:not(.st-grade-widget-no){background:linear-gradient(45deg,var(--primary-background),var(--secondary-background))}.block.grade-widget.st-grade-widget-no{background:0 0}.block.grade-widget *{background:0 0!important;border:none!important}.block.grade-widget:not(.st-grade-widget-no) *{color:#fff!important}.block.grade-widget .content{overflow:hidden}#cijfers-leerling .last-grade{display:flex;flex-direction:column;justify-content:space-evenly;align-items:center;width:100%;height:60%;margin:0;padding:8px}#cijfers-leerling .block.grade-widget.st-grade-widget-no .last-grade{color:#000}.block.grade-widget span.cijfer{font-family:arboria,sans-serif;max-width:100%;width:fit-content}.block.grade-widget footer,.block.grade-widget h3{box-shadow:none}#cijfers-leerling .last-grade span.omschrijving{font:bold 14px arboria,sans-serif}.block.grade-widget footer a{text-decoration:none;font-family:open-sans,sans-serif;font-size:0}.block.grade-widget footer a:after{content:'⏵';font-size:1.25rem}.block.grade-widget footer a:before{content:'Alle cijfers ';text-transform:none;font-size:.75rem;position:relative;bottom:.2rem}.block.grade-widget a:hover{filter:brightness(.9)}.block.grade-widget ul.arrow-list{translate:0 100px;position:absolute;display:flex;height:1em;width:100%;gap:.5em}.block.grade-widget ul.arrow-list>li{display:flex;height:1em;width:50%}.block.grade-widget ul.arrow-list>li a:after{content:none}.block.grade-widget ul.arrow-list>li a{padding:0;height:1em}.block.grade-widget ul.arrow-list>li:first-child{justify-content:end}.block.grade-widget:not(.st-grade-widget-no) ul.arrow-list>li:first-child:after{content:'•';padding-left:.5em}`, 'study-tools-vd-gradewidget')
    }
}

function getWeekNumber() {
    let d = new Date()
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)),
        weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return weekNo
}

async function getPeriodNumber(w = getWeekNumber()) {
    const settingPeriods = await getSetting('magister-periods')
    let periodNumber = 0

    settingPeriods.split(',').forEach((e, i, arr) => {
        let startWeek = Number(e),
            endWeek = Number(arr[i + 1]) || Number(arr[0])
        if (endWeek < startWeek && (w >= startWeek || w < endWeek)) periodNumber = i + 1
        else if (w >= startWeek && w < endWeek) periodNumber = i + 1
    })

    return periodNumber
}