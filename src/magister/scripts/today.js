let events = []

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
}

// Page 'Vandaag'
async function today() {

    if (!syncedStorage['vd-enabled']) return
    let sheetSetting = await getFromStorage('vd-sheet', 'local') ?? false,
        zoomSetting = await getFromStorage('vd-zoom', 'local') || 1,
        teacherNamesSetting = await getFromStorage('teacher-names', 'local') || {},
        mainView = await awaitElement('div.view:has(#vandaag-container)'),
        container = element('div', 'st-vd', mainView, { class: sheetSetting ? 'sheet' : '' }),
        header = element('div', 'st-vd-header', container),
        headerText = element('span', 'st-vd-header-span', header, { class: 'st-title' }),
        schedule = element('div', 'st-vd-schedule', container),
        widgets = element('div', 'st-vd-widgets', container),
        buttonWrapper = element('div', 'st-vd-button-wrapper', container)

    let renderSchedule

    const daysToShowSetting = syncedStorage['vd-schedule-days'] || 1
    let daysToShow = daysToShowSetting

    const magisterModeSetting = syncedStorage['vd-schedule-view'] === 'list'
    let magisterMode = magisterModeSetting

    todaySchedule()
    todayWidgets()

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

    async function todaySchedule() {
        await getApiCredentials()

        let interval

        const gatherStart = new Date(),
            gatherEnd = new Date(gatherStart.getTime() + (86400000 * 29))

        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: apiUserToken } })
        const events = eventsRes.Items

        // Start rendering
        renderSchedule = async () => {
            clearInterval(interval)

            if (magisterMode) schedule.classList.add('magister-mode')
            else schedule.classList.remove('magister-mode')

            schedule.innerText = ''

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
                renderSchedule()
                return
            }

            // Create tick marks for schedule view
            if (!magisterMode) {
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
                            daysToShow = daysToShowSetting + 1
                            renderSchedule()
                            return
                        }
                        now = new Date()
                        nowMarker = element('div', `st-vd-now`, scheduleWrapper, { style: `--relative-start: ${timeInHours(now) - agendaStart}` })
                    }, 30000)
                }
            }

            Object.keys(eventsPerDay).forEach((key, i, a) => {
                // Limit the number of days shown for the list view to 1
                if (magisterMode && i > 0) return

                // Create a column for the day
                let col = element('div', `st-vd-col-${key}`, scheduleWrapper, {
                    class: 'st-vd-col',
                    'data-today': (key === now.toISOString().split('T')[0]),
                    'data-magister-mode': magisterMode
                }),
                    colHead
                if ((!magisterMode && a.length > 1) || key !== `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`) {
                    colHead = element('div', `st-vd-col-${key}-head`, scheduleHead, {
                        class: 'st-vd-col-head',
                        'data-today': (key === now.toISOString().split('T')[0]),
                        innerText: (key === now.toISOString().split('T')[0]) ? "Vandaag" : new Date(key).toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })
                    })
                }

                // Add a divider line if the days are more than a day apart
                if (a[i + 1] && Math.abs(new Date(key) - new Date(a[i + 1])) > 86400000) {
                    let colDivider = element('div', `st-vd-col-${key}-divider`, scheduleWrapper, { class: 'st-divider vertical thick' })
                    if (colHead) {
                        let colHeadDivider = element('div', `st-vd-col-${key}-head-divider`, scheduleHead, { class: 'st-divider vertical thick' })
                    }
                }

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
                    // TODO: BUG: overlap is quite broken!
                    // TODO: BUG: all-day events show up as normal ones, but with a duration of 0.
                    let eventElement = element('button', `st-vd-event-${item.Id}`, col, { class: 'st-vd-event', 'data-2nd': item.Omschrijving, 'data-ongoing': ongoing, 'data-start': item.Start, 'data-end': item.Einde, style: `--relative-start: ${timeInHours(item.Start) - agendaStart}; --duration: ${timeInHours(item.Einde) - timeInHours(item.Start)}; --cols: ${item.cols.length}; --cols-before: ${item.colsBefore.length};` })
                    if (eventElement.clientHeight < 72 && !magisterMode) eventElement.classList.add('tight')
                    eventElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)

                    // Parse and array-ify the subjects, the teachers and the locations
                    let subjectNames = item.Vakken?.map((e, i, a) => {
                        if (i === 0) return e.Naam.charAt(0).toUpperCase() + e.Naam.slice(1)
                        return e.Naam
                    }) || [item.Omschrijving]
                    let teacherNames = item.Docenten?.map((e, i, a) => {
                        return (teacherNamesSetting[e.Docentcode] || e.Naam) + ` (${e.Docentcode})`
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
                    if (magisterMode) {
                        let eventSubject = element('span', `st-vd-event-${item.Id}-subject`, eventElement, { class: 'st-vd-event-subject', innerText: item.Lokatie ? `${item.Omschrijving} (${item.Lokatie})` : item.Omschrijving })
                    } else {
                        let eventSubjectWrapper = element('span', `st-vd-event-${item.Id}-subject-wrapper`, eventElement, { class: 'st-vd-event-subject-wrapper' })
                        let eventSubject = element('span', `st-vd-event-${item.Id}-subject`, eventSubjectWrapper, { class: 'st-vd-event-subject', innerText: subjectNames.join(', ') })
                        let eventLocation = element('span', `st-vd-event-${item.Id}-location`, eventSubjectWrapper, { class: 'st-vd-event-location', innerText: locationNames.join(', ') })
                        let eventTeacher = element('span', `st-vd-event-${item.Id}-teacher`, eventElement, { class: 'st-vd-event-teacher', innerText: teacherNames.join(', ') })
                        if (item.Docenten[0]) {
                            let eventTeacherEdit = element('button', `st-vd-event-${item.Id}-teacher-edit`, eventElement, { class: 'st-vd-event-teacher-edit st-button icon', 'data-icon': '', title: `Bijnaam van ${item.Docenten[0].Naam} aanpassen`, 'data-teacher-name': item.Docenten[0].Naam, 'data-teacher-code': item.Docenten[0].Docentcode })
                            eventTeacherEdit.removeEventListener('click', editTeacherName)
                            eventTeacherEdit.addEventListener('click', editTeacherName)
                        }
                    }

                    // Render the time label
                    let eventTime = element('span', `st-vd-event-${item.Id}-time`, eventElement, { class: 'st-vd-event-time', innerText: `${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.Einde).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })}` })

                    // Parse and render any chips
                    // TODO: More InfoTypes
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

            function editTeacherName(event) {
                let teacherName = event.target.dataset.teacherName
                let teacherCode = event.target.dataset.teacherCode
                event.stopPropagation()
                let newName = prompt(`Bijnaam invoeren voor ${teacherName} (${teacherCode})`, teacherNamesSetting[teacherCode] || '')
                if (newName?.length > 0) {
                    teacherNamesSetting[teacherCode] = newName
                } else if (teacherNamesSetting[teacherCode]) {
                    delete teacherNamesSetting[teacherCode]
                }
                saveToStorage('teacher-names', teacherNamesSetting, 'local')
                renderSchedule()
            }
        }

        renderSchedule()

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
                magisterMode = magisterModeSetting
                renderSchedule()
            } else {
                schedule.classList.add('st-expanded')
                todayExpander.classList.add('st-expanded')
                todayExpander.dataset.icon = ''
                verifyDisplayMode()
                if (!document.querySelector('.menu-host')?.classList.contains('collapsed-menu')) document.querySelector('.menu-footer>a')?.click()
                schedule.innerText = ''
                daysToShow = 5
                magisterMode = false
                renderSchedule()
            }
        })

        // Update ongoing events every 30 seconds
        setInterval(() => {
            let events = document.querySelectorAll('.st-vd-event[data-start][data-end]'),
                now = new Date()

            events.forEach(item => {
                let ongoing = (new Date(item.dataset.start) < now && new Date(item.dataset.end) > now)
                if (ongoing) item.dataset.ongoing = true
                else item.dataset.ongoing = false
            })
        }, 30000)
    }

    async function todayWidgets() {
        let widgetsProgress = element('div', 'st-vd-widget-progress', widgets, { class: 'st-progress-bar' })
        let widgetsProgressValue = element('div', 'st-vd-widget-progress-value', widgetsProgress, { class: 'st-progress-bar-value indeterminate' })

        await getApiCredentials()

        let widgetsToggler = element('button', 'st-vd-widget-toggler', buttonWrapper, { class: 'st-button icon', innerText: '', title: "Widgetpaneel" })
        widgetsToggler.addEventListener('click', () => {
            if (container.classList.contains('sheet-shown')) container.classList.remove('sheet-shown')
            else container.classList.add('sheet-shown')
        })

        let now = new Date()
        let gatherStart = now,
            gatherEnd = new Date(now.getTime() + (86400000 * 29)) // Period of 30 days

        let widgetsOrder = await getFromStorage('vd-widgets', 'local') || ['counters', 'grades', 'messages', 'homework', 'assignments', 'EXCLUDE']
        let widgetsShown = widgetsOrder.slice(0, widgetsOrder.findIndex(item => item === 'EXCLUDE'))
        let widgetFunctions = {

            // ✅ Huiswerk
            // Cijfers
            // ✅ Opdrachten
            // ✅ Berichten
            // Evt meldingen
            // Tellertjes
            // ...

            // TODO: Add more counters than just these 3
            counters: {
                title: "Beknopte notificaties",
                render: async () => {
                    return new Promise(async resolve => {
                        let elems = []

                        const messagesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`, { headers: { Authorization: apiUserToken } })
                        const unreadMessagesNum = messagesRes.totalCount
                        if (unreadMessagesNum > 0 && !widgetsShown.includes('messages')) {
                            elems.push(element('div', 'st-vd-widget-counters-messages', null, { class: 'st-metric', innerText: unreadMessagesNum, 'data-description': "Berichten" }))
                        }

                        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: apiUserToken } })
                        const homeworkEvents = eventsRes.Items.filter(item => item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                        if (homeworkEvents.length > 0 && !widgetsShown.includes('homework')) {
                            elems.push(element('div', 'st-vd-widget-counters-homework', null, { class: 'st-metric', innerText: homeworkEvents.length, 'data-description': "Huiswerk" }))
                        }

                        const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`, { headers: { Authorization: apiUserToken } })
                        const dueAssignments = assignmentsRes.Items.filter(item => !item.Afgesloten && !item.IngeleverdOp)
                        if (dueAssignments.length > 0 && !widgetsShown.includes('assignments')) {
                            elems.push(element('div', 'st-vd-widget-counters-assignments', null, { class: 'st-metric', innerText: dueAssignments.length, 'data-description': "Opdrachten" }))
                        }

                        const activitiesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/activiteiten?status=NogNietAanEisVoldaan&count=true`, { headers: { Authorization: apiUserToken } })
                        const activitiesNum = activitiesRes.TotalCount
                        if (activitiesNum > 0) {
                            elems.push(element('div', 'st-vd-widget-counters-activities', null, { class: 'st-metric', innerText: activitiesNum, 'data-description': "Activiteiten" }))
                        }

                        const logsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/leerlingen/${apiUserId}/logboeken/count`, { headers: { Authorization: apiUserToken } })
                        const logsNum = logsRes.count
                        if (logsNum > 0) {
                            elems.push(element('div', 'st-vd-widget-counters-logs', null, { class: 'st-metric', innerText: logsNum, 'data-description': "Logboeken" }))
                        }

                        if (elems.length < 1) return resolve()

                        let widgetElement = element('div', 'st-vd-widget-counters', null, { class: 'st-widget' })
                        widgetElement.append(...elems)

                        resolve(widgetElement)
                    })
                }
            },

            // TODO: Include grades
            grades: {
                title: "Cijfers",
                options: [
                    {
                        title: "Widget weergeven",
                        key: 'vd-widget-cf-widget',
                        type: 'select',
                        choices: [
                            {
                                title: "Altijd",
                                value: 'always'
                            },
                            {
                                title: "Bij nieuw cijfer",
                                value: 'new'
                            }
                        ]
                    },
                    {
                        title: "Beoordeling weergeven",
                        key: 'vd-widget-cf-result',
                        type: 'select',
                        choices: [
                            {
                                title: "Altijd",
                                value: 'always'
                            },
                            {
                                title: "Alleen voldoendes",
                                value: 'sufficient'
                            },
                            {
                                title: "Nooit",
                                value: 'never'
                            }
                        ]
                    }
                ],
                render: async () => {
                    return new Promise(async resolve => {
                        let lastReadDate = await getFromStorage('viewedGrades', 'local')

                        const gradesJson = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/cijfers/laatste?top=12&skip=0`, { headers: { Authorization: apiUserToken } })
                        const recentGrades = gradesJson.items.map(item => item)
                        console.log(recentGrades)

                        if (recentGrades.length < 1) return resolve()

                        let widgetElement = element('div', 'st-vd-widget-grades', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-vd-widget-grades-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Laatste cijfer" })

                        if (new Date() > lastReadDate) widgetElement.classList.add('st-unread')

                        let lastGrade = element('span', 'st-vd-widget-grades-last', widgetElement, { innerText: '-' })
                        let lastGradeSubject = element('span', 'st-vd-widget-grades-last-subject', widgetElement, { innerText: 'nepcijfer' })

                        resolve(widgetElement)
                    })
                }
            },

            messages: {
                title: "Berichten",
                render: async () => {
                    return new Promise(async resolve => {
                        const messagesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`, { headers: { Authorization: apiUserToken } })
                        const unreadMessages = messagesRes.items

                        if (unreadMessages.length < 1) return resolve()
                        let widgetElement = element('div', 'st-vd-widget-messages', null, { class: 'st-tile st-widget' })
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
                options: [
                    {
                        title: "Afgeronde items tonen",
                        key: 'vd-widget-hw-filter',
                        type: 'select',
                        choices: [
                            {
                                title: "Alleen onvoltooid",
                                value: 'incomplete'
                            },
                            {
                                title: "Alles",
                                value: 'all'
                            }
                        ]
                    }
                ],
                render: async () => {
                    return new Promise(async resolve => {
                        const filterOption = await getFromStorage('vd-widget-hw-filter', 'local') || 'incomplete'
                        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: apiUserToken } })
                        const homeworkEvents = eventsRes.Items.filter(item => {
                            if (filterOption === 'incomplete')
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date() && !item.Afgerond)
                            else
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                        })

                        if (homeworkEvents.length < 1) return resolve()
                        let widgetElement = element('div', 'st-vd-widget-homework', null, { class: 'st-tile st-widget' })
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

                            // TODO: More InfoTypes
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
                title: "Opdrachten",
                render: async () => {
                    return new Promise(async resolve => {
                        let statements = []

                        const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`, { headers: { Authorization: apiUserToken } })
                        const relevantAssignments = assignmentsRes.Items.filter(item => (!item.Afgesloten && !item.IngeleverdOp) || item.BeoordeeldOp)
                        const dueAssignments = assignmentsRes.Items.filter(item => !item.Afgesloten && !item.IngeleverdOp)
                        if (dueAssignments.length > 0) statements.push(`${dueAssignments.length} openstaande opdracht${dueAssignments.length > 1 ? 'en' : ''}`)
                        const markedAssignments = assignmentsRes.Items.filter(item => item.BeoordeeldOp)
                        if (markedAssignments.length > 0) statements.push(`${markedAssignments.length} beoordeelde opdracht${markedAssignments.length > 1 ? 'en' : ''}`)

                        if (relevantAssignments.length < 1) return resolve()
                        let widgetElement = element('div', 'st-vd-widget-assignments', null, { class: 'st-tile st-widget' })
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

        // Allow for editing
        let editButton = element('button', 'st-vd-start-edit', widgets, { class: 'st-button tertiary', 'data-icon': '', innerText: "Bewerken" })
        editButton.addEventListener('click', () => {
            container.classList.add('editing')
            widgets.scrollTop = 0

            let editLayoutTitle = element('span', 'st-vd-edit-layout-heading', widgets, { class: 'st-section-title', innerText: "Indeling" })

            // Zoom buttons
            let zoomWrapper = element('div', 'st-vd-edit-zoom', widgets)
            let zoomIn = element('button', 'st-vd-edit-zoom-in', zoomWrapper, { class: 'st-button icon', 'data-icon': '', title: "Inzoomen" })
            let zoomReset = element('button', 'st-vd-edit-zoom-reset', zoomWrapper, { class: 'st-button tertiary', innerText: `Roosterschaal: ${Math.round(zoomSetting * 100)}%` })
            let zoomOut = element('button', 'st-vd-edit-zoom-out', zoomWrapper, { class: 'st-button icon', 'data-icon': '', title: "uitzoomen" })
            zoomIn.addEventListener('click', () => {
                zoomSetting += .1
                effectuateZoom()
            })
            zoomReset.addEventListener('click', () => {
                zoomSetting = 1
                effectuateZoom()
            })
            zoomOut.addEventListener('click', () => {
                zoomSetting -= .1
                effectuateZoom()
            })
            function effectuateZoom() {
                zoomReset.innerText = `Roosterschaal: ${Math.round(zoomSetting * 100)}%`
                saveToStorage('vd-zoom', zoomSetting, 'local')
                document.querySelector('#st-vd-schedule-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
                renderSchedule()
            }

            // View mode checkbox
            let sheetModeLabel = element('label', 'st-vd-edit-sheet-label', widgets, { class: 'st-checkbox-label', innerText: "Widgets naast rooster weergeven" })
            let sheetModeInput = element('input', 'st-vd-edit-sheet-input', sheetModeLabel, { type: 'checkbox', class: 'st-checkbox-input' })
            if (!sheetSetting) sheetModeInput.checked = true
            sheetModeInput.addEventListener('change', event => {
                sheetSetting = !event.target.checked
                saveToStorage('vd-sheet', sheetSetting, 'local')
                verifyDisplayMode()
                container.classList.add('sheet-shown')
            })

            let divider1 = element('div', 'st-vd-edit-divider1', widgets, { class: 'st-divider' })

            // Widgets editor
            let editWidgetsHeading = element('span', 'st-vd-edit-widgets-heading', widgets, { class: 'st-section-title', innerText: "Widgets" })
            let includedWidgetsHeading = element('span', 'st-vd-edit-include', widgets, { innerText: "Weergegeven widgets" })
            let sortableList = element('ul', 'st-vd-edit-wrapper', widgets, { class: 'st-sortable-list' })
            widgetsOrder.forEach((key, i) => {
                if (key === 'EXCLUDE') {
                    let excludedWidgetsHeading = element('span', 'st-vd-edit-exclude', sortableList, { innerText: "Verborgen widgets", 'data-value': "EXCLUDE" })
                    return
                }

                let widgetName = widgetFunctions[key].title
                let item = element('li', `st-vd-edit-${key}`, sortableList, { class: 'st-sortable-list-item', innerText: widgetName, draggable: true, 'data-value': key })

                if (widgetFunctions[key].options) {
                    widgetFunctions[key].options.forEach(option => {
                        let optionWrapper = element('div', `st-vd-edit-${option.key}`, item, { class: 'st-sortable-list-item-option' })
                        let optionTitle = element('label', `st-vd-edit-${option.key}-title`, optionWrapper, { for: `st-vd-edit-${option.key}-input`, innerText: option.title })
                        switch (option.type) {
                            case 'select':
                                let optionInput = element('select', `st-vd-edit-${option.key}-input`, optionWrapper, { name: option.title })
                                option.choices.forEach(async choice => {
                                    let optionChoice = element('option', `st-vd-edit-${option.key}-${choice.value}`, optionInput, { value: choice.value, innerText: choice.title })
                                    if (await getFromStorage(option.key, 'local') === choice.value) optionChoice.setAttribute('selected', true)
                                })
                                optionInput.addEventListener('change', event => {
                                    saveToStorage(option.key, event.target.value, 'local')
                                })
                                break

                            default:
                                // TODO: implement other option types as necessary
                                break
                        }
                    })
                }

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

                sortableList.insertBefore(draggingItem, nextSibling)

                let widgetsOrder = [...sortableList.children].map(element => element.dataset.value)
                saveToStorage('vd-widgets', widgetsOrder, 'local')
            }
            sortableList.addEventListener("dragover", initSortableList)
            sortableList.addEventListener("dragenter", e => e.preventDefault())

            // Finish button
            let finishButton = element('button', 'st-vd-edit-finish', widgets, { class: 'st-button primary', 'data-icon': '', innerText: "Voltooien" })
            finishButton.addEventListener('click', () => {
                container.classList.remove('editing')
                widgets.scrollTop = 0
                widgets.innerText = ''
                todayWidgets()
            }, { once: true })
        })

        // Draw the selected widgets in the specified order
        for (const functionName of widgetsShown) {
            let widgetElement = await widgetFunctions[functionName].render()
            if (widgetElement) widgets.append(widgetElement)
            element('button', 'st-vd-start-edit', widgets, { class: 'st-button tertiary', 'data-icon': '', innerText: "Bewerken" })
        }

        widgetsProgress.remove()
    }

    function verifyDisplayMode() {
        let widgets = document.querySelector('#st-vd-widgets')
        if (window.innerWidth < 1100 || sheetSetting || document.querySelector('#st-vd-schedule')?.classList.contains('st-expanded')) {
            container.classList.remove('sheet-shown')
            container.classList.add('sheet')
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