// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) gamification()
}

async function gamification() {
    if (!syncedStorage['magister-gamification-beta']) return

    let categories = [
        ['grades', "Cijfers", "Cijfers van ", "Hogere cijfers leveren meer punten op. Latere leerjaren hebben meer impact op je score."],
        ['absences', "Ongeoorloofde absenties", "Absenties in ", "Je verliest punten per ongeoorloofde absentie."],
        ['assignmentsEarly', "Opdrachten op tijd ingeleverd", "Opdrachten in ", "Je verdient punten per op tijd ingeleverde opdracht en extra punten per dag te vroeg. Latere leerjaren hebben meer impact op je score."]
        // ['assignmentsLate', "Opdrachten te laat ingeleverd", "Opdrachten in ", "Voor elke dag dat je een opdracht te laat inlevert, kun je 2 punten verliezen."]
    ],
        mainContainer = await awaitElement('section.main'),
        photo = await awaitElement("#user-menu > figure > img"),
        // notifications = await awaitElement('#st-vd-notifications'),
        levelElem = element('button', 'st-level', mainContainer, {'data-level': '...'}),
        progressElem = element('div', 'st-progress', levelElem),
        progressFilled = element('div', 'st-progress-filled', progressElem),
        gmOverlay = element('dialog', 'st-gm', document.body, { class: 'st-overlay' }),
        gmClose = element('button', 'st-gm-close', gmOverlay, { class: 'st-button', innerText: "Sluiten", 'data-icon': '' }),
        gmTitle = element('span', 'st-gm-title', gmOverlay, { class: 'st-title', innerText: "Jouw score" }),
        gmSubtitle = element('span', 'st-gm-subtitle', gmOverlay, { class: 'st-subtitle', innerText: "Verdien punten en verhoog je niveau door voldoendes te halen, opdrachten vroeg in te leveren en zo min mogelijk absenties te hebben." }),
        gmWrap = element('div', 'st-gm-wrap', gmOverlay),
        gmCard = element('div', 'st-gm-card', gmWrap),
        gmCardTitle = element('span', 'st-gm-card-title', gmCard, { class: 'st-title', innerText: photo.alt }),
        gmCardSubtitle = element('span', 'st-gm-card-subtitle', gmCard, { class: 'st-subtitle', innerText: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) }),
        gmCardLevel = element('div', 'st-gm-card-level', gmCard, {innerText: "..."}),
        gmCardProgress = element('div', 'st-gm-card-progress', gmCard),
        gmCardProgressFilled = element('div', 'st-gm-card-progress-filled', gmCardProgress),
        gmBreakdown = element('div', 'st-gm-breakdown', gmWrap)
    // gmBannerAd = element('div', 'st-gm-ad', gmOverlay, {
    //     class: 'st-banner-ad', innerText: "Gamificatie (het berekenen van scores en niveaus) is onderdeel van Study Tools voor Magister.", onclick: `window.open('https://qkeleq10.github.io/extensions/studytools', '_blank').focus()`
    // })

    levelElem.addEventListener('click', () => { gmOverlay.showModal() })
    gmClose.addEventListener('click', () => { gmOverlay.close() })

    calculateScore()

    async function calculateScore() {
        let response = await chrome.runtime.sendMessage(['token', 'userId']),
            token = response?.token || await getFromStorage('token', 'local'),
            userId = response?.userId || await getFromStorage('user-id', 'local')
        console.info("Received user token and user ID from service worker.")

        // Fetch all years and info related.
        const yearsRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/leerlingen/${userId}/aanmeldingen?begin=2013-01-01&einde=${new Date().getFullYear() + 1}-01-01`, { headers: { Authorization: token } }),
            yearsArray = (await yearsRes.json()).items,
            years = {}

        // Loop through each year and gather grades, absences and assignments. Bind them to their respective key in the 'years' object.
        yearsArray.forEach(async year => {
            const gradesRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/aanmeldingen/${year.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year.einde}`, { headers: { Authorization: token } })
            const gradesJson = (await gradesRes.json()).Items

            const absencesRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/absenties?van=${year.begin}&tot=${year.einde}`, { headers: { Authorization: token } }),
                absencesJson = (await absencesRes.json()).Items

            const assignmentsRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/opdrachten?top=250&startdatum=${year.begin}&einddatum=${year.einde}`, { headers: { Authorization: token } }),
                assignmentsJson = (await assignmentsRes.json()).Items

            years[year.id] = { grades: gradesJson, absences: absencesJson, assignments: assignmentsJson, name: year.studie.code }
        })

        // Wait for the requests to finish, then continue calculating the points.
        checkRequestsDone()
        function checkRequestsDone() {
            if (Object.keys(years).length !== yearsArray.length) {
                setTimeout(checkRequestsDone, 100)
            } else {
                let points = calculatePoints(years)
                displayScore(points)
            }
        }

        // Commence calculating the points.
        function calculatePoints(years) {
            // TODO: Balancing!
            // TODO: Points are currently allowed to decrease (when absences are added). Should this also occur when the grade mean drops or when assignments are handed in late?
            // HANDING IN LATE: Currently commented out due to issues. Assignments that are not mandatory would still deduct points.
            // ABSENCES: Should licit absences (loopbaanbegeleiding, interne activiteit) be rewarded? Currently, only illicit absences are taken into account and deduct points.

            let points = {
                absences: {},
                grades: {},
                assignmentsEarly: {}
                // assignmentsLate: {}
            }

            Object.keys(years).forEach((yearId, i, a) => {
                let yearName = years[yearId].name,
                    gradesN = 0,
                    gradesV = 0,
                    absencesN = 0,
                    absencesV = 0,
                    assignmentsEarlyN = 0,
                    assignmentsEarlyV = 0
                // assignmentsLateN = 0,
                // assignmentsLateV = 0

                // Sufficient grades grant points proportionally to the user's score
                years[yearId].grades.filter(e => !Number.isNaN(Number(e.CijferStr?.replace(',', '.'))) && e.CijferKolom.KolomSoort === 1).forEach(grade => {
                    let result = Number(grade.CijferStr?.replace(',', '.'))
                    if (result < 5.5) return // This prevents deducting points if an insufficient grade is added
                    gradesN++
                    gradesV += (3 * result - 12)
                })
                gradesV = Math.ceil(gradesV * (0.25 * i + .5))
                points.grades[yearId] = { n: gradesN, v: gradesV, g: yearName }

                // Illicit absences deduct 8 pt from the user's score
                years[yearId].absences.filter(e => !e.Geoorloofd).forEach(absence => {
                    absencesN++
                    absencesV -= 8
                })
                points.absences[yearId] = { n: absencesN, v: absencesV, g: yearName }

                // Assignments can either grant or deduct points
                years[yearId].assignments.filter(e => e.Afgesloten || e.IngeleverdOp || new Date(e.InleverenVoor) < new Date()).forEach(assignment => {
                    // if (new Date(assignment.InleverenVoor) < new Date() && (!assignment.Afgesloten || !assignment.IngeleverdOp)) {
                    //     // Deduct 12 pt if the assignment wasn't handed in even after the due date
                    //     assignmentsLateN++
                    //     assignmentsLateV -= 12
                    // } else if (new Date(assignment.IngeleverdOp) > new Date(assignment.InleverenVoor)) {
                    //     // Deduct at most 12 pt if the assignment was handed in after the due date
                    //     assignmentsLateN++
                    //     assignmentsLateV += Math.max(-12, (new Date(assignment.InleverenVoor) - new Date(assignment.IngeleverdOp)) / 43200000) // Deduct 1 pt per 12 h
                    // } else
                    if (new Date(assignment.IngeleverdOp) <= new Date(assignment.InleverenVoor)) {
                        // Grant at most 20 pt if the assignment was handed in before the due date
                        assignmentsEarlyN++
                        assignmentsEarlyV += Math.min(20, (new Date(assignment.InleverenVoor) - new Date(assignment.IngeleverdOp)) / 172800000 + 2) // Add 2 pt, plus 1 pt per 24 h
                    }
                })
                // assignmentsLateV = Math.floor(assignmentsLateV)
                // points.assignmentsLate[yearId] = { n: assignmentsLateN, v: assignmentsLateV, g: yearName }
                assignmentsEarlyV = Math.ceil(assignmentsEarlyV * (0.25 * i + .5))
                points.assignmentsEarly[yearId] = { n: assignmentsEarlyN, v: assignmentsEarlyV, g: yearName }
            })

            // All points are added up and returned
            points.total = 0
            Object.keys(points).forEach(categoryKey => {
                if (categoryKey === 'total') return
                points[categoryKey].sum = 0
                Object.keys(points[categoryKey]).forEach(yearKey => {
                    if (yearKey === 'sum') return
                    points[categoryKey].sum += points[categoryKey][yearKey].v
                })
                points.total += points[categoryKey].sum
            })

            if (points.total < 0) points.total = 0

            return points
        }
    }

    async function displayScore(points) {
        // let points = syncedStorage['points'],
        // pointsBefore = syncedStorage['points-before'],
        // pointsDiff = points.total - pointsBefore.total,
        level = Math.floor(Math.sqrt(points.total + 9) - 3)
        // levelBefore = Math.floor(Math.sqrt(pointsBefore.total + 9) - 3),
        // levelDiff = Math.round(level - levelBefore),
        pointsRequired = 2 * level + 7
        pointsProgress = Math.floor(points.total - (level ** 2 + 6 * level))
        // notification

        if (typeof points?.total === 'undefined') return

        // if (levelDiff > 0) {
        //     notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Niveau gestegen (+${levelDiff} niveau${levelDiff > 1 ? 's' : ''})`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
        //     notifications.prepend(notification)
        // } else if (levelDiff < 0) {
        //     notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Niveau gezakt (${levelDiff} niveau${levelDiff < -1 ? 's' : ''})`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
        //     notifications.prepend(notification)
        // } else if (pointsDiff > 0) {
        //     notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Punten verdiend (+${pointsDiff} punten)`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
        //     notifications.prepend(notification)
        // } else if (pointsDiff < 0) {
        //     notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Punten verloren (${pointsDiff} punten)`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
        //     notifications.prepend(notification)
        // }
        // if (pointsDiff > 0 || pointsDiff < 0) {
        //     Object.keys(points).forEach(key => {
        //         if (key === 'total') return
        //         let valueBefore = pointsBefore[key],
        //             valueAfter = points[key],
        //             title = categories.find(e => e[0] === key)[1]
        //         if (!title && points[key].g) title = "Cijfers van " + points[key].g
        //         if (!title) return
        //         if (JSON.stringify(valueAfter) !== JSON.stringify(valueBefore)) {
        //             if (notification.dataset.additionalInfo.length > 1) notification.dataset.additionalInfo += ', '
        //             notification.dataset.additionalInfo += title
        //         }
        //     })
        // }
        // saveToStorage('points-before', points)

        if (Number.isNaN(level)) level = 0
        levelElem.dataset.level = level + 1
        gmCardLevel.innerText = level + 1
        progressFilled.style.setProperty('--level-progress', pointsProgress / pointsRequired)
        gmCardProgressFilled.style.setProperty('--level-progress', pointsProgress / pointsRequired)
        gmCardProgress.dataset.pointsProgress = pointsProgress
        gmCardProgress.dataset.pointsRequired = pointsRequired
        gmCardProgress.dataset.pointsRemaining = pointsRequired - pointsProgress
        gmCardProgress.dataset.levelNext = level + 2
        gmBreakdown.innerText = ''

        categories.forEach(category => {
            let categoryElement = element('div', `st-gm-${category[0]}`, gmBreakdown)
            let categoryTitle = element('div', `st-gm-${category[0]}-t`, categoryElement, { innerText: category[1], 'data-value': points[category[0]].sum.toLocaleString('nl-NL', { maximumFractionDigits: 2 }), onclick: `this.parentElement.classList.toggle('expand')` })
            Object.keys(points[category[0]]).forEach(yearKey => {
                let value = points[category[0]][yearKey].v,
                    count = points[category[0]][yearKey].n,
                    title = category[2] + points[category[0]][yearKey].g
                if (!value || !count || !title || count < 1) return
                let yearElement = element('div', `st-gm-${category[0]}-${yearKey}`, categoryElement, { innerText: `${title} (${count}×)`, 'data-value': value.toLocaleString('nl-NL', { maximumFractionDigits: 2 }) })
            })
            let categoryExplanation = element('div', `st-gm-${category[0]}-e`, categoryElement, { innerText: category[3] })
        })

        let total = document.createElement('div')
        gmBreakdown.append(total)
        total.innerText = "Totaal"
        total.classList.add('total')
        total.dataset.value = points.total.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
    }
}