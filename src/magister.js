let subjects

init()

async function vandaag() {
    if (!await getSetting('magister-vd-overhaul')) return
    let mainSection = await getElement('section.main'),
        container = document.createElement('div'),
        header = document.createElement('div'),
        headerText = document.createElement('span'),
        scheduleWrapper = document.createElement('div'),
        notifcationsWrapper = document.createElement('div')
    mainSection.append(header, container)
    header.id = 'st-vd-header'
    header.append(headerText)
    container.id = 'st-vd'
    container.append(scheduleWrapper, notifcationsWrapper)
    scheduleWrapper.id = 'st-vd-schedule'
    notifcationsWrapper.id = 'st-vd-notifications'

    vandaagNotifications(notifcationsWrapper)
    vandaagSchedule(scheduleWrapper)

    const greetings = [
        [22, 'Goedenavond', 'Goedenavond, nachtbraker'],
        [18, 'Goedenavond', 'Hallo'],
        [12, 'Goedemiddag', 'Hallo'],
        [5, 'Goedemorgen', 'Goeiemorgen', 'Hallo'],
        [0, 'Goedenacht', 'Goedemorgen, vroege vogel']
    ],
        hour = new Date().getHours()
    greetings.forEach(e => {
        if (hour >= e[0]) {
            e.shift()
            if (!headerText.innerText) headerText.innerText = e[Math.floor(Math.random() * e.length)]
        }
    })
    if (Math.random() < 0.01) showSnackbar("Bedankt voor het gebruiken van StudyTools!")
    if (Math.random() < 0.005) showSnackbar("Welkom op het Magister dat Iddink niet kon creëren :)")

    setTimeout(() => header.dataset.transition = true, 2000)
    setTimeout(() => {
        headerText.innerText = new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        if (Math.random() < 0.005) headerText.innerText = "﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽"
        header.removeAttribute('data-transition')
    }, 2500)
}

async function vandaagNotifications(notifcationsWrapper) {
    let lastGrade = await getElement('.block.grade-widget span.cijfer'),
        lastGradeDescription = await getElement('.block.grade-widget span.omschrijving'),
        moreGrades = await getElement('.block.grade-widget ul.list.arrow-list > li:nth-child(2) span'),
        unreadItems = await getElement('#notificatie-widget ul>li', true),
        gradeNotification = document.createElement('li'),
        gradeNotificationSpan = document.createElement('span')

    if (lastGrade.innerText === '-' || lastGradeDescription.innerText === 'geen cijfers') {
        gradeNotification.innerText = 'Geen nieuwe cijfers'
        gradeNotification.dataset.insignificant = true
    } else {
        gradeNotification.innerText = `Nieuw cijfer voor ${lastGradeDescription.innerText}: `
        gradeNotificationSpan.innerText = lastGrade.innerText
        if (Number(moreGrades.innerText) > 1) {
            gradeNotification.dataset.additionalInfo = `en nog ${Number(moreGrades.innerText) - 1} andere cijfers`
        }
    }
    notifcationsWrapper.append(gradeNotification)
    gradeNotification.id = 'st-vd-grade-notification'
    gradeNotification.setAttribute('onclick', `window.location.href = '#/cijfers'`)
    gradeNotification.dataset.icon = ''
    gradeNotification.append(gradeNotificationSpan)
    gradeNotificationSpan.id = 'st-vd-grade-notification-span'

    unreadItems.forEach((e, i, a) => {
        setTimeout(() => {
            let amount = e.firstElementChild.firstElementChild.innerText,
                description = e.firstElementChild.innerText.replace(`${amount} `, ''),
                href = e.firstElementChild.href,
                element = document.createElement('li')

            if (description.includes('deadline')) {
                if (e.firstElementChild.innerText.includes('geen')) return
                document.querySelector('#st-vd-unread-open-assignments').dataset.additionalInfo = `waarvan ${amount} met naderende deadline`
            } else {
                element.innerText = `${amount} ${description}`
                element.setAttribute('onclick', `window.location.href = '${href}'`)
                notifcationsWrapper.append(element)
                if (e.firstElementChild.innerText.includes('geen')) element.dataset.insignificant = true
                if (description.includes('openstaand')) {
                    element.id = 'st-vd-unread-open-assignments'
                    element.dataset.icon = ''
                } else if (description.includes('beoordeeld')) {
                    element.dataset.icon = ''
                } else if (description.includes('activiteit')) {
                    element.dataset.icon = ''
                } else if (description.includes('logboek')) {
                    element.dataset.icon = ''
                }
            }
        }, e.firstElementChild.innerText.includes('?') ? 1000 : 0)
    })

    notifcationsWrapper.dataset.ready = true
}

