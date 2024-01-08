gamification()

let now = new Date()
const december15 = new Date(now.getFullYear(), 11, 15)
const january22 = new Date(now.getFullYear(), 0, 22)
if (now > december15 || now < january22) {
    wrapped()
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
    let step = 0
    const maxStep = 2

    let opened = false

    const wrappedYear = now < january22 ? (now.getFullYear() - 1) : now.getFullYear()
    let lastAccessYear = await getFromStorage('wrapped-accessed', 'local') || 0

    const firstName = (await awaitElement("#user-menu > figure > img")).alt.split(' ')[0]
    const appbarMetrics = await awaitElement('#st-appbar-metrics')

    const wrappedInvoke = element('button', 'st-wrapped-invoke', appbarMetrics, { title: "Magister Wrapped", innerText: "" })
    appbarMetrics.firstElementChild.before(wrappedInvoke)
    const wrappedInvokeTip = element('div', 'st-wrapped-invoke-tip', document.body, { class: 'hidden', innerText: "Bekijk nu jouw Magister Wrapped!\nBeschikbaar t/m 21 januari." })
    if (lastAccessYear != wrappedYear) setTimeout(() => wrappedInvokeTip.classList.remove('hidden'), 100)
    setTimeout(() => wrappedInvokeTip.classList.add('hidden'), 30000)

    const wrapped = element('dialog', 'st-wrapped', document.body, { class: 'st-overlay st-force-dark', innerText: '' }),
        spinner = element('svg', 'st-wrapped-spinner', wrapped, { innerHTML: '<style>.spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}.spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}@keyframes spinner_zKoa{100%{transform:rotate(360deg)}}@keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}</style><g class="spinner_V8m1"><circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3" /></g>', xmlns: 'http://www.w3.org/2000/svg', width: 64, height: 64, stroke: 'var(--st-foreground-accent)', 'viewBox': '0 0 24 24' })
    wrapped.innerHTML += ''
    const container = element('div', 'st-wrapped-container', wrapped, { 'data-step': step }),
        title = element('span', 'st-wrapped-title', wrapped, { class: 'st-title', innerText: "Magister Wrapped" }),
        buttons = element('div', 'st-wrapped-button-wrapper', wrapped, { class: 'st-button-wrapper' }),
        tip = element('span', 'st-wrapped-tip', wrapped, { innerText: "Klik op een tegel voor meer statistieken." }),
        viewOpts = element('div', 'st-wrapped-view', buttons, { class: 'st-segmented-control', style: 'display: none;' }),
        viewBar = element('button', 'st-wrapped-view-bar', viewOpts, { class: 'st-button segment active', innerText: "Staaf", 'data-icon': '' }),
        viewPie = element('button', 'st-wrapped-view-pie', viewOpts, { class: 'st-button segment', innerText: "Taart", 'data-icon': '' }),
        help = element('button', 'st-wrapped-help', buttons, { class: 'st-button icon', title: "Hulp", 'data-icon': '' }),
        close = element('button', 'st-wrapped-close', buttons, { class: 'st-button', innerText: "Sluiten", 'data-icon': '' })

    close.addEventListener('click', () => wrapped.close())

    help.addEventListener('click', async () => {
        await notify('dialog', "Welkom bij jouw Magister Wrapped!\n\nDeze generieke kloon van het Wrapped-/Rewind-concept zie je sinds eind 2023 elk jaar in jouw Magister terug.\nHij geeft jou een gepersonaliseerde ervaring en zet je in de schijnwerpers door je prestaties van het jaar uit te lichten.\n\nVergelijk je Wrapped vooral met vrienden! Dat maakt mij blij :)")

        await notify('dialog', "Om naar de volgende dia te gaan, klik je op de dia.\nOm een dia terug te gaan, kun je rechtsklikken.\n\nAls je op de tegelweergave uitgebreide statistieken wil zien, klik je op een tegel.\nJe kunt dan ook terugkeren met de rechtermuisknop.")

        await notify(
            'dialog',
            "Magister Wrapped is nog gloednieuw. De hele ervaring is veel te snel in elkaar geflanst, met relatief weinig tests en input.\nFeedback (in de vorm van functionaliteitensuggesties en probleemrapporten) zijn daarom meer dan welkom!\n\nNeem contact met me op in de Discord-server. En deel ook vooral screenshots van jouw Wrapped of klets wat met de andere leden!",
            [
                { innerText: "E-mail verzenden", onclick: `window.open('mailto:quinten@althues.nl')` },
                { innerText: "Discord", onclick: `window.open('https://discord.gg/RVKXKyaS6y')` }
            ])
    })

    wrappedInvoke.addEventListener('click', async () => {
        opened = true
        wrappedInvokeTip.classList.add('hidden')
        wrapped.showModal()

        if (!opened) return displayWrapped()
        container.innerText = ''

        // const accountInfo = await MagisterApi.accountInfo()

        const years = await MagisterApi.years()

        const thisYearShallow = years.find(y => y.begin.includes(wrappedYear))
        const thisYear = thisYearShallow ? await MagisterApi.yearInfo(thisYearShallow) : {}
        const thisYearExam = thisYear.links?.examengegevens ? await MagisterApi.examInfo(thisYearShallow) : {}

        const lastYearShallow = years.find(y => y.einde.includes(wrappedYear))
        const lastYear = lastYearShallow ? await MagisterApi.yearInfo(lastYearShallow) : {}
        const lastYearExam = lastYear.links?.examengegevens ? await MagisterApi.examInfo(lastYearShallow) : {}

        const grades = [...(lastYearShallow ? await MagisterApi.grades.forYear(lastYearShallow) : []), ...(await MagisterApi.grades.forYear(thisYearShallow))]
            .filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.'))) && Number(grade.CijferStr.replace(',', '.')) <= 10 && Number(grade.CijferStr.replace(',', '.')) >= 1 && new Date(grade.DatumIngevoerd) >= new Date(wrappedYear, 0, 1))
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
        const eventsWithRegistration = events.filter(item => item.Type === 7 && item.Lokatie?.length > 0)

        const absences = await MagisterApi.absences.forYear({
            begin: new Date(wrappedYear, 0, 1).toISOString().substring(0, 10),
            einde: new Date(wrappedYear, 11, 31).toISOString().substring(0, 10)
        })

        const assignments = await MagisterApi.assignments.forYear({
            begin: new Date(wrappedYear, 0, 1).toISOString().substring(0, 10),
            einde: new Date(wrappedYear, 11, 31).toISOString().substring(0, 10)
        })

        const teacherNames = await getFromStorage('start-teacher-names') || await getFromStorage('teacher-names', 'local') || {}
        const eventsTeachers = events.filter(item => item.Status !== 5 && item.Lokatie?.length > 0 && item.LesuurVan && item.LesuurTotMet && !absences.some(absence => absence.AfspraakId === item.Id)).flatMap(item => item.Docenten)
        let teachersFrequencyMap = {}
        eventsTeachers.map(teacher => teacher.Docentcode).forEach(teacherCode => {
            teachersFrequencyMap[teacherCode] ??= 0
            teachersFrequencyMap[teacherCode]++
        })
        const mostCommonTeacherCode = (Object.entries(teachersFrequencyMap).sort((a, b) => b[1] - a[1])?.[0])?.[0]

        const eventsClassrooms = events.filter(item => item.Status !== 5 && item.Lokatie?.length > 0 && item.LesuurVan && item.LesuurTotMet && !absences.some(absence => absence.AfspraakId === item.Id)).flatMap(item => item.Lokalen)
        let classroomsFrequencyMap = {}
        eventsClassrooms.map(classroom => classroom.Naam).forEach(classroomName => {
            classroomsFrequencyMap[classroomName] ??= 0
            classroomsFrequencyMap[classroomName]++
        })

        const isFirstYear = !lastYearShallow
        const isFinalYear = thisYearExam && Object.keys(thisYearExam).length > 0 && !thisYearExam.doetVroegtijdig

        let text1A = [`*${wrappedYear}* is alweer ${now < january22 ? '' : 'bijna '}voorbij.`, `Laten we een terugblik werpen op *${wrappedYear}*.`, `Kom meer te weten over *jouw ${wrappedYear}* op Magister.`, `Welkom bij jouw Magister Wrapped, *${firstName}*.`].random()
        if (isFirstYear && Math.random() < 0.5) text1A = [`Dit is jouw *eerste Magister Wrapped*, welkom!`, `Welkom bij Magister Wrapped, *${firstName}*!`].random()
        else if (isFinalYear && Math.random() < 0.5) text1A = [`Dit is jouw *laatste Magister Wrapped*.`, `Fijn dat je je *laatste Magister Wrapped* komt bekijken.`, `*Magister Wrapped* om je laatste schooljaar mee te beginnen.`, `Welkom bij je laatste Magister Wrapped, *${firstName}*!`].random()

        let text1B = ["Klik verder voor inzichten over het afgelopen jaar.", "Neem snel een kijkje en klik verder!", "Fijn dat je er bent, klik verder om te beginnen.", "Klik verder om jouw Magister Wrapped te zien.", "Klik verder om te beginnen."].random()

        const section1 = element('section', 'st-wrapped-1', container, { 'data-step': 0 })
        const section1Wrapper = element('div', 'st-wrapped-1-wrapper', section1)
        const section1Text = element('span', 'st-wrapped-1-title', section1Wrapper).formatAndApplyTitleText(text1A)
        const section1Sub = element('span', 'st-wrapped-1-subtitle', section1Wrapper, { innerText: text1B })

        let text2A
        if (isFirstYear) text2A =
            `In *${wrappedYear}* ging je in ${thisYearShallow.groep.code} van start met *${thisYearShallow.studie.code}*.`
        else if (lastYear.isZittenBlijver) text2A =
            `In *${wrappedYear}* ben je dan eindelijk doorgestroomd naar *${thisYear.studie.code}*`
        else if (isFinalYear) text2A =
            [`In *${wrappedYear}* ben je begonnen aan je *laatste jaar*: ${thisYear.studie.code}`, `In *${wrappedYear}* ging je van start met ${thisYear.studie.code}—je *laatste jaar*`].random()
        else if (thisYear.isZittenBlijver) text2A =
            [`In *${wrappedYear}* besloot jij *${thisYearShallow.studie.code}* nog maar een jaartje te doen`, `In *${wrappedYear}* bleef je helaas zitten in *${thisYearShallow.studie.code}*`].random()
        else if (lastYear.studie.code.includes('1')) text2A =
            [`In *${wrappedYear}* rondde je je eerste jaar op de middelbare af`, `In *2023* verloor je je status als brugpieper`, `In *${wrappedYear}* ben je doorgestroomd naar *${thisYear.studie.code}*`, `In *${wrappedYear}* begon je aan *${thisYear.studie.code}*.`, `In *${wrappedYear}* rondde je *${lastYear.studie.code}* af`].random()
        else text2A =
            [`In *${wrappedYear}* ben je doorgestroomd naar *${thisYear.studie.code}*`, `In *${wrappedYear}* begon je aan *${thisYear.studie.code}*.`, `In *${wrappedYear}* rondde je *${lastYear.studie.code}* af`].random()

        let text2B =
            ["Wat goed! Laten we eens terugkijken op het afgelopen kalenderjaar.", "Gefeliciteerd! Laten we terugblikken op afgelopen jaar."].random()
        if (isFirstYear) text2B =
            "Hoe bevalt het op je nieuwe school?"
        else if (isFinalYear && lastYearExam?.doetVroegtijdig && !lastYear.isZittenBlijver) text2B =
            "Je hebt zelfs al ervaring met het eindexamen. Nu de rest van je vakken nog."
        else if (isFinalYear && gradesMean > 7) text2B =
            "En je cijfers zijn super, dus dit moet goedkomen! Ik heb vertrouwen in je."
        else if (isFinalYear && lastYear.isZittenBlijver) text2B =
            "Ze zeggen dat je het moeilijkste jaar al achter de rug hebt (jij zelfs al twee keer). Jij kunt dit!"
        else if (isFinalYear) text2B =
            ["Ze zeggen dat je het moeilijkste jaar al achter de rug hebt. Dit kun jij!", "Laten we terugkijken op het afgelopen jaar; het allerlaatste jaar voor je centraal examen."].random()
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
            [`En wat een cijfers haalde je in ${wrappedYear}!`, "En je cijfers zijn super, dus dit moet goedkomen! Ik heb vertrouwen in je.", "En dat deed je met vlag en wimpel; wat een mooie cijfers dit jaar!"].random()
        else if (gradesMean < 5.55) text2B =
            "Ruimschoots is wat anders, maar het is je toch gelukt!"

        const section2 = element('section', 'st-wrapped-2', container, { 'data-step': 1 })
        const section2Wrapper = element('div', 'st-wrapped-2-wrapper', section2)
        const section2Text = element('span', 'st-wrapped-2-title', section2Wrapper).formatAndApplyTitleText(text2A)
        const section2Sub = element('span', 'st-wrapped-2-subtitle', section2Wrapper, { innerText: text2B })

        const sectionTiles = element('section', 'st-wrapped-tiles', container, { 'data-step': 2 })

        // Events stats
        const tileLessons = element('button', 'st-wrapped-tiles-lessons', sectionTiles, { class: 'st-wrapped-tile', 'data-module': "Agenda" })
        if (events.length > 0) {
            const tileLessonsA = element('div', 'st-wrapped-tiles-lessons-a', tileLessons)
            element('span', null, tileLessonsA, { class: 'st-metric-huge', innerText: events.length })
            element('span', null, tileLessonsA, { class: 'st-metric-huge-sub', innerText: "agenda-items" })
            const tileLessonsB = element('div', 'st-wrapped-tiles-lessons-b', tileLessons)
            element('span', null, tileLessonsB, {
                class: 'st-metric-tiny',
                innerText:
                    events.filter(item => item.Status !== 5 && item.Lokatie?.length > 0 && item.LesuurVan && item.LesuurTotMet && !absences.some(absence => absence.AfspraakId === item.Id)).length
            })
            element('span', null, tileLessonsB, { class: 'st-metric-tiny-sub', innerText: "lessen bijgewoond" })
            const tileLessonsC = element('div', 'st-wrapped-tiles-lessons-c', tileLessons)
            element('span', null, tileLessonsC, {
                class: 'st-metric-tiny',
                innerText:
                    `${events.filter(item => item.Status === 5).length}×`
            })
            element('span', null, tileLessonsC, { class: 'st-metric-tiny-sub', innerText: "uitval" })
            tileLessons.addEventListener('click', () => {
                moreLessons.dataset.show = true
                tip.innerText = "Klik om terug te keren."
            })

            const moreLessons = element('div', 'st-wrapped-more-lessons', sectionTiles, { class: 'st-wrapped-details', 'data-show': false })
            element('span', null, moreLessons, { class: 'st-metric-large', innerText: events.length })
            element('span', null, moreLessons, { class: 'st-metric-large-sub', innerText: "agenda-items" })
            element('span', null, moreLessons)
            element('span', null, moreLessons)
            element('span', null, moreLessons, { class: 'st-metric-small', innerText: events.filter(item => item.Status !== 5 && item.Lokatie?.length > 0 && item.LesuurVan && item.LesuurTotMet && !absences.some(absence => absence.AfspraakId === item.Id)).length })
            element('span', null, moreLessons, { class: 'st-metric-medium-sub', innerText: "lessen bijgewoond" })
            element('span', null, moreLessons, { class: 'st-metric-small', innerText: events.filter(item => absences.some(absence => absence.AfspraakId === item.Id)).length })
            element('span', null, moreLessons, { class: 'st-metric-medium-sub', innerText: "lessen absent" })
            element('span', null, moreLessons, { class: 'st-metric-small', innerText: events.filter(item => item.Status === 5).length })
            element('span', null, moreLessons, { class: 'st-metric-medium-sub', innerText: "lessen vervallen" })
            element('span', null, moreLessons, { class: 'st-metric-small', innerText: events.filter(item => item.Type === 7 && !(item.Lokatie?.length > 0)).length })
            element('span', null, moreLessons, { class: 'st-metric-medium-sub', innerText: "keuzelessen niet ingeschreven" })
            element('span', null, moreLessons, { class: 'st-metric-small', innerText: events.filter(item => !item.LesuurVan || !item.LesuurTotMet || (item.Type !== 7 && !(item.Lokatie?.length > 0))).length })
            element('span', null, moreLessons, { class: 'st-metric-medium-sub', innerText: "andere afspraken" })
            if (eventsWithRegistration.length > 0) {
                element('div', null, moreLessons)
                element('div', null, moreLessons)
                element('span', null, moreLessons, { class: 'st-metric-tiny', innerText: eventsWithRegistration.length })
                element('span', null, moreLessons, { class: 'st-metric-small-sub', innerText: "keuzelessen ingeschreven" })
                element('span', null, moreLessons, { class: 'st-metric-tiny', innerText: eventsWithRegistration.map(item => item.Omschrijving).mode() || '?' })
                element('span', null, moreLessons, { class: 'st-metric-small-sub', innerText: `vaakst gekozen (${eventsWithRegistration.filter(item => item.Omschrijving === eventsWithRegistration.map(e => e.Omschrijving).mode()).length}×)` })
            }
            moreLessons.addEventListener('click', () => {
                moreLessons.dataset.show = false
                tip.innerText = "Klik op een tegel voor meer statistieken."
            })
            moreLessons.addEventListener('contextmenu', (e) => {
                e.preventDefault()
                e.stopPropagation()
                moreLessons.dataset.show = false
                tip.innerText = "Klik op een tegel voor meer statistieken."
            })
        }

        // Absences stats
        const tileAbsences = element('button', 'st-wrapped-tiles-absences', sectionTiles, { class: 'st-wrapped-tile', 'data-module': "Afwezigheid" })
        if (absences.length > 0) {
            const tileAbsencesA = element('div', 'st-wrapped-tiles-absences-a', tileAbsences)
            element('span', null, tileAbsencesA, {
                class: 'st-metric-huge',
                innerText:
                    Math.round(
                        events.filter(item => item.Status !== 5 && item.Lokatie?.length > 0 && item.LesuurVan && item.LesuurTotMet && !absences.some(absence => absence.AfspraakId === item.Id)).length
                        / events.filter(item => item.Status !== 5 && item.Lokatie?.length > 0 && item.LesuurVan && item.LesuurTotMet).length
                        * 100) + '%'
            })
            element('span', null, tileAbsencesA, { class: 'st-metric-huge-sub', innerText: 'aanwezigheid' })
            const tileAbsencesB = element('div', 'st-wrapped-tiles-absences-b', tileAbsences)
            element('span', null, tileAbsencesB, { class: 'st-metric-tiny', innerText: absences.filter(item => item.Geoorloofd).length + '×' })
            element('span', null, tileAbsencesB, { class: 'st-metric-tiny-sub', innerText: 'geoorloofd absent' })
            const tileAbsencesC = element('div', 'st-wrapped-tiles-absences-c', tileAbsences)
            element('span', null, tileAbsencesC, { class: 'st-metric-tiny', innerText: absences.filter(item => !item.Geoorloofd).length + '×' })
            element('span', null, tileAbsencesC, { class: 'st-metric-tiny-sub', innerText: 'ongeoorloofd absent' })
            tileAbsences.addEventListener('click', () => {
                moreAbsences.dataset.show = true
                tip.innerText = "Klik om terug te keren."
            })

            const moreAbsences = element('div', 'st-wrapped-more-absences', sectionTiles, { class: 'st-wrapped-details', 'data-show': false })
            element('span', null, moreAbsences, { class: 'st-metric-large', innerText: absences.length })
            element('span', null, moreAbsences, { class: 'st-metric-large-sub', innerText: "absenties" })
            element('span', null, moreAbsences)
            element('span', null, moreAbsences)
            const absenceTypes = [...new Set(absences.map(item => (item.Omschrijving.toLowerCase() + (item.Geoorloofd ? ' (geoorloofd)' : ' (ongeoorloofd)'))))]
            absenceTypes.forEach(type => {
                element('span', null, moreAbsences, { class: 'st-metric-small', innerText: absences.filter(item => (item.Omschrijving.toLowerCase() + (item.Geoorloofd ? ' (geoorloofd)' : ' (ongeoorloofd)')) === type).length + '×' })
                element('span', null, moreAbsences, { class: 'st-metric-medium-sub', innerText: type })
            })
            const dayMostOftenTooLate = absences.filter(item => item.Omschrijving.includes('laat')).map(item => new Date(item.Start).toLocaleDateString('nl-NL', { weekday: 'long' }).toLowerCase()).mode()
            const hourMostOftenTooLate = absences.filter(item => item.Omschrijving.includes('laat')).map(item => `lesuur ${item.Afspraak.LesuurVan}`).mode()
            if (dayMostOftenTooLate && hourMostOftenTooLate) {
                element('div', null, moreAbsences)
                element('div', null, moreAbsences)
                element('span', null, moreAbsences, { class: 'st-metric-tiny', innerText: dayMostOftenTooLate })
                element('span', null, moreAbsences, { class: 'st-metric-small-sub', innerText: "vaakst te laat" })
                element('span', null, moreAbsences, { class: 'st-metric-tiny', innerText: hourMostOftenTooLate })
                element('span', null, moreAbsences, { class: 'st-metric-small-sub', innerText: "vaakst te laat" })
            }
            moreAbsences.addEventListener('click', () => {
                moreAbsences.dataset.show = false
                tip.innerText = "Klik op een tegel voor meer statistieken."
            })
            moreAbsences.addEventListener('contextmenu', (e) => {
                e.preventDefault()
                e.stopPropagation()
                moreAbsences.dataset.show = false
                tip.innerText = "Klik op een tegel voor meer statistieken."
            })
        }

        // Grades stats
        const tileGrades = element('button', 'st-wrapped-tiles-grades', sectionTiles, { class: 'st-wrapped-tile', 'data-module': "Cijfers" })
        if (grades.length > 0) {
            const tileGradesA = element('div', 'st-wrapped-tiles-grades-a', tileGrades)
            element('span', null, tileGradesA, { class: 'st-metric-enormous', innerText: grades.length })
            element('span', null, tileGradesA, { class: 'st-metric-enormous-sub', innerText: "cijfers" })
            const tileGradesB = element('div', 'st-wrapped-tiles-grades-b', tileGrades)
            element('span', null, tileGradesB, { class: 'st-metric-medium', innerText: gradesMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })
            element('span', null, tileGradesB, { class: 'st-metric-medium-sub', innerText: "gemiddeld cijfer" })
            const tileGradesChart = element('div', 'st-wrapped-tiles-grades-chart', tileGrades, { class: 'st-force-light' })
            tileGradesChart.createLineChart(grades.map(grade => Number(grade.CijferStr.replace(',', '.'))), grades.map(e => `${new Date(e.DatumIngevoerd || e.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}\n${e.Vak?.Omschrijving || ''}\n${e.CijferKolom?.KolomNaam || e.column}, ${e.CijferKolom?.KolomKop || e.title}`), 1, 10)
            const tileGradesPromo = element('span', 'st-wrapped-tiles-grades-promo', tileGrades, { class: 'st-metric-large-sub', innerText: "Vernieuwd: Cijferstatistieken\n" })
            element('u', null, tileGradesPromo, { innerText: "Nu bekijken" })
            tileGrades.addEventListener('click', async (event) => { event.stopPropagation(); wrapped.close(); window.location.hash = '#/cijfers/cijferoverzicht'; (await awaitElement('#st-cs-tab-link')).click(); })
        }

        // Assignments stats
        const tileAssignments = element('div', 'st-wrapped-tiles-assignments', sectionTiles, { class: 'st-wrapped-tile', 'data-module': "Opdrachten" })
        if (assignments.length > 0) {
            const tileAssignmentsA = element('div', 'st-wrapped-tiles-assignments-a', tileAssignments)
            element('span', null, tileAssignmentsA, { class: 'st-metric-huge', innerText: Math.round(assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) < new Date(item.IngeleverdOp)).length / assignments.length * 100) + '%' })
            element('span', null, tileAssignmentsA, { class: 'st-metric-huge-sub', innerText: "opdrachten op tijd ingeleverd" })
            const tileAssignmentsB = element('div', 'st-wrapped-tiles-assignments-b', tileAssignments)
            element('span', null, tileAssignmentsB, { class: 'st-metric-tiny', innerText: assignments.length, 'data-desc': "opdrachten" })
            element('span', null, tileAssignmentsB, { class: 'st-metric-tiny', innerText: assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) < new Date(item.IngeleverdOp)).length, 'data-desc': "op tijd" })
            element('span', null, tileAssignmentsB, { class: 'st-metric-tiny', innerText: assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) >= new Date(item.IngeleverdOp)).length, 'data-desc': "te laat" })
            element('span', null, tileAssignmentsB, { class: 'st-metric-tiny', innerText: assignments.filter(item => !item.IngeleverdOp).length, 'data-desc': "geskipt" })
        }

        // Classrooms and teachers stats
        const tileTeachers = element('button', 'st-wrapped-tiles-teachers', sectionTiles, { class: 'st-wrapped-tile', 'data-module': "Agenda" })
        if (events.length > 0) {
            const tileTeachersA = element('div', 'st-wrapped-tiles-teachers-a', tileTeachers)
            element('span', null, tileTeachersA, { class: 'st-metric-huge-sub', innerText: "meeste lessen in" })
            element('span', null, tileTeachersA, {
                class: 'st-metric-large',
                innerText: (Object.entries(classroomsFrequencyMap).sort((a, b) => b[1] - a[1])[0])[0]
            })
            element('span', null, tileTeachersA, { class: 'st-metric-tiny-sub', innerText: `${events.filter(item => item.Lokalen.some(d => d.Naam === (Object.entries(classroomsFrequencyMap).sort((a, b) => b[1] - a[1])[0])[0])).length}×, uit ${new Set(eventsClassrooms.map(classroom => classroom.Naam)).size} locaties` })
            const tileTeachersB = element('div', 'st-wrapped-tiles-teachers-b', tileTeachers)
            element('span', null, tileTeachersB, { class: 'st-metric-large-sub', innerText: "meeste lessen van" })
            element('span', null, tileTeachersB, {
                class: 'st-metric-tiny',
                innerText: teacherNames?.[mostCommonTeacherCode] || eventsTeachers.find(e => e.Docentcode === mostCommonTeacherCode).Naam || mostCommonTeacherCode
            })
            element('span', null, tileTeachersB, { class: 'st-metric-tiny-sub', innerText: `${events.filter(item => item.Docenten.some(d => d.Docentcode === mostCommonTeacherCode)).length}×, uit ${new Set(eventsTeachers.map(teacher => teacher.Docentcode)).size} docenten` })
            tileTeachers.addEventListener('click', () => {
                moreTeachers.dataset.show = true
                viewOpts.style.display = 'flex'
                tip.innerText = "Klik om terug te keren."
            })

            const moreTeachers = element('section', 'st-wrapped-more-teachers', sectionTiles, { class: 'st-wrapped-details', 'data-show': false })
            const classroomsChartArea = element('div', 'st-wrapped-more-teachers-chart1', moreTeachers).createBarChart(classroomsFrequencyMap, null, null, true, false)
            const teachersChartArea = element('div', 'st-wrapped-more-teachers-chart2', moreTeachers).createBarChart(teachersFrequencyMap, teacherNames, null, true, false)
            moreTeachers.addEventListener('click', () => {
                moreTeachers.dataset.show = false
                viewOpts.style.display = 'none'
                tip.innerText = "Klik op een tegel voor meer statistieken."
            })
            moreTeachers.addEventListener('contextmenu', (e) => {
                e.preventDefault()
                e.stopPropagation()
                moreTeachers.dataset.show = false
                viewOpts.style.display = 'none'
                tip.innerText = "Klik op een tegel voor meer statistieken."
            })

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

                teachersChartArea.createBarChart(teachersFrequencyMap, teacherNames, null, true, false)
                classroomsChartArea.createBarChart(classroomsFrequencyMap, null, null, true, false)
            })
        }

        displayWrapped()
    })

    function displayWrapped() {
        handleWrappedStep()
        container.classList.add('done')
        lastAccessYear = wrappedYear
        saveToStorage('wrapped-accessed', lastAccessYear, 'local')
    }

    function handleWrappedStep() {
        container.dataset.step = step
        container.querySelectorAll('section').forEach(e => {
            if (Number(e.dataset.step) < step) e.dataset.state = 'past'
            else if (Number(e.dataset.step) > step) e.dataset.state = 'future'
            else e.dataset.state = 'current'
        })
    }

    container.addEventListener('click', () => {
        step = Math.min(Math.max(0, step + 1), maxStep)
        handleWrappedStep()
    })

    container.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        step = Math.min(Math.max(0, step - 1), maxStep)
        handleWrappedStep()
    })

    // Allow for keyboard navigation
    document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' && wrapped.open) {
            step = Math.min(Math.max(0, step - 1), maxStep)
            handleWrappedStep()
        }
        else if (event.key === 'ArrowRight' && wrapped.open) {
            step = Math.min(Math.max(0, step + 1), maxStep)
            handleWrappedStep()
        }
    })

    Element.prototype.formatAndApplyTitleText = function (textWithMarkdown) {
        const elem = this
        elem.innerText = ''
        textWithMarkdown.split('*').forEach((segment, i) => {
            if (i % 2 == 0) {
                elem.append(document.createTextNode(segment))
            } else {
                element('em', null, elem, { innerText: segment })
            }
        })
    }
}