let subjects

init()

async function vandaag() {
    if (!await getSetting('magister-vd-overhaul')) return
    let mainSection = await getElement('section.main'),
        container = document.createElement('div')
    mainSection.append(container)
    container.id = 'st-vd'

    // Schedule
    {
        await getElement('.agenda-list > li')

        let agendaElems = await getElement('.agenda-list > li', true),
            events = [],
            scheduleWrapper = document.createElement('div'),
            scheduleTodayContainer = document.createElement('ul'),
            scheduleTomorrowContainer = document.createElement('ul'),
            scheduleDaySwitcher = document.createElement('a')

        container.append(scheduleWrapper)
        scheduleWrapper.append(scheduleTodayContainer, scheduleTomorrowContainer, scheduleDaySwitcher)
        scheduleWrapper.id = 'st-vd-schedule'
        scheduleTomorrowContainer.dataset.hidden = true
        scheduleDaySwitcher.addEventListener('click', () => {
            let hidden = document.querySelector('#st-vd-schedule>ul[data-hidden]'),
                shown = document.querySelector('#st-vd-schedule>ul:not([data-hidden])')
            hidden.removeAttribute('data-hidden')
            shown.setAttribute('data-hidden', true)
        })
        scheduleDaySwitcher.innerText = '⇆'
        scheduleDaySwitcher.title = `Van dag wisselen`

        if (agendaElems) agendaElems.forEach((e, i, a) => {
            let time = e.querySelector('.time')?.innerText,
                title = e.querySelector('.classroom')?.innerText,
                period = e.querySelector('.nrblock')?.innerText,
                href = e.querySelector('a')?.href,
                tooltip = e.querySelector('.agenda-text-icon')?.innerText,
                tomorrow = !e.parentElement.nextElementSibling,
                dateStart = new Date(),
                dateEnd = new Date(),
                dateStartNext = new Date()

            if (time) {
                dateStart.setHours(time.split(' - ')[0].split(':')[0])
                dateStart.setMinutes(time.split(' - ')[0].split(':')[1])

                dateEnd.setHours(time.split(' - ')[1].split(':')[0])
                dateEnd.setMinutes(time.split(' - ')[1].split(':')[1])
            }

            events.push({ time, title, period, dateStart, dateEnd, href, tooltip, tomorrow })

            if (a[i + 1]) {
                let timeNext = a[i + 1].querySelector('.time').innerText
                dateStartNext.setHours(timeNext.split(' - ')[0].split(':')[0])
                dateStartNext.setMinutes(timeNext.split(' - ')[0].split(':')[1])

                if (dateStartNext - dateEnd > 1000) {
                    time = `${String(dateEnd.getHours()).padStart(2, '0')}:${String(dateEnd.getMinutes()).padStart(2, '0')} - ${String(dateStartNext.getHours()).padStart(2, '0')}:${String(dateStartNext.getMinutes()).padStart(2, '0')}`
                    events.push({ time, dateStart: dateEnd, dateEnd: dateStartNext, tomorrow })
                }
            }
        })

        if (events) events.forEach(async ({ time, title, period, dateStart, dateEnd, href, tooltip, tomorrow }, a, i) => {
            let settingSubjects = await getSetting('magister-subjects'),
                elementWrapper = document.createElement('li'),
                elementTime = document.createElement('span'),
                elementTitle = document.createElement('span'),
                elementPeriod = document.createElement('span'),
                elementTooltip = document.createElement('span'),
                now = new Date(),
                subject,
                searchString

            if (title) {
                searchString = title.split(' (')[0].split(' - ')[0]
                settingSubjects.forEach(subjectEntry => {
                    testArray = `${subjectEntry.name},${subjectEntry.aliases}`.split(',')
                    testArray.forEach(testString => {
                        if ((new RegExp(`^(${testString.trim()})$|^(${testString.trim()})[^a-z]|[^a-z](${testString.trim()})$|[^a-z](${testString.trim()})[^a-z]`, 'i')).test(searchString)) subject = subjectEntry.name
                    })
                })
            } else {
                elementWrapper.dataset.filler = true
                elementTime.dataset.filler = dateEnd - dateStart < 2700000 ? ' pauze' : ' lesvrij'
            }

            height = ((dateEnd - dateStart) / 50000) + 'px'

            elementWrapper.append(elementTime, elementTitle, elementPeriod, elementTooltip)
            elementTime.innerText = time || ''
            elementTitle.innerHTML = '<b>' + (subject || title?.split(' (')[0] || '') + '</b>' + (title?.replace(searchString, '') || '')
            elementPeriod.innerText = period || ''
            elementTooltip.innerText = tooltip || ''
            elementWrapper.style.height = height
            elementWrapper.setAttribute('onclick', `window.location.href = '${href}'`)

            if (!tooltip) elementTooltip.remove()

            if (now >= dateStart && now <= dateEnd) elementWrapper.dataset.current = 'true'
            scheduleTodayContainer.append(elementWrapper)
            if (tomorrow) scheduleTomorrowContainer.append(elementWrapper)
        })

        setTimeout(async () => {
            let agendaTomorrowTitle = await getElement('#agendawidgetlistcontainer>h4')
            scheduleTomorrowContainer.dataset.tomorrow = `Rooster voor ${agendaTomorrowTitle.innerText.replace('Wijzigingen voor ', '')}`
        }, 500)
    }

    // Notifications and grades

    {
        let lastGrade = await getElement('.block.grade-widget span.cijfer'),
            lastGradeDescription = await getElement('.block.grade-widget span.omschrijving'),
            unreadItems = await getElement('#notificatie-widget ul>li.unread', true),
            notifcationsWrapper = document.createElement('div'),
            gradeNotification = document.createElement('div'),
            unreadWrapper = document.createElement('ul'),
            unreadAssignmentWrapper = document.createElement('li'),
            unreadAssignmentCount = 0

        container.append(notifcationsWrapper)
        notifcationsWrapper.append(gradeNotification, unreadWrapper)
        notifcationsWrapper.id = 'st-vd-notifications'
        gradeNotification.id = 'st-vd-grade-notification'
        gradeNotification.innerText = lastGrade.innerText
        gradeNotification.dataset.gradePrefix = `Nieuw cijfer voor ${lastGradeDescription.innerText}: `

        if (lastGrade.innerText === '-' || lastGradeDescription.innerTExt === 'geen cijfers') gradeNotification.remove()

        unreadWrapper.id = 'st-vd-unread-notification'
        unreadWrapper.append(unreadAssignmentWrapper)
        unreadAssignmentWrapper.id = 'st-vd-unread-assignment-notification'

        setTimeout(() => {
            unreadItems.forEach((e, i, a) => {
                if (!e.classList.contains('unread') || e.firstElementChild.innerText.includes('geen') || e.firstElementChild.innerText.includes('?')) return console.warn('Notification item wrongfully marked as having content: ')

                let amount = e.firstElementChild.firstElementChild.innerText,
                    description = e.firstElementChild.innerText.replace(`${amount} `, ''),
                    href = e.firstElementChild.href,
                    element = document.createElement('li')


                if (description.includes('opdracht')) {
                    element = document.createElement('span')
                    if (description.includes('deadline')) description = 'met naderende deadline'
                    else if (description.includes('openstaand')) description = 'openstaand'
                    else if (description.includes('beoordeeld')) description = 'beoordeeld'
                    element.innerText = `${amount} ${description}`
                    element.setAttribute('onclick', `window.location.href = '${href}'`)
                    unreadAssignmentWrapper.append(element)
                    unreadAssignmentCount += Number(amount) || 0
                } else {
                    element.innerText = `${amount} ${description}`
                    element.setAttribute('onclick', `window.location.href = '${href}'`)
                    unreadWrapper.append(element)
                }
            })

            unreadAssignmentWrapper.dataset.assignments = unreadAssignmentCount
            if (unreadAssignmentCount === 0) unreadAssignmentWrapper.remove()
            if (!unreadWrapper.firstElementChild) unreadWrapper.remove()
        }, unreadItems[0].firstElementChild.innerText.includes('?') ? 1000 : 0)

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
            regex = new RegExp(`(?< ![0 - 9])(${await getWeekNumber()}){ 1 } (? ![0 - 9])`, "g")

        titles.forEach(title => {
            if (regex.test(title.innerText) || list.childElementCount === 1) {
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
        createStyle(`#st - sw - container{ display: block!important } #studiewijzer - container > aside, section.main >.content - container: has(.studiewijzer - list), div.full - height.widget > div.block: has(li[data - ng - repeat^= "studiewijzer in items"]){ display: none!important } #studiewijzer - container{ padding - right: 8px }.sidecolumn section.main{ padding - bottom: 0!important } `, 'study-tools-sw-grid')
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
            testArray = `${subjectEntry.name},${subjectEntry.aliases} `.split(',')
            testArray.forEach(testString => {
                if ((new RegExp(`^ (${testString.trim()})$ |^ (${testString.trim()})[^ a - z] | [^ a - z](${testString.trim()})$ | [^ a - z](${testString.trim()})[^ a - z]`, 'i')).test(title)) subject = subjectEntry.name
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
                subjectTile = document.querySelector(`div[data - subject= '${subject}']`)
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
                itemButton.innerText = period ? `periode ${period} ` : "geen periode"
                itemButton.dataset.title = title
            } else {
                itemButton.innerText = title
                itemButton.style.fontSize = '11px'
                itemButton.style.minHeight = '2rem'
            }
            itemButton.classList.add(`st - sw - ${priority} `)
            if (viewTitle && viewTitle.toLowerCase() === title.replace(/(\\n)|'|\s/gi, '').toLowerCase()) itemButton.classList.add(`st - sw - selected`)
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

    let appbar = await getElement('.appbar')

    subjects = await getSetting('magister-subjects')

    if (await getSetting('magister-appbar-zermelo')) {
        const appbarZermelo = document.createElement('div'),
            zermeloA = document.createElement('a'),
            zermeloImg = document.createElement('img'),
            zermeloSpan = document.createElement('span')
        appbar.firstElementChild.after(appbarZermelo)
        appbarZermelo.classList.add('menu-button')
        appbarZermelo.append(zermeloA)
        zermeloA.classList.add('zermelo-menu')
        zermeloA.setAttribute('href', `https://${window.location.hostname.split('.')[0]}.zportal.nl/app`)
        zermeloA.setAttribute('target', '_blank')
        zermeloA.append(zermeloImg)
        zermeloImg.setAttribute('src', 'https://raw.githubusercontent.com/QkeleQ10/QkeleQ10.github.io/main/img/zermelo.png')
        zermeloImg.setAttribute('width', '36')
        zermeloImg.style.borderRadius = '100%'
        zermeloA.append(zermeloSpan)
        zermeloSpan.innerText = "Zermelo"
    }

    if (await getSetting('magister-appbar-week')) {
        let appbarWeek = document.createElement("h1")
        appbarWeek.innerText = `week\r\n${await getWeekNumber()}`
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