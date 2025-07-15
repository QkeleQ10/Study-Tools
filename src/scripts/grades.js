let statsGrades = [],
    collectedGrades = [],
    displayStatistics

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.includes('cijfers')) {
        if (document.location.href.includes('cijferoverzicht')) {
            gradeOverview()
        } else {
            gradeList()
        }
    }
}

async function gradeList() {
    await awaitElement('#cijferslaatstbehaalderesultaten-uitgebreideweergave')

    saveToStorage('viewedGrades', new Date().getTime(), 'local')

    const buttons = element('div', 'st-grades-pre-button-wrapper', document.body, { class: 'st-button-wrapper' })

    if (syncedStorage['cb']) {
        const gradeBackupButton = buttons.createChildElement('button', { class: 'st-button', innerText: i18n('cb.title'), 'data-icon': '' })
        gradeBackupButton.addEventListener('click', async () => {
            new GradeBackupDialog().show()
        })
    }

    if (syncedStorage['cc']) {
        const ccPreOpen = element('button', 'st-cc-pre-open', buttons, { class: 'st-button', innerText: i18n('cc.title'), 'data-icon': '' })
        ccPreOpen.addEventListener('click', async () => {
            document.location.hash = '#/cijfers/cijferoverzicht'
            const ccOpen = await awaitElement('#st-cc-open')
            ccOpen.click()
        })
    }
}

async function gradeOverview() {
    const buttons = element('div', 'st-grades-button-wrapper', document.body, { class: 'st-button-wrapper' })

    allowAsideResize()
    gradeCalculator(buttons)
    gradeStatistics()

    const gradeBackupButton = buttons.createChildElement('button', { class: 'st-button', innerText: i18n('cb.title'), 'data-icon': '' })
    gradeBackupButton.addEventListener('click', async () => {
        new GradeBackupDialog().show()
    })

    // Set grade type to All
    const gradeTypeSelect = await awaitElement('#idWeergave > div > div:nth-child(1) > div > div > form > div:nth-child(2) > div > span')
    gradeTypeSelect.click()
    const gradeTypeOptionAll = await awaitElement('#cijferSoortSelect_listbox > li:nth-child(1)')
    gradeTypeOptionAll.click()

    // Set column type to Column numbers
    const colTypeSelect = await awaitElement('#idWeergave > div > div:nth-child(2) > div > div > form > div > div > span')
    colTypeSelect.click()
    const colTypeOptionNums = await awaitElement('#kolomweergave_listbox > li:nth-child(2)')
    colTypeOptionNums.click()
}

async function allowAsideResize() {
    // Allow resizing aside
    let m_pos,
        asidePreferenceWidth = 294,
        asideDisplayWidth = 294

    const gradeContainer = await awaitElement('#cijfers-container'),
        aside = await awaitElement('#cijfers-container > aside'),
        asideResizer = element('div', 'st-aside-resize', document.body, { innerText: '' })

    function asideResize(e) {
        let dx = m_pos - e.x
        m_pos = e.x
        asidePreferenceWidth += dx

        asideDisplayWidth = Math.max(Math.min(600, asidePreferenceWidth), 294)
        if (asidePreferenceWidth < 100) asideDisplayWidth = 0

        aside.style.width = (asideDisplayWidth) + 'px'
        gradeContainer.style.paddingRight = (20 + asideDisplayWidth) + 'px'
        asideResizer.style.right = (asideDisplayWidth + 8) + 'px'
    }

    asideResizer.addEventListener("mousedown", function (e) {
        m_pos = e.x
        document.addEventListener("mousemove", asideResize, false)
    }, false)
    document.addEventListener("mouseup", function () {
        asidePreferenceWidth = asideDisplayWidth
        document.removeEventListener("mousemove", asideResize, false)
    }, false)
}

