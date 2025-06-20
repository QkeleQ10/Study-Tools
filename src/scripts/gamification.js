let now = new Date()
let user = {}
let years = []
let wrappedPage = 0

const range1 = { start: new Date(now.getFullYear() + '-06-12 16:00'), end: new Date(now.getFullYear() + '-09-23 00:00') } // June 12 - September 22
const range2 = { start: new Date(now.getFullYear() + '-06-27 00:00'), end: new Date(now.getFullYear() + '-09-23 00:00') } // June 27 - September 22
const range3 = { start: new Date(now.getFullYear() + '-07-04 00:00'), end: new Date(now.getFullYear() + '-09-23 00:00') } // July  4 - September 22
const isInRange = (range) => now >= range.start && now <= range.end;
// vakantie N: 12 juli t/m 24 augustus 2025
// vakantie M: 19 juli t/m 31 augustus 2025
// vakantie Z: 5 juli t/m 17 augustus 2025

const gradients = ['linear-gradient(to right, #485563, #29323c)', 'linear-gradient(105deg, #485596, #29326A)', 'linear-gradient(105deg, #775596, #55326A)', 'linear-gradient(105deg, rgb(150,85,128), rgb(106,50,95))', 'linear-gradient(105deg, rgb(150,85,99), rgb(106,50,50))', 'linear-gradient(105deg, rgb(150,110,85), rgb(106,75,50))', 'linear-gradient(105deg, rgb(150,138,85), rgb(106,99,70))', 'linear-gradient(105deg, rgb(134,150,85), rgb(91,106,50))', 'linear-gradient(105deg, rgb(106,150,85), rgb(59,106,50))', 'linear-gradient(105deg, rgb(72,130,90), rgb(46,96,62))', 'linear-gradient(105deg, rgb(85,150,129), rgb(50,106,97))', 'linear-gradient(105deg, rgb(85,139,150), rgb(50,92,106))', 'linear-gradient(105deg, rgb(85,117,150), rgb(50,73,106))', 'linear-gradient(105deg, rgb(85,97,150), rgb(50,51,106))', 'linear-gradient(105deg, rgb(120,160,160), rgb(50,99,96))', 'linear-gradient(105deg, rgb(154,140,80), rgb(110,106,60))']

checkWrapped();

async function checkWrapped() {
    if ((now >= range1.start && now <= range1.end)) {

        user = await magisterApi.accountInfo()

        years = (await magisterApi.years())
            .filter(year => Number(year.einde.split('-')[0]) <= now.getFullYear()) // Filter years to not include the upcoming school year
            .sort((a, b) => new Date(a.begin) - new Date(b.begin))

        let examInfo = {}
        let recentGrades = []

        if (magisterApi.permissions.includes('ExamenTijdvak'))
            try {
                examInfo = await magisterApi.examsInfo(years.at(-1));
                years[years.length - 1].examInfo = examInfo;
            } catch (error) {
            }

        if (magisterApi.permissions.includes('Cijfers'))
            try {
                recentGrades = await magisterApi.gradesRecent();
            } catch (error) {
            }

        // Determine if Wrapped should be shown

        if (examInfo && Object.keys(examInfo).length > 0 && !examInfo.doetVroegtijdig && isInRange(range1)) {
            // Final year student after exams in range1
            commenceWrapped(true);
        } else if (isInRange(range2) && recentGrades?.length > 0) {
            // Any student with grades in range2
            commenceWrapped(false);
        } else if (isInRange(range3)) {
            // Any student in range3
            commenceWrapped(false);
        }
    }

    let pressedKeys = [], konamiCode = "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,KeyB,KeyA";
    window.addEventListener("keydown", function (e) {
        pressedKeys.push(e.code);
        if (pressedKeys.toString().indexOf(konamiCode) >= 0) {
            console.log("Konami code activated");
            pressedKeys = [];
            commenceWrapped(true);
        }
    }, true);
}

