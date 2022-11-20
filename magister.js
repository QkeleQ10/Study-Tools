init()

async function vandaag() {
    if (await getSetting('magister-vd-deblue')) {
        let blueItems = await getElement('ul.agenda-list>li.alert', true)
        blueItems.forEach(e => e.classList.remove("alert"))
        let changedHeader = await getElement('h4[data-ng-bind-template*="Wijzigingen voor"]')
        changedHeader.innerHTML = changedHeader.innerHTML.replace("Wijzigingen voor", "Rooster voor")
    }
}

async function agenda() {
    if (await getSetting('magister-ag-spacious')) {
        let agendaItems = await getElement('tr.ng-scope', true)
        agendaItems.forEach(e => e.style.height = "40px")
    }
}

async function studiewijzers() {
    if (await getSetting('magister-sw-sort')) {
        let elementMain = await getElement('section.main'),
            elementOldContainer = await getElement('.content-container'),
            elementGrid = document.createElement('div'),
            elementUl = await getElement('.studiewijzer-list>ul'),
            settingGrid = await getSetting('magister-sw-grid'),
            settingSubjects = await getSetting('magister-sw-subjects'),
            nodeList = await getElement('li[data-ng-repeat="studiewijzer in items"]', true),
            nodeArray = [...nodeList],
            mappedArray = nodeArray.map(elem => {
                let swTitle = elem.firstElementChild.firstElementChild,
                    swSubject = elem.firstElementChild.lastElementChild,
                    subject,
                    period,
                    priority,
                    periodTextIndex = swTitle.innerText.search(/(t(hema)?|p(eriod(e)?)?)(\s|\d)/i)

                Object.values(settingSubjects)[0].forEach(names => {
                    names.forEach(name => {
                        if ((new RegExp(`^(${name.trim()})$|^(${name.trim()})[^a-z]|[^a-z](${name.trim()})$|[^a-z](${name.trim()})[^a-z]`, 'i')).test(swTitle.innerText)) subject = names[0]
                    })
                })

                if (periodTextIndex > 0) {
                    let periodNumberSearchString = swTitle.innerText.slice(periodTextIndex),
                        periodNumberIndex = periodNumberSearchString.search(/[1-9]/i)
                    if (periodNumberIndex > 0) {
                        period = Number(periodNumberSearchString.charAt(periodNumberIndex))
                    }
                }

                if (period === getPeriodNumber()) priority = 2
                else if (period > 0) priority = 0
                else priority = 1

                return { elem: elem, title: swTitle.innerText, period: period, subject: subject || "Geen vak", priority: priority }
            }).sort((a, b) => (b.priority - a.priority || a.subject.localeCompare(b.subject)))

        if (settingGrid) {
            elementOldContainer.style.display = 'none'
            elementMain.appendChild(elementGrid)
            elementGrid.classList.add('st-sw-grid')
        }

        mappedArray.forEach(({ elem, title, period, subject, priority }) => {
            elementUl.appendChild(elem)
            elem.firstElementChild.lastElementChild.innerText = subject
            switch (priority) {
                case 2:
                    if (settingGrid) {
                        let button = document.createElement('button')
                        elementGrid.appendChild(button)
                        button.classList.add('st-sw-item', 'st-current')
                        button.innerHTML = `<h3>${subject}</h3><p style="font-weight:bold">periode ${period}</p><p style="font-weight:normal;font-size:10px;color:#808080">${title}</p>`
                        button.addEventListener('click', () => { elem.firstElementChild.click() })
                    }
                    elem.classList.add('st-current')
                    elem.setAttribute('title', "Deze studiewijzer is actueel.")
                    break

                case 1:
                    if (settingGrid) {
                        let button = document.createElement('button')
                        elementGrid.appendChild(button)
                        button.classList.add('st-sw-item')
                        button.innerHTML = `<h3>${subject}</h3><p style="font-weight:bold">geen periode</p><p style="font-weight:normal;font-size:10px;color:#808080">${title}</p>`
                        button.addEventListener('click', () => { elem.firstElementChild.click() })
                    }
                    elem.setAttribute('title', "Er kon geen periodenummer worden gedetecteerd.")
                    break

                default:
                    if (settingGrid) {
                        let button = document.createElement('button')
                        elementGrid.appendChild(button)
                        button.classList.add('st-sw-item', 'st-obsolete')
                        button.innerHTML = `<h3>${subject}</h3><p style="font-weight:bold">periode ${period}</p><p style="font-weight:normal;font-size:10px;color:#808080">${title}</p>`
                        button.addEventListener('click', () => { elem.firstElementChild.click() })
                    }
                    elem.classList.add('st-obsolete')
                    elem.setAttribute('title', `Deze studiewijzer is van periode ${period}.`)
                    break
            }
        })
    }
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

async function opdrachten() {
    if (await getSetting('magister-op-oldred')) {
        let handInBefore = await getElement('td[data-ng-bind*="InleverenVoor"]', true),
            overdueAssignments = await getElement('.overdue', true)
        handInBefore.forEach(e => {
            let d = new Date("20" + e.innerHTML.split("-")[2], Number(Number(e.innerHTML.split("-")[1]) - 1), e.innerHTML.split("-")[0])
            let opt = { weekday: "short", year: "2-digit", month: "short", day: "numeric" }
            if (d.toLocaleDateString("nl-NL", opt) != "Invalid Date") e.innerHTML = d.toLocaleDateString("nl-NL", opt)
        })
        overdueAssignments.forEach(e => {
            e.classList.add('st-obsolete')
            e.setAttribute('title', "De inlevertermijn van deze opdracht is verstreken.")
            e.parentElement.appendChild(e)
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
    createStyle(`.st-current{background-color:#f0f8ff!important;font-weight:700}.st-obsolete{background-color:#fff0f5!important;font-style:italic}.st-current-sw>div>h3,.st-current-sw>div>h3>b,.st-current-sw>div>div>footer.endlink{background:aliceBlue;font-weight:700}.st-sw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16em,1fr));gap:1em}.st-sw-item{background-color:#fafafa;cursor:pointer;display:grid;grid-auto-rows:1fr 1.5em 24px;align-items:center;gap:.3em;padding:1em .5em .3em;aspect-ratio:1/0.7;border-radius:5px;border:1px solid #ccc}.st-current:hover,.st-obsolete:hover,.st-sw-item:hover{filter:brightness(.9)}.st-sw-item h3{overflow:hidden}`, 'study-tools')

    if (await getSetting('magister-cf-failred')) {
        createStyle(`.grade[title="5,0"],.grade[title="5,1"],.grade[title="5,2"],.grade[title="5,3"],.grade[title="5,4"],.grade[title^="1,"],.grade[title^="2,"],.grade[title^="3,"],.grade[title^="4,"]{background-color:lavenderBlush !important;color:red !important;font-weight:700}`, 'study-tools-cf-failred')
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