// Grade calculator
async function gradeCalculator(buttonWrapper) {
    if (!syncedStorage['cc']) return

    let accessedBefore = await getFromStorage('cf-calc-accessed', 'local') || false

    const aside = await awaitElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        gradesContainer = await awaitElement('.content-container-cijfers, .content-container'),
        gradeDetails = await awaitElement('#idDetails>.tabsheet .block .content dl')

    const clOpen = element('button', 'st-cc-open', buttonWrapper, { class: 'st-button', innerText: i18n('cc.title'), 'data-icon': '' }),
        clOverlay = element('div', 'st-cc', document.body, { class: 'st-overlay' }),
        clTitle = element('span', 'st-cc-title', clOverlay, { class: 'st-title', innerText: i18n('cc.title') }),
        clSubtitle = element('span', 'st-cc-subtitle', clOverlay, { class: 'st-subtitle', innerText: "Voeg cijfers toe en zie wat je moet halen of wat je gemiddelde wordt." }),
        clButtons = element('div', 'st-cc-buttons', clOverlay),
        clBugReport = element('button', 'st-cc-bugs', clButtons, { class: 'st-button icon', title: "Ervaar je problemen?", 'data-icon': '' }),
        clHelp = element('button', 'st-cc-help', clButtons, { class: 'st-button icon', title: "Hulp", 'data-icon': '' }),
        clClose = element('button', 'st-cc-close', clButtons, { class: 'st-button', innerText: "Wissen en sluiten", 'data-icon': '' }),
        clSidebar = element('div', 'st-cc-sidebar', clOverlay),
        clAdded = element('div', 'st-cc-added', clSidebar, { 'data-amount': 0 }),
        clAddedList = element('div', 'st-cc-added-list', clAdded),
        clCustomButtons = element('div', 'st-cc-custom-buttons', clAdded),
        clAddCustomResult = element('input', 'st-cf-custom-result', clCustomButtons, { class: 'st-input', type: 'number', placeholder: 'Cijfer', max: 10, step: 0.1, min: 1 }),
        clAddCustomWeight = element('input', 'st-cf-custom-weight', clCustomButtons, { class: 'st-input', type: 'number', placeholder: 'Weegfactor', min: 1 }),
        clAddCustom = element('button', 'st-cc-custom', clCustomButtons, { class: 'st-button secondary', innerText: "Eigen cijfer toevoegen", 'data-icon': '' }),
        clAveragesWrapper = element('div', 'st-cc-averages', clSidebar),
        clMean = element('div', 'st-cc-mean', clAveragesWrapper, { class: 'st-metric', 'data-description': "Gewogen gemiddelde" }),
        clMedian = element('div', 'st-cc-median', clAveragesWrapper, { class: 'st-metric secondary', 'data-description': "Mediaan" }),
        clWeight = element('div', 'st-cc-weight', clAveragesWrapper, { class: 'st-metric secondary', 'data-description': "Gewicht" }),
        clPredictionWrapper = element('div', 'st-cc-prediction', clSidebar),
        clFutureWeightLabel = element('label', 'st-cc-future-weight-label', clPredictionWrapper, { innerText: "Weegfactor:" }),
        clFutureWeightInput = element('input', 'st-cc-future-weight-input', clFutureWeightLabel, { class: 'st-input', type: 'number', placeholder: "Weegfactor", min: 1 }),
        clFutureDesc = element('p', 'st-cc-future-desc', clPredictionWrapper, { innerText: "Bereken wat je moet halen of zie wat je komt te staan." }),
        clCanvas = element('div', 'st-cc-canvas', clPredictionWrapper)

    buttonWrapper.append(clOpen)

    let years = (await magisterApi.years()).sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

    let apiGrades = {},
        gradeColumns = {},
        addedToCalculation = [],
        hypotheticalWeight,
        fallbackHypotheticalWeight,
        calcMean,
        calcMedian,
        advice

    clOpen.addEventListener('click', async () => {
        addedToCalculation = []
        clAddedList.innerText = ''
        updateCalculations()

        clOverlay.setAttribute('open', true)
        gradesContainer.setAttribute('style', 'z-index: 9999999;max-width: calc(100vw - 476px) !important;max-height: calc(100vh - 139px);position: fixed;left: 20px;top: 123px;right: 456px;bottom: 16px;')

        if (!document.querySelector('#st-cb-aside')) {
            let schoolYearId = /** @type {HTMLOptionElement} */(document.querySelector('#aanmeldingenSelect>option[selected=selected]')).value
            let schoolYear = years.find(y => y.id == schoolYearId)
            apiGrades[schoolYearId] ??= await magisterApi.gradesForYear(schoolYear)
        }
        if (!accessedBefore) {
            await notify('dialog', "Welkom bij de nieuwe cijfercalculator!\n\nJe kunt cijfers toevoegen door ze aan te klikken. Je kunt ook de naam van een vak aanklikken om meteen alle cijfers\nvan dat vak toe te voegen aan de berekening. Natuurlijk kun je ook handmatig cijfers toevoegen.")
            accessedBefore = true
            saveToStorage('cf-calc-accessed', true, 'local')
        }
        if (!localStorage['cc-accessed']) {
            new Dialog({
                innerText: "De afgelopen tijd zijn er wat problemen geweest bij het toevoegen van cijfers. \n\nDat is hopelijk nu opgelost. Sorry voor het ongemak! \n\nLaat het me weten als je nog steeds problemen ondervindt.",
                buttons: [
                    { innerText: "E-mail verzenden", onclick: `window.open('mailto:quinten@althues.nl')` },
                    { innerText: "Discord", onclick: `window.open('https://discord.gg/2rP7pfeAKf')` }
                ]
            }).show();
            localStorage['cc-accessed'] = true;
        }
    })

    clClose.addEventListener('click', () => {
        gradesContainer.removeAttribute('style')
        clOverlay.removeAttribute('open')
        createStyle('', 'st-calculation-added')
    })

    clBugReport.addEventListener('click', () => {
        notify(
            'dialog',
            "Ervaar je problemen met de cijfercalculator?\n\nJe kunt nog steeds handmatig je cijfers toevoegen. Stuur me ook even een berichtje of een mailtje om me te laten weten wat er misgaat. Zo kan ik het oplossen!",
            [
                { innerText: "E-mail verzenden", onclick: `window.open('mailto:quinten@althues.nl')` },
                { innerText: "Discord", onclick: `window.open('https://discord.gg/2rP7pfeAKf')` }
            ]
        )
    })

    clHelp.addEventListener('click', async () => {
        await notify('dialog', "Welkom in de cijfercalculator!\n\nMet de cijfercalculator kun je gemakkelijk zien wat je moet halen of wat je gemiddelde zou kunnen worden.", null, null, { index: 1, length: 3 })

        await notify('dialog', "Je kunt cijfers toevoegen aan de berekening door ze aan te klikken in het cijferoverzicht.\n\nJe kunt ook de naam van een vak aanklikken om meteen alle cijfers van dat vak toe te voegen. Handig!\n\nNatuurlijk kun je ook handmatig cijfers toevoegen. Dat kan in het paneel aan de rechterkant.", null, null, { index: 2, length: 3 })

        await notify('dialog', "In het zijpaneel zie je alle cijfers die je hebt toegevoegd, samen met wat centrummaten.\n\nHelemaal onderin zie je een diagram. Die geeft op de x-as de cijfers 1 t/m 10 weer, met op de y-as de \ngemiddelden die je zou kunnen komen te staan als je voor je volgende cijfer x haalt. Vergeet niet \nom de weegfactor goed in te stellen.", null, null, { index: 3, length: 3 })
    })

    gradesContainer.addEventListener('click', async (event) => {
        if (!clOverlay.hasAttribute('open')) return

        if (event.target.closest('td:nth-child(2)')) {
            // If this is true, a subject title has been clicked. Add every belonging grade to the calculation.
            const gradeElements = event.target.closest('td:nth-child(2)').parentElement.querySelectorAll('.grade[id]:not(.empty)')
            for (const elem of gradeElements) {
                const result = Number(elem?.title?.replace(',', '.'))

                if (
                    result && !isNaN(result) &&
                    result >= 1 && result <= 10 &&
                    !(
                        elem.classList.contains('gemiddeldecolumn') &&
                        !elem.classList.contains('heeftonderliggendekolommen') &&
                        !elem.classList.contains('herkansingKolom')
                    )
                ) {
                    await addOrRemoveGrade(elem.id, true)
                } else {
                    elem.classList.add('st-cannot-add')
                    setTimeout(() => elem.classList.remove('st-cannot-add'), 500)
                    createStyle(Array.from(clAddedList.children).map(element => `span.grade[id="${element.dataset.id}"]`).join(', ') + ` {box-shadow: inset -0.5px 0 0 4px var(--st-accent-ok) !important;}`, 'st-calculation-added')
                }
            }
        } else {
            const gradeElement = event.target.closest('.grade[id]:not(.empty)')
            if (gradeElement) await addOrRemoveGrade(gradeElement.id)
        }

    })

    function addOrRemoveGrade(id, lowVerbosity) {
        return new Promise(async (resolve) => {
            const alreadyAddedElement = clAddedList.querySelector(`.st-cc-added-element[data-id="${id}"]`)
            if (alreadyAddedElement) {
                alreadyAddedElement.click()
                return resolve()
            }

            const gradeElement =  /** @type {HTMLElement} */(document.querySelector(`.grade[id="${id}"]`))

            let ghostSourcePosition = gradeElement.getBoundingClientRect()
            const ghostElement = element('span', null, document.body, {
                class: 'st-cf-ghost',
                innerText: gradeElement.title,
                style: `top: ${ghostSourcePosition.top}px; right: ${window.innerWidth - ghostSourcePosition.right}px; background-color: ${window.getComputedStyle(gradeElement).backgroundColor}; color: ${window.getComputedStyle(gradeElement).color}`
            })
            setTimeout(() => { if (ghostElement) ghostElement.remove() }, 5000)

            let result = Number(gradeElement.title.replace(',', '.')),
                weight,
                column = '?',
                title = '?'

            if (gradeElement.parentElement.dataset.weight && gradeElement.parentElement.dataset.column && gradeElement.parentElement.dataset.title) {
                weight = Number(gradeElement.parentElement.dataset.weight)
                column = gradeElement.parentElement.dataset.column
                title = gradeElement.parentElement.dataset.title
            } else {
                let schoolYearId = /** @type {HTMLOptionElement} */(document.querySelector('#aanmeldingenSelect>option[selected=selected]')).value
                let gradeColumnId = apiGrades[schoolYearId].find(item => `${item.Vak.Afkorting}_${item.CijferKolom.KolomNummer}_${item.CijferKolom.KolomNummer}` === id || `${item.Vak.Afkorting}_${item.CijferKolom.KolomKop}_${item.CijferKolom.KolomNummer}` === id).CijferKolom.Id
                gradeColumns[gradeColumnId] ??= await magisterApi.gradesColumnInfo({ id: schoolYearId }, gradeColumnId)
                weight = gradeColumns[gradeColumnId].Weging
                gradeElement.parentElement.dataset.weight = weight
                column = gradeColumns[gradeColumnId].KolomNaam
                gradeElement.parentElement.dataset.column = column
                title = gradeColumns[gradeColumnId].KolomOmschrijving
                gradeElement.parentElement.dataset.title = title
            }

            if (!result || isNaN(result) || isNaN(weight) || result < 1 || result > 10) {
                ghostElement.remove()
                if (!lowVerbosity) notify('snackbar', 'Dit cijfer kan niet worden toegevoegd aan de berekening.')
                gradeElement.classList.add('st-cannot-add')
                setTimeout(() => gradeElement.classList.remove('st-cannot-add'), 500)
                return resolve()
            }
            if (!weight || weight <= 0) {
                ghostElement.remove()
                if (!lowVerbosity) notify('snackbar', 'Dit cijfer telt niet mee en is niet toegevoegd aan de berekening.')
                gradeElement.classList.add('st-cannot-add')
                setTimeout(() => gradeElement.classList.remove('st-cannot-add'), 500)
                return resolve()
            }

            let addedElement = element('span', null, clAddedList, {
                class: 'st-cc-added-element',
                innerText: `${result.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}×) — ${column}, ${title}\n`,
                'data-insufficient': result < Number(syncedStorage['suf-threshold']),
                'data-type': 'table',
                'data-id': id
            })
            addedElement.addEventListener('click', event => {
                addedToCalculation = addedToCalculation.filter(item => item.id !== id)
                event.target.classList.add('remove')
                setTimeout(() => {
                    event.target.remove()
                    createStyle(Array.from(clAddedList.children).map(element => `span.grade[id="${element.dataset.id}"]`).join(', ') + ` {box-shadow: inset -0.5px 0 0 4px var(--st-accent-ok) !important;}`, 'st-calculation-added')
                }, 100)
                updateCalculations()
            })
            addedElement.scrollIntoView({ behavior: 'smooth' })
            createStyle(Array.from(clAddedList.children).map(element => `span.grade[id="${element.dataset.id}"]`).join(', ') + ` {box-shadow: inset -0.5px 0 0 4px var(--st-accent-ok) !important;}`, 'st-calculation-added')

            let ghostTargetPosition = addedElement.getBoundingClientRect()
            ghostElement.style.top = `${ghostTargetPosition.top}px`
            ghostElement.style.right = `${window.innerWidth - ghostTargetPosition.right}px`
            ghostElement.classList.add('st-cf-ghost-moving')
            setTimeout(() => ghostElement.remove(), 400)

            addedToCalculation.push({ id, result, weight })
            updateCalculations()
            return resolve()
        })
    }

    clAddCustom.addEventListener('click', event => {
        let id = Date.now()
        let result = Number(clAddCustomResult.value.replace(',', '.'))
        let weight = Number(clAddCustomWeight.value.replace(',', '.'))

        if (isNaN(result)) return notify('snackbar', 'Geef een geldig cijfer op.')
        if (result < 1) return notify('snackbar', 'Een cijfer kan niet lager zijn dan 1,0.')
        if (result > 10) return notify('snackbar', 'Een cijfer kan niet hoger zijn dan 10,0.')
        if (isNaN(weight) || weight <= 0) {
            weight = 1
            notify('snackbar', '1× genomen als weegfactor.')
        }

        let addedElement = element('span', null, clAddedList, {
            class: 'st-cc-added-element',
            innerText: `${result.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}×) — handmatig ingevoerd\n`,
            'data-insufficient': result < Number(syncedStorage['suf-threshold']),
            'data-type': 'manual',
            'data-id': id
        })
        addedElement.addEventListener('click', event => {
            addedToCalculation = addedToCalculation.filter(item => item.id !== id)
            event.target.classList.add('remove')
            setTimeout(() => event.target.remove(), 100)
            updateCalculations()
        })
        addedElement.scrollIntoView({ behavior: 'smooth' })

        addedToCalculation.push({ id, result, weight })
        updateCalculations()
    })

    clFutureWeightInput.addEventListener('input', async () => {
        hypotheticalWeight = Number(clFutureWeightInput.value)
        if (isNaN(hypotheticalWeight) || hypotheticalWeight < 1) {
            hypotheticalWeight = null
            clFutureWeightInput.value = null
        }
        updateCalculations()
    })

    clCanvas.addEventListener('mousemove', event => {
        if (addedToCalculation.length < 1) return

        const hoverX = /** @type {HTMLElement} */(document.querySelector('#st-cc-canvas-x')),
            hoverY = /** @type {HTMLElement} */(document.querySelector('#st-cc-canvas-y'))

        let mouseLeftPart = (event.pageX - event.currentTarget.offsetLeft) / event.currentTarget.offsetWidth
        let hypotheticalGrade = Math.round(0.9 * mouseLeftPart * 100 + 10) / 10

        hoverX.dataset.grade = hypotheticalGrade.toString()
        hoverX.style.setProperty('--grade', hypotheticalGrade.toString())

        let hypotheticalMean = weightedPossibleMeans(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight), hypotheticalWeight || fallbackHypotheticalWeight)[0][Math.round(0.9 * mouseLeftPart * 100)]

        hoverY.dataset.grade = hypotheticalMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        hoverY.style.setProperty('--grade', hypotheticalMean.toString())

        if (hypotheticalMean.toFixed(2) === calcMean.toFixed(2)) {
            clFutureDesc.innerText = `Als je een ${hypotheticalGrade.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, \ndan blijf je gemiddeld een ${hypotheticalMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} staan.`
        } else if (hypotheticalMean > calcMean) {
            clFutureDesc.innerText = `Als je een ${hypotheticalGrade.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, \ndan stijgt je gemiddelde tot een ${hypotheticalMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        } else {
            clFutureDesc.innerText = `Als je een ${hypotheticalGrade.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, \ndan daalt je gemiddelde tot een ${hypotheticalMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        }
        clFutureDesc.style.color = hypotheticalMean < Number(syncedStorage['suf-threshold']) ? 'var(--st-accent-warn)' : 'var(--st-foreground-primary)'
    })

    clCanvas.addEventListener('mouseleave', event => {
        advice = formulateGradeAdvice()
        clFutureDesc.innerText = advice.text || "Bereken wat je moet halen of zie wat je komt te staan."
        clFutureDesc.style.color = advice.color === 'warn' ? 'var(--st-accent-warn)' : 'var(--st-foreground-primary)'
    })

    function updateCalculations() {
        calcMean = calculateMean(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight))
        calcMedian = calculateMedian(addedToCalculation.map(item => item.result))
        clMean.innerText = isNaN(calcMean)
            ? '?'
            : calcMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        clMedian.innerText = isNaN(calcMedian)
            ? '?'
            : calcMedian.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        clWeight.innerText = addedToCalculation.map(item => item.weight).reduce((acc, curr) => acc + curr, 0) + '×'

        clAdded.dataset.amount = addedToCalculation.length

        if (calcMean < Number(syncedStorage['suf-threshold'])) clMean.classList.add('insufficient')
        else clMean.classList.remove('insufficient')

        fallbackHypotheticalWeight = Math.round(calculateMedian(addedToCalculation.map(item => item.weight)) || 1)
        clFutureWeightInput.placeholder = fallbackHypotheticalWeight + '×'

        advice = formulateGradeAdvice()
        clFutureDesc.innerText = advice.text || "Bereken wat je moet halen of zie wat je komt te staan."
        clFutureDesc.style.color = advice.color === 'warn' ? 'var(--st-accent-warn)' : 'var(--st-foreground-primary)'
        renderGradeChart()
    }

    function renderGradeChart() {
        clCanvas.dataset.irrelevant = addedToCalculation.length < 1

        let minGrade = weightedPossibleMeans(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight), hypotheticalWeight || fallbackHypotheticalWeight)[0][0],
            maxGrade = weightedPossibleMeans(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight), hypotheticalWeight || fallbackHypotheticalWeight)[0][90]

        const line = element('div', 'st-cc-canvas-line', clCanvas, {
            'data-min-grade': minGrade.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'data-min-grade-insufficient': minGrade < Number(syncedStorage['suf-threshold']),
            'data-max-grade': maxGrade.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'data-max-grade-insufficient': maxGrade < Number(syncedStorage['suf-threshold']),
            style: `--min-grade: ${minGrade}; --max-grade: ${maxGrade};`
        })

        const currentMean = element('div', 'st-cc-canvas-mean', clCanvas, {
            'data-grade': calcMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            style: `--grade: ${calcMean}`
        })

        let hoverX = element('div', 'st-cc-canvas-x', clCanvas)
        let hoverY = element('div', 'st-cc-canvas-y', clCanvas)
    }

    function weightedPossibleMeans(valueArray, weightArray, newWeight = 1) {
        let means = [],
            grades = []
        for (let i = 1.0; i <= 10; i += 0.1) {
            grades.push(Number(i))
            means.push(Number(calculateMean(valueArray.concat([i]), weightArray.concat([newWeight]))))
        }
        return [means, grades]
    }

    function formulateGradeAdvice() {
        let means = weightedPossibleMeans(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight), hypotheticalWeight || fallbackHypotheticalWeight),
            weight = hypotheticalWeight || fallbackHypotheticalWeight,
            mean = calcMean

        let text = "Bereken wat je moet halen of zie wat je komt te staan. Voeg eerst cijfers toe aan de berekening.",
            color = 'normal'

        if (addedToCalculation.length < 1) return { text, color }

        const hypotheticalMeans = means[0],
            hypotheticalGrades = means[1]
        const minimumMean = Math.min(...hypotheticalMeans)

        for (let i = 0; i < hypotheticalMeans.length; i++) {
            let meanH = hypotheticalMeans[i],
                gradeH = hypotheticalGrades[i] || 1.0
            if (meanH >= (Number(syncedStorage['suf-threshold']) - 0.005)) {
                color = 'normal'
                text = `Haal een ${gradeH.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} of hoger die ${weight}× meetelt\nom een voldoende ${mean < Number(syncedStorage['suf-threshold']) ? 'komen te' : 'te blijven'} staan.`
                if (gradeH <= 1.0) {
                    text = `Met een cijfer dat ${weight}× meetelt\nkun je niet lager komen te staan dan een ${minimumMean.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
                } else if (gradeH > 9.9) {
                    text = `Haal een 10,0 die ${weight}× meetelt\nom een voldoende ${mean < Number(syncedStorage['suf-threshold']) ? 'komen te' : 'te blijven'} staan.`
                }
                break
            } else {
                color = 'warn'
                text = `Met een cijfer dat ${weight}× meetelt\nkun je geen voldoende komen te staan.`
            }
        }

        return { text, color }
    }

}

class GradeBackupDialog extends Dialog {
    years = [];
    busy = false;
    #progressBar;
    #column1;
    #column2;

    constructor() {
        super();

        this.body.classList.add('st-grade-backup-dialog');

        this.#column1 = createElement('div', this.body, { class: 'st-dialog-column' });
        this.#column1.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cb.export') });

        this.#column2 = createElement('div', this.body, { class: 'st-dialog-column' });
        this.#column2.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cb.import') });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

        this.#initialise();
    }

    async #initialise() {
        const input = this.#column2.createChildElement('input', { type: 'file', accept: '.json' })
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const json = JSON.parse(typeof e.target.result === 'string' ? e.target.result : new TextDecoder().decode(e.target.result));
                await this.#importBackup(json);
            };
            reader.readAsText(file);
        });

        years = (await magisterApi.years()).sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

        years.forEach((year, i, a) => {
            this.#column1.createChildElement('button', {
                class: i === a.length - 1 ? 'st-button' : 'st-button secondary',
                innerText: `${year.studie.code} (lesperiode ${year.lesperiode.code}, ${year.groep.omschrijving || year.groep.code})`,
            })
                .addEventListener('click', async () => {
                    if (this.busy) return;
                    this.#exportGrades(year);
                });
        })

        this.#progressBar.dataset.visible = 'false';
    }

    async #exportGrades(year) {
        return new Promise(async (resolve, reject) => {
            try {

                this.busy = true;
                this.#column1.classList.add('st-disabled');

                const grades = await this.#gatherGrades(year);

                this.#progressBar.dataset.visible = 'true';

                let uri = `data:application/json;base64,${window.btoa(unescape(encodeURIComponent(JSON.stringify(
                    {
                        date: new Date(),
                        year: { groep: { omschrijving: year.groep.omschrijving, code: year.groep.code }, studie: { code: year.studie.code }, lesperiode: { code: year.lesperiode.code } },
                        grades
                    }
                ))))}`,
                    a = element('a', 'st-cb-temp', document.body, {
                        download: `Cijferback-up ${year.studie.code} (${year.lesperiode.code}) ${(new Date).toLocaleString()}`,
                        href: uri,
                        type: 'application/json'
                    });
                a.click();
                a.remove();

                setTimeout(() => {
                    this.#progressBar.dataset.visible = 'false';
                }, 500);

                setTimeout(() => {
                    this.#column1.classList.remove('st-disabled');
                    this.busy = false;
                    resolve();
                }, 10000)

            } catch (error) {
                reject(error);
                this.close();
                new Dialog({ innerText: i18n('cb.error') }).show();
            }
        });
    }

    async #gatherGrades(year) {
        return new Promise(async (resolve, reject) => {
            try {
                this.#progressBar.firstElementChild.classList.remove('indeterminate');
                this.#progressBar.dataset.visible = 'true';

                const grades = await magisterApi.gradesForYear(year);

                for (let i = 0; i < grades.length; i++) {
                    this.#progressBar.firstElementChild.style.width = `${(i / grades.length) * 100}%`;

                    await new Promise(resolve => setTimeout(resolve, (i > 0 && i % 100 === 0) ? 8000 : grades.length > 100 ? 20 : 5));

                    const gradeColumnInfo = await magisterApi.gradesColumnInfo(year, grades[i].CijferKolom.Id);

                    grades[i] = {
                        ...grades[i],
                        CijferKolom: { ...grades[i].CijferKolom, ...gradeColumnInfo }
                    }
                }

                this.#progressBar.firstElementChild.removeAttribute('style');
                this.#progressBar.firstElementChild.classList.add('indeterminate');
                this.#progressBar.dataset.visible = 'false';

                resolve(grades);
            } catch (error) {
                reject(error);
            }
        });
    }

    async #importBackup(json) {
        const { date, year, grades } = json;

        collectedGrades.unshift({
            title: `Back-up van ${year.studie.code} (${year.lesperiode.code}) ${date.toLocaleString()}`,
            grades
        })

        const contentContainer = await awaitElement('section.main>div');
        contentContainer.querySelectorAll('*').forEach(child => { child.style.display = 'none'; });

        const asideDetails = await awaitElement('#idDetails>.tabsheet>div[ng-transclude]');
        asideDetails.querySelectorAll('*').forEach(child => { child.style.display = 'none'; });

        drawGradeTable(grades, contentContainer, (grade, event) => {
            
        });
    }
}

function drawGradeTable(grades, parentElement, gradeClicked) {
    const sortedColumns = grades.sort((a, b) => a.CijferPeriode?.VolgNummer - b.CijferPeriode?.VolgNummer || Number(a.CijferKolom?.KolomVolgNummer) - Number(b.CijferKolom?.KolomVolgNummer));
    const gradePeriods = [...new Set(sortedColumns.map(g => g.CijferPeriode?.Naam))];
    const gradeColumns = [...new Set(sortedColumns.map(g => g.CijferKolom?.KolomNummer))];
    const gradeSubjects = [...new Set(grades.sort((a, b) => a.Vak?.Volgnr - b.Vak?.Volgnr).map(g => g.Vak?.Omschrijving))];

    const table = parentElement.createChildElement('table', { class: 'st-grade-table' });

    const headerRow1 = table.createChildElement('tr');
    headerRow1.createChildElement('th');
    for (const period of gradePeriods) {
        const numColumns = new Set(sortedColumns.filter(col => col.CijferPeriode?.Naam === period).map(g => g.CijferKolom?.KolomNummer)).size;
        console.log(numColumns);
        headerRow1.createChildElement('th', { innerText: period, colSpan: numColumns });
    }

    const headerRow2 = table.createChildElement('tr');
    headerRow2.createChildElement('th');
    for (const column of gradeColumns) {
        headerRow2.createChildElement('th', { innerText: column });
    }

    for (const subject of gradeSubjects) {
        const subjectRow = table.createChildElement('tr');
        subjectRow.createChildElement('th', { innerText: subject });

        for (const column of gradeColumns) {
            const grade = grades.find(g => g.Vak?.Omschrijving === subject && g.CijferKolom?.KolomNummer === column);
            if (grade) {
                subjectRow.createChildElement('td', {
                    innerText: grade.CijferStr, classList: [
                        ['insufficient', grade.IsVoldoende === false],
                        ['inh', grade.Inhalen],
                        ['vr', grade.Vrijstelling],
                        ['not-counted', grade.TeltMee === false],
                        [`column-type-${grade.CijferKolom?.KolomSoort}`, true],
                        ['column-resit', grade.CijferKolom?.IsHerkansingKolom],
                        ['column-teacher', grade.CijferKolom?.IsDocentKolom],
                        ['column-underlying', grade.CijferKolom?.HeeftOnderliggendeKolommen],
                        ['column-pta', grade.CijferKolom?.IsPTAKolom],
                    ].filter(c => c[1]).map(c => c[0])
                })
                    .addEventListener('click', (event) => {
                        if (gradeClicked) {
                            gradeClicked(grade, event);
                        }
                    });
            } else {
                subjectRow.createChildElement('td', { class: 'empty' });
            }
        }
    }
}

// Grade backup
async function gradeBackup(buttonWrapper) {
    if (!syncedStorage['cb']) return
    const aside = await awaitElement('#cijfers-container > aside'),
        asideContent = await awaitElement('#cijfers-container > aside > .content-container'),
        gradesContainer = await awaitElement('.content-container-cijfers, .content-container'),
        gradeBackupButton = element('button', 'st-cb', buttonWrapper, { class: 'st-button', 'data-icon': '', innerText: i18n('cb.title') })

    gradeBackupButton.addEventListener('click', async () => {
        new GradeBackupDialog().show()
    })
}

// Grade statistics
async function gradeStatistics() {
    if (!syncedStorage['cs']) return
    const aside = await awaitElement('#cijfers-container > aside'),
        asideContent = await awaitElement('#cijfers-container > aside > .content-container'),
        tabs = await awaitElement('#cijfers-container > aside > div.head-bar > ul'),
        scTab = element('li', 'st-cs-tab', tabs, { class: 'st-tab asideTrigger' }),
        scTabLink = element('a', 'st-cs-tab-link', scTab, { innerText: i18n('cs.title') })

    const scContainer = element('div', 'st-cs', aside, { class: 'st-sheet', 'data-visible': 'false' }),
        scFilterButton = element('button', 'st-cs-filter-button', scContainer, { class: 'st-button icon primary', 'data-icon': '', title: "Leerjaren en vakken selecteren" }),
        scFilterButtonTooltip = element('div', 'st-cs-filter-button-tooltip', scContainer, { innerText: "Selecteer hier welke vakken en leerjaren worden getoond!" })

    const scStats = element('div', 'st-cs-stats', scContainer),
        scStatsHeading = element('span', 'st-cs-stats-heading', scStats, { innerText: i18n('cs.title'), 'data-amount': 0 }),
        scStatsInfo = element('span', 'st-cs-stats-info', scStats, { innerText: "Laden..." })

    const scCentralTendencies = element('div', 'st-cs-central-tendencies', scStats),
        scWeightedMean = element('div', 'st-cs-weighted-mean', scCentralTendencies, { class: 'st-metric', 'data-description': "Gemiddelde", title: "De gemiddelde waarde met weegfactoren." }),
        scUnweightedMean = element('div', 'st-cs-unweighted-mean', scCentralTendencies, { class: 'st-metric', 'data-description': "Ongewogen gemiddelde", title: "De gemiddelde waarde, zonder weegfactoren." }),
        scMedian = element('div', 'st-cs-median', scCentralTendencies, { class: 'st-metric secondary', 'data-description': "Mediaan", title: "De middelste waarde, wanneer je alle cijfers van laag naar hoog op een rijtje zou zetten.\nBij een even aantal waarden: het gemiddelde van de twee middelste waarden." }),
        scMode = element('div', 'st-cs-mode', scCentralTendencies, { class: 'st-metric secondary', 'data-description': "Modus", title: "De waarde die het meest voorkomt." })

    const scSufInsuf = element('div', 'st-cs-suf-insuf', scStats),
        scSufficient = element('div', 'st-cs-sufficient', scSufInsuf, { class: 'st-metric secondary', 'data-description': "Voldoendes", title: "Het aantal cijfers hoger dan of gelijk aan de voldoendegrens." }),
        scSufInsufChart = element('div', 'st-cs-suf-insuf-chart', scSufInsuf, { class: 'donut', title: "Het percentage cijfers hoger dan of gelijk aan de voldoendegrens." }),
        scInsufficient = element('div', 'st-cs-insufficient', scSufInsuf, { class: 'st-metric secondary', 'data-description': "Onvoldoendes", title: "Het aantal cijfers lager dan de voldoendegrens." }),
        scSufInsufDisclaimer = element('div', 'st-cs-suf-insuf-disclaimer', scSufInsuf, { innerText: `Voldoende: ≥ ${Number(syncedStorage['suf-threshold']).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` })

    const scRoundedHeading = element('span', 'st-cs-rounded-heading', scStats, { class: 'st-section-heading', innerText: "Afgerond behaalde cijfers" }),
        scRoundedChart = element('div', 'st-cs-rounded-chart', scStats)

    const scHistory = element('div', 'st-cs-history', scStats),
        scHistoryHeading = element('span', 'st-cs-history-heading', scHistory, { class: 'st-section-heading', innerText: "Behaalde cijfers" }),
        scMin = element('div', 'st-cs-min', scHistory, { class: 'st-metric secondary', 'data-description': "Laagste cijfer", title: "Het laagst behaalde cijfer." }),
        scMax = element('div', 'st-cs-max', scHistory, { class: 'st-metric secondary', 'data-description': "Hoogste cijfer", title: "Het hoogst behaalde cijfer." }),
        scVariance = element('div', 'st-cs-variance', scHistory, { class: 'st-metric secondary', 'data-description': "Variantie", title: "De gemiddelde afwijking van alle meetwaarden tot de gemiddelde waarde." }),
        scLineChart = element('div', 'st-cs-history-chart', scHistory, { style: `--suf-threshold-p: ${(1 - ((Number(syncedStorage['suf-threshold']) - 1) / 9)) * 100}%` })

    const scFilters = element('div', 'st-cs-filters', scContainer),
        scFiltersHeading = element('span', 'st-cs-filters-heading', scFilters, { innerText: i18n('cs.filters') }),
        scYearFilterHeading = element('span', 'st-cs-year-filter-heading', scFilters, { innerText: i18n('cs.years') }),
        scYearFilter = element('div', 'st-cs-year-filter', scFilters),
        scSubjectFilterAll = element('button', 'st-cs-subject-filter-all', scFilters, { class: 'st-button icon', 'data-icon': '', title: "Selectie omkeren" }),
        scSubjectFilter = element('div', 'st-cs-subject-filter', scFilters)

    let years = [],
        gatheredYears = new Set(),
        includedYears = new Set(),
        subjects = new Set(),
        excludedSubjects = new Set()


    tabs.addEventListener('click', (event) => {
        let scTabClicked = event.target.id.startsWith('st-cs-tab')
        if (scTabClicked) {
            scTab.classList.add('active')
            scContainer.dataset.visible = true
            asideContent.style.display = 'none'
        } else {
            scTab.classList.remove('active')
            scContainer.dataset.visible = false
            if (!tabs.querySelector('.st-tab.active')) asideContent.style.display = ''
        }
    })

    scFilterButton.addEventListener('click', () => {
        scFilterButtonTooltip.classList.add('hidden')
        if ((scContainer.dataset.filters == 'true')) {
            scContainer.dataset.filters = false
        } else {
            scContainer.dataset.filters = true
        }
    })

    scSubjectFilterAll.addEventListener('click', () => {
        [...scSubjectFilter.children].forEach(e => e.click())
    })

    // Gather all years and populate the year filter
    years = (await magisterApi.years()).sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())
    years.forEach(async (year, i, a) => {
        let label = element('label', `st-cs-year-${year.id}-label`, scYearFilter, { class: 'st-checkbox-label', for: `st-cs-year-${year.id}`, innerText: year.studie.code.match(/\d/gi)?.[0], title: `${year.groep.omschrijving || year.groep.code} (${year.studie.code} in ${year.lesperiode.code})` })
        if (!(label.innerText?.length > 0)) label.innerText = i + 1
        let input = element('input', `st-cs-year-${year.id}`, label, { class: 'st-checkbox-input', type: 'checkbox' })


        if (i === a.length - 1) {
            input.checked = true
            let yearGrades = (await magisterApi.gradesForYear(year))
                .filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.'))) && (Number(grade.CijferStr.replace(',', '.')) <= 10) && (Number(grade.CijferStr.replace(',', '.')) >= 1))
                .filter((grade, index, self) =>
                    index === self.findIndex((g) =>
                        g.CijferKolom.KolomKop === grade.CijferKolom.KolomKop &&
                        g.CijferKolom.KolomNaam === grade.CijferKolom.KolomNaam &&
                        g.CijferStr === grade.CijferStr
                    )
                )
                .sort((a, b) => new Date(a.DatumIngevoerd).getTime() - new Date(b.DatumIngevoerd).getTime())
            statsGrades.push(...yearGrades.filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.')))).map(e => ({ ...e, result: Number(e.CijferStr.replace(',', '.')), year: year.id })))

            let yearSubjects = statsGrades.filter(e => e.year === year.id).map(e => e.Vak.Omschrijving)
            subjects = new Set([...subjects, ...yearSubjects])

            gatheredYears.add(year.id)
            includedYears.add(year.id)

            buildSubjectFilter()
            displayStatistics()
        }

        label.addEventListener('contextmenu', (event) => {
            event.preventDefault()
            scYearFilter.querySelectorAll('input').forEach(child => {
                if (child.checked) child.click()
            })
            input.click()
        })

        input.addEventListener('input', async () => {
            if (!gatheredYears.has(year.id)) {
                let yearGrades = (await magisterApi.gradesForYear(year))
                statsGrades.push(...yearGrades.filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.')))).map(e => ({ ...e, result: Number(e.CijferStr.replace(',', '.')), year: year.id })))

                gatheredYears.add(year.id)
            }

            input.checked ? includedYears.add(year.id) : includedYears.delete(year.id)

            let yearSubjects = statsGrades.filter(e => e.year === year.id).map(e => e.Vak.Omschrijving)
            subjects = new Set([...subjects, ...yearSubjects])

            buildSubjectFilter()
            displayStatistics()
        })
    })

    function buildSubjectFilter() {
        scSubjectFilter.innerText = ''

        subjects = new Set([...subjects]
            .filter(subject => statsGrades.filter(e => includedYears.has(e.year)).find(e => e.Vak.Omschrijving === subject))
            .sort((a, b) => a.localeCompare(b, locale, { sensitivity: 'base' })))

        let subjectsArray = [...subjects]
        subjectsArray.forEach(subjectName => {
            let label = element('label', `st-cs-subject-${subjectName}-label`, scSubjectFilter, { class: 'st-checkbox-label', for: `st-cs-subject-${subjectName}`, innerText: subjectName })
            let input = element('input', `st-cs-subject-${subjectName}`, label, { class: 'st-checkbox-input', type: 'checkbox' })
            input.checked = !excludedSubjects.has(subjectName)

            input.addEventListener('input', async () => {
                excludedSubjects.has(subjectName) ? excludedSubjects.delete(subjectName) : excludedSubjects.add(subjectName)
                displayStatistics()
            })

            label.addEventListener('contextmenu', (event) => {
                event.preventDefault()
                scSubjectFilter.querySelectorAll('input').forEach(child => {
                    if (child.checked) child.click()
                })
                input.click()
            })
        })

        let excludedSubjectsArray = [...excludedSubjects]
        excludedSubjects = new Set(excludedSubjectsArray.filter(e => subjects.has(e)))
    }

    function filterGrades() {
        const filtered = statsGrades
            // Remove grades that don't match filter
            .filter(e =>
                includedYears.has(e.year) &&
                !excludedSubjects.has(e.Vak.Omschrijving)
            )
            // Remove any duplicates (based on column num, column name and result)
            .filter((grade, index, self) =>
                index === self.findIndex((g) =>
                    g.CijferKolom.KolomKop === grade.CijferKolom.KolomKop &&
                    g.CijferKolom.KolomNaam === grade.CijferKolom.KolomNaam &&
                    g.CijferStr === grade.CijferStr
                )
            )
            // Sort from old to new
            .sort((a, b) => new Date(a.DatumIngevoerd).getTime() - new Date(b.DatumIngevoerd).getTime())
        return filtered
    }

    displayStatistics = async (fromBackup = false) => {
        return new Promise(async (resolve, reject) => {
            scContainer.classList.remove('empty')
            scContainer.classList.remove('with-weights')
            scUnweightedMean.classList.remove('secondary')

            let includedSubjects = [...subjects]
                .filter(subject => !excludedSubjects.has(subject))
                .sort((a, b) => a.localeCompare(b, locale, { sensitivity: 'base' }))

            let filteredGrades = []

            if (fromBackup) {
                filteredGrades = statsGrades
                    .filter(grade => !isNaN(grade.result) && grade.weight > 0 && grade.className !== 'grade gemiddeldecolumn' && grade.result >= 1 && grade.result <= 10)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                scStatsHeading.dataset.amount = filteredGrades.length

                scStatsInfo.innerText = "Statistieken kunnen in Magister niet cor-\nrect worden weergegeven voor back-ups."
            } else {
                filteredGrades = filterGrades()
                scStatsHeading.dataset.amount = filteredGrades.length

                let yearsText = new Intl.ListFormat(locale, {
                    style: 'short',
                    type: 'conjunction',
                }).format(
                    [...includedYears]
                        .sort((idA, idB) => new Date(years.find(y => y.id === idA).begin).getTime() - new Date(years.find(y => y.id === idB).begin).getTime())
                        .map(id => years.find(y => y.id === id).studie.code)
                )
                if (includedYears.size === 1 && includedYears.has(years.at(-1).id)) yearsText = `Dit leerjaar (${years.at(-1)?.studie?.code})`
                else if (includedYears.size === years.length) yearsText = `Alle ${years.length} leerjaren (${years.at(-1)?.studie?.code} t/m ${years.at(0)?.studie?.code})`

                let subjectsText = includedSubjects.join(', ')
                if (includedSubjects.length > 3) subjectsText = `${includedSubjects.length} van de ${subjects.size} vakken`
                if (excludedSubjects.size === 1) subjectsText = `Alle ${subjects.size} vakken behalve ${[...excludedSubjects][0]}`
                if (excludedSubjects.size === 0) subjectsText = `Alle ${subjects.size} vakken`

                scStatsInfo.innerText = [yearsText, subjectsText].join('\n')
            }


            if (filteredGrades.length < 1) {
                scContainer.dataset.filters = true
                scContainer.classList.add('empty')
                return
            }

            let filteredResults = filteredGrades.map(grade => grade.result),
                roundedFrequencies = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }

            filteredResults.forEach(result => roundedFrequencies[Math.round(result)]++)


            let unweightedMean = calculateMean(filteredResults)
            scUnweightedMean.innerText = unweightedMean.toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })

            scCentralTendencies.dataset.great = unweightedMean >= 7.0 ? true : false

            let median = calculateMedian(filteredResults)
            scMedian.innerText = median.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

            let { modes, occurrences } = calculateMode(filteredResults)
            scMode.innerText = modes.map(e => e.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })).join(' & ')
            scMode.dataset.extra = occurrences + '×'
            scMode.dataset.description = modes.length <= 1 ? "Modus" : "Modi"
            if (scMode.innerText.length < 1) {
                scMode.innerText = "geen"
                scMode.removeAttribute('data-extra')
            }

            let variance = calculateVariance(filteredResults)
            scVariance.innerText = variance.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

            let minResult = Math.min(...filteredResults)
            scMin.innerText = minResult.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
            scMin.dataset.extra = filteredResults.filter(result => result === minResult).length + '×'

            let maxResult = Math.max(...filteredResults)
            scMax.innerText = maxResult.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
            scMax.dataset.extra = filteredResults.filter(result => result === maxResult).length + '×'

            let resultsSufficient = filteredResults.filter((e) => { return e >= Number(syncedStorage['suf-threshold']) })
            scSufficient.innerText = resultsSufficient.length

            let resultsInsufficient = filteredResults.filter((e) => { return e < Number(syncedStorage['suf-threshold']) })
            scInsufficient.innerText = resultsInsufficient.length
            scInsufficient.dataset.has = resultsInsufficient.length > 0

            scRoundedChart.createBarChart(roundedFrequencies, null, 0, false, false)

            scSufInsufChart.style.backgroundImage = `
            url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='90%25' height='90%25' x='3.75' y='3.75' fill='none' rx='100' ry='100' stroke='${getComputedStyle(document.body).getPropertyValue('--st-accent-warn').replace('#', '%23')}' stroke-width='7' stroke-dasharray='${(resultsInsufficient.length / filteredResults.length) * 278}%25%2c 10000%25' stroke-dashoffset='0'/%3e%3c/svg%3e"),
            url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='90%25' height='90%25' x='3.75' y='3.75' fill='none' rx='100' ry='100' stroke='${getComputedStyle(document.body).getPropertyValue('--st-accent-primary').replace('#', '%23')}' stroke-width='6.9'/%3e%3c/svg%3e")`
            scSufInsufChart.dataset.percentage = `${(resultsSufficient.length / filteredResults.length * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`

            scLineChart.createLineChart(filteredResults, filteredGrades.map(e => `${new Date(e.DatumIngevoerd || e.date).toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' })}\n${e.Vak?.Omschrijving || ''}\n${e.CijferKolom?.KolomNaam || e.column}, ${e.CijferKolom?.KolomKop || e.title || 'cijfer'}\n`), 1, 10)
            // TODO: also incorporate mean and (if subject selected) weighted mean (requires fetching every grade!)

            resolve()

            // Add weighted stats afterwards in case there's only one subject and year selected
            if (!fromBackup && includedYears.size === 1 && includedSubjects.length === 1) {
                for (const e of filteredGrades) {
                    e.weight ??= (await magisterApi.gradesColumnInfo({ id: [...includedYears][0] }, e.CijferKolom.Id)).Weging
                    statsGrades[statsGrades.findIndex(f => f.CijferKolom.Id === e.CijferKolom.Id)].weight ??= e.weight
                }

                if (!filteredGrades.every(grade => grade.weight) || !filteredGrades.some(grade => grade.weight > 0)) return

                scWeightedMean.innerText = calculateMean(
                    filteredGrades
                        .filter(grade => grade.weight > 0)
                        .map(grade => grade.result),
                    filteredGrades
                        .filter(grade => grade.weight > 0)
                        .map(grade => grade.weight)
                ).toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })


                scContainer.classList.add('with-weights')
                scUnweightedMean.classList.add('secondary')
            }
        })
    }
}