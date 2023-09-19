let events = [],
    token, userId

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
}

// Page 'Vandaag'
async function today() {
    const sheet = false

    if (!syncedStorage['vd-enabled']) return
    let mainView = await awaitElement('div.view:has(#vandaag-container)'),
        container = element('div', 'st-vd', mainView),
        header = element('div', 'st-vd-header', container),
        headerText = element('span', 'st-vd-header-span', header, { class: 'st-title' }),
        schedule = element('div', 'st-vd-schedule', container),
        widgets = element('div', 'st-vd-widgets', container),
        buttonWrapper = element('div', 'st-vd-button-wrapper', container)

    todaySchedule(schedule, widgets)
    // todayWidgets(widgets)

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
    setTimeout(async () => {
        headerText.innerText = date.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        headerText.dataset.lastLetter = '.'
        header.removeAttribute('data-transition')
    }, 2500)

    // TODO: config
    async function todaySchedule() {
        const daysToGather = 30
        const daysToShowSetting = syncedStorage['vd-schedule-days'] || 1
        let daysToShow = daysToShowSetting
        const magisterMode = syncedStorage['vd-schedule-view'] === 'list'
        let zoomSetting = await getFromStorage('vd-zoom', 'local') || 1

        let interval

        let req = await chrome.runtime.sendMessage({ action: 'getCredentials' }),
            gatherStart = new Date(),
            gatherEnd = new Date(gatherStart.getTime() + (86400000 * (daysToGather - 1)))

        token = req.token
        userId = req.userId

        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: token } })
        let events = eventsRes.Items

        // Widgets may now be rendered
        todayWidgets(widgets)

        if (magisterMode) renderSchedule('list', 'title-magister')
        else renderSchedule('schedule', 'title-formatted')

        function renderSchedule(viewMode, titleMode) {
            clearInterval(interval)

            if (viewMode === 'list') {
                schedule.classList.add('list')
                schedule.classList.remove('schedule')
            } else {
                schedule.classList.remove('list')
                schedule.classList.add('schedule')
            }
            if (titleMode === 'title-magister') {
                schedule.classList.add('title-magister')
                schedule.classList.remove('title-formatted')
            } else {
                schedule.classList.remove('title-magister')
                schedule.classList.add('title-formatted')
            }

            let scheduleHead = element('div', `st-vd-schedule-head`, schedule)
            let scheduleWrapper = element('div', 'st-vd-schedule-wrapper', schedule, { style: `--hour-zoom: ${zoomSetting || 1}` })

            let now = new Date(),
                itemsHidden = false

            // Loop through the events array and split based on date
            let eventsPerDay = {}
            events.forEach(item => {
                const startDate = new Date(item.Start)
                const year = startDate.getFullYear()
                const month = startDate.getMonth() + 1
                const date = startDate.getDate()

                const key = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
                if (!eventsPerDay[key] && Object.keys(eventsPerDay).length < daysToShow) eventsPerDay[key] = []
                if (Object.keys(eventsPerDay).length >= daysToShow) itemsHidden = true
                if (!eventsPerDay[key]) return
                eventsPerDay[key].push(item)
                itemsHidden = false
            })

            // Find the earliest start time and the latest end time, rounded outwards to 30 minutes.
            const agendaStart = Object.values(eventsPerDay).flat().reduce((earliestHour, currentItem) => {
                let currentHour = timeInHours(currentItem.Start)
                if (!earliestHour || currentHour < earliestHour) { return Math.floor(currentHour * 2) / 2 }
                return earliestHour
            }, null)
            const agendaEnd = Object.values(eventsPerDay).flat().reduce((latestHour, currentItem) => {
                let currentHour = timeInHours(currentItem.Einde)
                if (!latestHour || currentHour > latestHour) { return Math.ceil(currentHour * 2) / 2 }
                return latestHour
            }, null)

            // Add another column if the day is over (given the user has not disabled vd-schedule-extra-day)
            if (
                timeInHours(now) >= agendaEnd
                && daysToShow === daysToShowSetting
                && syncedStorage['vd-schedule-extra-day']
                && Object.keys(eventsPerDay).find(e => e === `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`)
            ) {
                daysToShow = daysToShowSetting + 1
                renderSchedule(viewMode, titleMode)
                return
            }

            // Create tick marks for schedule view
            if (viewMode !== 'list') {
                for (let i = agendaStart; i <= agendaEnd; i += 0.5) {
                    let hourTick = element('div', `st-vd-tick-${i}h`, scheduleWrapper, { class: `st-vd-tick ${Number.isInteger(i) ? 'whole' : 'half'}`, style: `--relative-start: ${i - agendaStart}` })
                }
                if (timeInHours(now) > agendaStart && timeInHours(now) < agendaEnd) {
                    let nowMarker = element('div', `st-vd-now`, scheduleWrapper, { style: `--relative-start: ${timeInHours(now) - agendaStart}` })
                    nowMarker.scrollIntoView({ block: 'center', behavior: 'smooth' })
                    interval = setInterval(() => {
                        if (timeInHours(now) >= agendaEnd) {
                            nowMarker.remove()
                            clearInterval(interval)
                        }
                        if (
                            timeInHours(now) >= agendaEnd
                            && daysToShow === daysToShowSetting
                            && syncedStorage['vd-schedule-extra-day']
                            && Object.keys(eventsPerDay).find(e => e === `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`)
                        ) {
                            renderSchedule(daysToShow + 1, viewMode, titleMode)
                            return
                        }
                        now = new Date()
                        nowMarker = element('div', `st-vd-now`, scheduleWrapper, { style: `--relative-start: ${timeInHours(now) - agendaStart}` })
                    }, 30000)
                }
            }

            Object.keys(eventsPerDay).forEach((key, i, a) => {
                // Limit the number of days shown for the list view to 1
                if (viewMode === 'list' && i > 0) return

                // Create a column for the day
                let col = element('div', `st-vd-col-${key}`, scheduleWrapper, {
                    class: 'st-vd-col',
                    'data-today': (key === now.toISOString().split('T')[0]),
                    'data-view': viewMode || 'schedule'
                }),
                    colHead
                if (viewMode !== 'list' && (a.length > 1 || key !== `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`))
                    colHead = element('div', `st-vd-col-${key}-head`, scheduleHead, {
                        class: 'st-vd-col-head',
                        'data-today': (key === now.toISOString().split('T')[0]),
                        innerText: (key === now.toISOString().split('T')[0]) ? "Vandaag" : new Date(key).toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })
                    })

                let eventArr = checkCollision(eventsPerDay[key])

                function checkCollision(eventArr) {
                    for (var i = 0; i < eventArr.length; i++) {
                        eventArr[i].cols = []
                        eventArr[i].colsBefore = []
                        for (var j = 0; j < eventArr.length; j++) {
                            if (collidesWith(eventArr[i], eventArr[j])) {
                                eventArr[i].cols.push(j)
                                if (i > j) eventArr[i].colsBefore.push(j)
                            }
                        }
                    }
                    return eventArr
                }

                // Loop through all events of the day
                eventArr.forEach((item, i) => {
                    let ongoing = (new Date(item.Start) < now && new Date(item.Einde) > now)

                    // Render the event element
                    // TODO: overlap is still broken!
                    // TODO: all-day events show up as normal ones.
                    let eventElement = element('button', `st-vd-event-${item.Id}`, col, { class: 'st-vd-event', 'data-2nd': item.Omschrijving, 'data-ongoing': ongoing, 'data-start': item.Start, 'data-end': item.Einde, style: `--relative-start: ${timeInHours(item.Start) - agendaStart}; --duration: ${timeInHours(item.Einde) - timeInHours(item.Start)}; --cols: ${item.cols.length}; --cols-before: ${item.colsBefore.length};` })
                    if (eventElement.clientHeight < 72 && viewMode !== 'list') eventElement.classList.add('tight')
                    eventElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)

                    // Parse and array-ify the subjects, the teachers and the locations
                    let subjectNames = item.Vakken?.map((e, i, a) => {
                        if (i === 0) return e.Naam.charAt(0).toUpperCase() + e.Naam.slice(1)
                        return e.Naam
                    }) || [item.Omschrijving]
                    let teacherNames = item.Docenten?.map((e, i, a) => {
                        if (a.length === 1 && eventElement.clientHeight >= 72) return e.Naam + ` (${e.Docentcode})`
                        return e.Naam
                    }) || []
                    let locationNames = item.Lokalen?.map(e => e.Naam) || [item.Lokatie]
                    if (subjectNames.length < 1 && item.Omschrijving) subjectNames.push(item.Omschrijving)
                    if (locationNames.length < 1 && item.Lokatie) locationNames.push(item.Lokatie)

                    // Render the school hour label
                    let schoolHours = (item.LesuurVan === item.LesuurTotMet) ? item.LesuurVan : `${item.LesuurVan}-${item.LesuurTotMet}`
                    let eventSchoolHours = element('div', `st-vd-event-${item.Id}-school-hours`, eventElement, { class: 'st-vd-event-school-hours', innerText: schoolHours })
                    if (item.Type === 1) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = ''
                    }
                    if (item.Type === 16) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = ''
                    }

                    // Render the subject, location and teacher labels
                    if (titleMode === 'title-magister') {
                        let eventSubject = element('span', `st-vd-event-${item.Id}-subject`, eventElement, { class: 'st-vd-event-subject', innerText: item.Lokatie ? `${item.Omschrijving} (${item.Lokatie})` : item.Omschrijving })
                    } else {
                        let eventSubjectWrapper = element('span', `st-vd-event-${item.Id}-subject-wrapper`, eventElement, { class: 'st-vd-event-subject-wrapper' })
                        let eventSubject = element('span', `st-vd-event-${item.Id}-subject`, eventSubjectWrapper, { class: 'st-vd-event-subject', innerText: subjectNames.join(', ') })
                        let eventLocation = element('span', `st-vd-event-${item.Id}-location`, eventSubjectWrapper, { class: 'st-vd-event-location', innerText: locationNames.join(', ') })
                        let eventTeacher = element('span', `st-vd-event-${item.Id}-teacher`, eventElement, { class: 'st-vd-event-teacher', innerText: teacherNames.join(', ') })
                    }

                    // Render the time label
                    let eventTime = element('span', `st-vd-event-${item.Id}-time`, eventElement, { class: 'st-vd-event-time', innerText: `${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.Einde).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })}` })

                    // Parse and render any chips
                    let chips = []
                    if (item.InfoType === 1 && item.Afgerond) chips.push({ name: "Huiswerk", type: 'ok' })
                    else if (item.InfoType === 1) chips.push({ name: "Huiswerk", type: 'info' })
                    if (item.InfoType === 2 && item.Afgerond) chips.push({ name: "Proefwerk", type: 'ok' })
                    else if (item.InfoType === 2) chips.push({ name: "Proefwerk", type: 'exam' })
                    if (item.Type === 7 && item.Lokatie?.length > 0) chips.push({ name: "Ingeschreven", type: 'ok' })
                    else if (item.Type === 7) chips.push({ name: "KWT", type: 'info' })

                    let eventChipsWrapper = element('div', `st-vd-event-${item.Id}-labels`, eventElement, { class: 'st-chips-wrapper' })
                    chips.forEach(chip => {
                        let chipElement = element('span', `st-vd-event-${item.Id}-label-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                    })
                })
            })
        }

        // Allow for 5-day view
        let todayExpander = element('button', 'st-vd-today-expander', buttonWrapper, { class: 'st-button icon', 'data-icon': '', title: "Rooster uitvouwen" })
        todayExpander.addEventListener('click', () => {
            if (schedule.classList.contains('st-expanded')) {
                schedule.classList.remove('st-expanded')
                todayExpander.classList.remove('st-expanded')
                todayExpander.dataset.icon = ''
                verifyDisplayMode()
                schedule.innerText = ''
                daysToShow = daysToShowSetting
                if (magisterMode) renderSchedule('list', 'title-magister')
                else renderSchedule('schedule', 'title-formatted')
            } else {
                schedule.classList.add('st-expanded')
                todayExpander.classList.add('st-expanded')
                todayExpander.dataset.icon = ''
                verifyDisplayMode()
                if (!document.querySelector('.menu-host')?.classList.contains('collapsed-menu')) document.querySelector('.menu-footer>a')?.click()
                schedule.innerText = ''
                daysToShow = 5
                renderSchedule('schedule', 'title-formatted')
            }
        })

        // Zoom buttons
        let todayZoomIn = element('button', 'st-vd-today-zoom-in', buttonWrapper, { class: 'st-button icon', 'data-icon': '', title: "Inzoomen" })
        todayZoomIn.addEventListener('click', () => {
            zoomSetting += .1
            saveToStorage('vd-zoom', zoomSetting, 'local')
            document.querySelector('#st-vd-schedule-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
            showSnackbar(`Zoomniveau ${Math.round(zoomSetting * 100)}%`, 2000)
            if (magisterMode) renderSchedule('list', 'title-magister')
            else renderSchedule('schedule', 'title-formatted')
        })
        let todayZoomOut = element('button', 'st-vd-today-zoom-out', buttonWrapper, { class: 'st-button icon', 'data-icon': '', title: "uitzoomen" })
        todayZoomOut.addEventListener('click', () => {
            zoomSetting -= .1
            saveToStorage('vd-zoom', zoomSetting, 'local')
            document.querySelector('#st-vd-schedule-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
            showSnackbar(`Zoomniveau ${Math.round(zoomSetting * 100)}%`, 2000)
            if (magisterMode) renderSchedule('list', 'title-magister')
            else renderSchedule('schedule', 'title-formatted')
        })

        setInterval(() => {
            let events = document.querySelectorAll('.st-vd-event[data-start][data-end]'),
                now = new Date()

            events.forEach(item => {
                let ongoing = (new Date(item.dataset.start) < now && new Date(item.dataset.end) > now)
                if (ongoing) item.dataset.ongoing = true
                else item.dataset.ongoing = false
            })
        }, 30000)

        // STATUSES
        // Type=13: normaal blok
        // Type=2: ingeschreven
        // Type=7: KWT
        // Type=16: pers planning
        // Type=1: pers persoonlijk

        // InfoType>0: heeft info
        // InfoType=1: huiswerk
        // InfoType=2: proefwerk

        // Status=3: huiswerk
        // Status=2: ingeschreven?
        // Status=1: standaard?
    }

    async function todayWidgets() {
        let widgetsToggler = element('button', 'st-vd-widget-toggler', buttonWrapper, { class: 'st-button icon', innerText: '', title: "Widgetpaneel" })
        widgetsToggler.addEventListener('click', () => {
            if (widgets.classList.contains('st-shown')) {
                widgets.setAttribute('class', 'st-hiding')
                container.classList.remove('sheet-shown')
                setTimeout(() => {
                    widgets.setAttribute('class', 'st-hidden')
                }, 200)
            } else {
                widgets.setAttribute('class', 'st-showing')
                setTimeout(() => {
                    widgets.setAttribute('class', 'st-shown')
                    container.classList.add('sheet-shown')
                }, 10)
            }
        })

        let now = new Date()
        let gatherStart = now,
            gatherEnd = new Date(now.getTime() + (86400000 * 29)) // Period of 30 days

        let userOrder = ['grades', 'homework', 'messages', 'assignments', 'EXCLUDE', 'counters']
        let widgetFunctions = {

            // TODO WIDGETS
            // ✅ Huiswerk
            // Cijfers
            // ✅ Opdrachten
            // ✅ Berichten
            // Evt meldingen
            // Tellertjes
            // ...

            // TODO: Mark as read (local viewedGrades)
            // TODO
            counters: {
                title: "Tellertjes",
                render: async () => {
                    return new Promise(async resolve => {
                        let widgetElement = element('div', 'st-vd-widget-counters', widgets, { class: 'st-widget' })

                        const messagesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`, { headers: { Authorization: token } })
                        const unreadMessages = messagesRes.items
                        if (unreadMessages.length > 0) {
                            let messagesMetric = element('div', 'st-vd-widget-counters-messages', widgetElement, { class: 'st-metric', innerText: unreadMessages.length, 'data-description': "Berichten" })
                        }

                        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: token } })
                        const homeworkEvents = eventsRes.Items.filter(item => item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                        if (homeworkEvents.length > 0) {
                            let homeworkMetric = element('div', 'st-vd-widget-counters-homework', widgetElement, { class: 'st-metric', innerText: homeworkEvents.length, 'data-description': "Huiswerk" })
                        }

                        const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`, { headers: { Authorization: token } })
                        const dueAssignments = assignmentsRes.Items.filter(item => !item.Afgesloten && !item.IngeleverdOp)
                        if (dueAssignments.length > 0) {
                            let homeworkMetric = element('div', 'st-vd-widget-counters-assignments', widgetElement, { class: 'st-metric', innerText: dueAssignments.length, 'data-description': "Opdrachten" })
                        }

                        resolve()
                    })
                }
            },

            grades: {
                title: "Laatste cijfer",
                render: async () => {
                    return new Promise(async resolve => {
                        const gradesJson = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/cijfers/laatste?top=12&skip=0`, { headers: { Authorization: token } })
                        const recentGrades = gradesJson.items.map(item => item)
                        console.log(recentGrades)

                        let widgetElement = element('div', 'st-vd-widget-grades', widgets, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-vd-widget-grades-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Laatste cijfer" })

                        if (true) widgetElement.classList.add('st-unread')

                        let lastGrade = element('span', 'st-vd-widget-grades-last', widgetElement, { innerText: '-' })
                        let lastGradeSubject = element('span', 'st-vd-widget-grades-last-subject', widgetElement, { innerText: 'nepcijfer' })

                        resolve(widgetElement)
                    })
                }
            },

            messages: {
                title: "Ongelezen berichten",
                render: async () => {
                    return new Promise(async resolve => {
                        const messagesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`, { headers: { Authorization: token } })
                        const unreadMessages = messagesRes.items

                        if (unreadMessages.length < 1) return resolve()
                        let widgetElement = element('div', 'st-vd-widget-messages', widgets, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-vd-widget-messages-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Berichten", 'data-description': `${unreadMessages.length} ongelezen bericht${unreadMessages.length > 1 ? 'en' : ''}` })

                        unreadMessages.forEach(item => {
                            let messageElement = element('button', `st-vd-widget-messages-${item.id}`, widgetElement, { class: 'st-list-item' })
                            messageElement.addEventListener('click', () => window.location.hash = `#/berichten`)
                            let messageDate = element('span', `st-vd-widget-messages-${item.id}-date`, messageElement, {
                                class: 'st-list-timestamp',
                                innerText: new Date(item.verzondenOp).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
                            })
                            let messageSender = element('span', `st-vd-widget-messages-${item.id}-title`, messageElement, { class: 'st-list-title', innerText: item.afzender.naam })
                            let messageSubject = element('div', `st-vd-widget-messages-${item.id}-content`, messageElement, { class: 'st-list-content', innerText: item.onderwerp })

                            let chips = []
                            if (item.heeftPrioriteit) chips.push({ name: "Belangrijk", type: 'warn' })

                            let messageChipsWrapper = element('div', `st-vd-widget-messages-${item.id}-labels`, messageElement, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-vd-widget-messages-${item.id}-label-${chip.name}`, messageChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            homework: {
                title: "Huiswerk",
                render: async () => {
                    return new Promise(async resolve => {
                        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: token } })
                        const homeworkEvents = eventsRes.Items.filter(item => item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())

                        if (homeworkEvents.length < 1) return resolve()
                        let widgetElement = element('div', 'st-vd-widget-homework', widgets, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-vd-widget-homework-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Huiswerk", 'data-description': `${homeworkEvents.length} item${homeworkEvents.length > 1 ? 's' : ''} in de komende maand` })

                        homeworkEvents.forEach(item => {
                            let subjectNames = item.Vakken?.map((e, i, a) => {
                                if (i === 0) return e.Naam.charAt(0).toUpperCase() + e.Naam.slice(1)
                                return e.Naam
                            }) || [item.Omschrijving]
                            if (subjectNames.length < 1 && item.Omschrijving) subjectNames.push(item.Omschrijving)

                            let
                                date = `week ${getWeekNumber(new Date(item.Start))}, ${new Date(item.Start).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (getWeekNumber(new Date(item.Start)) === getWeekNumber())
                                date = `${new Date(item.Start).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (new Date(item.Start).toDateString() === new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString())
                                date = `morgen ${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.Start))})`
                            if (new Date(item.Start).toDateString() === new Date().toDateString())
                                date = `vandaag ${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.Start))})`

                            let eventElement = element('button', `st-vd-widget-homework-${item.Id}`, widgetElement, { class: 'st-list-item' })
                            eventElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)
                            let eventDate = element('span', `st-vd-widget-homework-${item.Id}-date`, eventElement, {
                                class: 'st-list-timestamp',
                                innerText: date
                            })
                            let eventSubject = element('span', `st-vd-widget-homework-${item.Id}-title`, eventElement, { class: 'st-list-title', innerText: subjectNames.join(', ') })
                            let eventContent = element('div', `st-vd-widget-homework-${item.Id}-content`, eventElement, { class: 'st-list-content' })
                            eventContent.setHTML(item.Inhoud)
                            if (eventContent.scrollHeight > eventContent.clientHeight) eventContent.classList.add('overflow')

                            let chips = []
                            if (item.InfoType === 1 && item.Afgerond) chips.push({ name: "Huiswerk", type: 'ok' })
                            else if (item.InfoType === 1) chips.push({ name: "Huiswerk", type: 'info' })
                            if (item.InfoType === 2 && item.Afgerond) chips.push({ name: "Proefwerk", type: 'ok' })
                            else if (item.InfoType === 2) chips.push({ name: "Proefwerk", type: 'exam' })

                            let eventChipsWrapper = element('div', `st-vd-widget-homework-${item.Id}-labels`, eventElement, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-vd-widget-homework-${item.Id}-label-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            assignments: {
                title: "Onvoltooide opdrachten",
                render: async () => {
                    return new Promise(async resolve => {
                        let statements = []

                        const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`, { headers: { Authorization: token } })
                        const relevantAssignments = assignmentsRes.Items.filter(item => (!item.Afgesloten && !item.IngeleverdOp) || item.BeoordeeldOp)
                        const dueAssignments = assignmentsRes.Items.filter(item => !item.Afgesloten && !item.IngeleverdOp)
                        if (dueAssignments.length > 0) statements.push(`${dueAssignments.length} openstaande opdracht${dueAssignments.length > 1 ? 'en' : ''}`)
                        const markedAssignments = assignmentsRes.Items.filter(item => item.BeoordeeldOp)
                        if (markedAssignments.length > 0) statements.push(`${markedAssignments.length} beoordeelde opdracht${markedAssignments.length > 1 ? 'en' : ''}`)

                        if (relevantAssignments.length < 1) return resolve()
                        let widgetElement = element('div', 'st-vd-widget-assignments', widgets, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-vd-widget-assignments-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Opdrachten", 'data-description': statements.join(' en ') })

                        relevantAssignments.forEach(item => {
                            let
                                date = `week ${getWeekNumber(new Date(item.InleverenVoor))}, ${new Date(item.InleverenVoor).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (getWeekNumber(new Date(item.InleverenVoor)) === getWeekNumber())
                                date = `${new Date(item.InleverenVoor).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (new Date(item.InleverenVoor).toDateString() === new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString())
                                date = `morgen ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.InleverenVoor))})`
                            if (new Date(item.InleverenVoor).toDateString() === new Date().toDateString())
                                date = `vandaag ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.InleverenVoor))})`

                            let assignmentElement = element('button', `st-vd-widget-assignments-${item.Id}`, widgetElement, { class: 'st-list-item' })
                            assignmentElement.addEventListener('click', () => window.location.hash = `#/elo/opdrachten/${item.Id}`)
                            let assignmentDate = element('span', `st-vd-widget-assignments-${item.Id}-date`, assignmentElement, {
                                class: 'st-list-timestamp',
                                innerText: date
                            })
                            let assignmentTitle = element('span', `st-vd-widget-assignments-${item.Id}-title`, assignmentElement, { class: 'st-list-title', innerText: item.Vak ? [item.Vak, item.Titel].join(': ') : item.Titel })
                            let assignmentContent = element('div', `st-vd-widget-assignments-${item.Id}-content`, assignmentElement, { class: 'st-list-content' })
                            assignmentContent.setHTML(item.Omschrijving)
                            if (assignmentContent.scrollHeight > assignmentContent.clientHeight) assignmentContent.classList.add('overflow')

                            let chips = []
                            if (item.BeoordeeldOp) chips.push({ name: "Beoordeeld", type: 'ok' })

                            let assignmentChipsWrapper = element('div', `st-vd-widget-assignments-${item.id}-labels`, assignmentElement, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-vd-widget-assignments-${item.id}-label-${chip.name}`, assignmentChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

        }

        let exclusionIndex = userOrder.findIndex(item => item === 'EXCLUDE')
        let visibleItems = userOrder.slice(exclusionIndex)

        // Draw the widgets in the specified order
        for (const functionName of visibleItems) {
            await widgetFunctions[functionName].render()
        }

        // Allow for editing
        let editButton = element('button', 'st-vd-widgets-edit', widgets, { class: 'st-button icon', 'data-icon': '', title: "Widgets bewerken" })
        editButton.addEventListener('click', () => {
            widgets.innerText = ''
            let sortableList = element('ul', 'st-vd-widgets-edit-wrapper', widgets, { class: 'st-sortable-list' })
            Object.keys(widgetFunctions).forEach((key, i) => {
                if (i === 0) {
                    let includedTitle = element('span', 'st-vd-widgets-edit-include', sortableList, { class: 'st-section-title', innerText: "Weergeven" })
                }
                if (i === 3) {
                    let excludedTitle = element('span', 'st-vd-widgets-edit-exclude', sortableList, { class: 'st-section-title', innerText: "Niet weergeven" })
                }

                let widgetName = widgetFunctions[key].title
                let item = element('li', `st-vd-widgets-edit-${key}`, sortableList, { class: 'st-sortable-list-item', innerText: widgetName, draggable: true })

                item.addEventListener("dragstart", () => {
                    setTimeout(() => item.classList.add("dragging"), 0)
                })
                item.addEventListener("dragend", () => item.classList.remove("dragging"))

            })

            function initSortableList(event) {
                event.preventDefault()
                const draggingItem = document.querySelector(".dragging")
                let siblings = [...draggingItem.parentElement.children].filter(child => child !== draggingItem)

                let nextSibling = siblings.find(sibling => event.clientY <= sibling.offsetTop + sibling.offsetHeight / 2)
                if (nextSibling.id === 'st-vd-widgets-edit-include') nextSibling = nextSibling.nextElementSibling
                // TODO: cant drop at very end

                sortableList.insertBefore(draggingItem, nextSibling)
            }

            sortableList.addEventListener("dragover", initSortableList)
            sortableList.addEventListener("dragenter", e => e.preventDefault())

            let finishButton = element('button', 'st-vd-widgets-edit-finish', widgets, { class: 'st-button icon', 'data-icon': '', title: "Afronden" })
            finishButton.addEventListener('click', () => {
                widgets.innerText = ''
                todayWidgets()
            }, { once: true })
        })
    }

    function verifyDisplayMode() {
        let widgets = document.querySelector('#st-vd-widgets')
        if (window.innerWidth < 1100 || sheet || document.querySelector('#st-vd-schedule')?.classList.contains('st-expanded')) {
            container.classList.remove('sheet-shown')
            container.classList.add('sheet')
            widgets.setAttribute('class', 'st-shown')
            setTimeout(() => {
                widgets.setAttribute('class', 'st-hiding')
                setTimeout(() => {
                    widgets.setAttribute('class', 'st-hidden')
                }, 200)
            }, 10)
        }
        else {
            container.classList.remove('sheet')
        }
    }
    verifyDisplayMode()
    window.addEventListener('resize', () => { verifyDisplayMode() })
}

function timeInHours(input) {
    let date = new Date(input),
        currentHour = date.getHours() + (date.getMinutes() / 60)
    return currentHour
}

function collidesWith(a, b) {
    return new Date(a.Einde) > new Date(b.Start) && new Date(a.Start) < new Date(b.Einde)
}

function checkCollision(eventArr) {
    for (var i = 0; i < eventArr.length; i++) {
        eventArr[i].cols = [];
        eventArr[i].colsBefore = [];
        for (var j = 0; j < eventArr.length; j++) {
            if (collidesWith(eventArr[i], eventArr[j])) {
                eventArr[i].cols.push(j);
                if (i > j) eventArr[i].colsBefore.push(j); //also list which of the conflicts came before
            }
        }
    }
    return eventArr;
}