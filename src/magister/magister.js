let subjects

init()

// Page 'Vandaag'
async function today() {
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

    todayNotifications(notifcationsWrapper)
    todaySchedule(scheduleWrapper)

    const greetings = [
        [22, 'Goedenavond', 'Hallo', 'Goedenavond, nachtuil'],
        [18, 'Goedenavond', 'Hallo'],
        [12, 'Goedemiddag', 'Hallo'],
        [5, 'Goedemorgen', 'Hallo', 'Goeiemorgen'],
        [0, 'Goedenacht', 'Hallo', 'Goedemorgen, vroege vogel']
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
        todayNotifications(notifcationsWrapper)

        headerText.innerText = new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        if (Math.random() < 0.005) headerText.innerText = "﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽﷽"
        header.removeAttribute('data-transition')
    }, 2500)
}

async function todayNotifications(notifcationsWrapper) {
    let lastGrade = await getElement('.block.grade-widget span.cijfer'),
        lastGradeDescription = await getElement('.block.grade-widget span.omschrijving'),
        moreGrades = await getElement('.block.grade-widget ul.list.arrow-list > li:nth-child(2) span'),
        unreadItems = await getElement('#notificatie-widget ul>li', true),
        gradeNotification = document.getElementById('st-vd-grade-notification') || document.createElement('li'),
        gradeNotificationSpan = document.getElementById('st-vd-grade-notification-span') || document.createElement('span')

    gradeNotification.id = 'st-vd-grade-notification'
    gradeNotificationSpan.id = 'st-vd-grade-notification-span'

    if (lastGrade.innerText === '-' || lastGradeDescription.innerText === 'geen cijfers') {
        gradeNotification.innerText = 'Geen nieuwe cijfers'
        gradeNotification.dataset.insignificant = true
    } else {
        if (await getSetting('magister-vd-grade') === 'partial') {
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

    if (await getSetting('magister-vd-grade') !== 'off') {
        if (!gradeNotification.parentElement) notifcationsWrapper.append(gradeNotification)
        gradeNotification.setAttribute('onclick', `window.location.href = '#/cijfers'`)
        gradeNotification.dataset.icon = ''
        gradeNotification.append(gradeNotificationSpan)
    }

    unreadItems.forEach((e, i, a) => {
        setTimeout(() => {
            let amount = e.firstElementChild.firstElementChild.innerText,
                description = e.firstElementChild.innerText.replace(`${amount} `, ''),
                href = e.firstElementChild.href,
                element = document.querySelector(`li[data-description="${description}"]`) || document.createElement('li')

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
                } else if (description.includes('activiteit')) {
                    element.dataset.icon = ''
                } else if (description.includes('logboek')) {
                    element.dataset.icon = ''
                }
            }
        }, e.firstElementChild.innerText.includes('?') ? 500 : 0)
    })

    notifcationsWrapper.dataset.ready = true
}

async function todaySchedule(scheduleWrapper) {
    let scheduleTodayContainer = document.createElement('ul'),
        scheduleTomorrowContainer = document.createElement('ul'),
        scheduleButtonWrapper = document.createElement('div'),
        scheduleLinkWeek = document.createElement('a'),
        scheduleLinkList = document.createElement('a')

    scheduleWrapper.append(scheduleTodayContainer, scheduleButtonWrapper)
    scheduleButtonWrapper.append(scheduleLinkWeek, scheduleLinkList)
    scheduleLinkWeek.innerText = ''
    scheduleLinkWeek.classList.add('st-vd-schedule-link')
    scheduleLinkWeek.title = `Weekoverzicht`
    scheduleLinkWeek.href = '#/agenda/werkweek'
    scheduleLinkList.innerText = ''
    scheduleLinkList.classList.add('st-vd-schedule-link')
    scheduleLinkList.title = `Afsprakenlijst`
    scheduleLinkList.href = '#/agenda'

    let agendaTodayElems = await getElement('.agenda-list:not(.roosterwijziging)>li:not(.no-data)', true, 4000)
    renderScheduleList(agendaTodayElems, scheduleTodayContainer)

    setTimeout(async () => {
        let agendaTomorrowTitle = await getElement('#agendawidgetlistcontainer>h4', 4000),
            agendaTomorrowElems = await getElement('.agenda-list.roosterwijziging>li:not(.no-data)', true, 4000)
        if (!agendaTomorrowTitle, agendaTomorrowElems) return
        scheduleWrapper.firstElementChild.after(scheduleTomorrowContainer)
        scheduleTomorrowContainer.dataset.tomorrow = `Rooster voor ${agendaTomorrowTitle?.innerText?.replace('Wijzigingen voor ', '') || 'morgen'}`
        renderScheduleList(agendaTomorrowElems, scheduleTomorrowContainer)
    }, 500)

    scheduleWrapper.dataset.ready = true
}