async function commenceWrapped(isFinalYearStudent) {
    let lastAccessYear = await getFromStorage('wrapped-accessed', 'local') || 0
    let used = false

    const appbarMetrics = await awaitElement('#st-appbar-metrics')

    const wrappedInvoke = element('button', 'st-wrapped-invoke', appbarMetrics, { title: "Study Tools Wrapped", innerText: "" })
    appbarMetrics.firstElementChild.before(wrappedInvoke)
    const endDateString = new Date(`${now.getFullYear()}-${range1.end.getMonth() + 1}-${range1.end.getDate() - 1}`).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
    const wrappedInvokeTip = element('div', 'st-wrapped-invoke-tip', document.body, { class: 'hidden', innerText: `Study Tools Wrapped is terug!\nBeschikbaar t/m ${endDateString}.` })
    if (lastAccessYear !== now.getFullYear()) setTimeout(() => wrappedInvokeTip.classList.remove('hidden'), 100)
    setTimeout(() => wrappedInvokeTip.classList.add('hidden'), 30000)

    wrappedInvoke.addEventListener('click', async () => {
        if (wrappedInvoke.classList.contains('spinning')) return

        wrappedInvoke.innerText = ''
        wrappedInvoke.classList.add('spinning')

        let promiseArray = [constructWrapped(!isFinalYearStudent)]
        if ((now < range2.start) && !used) promiseArray.push(notify('dialog', "Je hebt toegang tot een voorproefje van Study Tools Wrapped. Er kan nog het één en ander veranderen.\n\nVergeet niet het overzicht van álle leerjaren aan het eind te bekijken!", null, null, { closeIcon: '', closeText: "Begrepen" }))

        const [wrappedDialog] = await Promise.all(promiseArray)

        wrappedInvoke.innerText = ''
        wrappedInvoke.classList.remove('spinning')

        wrappedDialog.showModal()

        if (wrappedPage === 0) {
            wrappedDialog.scrollLeft = 0
        }

        lastAccessYear = now.getFullYear()
        saveToStorage('wrapped-accessed', lastAccessYear, 'local')

        used = true
    })

}

