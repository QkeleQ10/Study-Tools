gamification()

let now = new Date()
const december15 = new Date(now.getFullYear(), 11, 15)
const january15 = new Date(now.getFullYear(), 0, 15)
if (now > december15 || now < january15) {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) wrapped()
    window.addEventListener('popstate', () => {
        if (document.location.href.split('?')[0].endsWith('/vandaag')) wrapped()
    })
}

async function gamification() {
    if (!syncedStorage['gamification-enabled']) return

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
        // Fetch all years and info related.
        const yearsArray = await MagisterApi.years(),
            years = {}

        // Loop through each year and gather grades, absences and assignments. Bind them to their respective key in the 'years' object.
        yearsArray.forEach(async year => {
            const gradesJson = await MagisterApi.grades.forYear(year)

            const absencesJson = await MagisterApi.absences.forYear(year)

            const assignmentsJson = await MagisterApi.assignments.forYear(year)

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

async function wrapped() {
    let currentTitle, currentSubtitle
    const firstName = (await awaitElement("#user-menu > figure > img")).alt.split(' ')[0]
    const widgets = await awaitElement('#st-start-widgets:not([data-working=true])')

    const widgetElement = element('button', 'st-start-widget-wrapped', widgets, { class: 'st-tile st-widget', title: "Jouw Magister Wrapped", innerText: "Magister\nWrapped" })

    widgetElement.addEventListener('click', async () => {
        const wrapped = element('dialog', 'st-wrapped', document.body, { class: 'st-overlay st-force-dark', innerText: '' }),
            title = element('span', 'st-wrapped-title', wrapped, { class: 'st-title', innerText: "Magister Wrapped" }),
            buttons = element('div', 'st-wrapped-button-wrapper', wrapped, { class: 'st-button-wrapper' }),
            viewOpts = element('div', 'st-wrapped-view', buttons, { class: 'st-segmented-control' }),
            viewBar = element('button', 'st-wrapped-view-bar', viewOpts, { class: 'st-button icon segment active', 'data-icon': '' }),
            viewPie = element('button', 'st-wrapped-view-pie', viewOpts, { class: 'st-button icon segment', 'data-icon': '' }),
            close = element('button', 'st-wrapped-close', buttons, { class: 'st-button', innerText: "Sluiten", 'data-icon': '' })

        wrapped.showModal()
        close.addEventListener('click', () => wrapped.close())

        const section1 = element('div', 'st-wrapped-1', wrapped, { class: 'st-wrapped-section' })
        const section1Wrapper = element('div', 'st-wrapped-1-wrapper', section1)
        const section1Text = element('span', 'st-wrapped-1-title', section1Wrapper, { innerText: `Welkom bij jouw Magister Wrapped, ${firstName}.` })
        const section1Sub = element('span', 'st-wrapped-1-subtitle', section1Wrapper, { innerText: "Je Wrapped wordt voor je klaargezet..." })

        changeTexts(`Welkom bij jouw Magister Wrapped, *${firstName}*.`, "Je Wrapped wordt voor je klaargezet...")

        const wrappedYear = now < january15 ? (now.getFullYear() - 1) : now.getFullYear()

        // const accountInfo = await MagisterApi.accountInfo()

        const years = await MagisterApi.years()

        const thisYearShallow = years.find(y => y.begin.includes(wrappedYear))
        const thisYear = thisYearShallow ? await MagisterApi.yearInfo(thisYearShallow) : {}
        const thisYearExam = thisYear.links?.examengegevens ? await MagisterApi.examInfo(thisYearShallow) : {}

        const lastYearShallow = years.find(y => y.einde.includes(wrappedYear))
        const lastYear = lastYearShallow ? await MagisterApi.yearInfo(lastYearShallow) : {}
        const lastYearExam = lastYear.links?.examengegevens ? await MagisterApi.examInfo(lastYearShallow) : {}

        const grades = [...(await MagisterApi.grades.forYear(lastYearShallow)), ...(await MagisterApi.grades.forYear(thisYearShallow))]
            .filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.'))) && new Date(grade.DatumIngevoerd) >= new Date(wrappedYear, 0, 1))
            .filter((grade, index, self) =>
                index === self.findIndex((g) =>
                    g.CijferKolom.KolomKop === grade.CijferKolom.KolomKop &&
                    g.CijferKolom.KolomNaam === grade.CijferKolom.KolomNaam &&
                    g.CijferStr === grade.CijferStr
                )
            )
        const gradesMean = calculateMean(grades.map(grade => Number(grade.CijferStr.replace(',', '.'))))

        const events = await MagisterApi.events(
            new Date(wrappedYear, 0, 1),
            new Date(wrappedYear, 11, 31)
        )

        const absences = await MagisterApi.absences.forYear({
            begin: new Date(wrappedYear, 0, 1).toISOString().substring(0, 10),
            einde: new Date(wrappedYear, 11, 31).toISOString().substring(0, 10)
        })

        const assignments = await MagisterApi.assignments.forYear({
            begin: new Date(wrappedYear, 0, 1).toISOString().substring(0, 10),
            einde: new Date(wrappedYear, 11, 31).toISOString().substring(0, 10)
        })

        const isFirstYear = !lastYearShallow
        const isFinalYear = thisYearExam && !thisYearExam.doetVroegtijdig

        let text1A = [`*${wrappedYear}* is alweer ${now < january15 ? 'bijna ' : ''}voorbij.`, `Laten we een terugblik werpen op *${wrappedYear}*.`, `Kom meer te weten over *jouw ${wrappedYear}* op Magister.`, `Welkom bij jouw Magister Wrapped, *${firstName}*.`].random()
        if (isFirstYear) text1A = [`Dit is jouw *eerste Magister Wrapped*, welkom!`, `Welkom bij Magister Wrapped, *${firstName}*!`].random()
        else if (isFinalYear) text1A = [`Dit is jouw *laatste Magister Wrapped*.`, `Fijn dat je je *laatste Magister Wrapped* komt bekijken.`, `Je laatste schooljaar op de middelbare beginnen met *Magister Wrapped*.`, `Welkom bij je laatste Magister Wrapped, *${firstName}*!`].random()

        let text1B = ["Scroll snel door voor inzichten over het afgelopen jaar.", "Neem snel een kijkje en scroll door!", "Fijn dat je er bent, scroll omlaag om te beginnen.", "Scroll omlaag om jouw Magister Wrapped te zien.", "Scroll naar beneden om te beginnen."].random()

        let text2A =
            `ben je doorgestroomd naar *${thisYear.studie.code}*`
        if (isFirstYear) text2A =
            `ben je hier begonnen met *${thisYearShallow.studie.code}* in ${thisYearShallow.groep.code}`
        else if (lastYear.isZittenBlijver) text2A =
            `ben je dan eindelijk doorgestroomd naar *${thisYear.studie.code}*`
        else if (isFinalYear) text2A =
            `ben je begonnen aan je *laatste jaar*: ${thisYear.studie.code}`
        else if (thisYear.isZittenBlijver) text2A =
            `besloot jij *${thisYearShallow.studie.code}* nog maar een jaartje te doen`

        let text2B =
            "Wat goed! Laten we eens terugkijken op het afgelopen kalenderjaar."
        if (isFirstYear) text2B =
            "Hoe bevalt het op je nieuwe school?"
        else if (isFinalYear && lastYearExam?.doetVroegtijdig && !lastYear.isZittenBlijver) text2B =
            "Je hebt zelfs al ervaring met het eindexamen. Nu de rest van je vakken nog."
        else if (isFinalYear && gradesMean > 7) text2B =
            "En je cijfers zijn super, dus dit moet goedkomen! Ik heb vertrouwen in je."
        else if (isFinalYear && lastYear.isZittenBlijver) text2B =
            "Ze zeggen dat je het moeilijkste jaar al achter de rug hebt (jij zelfs al twee keer). Jij kunt dit!"
        else if (isFinalYear) text2B =
            Math.random() < 0.5 ? "Ze zeggen dat je het moeilijkste jaar al achter de rug hebt. Dit kun jij!" : "Laten we terugkijken op het afgelopen jaar; het allerlaatste jaar voor je centraal examen."
        else if (thisYear.isZittenBlijver && thisYearExam.doetVroegtijdig) text2B =
            `En dat is helemaal oké! Je gaat in ${wrappedYear + 1} zelfs vervroegd examen doen.`
        else if (thisYear.isZittenBlijver) text2B =
            "En dat is helemaal oké! Je bent zeker niet de enige. Neem rustig de tijd."
        else if (thisYear.opleidingCode.omschrijving !== lastYear.opleidingCode.omschrijving) text2B =
            "Je hebt ook een belangrijke keuze achter de rug. Was het de juiste?"
        else if (lastYear.isZittenBlijver && gradesMean > 7) text2B =
            "En dat deed je met vlag en wimpel; wat een mooie cijfers dit jaar!"
        else if (lastYear.isZittenBlijver) text2B =
            "Wat fijn! Laten we eens terugkijken op het afgelopen kalenderjaar."
        else if (gradesMean > 7) text2B =
            `En wat een cijfers haalde je in ${wrappedYear}!`
        else if (gradesMean < 5.55) text2B =
            "Ruimschoots is wat anders, maar het is je toch gelukt!"

        let text3A = [`Laten we jouw ${wrappedYear} eens bekijken *in cijfers*.`].random()
        let text3B = ["Blijf scrollen voor cijfers en grafieken.", "Zie nu jouw jaar vanuit een andere invalshoek.", "Vergelijk je statistieken met vrienden!", "Maak een screenshot en deel 'm met vrienden!", "Als je graag meer of andere dingen ziet, laat het me dan weten."].random()

        const section2 = element('div', 'st-wrapped-2', wrapped)

        // Num of events and num of attended lessons
        const tileLessons = element('div', 'st-wrapped-2-lessons', section2, { 'data-hide': true })
        const tileLessonsA = element('div', 'st-wrapped-2-lessons-a', tileLessons)
        element('span', null, tileLessonsA, { class: 'st-metric-huge', innerText: events.length })
        element('span', null, tileLessonsA, { class: 'st-metric-huge-sub', innerText: "agenda-items" })
        const tileLessonsB = element('div', 'st-wrapped-2-lessons-b', tileLessons)
        element('span', null, tileLessonsB, {
            class: 'st-metric-small',
            innerText:
                events.filter(item => item.LesuurVan && item.LesuurTotMet && (item.Type !== 7 || (item.Type === 7 && item.Lokatie?.length > 0)) && !absences.some(absence => absence.AfspraakId === item.Id)).length
        })
        element('span', null, tileLessonsB, { class: 'st-metric-small-sub', innerText: "lessen bijgewoond" })

        // Percentage of absences and num of licit and num of illicit
        const tileAbsences = element('div', 'st-wrapped-2-absences', section2, { 'data-hide': true })
        const tileAbsencesA = element('div', 'st-wrapped-2-absences-a', tileAbsences)
        element('span', null, tileAbsencesA, {
            class: 'st-metric-huge',
            innerText:
                Math.round(events.filter(item => item.LesuurVan && item.LesuurTotMet && (item.Type !== 7 || (item.Type === 7 && item.Lokatie?.length > 0)) && !absences.some(absence => absence.AfspraakId === item.Id)).length / events.filter(item => item.LesuurVan && item.LesuurTotMet && (item.Type !== 7 || (item.Type === 7 && item.Lokatie?.length > 0))).length * 100) + '%'
        })
        element('span', null, tileAbsencesA, { class: 'st-metric-huge-sub', innerText: 'aanwezigheid' })
        const tileAbsencesB = element('div', 'st-wrapped-2-absences-b', tileAbsences)
        element('span', null, tileAbsencesB, { class: 'st-metric-tiny', innerText: absences.filter(item => item.Geoorloofd).length + '×' })
        element('span', null, tileAbsencesB, { class: 'st-metric-tiny-sub', innerText: 'geoorloofd absent' })
        const tileAbsencesC = element('div', 'st-wrapped-2-absences-c', tileAbsences)
        element('span', null, tileAbsencesC, { class: 'st-metric-tiny', innerText: absences.filter(item => !item.Geoorloofd).length + '×' })
        element('span', null, tileAbsencesC, { class: 'st-metric-tiny-sub', innerText: 'ongeoorloofd absent' })

        // Num of grades and num of sufficient and mean and promo
        const tileGrades = element('div', 'st-wrapped-2-grades', section2, { 'data-hide': true })
        const tileGradesA = element('div', 'st-wrapped-2-grades-a', tileGrades)
        element('span', null, tileGradesA, { class: 'st-metric-enormous', innerText: grades.length })
        element('span', null, tileGradesA, { class: 'st-metric-enormous-sub', innerText: "cijfers" })
        const tileGradesB = element('div', 'st-wrapped-2-grades-b', tileGrades)
        element('span', null, tileGradesB, { class: 'st-metric-medium', innerText: gradesMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })
        element('span', null, tileGradesB, { class: 'st-metric-medium-sub', innerText: "gemiddeld cijfer" })
        const tileGradesChart = element('div', 'st-wrapped-2-grades-chart', tileGrades, { class: 'st-force-light' })
        tileGradesChart.createLineChart(grades.map(grade => Number(grade.CijferStr.replace(',', '.'))), grades.map(e => `${new Date(e.DatumIngevoerd || e.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}\n${e.Vak?.Omschrijving || ''}\n${e.CijferKolom?.KolomNaam || e.column}, ${e.CijferKolom?.KolomKop || e.title}`), 1, 10)
        const tileGradesPromo = element('span', 'st-wrapped-2-grades-promo', tileGrades, { class: 'st-metric-large-sub', innerText: "Tip: " })
        element('u', null, tileGradesPromo, { innerText: "Cijfer-\nstatistieken" })
        tileGradesPromo.append(document.createTextNode(" is vernieuwd.\nNeem een kijkje voor meer!"))
        tileGradesPromo.addEventListener('click', async () => { wrapped.close(); window.location.hash = '#/cijfers/cijferoverzicht'; (await awaitElement('#st-cs-tab-link')).click(); })

        const tileAssignments = element('div', 'st-wrapped-2-assignments', section2, { 'data-hide': true })
        const tileAssignmentsA = element('div', 'st-wrapped-2-assignments-a', tileAssignments)
        element('span', null, tileAssignmentsA, { class: 'st-metric-huge', innerText: Math.round(assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) < new Date(item.IngeleverdOp)).length / assignments.length * 100) + '%' })
        element('span', null, tileAssignmentsA, { class: 'st-metric-huge-sub', innerText: "opdrachten op tijd ingeleverd" })
        const tileAssignmentsB = element('div', 'st-wrapped-2-assignments-b', tileAssignments)
        element('span', null, tileAssignmentsB, { class: 'st-metric-tiny', innerText: assignments.length, 'data-desc': "opdrachten" })
        element('span', null, tileAssignmentsB, { class: 'st-metric-tiny', innerText: assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) < new Date(item.IngeleverdOp)).length, 'data-desc': "op tijd" })
        element('span', null, tileAssignmentsB, { class: 'st-metric-tiny', innerText: assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) >= new Date(item.IngeleverdOp)).length, 'data-desc': "te laat" })
        element('span', null, tileAssignmentsB, { class: 'st-metric-tiny', innerText: assignments.filter(item => !item.IngeleverdOp).length, 'data-desc': "geskipt" })

        // Teacher stats 
        const teacherNames = await getFromStorage('start-teacher-names') || await getFromStorage('teacher-names', 'local') || {}
        const eventsTeachers = events.flatMap(item => item.Docenten)
        let teachersFrequencyMap = {}
        eventsTeachers.map(teacher => teacher.Docentcode).forEach(teacherCode => {
            teachersFrequencyMap[teacherCode] ??= 0
            teachersFrequencyMap[teacherCode]++
        })
        let teachersChartArea = element('div', 'st-wrapped-teacher-chart', wrapped, { 'data-hide': true }).createBarChart(teachersFrequencyMap, teacherNames)

        // Classroom stats 
        const eventsClassrooms = events.flatMap(item => item.Lokalen)
        let classroomsFrequencyMap = {}
        eventsClassrooms.map(classroom => classroom.Naam).forEach(classroomName => {
            classroomsFrequencyMap[classroomName] ??= 0
            classroomsFrequencyMap[classroomName]++
        })
        let classroomsChartArea = element('div', 'st-wrapped-classroom-chart', wrapped, { 'data-hide': true }).createBarChart(classroomsFrequencyMap, null)

        // Switch chart type
        viewPie.addEventListener('click', () => {
            viewPie.classList.add('active')
            viewBar.classList.remove('active')

            teachersChartArea.createPieChart(teachersFrequencyMap, teacherNames)
            classroomsChartArea.createPieChart(classroomsFrequencyMap, null)
        })
        viewBar.addEventListener('click', () => {
            viewBar.classList.add('active')
            viewPie.classList.remove('active')

            teachersChartArea.createBarChart(teachersFrequencyMap, teacherNames)
            classroomsChartArea.createBarChart(classroomsFrequencyMap, null)
        })

        displayWrapped()
        function displayWrapped() {
            changeTexts(text1A, text1B)
            wrapped.addEventListener('scroll', (event) => {
                if (event.target.scrollTop == 0) {
                    changeTexts(text1A, text1B)
                } else if (event.target.scrollTop < 275) {
                    changeTexts(`In *${wrappedYear}* ${text2A}.`, text2B)
                } else {
                    changeTexts(text3A, text3B)
                }
            })
            wrapped.querySelectorAll('[data-hide=true]').forEach((e, i) => {
                setTimeout(() => {
                    e.dataset.hide = false
                }, 300 * i)
            })
        }

        function changeTexts(newTitle, newSubtitle) {
            if (currentTitle === newTitle && currentSubtitle === newSubtitle) return
            currentTitle = newTitle
            currentSubtitle = newSubtitle
            section1Text.dataset.transition = true
            section1Sub.dataset.transition = true
            setTimeout(async () => {
                section1Text.innerText = ''
                section1Sub.innerText = newSubtitle
                newTitle.split('*').forEach((segment, i) => {
                    if (i % 2 == 0) {
                        section1Text.append(document.createTextNode(segment))
                    } else {
                        element('em', null, section1Text, { innerText: segment })
                    }
                })

                section1Text.removeAttribute('data-transition')
                section1Sub.removeAttribute('data-transition')
            }, 200)
        }
    })

}