async function vandaagSchedule(scheduleWrapper) {
    let scheduleTodayContainer = document.createElement('ul'),
        scheduleTomorrowContainer = document.createElement('ul'),
        scheduleButtonWrapper = document.createElement('div'),
        scheduleDaySwitcher = document.createElement('a'),
        scheduleLinkWeek = document.createElement('a'),
        scheduleLinkList = document.createElement('a')

    scheduleWrapper.append(scheduleTodayContainer, scheduleButtonWrapper)
    scheduleButtonWrapper.append(scheduleDaySwitcher, scheduleLinkWeek, scheduleLinkList)
    scheduleDaySwitcher.innerText = ''
    scheduleDaySwitcher.id = 'st-vd-schedule-switch'
    scheduleDaySwitcher.title = `Van dag wisselen`
    scheduleDaySwitcher.addEventListener('click', () => {
        document.querySelector('#st-vd-schedule>ul[data-tomorrow]').toggleAttribute('data-hidden')
    })
    if (await getSetting('magister-vd-hide-tomorrow')) scheduleTomorrowContainer.dataset.hidden = true
    else scheduleDaySwitcher.dataset.hidden = true
    scheduleLinkWeek.innerText = ''
    scheduleLinkWeek.classList.add('st-vd-schedule-link')
    scheduleLinkWeek.title = `Weekoverzicht`
    scheduleLinkWeek.href = '#/agenda/werkweek'
    scheduleLinkList.innerText = ''
    scheduleLinkList.classList.add('st-vd-schedule-link')
    scheduleLinkList.title = `Afsprakenlijst`
    scheduleLinkList.href = '#/agenda'

    let agendaTodayElems = await getElement('.agenda-list:not(.roosterwijziging)>li:not(.no-data)', true, 4000)
    displayScheduleList(agendaTodayElems, scheduleTodayContainer)

    setTimeout(async () => {
        let agendaTomorrowTitle = await getElement('#agendawidgetlistcontainer>h4', 4000),
            agendaTomorrowElems = await getElement('.agenda-list.roosterwijziging>li:not(.no-data)', true, 4000)
        if (!agendaTomorrowTitle, agendaTomorrowElems) return
        scheduleWrapper.firstElementChild.after(scheduleTomorrowContainer)
        scheduleTomorrowContainer.dataset.tomorrow = `Rooster voor ${agendaTomorrowTitle?.innerText?.replace('Wijzigingen voor ', '') || 'morgen'}`
        displayScheduleList(agendaTomorrowElems, scheduleTomorrowContainer)
    }, 500)

    scheduleWrapper.dataset.ready = true
}

async function studiewijzers() {
    if (!await getSetting('magister-sw-sort')) return
    const gridContainer = await getElement('section.main')
    displayStudiewijzerArray(gridContainer)
}

async function studiewijzer() {
    if (await getSetting('magister-sw-thisWeek')) {
        let list = await getElement('.studiewijzer-content-container>ul'),
            titles = await getElement('li.studiewijzer-onderdeel>div.block>h3>b.ng-binding', true),
            regex = new RegExp(/(w|sem|ε|heb)[^\s\d]*\s?(match){1}.*/i)

        titles.forEach(async title => {
            if (list.childElementCount === 1 || regex.exec(title.innerText.replace(await getWeekNumber(), 'match'))) {
                let top = title.parentElement,
                    bottom = top.nextElementSibling.lastElementChild,
                    li = top.parentElement.parentElement
                li.classList.add('st-current-sw')
                top.setAttribute('title', "De titel van dit kopje komt overeen met het huidige weeknummer.")
                bottom.scrollIntoView({ behavior: 'smooth', block: 'center' })
                title.click()
            }
        })
    }

    if (!await getSetting('magister-sw-sort')) return
    const gridContainer = await getElement('div.full-height.widget')
    displayStudiewijzerArray(gridContainer, true)
}

