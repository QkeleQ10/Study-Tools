let now = new Date(),
    wrappedYear = now.getFullYear()

const startDate = new Date(now.getFullYear(), 11, 15) // Dec 15
const endDate = new Date(now.getFullYear(), 0, 22) // Jan 22
if (now > startDate || now < endDate) {
    if (now < startDate) wrappedYear--
    wrapped()
}

async function wrapped() {
    let step = 0
    const maxStep = 2

    let opened = false

    let lastAccessYear = await getFromStorage('wrapped-accessed', 'local') || 0

    const firstName = (await awaitElement("#user-menu > figure > img")).alt.split(' ')[0]
    const appbarMetrics = await awaitElement('#st-appbar-metrics')

    const wrappedInvoke = element('button', 'st-wrapped-invoke', appbarMetrics, { title: "Magister Wrapped", innerText: "" })
    appbarMetrics.firstElementChild.before(wrappedInvoke)
    const wrappedInvokeTip = element('div', 'st-wrapped-invoke-tip', document.body, { class: 'hidden', innerText: `Bekijk nu jouw Magister Wrapped!\nBeschikbaar t/m ${endDate.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}.` })
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
            "Magister Wrapped is nog gloednieuw. De hele ervaring is veel te snel in elkaar geflanst, met relatief weinig tests en input.\nFeedback (in de vorm van functionaliteitensuggesties en probleemrapporten) is daarom meer dan welkom!\n\nNeem contact met me op in de Discord-server. En deel ook vooral screenshots van jouw Wrapped of klets wat met de andere leden!",
            [
                { innerText: "E-mail verzenden", onclick: `window.open('mailto:quinten@althues.nl')` },
                { innerText: "Discord", onclick: `window.open('https://discord.gg/2rP7pfeAKf')` }
            ])
    })

    wrappedInvoke.addEventListener('click', async () => {
        opened = true
        wrappedInvokeTip.classList.add('hidden')
        wrapped.showModal()

        if (!opened) return displayWrapped()
        container.innerText = ''

        let seed = cyrb128(firstName)
        let rand = sfc32(seed[0], seed[1], seed[2], seed[3])

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
            .sort((a, b) => new Date(a.DatumIngevoerd) - new Date(b.DatumIngevoerd))
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
        const isFirstProfileYear = (
            (
                thisYear.studie.code.includes('4') &&
                !thisYear.studie.code.toLowerCase().includes('vmbo') &&
                (
                    thisYear.studie.code.toLowerCase().includes('v') ||
                    thisYear.studie.code.toLowerCase().includes('h') ||
                    thisYear.studie.code.toLowerCase().includes('ath')
                )
            ) ||
            (
                thisYear.studie.code.includes('3') &&
                (
                    thisYear.studie.code.includes('tl') ||
                    thisYear.studie.code.includes('vmbo')
                )
            )
        )

        let text1A = [`*${wrappedYear}* is alweer ${now < endDate ? '' : 'bijna '}voorbij.`, `Laten we een terugblik werpen op *${wrappedYear}*.`, `Kom meer te weten over *jouw ${wrappedYear}* op Magister.`, `Welkom bij jouw Magister Wrapped, *${firstName}*.`].random(seed)
        if (isFirstYear && rand() < 0.5) text1A = [`Dit is jouw *eerste Magister Wrapped*, welkom!`, `Welkom bij Magister Wrapped, *${firstName}*!`].random(seed)
        else if (isFinalYear && rand() < 0.5) text1A = [`Dit is jouw *laatste Magister Wrapped*.`, `Fijn dat je je *laatste Magister Wrapped* komt bekijken.`, `*Magister Wrapped* om je laatste schooljaar mee te beginnen.`, `Welkom bij je laatste Magister Wrapped, *${firstName}*!`].random(seed)

        let text1B = ["Klik verder voor inzichten over het afgelopen jaar.", "Neem snel een kijkje en klik verder!", "Fijn dat je er bent, klik verder om te beginnen.", "Klik verder om jouw Magister Wrapped te zien.", "Klik verder om te beginnen."].random(seed)

        const section1 = element('section', 'st-wrapped-1', container, { 'data-step': 0 })
        const section1Wrapper = element('div', 'st-wrapped-1-wrapper', section1)
        const section1Text = element('span', 'st-wrapped-1-title', section1Wrapper).formatAndApplyTitleText(text1A)
        const section1Sub = element('span', 'st-wrapped-1-subtitle', section1Wrapper, { innerText: text1B })

        let text2A
        if (isFirstYear) text2A =
            `In *${wrappedYear}* ging je in ${thisYearShallow.groep.code} van start met *${thisYearShallow.studie.code}*.`
        else if (lastYear.isZittenBlijver) text2A =
            [`In *${wrappedYear}* ben je dan eindelijk doorgestroomd naar *${thisYear.studie.code}*`, `In *${wrappedYear}* heb je je tweede poging tot *${lastYear.studie.code}* afgerond`, `In *${wrappedYear}* ben je wél doorgestroomd naar *${thisYear.studie.code}* afgerond`]
        else if (isFinalYear) text2A =
            [`In *${wrappedYear}* ben je begonnen aan je *laatste jaar*: ${thisYear.studie.code}`, `In *${wrappedYear}* ging je van start met ${thisYear.studie.code}—je *laatste jaar*`].random(seed)
        else if (thisYear.isZittenBlijver) text2A =
            [`In *${wrappedYear}* besloot jij *${thisYearShallow.studie.code}* nog maar een jaartje te doen`, `In *${wrappedYear}* bleef je helaas zitten in *${thisYearShallow.studie.code}*`].random(seed)
        else if (lastYear.studie.code.includes('1')) text2A =
            [`In *${wrappedYear}* rondde je je eerste jaar op de middelbare af`, `In *2023* verloor je je status als brugpieper`, `In *${wrappedYear}* ben je doorgestroomd naar *${thisYear.studie.code}*`, `In *${wrappedYear}* begon je aan *${thisYear.studie.code}*.`, `In *${wrappedYear}* rondde je *${lastYear.studie.code}* af`].random(seed)
        else text2A =
            [`In *${wrappedYear}* ben je doorgestroomd naar *${thisYear.studie.code}*`, `In *${wrappedYear}* begon je aan *${thisYear.studie.code}*.`, `In *${wrappedYear}* rondde je *${lastYear.studie.code}* af`].random(seed)

        let text2B =
            ["Wat goed! Laten we eens terugkijken op het afgelopen kalenderjaar.", "Gefeliciteerd! Laten we terugblikken op afgelopen jaar."].random(seed)
        if (isFirstYear) text2B =
            "Hoe bevalt het op je nieuwe school?"
        else if (isFinalYear && lastYearExam?.doetVroegtijdig && !lastYear.isZittenBlijver) text2B =
            "Je hebt zelfs al ervaring met het eindexamen. Nu de rest van je vakken nog."
        else if (isFinalYear && gradesMean > 7) text2B =
            ["En je cijfers zijn super, dus dit moet goedkomen! Ik heb vertrouwen in je.", `En wat een cijfers haalde je in ${wrappedYear}!`, "En je cijfers zijn super, dus dit moet goedkomen! Ik heb vertrouwen in je.", "En dat deed je met vlag en wimpel; wat een mooie cijfers dit jaar!"].random(seed)
        else if (isFinalYear && lastYear.isZittenBlijver) text2B =
            "Ze zeggen dat je het moeilijkste jaar al achter de rug hebt (jij zelfs al twee keer). Jij kunt dit!"
        else if (isFinalYear) text2B =
            ["Ze zeggen dat je het moeilijkste jaar al achter de rug hebt. Dit kun jij!", "Laten we terugkijken op het afgelopen jaar; het allerlaatste jaar voor je centraal examen.", "Laten we eens terugkijken op het afgelopen kalenderjaar.", "Laten we terugblikken op afgelopen jaar."].random(seed)
        else if (thisYear.isZittenBlijver && thisYearExam.doetVroegtijdig) text2B =
            [`En dat is helemaal oké! Je gaat in ${wrappedYear + 1} gelukkig al vervroegd examen doen.`, "Wel heb je besloten vervroegd examen te doen volgend jaar. Wat fijn!", "Laten we eens terugkijken op het afgelopen kalenderjaar.", "Laten we terugblikken op afgelopen jaar."].random(seed)
        else if (thisYear.isZittenBlijver) text2B =
            ["En dat is helemaal oké! Je bent zeker niet de enige. Neem rustig de tijd.", "Laten we eens terugkijken op het afgelopen kalenderjaar.", "Laten we terugblikken op afgelopen jaar."].random(seed)
        else if (isFirstProfileYear) text2B =
            ["Je hebt ook een belangrijke keuze achter de rug. Was het de juiste?", "In dit jaar begon je ook met je eigen vakkenpakket.", "Ook heb je een profielkeuze gemaakt. Hoe bevalt dat?"].random(seed)
        else if (lastYear.isZittenBlijver && gradesMean > 7) text2B =
            ["En dat deed je met vlag en wimpel; wat heb je je cijfers verhoogd!", "Je hebt het roer helemaal omgegooid dit jaar. Wat een prachtige cijfers!"].random(seed)
        else if (gradesMean > 7) text2B =
            [`En wat een cijfers haalde je in ${wrappedYear}!`, "En je cijfers zijn super, dus dit moet goedkomen! Ik heb vertrouwen in je.", "En dat deed je met vlag en wimpel; wat een mooie cijfers dit jaar!"].random(seed)
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
            const dayMostOftenTooLate = absences.filter(item => item.Omschrijving.includes('laat')).map(item => new Date(item.Start).toLocaleDateString(locale, { weekday: 'long' }).toLowerCase()).mode()
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
            element('span', null, tileGradesB, { class: 'st-metric-medium', innerText: gradesMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })
            element('span', null, tileGradesB, { class: 'st-metric-medium-sub', innerText: "gemiddeld cijfer" })
            const tileGradesChart = element('div', 'st-wrapped-tiles-grades-chart', tileGrades, { class: 'st-force-light' })
            tileGradesChart.createLineChart(grades.map(grade => Number(grade.CijferStr.replace(',', '.'))), grades.map(e => `${new Date(e.DatumIngevoerd || e.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}\n${e.Vak?.Omschrijving || ''}\n${e.CijferKolom?.KolomNaam || e.column}, ${e.CijferKolom?.KolomKop || e.title}`), 1, 10)
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