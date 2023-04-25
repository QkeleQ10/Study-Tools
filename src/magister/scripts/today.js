// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
}

// Page 'Vandaag'
async function today() {
    if (!await getSetting('magister-vd-overhaul')) return
    let mainSection = await getElement('section.main'),
        container = document.createElement('div'),
        header = document.createElement('div'),
        headerText = document.createElement('span'),
        scheduleWrapper = document.createElement('div'),
        notifcationsWrapper = document.createElement('div')
    mainSection.append(header, container)
    header.id = 'st-vd-header'
    header.append(headerText)
    container.id = 'st-vd'
    container.append(scheduleWrapper, notifcationsWrapper)
    scheduleWrapper.id = 'st-vd-schedule'
    notifcationsWrapper.id = 'st-vd-notifications'

    todayNotifications(notifcationsWrapper)
    todaySchedule(scheduleWrapper)

    const date = new Date(),
        weekday = date.toLocaleString('nl-NL', { weekday: 'long' }),
        greetings = [
            [22, 'Goedenavond.', 'Goedenavond!', 'Goedenavond, nachtuil.', `Fijne ${weekday}avond!`, 'Bonsoir!', 'Buenas noches!', 'Guten Abend!'], // 22:00 - 23:59
            [18, 'Goedenavond.', 'Goedenavond!', `Fijne ${weekday}avond!`, 'Bonsoir!', 'Buenas tardes!', 'Guten Abend!'], // 18:00 - 21:59
            [12, 'Goedemiddag.', 'Goedemiddag!', `Fijne ${weekday}middag!`, 'Bonjour!', 'Buenas tardes!', 'Guten Mittag!'], // 12:00 - 17:59
            [6, 'Goedemorgen.', 'Goedemorgen!', 'Goeiemorgen.', 'Goeiemorgen!', `Fijne ${weekday}ochtend!`, 'Bonjour!', 'Buenos días!', 'Guten Morgen!'], // 6:00 - 11:59
            [0, 'Goedemorgen.', 'Goedemorgen!', 'Goeiemorgen.', 'Goeiemorgen!', 'Goedemorgen, nachtuil.', 'Goedemorgen, vroege vogel!', `Fijne ${weekday}ochtend!`, 'Bonjour!', 'Buenos días!', 'Guten Morgen!'] // 0:00 - 5:59
        ],
        hour = date.getHours()
    greetings.forEach(e => {
        if (hour >= e[0]) {
            e.shift()
            e.push('Hallo.', 'Hallo!')
            if (!headerText.innerText) {
                let greeting = e[Math.floor(Math.random() * e.length)]
                headerText.innerText = greeting.slice(0, -1)
                headerText.dataset.lastLetter = greeting.slice(-1)
            }
        }
    })
    if (Math.random() < 0.01) showSnackbar("Bedankt voor het gebruiken van StudyTools!")
    if (Math.random() < 0.005) showSnackbar("Welkom op het Magister dat Iddink niet kon creëren :)")

    setTimeout(() => header.dataset.transition = true, 2000)
    setTimeout(() => {
        todayNotifications(notifcationsWrapper)

        headerText.innerText = date.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        headerText.dataset.lastLetter = '.'
        header.removeAttribute('data-transition')
    }, 2500)
}