async function cijferoverzicht() {
    let aside = await getElement('#cijfers-container aside'),
        menuHost = await getElement('.menu-host'),
        menuCollapser = await getElement('.menu-footer>a'),
        gradesContainer = await getElement('.content-container-cijfers'),
        gradeDetails = await getElement('#idDetails>.tabsheet .block .content dl'),
        clOpen = document.createElement('button'),
        clCloser = document.createElement('button'),
        clAddTable = document.createElement('button'),
        clAddCustom = document.createElement('button'),
        clWrapper = document.createElement('div'),
        clTitle = document.createElement('span'),
        clSubtitle = document.createElement('span'),
        clAddCustomResult = document.createElement('input'),
        clAddCustomWeight = document.createElement('input'),
        clAdded = document.createElement('p'),
        clMean = document.createElement('p'),
        clFutureWeight = document.createElement('input'),
        clFutureDesc = document.createElement('p'),
        clCanvas = document.createElement('canvas'),
        ctx = clCanvas.getContext('2d'),
        clCanvasHighlight = document.createElement('div'),
        resultsList = [],
        weightsList = [],
        hypotheticalWeight = 1,
        mean

    document.body.append(clOpen)
    clOpen.classList.add('st-button')
    clOpen.id = 'st-cf-cl-open'
    clOpen.innerText = "Cijfercalculator"
    clOpen.dataset.icon = ''
    document.body.append(clWrapper)
    clWrapper.id = 'st-cf-cl'
    clWrapper.dataset.step = 0
    clWrapper.append(clCloser, clTitle, clSubtitle, clAdded, clMean, clAddTable, clAddCustomResult, clAddCustomWeight, clAddCustom, clCanvas, clCanvasHighlight, clFutureDesc, clFutureWeight)
    clTitle.id = 'st-cf-cl-title'
    clTitle.innerText = "Cijfercalculator"
    clSubtitle.id = 'st-cf-cl-subtitle'
    clAdded.id = 'st-cf-cl-added'
    clMean.id = 'st-cf-cl-mean'
    clCloser.classList.add('st-button')
    clCloser.id = 'st-cf-cl-closer'
    clCloser.innerText = "Wissen en sluiten"
    clCloser.dataset.icon = ''
    clAddTable.classList.add('st-button')
    clAddTable.id = 'st-cf-cl-add-table'
    clAddTable.innerText = "Geselecteerd cijfer toevoegen"
    clAddCustom.classList.add('st-button')
    clAddCustom.id = 'st-cf-cl-add-custom'
    clAddCustom.innerText = "Cijfer handmatig toevoegen"
    setAttributes(clAddCustomResult, { id: 'st-cf-cl-add-custom-result', type: 'number', placeholder: 'Cijfer', max: 10, step: 0.1, min: 1 })
    setAttributes(clAddCustomWeight, { id: 'st-cf-cl-add-custom-weight', type: 'number', placeholder: 'Weging', min: 1 })
    setAttributes(clFutureWeight, { id: 'st-cf-cl-future-weight', type: 'number', placeholder: 'Weging', min: 1, value: 1 })
    clFutureDesc.id = 'st-cf-cl-future-desc'
    clCanvas.id = 'st-cf-cl-canvas'
    setAttributes(clCanvas, { height: 250, width: 424 })
    ctx.transform(1, 0, 0, -1, 0, clCanvas.height)
    clCanvasHighlight.id = 'st-cf-cl-canvas-highlight'

    clOpen.addEventListener('click', async () => {
        clCanvas = document.getElementById('st-cf-cl-canvas')
        ctx = clCanvas.getContext('2d')
        document.body.style.marginLeft = '-130px'
        clWrapper.dataset.step = 1
        resultsList = []
        weightsList = []
        clAdded.innerText = ''
        clMean.innerText = ''
        clFutureDesc.innerText = ''
        ctx.clearRect(0, 0, clCanvas.width, clCanvas.height)
        clSubtitle.innerText = "Voeg cijfers toe met de knoppen of dubbelklik op een cijfer \nuit de tabel. Druk op de toets '?' om de zijbalk weer te geven."
        gradesContainer.style.zIndex = '999999'
        if (!menuHost.classList.contains('collapsed-menu')) menuCollapser.click()
    })

    addEventListener("keydown", e => {
        if (clWrapper.dataset.step !== 0 && (e.key === '?' || e.key === '/')) aside.classList.toggle('st-appear-top')
    })

    gradesContainer.addEventListener('dblclick', () => {
        clAddTable.setAttribute('disabled', true)
        setTimeout(() => {
            clAddTable.removeAttribute('disabled')
            clAddTable.click()
        }, 400)
    })

    clAddTable.addEventListener('click', async () => {
        if (clAddTable.disabled) return
        let result, weight, column, title
        gradeDetails.childNodes.forEach(element => {
            if (element.innerText === 'Beoordeling') {
                result = Number(element.nextElementSibling.innerText.replace(',', '.'))
            } else if (element.innerText === 'Weging') {
                weight = Number(element.nextElementSibling.innerText.replace(',', '.'))
            } else if (element.innerText === 'Kolomnaam') {
                column = element.nextElementSibling.innerText
            } else if (element.innerText === 'Kolomkop') {
                title = element.nextElementSibling.innerText
            }
        })

        if (isNaN(result) || isNaN(weight) || result < 1 || result > 10) return showSnackbar('Dat cijfer kan niet worden toegevoegd aan de berekening.')
        if (weight <= 0) return showSnackbar('Dat cijfer telt niet mee en is niet toegevoegd aan de berekening.')
        clAdded.innerText += `${result.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}x) — ${column}, ${title}\n`
        resultsList.push(result)
        weightsList.push(weight)
        mean = weightedMean(resultsList, weightsList)
        showSnackbar('Cijfer toegevoegd aan de berekening.')

        clMean.innerText = mean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        if (mean < 5.5) clMean.classList.add('insufficient')
        else clMean.classList.remove('insufficient')

        clWrapper.dataset.step = 2
        updateGradeChart(resultsList, weightsList, hypotheticalWeight, mean, clCanvasHighlight, clFutureDesc)
    })

    clAddCustom.addEventListener('click', async () => {
        let result = Number(clAddCustomResult.value), weight = Number(clAddCustomWeight.value)

        if (isNaN(result) || isNaN(weight) || result < 1 || result > 10) return showSnackbar('Dat cijfer kan niet worden toegevoegd aan de berekening.')
        if (weight <= 0) return showSnackbar('Dat cijfer telt niet mee en is niet toegevoegd aan de berekening.')
        clAdded.innerText += `${result.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}x) — handmatig ingevoerd\n`
        resultsList.push(result)
        weightsList.push(weight)
        mean = weightedMean(resultsList, weightsList)
        showSnackbar('Cijfer toegevoegd aan de berekening.')

        clMean.innerText = mean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        if (mean < 5.5) clMean.classList.add('insufficient')
        else clMean.classList.remove('insufficient')

        clWrapper.dataset.step = 2
        updateGradeChart(resultsList, weightsList, hypotheticalWeight, mean, clCanvasHighlight, clFutureDesc)
    })

    clFutureWeight.addEventListener('input', async () => {
        hypotheticalWeight = Number(clFutureWeight.value)
        if (isNaN(hypotheticalWeight) || hypotheticalWeight < 1) return
        updateGradeChart(resultsList, weightsList, hypotheticalWeight, mean, clCanvasHighlight, clFutureDesc)
    })

    clCloser.addEventListener('click', async () => {
        document.body.style.marginLeft = '0'
        clWrapper.dataset.step = 0
        menuCollapser.click()
    })
}

