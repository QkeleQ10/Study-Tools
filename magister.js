init()

async function init() {
    checkSettings()
    checkUpdates()
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
        let swList = await getElement('.studiewijzer-list>ul'),
            swNodeList = await getElement('li[data-ng-repeat="studiewijzer in items"]', true)

        swNodeList.forEach(async elem => {
            let swTitle = elem.firstElementChild.firstElementChild,
                swSubject = elem.firstElementChild.lastElementChild,
                period,
                periodTextIndex = swTitle.innerText.search(/(t(hema)?|p(eriod(e)?)?)(\s|\d)/i)
            if (periodTextIndex > 0) {
                let periodNumberSearchString = swTitle.innerText.slice(periodTextIndex),
                    periodNumberIndex = periodNumberSearchString.search(/[1-9]/i)
                if (periodNumberIndex > 0) {
                    period = Number(periodNumberSearchString.charAt(periodNumberIndex))
                }
            }

            if (period == await getPeriodNumber(await getWeekNumber())) {
                elem.classList.add('st-current')
                elem.setAttribute('title', "Deze studiewijzer is actueel.")
                swList.prepend(elem)
            } else if (period > 0) {
                elem.classList.add('st-obsolete')
                elem.setAttribute('title', `Deze studiewijzer is van periode ${period}.`)
                swList.appendChild(elem)
            } else {
                elem.setAttribute('title', "Er kon geen periodenummer worden gedetecteerd.")
            }
            return { element: elem, period: period }
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
    createStyle(`.st-current:not(:hover){background-color:#f0f8ff!important}.st-current{font-weight:700}.st-obsolete:not(:hover){background-color:#fff0f5!important}.st-obsolete{font-style:italic}.st-current-sw>div>h3,.st-current-sw>div>h3>b,.st-current-sw>div>div>footer.endlink{background:aliceBlue;font-weight:700}`, 'study-tools')

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
    if (w >= 30 && w < 48)
        return 1

    if (w >= 48 || w < 4)
        return 2

    if (w >= 4 && w < 14)
        return 3

    return 0
}