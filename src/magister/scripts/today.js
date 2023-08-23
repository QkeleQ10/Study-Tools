// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
}

// Page 'Vandaag'
async function today() {
    if (!syncedStorage['magister-vd-overhaul']) return
    let mainSection = await awaitElement('section.main'),
        container = document.createElement('div'),
        header = document.createElement('div'),
        headerText = document.createElement('span'),
        scheduleWrapper = document.createElement('div'),
        notifcationsWrapper = document.createElement('div')
    mainSection.append(header, container)
    header.id = 'st-vd-header'
    header.append(headerText)
    headerText.classList.add('st-title')
    container.id = 'st-vd'
    container.append(scheduleWrapper, notifcationsWrapper)
    scheduleWrapper.id = 'st-vd-schedule'
    notifcationsWrapper.id = 'st-vd-notifications'

    todayNotifications(notifcationsWrapper)
    todaySchedule(scheduleWrapper)

    const date = new Date(),
        weekday = date.toLocaleString('nl-NL', { weekday: 'long' }),
        firstName = (await awaitElement("#user-menu > figure > img")).alt.split(' ')[0],
        greetings = [
            [22, 'Goedenavond#', 'Goedenavond, nachtuil.', `Fijne ${weekday}avond!`, 'Bonsoir!', 'Buenas noches!', 'Guten Abend!'], // 22:00 - 23:59
            [18, 'Goedenavond#', `Fijne ${weekday}avond!`, 'Bonsoir!', 'Buenas tardes!', 'Guten Abend!'], // 18:00 - 21:59
            [12, 'Goedemiddag#', `Fijne ${weekday}middag!`, 'Bonjour!', 'Buenas tardes!', 'Guten Mittag!'], // 12:00 - 17:59
            [6, 'Goedemorgen#', 'Goeiemorgen#', `Fijne ${weekday}ochtend!`, 'Bonjour!', 'Buenos días!', 'Guten Morgen!'], // 6:00 - 11:59
            [0, 'Goedemorgen#', 'Goeiemorgen#', 'Goedemorgen, nachtuil.', 'Goedemorgen, vroege vogel!', `Fijne ${weekday}ochtend!`, 'Bonjour!', 'Buenos días!', 'Guten Morgen!'] // 0:00 - 5:59
        ],
        hour = date.getHours()
    greetings.forEach(e => {
        if (hour >= e[0]) {
            e.shift()
            e.push('Welkom#', 'Hallo!', `Welkom terug, ${firstName}#`)
            if (!headerText.innerText) {
                let punctuation = Math.random() < 0.5 ? '.' : '!',
                    greeting = e[Math.floor(Math.random() * e.length)].replace('#', punctuation)
                headerText.innerText = greeting.slice(0, -1)
                headerText.dataset.lastLetter = greeting.slice(-1)
            }
        }
    })
    if (Math.random() < 0.01) showSnackbar("Bedankt voor het gebruiken van Study Tools 💚")

    setTimeout(() => header.dataset.transition = true, 2000)
    setTimeout(() => {
        todayNotifications(notifcationsWrapper)

        headerText.innerText = date.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        headerText.dataset.lastLetter = '.'
        header.removeAttribute('data-transition')
    }, 2500)
}