async function todayNotifications(notifcationsWrapper) {
    let lastGrade = await getElement('.block.grade-widget span.cijfer'),
        lastGradeDescription = await getElement('.block.grade-widget span.omschrijving'),
        moreGrades = await getElement('.block.grade-widget ul.list.arrow-list > li:nth-child(2) span'),
        unreadItems = await getElement('#notificatie-widget ul>li', true),
        gradeNotification = document.getElementById('st-vd-grade-notification') || document.createElement('li'),
        gradeNotificationSpan = document.getElementById('st-vd-grade-notification-span') || document.createElement('span')

    gradeNotification.id = 'st-vd-grade-notification'
    gradeNotificationSpan.id = 'st-vd-grade-notification-span'

    if (!lastGrade || !lastGradeDescription) return

    if (lastGrade.innerText === '-' || lastGradeDescription.innerText === 'geen cijfers') {
        gradeNotification.innerText = 'Geen nieuwe cijfers'
        gradeNotification.dataset.insignificant = true
    } else {
        if (await getSetting('magister-vd-grade') === 'partial') {
            gradeNotification.innerText = `${Number(moreGrades.innerText)} nieuwe cijfers`
        } else {
            gradeNotification.innerText = `Nieuw cijfer voor ${lastGradeDescription.innerText}: `
            gradeNotificationSpan.innerText = lastGrade.innerText
            if (Number(moreGrades.innerText) === 2) {
                gradeNotification.dataset.additionalInfo = `en nog ${Number(moreGrades.innerText) - 1} ander cijfer`
            } else if (Number(moreGrades.innerText) > 2) {
                gradeNotification.dataset.additionalInfo = `en nog ${Number(moreGrades.innerText) - 1} andere cijfers`
            }
        }
        gradeNotification.dataset.insignificant = false
    }

    if (await getSetting('magister-vd-grade') !== 'off') {
        if (!gradeNotification.parentElement) notifcationsWrapper.append(gradeNotification)
        gradeNotification.setAttribute('onclick', `window.location.href = '#/cijfers'`)
        gradeNotification.dataset.icon = ''
        gradeNotification.append(gradeNotificationSpan)
    }

    unreadItems.forEach((e, i, a) => {
        setTimeout(() => {
            let amount = e.firstElementChild.firstElementChild.innerText,
                description = e.firstElementChild.innerText.replace(`${amount} `, ''),
                href = e.firstElementChild.href,
                element = document.querySelector(`li[data-description="${description}"]`) || document.createElement('li')

            element.dataset.description = description
            if (e.firstElementChild.innerText.includes('?') || !description) return element.remove()

            if (description.includes('deadline')) {
                if (e.firstElementChild.innerText.includes('geen')) return
                document.querySelector('#st-vd-unread-open-assignments').dataset.additionalInfo = `waarvan ${amount} met naderende deadline`
            } else {
                let insertIndex = Array.prototype.indexOf.call(e.parentElement.children, e)

                if (!element.parentElement) notifcationsWrapper.append(element)
                notifcationsWrapper.insertBefore(element, notifcationsWrapper.children[insertIndex + 2])

                element.innerText = `${amount} ${description}`
                element.setAttribute('onclick', `window.location.href = '${href}'`)

                if (e.firstElementChild.innerText.includes('geen')) element.dataset.insignificant = true
                else element.dataset.insignificant = false
                if (description.includes('openstaand')) {
                    element.id = 'st-vd-unread-open-assignments'
                    element.dataset.icon = ''
                } else if (description.includes('beoordeeld')) {
                    element.dataset.icon = ''
                } else if (description.includes('activiteit')) {
                    element.dataset.icon = ''
                } else if (description.includes('logboek')) {
                    element.dataset.icon = ''
                }
            }
        }, e.firstElementChild.innerText.includes('?') ? 500 : 0)
    })

    notifcationsWrapper.dataset.ready = true
}

async function todaySchedule(scheduleWrapper) {
    let scheduleTodayContainer = document.createElement('ul'),
        scheduleTomorrowContainer = document.createElement('ul'),
        scheduleButtonWrapper = document.createElement('div'),
        scheduleLinkWeek = document.createElement('a'),
        scheduleLinkList = document.createElement('a')

    scheduleWrapper.append(scheduleTodayContainer, scheduleButtonWrapper)
    scheduleButtonWrapper.append(scheduleLinkWeek, scheduleLinkList)
    scheduleLinkWeek.innerText = ''
    scheduleLinkWeek.classList.add('st-vd-schedule-link')
    scheduleLinkWeek.title = `Weekoverzicht`
    scheduleLinkWeek.href = '#/agenda/werkweek'
    scheduleLinkList.innerText = ''
    scheduleLinkList.classList.add('st-vd-schedule-link')
    scheduleLinkList.title = `Afsprakenlijst`
    scheduleLinkList.href = '#/agenda'

    let agendaTodayElems = await getElement('.agenda-list:not(.roosterwijziging)>li:not(.no-data)', true, 4000)
    renderScheduleList(agendaTodayElems, scheduleTodayContainer)

    setTimeout(async () => {
        let agendaTomorrowTitle = await getElement('#agendawidgetlistcontainer>h4', 4000),
            agendaTomorrowElems = await getElement('.agenda-list.roosterwijziging>li:not(.no-data)', true, 4000)
        if (!agendaTomorrowTitle, agendaTomorrowElems) return
        scheduleWrapper.firstElementChild.after(scheduleTomorrowContainer)
        scheduleTomorrowContainer.dataset.tomorrow = `Rooster voor ${agendaTomorrowTitle?.innerText?.replace('Wijzigingen voor ', '') || 'morgen'}`
        renderScheduleList(agendaTomorrowElems, scheduleTomorrowContainer)
    }, 500)

    scheduleWrapper.dataset.ready = true
}

