init()

async function vandaag() {
    let lastGrade = await getElement('.block.grade-widget span.cijfer')
    if (lastGrade && !lastGrade.innerText.includes('-')) lastGrade.parentElement.parentElement.parentElement.classList.add('st-grade-widget-yes')
    setTimeout(() => {
        if (lastGrade && !lastGrade.innerText.includes('-')) lastGrade.parentElement.parentElement.parentElement.classList.add('st-grade-widget-yes')
    }, 300)
}


async function agenda() {
    // TODO: CSS
    if (await getSetting('magister-ag-large')) {
        let agendaItems = await getElement('tr.ng-scope', true)
        if (agendaItems) agendaItems.forEach(e => e.style.height = "40px")
    }
}

async function studiewijzers() {
    if (!await getSetting('magister-sw-sort')) return
    const gridContainer = await getElement('section.main')
    displayStudiewijzerArray(gridContainer)
}

async function studiewijzer() {
    if (await getSetting('magister-sw-thisWeek')) {
        let list = await getElement('ul:has(li.studiewijzer-onderdeel)'),
            titles = await getElement('li.studiewijzer-onderdeel>div.block>h3>b.ng-binding', true),
            regex = new RegExp(`(?<![0-9])(${await getWeekNumber()}){1}(?![0-9])`, "g")

        titles.forEach(title => {
            if (regex.test(title.innerHTML) || list.childElementCount === 1) {
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

    if (!await getSetting('magister-sw-sort')) return
    const gridContainer = await getElement('div.full-height.widget')
    displayStudiewijzerArray(gridContainer, true)
}

async function displayStudiewijzerArray(gridContainer, compact) {
    const settingGrid = await getSetting('magister-sw-grid'),
        settingShowPeriod = await getSetting('magister-sw-period'),
        settingSubjects = await getSetting('magister-subjects'),
        currentPeriod = await getPeriodNumber(),
        viewTitle = document.querySelector('dna-page-header.ng-binding')?.firstChild?.textContent?.replace(/(\\n)|'|\s/gi, ''),
        originalList = await getElement('ul:has(li[data-ng-repeat^="studiewijzer in items"])'),
        originalItems = await getElement('li[data-ng-repeat^="studiewijzer in items"]', true),
        originalItemsArray = [...originalItems],
        gridWrapper = document.createElement('div'),
        grid = document.createElement('div')

    if (settingGrid) {
        createStyle(`#st-sw-container{display:block!important}#studiewijzer-container>aside,section.main>.content-container:has(.studiewijzer-list),div.full-height.widget>div.block:has(li[data-ng-repeat^="studiewijzer in items"]){display:none!important}#studiewijzer-container{padding-right:8px}.sidecolumn section.main{padding-bottom:0!important}`, 'study-tools-sw-grid')
        gridContainer.appendChild(gridWrapper)
        gridWrapper.id = 'st-sw-container'
        gridWrapper.appendChild(grid)
        grid.id = 'st-sw-grid'
    }

    let mappedArray = originalItemsArray.map(elem => {
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


    mappedArray.forEach(async ({ elem, title, period, subject, priority }, i) => {
        elem.dataset.swStIndex = i
        elem.dataset.title = title
        if (settingGrid) {
            let itemButton = document.createElement('button'),
                subjectTile = document.querySelector(`div[data-subject='${subject}']`)
            if (!subjectTile) {
                subjectTile = document.createElement('div')
                grid.appendChild(subjectTile)
                subjectTile.classList.add('st-sw-subject')
                subjectTile.dataset.subject = subject
                const defaultItemButton = document.createElement('button')
                defaultItemButton.innerText = subject
                subjectTile.appendChild(defaultItemButton)
                defaultItemButton.setAttribute('onclick', 'this.parentElement.lastElementChild.click()')
                if (compact) subjectTile.classList.add('st-sw-compact')
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
            if (viewTitle && viewTitle.toLowerCase() === title.replace(/(\\n)|'|\s/gi, '').toLowerCase()) itemButton.classList.add(`st-sw-selected`)
            itemButton.setAttribute('onclick', `document.querySelector('li[data-sw-st="${i}"], li[data-title="${title}"]>a').click()`)
            subjectTile.appendChild(itemButton)
        } else {
            originalList.appendChild(elem)
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

// Run when the extension and page are loaded
async function init() {
    popstate()

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
        appbarWeek.innerHTML = `week<br>${await getWeekNumber()}`
        appbarWeek.id = 'st-appbar-week'
        appbar.prepend(appbarWeek)
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