async function renderScheduleList(agendaElems, container) {
    let events = []

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
            dateStart.setSeconds(0)

            dateEnd.setHours(time.split('-')[1].split(':')[0])
            dateEnd.setMinutes(time.split('-')[1].split(':')[1])
            dateEnd.setSeconds(0)
        }

        events.push({ time, title, period, dateStart, dateEnd, href, tooltip })

        if (a[i + 1]) {
            let timeNext = a[i + 1]?.querySelector('.time')?.innerText
            if (!timeNext) return
            dateStartNext.setHours(timeNext.split('-')[0].split(':')[0])
            dateStartNext.setMinutes(timeNext.split('-')[0].split(':')[1])
            dateStartNext.setSeconds(0)

            if (dateStartNext - dateEnd > 1000) {
                time = `${String(dateEnd.getHours()).padStart(2, '0')}:${String(dateEnd.getMinutes()).padStart(2, '0')} – ${String(dateStartNext.getHours()).padStart(2, '0')}:${String(dateStartNext.getMinutes()).padStart(2, '0')}`
                events.push({ time, title: 'filler', dateStart: dateEnd, dateEnd: dateStartNext })
            }
        }
    })

    if (events) events.forEach(async ({ time, title, period, dateStart, dateEnd, href, tooltip }, a, i) => {
        let elementWrapper = document.createElement('li'),
            elementTime = document.createElement('span'),
            elementTitle = document.createElement('span'),
            elementTitleBold = document.createElement('b'),
            elementTitleNormal1 = document.createElement('span'),
            elementTitleNormal2 = document.createElement('span'),
            elementPeriod = document.createElement('span'),
            elementTooltip = document.createElement('span'),
            parsedTitle

        container.append(elementWrapper)
        if (title !== 'filler') {
            parsedTitle = await parseSubject(title, await getSetting('magister-vd-subjects'), await getSetting('magister-subjects'))
            elementTitleNormal1.innerText = parsedTitle.stringBefore || ''
            elementTitleBold.innerText = parsedTitle.subjectName || ''
            elementTitleNormal2.innerText = parsedTitle.stringAfter || ''
        } else {
            elementWrapper.dataset.filler = true
            elementTime.dataset.filler = dateEnd - dateStart < 2700000 ? 'pauze' : 'geen les'
        }

        height = await msToPixels(dateEnd - dateStart) + 'px'

        elementWrapper.append(elementTime, elementTitle, elementPeriod, elementTooltip)
        elementTime.innerText = time || ''
        elementTitle.append(elementTitleNormal1, elementTitleBold, elementTitleNormal2)
        elementPeriod.innerText = period || ''
        elementTooltip.innerText = tooltip || ''
        elementWrapper.style.height = height
        elementWrapper.setAttribute('onclick', `window.location.href = '${href}'`)

        if (!tooltip) elementTooltip.remove()

        setIntervalImmediately(async () => {
            if (new Date() >= dateStart && new Date() <= dateEnd) {
                elementWrapper.dataset.current = 'true'
                if (title) elementPeriod.style.borderBottom = await msToPixels(dateEnd - new Date()) + 'px solid var(--st-accent-primary)'
            } else if (new Date() > dateEnd) {
                elementWrapper.dataset.past = 'true'
                elementWrapper.removeAttribute('data-current')
                elementPeriod.removeAttribute('style')
            } else {
                elementWrapper.removeAttribute('data-current')
                elementWrapper.removeAttribute('data-past')
                elementPeriod.removeAttribute('style')
            }
        }, 10000)
    })
}