async function updateGradeChart(resultsList, weightsList, weight = 1, mean, clCanvasHighlight, clFutureDesc) {
    let clCanvas = document.getElementById('st-cf-cl-canvas'),
        oldElement = clCanvas,
        newElement = oldElement.cloneNode(true),
        widthCoefficient = clCanvas.width / 91,
        heightCoefficient = clCanvas.height / 91
    oldElement.parentElement.replaceChild(newElement, oldElement)
    clCanvas = newElement
    oldElement.remove()

    let ctx = clCanvas.getContext('2d')
    ctx.transform(1, 0, 0, -1, 0, clCanvas.height)

    let means = weightedPossibleMeans(resultsList, weightsList, weight),
        landmarks = [1, 2, 3, 4, 5, 5.5, 6, 7, 8, 9, 10]
    ctx.clearRect(0, 0, clCanvas.width, clCanvas.height)
    landmarks.forEach(num => {
        if (num !== 5.5) ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-primary-border-color')
        else ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-accent-warn')
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(0, (num * 10 - 9) * heightCoefficient - 1)
        ctx.lineTo(clCanvas.width, (num * 10 - 9) * heightCoefficient - 1)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo((num * 10 - 9) * widthCoefficient - 1, 0)
        ctx.lineTo((num * 10 - 9) * widthCoefficient - 1, clCanvas.height)
        ctx.stroke()
    })

    ctx.save()
    ctx.transform(1, 0, 0, -1, 0, clCanvas.height)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-primary-color')
    ctx.font = '12px open-sans, sans-serif'
    ctx.fillText("Cijfer ➔", 370, 240)
    ctx.translate(clCanvas.width / 2, clCanvas.height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText("Gemiddelde ➔", 30, -190)
    ctx.restore()

    let grade1 = means[1][0],
        mean1 = means[0][0],
        grade55 = means[1][45],
        mean55 = means[0][45],
        grade10 = means[1][90],
        mean10 = means[0][90]
    ctx.globalAlpha = 1
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-accent-warn')
    ctx.beginPath()
    ctx.moveTo((grade1 * 10 - 9) * widthCoefficient - 1, (mean1 * 10 - 9) * heightCoefficient - 1)
    ctx.lineTo((grade55 * 10 - 9) * widthCoefficient - 1, (mean55 * 10 - 9) * heightCoefficient - 1)
    ctx.stroke()
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-primary-color')
    ctx.beginPath()
    ctx.moveTo((grade55 * 10 - 9) * widthCoefficient - 1, (mean55 * 10 - 9) * heightCoefficient - 1)
    ctx.lineTo((grade10 * 10 - 9) * widthCoefficient - 1, (mean10 * 10 - 9) * heightCoefficient - 1)
    ctx.stroke()
    clCanvasHighlight.classList.remove('show')
    clFutureDesc.innerText = ''

    for (let i = 0; i < means[0].length; i++) {
        let meanH = means[0][i],
            gradeH = means[1][i] || 1.0
        if (meanH > 5.49) {
            clFutureDesc.style.color = 'var(--st-primary-color)'
            clFutureDesc.innerText = `Haal een ${gradeH.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} of hoger om een voldoende te ${mean < 5.5 ? 'komen' : 'blijven'} staan.`
            if (gradeH <= 1.0) {
                clFutureDesc.innerText = `Met een cijfer dat ${weight}x meetelt blijf je in elk geval een voldoende staan.`
            } else if (gradeH > 9.9) {
                clFutureDesc.innerText = `Haal een 10,0 om een voldoende te ${mean < 5.5 ? 'komen' : 'blijven'} staan.`
            }
            break
        } else {
            clFutureDesc.style.color = 'var(--st-accent-warn)'
            clFutureDesc.innerText = `Met een cijfer dat ${weight}x meetelt kun je geen voldoende komen te staan.`
        }
    }

    clCanvas.addEventListener('mousemove', (e) => {
        clCanvasHighlight.classList.add('show')
        clCanvasHighlight.style.left = e.clientX + 'px'
        let rect = e.target.getBoundingClientRect(),
            x = e.clientX - rect.left
        index = Math.round(x / widthCoefficient) - 1
        if (index < 0) index = 0
        else if (index > 90) index = 90
        if (means[0][index] > 5.49) clFutureDesc.style.color = 'var(--st-primary-color)'
        else clFutureDesc.style.color = 'var(--st-accent-warn)'
        clFutureDesc.innerText = `Als je een ${means[1][index].toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, dan kom je gemiddeld een ${means[0][index].toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} te staan.`
    })
}

async function displayScheduleList(agendaElems, container) {
    let events = [],
        settingSubjects = await getSetting('magister-subjects'),
        settingAgendaHeight = await getSetting('magister-vd-agendaHeight') || 50

    if (agendaElems) agendaElems.forEach((e, i, a) => {
        let time = e.querySelector('.time')?.innerText,
            title = e.querySelector('.classroom')?.innerText,
            period = e.querySelector('.nrblock')?.innerText,
            href = e.querySelector('a')?.href,
            tooltip = e.querySelector('.agenda-text-icon')?.innerText,
            dateStart = new Date(),
            dateEnd = new Date(),
            dateStartNext = new Date()

        if (time) {
            dateStart.setHours(time.split('-')[0].split(':')[0])
            dateStart.setMinutes(time.split('-')[0].split(':')[1])

            dateEnd.setHours(time.split('-')[1].split(':')[0])
            dateEnd.setMinutes(time.split('-')[1].split(':')[1])
        }

        events.push({ time, title, period, dateStart, dateEnd, href, tooltip })

        if (a[i + 1]) {
            let timeNext = a[i + 1]?.querySelector('.time')?.innerText
            if (!timeNext) return
            dateStartNext.setHours(timeNext.split('-')[0].split(':')[0])
            dateStartNext.setMinutes(timeNext.split('-')[0].split(':')[1])

            if (dateStartNext - dateEnd > 1000) {
                time = `${String(dateEnd.getHours()).padStart(2, '0')}:${String(dateEnd.getMinutes()).padStart(2, '0')} - ${String(dateStartNext.getHours()).padStart(2, '0')}:${String(dateStartNext.getMinutes()).padStart(2, '0')}`
                events.push({ time, dateStart: dateEnd, dateEnd: dateStartNext })
            }
        }
    })

    if (events) events.forEach(async ({ time, title, period, dateStart, dateEnd, href, tooltip }, a, i) => {
        let elementWrapper = document.createElement('li'),
            elementTime = document.createElement('span'),
            elementTitle = document.createElement('span'),
            elementTitleBold = document.createElement('b'),
            elementTitleNormal = document.createElement('span'),
            elementPeriod = document.createElement('span'),
            elementTooltip = document.createElement('span'),
            now = new Date(),
            subject,
            searchString

        container.append(elementWrapper)

        if (title) {
            searchString = title.split(' (')[0].split('-')[0]
            settingSubjects.forEach(subjectEntry => {
                testArray = `${subjectEntry.name},${subjectEntry.aliases}`.split(',')
                testArray.forEach(testString => {
                    if ((new RegExp(`^(${testString.trim()})$|^(${testString.trim()})[^a-z]|[^a-z](${testString.trim()})$|[^a-z](${testString.trim()})[^a-z]`, 'i')).test(searchString)) subject = subjectEntry.name + ' '
                })
            })
        } else {
            elementWrapper.dataset.filler = true
            elementTime.dataset.filler = dateEnd - dateStart < 2700000 ? 'pauze' : 'geen les'
        }

        height = ((0.0000222222 * settingAgendaHeight) * (dateEnd - dateStart)) + 'px'

        elementWrapper.append(elementTime, elementTitle, elementPeriod, elementTooltip)
        elementTime.innerText = time || ''
        elementTitleBold.innerText = subject || title?.split(' (')[0] || ''
        elementTitleNormal.innerText = title?.replace(searchString, '') || ''
        elementTitle.append(elementTitleBold, elementTitleNormal)
        elementPeriod.innerText = period || ''
        elementTooltip.innerText = tooltip || ''
        elementWrapper.style.height = height
        elementWrapper.setAttribute('onclick', `window.location.href = '${href}'`)

        if (!tooltip) elementTooltip.remove()

        if (now >= dateStart && now <= dateEnd) elementWrapper.dataset.current = 'true'
        else if (now > dateEnd) elementWrapper.dataset.past = 'true'
    })
}

async function displayStudiewijzerArray(gridContainer, compact) {
    const settingGrid = await getSetting('magister-sw-grid'),
        settingShowPeriod = await getSetting('magister-sw-period'),
        settingSubjects = await getSetting('magister-subjects'),
        currentPeriod = await getPeriodNumber(),
        viewTitle = document.querySelector('dna-page-header.ng-binding')?.firstChild?.textContent?.replace(/(\\n)|'|\s/gi, ''),
        originalList = await getElement('.studiewijzer-list>ul, .content.projects>ul'),
        originalItems = await getElement('li[data-ng-repeat^="studiewijzer in items"]', true),
        originalItemsArray = [...originalItems],
        gridWrapper = document.createElement('div'),
        grid = document.createElement('div')

    if (settingGrid) {
        gridContainer.appendChild(gridWrapper)
        gridWrapper.id = 'st-sw-container'
        gridWrapper.appendChild(grid)
        grid.id = 'st-sw-grid'
    }

    let mappedArray = originalItemsArray.map(elem => {
        let title = elem.firstElementChild.firstElementChild.innerText,
            subject = "Geen vak",
            period = 0,
            priority,
            periodTextIndex = title.search(/(t(hema)?|p(eriod(e)?)?)(\s|\d)/i)

        settingSubjects.forEach(subjectEntry => {
            testArray = `${subjectEntry.name},${subjectEntry.aliases} `.split(',')
            testArray.forEach(testString => {
                if ((new RegExp(`^(${testString.trim()})$|^(${testString.trim()})[^a-z]|[^a-z](${testString.trim()})$|[^a-z](${testString.trim()})[^a-z]`, 'i')).test(title)) subject = subjectEntry.name
            })
        })

        if (periodTextIndex > 0) {
            let periodNumberSearchString = title.slice(periodTextIndex),
                periodNumberIndex = periodNumberSearchString.search(/[1-9]/i)
            if (periodNumberIndex > 0) period = Number(periodNumberSearchString.charAt(periodNumberIndex))
        }

        if (period === currentPeriod) priority = 2
        else if (period > 0) priority = 0
        else priority = 1

        return { elem, title, period, subject, priority }
    }).sort((a, b) => settingGrid ? (a.subject.localeCompare(b.subject) || a.period - b.period) : (b.priority - a.priority || a.subject.localeCompare(b.subject)))


    mappedArray.forEach(async ({ elem, title, period, subject, priority }, i) => {
        elem.dataset.swStIndex = i
        elem.dataset.title = title
        if (settingGrid) {
            let itemButton = document.createElement('button'),
                subjectTile = document.querySelector(`div[data-subject='${subject}']`)
            if (!subjectTile) {
                subjectTile = document.createElement('div')
                grid.appendChild(subjectTile)
                subjectTile.classList.add('st-sw-subject')
                subjectTile.dataset.subject = subject
                const defaultItemButton = document.createElement('button')
                defaultItemButton.innerText = subject
                subjectTile.appendChild(defaultItemButton)
                defaultItemButton.setAttribute('onclick', 'this.parentElement.lastElementChild.click()')
                if (compact) subjectTile.classList.add('st-sw-compact')
            }
            if (settingShowPeriod) {
                itemButton.innerText = period ? `periode ${period} ` : "geen periode"
                itemButton.dataset.title = title
            } else {
                itemButton.innerText = title
                itemButton.style.fontSize = '11px'
                itemButton.style.minHeight = '2rem'
            }
            itemButton.classList.add(`st-sw-${priority}`)
            if (viewTitle && viewTitle.toLowerCase() === title.replace(/(\\n)|'|\s/gi, '').toLowerCase()) itemButton.classList.add(`st-sw-selected`)
            itemButton.setAttribute('onclick', `document.querySelector('li[data-sw-st="${i}"], li[data-title="${title}"]>a').click()`)
            subjectTile.appendChild(itemButton)
        } else {
            originalList.appendChild(elem)
            elem.firstElementChild.lastElementChild.innerText = subject
            switch (priority) {
                case 2:
                    elem.classList.add('st-current')
                    elem.setAttribute('title', "Deze studiewijzer is actueel.")
                    break

                case 1:
                    elem.setAttribute('title', "Er kon geen periodenummer worden gedetecteerd.")
                    break

                default:
                    elem.classList.add('st-obsolete')
                    elem.setAttribute('title', `Deze studiewijzer is van periode ${period}.`)
                    break
            }
        }

    })
}

// Run when the extension and page are loaded
async function init() {
    popstate()

    window.addEventListener('popstate', popstate)
    window.addEventListener('locationchange', popstate)

    let appbar = await getElement('.appbar'),
        logos = await getElement('img.logo-expanded, img.logo-collapsed', true)

    subjects = await getSetting('magister-subjects')

    if (await getSetting('magister-appbar-zermelo')) {
        const appbarZermelo = document.createElement('div'),
            zermeloA = document.createElement('a'),
            zermeloImg = document.createElement('img'),
            zermeloSpan = document.createElement('span')
        appbar.firstElementChild.after(appbarZermelo)
        appbarZermelo.classList.add('menu-button')
        appbarZermelo.append(zermeloA)
        zermeloA.classList.add('zermelo-menu')
        zermeloA.setAttribute('href', `https://${window.location.hostname.split('.')[0]}.zportal.nl/app`)
        zermeloA.setAttribute('target', '_blank')
        zermeloA.append(zermeloImg)
        zermeloImg.setAttribute('src', 'https://raw.githubusercontent.com/QkeleQ10/QkeleQ10.github.io/main/img/zermelo.png')
        zermeloImg.setAttribute('width', '36')
        zermeloImg.style.borderRadius = '100%'
        zermeloA.append(zermeloSpan)
        zermeloSpan.innerText = "Zermelo"
    }

    if (await getSetting('magister-appbar-week')) {
        let appbarWeek = document.createElement("h1")
        appbarWeek.innerText = `week\r\n${await getWeekNumber()}`
        appbarWeek.id = 'st-appbar-week'
        appbar.prepend(appbarWeek)
    }

    let userMenuLink = await getElement('#user-menu')
    userMenuLink.addEventListener('click', async () => {
        let logoutLink = await getElement('.user-menu ul li:nth-child(3) a')
        logoutLink.addEventListener('click', async () => {
            await setSetting('force-logout', new Date().getTime(), 'local')
        })
    })

    if (Math.random() < 0.005) setTimeout(() => logos.forEach(e => e.classList.add('dvd-screensaver')), 5000)
}

// Run when the URL changes
async function popstate() {
    document.querySelectorAll('.st-button').forEach(e => {
        e.remove()
    })

    const href = document.location.href.split('?')[0]

    if (href.endsWith('/vandaag')) vandaag()
    else if (href.endsWith('/studiewijzer')) studiewijzers()
    else if (href.includes('/studiewijzer/')) studiewijzer()
    else if (href.includes('/cijfers/cijferoverzicht')) cijferoverzicht()
}

function getWeekNumber() {
    let d = new Date()
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)),
        weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return weekNo
}

async function getPeriodNumber(w = getWeekNumber()) {
    const settingPeriods = await getSetting('magister-periods')
    let periodNumber = 0

    settingPeriods.split(',').forEach((e, i, arr) => {
        let startWeek = Number(e),
            endWeek = Number(arr[i + 1]) || Number(arr[0])
        if (endWeek < startWeek && (w >= startWeek || w < endWeek)) periodNumber = i + 1
        else if (w >= startWeek && w < endWeek) periodNumber = i + 1
    })

    return periodNumber
}

function weightedMean(valueArray, weightArray) {
    let result = valueArray.map((value, i) => {
        let weight = weightArray[i],
            sum = value * weight
        return [sum, weight]
    }).reduce((p, c) => {
        return [p[0] + c[0], p[1] + c[1]]
    }, [0, 0])
    return (result[0] / result[1])
}

function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function weightedPossibleMeans(valueArray, weightArray, newWeight) {
    let means = [],
        grades = []
    for (let i = 1.0; i <= 10; i += 0.1) {
        grades.push(Number(i))
        means.push(Number(weightedMean(valueArray.concat([i]), weightArray.concat([newWeight]))))
    }
    return [means, grades]
}