async function renderScheduleList(agendaElems, container) {
    let events = []

    if (agendaElems) agendaElems.forEach((e, i, a) => {
        let time = e.querySelector('.time')?.innerText,
            title = e.querySelector('.classroom')?.innerText,
            period = e.querySelector('.nrblock')?.innerText,
            href = e.querySelector('a')?.href,
            tooltip = e.querySelector('.agenda-text-icon')?.innerText,
            tooltipIncomplete = e.querySelector('.agenda-text-icon')?.classList.contains('outline'),
            dateStart = new Date(),
            dateEnd = new Date(),
            dateStartNext = new Date()

        if (time) {
            dateStart.setHours(time.split('-')[0].split(':')[0])
            dateStart.setMinutes(time.split('-')[0].split(':')[1])
            dateStart.setSeconds(0)

            dateEnd.setHours(time.split('-')[1].split(':')[0])
            dateEnd.setMinutes(time.split('-')[1].split(':')[1])
            dateEnd.setSeconds(0)
        }

        events.push({ time, title, period, dateStart, dateEnd, href, tooltip, tooltipIncomplete })

        if (a[i + 1]) {
            let timeNext = a[i + 1]?.querySelector('.time')?.innerText
            if (!timeNext) return
            dateStartNext.setHours(timeNext.split('-')[0].split(':')[0])
            dateStartNext.setMinutes(timeNext.split('-')[0].split(':')[1])
            dateStartNext.setSeconds(0)

            if (dateStartNext - dateEnd > 1000) {
                time = `${String(dateEnd.getHours()).padStart(2, '0')}:${String(dateEnd.getMinutes()).padStart(2, '0')} – ${String(dateStartNext.getHours()).padStart(2, '0')}:${String(dateStartNext.getMinutes()).padStart(2, '0')}`
                events.push({ time, title: 'filler', dateStart: dateEnd, dateEnd: dateStartNext })
            }
        }
    })

    if (events) events.forEach(async ({ time, title, period, dateStart, dateEnd, href, tooltip, tooltipIncomplete }, a, i) => {
        let elementWrapper = document.createElement('li'),
            elementTime = document.createElement('span'),
            elementTitle = document.createElement('span'),
            elementTitleBold = document.createElement('b'),
            elementTitleNormal1 = document.createElement('span'),
            elementTitleNormal2 = document.createElement('span'),
            elementPeriod = document.createElement('span'),
            elementTooltip = document.createElement('span'),
            parsedTitle

        container.append(elementWrapper)
        if (title !== 'filler') {
            parsedTitle = await parseSubject(title, await getSetting('magister-vd-subjects'), await getSetting('magister-subjects'))
            elementTitleNormal1.innerText = parsedTitle.stringBefore || ''
            elementTitleBold.innerText = parsedTitle.subjectName || ''
            elementTitleNormal2.innerText = parsedTitle.stringAfter || ''
        } else {
            elementWrapper.dataset.filler = true
            elementTime.dataset.filler = dateEnd - dateStart < 2700000 ? 'pauze' : 'geen les'
        }

        height = await msToPixels(dateEnd - dateStart) + 'px'

        elementWrapper.append(elementTime, elementTitle, elementPeriod, elementTooltip)
        elementTime.innerText = time || ''
        elementTitle.append(elementTitleNormal1, elementTitleBold, elementTitleNormal2)
        elementPeriod.innerText = period || ''
        elementTooltip.innerText = tooltip || ''
        if (tooltipIncomplete) elementTooltip.classList.add('incomplete')
        elementWrapper.style.height = height
        elementWrapper.setAttribute('onclick', `window.location.href = '${href}'`)

        if (!tooltip) elementTooltip.remove()

        setIntervalImmediately(async () => {
            if (new Date() >= dateStart && new Date() <= dateEnd) {
                elementWrapper.dataset.current = 'true'
                if (title !== 'filler') elementPeriod.style.borderBottom = await msToPixels(dateEnd - new Date()) + 'px solid var(--st-accent-primary)'
            } else if (new Date() > dateEnd) {
                elementWrapper.dataset.past = 'true'
                elementWrapper.removeAttribute('data-current')
                elementPeriod.removeAttribute('style')
            } else {
                elementWrapper.removeAttribute('data-current')
                elementWrapper.removeAttribute('data-past')
                elementPeriod.removeAttribute('style')
            }
        }, 10000)
    })
}