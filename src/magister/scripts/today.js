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
    if (!syncedStorage['magister-vd-overhaul']) return
    let mainView = await awaitElement('div.view:has(#vandaag-container)'),
        container = element('div', 'st-vd', mainView),
        header = element('div', 'st-vd-header', container),
        headerText = element('span', 'st-vd-header-span', header, { class: 'st-title' }),
        schedule = element('div', 'st-vd-schedule', container),
        widgets = element('div', 'st-vd-widgets', container)

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
}

// TODO: prevent overlap
// TODO: auto update state
async function todaySchedule(schedule, widgets) {
    const daysToGather = 30
    const daysToShowSetting = 1
    const magisterMode = syncedStorage['vd-schedule-view'] === 'list'

    let req = await chrome.runtime.sendMessage({ action: 'getCredentials' }),
        gatherStart = new Date(),
        gatherEnd = new Date(gatherStart.getTime() + (86400000 * (daysToGather - 1)))

    token = req.token
    userId = req.userId

    const eventsRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: token } })
    if (!eventsRes.ok) {
        showSnackbar(`Fout ${eventsRes.status}\nVernieuw de pagina en probeer het opnieuw`)
        if (eventsRes.status === 429) showSnackbar(`Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
        return
    }
    const eventsJson = await eventsRes.json()
    events = eventsJson.Items

    console.log(events)

    // Widgets may now be rendered
    todayWidgets(widgets)

    if (magisterMode) renderSchedule(daysToShowSetting, 'list', 'title-magister')
    else renderSchedule(daysToShowSetting, 'schedule', 'title-formatted')

    function renderSchedule(daysToShow, viewMode, titleMode) {
        schedule.classList.add(viewMode, titleMode)

        let scheduleHead = element('div', `st-vd-schedule-head`, schedule)
        let scheduleWrapper = element('div', 'st-vd-schedule-wrapper', schedule)

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
        // TODO only on shown days
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

        if (timeInHours(now) > agendaEnd && daysToShow === 1) {
            renderSchedule(daysToShow + 1, viewMode, titleMode)
            return
        }

        // Create tick marks for schedule view
        if (viewMode !== 'list') {
            for (let i = agendaStart; i <= agendaEnd; i += 0.5) {
                let hourTick = element('div', `st-vd-tick-${i}h`, scheduleWrapper, { class: `st-vd-tick ${Number.isInteger(i) ? 'whole' : 'half'}`, style: `--relative-start: ${i - agendaStart}` })
            }
            if (timeInHours(now) > agendaStart && timeInHours(now) < agendaEnd) {
                let nowMarker = element('div', `st-vd-now`, scheduleWrapper, { style: `--relative-start: ${timeInHours(now) - agendaStart}` })
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
            if (viewMode !== 'list' && a.length > 1)
                colHead = element('div', `st-vd-col-${key}-head`, scheduleHead, {
                    class: 'st-vd-col-head',
                    'data-today': (key === now.toISOString().split('T')[0]),
                    innerText: (key === now.toISOString().split('T')[0]) ? "Vandaag" : new Date(key).toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })
                })

            // Loop through all events of the day
            eventsPerDay[key].forEach((item, i) => {
                let ongoing = (new Date(item.Start) < now && new Date(item.Einde) > now)

                // Render the event element
                let eventElement = element('button', `st-vd-event-${item.Id}`, col, { class: 'st-vd-event', 'data-2nd': item.Omschrijving, 'data-ongoing': ongoing, style: `--relative-start: ${timeInHours(item.Start) - agendaStart}; --duration: ${timeInHours(item.Einde) - timeInHours(item.Start)}` })
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
                if (item.Type === 7 && item.Vakken?.[0]) chips.push({ name: "Ingeschreven", type: 'ok' })
                else if (item.Type === 7) chips.push({ name: "KWT", type: 'info' })

                let eventChipsWrapper = element('div', `st-vd-event-${item.Id}-labels`, eventElement, { class: 'st-chips-wrapper' })
                chips.forEach(chip => {
                    let chipElement = element('span', `st-vd-event-${item.Id}-label-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                })
            })

            setTimeout(() => document.querySelector('.st-vd-event[data-ongoing=true]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50)

            // TODO: expand button that rerenders with daysToShow = 5. Also collapse button to undo this

            // TODO: gap when days are not successive
        })
    }

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