// Page 'Studiewijzers
async function studyguideList() {
    if (await getSetting('magister-sw-display') === 'off') return
    const gridContainer = await getElement('section.main')
    renderStudyguideList(gridContainer)
}

async function renderStudyguideList(gridContainer, compact) {
    const settingGrid = (await getSetting('magister-sw-display') === 'grid'),
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
        document.querySelectorAll('#st-sw-container').forEach(e => e.remove())
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
    })
        .sort((a, b) => settingGrid ? (a.subject.localeCompare(b.subject) || a.period - b.period) : (b.priority - a.priority || a.subject.localeCompare(b.subject)))

    mappedArray.forEach(async ({ elem, title, period, subject, priority }, i) => {
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
            itemButton.setAttribute('onclick', `
            for (const e of document.querySelectorAll('.studiewijzer-list ul>li>a>span:first-child, .tabsheet .widget ul>li>a>span')) {
                if (e.textContent.includes("${title}")) e.click()
            }`)
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

// Page 'Studiewijzer
async function studyguideIndividual() {
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

    if (await getSetting('magister-sw-display') === 'off') return
    const gridContainer = await getElement('div.full-height.widget')
    renderStudyguideList(gridContainer, true)
}

// Page 'Cijfers', calculator
async function gradeCalculator() {
    if (!await getSetting('magister-cf-calculator')) return
    let aside = await getElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        menuHost = await getElement('.menu-host'),
        menuCollapser = await getElement('.menu-footer>a'),
        gradesContainer = await getElement('.content-container-cijfers, .content-container'),
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
        clCanvasHlVertical = document.createElement('div'),
        clCanvasHlHorizontal = document.createElement('div'),
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
    clWrapper.append(clCloser, clTitle, clSubtitle, clAdded, clMean, clAddTable, clAddCustomResult, clAddCustomWeight, clAddCustom, clCanvas, clCanvasHlVertical, clCanvasHlHorizontal, clFutureDesc, clFutureWeight)
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
    setAttributes(clCanvasHlVertical, { id: 'st-cf-cl-canvas-hl-vertical', class: 'st-cf-cl-canvas-hl' })
    setAttributes(clCanvasHlHorizontal, { id: 'st-cf-cl-canvas-hl-horizontal', class: 'st-cf-cl-canvas-hl' })

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
        gradesContainer.style.zIndex = '9999999'
        gradesContainer.style.maxWidth = 'calc(100vw - 477px)'
        if (!menuHost.classList.contains('collapsed-menu')) menuCollapser.click()
    })

    addEventListener("keydown", e => {
        if (clWrapper.dataset.step != 0 && (e.key === '?' || e.key === '/')) aside.classList.toggle('st-appear-top')
    })

    gradesContainer.addEventListener('dblclick', () => {
        if (clWrapper.dataset.step == 0) return
        clAddTable.click()
        clAddTable.setAttribute('disabled', true)
        setTimeout(() => {
            clAddTable.removeAttribute('disabled')
        }, 200)
    })

    document.querySelectorAll('#st-cf-cl-add-table, #st-cf-cl-add-custom').forEach(e => {
        e.addEventListener('click', async event => {
            let item = document.querySelector('.k-state-selected'),
                result, weight, column, title

            if (clAddTable.disabled) return
            if (item.dataset.title) {
                result = Number(item.dataset.result.replace(',', '.'))
                weight = Number(item.dataset.weight.replace('x', '').replace(',', '.'))
                column = item.dataset.column
                title = item.dataset.title
            } else if (event.target.id === 'st-cf-cl-add-table') {
                setTimeout(() => {
                    gradeDetails.childNodes.forEach(element => {
                        if (element.innerText === 'Beoordeling' || element.innerText === 'Resultaat') {
                            result = Number(element.nextElementSibling.innerText.replace(',', '.'))
                        } else if (element.innerText === 'Weging' || element.innerText === 'Weegfactor') {
                            weight = Number(element.nextElementSibling.innerText.replace('x', '').replace(',', '.'))
                        } else if (element.innerText === 'Kolomnaam' || element.innerText === 'Vak') {
                            column = element.nextElementSibling.innerText
                        } else if (element.innerText === 'Kolomkop' || element.innerText === 'Omschrijving') {
                            title = element.nextElementSibling.innerText
                        }
                    })
                }, 200)
            } else if (event.target.id === 'st-cf-cl-add-custom') {
                result = Number(clAddCustomResult.value), weight = Number(clAddCustomWeight.value)
            }

            if (event.target.id === 'st-cf-cl-add-table') setTimeout(() => {

                if (isNaN(result) || isNaN(weight) || result < 1 || result > 10) return showSnackbar('Dat cijfer kan niet worden toegevoegd aan de berekening.')
                if (weight <= 0) return showSnackbar('Dat cijfer telt niet mee en is niet toegevoegd aan de berekening.')

                let addedElement = document.createElement('span')
                clAdded.append(addedElement)
                setAttributes(addedElement, { class: 'st-cf-cl-added-element', 'data-grade-index': resultsList.length })
                if (column && title)
                    addedElement.innerText = `${result.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}x) — ${column}, ${title}\n`
                else
                    addedElement.innerText = `${result.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}x) — handmatig ingevoerd\n`
                addedElement.addEventListener('click', event => {
                    resultsList.splice(Array.from(event.target.parentNode.children).indexOf(event.target), 1)
                    weightsList.splice(Array.from(event.target.parentNode.children).indexOf(event.target), 1)
                    event.target.remove()
                    mean = weightedMean(resultsList, weightsList)
                    showSnackbar('Cijfer verwijderd uit de berekening.')
                    clMean.innerText = isNaN(mean) ? '' : mean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    if (mean < 5.5) clMean.classList.add('insufficient')
                    else clMean.classList.remove('insufficient')

                    renderGradeChart(resultsList, weightsList, hypotheticalWeight, mean, clCanvasHlVertical, clCanvasHlHorizontal, clFutureDesc)
                    if (resultsList.length < 1 || weightsList.length < 1 || isNaN(mean)) clWrapper.dataset.step = 1
                })

                resultsList.push(result)
                weightsList.push(weight)
                mean = weightedMean(resultsList, weightsList)
                showSnackbar('Cijfer toegevoegd aan de berekening.')

                clMean.innerText = mean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                if (mean < 5.5) clMean.classList.add('insufficient')
                else clMean.classList.remove('insufficient')

                clWrapper.dataset.step = 2
                renderGradeChart(resultsList, weightsList, hypotheticalWeight, mean, clCanvasHlVertical, clCanvasHlHorizontal, clFutureDesc)
            }, 200)
        })
    })

    clFutureWeight.addEventListener('input', async () => {
        hypotheticalWeight = Number(clFutureWeight.value)
        if (isNaN(hypotheticalWeight) || hypotheticalWeight < 1) return
        renderGradeChart(resultsList, weightsList, hypotheticalWeight, mean, clCanvasHlVertical, clCanvasHlHorizontal, clFutureDesc)
    })

    clCloser.addEventListener('click', async () => {
        document.body.style.marginLeft = '0'
        gradesContainer.removeAttribute('style')
        clWrapper.dataset.step = 0
        menuCollapser.click()
    })
}

