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

// WIDGETS
// Huiswerk
// Toetsen
// Cijfers
// Opdrachten
// Evt meldingen en berichten
// ...

async function todaySchedule(schedule) {
    let scheduleHead = element('div', `st-vd-schedule-head`, schedule)
    let scheduleWrapper = element('div', 'st-vd-schedule-wrapper', schedule)

    const daysToGather = 2

    let now = new Date()

    let response = await chrome.runtime.sendMessage({ action: 'getCredentials' }),
        token = response?.token || await getFromStorage('token', 'local'),
        userId = response?.userId || await getFromStorage('user-id', 'local'),
        gatherStart = new Date(),
        gatherEnd = new Date(gatherStart.getTime() + (86400000 * (daysToGather - 1)))
    console.info("Received credentials from " + (response ? "service worker." : "stored data."))

    const apptsRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/afspraken?van=${gatherStart.getFullYear()}-${gatherStart.getMonth() + 1}-${gatherStart.getDate()}&tot=${gatherEnd.getFullYear()}-${gatherEnd.getMonth() + 1}-${gatherEnd.getDate()}`, { headers: { Authorization: token } })
    if (!apptsRes.ok) {
        showSnackbar(`Fout ${apptsRes.status}\nVernieuw de pagina en probeer het opnieuw`)
        if (apptsRes.status === 429) showSnackbar(`Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`)
        return
    }
    const apptsJson = await apptsRes.json()
    const appts = apptsJson.Items

    const agendaStart = appts.reduce((earliestHour, currentItem) => {
        let currentHour = timeInHours(currentItem.Start)
        if (!earliestHour || currentHour < earliestHour) { return currentHour - 0.5 }
        return earliestHour
    }, null)

    const agendaEnd = appts.reduce((latestHour, currentItem) => {
        let currentHour = timeInHours(currentItem.Einde)
        if (!latestHour || currentHour > latestHour) { return currentHour + 0.5 }
        return latestHour
    }, null)

    for (let i = agendaStart; i <= agendaEnd; i += 0.5) {
        let hourTick = element('div', `st-vd-tick-${i}h`, scheduleWrapper, { class: `st-vd-tick ${Number.isInteger(i) ? 'whole' : 'half'}`, style: `--relative-start: ${i - agendaStart}` })
    }

    // Loop through the appts array and split based on date
    let apptsPerDay = {}
    appts.forEach(item => {
        const startDate = new Date(item.Start)
        const year = startDate.getFullYear()
        const month = startDate.getMonth() + 1
        const date = startDate.getDate()

        const key = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
        if (!apptsPerDay[key]) apptsPerDay[key] = []

        apptsPerDay[key].push(item)
    })
    console.log(apptsPerDay)

    Object.keys(apptsPerDay).forEach(key => {
        let col = element('div', `st-vd-col-${key}`, scheduleWrapper, {
            class: 'st-vd-col',
            'data-today': (key === now.toISOString().split('T')[0])
        }),
            colHead = element('div', `st-vd-col-${key}-head`, scheduleHead, {
                class: 'st-vd-col-head',
                'data-today': (key === now.toISOString().split('T')[0]),
                innerText: (key === now.toISOString().split('T')[0]) ? "Vandaag" : new Date(key).toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })
            })

        apptsPerDay[key].forEach((item, i) => {
            let subjectNames = item.Vakken?.map(e => e.Naam) || [item.Omschrijving],
                teacherNames = item.Docenten?.map(e => e.Naam) || [],
                locationNames = item.Lokalen?.map(e => e.Naam) || [item.Lokatie]
            if (subjectNames.length < 1 && item.Omschrijving) subjectNames.push(item.Omschrijving)
            if (locationNames.length < 1 && item.Lokatie) locationNames.push(item.Lokatie)
            if (teacherNames.length === 1) teacherNames[0] += ` (${item.Docenten[0].Docentcode})`

            let chips = []
            if (item.InfoType === 1) chips.push({ name: "Huiswerk", type: item.Afgerond ? 'ok' : 'info' })

            let timeSlots = (item.LesuurVan === item.LesuurTotMet) ? item.LesuurVan : `${item.LesuurVan}-${item.LesuurTotMet}`

            let ongoing = (new Date(item.Start) < now && new Date(item.Einde) > now)

            let apptElement = element('button', `st-vd-appt-${item.Id}`, col, { class: 'st-vd-appt', 'data-2nd': item.Omschrijving, 'data-ongoing': ongoing, style: `--relative-start: ${timeInHours(item.Start) - agendaStart}; --duration: ${timeInHours(item.Einde) - timeInHours(item.Start)}` })
            apptElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)
            let apptTimeSlots = element('div', `st-vd-appt-${item.Id}-time-slots`, apptElement, { class: 'st-vd-appt-time-slots', innerText: timeSlots })
            let apptSubjectWrapper = element('span', `st-vd-appt-${item.Id}-subject-wrapper`, apptElement, { class: 'st-vd-appt-subject-wrapper' })
            let apptSubject = element('span', `st-vd-appt-${item.Id}-subject`, apptSubjectWrapper, { class: 'st-vd-appt-subject', innerText: subjectNames.join(', ') })
            let apptTeacher = element('span', `st-vd-appt-${item.Id}-teacher`, apptElement, { class: 'st-vd-appt-teacher', innerText: teacherNames.join(', ') })
            let apptLocation = element('span', `st-vd-appt-${item.Id}-location`, apptSubjectWrapper, { class: 'st-vd-appt-location', innerText: locationNames.join(', ') })
            let apptTime = element('span', `st-vd-appt-${item.Id}-time`, apptElement, { class: 'st-vd-appt-time', innerText: `${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.Einde).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })}` })
            let apptChipsWrapper = element('div', `st-vd-appt-${item.Id}-labels`, apptElement, { class: 'st-vd-appt-chips' })
            chips.forEach(chip => {
                let chipElement = element('span', `st-vd-appt-${item.Id}-label-${chip.name}`, apptElement, { class: `st-vd-appt-chip ${chip.type || 'info'}`, innerText: chip.name })
            })

            if (i === 0) {
                apptElement.scrollIntoView(true)
                scheduleWrapper.scrollBy({top: -2, behavior: 'instant'})
            }
        })

    })

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