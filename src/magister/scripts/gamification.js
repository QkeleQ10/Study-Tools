gamification()

async function gamification() {
    if (!syncedStorage['magister-gamification-beta']) return

    let categories = [
        ['grades', "Cijfers", "Cijfers van ", "Hogere cijfers leveren meer punten op. Latere leerjaren hebben meer impact op je score."],
        ['absences', "Ongeoorloofde absenties", "Absenties in ", "Je verliest punten per ongeoorloofde absentie."],
        ['assignmentsEarly', "Opdrachten op tijd ingeleverd", "Opdrachten in ", "Je verdient punten per op tijd ingeleverde opdracht en extra punten per dag te vroeg. Latere leerjaren hebben meer impact op je score."]
        // ['assignmentsLate', "Opdrachten te laat ingeleverd", "Opdrachten in ", "Voor elke dag dat je een opdracht te laat inlevert, kun je 2 punten verliezen."]
    ],
        photo = await awaitElement("#user-menu > figure > img"),
        levelElem = element('button', 'st-level', document.body, { 'data-level': '...', title: "Puntensysteem", style: 'display:none;' }),
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
        gmCardLevel = element('div', 'st-gm-card-level', gmCard, { innerText: "..." }),
        gmCardProgress = element('div', 'st-gm-card-progress', gmCard),
        gmCardProgressFilled = element('div', 'st-gm-card-progress-filled', gmCardProgress),
        gmBreakdown = element('div', 'st-gm-breakdown', gmWrap)

    levelElem.addEventListener('click', () => { gmOverlay.showModal() })
    gmClose.addEventListener('click', () => { gmOverlay.close() })

    calculateScore()

    async function calculateScore() {
        let req = await chrome.runtime.sendMessage({ action: 'getCredentials' })
        let token = req.token
        let userId = req.userId

        // Fetch all years and info related.
        const yearsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/leerlingen/${userId}/aanmeldingen?begin=2013-01-01&einde=${new Date().getFullYear() + 1}-01-01`, { headers: { Authorization: token } }),
            yearsArray = yearsRes.items,
            years = {}

        // Loop through each year and gather grades, absences and assignments. Bind them to their respective key in the 'years' object.
        yearsArray.forEach(async year => {
            const gradesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/aanmeldingen/${year.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year.einde}`, { headers: { Authorization: token } })
            const gradesJson = gradesRes.Items

            const absencesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/absenties?van=${year.begin}&tot=${year.einde}`, { headers: { Authorization: token } }),
                absencesJson = absencesRes.Items

            const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${userId}/opdrachten?top=250&startdatum=${year.begin}&einddatum=${year.einde}`, { headers: { Authorization: token } }),
                assignmentsJson = assignmentsRes.Items

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
                    // TODO: Should assignment point deduction return?
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
        level = Math.floor(Math.sqrt(points.total + 9) - 3)
        pointsRequired = 2 * level + 7
        pointsProgress = Math.floor(points.total - (level ** 2 + 6 * level))

        if (typeof points?.total === 'undefined') return

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

    let key = syncedStorage['magister-overlay-hotkey'] || 'S'

    addEventListener('keydown', e => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return
        if (e.key.toLowerCase() === key.toLowerCase()) {
            e.preventDefault()
            levelElem.style.display = 'flex'
        }
    })
    addEventListener('keyup', e => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.getAttribute('contenteditable') === 'true') return
        if (e.key.toLowerCase() === key.toLowerCase()) {
            levelElem.style.display = 'none'
        }
    })
}