async function renderGradeChart(resultsList, weightsList, weight = 1, mean, clCanvasHlVertical, clCanvasHlHorizontal, clFutureDesc) {
    let clCanvas = document.getElementById('st-cf-cl-canvas'),
        oldElement = clCanvas,
        newElement = oldElement.cloneNode(true),
        widthCoefficient = clCanvas.width / 91,
        heightCoefficient = clCanvas.height / 91
    oldElement.parentElement.replaceChild(newElement, oldElement)
    clCanvas = newElement
    oldElement.remove()
    clFutureDesc.innerText = ''

    let ctx = clCanvas.getContext('2d')
    ctx.transform(1, 0, 0, -1, 0, clCanvas.height)
    ctx.font = '12px open-sans, sans-serif'

    if (resultsList.length < 1 || weightsList.length < 1 || isNaN(mean)) return

    let means = weightedPossibleMeans(resultsList, weightsList, weight),
        landmarks = [2, 3, 4, 5, 6, 7, 8, 9]
    ctx.clearRect(0, 0, clCanvas.width, clCanvas.height)
    landmarks.forEach(num => {
        ctx.globalAlpha = 0.5
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-primary-border-color')
        ctx.beginPath()
        ctx.moveTo(0, (num * 10 - 9) * heightCoefficient - 1)
        ctx.lineTo(clCanvas.width, (num * 10 - 9) * heightCoefficient - 1)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo((num * 10 - 9) * widthCoefficient - 3, 0)
        ctx.lineTo((num * 10 - 9) * widthCoefficient - 3, clCanvas.height)
        ctx.stroke()
    })

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-a-color')
    ctx.beginPath()
    ctx.moveTo(0, (mean * 10 - 9) * heightCoefficient - 1)
    ctx.lineTo(clCanvas.width, (mean * 10 - 9) * heightCoefficient - 1)
    ctx.stroke()

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-accent-ok')
    ctx.globalAlpha = .075
    ctx.fillRect(0, 125, 212, 125)
    ctx.globalAlpha = .175
    ctx.fillRect(212, 125, 212, 125)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-accent-warn')
    ctx.globalAlpha = .175
    ctx.fillRect(0, 0, 212, 125)
    ctx.globalAlpha = .075
    ctx.fillRect(212, 0, 212, 125)

    ctx.save()
    ctx.transform(1, 0, 0, -1, 0, clCanvas.height)
    ctx.globalAlpha = .75

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-primary-color')
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
    ctx.lineWidth = 2
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-primary-color')
    ctx.beginPath()
    ctx.moveTo((grade1 * 10 - 9) * widthCoefficient - 3, (mean1 * 10 - 9) * heightCoefficient - 1)
    ctx.lineTo((grade55 * 10 - 9) * widthCoefficient - 3, (mean55 * 10 - 9) * heightCoefficient - 1)
    ctx.stroke()
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-primary-color')
    ctx.beginPath()
    ctx.moveTo((grade55 * 10 - 9) * widthCoefficient - 3, (mean55 * 10 - 9) * heightCoefficient - 1)
    ctx.lineTo((grade10 * 10 - 9) * widthCoefficient - 3, (mean10 * 10 - 9) * heightCoefficient - 1)
    ctx.stroke()
    clCanvasHlVertical.classList.remove('show')

    clCanvasHlHorizontal.style.bottom = Math.abs(mean * 10 * heightCoefficient) + 'px'
    clCanvasHlHorizontal.dataset.averageNow = mean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    clCanvasHlHorizontal.dataset.veryHighNow = (mean > 9.2)

    let gradeAdvice = await formulateGradeAdvice(means, weight, mean)
    clFutureDesc.innerText = gradeAdvice.text
    clFutureDesc.style.color = gradeAdvice.color

    clCanvas.addEventListener('mousemove', event => {
        let rect = event.target.getBoundingClientRect(),
            x = event.clientX - rect.left
        index = Math.round(x / widthCoefficient) - 1
        if (index < 0) index = 0
        else if (index > 90) index = 90

        clCanvasHlVertical.classList.add('show')
        clCanvasHlVertical.style.left = event.clientX + 'px'
        clCanvasHlHorizontal.classList.add('show')
        clCanvasHlHorizontal.style.bottom = Math.abs(means[0][index] * 10 * heightCoefficient) + 'px'
        clCanvasHlHorizontal.dataset.average = means[0][index].toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        clCanvasHlHorizontal.dataset.veryHigh = (means[0][index] > 9.2)

        if (means[0][index] > 5.49) clFutureDesc.style.color = 'var(--st-primary-color)'
        else clFutureDesc.style.color = 'var(--st-accent-warn)'

        if (means[0][index].toFixed(2) > mean.toFixed(2))
            clFutureDesc.innerText = `Als je een ${means[1][index].toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, dan stijgt je gemiddelde tot een ${means[0][index].toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        else if (means[0][index].toFixed(2) < mean.toFixed(2))
            clFutureDesc.innerText = `Als je een ${means[1][index].toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, dan zakt je gemiddelde tot een ${means[0][index].toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        else
            clFutureDesc.innerText = `Als je een ${means[1][index].toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, dan blijf je gemiddeld een ${means[0][index].toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} staan.`
    })

    clCanvas.addEventListener('mouseleave', async event => {
        clCanvasHlVertical.classList.remove('show')
        clCanvasHlHorizontal.classList.remove('show')
        clCanvasHlHorizontal.style.bottom = Math.abs(mean * 10 * heightCoefficient) + 'px'
        gradeAdvice = await formulateGradeAdvice(means, weight, mean)
        clFutureDesc.innerText = gradeAdvice.text
        clFutureDesc.style.color = gradeAdvice.color
    })
}

async function formulateGradeAdvice(means, weight, mean) {
    return new Promise((resolve, reject) => {
        let text, color
        for (let i = 0; i < means[0].length; i++) {
            let meanH = means[0][i],
                gradeH = means[1][i] || 1.0
            if (meanH > 5.49) {
                color = 'var(--st-primary-color)'
                text = `Haal een ${gradeH.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} of hoger om een voldoende te ${mean < 5.5 ? 'komen' : 'blijven'} staan.`
                if (gradeH <= 1.0) {
                    text = `Met een cijfer dat ${weight}x meetelt blijf je in elk geval een voldoende staan.`
                } else if (gradeH > 9.9) {
                    text = `Haal een 10,0 om een voldoende te ${mean < 5.5 ? 'komen' : 'blijven'} staan.`
                }
                break
            } else {
                color = 'var(--st-accent-warn)'
                text = `Met een cijfer dat ${weight}x meetelt kun je geen voldoende komen te staan.`
            }
        }
        resolve({
            text: text || '',
            color: color || 'var(--st-primary-color)'
        })
    })
}

// Page 'Cijferoverzicht', backup
async function gradeBackup() {
    if (!await getSetting('magister-cf-backup')) return
    let aside = await getElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        gradesContainer = await getElement('.content-container-cijfers, .content-container'),
        gradeDetails = await getElement('#idDetails>.tabsheet .block .content dl'),
        bkExport = document.createElement('button'),
        bkImport = document.createElement('label'),
        bkImportInput = document.createElement('input'),
        list = [],
        num = 0

    document.body.append(bkExport, bkImport)
    bkExport.classList.add('st-button')
    bkExport.id = 'st-cf-bk-export'
    bkExport.innerText = "Exporteren"
    bkExport.dataset.icon = ''
    bkImport.classList.add('st-button')
    bkImport.id = 'st-cf-bk-import'
    bkImport.innerText = "Importeren"
    bkImport.dataset.icon = ''
    bkImport.append(bkImportInput)
    bkImportInput.type = 'file'
    bkImportInput.accept = '.json'
    bkImportInput.style.display = 'none'

    bkExport.addEventListener('click', async () => {
        bkExport.disabled = true
        bkExport.dataset.busy = true
        gradesContainer.setAttribute('style', 'opacity: .6; pointer-events: none')
        showSnackbar("Cijfers verzamelen en toevoegen aan back-upbestand...", 8000)
        list = []
        num = 0
        let nodeList = gradesContainer.querySelectorAll('td:not([style])'),
            array = [...nodeList],
            td

        if (array.length > 250)
            showSnackbar("Dit kan even duren — af en toe stopt het proces voor maximaal 5 seconden, zodat het quotum van Magister niet wordt overschreden.\n\nKrijg je een foutmelding rechtsonderin? Dan is het quotum toch overschreden. Er ontbreken dan cijfers in je back-upbestand.\n\nProbeer het dan later opnieuw of stuur me een e-mail via het configuratiepaneel.", 40000)

        for (let i = 0; i < array.length; i++) {
            bkExport.style.backgroundPosition = `-${(i + 1) / array.length * 100}% 0`
            td = array[i]
            await gatherExportGrade(td, gradeDetails, num)
                .then(result => {
                    list.push(result)
                    if (result.type === 'grade') num++
                    return result
                })
        }

        let uri = `data:application/json;base64,${window.btoa(unescape(encodeURIComponent(JSON.stringify(list))))}`,
            a = document.createElement("a")
        a.download = `Cijferlijst ${document.querySelector('#idWeergave form>div:nth-child(1) span.k-input').innerText} ${(new Date).toLocaleString()}`;
        a.href = uri
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        delete a
        gradesContainer.removeAttribute('style')
        bkExport.dataset.done = true
        setTimeout(() => {
            bkExport.removeAttribute('disabled')
            bkExport.removeAttribute('style')
            bkExport.removeAttribute('data-busy')
            bkExport.removeAttribute('data-done')
        }, 5000)
    })

    bkImportInput.addEventListener('change', async event => {
        bkImport.disabled = true
        bkImport.dataset.busy = true
        bkExport.setAttribute('style', 'transform: scaleX(0); translate: 100%; pointer-events: none;')
        gradesContainer.setAttribute('style', 'opacity: .6; pointer-events: none')
        showSnackbar("Cijfers uit back-up extraheren en plaatsen op pagina...", 3000)
        list = []
        num = 0

        let reader = new FileReader()
        reader.onload = async event => {
            list = JSON.parse(event.target.result)
            gradesContainer.innerText = ''
            let div1 = document.createElement('div')
            setAttributes(div1, { id: 'cijferoverzichtgrid', 'data-role': 'grid', class: 'cijfers-k-grid ng-isolate-scope k-grid k-widget', style: 'height: 100%' })
            gradesContainer.append(div1)
            let div2 = document.createElement('div')
            setAttributes(div2, { class: 'k-grid-content', style: 'height: 100% !important' })
            div1.append(div2)
            let table = document.createElement('table')
            setAttributes(table, { role: 'grid', 'data-role': 'selectable', class: 'k-selectable', style: 'width: auto' })
            div2.append(table)
            aside.innerText = "Deze cijfers zijn geïmporteerd uit een eerdere back-up. Niet alle informatie is beschikbaar.\n\nSelecteer een cijfer om details weer te geven."
            aside.setAttribute('style', 'background-color: var(--st-primary-background); font: 14px/30px var(--st-secondary-font-family)')

            for (let i = 0; i < list.length; i++) {
                bkImport.style.backgroundPosition = `-${(i + 1) / list.length * 100}% 0`
                item = list[i]
                await appendImportedGrade(item, gradesContainer.querySelector('table'), aside)
                    .then(() => {
                        return
                    })
            }

            gradesContainer.removeAttribute('style')
            bkImport.dataset.done = true
            setTimeout(() => {
                bkImport.removeAttribute('disabled')
                bkImport.setAttribute('style', 'right: 200px;')
                bkImport.removeAttribute('data-busy')
                bkImport.removeAttribute('data-done')
            }, 5000)
        }
        reader.readAsText(event.target.files[0])
    })
}

async function gatherExportGrade(td, gradeDetails, num) {
    return new Promise(async (resolve, reject) => {
        let timeout = 60,
            result, weight, column, title
        if (num > 1 && num % 50 === 0) timeout = 1000
        if (num > 1 && num % 100 === 0) timeout = 3000
        if (num > 1 && num % 150 === 0) timeout = 5000
        if (!td.innerText || td.innerText.trim().length < 1) return resolve({ className: td.firstElementChild?.className, type: 'filler' })
        if (td.firstElementChild?.classList.contains('text')) resolve({ className: td.firstElementChild?.className, type: 'rowheader', title: td.innerText })
        td.dispatchEvent(new Event('pointerdown', { bubbles: true }))
        td.dispatchEvent(new Event('pointerup', { bubbles: true }))
        setTimeout(() => {
            gradeDetails.childNodes.forEach(element => {
                if (element.innerText === 'Beoordeling' || element.innerText === 'Resultaat') {
                    result = element.nextElementSibling.innerText
                } else if (element.innerText === 'Weging' || element.innerText === 'Weegfactor') {
                    weight = element.nextElementSibling.innerText
                } else if (element.innerText === 'Kolomnaam' || element.innerText === 'Vak') {
                    column = element.nextElementSibling.innerText
                } else if (element.innerText === 'Kolomkop' || element.innerText === 'Omschrijving') {
                    title = element.nextElementSibling.innerText
                }
            })
            return resolve({ className: td.firstElementChild?.className, result, weight, column, type: 'grade', title })
        }, timeout)
    })
}

async function appendImportedGrade(item, container, aside) {
    return new Promise(async (resolve, reject) => {
        let tr = container.querySelector(`tr:last-child`), td, span
        switch (item.type) {
            case 'rowheader':
                tr = document.createElement('tr')
                tr.role = 'row'
                container.append(tr)
                let tdPre = document.createElement('td')
                tdPre.role = 'gridcell'
                tdPre.style.display = 'none'
                td = document.createElement('td')
                td.role = 'gridcell'
                tr.append(tdPre, td)
                span = document.createElement('span')
                span.className = item.className
                span.innerText = item.title
                td.append(span)
                break

            case 'filler':
                if (!tr) {
                    tr = document.createElement('tr')
                    tr.role = 'row'
                    container.append(tr)
                }
                td = document.createElement('td')
                td.role = 'gridcell'
                tr.append(td)
                span = document.createElement('span')
                span.className = item.className
                span.style.height = '40px'
                td.append(span)
                break

            default:
                if (!tr) {
                    tr = document.createElement('tr')
                    tr.role = 'row'
                    container.append(tr)
                }
                td = document.createElement('td')
                td.role = 'gridcell'
                td.dataset.result = item.result
                td.dataset.weight = item.weight
                td.dataset.column = item.column
                td.dataset.title = item.title
                tr.append(td)
                span = document.createElement('span')
                span.className = item.className
                span.innerText = item.result
                span.title = item.result
                td.append(span)
                td.addEventListener('click', () => {
                    document.querySelectorAll('.k-state-selected').forEach(e => e.classList.remove('k-state-selected'))
                    td.classList.add('k-state-selected')
                    aside.innerText = `Deze cijfers zijn geïmporteerd uit een eerdere back-up. Niet alle informatie is beschikbaar.\n\nResultaat: ${item.result}\nWeegfactor: ${item.weight}\nKolomnaam: ${item.column}\nKolomkop: ${item.title}`
                })
                break
        }
        resolve()
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
        zermeloA.setAttribute('href', `https://${await getSetting('magister-appbar-zermelo-url') || window.location.hostname.split('.')[0] + '.zportal.nl/app'}`)
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
    document.querySelectorAll('.st-button, [id^=st-cf-cl]').forEach(e => e.remove())

    const href = document.location.href.split('?')[0]

    if (href.endsWith('/vandaag')) today()
    else if (href.includes('/cijfers')) gradeCalculator()
    if (href.includes('/cijfers/cijferoverzicht')) gradeBackup()
    else if (href.endsWith('/studiewijzer')) studyguideList()
    else if (href.includes('/studiewijzer/')) studyguideIndividual()
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

function parseSubject(string, enabled, subjects) {
    return new Promise(async (resolve, reject) => {
        if (!enabled) resolve({ subjectAlias: '', subjectName: '', stringBefore: string, stringAfter: '', success: false })
        subjects.forEach(subjectEntry => {
            testArray = `${subjectEntry.name},${subjectEntry.aliases} `.split(',')
            testArray.forEach(testString => {
                testString = testString.toLowerCase().trim()
                if ((new RegExp(`^(${testString})$|^(${testString})[^a-z]|[^a-z](${testString})$|[^a-z](${testString})[^a-z]`, 'i')).test(string)) {
                    let stringBefore = string.replace(new RegExp(`(${testString})`, 'i'), '%%').split('%%')[0],
                        stringAfter = string.replace(new RegExp(`(${testString})`, 'i'), '%%').split('%%')[1]
                    resolve({ subjectAlias: testString, subjectName: subjectEntry.name, stringBefore, stringAfter, success: true })
                }
            })
        })
        resolve({ subjectAlias: '', subjectName: '', stringBefore: string, stringAfter: '', success: false })
    })
}

async function msToPixels(ms) {
    return new Promise(async (resolve, reject) => {
        let settingAgendaHeight = await getSetting('magister-vd-agendaHeight') || 1
        resolve(0.0000222222 * settingAgendaHeight * ms)
    })
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

function weightedPossibleMeans(valueArray, weightArray, newWeight) {
    let means = [],
        grades = []
    for (let i = 1.0; i <= 10; i += 0.1) {
        grades.push(Number(i))
        means.push(Number(weightedMean(valueArray.concat([i]), weightArray.concat([newWeight]))))
    }
    return [means, grades]
}