async function todayNotifications(notifcationsWrapper) {
    let lastGrade = await awaitElement('.block.grade-widget span.cijfer'),
        lastGradeDescription = await awaitElement('.block.grade-widget span.omschrijving'),
        moreGrades = await awaitElement('.block.grade-widget ul.list.arrow-list > li:nth-child(2) span'),
        unreadItems = await awaitElement('#notificatie-widget ul>li', true),
        gradeNotification = document.getElementById('st-vd-grade-notification') || document.createElement('li'),
        gradeNotificationSpan = document.getElementById('st-vd-grade-notification-span') || document.createElement('span')

    gradeNotification.id = 'st-vd-grade-notification'
    gradeNotificationSpan.id = 'st-vd-grade-notification-span'

    if (!lastGrade || !lastGradeDescription) return

    if (lastGrade.innerText === '-' || lastGradeDescription.innerText === 'geen cijfers') {
        gradeNotification.innerText = 'Geen nieuwe cijfers'
        gradeNotification.dataset.insignificant = true
    } else {
        if (syncedStorage['magister-vd-grade'] === 'partial') {
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

    if (syncedStorage['magister-vd-grade'] !== 'off') {
        if (!gradeNotification.parentElement) notifcationsWrapper.append(gradeNotification)
        gradeNotification.setAttribute('onclick', `window.location.href = '#/cijfers'`)
        gradeNotification.dataset.icon = ''
        gradeNotification.append(gradeNotificationSpan)
    }

    unreadItems.forEach((e, i, a) => {
        setTimeout(() => {
            let amount = e.firstElementChild.firstElementChild.innerText,
                description = e.firstElementChild.innerText.replace(`${amount} `, ''),
                href = e.firstElementChild.href

            if (description === 'activiteiten waarop nog ingeschreven moet of kan worden') description = 'activiteiten'
            if (description === 'activiteit waarop nog ingeschreven moet of kan worden') description = 'activiteit'

            let element = document.querySelector(`li[data-description="${description}"]`) || document.createElement('li')

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

// TODO: Gather using the API rather than scraping
async function todaySchedule(scheduleWrapper) {
    let scheduleTodayContainer = document.createElement('ul'),
        scheduleTomorrowContainer = document.createElement('ul'),
        scheduleButtonWrapper = document.createElement('div'),
        scheduleLinkWeek = document.createElement('a'),
        scheduleLinkList = document.createElement('a'),
        scheduleNowLine = document.createElement('div'),
        legacy = false

    scheduleWrapper.append(scheduleTodayContainer, scheduleButtonWrapper)

    if (legacy) {
        scheduleButtonWrapper.append(scheduleLinkWeek, scheduleLinkList)
        scheduleLinkWeek.innerText = ''
        scheduleLinkWeek.classList.add('st-vd-schedule-link')
        scheduleLinkWeek.title = `Weekoverzicht`
        scheduleLinkWeek.href = '#/agenda/werkweek'
        scheduleLinkList.innerText = ''
        scheduleLinkList.classList.add('st-vd-schedule-link')
        scheduleLinkList.title = `Afsprakenlijst`
        scheduleLinkList.href = '#/agenda'
    }

    let agendaTodayElems = await awaitElement('.agenda-list:not(.roosterwijziging)>li:not(.no-data)', true, 4000)
    renderScheduleList(agendaTodayElems, scheduleTodayContainer)

    if (!legacy) {
        scheduleTodayContainer.append(scheduleNowLine)
    }

    setTimeout(async () => {
        let agendaTomorrowTitle = await awaitElement('#agendawidgetlistcontainer>h4', 4000),
            agendaTomorrowElems = await awaitElement('.agenda-list.roosterwijziging>li:not(.no-data)', true, 4000)
        if (!agendaTomorrowTitle, agendaTomorrowElems) return
        scheduleWrapper.firstElementChild.after(scheduleTomorrowContainer)
        scheduleTomorrowContainer.dataset.tomorrow = `Rooster voor ${agendaTomorrowTitle?.innerText?.replace('Wijzigingen voor ', '') || 'morgen'}`
        renderScheduleList(agendaTomorrowElems, scheduleTomorrowContainer)
    }, 500)

    scheduleWrapper.dataset.ready = true

    async function renderScheduleList(agendaElems, container) {
        let events = [],
            overlapIndexMap = {},
            overlapComparisonMap = {},
            firstStart = new Date().setHours(23, 59, 59, 0),
            lastEnd = new Date().setHours(0, 0, 0, 0)

        if (agendaElems) agendaElems.forEach((e, i, a) => {
            let time = e.querySelector('.time')?.innerText?.replace('00:00', '23:59'),
                title = e.querySelector('.classroom')?.innerText,
                period = e.querySelector('.nrblock')?.innerText,
                href = e.querySelector('a')?.href,
                tooltip = e.querySelector('.agenda-text-icon')?.innerText,
                tooltipIncomplete = e.querySelector('.agenda-text-icon')?.classList.contains('outline'),
                start = new Date(),
                end = new Date(),
                duration = 0,
                dateStartNext = new Date()

            if (time) {
                start.setHours(time.split('-')[0].split(':')[0])
                start.setMinutes(time.split('-')[0].split(':')[1])
                start.setSeconds(0)

                end.setHours(time.split('-')[1].split(':')[0])
                end.setMinutes(time.split('-')[1].split(':')[1])
                end.setSeconds(0)

                duration = end - start - i
            }

            if (legacy && a[i + 1]) {
                let timeNext = a[i + 1]?.querySelector('.time')?.innerText
                if (!timeNext) return
                dateStartNext.setHours(timeNext.split('-')[0].split(':')[0])
                dateStartNext.setMinutes(timeNext.split('-')[0].split(':')[1])
                dateStartNext.setSeconds(0)

                if (dateStartNext - end > 1000) {
                    time = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')} – ${String(dateStartNext.getHours()).padStart(2, '0')}:${String(dateStartNext.getMinutes()).padStart(2, '0')}`
                    events.push({ time, title: 'filler', start: end, end: dateStartNext })
                }
            }

            events.push({ id: i, title, period, start, end, duration, href, tooltip, tooltipIncomplete })

            overlapIndexMap[i] = 0
            overlapComparisonMap[i] = new Set()

            if (start <= firstStart) firstStart = start
            if (end >= lastEnd) lastEnd = end
        })

        if (events && !legacy) events.sort((a, b) => b.duration - a.duration)
        else if (events && legacy) events.sort((a, b) => a.start - b.start)

        if (events) events.forEach(async ({ id, title, period, start, end, duration, href, tooltip, tooltipIncomplete }, i) => {
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

            if (!legacy) events.forEach(comparingEvent => {
                if (Math.abs(comparingEvent.start - end) < 100) {
                    elementWrapper.classList.add('border-bottom-radius-none')
                }

                if (Math.abs(comparingEvent.end - start) < 100) {
                    elementWrapper.classList.add('border-top-radius-none')
                }

                if (id === comparingEvent.id || overlapComparisonMap[id].has(comparingEvent.id) || overlapComparisonMap[comparingEvent.id].has(id)) return
                if ((start >= comparingEvent.start && start < comparingEvent.end)) {
                    if (duration > comparingEvent.duration) {
                        overlapIndexMap[comparingEvent.id] = overlapIndexMap[id] + 1
                        overlapComparisonMap[comparingEvent.id].add(id)
                    }
                    else {
                        overlapIndexMap[id] = overlapIndexMap[comparingEvent.id] + 1
                        overlapComparisonMap[id].add(comparingEvent.id)
                    }
                } else if ((end > comparingEvent.start && end <= comparingEvent.end)) {
                    if (duration > comparingEvent.duration) {
                        overlapIndexMap[comparingEvent.id] = overlapIndexMap[id] + 1
                        overlapComparisonMap[comparingEvent.id].add(id)
                    }
                    else {
                        overlapIndexMap[id] = overlapIndexMap[comparingEvent.id] + 1
                        overlapComparisonMap[id].add(comparingEvent.id)
                    }
                }
            })

            if (!legacy || title !== 'filler') {
                let subjects = Object.values(syncedStorage['subjects'])
                parsedTitle = await parseSubject(title, syncedStorage['vd-subjects-display'] === 'custom', subjects)
                elementTitleNormal1.innerText = parsedTitle.stringBefore || ''
                elementTitleBold.innerText = parsedTitle.subjectName || ''
                elementTitleNormal2.innerText = parsedTitle.stringAfter || ''
            } else if (legacy && title === 'filler') {
                elementWrapper.dataset.filler = true
                elementTime.dataset.filler = end - start < 2700000 ? 'pauze' : 'geen les'
            }

            elementWrapper.append(elementTime, elementTitle, elementPeriod, elementTooltip)
            elementTime.innerText = start.toLocaleTimeString('nl-NL', { hour: 'numeric', minute: 'numeric' }) + ' – ' + end.toLocaleTimeString('nl-NL', { hour: 'numeric', minute: 'numeric' })
            elementTitle.append(elementTitleNormal1, elementTitleBold, elementTitleNormal2)
            elementPeriod.innerText = period || ''
            elementTooltip.innerText = tooltip || ''
            elementWrapper.setAttribute('onclick', `window.location.href = '${href}'`)
            if (tooltipIncomplete) elementTooltip.classList.add('incomplete')
            elementWrapper.style.height = await msToPixels(duration) + 'px'

            if (!legacy) {
                elementWrapper.style.position = 'absolute'
                elementWrapper.style.top = await msToPixels(start - firstStart) + 44 + 'px'
                elementWrapper.style.left = overlapIndexMap[id] * 15 + '%'
                elementWrapper.style.width = 'calc(' + (100 - overlapIndexMap[id] * 16) + '% - 14px)'
                elementWrapper.style.zIndex = overlapIndexMap[id]
            }

            if (!tooltip) elementTooltip.remove()

            setIntervalImmediately(async () => {
                let now = new Date()
                if (now >= start && now <= end) {
                    elementWrapper.dataset.current = 'true'
                    if (title !== 'filler') elementPeriod.style.borderBottom = await msToPixels(end - now) + 'px solid var(--st-accent-primary)'
                } else if (now > end) {
                    elementWrapper.dataset.past = 'true'
                    elementWrapper.removeAttribute('data-current')
                    elementPeriod.removeAttribute('style')
                } else {
                    elementWrapper.removeAttribute('data-current')
                    elementWrapper.removeAttribute('data-past')
                    elementPeriod.removeAttribute('style')
                }
                if (i === 0) {
                    // scheduleNowLine.style.top = await msToPixels(now - firstStart) + 43 + 'px'
                }
            }, 10000)

            if (!legacy && i === 0) {
                // scheduleNowLine.style.top = await msToPixels(new Date() - firstStart) + 43 + 'px'
                // scheduleNowLine.id = 'st-vd-schedule-now'
                scheduleTodayContainer.style.height = await msToPixels(lastEnd - firstStart) + 44 + 'px'
                scheduleTodayContainer.scroll({ top: await msToPixels(new Date() - firstStart) - (window.innerHeight * 0.5) })
            }
        })
    }
}