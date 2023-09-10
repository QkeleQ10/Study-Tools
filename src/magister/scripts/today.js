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
    console.log(mainView, container)

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

            if (description === 'activiteiten waarop nog ingeschreven moet of kan worden') description = 'inschrijfmogelijkheden'
            if (description === 'activiteit waarop nog ingeschreven moet of kan worden') description = 'inschrijfmogelijkheid'

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
                } else if (description.includes('inschrijf')) {
                    element.dataset.icon = ''
                } else if (description.includes('logboek')) {
                    element.dataset.icon = ''
                }
            }
        }, e.firstElementChild.innerText.includes('?') ? 500 : 0)
    })

    notifcationsWrapper.dataset.ready = true
}

// WIDGETS
// Huiswerk
// Toetsen
// Cijfers
// Opdrachten
// Evt meldingen en berichten
// ...

async function todaySchedule(scheduleWrapper) {
    const daysToGather = 2

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

    let apptsPerDay = {}

    // Loop through the appts array and split based on date
    appts.forEach(item => {
        const startDate = new Date(item.Start)
        const year = startDate.getFullYear()
        const month = startDate.getMonth() + 1
        const date = startDate.getDate()

        const key = `${year}-${month.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`
        if (!apptsPerDay[key]) {
            apptsPerDay[key] = []
        }

        apptsPerDay[key].push(item)
    })

    console.log(apptsPerDay)

    Object.keys(apptsPerDay).forEach(key => {
        let col = element('div', `st-vd-col-${key}`, scheduleWrapper, { class: 'st-vd-col' })

        apptsPerDay[key].forEach(item => {
            let subjectNames = item.Vakken?.map(e => e.Naam) || [item.Omschrijving],
                teacherNames = item.Docenten?.map(e => e.Naam) || [],
                locationNames = item.Lokalen?.map(e => e.Naam) || [item.Lokatie]
            if (subjectNames.length < 1 && item.Omschrijving) subjectNames.push(item.Omschrijving)
            if (locationNames.length < 1 && item.Lokatie) locationNames.push(item.Lokatie)

            let apptElement = element('button', `st-vd-appt-${item.Id}`, col, { class: 'st-vd-appt', 'data-2nd': item.Omschrijving })
            apptElement.addEventListener('click', () => window.location.hash = `#/agenda/afspraak/${item.Id}`)
            let apptSubject = element('span', `st-vd-appt-${item.Id}-subject`, apptElement, { class: 'st-vd-appt-subject', innerText: subjectNames.join(', ') })
            let apptTeacher = element('span', `st-vd-appt-${item.Id}-teacher`, apptElement, { class: 'st-vd-appt-teacher', innerText: teacherNames.join(', ') })
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