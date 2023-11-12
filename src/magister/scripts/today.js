let events = []

// Run at start and when the URL changes
if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
window.addEventListener('popstate', () => {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
})

// Page 'Vandaag'
async function today() {
    if (!syncedStorage['start-enabled']) return

    let sheetSetting = await getFromStorage('start-sheet', 'local') ?? false,
        zoomSetting = await getFromStorage('start-zoom', 'local') || 1,
        teacherNamesSetting = await getFromStorage('teacher-names', 'local') || {},
        mainView = await awaitElement('div.view.ng-scope'),
        container = element('div', 'st-start', mainView, { class: sheetSetting ? 'sheet' : '' }),
        header = element('div', 'st-start-header', container),
        headerText = element('span', 'st-start-header-span', header, { class: 'st-title' }),
        headerButtons = element('div', 'st-start-header-buttons', header),
        schedule = element('div', 'st-start-schedule', container),
        widgets = element('div', 'st-start-widgets', container)

    let renderSchedule

    const daysToShowSetting = syncedStorage['start-schedule-days'] || 1
    let agendaStartDate, agendaEndDate

    const magisterModeSetting = syncedStorage['start-schedule-view'] === 'list'
    let magisterMode = magisterModeSetting

    let weekView = false // False for day view, true for week view
    let weekOffset = 0 // Six weeks are capable of being shown in the agenda, so this value may not exceed 5.

    todaySchedule()
    todayWidgets()

    const now = new Date(),
        hour = now.getHours(),
        weekday = now.toLocaleString('nl-NL', { weekday: 'long' }),
        firstName = (await awaitElement("#user-menu > figure > img")).alt.split(' ')[0]

    // Greeting system
    const greetingsByHour = [
        [22, 'Goedenavond#', 'Goedenavond, nachtuil.', `Fijne ${weekday}avond!`, 'Bonsoir!', 'Buenas noches!', 'Guten Abend!'], // 22:00 - 23:59
        [18, 'Goedenavond#', `Fijne ${weekday}avond!`, 'Bonsoir!', 'Buenas tardes!', 'Guten Abend!'], // 18:00 - 21:59
        [12, 'Goedemiddag#', `Fijne ${weekday}middag!`, 'Bonjour!', 'Buenas tardes!', 'Guten Mittag!'], // 12:00 - 17:59
        [6, 'Goedemorgen#', 'Goeiemorgen#', `Fijne ${weekday}ochtend!`, 'Bonjour!', 'Buenos días!', 'Guten Morgen!'], // 6:00 - 11:59
        [0, 'Goedemorgen#', 'Goeiemorgen#', 'Goedemorgen, nachtuil.', 'Goedemorgen, vroege vogel!', `Fijne ${weekday}ochtend!`, 'Bonjour!', 'Buenos días!', 'Guten Morgen!'] // 0:00 - 5:59
    ],
        greetingsGeneric = ['Welkom#', 'Hallo!', `Welkom terug, ${firstName}#`, 'Welkom terug#', 'Goedendag!', 'Hey!', 'Hoi!', '¡Hola!', 'Ahoy!', 'Bonjour!', 'Namaste!', 'G\'day!', 'Aloha!', 'Ciao!', 'Γεια!', 'Привіт!', '你好！', '今日は!', 'Olá!', 'Saluton!', 'Hei!', 'Hej!', 'Salve!', `Hey, ${firstName}#`]

    let possibleGreetings = []
    for (let i = 0; i < greetingsByHour.length; i++) {
        const e = greetingsByHour[i]
        if (hour >= e[0]) {
            e.shift()
            possibleGreetings.push(...e, ...e, ...e) // hour-bound greetings have 3x more chance than generic ones
            break
        }
    }
    possibleGreetings.push(...greetingsGeneric)
    const punctuation = Math.random() < 0.7 ? '.' : '!',
        greeting = possibleGreetings[Math.floor(Math.random() * possibleGreetings.length)].replace('#', punctuation)
    headerText.innerText = greeting.slice(0, -1)
    headerText.dataset.lastLetter = greeting.slice(-1)

    // Birthday party mode!
    let accountInfo = await useApi(`https://amadeuslyceum.magister.net/api/account?noCache=0`),
        birthday = new Date(accountInfo.Persoon.Geboortedatum)
    birthday.setYear(now.getFullYear())
    if (
        (birthday.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0)) ||
        (now.getDay() === 5 && birthday.getDate() === now.getDate() + 1) ||
        (now.getDay() === 1 && birthday.getDate() === now.getDate() - 1)
    ) {
        createStyle(`
.menu-host, .appbar-host {
    cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" style="font-size: 24px;"><text y="22">🎉</text></svg>'), auto;
    animation: rainbow 5s linear 0s 3, red-accent 500ms 15s both;
}

@keyframes red-accent {
    from {
        --st-accent-primary: hsl(0, 50%, 60%);
        --st-accent-secondary: hsl(0, 50%, 55%);
    }
}
`, 'st-party-mode')
        if (birthday.getDate() === now.getDate() + 1)
            notify('snackbar', `Alvast van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
        else if (birthday.getDate() === now.getDate() - 1)
            notify('snackbar', `Nog van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
        else
            notify('snackbar', `Van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
    }

    // Random thank you
    if (Math.random() < 0.01) notify('snackbar', "Bedankt voor het gebruiken van Study Tools 💚")

    async function todaySchedule() {
        let interval

        let now = new Date()
        let todayDate = new Date(new Date().setHours(0, 0, 0, 0))

        const gatherStart = new Date()
        gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
        gatherStart.setHours(0, 0, 0, 0)

        const gatherEnd = new Date()
        gatherEnd.setDate(now.getDate() + 30 + (7 - (now.getDay() + 30) % 7))
        gatherEnd.setHours(0, 0, 0, 0)

        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
        const events = eventsRes.Items

        // Create an array with 42 days (6 weeks) containing events of those days
        let agendaDays = []
        for (let i = 0; i < 42; i++) {
            const date = new Date(new Date(gatherStart.getTime()).setDate(gatherStart.getDate() + i))
            const eventsOfDay =
                events.filter(item => {
                    const startDate = new Date(item.Start)
                    return (startDate - date) < 86400000 && (startDate - date) >= 0 // Add all events that are on this date to this element
                }) || []

            agendaDays.push({
                date: new Date(date),
                today: (date - todayDate) === 0, // Days have the highest relevancy when they match the current date.
                tomorrow: (date - todayDate) === 86400000, // Days have increased relevancy when they match tomorrow's date.
                irrelevant: eventsOfDay.length < 1 || date < todayDate, // Days are irrelevant when they are empty or in the past. // TODO: condense this into multiple values (past, empty)
                // TODO: relevance value based on relation to today and whether it is empty or not
                events: eventsOfDay
            })
        }

        // Start rendering
        renderSchedule = async () => {

            // Select which days to show based on view mode
            if (!weekView) {
                // When in day view, the first day shown should be today. The amount of days set to be shown dictates the last day shown.
                agendaStartDate = todayDate
                agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + daysToShowSetting - 1))
                schedule.classList.remove('week-view')
            } else {
                // When in week view, the first day shown should be the Monday of the selected week. The last day shown should be 6 days later.
                agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + (weekOffset * 7)))
                agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + 6))
                schedule.classList.add('week-view')
            }

            now = new Date()

            clearInterval(interval)

            if (magisterMode) schedule.classList.add('magister-mode')
            else schedule.classList.remove('magister-mode')

            let ticksWrapper = element('div', 'st-start-ticks-wrapper', schedule, { style: `--hour-zoom: ${zoomSetting || 1}` })
            let scheduleWrapper = element('div', 'st-start-schedule-wrapper', schedule, { style: `--hour-zoom: ${zoomSetting || 1}`, innerText: '' })

            // Create tick marks for schedule view
            if (!magisterMode) {
                for (let i = 0; i <= 24; i += 0.5) {
                    let hourTick = element('div', `st-start-tick-${i}h`, ticksWrapper, { class: `st-start-tick ${Number.isInteger(i) ? 'whole' : 'half'}`, style: `--relative-start: ${i}` })
                }
            }

            agendaDays.forEach((item, i, a) => {
                // Limit the number of days shown for the list view to 1
                if (magisterMode && i > 0) return

                // If the date falls outside the agenda range, don't proceed.
                if (item.date < agendaStartDate || item.date > agendaEndDate) return

                // Create a column for the day
                let col = element('div', `st-start-col-${i}`, scheduleWrapper, {
                    class: 'st-start-col',
                    'data-today': item.today,
                    'data-tomorrow': item.tomorrow,
                    'data-irrelevant': item.irrelevant,
                    'data-magister-mode': magisterMode
                }),
                    colHead
                if (true) {
                    colHead = element('div', `st-start-col-${i}-head`, col, {
                        class: 'st-start-col-head',
                        innerText: item.today ? "Vandaag" : item.tomorrow ? "Morgen" : item.date.toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })
                    })
                }

                let eventArr = checkCollision(item.events)

                function checkCollision(eventArr) {
                    let eventArrOut = []
                    for (var i = 0; i < eventArr.length; i++) {
                        eventArrOut[i] = { ...eventArr[i], cols: [], colsBefore: [] }
                        for (var j = 0; j < eventArr.length; j++) {
                            if (collidesWith(eventArr[i], eventArr[j])) {
                                eventArrOut[i].cols.push(j)
                                if (i > j) eventArrOut[i].colsBefore.push(j)
                            }
                        }
                    }
                    return eventArrOut
                }

                // Loop through all events of the day
                eventArr.forEach((item, i) => {
                    let ongoing = (new Date(item.Start) < now && new Date(item.Einde) > now)

                    // Render the event element
                    // TODO: BUG: overlap is quite broken!
                    // TODO: BUG: all-day events show up as normal ones, but with a duration of 0.
                    let eventElement = element('button', `st-start-event-${item.Id}`, col, { class: 'st-start-event', 'data-2nd': item.Omschrijving, 'data-ongoing': ongoing, 'data-start': item.Start, 'data-end': item.Einde, style: `--relative-start: ${timeInHours(item.Start)}; --duration: ${timeInHours(item.Einde) - timeInHours(item.Start)}; --cols: ${item.cols.length}; --cols-before: ${item.colsBefore.length};`, title: `${item.Omschrijving}\n${item.Lokatie}\n${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.Einde).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })}` })
                    let egg = eggs.find(egg => egg.location === 'personalEventTitle' && egg.matchRule === 'startsWith' && item.Omschrijving.startsWith(egg.input))
                    if (egg && egg.type === 'dialog') {
                        eventElement.addEventListener('click', () => notify('dialog', egg.output))
                    } else {
                        eventElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)
                    }

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
                    let eventSchoolHours = element('div', `st-start-event-${item.Id}-school-hours`, eventElement, { class: 'st-start-event-school-hours', innerText: schoolHours })
                    if (item.Type === 1) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = ''
                    }
                    if (item.Type === 16) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = ''
                    }
                    if (!eventSchoolHours.innerText) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = ''
                    }

                    // Cancelled label
                    if (item.Status === 5) {
                        eventElement.classList.add('cancelled')
                        element('div', `st-start-event-${item.Id}-cancelled`, eventElement, { class: 'st-start-event-cancelled', title: "Dit blok vervalt mogelijk.\nControleer alsjeblieft even je Magister-app of de pagina 'Agenda'!" })
                    }

                    // Render the subject and location label
                    if (magisterMode) {
                        let eventSubject = element('span', `st-start-event-${item.Id}-subject`, eventElement, { class: 'st-start-event-subject', innerText: item.Lokatie ? `${item.Omschrijving} (${item.Lokatie})` : item.Omschrijving })
                    } else {
                        let eventSubjectWrapper = element('span', `st-start-event-${item.Id}-subject-wrapper`, eventElement, { class: 'st-start-event-subject-wrapper' })
                        let eventSubject = element('span', `st-start-event-${item.Id}-subject`, eventSubjectWrapper, { class: 'st-start-event-subject', innerText: subjectNames.join(', ') })
                        let eventLocation = element('span', `st-start-event-${item.Id}-location`, eventSubjectWrapper, { class: 'st-start-event-location', innerText: locationNames.join(', ') })
                        // Add a teacher edit button
                        if (item.Docenten[0]) {
                            let eventTeacherEdit = element('button', `st-start-event-${item.Id}-teacher-edit`, eventElement, { class: 'st-start-event-teacher-edit st-button icon', 'data-icon': '', title: `Bijnaam van ${item.Docenten[0].Naam} aanpassen`, 'data-teacher-name': item.Docenten[0].Naam, 'data-teacher-code': item.Docenten[0].Docentcode })
                            eventTeacherEdit.removeEventListener('click', editTeacherName)
                            eventTeacherEdit.addEventListener('click', editTeacherName)
                        }
                    }

                    let row = element('div', `st-start-event-${item.Id}-row1`, eventElement, { class: 'st-list-row' })

                    // Render the teacher label
                    if (!magisterMode && item.Docenten[0]) {
                        let eventTeacher = element('span', `st-start-event-${item.Id}-teacher`, row, { class: 'st-start-event-teacher', innerText: teacherNames.join(', ') })
                    }

                    // Render the time label
                    let eventTime = element('span', `st-start-event-${item.Id}-time`, row, { class: 'st-start-event-time', innerText: `${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.Einde).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })}` })

                    // Parse and render any chips
                    // TODO: More InfoTypes
                    let chips = eventChips(item)

                    let eventChipsWrapper = element('div', `st-start-event-${item.Id}-chips`, eventElement, { class: 'st-chips-wrapper' })
                    chips.forEach(chip => {
                        let chipElement = element('span', `st-start-event-${item.Id}-chip-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                    })
                })
            })

            if (!magisterMode && document.querySelector('.st-start-col[data-today=true]')) {
                // Add a marker of the current time (if applicable) and scroll to it if the scroll position is 0.
                let nowMarker = element('div', `st-start-now`, document.querySelector('.st-start-col[data-today=true]'), { style: `--relative-start: ${timeInHours(now)}` })
                if (schedule.scrollTop === 0) nowMarker.scrollIntoView({ block: 'center', behavior: 'smooth' })
                interval = setInterval(() => {
                    if (!nowMarker) {
                        clearInterval(interval)
                    } else if (timeInHours(now) >= 24) {
                        clearInterval(interval)
                        renderSchedule()
                    } else {
                        now = new Date()
                        nowMarker = element('div', `st-start-now`, null, { style: `--relative-start: ${timeInHours(now)}` })
                    }
                }, 10000)
            }

            // TODO: move into general editor thingie
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

        updateHeader = () => {
            // Update the week offset buttons accordingly
            let todayWeekLeft = document.querySelector('#st-start-today-week-left')
            let todayWeekRight = document.querySelector('#st-start-today-week-right')
            if (todayWeekLeft && todayWeekRight) {
                todayWeekLeft.style.display = weekView ? 'block' : 'none'
                todayWeekRight.style.display = weekView ? 'block' : 'none'
                todayWeekLeft.disabled = weekOffset <= 0
                todayWeekRight.disabled = weekOffset >= 5
            }

            // Update the header text accordingly
            header.dataset.transition = true
            setTimeout(async () => {
                if (weekView) headerText.innerText = "Week " + getWeekNumber(new Date(new Date(now).setDate(now.getDate() + 7 * weekOffset)))
                else headerText.innerText = now.toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                headerText.dataset.lastLetter = '.'
                header.removeAttribute('data-transition')
            }, 300)
        }
        setTimeout(updateHeader, 2000)

        // Allow for 5-day view
        let todayViewSwitch = element('button', 'st-start-today-view-switch', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Weekweergave" })
        todayViewSwitch.addEventListener('click', () => {
            if (schedule.classList.contains('st-expanded')) {
                schedule.classList.remove('st-expanded')
                todayViewSwitch.classList.remove('st-expanded')
                todayViewSwitch.dataset.icon = ''
                todayViewSwitch.title = "Weekweergave"
                verifyDisplayMode()
                if (document.querySelector('.menu-host')?.classList.contains('collapsed-menu') && window.innerWidth > 1200) document.querySelector('.menu-footer>a')?.click()
                weekView = false
                weekOffset = 0
                magisterMode = magisterModeSetting
                renderSchedule()
                updateHeader()
            } else {
                schedule.classList.add('st-expanded')
                todayViewSwitch.classList.add('st-expanded')
                todayViewSwitch.dataset.icon = ''
                todayViewSwitch.title = "Dagweergave"
                verifyDisplayMode()
                if (!document.querySelector('.menu-host')?.classList.contains('collapsed-menu')) document.querySelector('.menu-footer>a')?.click()
                weekView = true
                magisterMode = false
                renderSchedule()
                updateHeader()
            }
        })

        let todayWeekLeft = element('button', 'st-start-today-week-left', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Vorige week", style: 'display: none;' })
        todayWeekLeft.addEventListener('click', () => {
            weekOffset--
            renderSchedule()
            updateHeader()
        })

        let todayWeekRight = element('button', 'st-start-today-week-right', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Volgende week", style: 'display: none;' })
        todayWeekRight.addEventListener('click', () => {
            weekOffset++
            renderSchedule()
            updateHeader()
        })

        // Update ongoing events every 30 seconds
        updateSchedule = () => {
            let events = document.querySelectorAll('.st-start-event[data-start][data-end]')
            now = new Date()

            events.forEach(item => {
                let ongoing = (new Date(item.dataset.start) < now && new Date(item.dataset.end) > now)
                if (ongoing) item.dataset.ongoing = true
                else item.dataset.ongoing = false
            })
        }
        setInterval(updateSchedule, 30000)
    }

    async function todayWidgets() {
        let widgetsProgress = element('div', 'st-start-widget-progress', widgets, { class: 'st-progress-bar' })
        let widgetsProgressValue = element('div', 'st-start-widget-progress-value', widgetsProgress, { class: 'st-progress-bar-value indeterminate' })
        let widgetsProgressText = element('span', 'st-start-widget-progress-text', widgets, { class: 'st-subtitle', innerText: "Widgets laden..." })

        let widgetsToggler = element('button', 'st-start-widget-toggler', headerButtons, { class: 'st-button icon', innerText: '', title: "Widgetpaneel" })
        widgetsToggler.addEventListener('click', () => {
            container.classList.toggle('sheet-shown')
        })


        verifyDisplayMode()
        window.addEventListener('resize', () => { verifyDisplayMode() })

        let now = new Date()
        let todayDate = new Date(new Date().setHours(0, 0, 0, 0))

        const gatherStart = new Date()
        gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
        gatherStart.setHours(0, 0, 0, 0)

        const gatherEnd = new Date()
        gatherEnd.setDate(now.getDate() + 30 + (7 - (now.getDay() + 30) % 7))
        gatherEnd.setHours(0, 0, 0, 0)

        let widgetsOrder = await getFromStorage('start-widgets', 'local') || ['counters', 'grades', 'messages', 'homework', 'assignments', 'EXCLUDE', 'digitalClock']
        let widgetsShown = widgetsOrder.slice(0, widgetsOrder.findIndex(item => item === 'EXCLUDE'))

        let widgetFunctions = {

            counters: {
                title: "Beknopte notificaties",
                options: [
                    {
                        title: "Tellertjes die overige informatie (activiteiten, logboeken, etc.) weergeven indien beschikbaar.",
                        key: 'start-widget-misc-widget',
                        type: 'description'
                    }
                ],
                render: async () => {
                    return new Promise(async resolve => {
                        let elems = []

                        if (!widgetsShown.includes('grades')) {
                            widgetsProgressText.innerText = `Cijfers ophalen...`
                            let lastViewMs = await getFromStorage('viewedGrades', 'local') || 0
                            let lastViewDate = new Date(lastViewMs)
                            if (!lastViewDate || !(lastViewDate instanceof Date) || isNaN(lastViewDate)) lastViewDate = new Date().setDate(now.getDate() - 7)
                            const gradesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/cijfers/laatste?top=12&skip=0`)
                            const unreadGradesNum = gradesRes.items.filter(item => new Date(item.ingevoerdOp) > lastViewDate).length
                            if (unreadGradesNum > 0) {
                                elems.push(element('div', 'st-start-widget-counters-grades', null, { class: 'st-metric', innerText: unreadGradesNum > 11 ? "10+" : unreadGradesNum, 'data-description': "Cijfers" }))
                            }
                        }

                        if (!widgetsShown.includes('messages')) {
                            widgetsProgressText.innerText = `Berichten ophalen...`
                            const messagesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`)
                            const unreadMessagesNum = messagesRes.totalCount
                            if (unreadMessagesNum > 0) {
                                elems.push(element('div', 'st-start-widget-counters-messages', null, { class: 'st-metric', innerText: unreadMessagesNum, 'data-description': "Berichten" }))
                            }
                        }

                        if (!widgetsShown.includes('homework')) {
                            widgetsProgressText.innerText = `Huiswerk ophalen...`
                            const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
                            const homeworkEvents = eventsRes.Items.filter(item => item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                            if (homeworkEvents.length > 0) {
                                elems.push(element('div', 'st-start-widget-counters-homework', null, { class: 'st-metric', innerText: homeworkEvents.length, 'data-description': "Huiswerk" }))
                            }
                        }

                        if (!widgetsShown.includes('assignments')) {
                            widgetsProgressText.innerText = `Opdrachten ophalen...`
                            const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`)
                            const dueAssignments = assignmentsRes.Items.filter(item => !item.Afgesloten && !item.IngeleverdOp)
                            if (dueAssignments.length > 0) {
                                elems.push(element('div', 'st-start-widget-counters-assignments', null, { class: 'st-metric', innerText: dueAssignments.length, 'data-description': "Opdrachten" }))
                            }
                        }

                        widgetsProgressText.innerText = `Activiteiten ophalen...`
                        const activitiesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/activiteiten?status=NogNietAanEisVoldaan&count=true`)
                        const activitiesNum = activitiesRes.TotalCount
                        if (activitiesNum > 0) {
                            elems.push(element('div', 'st-start-widget-counters-activities', null, { class: 'st-metric', innerText: activitiesNum, 'data-description': "Activiteiten" }))
                        }

                        widgetsProgressText.innerText = `Logboeken ophalen...`
                        const logsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/leerlingen/$USERID/logboeken/count`)
                        const logsNum = logsRes.count
                        if (logsNum > 0) {
                            elems.push(element('div', 'st-start-widget-counters-logs', null, { class: 'st-metric', innerText: logsNum, 'data-description': "Logboeken" }))
                        }

                        if (elems.length < 1) return resolve()

                        let widgetElement = element('div', 'st-start-widget-counters', null, { class: 'st-widget' })
                        widgetElement.append(...elems)

                        resolve(widgetElement)
                    })
                }
            },

            grades: {
                title: "Cijfers",
                options: [
                    {
                        title: "Widget weergeven",
                        key: 'start-widget-cf-widget',
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
                        key: 'start-widget-cf-result',
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
                        let viewWidget = await getFromStorage('start-widget-cf-widget', 'local') || 'always'
                        let viewResult = await getFromStorage('start-widget-cf-result', 'local') || 'always'
                        let hiddenItems = await getFromStorage('hiddenGrades', 'local') || []
                        let lastViewMs = await getFromStorage('viewedGrades', 'local') || 0
                        let lastViewDate = new Date(lastViewMs)
                        if (!lastViewDate || !(lastViewDate instanceof Date) || isNaN(lastViewDate)) lastViewDate = new Date().setDate(now.getDate() - 7)

                        const gradesJson = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/cijfers/laatste?top=12&skip=0`)
                        const recentGrades = gradesJson.items.map(item => {
                            return {
                                ...item,
                                date: new Date(item.ingevoerdOp),
                                unread: new Date(item.ingevoerdOp) > lastViewDate,
                                hidden: (hiddenItems.includes(item.kolomId)) || (viewResult === 'sufficient' && !item.isVoldoende) || (viewResult === 'never') // Hide if hidden manually, or if insufficient and user has set widget to sufficient only, or if user has set widget to hide result.
                            }
                        })

                        if (recentGrades.length < 1 || (viewWidget === 'new' && recentGrades.filter(item => item.unread).length < 1)) return resolve() // Stop if no grades, or if no new grades and user has set widget to new grades only.

                        let widgetElement = element('button', 'st-start-widget-grades', null, { class: 'st-tile st-widget', title: "Laatste cijfers bekijken" })
                        widgetElement.addEventListener('click', () => {
                            window.location.hash = '#/cijfers'
                        })
                        let widgetTitle = element('div', 'st-start-widget-grades-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Laatste cijfer" })

                        let mostRecentItem = recentGrades[0]
                        if (mostRecentItem.unread) widgetElement.classList.add('st-unread')

                        let lastGrade = element('span', 'st-start-widget-grades-last', widgetElement, { innerText: mostRecentItem.waarde })
                        if (mostRecentItem.hidden) lastGrade.style.display = 'none'
                        let lastGradeSubj = element('span', 'st-start-widget-grades-last-subj', widgetElement, { innerText: mostRecentItem.vak.omschrijving.charAt(0).toUpperCase() + mostRecentItem.vak.omschrijving.slice(1) })
                        let lastGradeInfo = element('span', 'st-start-widget-grades-last-info', widgetElement, { innerText: mostRecentItem.weegfactor > 0 && mostRecentItem.teltMee ? `${mostRecentItem.omschrijving} (${mostRecentItem.weegfactor}×)` : mostRecentItem.omschrijving })
                        let lastGradeDate = element('span', 'st-start-widget-grades-last-date', widgetElement, { innerText: mostRecentItem.unread ? getRelativeTimeString(new Date(mostRecentItem.date)) : mostRecentItem.date.toLocaleDateString('nl-NL', { month: 'long', day: 'numeric' }) })
                        let lastGradeHide = element('button', 'st-start-widget-grades-last-hide', widgetElement, { class: 'st-button icon', 'data-icon': mostRecentItem.hidden ? '' : '', title: "Dit specifieke cijfer verbergen/weergeven" })
                        lastGradeHide.addEventListener('click', (event) => {
                            event.stopPropagation()
                            if (lastGrade.style.display === 'none') {
                                lastGradeHide.dataset.icon = ''
                                lastGrade.style.display = 'block'
                                hiddenItems = hiddenItems.filter(item => item !== mostRecentItem.kolomId)
                                saveToStorage('hiddenGrades', hiddenItems, 'local')
                            } else {
                                lastGradeHide.dataset.icon = ''
                                lastGrade.style.display = 'none'
                                hiddenItems.push(mostRecentItem.kolomId)
                                saveToStorage('hiddenGrades', hiddenItems, 'local')
                            }
                        })

                        let moreUnreadItems = recentGrades.filter(item => item.unread)
                        moreUnreadItems.shift()

                        widgetTitle.innerText = moreUnreadItems.length > 0 ? "Laatste cijfers" : "Laatste cijfer"

                        if (moreUnreadItems.length === 1) {
                            let moreGrades = element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En een ander cijfer voor ${moreUnreadItems[0].item.vak.code}` })
                        } else if (moreUnreadItems.length > 10) {
                            let moreGrades = element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En nog meer cijfers voor o.a. ${[...new Set(moreUnreadItems.map(item => item.vak.code))].join(', ').replace(/, ([^,]*)$/, ' en $1')}` })
                        } else if (moreUnreadItems.length > 1) {
                            let moreGrades = element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En nog ${moreUnreadItems.length} cijfers voor ${[...new Set(moreUnreadItems.map(item => item.vak.code))].join(', ').replace(/, ([^,]*)$/, ' en $1')}` })
                        }

                        resolve(widgetElement)
                    })
                }
            },

            messages: {
                title: "Berichten",
                render: async () => {
                    return new Promise(async resolve => {
                        const messagesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`)
                        const unreadMessages = messagesRes.items

                        if (unreadMessages.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-messages', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-start-widget-messages-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Berichten", 'data-description': `${unreadMessages.length} ongelezen bericht${unreadMessages.length > 1 ? 'en' : ''}` })

                        unreadMessages.forEach(item => {
                            let messageElement = element('button', `st-start-widget-messages-${item.id}`, widgetElement, { class: 'st-list-item' })
                            messageElement.addEventListener('click', () => window.location.hash = `#/berichten`)

                            let row1 = element('span', `st-start-widget-messages-${item.id}-row1`, messageElement, { class: 'st-list-row' })
                            let messageSender = element('span', `st-start-widget-messages-${item.id}-title`, row1, { class: 'st-list-title', innerText: item.afzender.naam })
                            let messageDate = element('span', `st-start-widget-messages-${item.id}-date`, row1, {
                                class: 'st-list-timestamp',
                                innerText: new Date(item.verzondenOp).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
                            })

                            let row2 = element('span', `st-start-widget-messages-${item.id}-row2`, messageElement, { class: 'st-list-row' })
                            let messageSubject = element('div', `st-start-widget-messages-${item.id}-content`, row2, { class: 'st-list-content', innerText: item.onderwerp })

                            let chips = []
                            if (item.heeftPrioriteit) chips.push({ name: "Belangrijk", type: 'warn' })

                            let messageChipsWrapper = element('div', `st-start-widget-messages-${item.id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-messages-${item.id}-chip-${chip.name}`, messageChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
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
                        key: 'start-widget-hw-filter',
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
                        const filterOption = await getFromStorage('start-widget-hw-filter', 'local') || 'incomplete'
                        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
                        const homeworkEvents = eventsRes.Items.filter(item => {
                            if (filterOption === 'incomplete')
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date() && !item.Afgerond)
                            else
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                        })

                        if (homeworkEvents.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-homework', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-start-widget-homework-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: `Huiswerk (${homeworkEvents.length})` })

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

                            let eventElement = element('button', `st-start-widget-homework-${item.Id}`, widgetElement, { class: 'st-list-item' })
                            eventElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)

                            let row1 = element('span', `st-start-widget-homework-${item.Id}-row1`, eventElement, { class: 'st-list-row' })
                            let eventSubject = element('span', `st-start-widget-homework-${item.Id}-title`, row1, { class: 'st-list-title', innerText: subjectNames.join(', ') })
                            let eventDate = element('span', `st-start-widget-homework-${item.Id}-date`, row1, {
                                class: 'st-list-timestamp',
                                innerText: date
                            })

                            let row2 = element('span', `st-start-widget-homework-${item.Id}-row2`, eventElement, { class: 'st-list-row' })
                            let eventContent = element('div', `st-start-widget-homework-${item.Id}-content`, row2, { class: 'st-list-content' })
                            eventContent.innerHTML = item.Inhoud // eventContent.setHTML(item.Inhoud)
                            if (eventContent.scrollHeight > eventContent.clientHeight) eventContent.classList.add('overflow')

                            // TODO: More InfoTypes
                            let chips = eventChips(item)

                            let eventChipsWrapper = element('div', `st-start-widget-homework-${item.Id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-homework-${item.Id}-chip-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
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

                        const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`)
                        const relevantAssignments = assignmentsRes.Items.filter(item => (!item.Afgesloten && !item.IngeleverdOp) || item.BeoordeeldOp)
                        const dueAssignments = assignmentsRes.Items.filter(item => !item.Afgesloten && !item.IngeleverdOp)
                        if (dueAssignments.length > 0) statements.push(`${dueAssignments.length} openstaande opdracht${dueAssignments.length > 1 ? 'en' : ''}`)
                        const markedAssignments = assignmentsRes.Items.filter(item => item.BeoordeeldOp)
                        if (markedAssignments.length > 0) statements.push(`${markedAssignments.length} beoordeelde opdracht${markedAssignments.length > 1 ? 'en' : ''}`)

                        if (relevantAssignments.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-assignments', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-start-widget-assignments-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Opdrachten", 'data-description': statements.join(' en ') })

                        relevantAssignments.forEach(item => {
                            let
                                date = `week ${getWeekNumber(new Date(item.InleverenVoor))}, ${new Date(item.InleverenVoor).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (getWeekNumber(new Date(item.InleverenVoor)) === getWeekNumber())
                                date = `${new Date(item.InleverenVoor).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (new Date(item.InleverenVoor).toDateString() === new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString())
                                date = `morgen ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.InleverenVoor))})`
                            if (new Date(item.InleverenVoor).toDateString() === new Date().toDateString())
                                date = `vandaag ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.InleverenVoor))})`

                            let assignmentElement = element('button', `st-start-widget-assignments-${item.Id}`, widgetElement, { class: 'st-list-item' })
                            assignmentElement.addEventListener('click', () => window.location.hash = `#/elo/opdrachten/${item.Id}`)

                            let row1 = element('span', `st-start-widget-assignments-${item.Id}-row1`, assignmentElement, { class: 'st-list-row' })
                            let assignmentTitle = element('span', `st-start-widget-assignments-${item.Id}-title`, row1, { class: 'st-list-title', innerText: item.Vak ? [item.Vak, item.Titel].join(': ') : item.Titel })
                            let assignmentDate = element('span', `st-start-widget-assignments-${item.Id}-date`, row1, {
                                class: 'st-list-timestamp',
                                innerText: date
                            })

                            let row2 = element('span', `st-start-widget-assignments-${item.Id}-row2`, assignmentElement, { class: 'st-list-row' })
                            let assignmentContent = element('div', `st-start-widget-assignments-${item.Id}-content`, row2, { class: 'st-list-content' })
                            assignmentContent.innerHTML = item.Omschrijving //assignmentContent.setHTML(item.Omschrijving)
                            if (assignmentContent.scrollHeight > assignmentContent.clientHeight) assignmentContent.classList.add('overflow')

                            let chips = []
                            if (item.BeoordeeldOp) chips.push({ name: "Beoordeeld", type: 'ok' })

                            let assignmentChipsWrapper = element('div', `st-start-widget-assignments-${item.id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-assignments-${item.id}-chip-${chip.name}`, assignmentChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            digitalClock: {
                title: "Digitale klok",
                render: () => {
                    return new Promise(async resolve => {
                        let widgetElement = element('div', 'st-start-widget-digital-clock', null, { class: 'st-tile st-widget' }),
                            timeText = element('div', 'st-start-widget-digital-clock-time', widgetElement),
                            timeProgressBar = element('div', 'st-start-widget-digital-clock-progress-bar', widgetElement, { style: `--progress: 0` }),
                            timeProgressLabel = element('div', 'st-start-widget-digital-clock-progress-label', widgetElement, { style: `--progress: 0`, innerText: `0%` })

                        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
                        const events = eventsRes.Items.filter(e => e.Einde.startsWith(`${gatherStart.toISOString().substring(0, 10)}`))

                        // TODO: TODO!
                        // Find the earliest start time and the latest end time, rounded outwards to 30 minutes.
                        const aaaa = Object.values(events).reduce((earliestHour, currentItem) => {
                            let currentHour = new Date(currentItem.Start)
                            if (!earliestHour || currentHour < earliestHour) { return Math.floor(currentHour * 2) / 2 }
                            return earliestHour
                        }, null)
                        const aaab = Object.values(events).reduce((latestHour, currentItem) => {
                            let currentHour = new Date(currentItem.Einde)
                            if (!latestHour || currentHour > latestHour) { return Math.ceil(currentHour * 2) / 2 }
                            return latestHour
                        }, null)

                        setIntervalImmediately(() => {
                            now = new Date()
                            let timeString = now.toLocaleTimeString('nl-NL')
                            timeText.innerText = ''
                            timeString.split('').forEach((char, i) => {
                                let charElement = element('span', `st-start-widget-digital-clock-time-${i}`, timeText, { innerText: char, style: char === ':' ? 'width: 7.2px' : '' })
                            })
                            let progress = (now - aaaa) / (aaab - aaaa)
                            timeProgressBar.setAttribute('style', `--progress: ${progress}`)
                            timeProgressLabel.setAttribute('style', `--progress: ${progress}`)
                            timeProgressLabel.innerText = `${progress.toLocaleString('nl-NL', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
                        }, 1000)

                        resolve(widgetElement)
                    })
                }
            }
        }

        // Allow for editing
        let editButton = element('button', 'st-start-start-edit', widgets, { class: 'st-button tertiary', 'data-icon': '', innerText: "Pagina Start bewerken", title: "Het uiterlijk van deze pagina bewerken\nWijzig de agendaweergave, de widgetopties, docentennamen en meer." })
        editButton.addEventListener('click', () => {
            container.classList.add('editing')
            container.classList.remove('editing-done')
            widgets.scrollTop = 0

            let editLayoutTitle = element('span', 'st-start-edit-layout-heading', widgets, { class: 'st-section-title', innerText: "Indeling" })

            // Zoom buttons
            let zoomWrapper = element('div', 'st-start-edit-zoom', widgets)
            let zoomIn = element('button', 'st-start-edit-zoom-in', zoomWrapper, { class: 'st-button icon', 'data-icon': '', title: "Inzoomen" })
            let zoomReset = element('button', 'st-start-edit-zoom-reset', zoomWrapper, { class: 'st-button tertiary', innerText: `Roosterschaal: ${Math.round(zoomSetting * 100)}%` })
            let zoomOut = element('button', 'st-start-edit-zoom-out', zoomWrapper, { class: 'st-button icon', 'data-icon': '', title: "uitzoomen" })
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
                saveToStorage('start-zoom', zoomSetting, 'local')
                document.querySelector('#st-start-ticks-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
                document.querySelector('#st-start-schedule-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
            }

            // View mode checkbox
            let sheetModeLabel = element('label', 'st-start-edit-sheet-chip', widgets, { class: 'st-checkbox-label', innerText: "Widgets naast rooster weergeven" })
            let sheetModeInput = element('input', 'st-start-edit-sheet-input', sheetModeLabel, { type: 'checkbox', class: 'st-checkbox-input' })
            if (!sheetSetting) sheetModeInput.checked = true
            sheetModeInput.addEventListener('change', event => {
                sheetSetting = !event.target.checked
                saveToStorage('start-sheet', sheetSetting, 'local')
                verifyDisplayMode()
                container.classList.add('sheet-shown')
            })

            let divider1 = element('div', 'st-start-edit-divider1', widgets, { class: 'st-divider' })

            // Widgets editor
            let editWidgetsHeading = element('span', 'st-start-edit-widgets-heading', widgets, { class: 'st-section-title', innerText: "Widgets" })
            let includedWidgetsHeading = element('span', 'st-start-edit-include', widgets, { innerText: "Ingeschakelde widgets" })
            let includedWidgetsDesc = element('span', 'st-start-edit-include-desc', widgets, { innerText: "Deze widgets worden vanzelf getoond wanneer van toepassing." })
            let sortableList = element('ul', 'st-start-edit-wrapper', widgets, { class: 'st-sortable-list' })

            Object.keys(widgetFunctions).forEach(key => {
                if (!widgetsOrder.find(e => e === key)) widgetsOrder.push(key)
            })

            let exclusionIndex = widgetsOrder.findIndex(e => e === 'EXCLUDE')
            widgetsOrder.forEach((key, i) => {
                if (i === exclusionIndex) {
                    let excludedWidgetsHeading = element('span', 'st-start-edit-exclude', sortableList, { innerText: "Uitgeschakelde widgets", 'data-value': "EXCLUDE" })
                    return
                }

                let widgetName = widgetFunctions[key].title
                let item = element('li', `st-start-edit-${key}`, sortableList, { class: 'st-sortable-list-item', innerText: widgetName, draggable: true, 'aria-roledescription': "Sleepbaar item. Gebruik spatie om op te tillen.", 'data-value': key })

                if (i > exclusionIndex) item.classList.add('excluded')

                if (widgetFunctions[key].options) {
                    widgetFunctions[key].options.forEach(option => {
                        let optionWrapper = element('div', `st-start-edit-${option.key}`, item, { class: 'st-sortable-list-item-option' })
                        let optionTitle = element('label', `st-start-edit-${option.key}-title`, optionWrapper, { for: `st-start-edit-${option.key}-input`, innerText: option.title })
                        switch (option.type) {
                            case 'select':
                                let optionInput = element('select', `st-start-edit-${option.key}-input`, optionWrapper, { name: option.title })
                                option.choices.forEach(async choice => {
                                    let optionChoice = element('option', `st-start-edit-${option.key}-${choice.value}`, optionInput, { value: choice.value, innerText: choice.title })
                                    if (await getFromStorage(option.key, 'local') === choice.value) optionChoice.setAttribute('selected', true)
                                })
                                optionInput.addEventListener('change', event => {
                                    saveToStorage(option.key, event.target.value, 'local')
                                })
                                break

                            case 'description':
                                let optionText = element('span', `st-start-edit-${option.key}-text`, optionWrapper, { name: option.title })
                                break

                            default:
                                // TODO: implement other option types as necessary
                                break
                        }
                    })
                }

                item.addEventListener('dragstart', event => {
                    setTimeout(() => {
                        item.classList.add('dragging')
                    }, 0)

                    let dragGhost = item.cloneNode(true)
                    dragGhost.classList.add('st-sortable-list-ghost')
                    dragGhost.classList.remove('dragging')
                    dragGhost.setAttribute('style', `top: ${item.getBoundingClientRect().top}px; left: ${item.getBoundingClientRect().left}px; width: ${item.getBoundingClientRect().width}px; height: ${item.getBoundingClientRect().height}px; translate: ${event.clientX}px ${event.clientY}px; transform: translateX(-${event.clientX}px) translateY(-${event.clientY}px);`)
                    document.body.append(dragGhost)
                })
                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging')
                    item.classList.add('dragging-return')
                    document.querySelectorAll('.st-sortable-list-ghost').forEach(e => {
                        e.classList.add('returning')
                        e.setAttribute('style', `top: ${item.getBoundingClientRect().top}px; left: ${item.getBoundingClientRect().left}px; width: ${item.getBoundingClientRect().width}px; height: ${item.getBoundingClientRect().height}px;`)
                        setTimeout(() => {
                            e.remove()
                            item.classList.remove('dragging-return')
                        }, 200)
                    })
                })

            })
            let excludedWidgetsDesc = element('span', 'st-start-edit-exclude-desc', widgets, { innerText: "Sleep widgets hierheen om ze uit te schakelen." })
            sortableList.addEventListener('dragover', (event) => {
                event.preventDefault()

                const draggingItem = document.querySelector('.dragging')

                const draggingGhost = document.querySelector('.st-sortable-list-ghost')
                draggingGhost.style.translate = `${event.clientX}px ${event.clientY}px`

                let siblings = [...draggingItem.parentElement.children].filter(child => child !== draggingItem)

                let nextSibling = siblings.find(sibling => {
                    return (event.clientY) <= (sibling.getBoundingClientRect().y + sibling.getBoundingClientRect().height / 2)
                })

                sortableList.insertBefore(draggingItem, nextSibling)

                let widgetsOrder = [...sortableList.children].map(element => element.dataset.value)
                saveToStorage('start-widgets', widgetsOrder, 'local')

                if (Array.prototype.indexOf.call(sortableList.children, sortableList.querySelector('.dragging')) > Array.prototype.indexOf.call(sortableList.children, sortableList.querySelector('#st-start-edit-exclude'))) {
                    draggingGhost.classList.add('excluded')
                    draggingItem.classList.add('excluded')
                }
                else {
                    draggingGhost.classList.remove('excluded')
                    draggingItem.classList.remove('excluded')
                }
            })
            sortableList.addEventListener('dragenter', e => e.preventDefault())

            // Finish button
            let finishButton = element('button', 'st-start-edit-finish', widgets, { class: 'st-button primary', 'data-icon': '', innerText: "Bewerken voltooien", title: "Terugkeren naar widgetpaneel. Wijzigingen zijn al opgeslagen." })
            finishButton.addEventListener('click', () => {
                container.classList.add('editing-done')
                container.classList.remove('editing')
                widgets.scrollTop = 0
                widgets.innerText = ''
                todayWidgets()
                renderSchedule()
            }, { once: true })
        })

        // Draw the selected widgets in the specified order
        for (const functionName of widgetsShown) {
            widgetsProgressText.innerText = `Widget '${widgetFunctions[functionName].title}' laden...`
            let widgetElement = await widgetFunctions[functionName].render()
            if (widgetElement) widgets.append(widgetElement)
            widgets.append(editButton)
        }

        widgetsProgress.remove()
        widgetsProgressText.remove()
    }

    function verifyDisplayMode() {
        if (window.innerWidth < 1100 || sheetSetting || document.querySelector('#st-start-schedule')?.classList.contains('st-expanded')) {
            container.classList.remove('sheet-shown')
            container.classList.add('sheet')
        }
        else {
            container.classList.remove('sheet')
        }
    }
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

function eventChips(item) {
    let chips = []

    if (item.Status === 5) chips.push({ name: "Vervallen", type: 'warn' })
    if (item.InfoType === 1 && item.Afgerond) chips.push({ name: "Huiswerk", type: 'ok' })
    else if (item.InfoType === 1) chips.push({ name: "Huiswerk", type: 'info' })
    if (item.InfoType === 2 && item.Afgerond) chips.push({ name: "Proefwerk", type: 'ok' })
    else if (item.InfoType === 2) chips.push({ name: "Proefwerk", type: 'important' })
    if (item.Type === 7 && item.Lokatie?.length > 0) chips.push({ name: "Ingeschreven", type: 'ok' })
    else if (item.Type === 7) chips.push({ name: "KWT", type: 'info' })

    return chips
}