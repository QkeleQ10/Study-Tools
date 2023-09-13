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

    todaySchedule(schedule)

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
async function todaySchedule(schedule) {
    const daysToGather = 7
    const daysToShowSetting = 1
    const magisterMode = syncedStorage['vd-schedule-view'] === 'list'

    let { token, userId } = await chrome.runtime.sendMessage({ action: 'getCredentials' }),
        gatherStart = new Date(),
        gatherEnd = new Date(gatherStart.getTime() + (86400000 * (daysToGather - 1)))

    const eventsRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: token } })
    if (!eventsRes.ok) {
        showSnackbar(`Fout ${eventsRes.status}\nVernieuw de pagina en probeer het opnieuw`)
        if (eventsRes.status === 429) showSnackbar(`Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
        return
    }
    const eventsJson = await eventsRes.json()
    const events = eventsJson.Items

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
        console.log(eventsPerDay)

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
                else if (item.InfoType === 1) chips.push({ name: "Huiswerk", type: 'ok' })
                if (item.Type === 7 && item.Vakken?.[0]) chips.push({ name: "Ingeschreven", type: 'ok' })
                else if (item.Type === 7) chips.push({ name: "KWT", type: 'info' })

                let eventChipsWrapper = element('div', `st-vd-event-${item.Id}-labels`, eventElement, { class: 'st-vd-event-chips' })
                chips.forEach(chip => {
                    let chipElement = element('span', `st-vd-event-${item.Id}-label-${chip.name}`, eventChipsWrapper, { class: `st-vd-event-chip ${chip.type || 'info'}`, innerText: chip.name })
                })
            })

            setTimeout(() => document.querySelector('.st-vd-event[data-ongoing=true]')?.scrollIntoView({block: 'center', behavior: 'smooth'}), 50)

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

    // Status=3: huiswerk
    // Status=2 Type=2: ingeschreven
    // Status=1 Type=13: standaard
}

async function todayWidgets(widgets) {
    
}

// WIDGETS
// Huiswerk
// Toetsen
// Cijfers
// Opdrachten
// Evt meldingen en berichten
// ...

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