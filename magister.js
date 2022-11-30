init()

async function vandaag() {
    if (await getSetting('magister-vd-deblue')) {
        let blueItems = await getElement('ul.agenda-list>li.alert', true)
        blueItems.forEach(e => e.classList.remove("alert"))
        let changedHeader = await getElement('h4[data-ng-bind-boolean-template*="Wijzigingen voor"]')
        changedHeader.innerHTML = changedHeader.innerHTML.replace("Wijzigingen voor", "Rooster voor")
    }
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

            if (period === getPeriodNumber()) priority = 2
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
    }

    mappedArray.forEach(async ({ elem, title, period, subject, priority }) => {
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
    else if (href.includes('/opdrachten')) opdrachten()
}

async function applyStyles() {
    createStyle(`.st-sw-container{height:100%;overflow-y:auto}.st-sw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16em,1fr));gap:1em;align-content:start;padding:1px}.st-sw-subject{display:grid;grid-template-rows:4.5rem;align-items:stretch;background-color:#fdfdfd;border-radius:5px;border:none;outline:#ccc solid 1px;overflow:hidden}.st-sw-subject>button{position:relative;outline:0;border:none;background-color:#fdfdfd;cursor:pointer;transition:filter .1s}.st-sw-subject>button:first-child{height:4.5rem;font-size:18px;font-family:"droid_sansregular",arial,helvetica,sans-serif;border-bottom:1px solid #ccc}.st-sw-subject>button:not(:first-child){min-height:1.75rem;font-size:12px;font-family:tahoma,sans-serif}.st-sw-subject>button:not(:first-child):hover:after{position:absolute;max-height:100%;width:100%;top:50%;left:50%;transform:translate(-50%,-50%);background-color:#fdfdfd;font-size:11px;content:attr(data-title)}.st-current,.st-sw-2{font-weight:700}.st-obsolete,.st-obsolete span,.st-sw-0{color:grey!important}.st-current:hover,.st-obsolete:hover,.st-sw-subject>button:hover{filter:brightness(.9)}.st-current-sw>div>div>footer.endlink,.st-current-sw>div>h3,.st-current-sw>div>h3>b{background:#f0f8ff;font-weight:700}@media (min-width:1400px){.st-sw-grid{grid-template-columns:repeat(auto-fit,minmax(20em,1fr))}}`, 'study-tools')

    if (await getSetting('magister-cf-failred')) {
        createStyle(`.grade[title="5,0"],.grade[title="5,1"],.grade[title="5,2"],.grade[title="5,3"],.grade[title="5,4"],.grade[title^="1,"],.grade[title^="2,"],.grade[title^="3,"],.grade[title^="4,"]{background-color:lavenderBlush !important;color:red !important;font-weight:700}`, 'study-tools-cf-failred')
    }

    if (await getSetting('magister-op-oldred')) {
        createStyle(`.overdue,.overdue *{color:grey!important}`, 'study-tools-op-oldred')
    }
}

function getWeekNumber() {
    let currentDate = new Date(),
        startDate = new Date(currentDate.getFullYear(), 0, 1),
        days = Math.floor((currentDate - startDate) / 86400000),
        weekNumber = Math.ceil(days / 7)
    return weekNumber
}

function getPeriodNumber(w) {
    if (!w) w = getWeekNumber()
    if (w >= 30 && w < 47)
        return 1

    if (w >= 47 || w < 4)
        return 2

    if (w >= 4 && w < 14)
        return 3

    return 0
}