async function constructWrapped(lastYearOnly) {
    return new Promise(async (resolve) => {

        if (document.getElementById('st-wrapped')) {
            resolve(document.getElementById('st-wrapped'))
            return
        }

        const dialog = element('dialog', 'st-wrapped', document.body, { class: 'st-modal' })
        const yearsWrapper = element('div', 'st-wrapped-years-wrapper', dialog)

        if (lastYearOnly) {
            years = [years.at(-1)]
        }

        for (let i = 0; i < years.length; i++) {
            const newElement = await constructWrappedForYear(i)
            yearsWrapper.append(newElement)
        }

        if (!lastYearOnly) {
            const newElement = await constructWrappedForYear(years.length)
            yearsWrapper.append(newElement)

            const previousButton = element('button', 'st-wrapped-prev', dialog, { class: 'st-button icon', 'data-icon': '', disabled: true })
            previousButton.addEventListener('click', () => {
                wrappedPage = Math.max(wrappedPage - 1, 0)
                document.querySelector(`.st-wrapped-year:nth-child(${wrappedPage + 1})`).scrollIntoView({ inline: 'start', behavior: 'smooth' })
                nextButton.disabled = wrappedPage === years.length - 1
                previousButton.disabled = wrappedPage === 0
            })
            const nextButton = element('button', 'st-wrapped-next', dialog, { class: 'st-button icon', 'data-icon': '' })
            nextButton.addEventListener('click', () => {
                wrappedPage = Math.min(wrappedPage + 1, years.length)
                document.querySelector(`.st-wrapped-year:nth-child(${wrappedPage + 1})`).scrollIntoView({ inline: 'start', behavior: 'smooth' })
                nextButton.disabled = wrappedPage === years.length - 1
                previousButton.disabled = wrappedPage === 0
            })
        }

        const escButton = element('button', 'st-wrapped-esc', dialog, { class: 'st-button icon', 'data-icon': '' })
        escButton.addEventListener('click', () => {
            dialog.close()
        })

        const infoButton = element('button', 'st-wrapped-info', dialog, { class: 'st-button icon', 'data-icon': '' })
        infoButton.addEventListener('click', async () => {
            await notify('dialog', "Welkom bij jouw Study Tools Wrapped!\n\nDeze samenvatting van het afgelopen jaar zie je aan het eind/begin van elk schooljaar in jouw Magister terug.\nHij geeft jou een gepersonaliseerde ervaring en zet je in de schijnwerpers door je prestaties van het jaar uit te lichten.\n\nVergelijk je Wrapped vooral met vrienden! Dat maakt mij blij :)", null, null, { index: 1, length: 3 })

            await notify('dialog', "Als je op bepaalde tegels klikt, krijg je meer informatie. \nExamenleerlingen kunnen door de verschillende leerjaren bladeren en zelfs een totaalplaatje zien.", null, null, { index: 2, length: 3 })

            await notify(
                'dialog',
                "Study Tools Wrapped is nog gloednieuw. De hele ervaring is veel te snel in elkaar geflanst, met relatief weinig tests en input.\nFeedback (in de vorm van suggesties en probleemrapporten) is daarom meer dan welkom!\n\nNeem contact met me op in de Discord-server. En deel ook vooral screenshots van jouw Wrapped of klets wat met de andere leden!",
                [
                    { innerText: "Discord", onclick: `window.open('https://discord.gg/2rP7pfeAKf')` },
                    { innerText: "PayPal", onclick: `window.open('https://paypal.me/QkeleQ10')` }
                ], null, { index: 3, length: 3 })
        })

        resolve(dialog)

        async function constructWrappedForYear(i) {
            return new Promise(async (resolveYear) => {
                let year = JSON.parse(JSON.stringify((i === years.length ? {} : years[i]) || {}))

                let seed = cyrb128((year.groep?.code + year.lesperiode?.code) || (user.Persoon.Roepnaam + i))
                let rand = sfc32(seed[0], seed[1], seed[2], seed[3])

                const yearElement = element('div', null, null, { class: 'st-wrapped-year', style: `--gradient: ${gradients.random(seed)} ; --pattern: url('https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/decorations/wrapped/${i === years.length ? 'a' : year.studie.code.match(/\d/gi)?.[0]}.svg')` })
                const yearTitleText = i === years.length ? "Study Tools Wrapped: alle leerjaren" : `Study Tools Wrapped: ${formatOrdinals(year.studie.code.match(/\d/gi)?.[0], true)} klas`
                const yearTitle = element('span', null, yearElement, { class: 'st-wrapped-year-title', innerText: yearTitleText })
                let cards = []

                yearTitle.addEventListener('click', () => {
                    yearTitle.innerText = `Study Tools Wrapped: ${year.groep?.omschrijving || '?'}`
                    setTimeout(() => {
                        yearTitle.innerText = yearTitleText
                    }, 2000)
                })

                yearTitle.addEventListener('dblclick', () => {
                    yearElement.style.setProperty('--gradient', gradients.random())
                })

                if (i === years.length) {
                    year.grades = years.filter(y => y.grades?.length).flatMap(y => y.grades)
                        .filter((grade, index, self) =>
                            index === self.findIndex((g) =>
                                g?.CijferKolom?.KolomKop === grade.CijferKolom.KolomKop &&
                                g?.CijferKolom?.KolomNaam === grade.CijferKolom.KolomNaam &&
                                g?.CijferStr === grade.CijferStr
                            )
                        )
                    year.events = years.filter(y => y.events?.length).flatMap(y => y.events)
                    year.absences = years.filter(y => y.absences?.length).flatMap(y => y.absences)
                    year.assignments = years.filter(y => y.assignments?.length).flatMap(y => y.assignments)
                } else {
                    if (magisterApi.permissions.includes('ExamenTijdvak'))
                        try {
                            if ((years.length - i) <= 2) year.examInfo ??= await magisterApi.examsInfo(year) || null
                            if ((years.length - i) <= 2) year.exams = await magisterApi.examsList(year) || []
                        } catch (error) { year.examInfo = null; year.exams = [] }
                    if (magisterApi.permissions.includes('Cijfers'))
                        try {
                            year.grades = (await magisterApi.gradesForYear(year) || [])
                                .filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.'))) && (Number(grade.CijferStr.replace(',', '.')) <= 10) && (Number(grade.CijferStr.replace(',', '.')) >= 1))
                                .filter((grade, index, self) =>
                                    index === self.findIndex((g) =>
                                        g?.CijferKolom?.KolomKop === grade.CijferKolom.KolomKop &&
                                        g?.CijferKolom?.KolomNaam === grade.CijferKolom.KolomNaam &&
                                        g?.CijferStr === grade.CijferStr
                                    )
                                )
                                .sort((a, b) => new Date(a.DatumIngevoerd) - new Date(b.DatumIngevoerd))
                        } catch (error) { year.grades = [] }
                    if (magisterApi.permissions.includes('Afspraken'))
                        try {
                            year.events = (await magisterApi.events(new Date(year.begin), new Date(year.einde))).filter(event => !event.Omschrijving.includes('DrumWorks')) || []
                        } catch (error) { year.events = [] }
                    if (magisterApi.permissions.includes('Absenties'))
                        try {
                            year.absences = await magisterApi.absencesForYear(year) || []
                        } catch (error) { year.absences = [] }
                    if (magisterApi.permissions.includes('EloOpdracht'))
                        try {
                            year.assignments = await magisterApi.assignmentsForYear(year) || []
                        } catch (error) { year.assignments = [] }
                }

                years[i] = year

                const teacherNames = await getFromStorage('start-teacher-names') || await getFromStorage('teacher-names', 'local') || {}

                if (year.examInfo && Object.keys(year.examInfo).length > 0) {
                    if (year.exams?.length > 0) {
                        const card = element('div', null, null, { class: 'st-wrapped-card', style: 'grid-row: span 5;', 'data-icon': '' })
                        element('span', null, card, { class: 'st-w-text', innerText: `Dit jaar deed je ${year.examInfo.doetVroegtijdig ? 'vroegtijdig ' : ''}examen in ${year.exams.length > 1 ? (year.exams.length + ' vakken') : year.exams[0]?.omschrijving}.` })
                        let examLocationHashmap = {}
                        year.exams.map(exam => exam.lokalen?.[0]?.omschrijving).forEach(location => {
                            examLocationHashmap[location] ??= 0
                            examLocationHashmap[location]++
                        })
                        const mostCommonExamLocation = (Object.entries(examLocationHashmap).sort((a, b) => b[1] - a[1])?.[0])
                        if (year.exams.length > 1) element('span', null, card, { class: 'st-w-text-small', innerText: (mostCommonExamLocation[1] === year.exams.length ? 'Je maakte al je examens in ' : mostCommonExamLocation[1] + ' van je examens maakte je in ') + (mostCommonExamLocation[0] === 'Sporthal' ? 'de gymzaal' : mostCommonExamLocation[0]) + '.' })
                        cards.push(card)
                    } else {
                        const card = element('div', null, null, { class: 'st-wrapped-card', style: 'grid-row: span 4;', 'data-icon': '' })
                        element('span', null, card, { class: 'st-w-text', innerText: `Dit jaar deed je ${year.examInfo.doetVroegtijdig ? 'vroegtijdig ' : ''}examen.` })
                        cards.push(card)
                    }
                }

                if (year.grades?.length > 0) {
                    const card1 = element('div', null, null, { class: 'st-wrapped-card', style: 'grid-row: span 7; grid-column: span 2;', innerText: `${year.grades.length} cijfers`, 'data-icon': '' })
                    element('div', `st-wrapped-graph-${i}`, card1, { class: 'st-w-grade-chart st-force-light', style: `--suf-threshold-p: ${(1 - ((Number(syncedStorage['suf-threshold']) - 1) / 9)) * 100}%` })
                        .createLineChart(
                            year.grades
                                .map(grade => Number(grade.CijferStr?.replace(',', '.'))),
                            year.grades
                                .map(grade => `${new Date(grade.DatumIngevoerd).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}\n${grade.Vak?.Omschrijving || ''}\n${grade.CijferKolom?.KolomNaam}, ${grade.CijferKolom?.KolomKop}`),
                            1,
                            10,
                            true
                        )
                    cards.push(card1)

                    const card2 = element('div', null, null, { class: 'st-wrapped-card grid external-link', style: 'grid-row: span 4; grid-template-rows: auto auto; grid-template-columns: 5fr auto 4fr; padding-inline: 16px;', 'data-icon': '' })
                    element('div', null, card2, { class: 'st-w-text-small', innerText: 'gemiddeld cijfer', style: 'grid-row: 1; grid-column: 1;' })
                    element('div', null, card2, { class: 'st-w-metric', innerText: calculateMean(year.grades.map(grade => Number(grade.CijferStr?.replace(',', '.')))).toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 }), style: 'grid-row: 2; grid-column: 1;' })
                    element('div', null, card2, { class: 'st-w-line-vertical', style: 'grid-row: 1 / -1; grid-column: 2;' })
                    element('div', null, card2, { class: 'st-w-text-tiny', innerText: Number(syncedStorage['suf-threshold']) === 5.5 ? 'voldoendes' : `voldoendes (≥ ${Number(syncedStorage['suf-threshold']).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })})`, style: 'grid-row: 1; grid-column: 3;' })
                    element('div', null, card2, { class: 'st-w-metric-med', innerText: (year.grades.filter(grade => { return Number(grade.CijferStr?.replace(',', '.')) >= Number(syncedStorage['suf-threshold']) }).length / year.grades.length * 100).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '%', style: 'grid-row: 2; grid-column: 3;' })
                    card2.addEventListener('click', async (event) => { event.stopPropagation(); dialog.close(); window.location.hash = '#/cijfers/cijferoverzicht'; (await awaitElement('#st-cs-tab-link')).click(); })
                    cards.push(card2)
                }

                if (year.events?.length > 0) {
                    const normalLessons = year.events.filter(event => event.LesuurVan && event.LesuurTotMet && event.Status !== 5 && event.Lokatie?.length > 0 && event.Omschrijving != 'amablok_bb')
                    const attendedLessons = normalLessons
                        .filter(event => !year.absences || !year.absences?.some(absence => absence.AfspraakId === event.Id))
                    const msAttended = attendedLessons
                        .reduce((accumulator, event) => accumulator + (new Date(event.Einde) - new Date(event.Start)), 0)
                    const kwtLessons = year.events.filter(event => event.Type === 7)
                    const kwtLessonsSignedUp = kwtLessons.filter(event => event.Lokatie?.length > 0 && event.Omschrijving?.length > 0)

                    {
                        const card1 = element('div', null, null, { class: 'st-wrapped-card interactable', style: 'grid-row: span 6;', 'data-icon': '' })
                        element('span', null, card1, { class: 'st-w-metric', innerText: year.events.length })
                        element('span', null, card1, { class: 'st-w-text', innerText: 'agenda-items' })

                        const slides = [`Waarvan ${normalLessons.length} gewone lesuren.`, `Waarvan er ${year.events.filter(item => item.Status === 5).length} uitvielen.`, `Waarvan je er bij ${year.events.filter(item => year.absences.some(absence => absence.AfspraakId === item.Id)).length} afwezig was.`]
                        if ((kwtLessons.length - kwtLessonsSignedUp.length) > 0) slides.push(`Waarvan ${kwtLessons.length - kwtLessonsSignedUp.length} niet ingeschreven.`)
                        let n = 0
                        const slideText = element('span', null, card1, { class: 'st-w-text-small', innerText: slides[n] })
                        card1.dataset.pages = slides.length
                        card1.dataset.page = n + 1
                        card1.addEventListener('click', () => {
                            n = (n + 1) % slides.length
                            card1.dataset.page = n + 1
                            slideText.innerText = slides[n]
                        })
                        cards.push(card1)
                    }

                    {
                        const card2 = element('div', null, null, { class: 'st-wrapped-card interactable', style: 'grid-row: span 6;', 'data-icon': '', 'data-page': 1, 'data-pages': 4 })
                        let n = 0
                        let eventSubjectHashmap = {}
                        year.events.filter(event => event.Vakken?.[0]?.Naam?.length > 0).map(event => event.Vakken?.[0]?.Naam.replace(/(e taal)$/gi, '')).forEach(subject => {
                            eventSubjectHashmap[subject] ??= 0
                            eventSubjectHashmap[subject]++
                        })
                        const mostCommonEventSubject = (Object.entries(eventSubjectHashmap).sort((a, b) => b[1] - a[1])?.[0])
                        let el1 = element('span', null, card2, { class: 'st-w-text-small', innerText: `De meeste van je blokken waren ${mostCommonEventSubject[0]} (${mostCommonEventSubject[1]}×).` })
                        cards.push(card2)
                        let eventLocationHashmap = {}
                        year.events.filter(event => event.Lokalen?.[0]?.Naam?.length > 0 || event.Lokatie?.length > 0).map(event => event.Lokalen?.[0]?.Naam || event.Lokatie).forEach(location => {
                            eventLocationHashmap[location] ??= 0
                            eventLocationHashmap[location]++
                        })
                        const mostCommonEventLocation = (Object.entries(eventLocationHashmap).sort((a, b) => b[1] - a[1])?.[0])
                        let el2 = element('span', null, card2, { class: 'st-w-text-small', innerText: `Je had de meeste lessen in ${mostCommonEventLocation[0]} (${mostCommonEventLocation[1]}×)` })
                        let eventTeacherHashmap = {}
                        year.events.filter(event => event.Docenten?.[0]?.Docentcode?.length > 0).map(event => teacherNames[event.Docenten?.[0]?.Docentcode] || event.Docenten?.[0]?.Naam || event.Docenten?.[0]?.Docentcode).forEach(teacher => {
                            eventTeacherHashmap[teacher] ??= 0
                            eventTeacherHashmap[teacher]++
                        })
                        const mostCommonEventTeacher = (Object.entries(eventTeacherHashmap).sort((a, b) => b[1] - a[1])?.[0])
                        let el3 = element('span', null, card2, { class: 'st-w-text-small', innerText: `en het vaakst van ${mostCommonEventTeacher[0]} (${mostCommonEventTeacher[1]}×).` })
                        cards.push(card2)

                        let el4 = element('div', `st-wrapped-graph-${i}-4`, card2, { class: 'st-w-bar-chart st-force-light', style: 'position: absolute; padding-inline: 12px; padding-top: 48px; inset: 0; visibility: hidden;' })
                            .createBarChart(eventSubjectHashmap, null, 1, true, false, false, 15)

                        let el5 = element('div', `st-wrapped-graph-${i}-2`, card2, { class: 'st-w-bar-chart st-force-light', style: 'position: absolute; padding-inline: 12px; padding-top: 48px; inset: 0; visibility: hidden;' })
                            .createBarChart(eventLocationHashmap, null, 1, true, false, false, 15)

                        let el6 = element('div', `st-wrapped-graph-${i}-3`, card2, { class: 'st-w-bar-chart st-force-light', style: 'position: absolute; padding-inline: 12px; padding-top: 48px; inset: 0; visibility: hidden;' })
                            .createBarChart(eventTeacherHashmap, null, 1, true, false, false, 15)

                        card2.addEventListener('click', () => {
                            n = (n + 1) % 4
                            card2.dataset.page = n + 1
                            el1.style.visibility = n === 0 ? 'visible' : 'hidden'
                            el2.style.visibility = n === 0 ? 'visible' : 'hidden'
                            el3.style.visibility = n === 0 ? 'visible' : 'hidden'
                            el4.style.visibility = n === 1 ? 'visible' : 'hidden'
                            el5.style.visibility = n === 2 ? 'visible' : 'hidden'
                            el6.style.visibility = n === 3 ? 'visible' : 'hidden'
                        })
                    }

                    if (kwtLessons.length > 0) {
                        const card3 = element('div', null, null, { class: 'st-wrapped-card', style: 'grid-row: span 4;', 'data-icon': '' })
                        element('span', null, card3, { class: 'st-w-text', innerText: `Je volgde ${kwtLessonsSignedUp?.length} keuzeblokken.` })
                        let kwtSubjectHashmap = {}
                        kwtLessonsSignedUp?.map(event => event.Omschrijving)?.forEach(description => {
                            kwtSubjectHashmap[description] ??= 0
                            kwtSubjectHashmap[description]++
                        }) || []
                        const mostCommonKwtSubject = (Object.entries(kwtSubjectHashmap)?.sort((a, b) => b[1] - a[1])?.[0])
                        if (mostCommonKwtSubject) element('span', null, card3, { class: 'st-w-text-small', innerText: `Daarvan koos je ${mostCommonKwtSubject?.[1]}× voor ${mostCommonKwtSubject?.[0]}.` })
                        if (kwtLessons.some(event => event.Omschrijving.includes('amablok') || event.Omschrijving.includes('ama_'))) {
                            element('span', null, card3, { class: 'st-w-text-small', innerText: `Je volgde ${kwtLessonsSignedUp.filter(event => event.Omschrijving.includes('ama_')).length} van de ${kwtLessons.filter(event => event.Omschrijving.includes('amablok') || event.Omschrijving.includes('ama_')).length} Amadeusblokken.` })
                            card3.style.gridRow = 'span 5'
                        }
                        cards.push(card3)
                    }

                    if (year.absences) {
                        const absencesIllicit = year.absences.filter(item => !item.Geoorloofd)
                        const absenceTypes = [...new Set(year.absences.map(item => (item.Omschrijving.toLowerCase() + (item.Geoorloofd ? ' (geoorloofd)' : ' (ongeoorloofd)'))))]

                        const card4 = element('div', null, null, { class: 'st-wrapped-card interactable', style: 'grid-row: span 6;', 'data-icon': '' })
                        element('span', null, card4, {
                            class: 'st-w-metric', innerText: `${Math.round(attendedLessons.length / normalLessons.length * 100)}%`
                        })
                        element('span', null, card4, { class: 'st-w-text', innerText: `aanwezigheid` })

                        const slides = [`Je had ${year.absences.length} absenties, \nwaarvan ${absencesIllicit.length} ongeoorloofd`, ...absenceTypes.map(type => `Je was ${year.absences.filter(item => (item.Omschrijving.toLowerCase() + (item.Geoorloofd ? ' (geoorloofd)' : ' (ongeoorloofd)')) === type).length}× absent vanwege: \n${type} `)]
                        let n = 0
                        const slideText = element('span', null, card4, { class: 'st-w-text-small', innerText: slides[n] })
                        card4.dataset.pages = slides.length
                        card4.dataset.page = n + 1
                        card4.addEventListener('click', () => {
                            n = (n + 1) % slides.length
                            card4.dataset.page = n + 1
                            slideText.innerText = slides[n]
                        })

                        cards.push(card4)

                        if (absenceTypes.some(type => type.includes('laat'))) {
                            const dayMostOftenTooLate = year.absences.filter(item => item.Omschrijving.toLowerCase().includes('laat')).map(item => new Date(item.Start).toLocaleDateString(locale, { weekday: 'long' }).toLowerCase()).mode()
                            const hourMostOftenTooLate = year.absences.filter(item => item.Omschrijving.toLowerCase().includes('laat')).map(item => `lesuur ${item.Afspraak.LesuurVan} `).mode()

                            const card5 = element('div', null, null, { class: 'st-wrapped-card interactable', style: 'grid-row: span 6;', 'data-icon': '' })
                            element('span', null, card5, { class: 'st-w-text', innerText: `${year.absences.filter(item => item.Omschrijving.toLowerCase().includes('laat')).length}× te laat` })

                            const slides = [`Je was het vaakst te laat op ${dayMostOftenTooLate}en.`, `Je was het vaakst te laat bij het ${hourMostOftenTooLate}e uur.`]
                            let n = 0
                            const slideText = element('span', null, card5, { class: 'st-w-text-small', innerText: slides[n] })
                            card5.dataset.pages = slides.length
                            card5.dataset.page = n + 1
                            card5.addEventListener('click', () => {
                                n = (n + 1) % slides.length
                                card5.dataset.page = n + 1
                                slideText.innerText = slides[n]
                            })
                        }
                    }

                    {
                        const card6 = element('div', null, null, { class: 'st-wrapped-card', style: 'grid-row: span 4;', 'data-icon': '' })
                        element('span', null, card6, {
                            class: 'st-w-text-small', innerText: `Je hebt ${attendedLessons.length} lessen bijgewoond.`
                        })
                        element('span', null, card6, {
                            class: 'st-w-text-small', innerText: `Dat is ${Math.ceil(msAttended / 3600000)} uur les: ${Math.round(msAttended / 86400000) === msAttended / 86400000 ? 'precies' : Math.round(msAttended / 86400000) > msAttended / 86400000 ? 'bijna' : 'ruim'} ${Math.round(msAttended / 86400000)} dagen.`
                        })
                        cards.push(card6)
                    }
                }

                if (year.assignments?.length > 0) {
                    const card1 = element('div', null, null, { class: 'st-wrapped-card', style: 'grid-row: span 6;', 'data-icon': '' })
                    element('span', null, card1, { class: 'st-w-metric', innerText: Math.round(year.assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) < new Date(item.IngeleverdOp)).length / year.assignments.length * 100) + '%' })
                    element('span', null, card1, { class: 'st-w-text', innerText: `tijdigheid opdrachten` })
                    element('span', null, card1, { class: 'st-w-text-small', innerText: `Van de ${year.assignments.length} leverde je er ${year.assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) < new Date(item.IngeleverdOp)).length} op tijd, ${year.assignments.filter(item => item.IngeleverdOp && new Date(item.InleverenVoor) >= new Date(item.IngeleverdOp)).length} te laat en ${year.assignments.filter(item => !item.IngeleverdOp).length} helemaal niet in.` })
                    cards.push(card1)
                }

                if (i === years.length) {
                    const card1 = element('div', null, null, { class: 'st-wrapped-card external-link', style: 'grid-row: span 5;', 'data-icon': '' })
                    element('span', null, card1, { class: 'st-w-text-small', innerText: `Vergeet niet dat je e-mailadres van school waarschijnlijk binnenkort wordt verwijderd.` })
                    element('span', null, card1, { class: 'st-w-text-small', innerText: `Maak ook even een back-up van je cijferlijst!` })
                    cards.push(card1)
                    card1.addEventListener('click', async (event) => { event.stopPropagation(); dialog.close(); window.location.hash = '#/cijfers/cijferoverzicht'; (await awaitElement('#st-cb')).click(); })
                }

                cards.forEach(card => {
                    yearElement.append(card)
                })

                resolveYear(yearElement)
            })
        }
    })
}