async function todayWidgets(widgets) {
    let now = new Date()
    let selectedWidgets = ['grades', 'homework', 'messages', 'assignments']
    let widgetFunctions = {

        // WIDGETS
        // ✅ Huiswerk
        // Cijfers
        // ✅ Opdrachten
        // ✅ Berichten
        // Evt meldingen
        // ...

        grades: () => {
            let widgetElement = element('div', 'st-vd-widget-grades', widgets, { class: 'st-tile st-widget' })
            let widgetTitle = element('div', 'st-vd-widget-grades-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Laatste cijfer"})
        },

        homework: () => {
            let eventsWithHomework = events.filter(item => item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())

            if (eventsWithHomework.length < 1) return
            let widgetElement = element('div', 'st-vd-widget-homework', widgets, { class: 'st-tile st-widget' })
            let widgetTitle = element('div', 'st-vd-widget-homework-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Huiswerk", 'data-description': `${eventsWithHomework.length} item${eventsWithHomework.length > 1 ? 's' : ''} in de komende maand` })

            eventsWithHomework.forEach(item => {
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
        },

        messages: async () => {
            const messagesRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`, { headers: { Authorization: token } })
            if (!messagesRes.ok) {
                showSnackbar(`Fout ${messagesRes.status}\nVernieuw de pagina en probeer het opnieuw`)
                if (messagesRes.status === 429) showSnackbar(`Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
                return
            }
            const messagesJson = await messagesRes.json()
            const messages = messagesJson.items

            if (messages.length < 1) return
            let widgetElement = element('div', 'st-vd-widget-messages', widgets, { class: 'st-tile st-widget' })
            let widgetTitle = element('div', 'st-vd-widget-messages-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Berichten", 'data-description': `${messages.length} ongelezen bericht${messages.length > 1 ? 'en' : ''}` })

            messages.forEach(item => {
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
        },

        assignments: async () => {
            const assignmentsRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`, { headers: { Authorization: token } })
            if (!assignmentsRes.ok) {
                showSnackbar(`Fout ${assignmentsRes.status}\nVernieuw de pagina en probeer het opnieuw`)
                if (assignmentsRes.status === 429) showSnackbar(`Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
                return
            }
            const assignmentsJson = await assignmentsRes.json()
            const assignments = assignmentsJson.Items
            console.log(assignments)
            const filteredAssignments = assignments.filter(item => (!item.Afgesloten && !item.IngeleverdOp) || item.BeoordeeldOp)

            if (filteredAssignments.length < 1) return
            let widgetElement = element('div', 'st-vd-widget-assignments', widgets, { class: 'st-tile st-widget' })
            let widgetTitle = element('div', 'st-vd-widget-assignments-title', widgetElement, { class: 'st-section-title st-widget-title', innerText: "Opdrachten", 'data-description': `${filteredAssignments.length} openstaande opdracht${filteredAssignments.length > 1 ? 'en' : ''}` })

            filteredAssignments.forEach(item => {
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
                // TODO: allow for Ingeleverd state

                let assignmentChipsWrapper = element('div', `st-vd-widget-assignments-${item.id}-labels`, assignmentElement, { class: 'st-chips-wrapper' })
                chips.forEach(chip => {
                    let chipElement = element('span', `st-vd-widget-assignments-${item.id}-label-${chip.name}`, assignmentChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                })
            })
        }

    }

    selectedWidgets.forEach(widgetId => {
        widgetFunctions[widgetId].call()
    })

    // TODO: order, possibly using promises and Promise.all()
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