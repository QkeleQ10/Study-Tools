// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.includes('cijfers')) {
        await saveToStorage('viewedGrades', new Date().getTime(), 'local')
    }
    if (document.location.href.includes('cijferoverzicht')) {
        gradeOverview()
    }
}

async function gradeOverview() {
    gradeCalculator()
    gradeBackup()
    gradeStatistics()

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

// Grade calculator
async function gradeCalculator() {
    if (!syncedStorage['magister-cf-calculator']) return

    let accessedBefore = await getFromStorage('cf-calc-accessed', 'local') || false

    const aside = await awaitElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        gradesContainer = await awaitElement('.content-container-cijfers, .content-container'),
        gradeDetails = await awaitElement('#idDetails>.tabsheet .block .content dl')

    const clOpen = element('button', 'st-cc-open', document.body, { class: 'st-button', innerText: "Cijfercalculator", 'data-icon': '' }),
        clOverlay = element('div', 'st-cc', document.body, { class: 'st-overlay' }),
        clTitle = element('span', 'st-cc-title', clOverlay, { class: 'st-title', innerText: "Cijfercalculator" }),
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
        clMean = element('div', 'st-cc-mean', clAveragesWrapper, { class: 'st-metric', 'data-description': "Gemiddelde (gewogen)" }),
        clMedian = element('div', 'st-cc-median', clAveragesWrapper, { class: 'st-metric', 'data-description': "Mediaan" }),
        clWeight = element('div', 'st-cc-weight', clAveragesWrapper, { class: 'st-metric', 'data-description': "Gewicht" }),
        clPredictionWrapper = element('div', 'st-cc-prediction', clSidebar),
        clFutureWeightLabel = element('label', 'st-cc-future-weight-label', clPredictionWrapper, { innerText: "Weegfactor:" }),
        clFutureWeightInput = element('input', 'st-cc-future-weight-input', clFutureWeightLabel, { class: 'st-input', type: 'number', placeholder: "Weegfactor", min: 1 }),
        clFutureDesc = element('p', 'st-cc-future-desc', clPredictionWrapper, { innerText: "Bereken wat je moet halen of zie wat je komt te staan." }),
        clCanvas = element('div', 'st-cc-canvas', clPredictionWrapper)

    let years = await MagisterApi.years()

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
        gradesContainer.setAttribute('style', 'z-index: 9999999;max-width: calc(100vw - 476px);max-height: calc(100vh - 139px);position: fixed;left: 20px;top: 123px;right: 456px;bottom: 16px;')

        if (!document.querySelector('#st-cb-aside')) {
            let schoolYearId = document.querySelector('#aanmeldingenSelect>option[selected=selected]').value
            let schoolYear = years.find(y => y.id == schoolYearId)
            apiGrades[schoolYearId] ??= await MagisterApi.grades.forYear(schoolYear)
        }
        if (!accessedBefore) {
            await notify('dialog', "Welkom bij de nieuwe cijfercalculator!\n\nJe kunt cijfers toevoegen door ze aan te klikken. Je kunt ook de naam van een vak aanklikken om meteen alle cijfers\nvan dat vak toe te voegen aan de berekening. Natuurlijk kun je ook handmatig cijfers toevoegen.")
            accessedBefore = true
            saveToStorage('cf-calc-accessed', true, 'local')
        }
    })

    clClose.addEventListener('click', () => {
        gradesContainer.removeAttribute('style')
        clOverlay.removeAttribute('open')
        aside.removeAttribute('style')
        createStyle('', 'st-cculation-added')
    })

    clBugReport.addEventListener('click', () => {
        notify(
            'dialog',
            "Ervaar je problemen met de cijfercalculator?\n\nJe kunt nog steeds handmatig je cijfers toevoegen. Stuur me ook even een berichtje of een mailtje om me te laten weten wat er misgaat. Zo kan ik het oplossen!",
            [
                { innerText: "E-mail verzenden", onclick: `window.open('mailto:quinten@althues.nl')` },
                { innerText: "Discord", onclick: `window.open('https://discord.gg/RVKXKyaS6y')` }
            ]
        )
    })

    clHelp.addEventListener('click', async () => {
        await notify('dialog', "Welkom in de cijfercalculator!\n\nMet de cijfercalculator kun je gemakkelijk zien wat je moet halen of wat je gemiddelde zou kunnen worden.")

        await notify('dialog', "Je kunt cijfers toevoegen aan de berekening door ze aan te klikken in het cijferoverzicht.\n\nJe kunt ook de naam van een vak aanklikken om meteen alle cijfers van dat vak toe te voegen. Handig!\n\nNatuurlijk kun je ook handmatig cijfers toevoegen. Dat kan in het paneel aan de rechterkant.\n\nAls je meer wil weten over een cijfer, druk dan op '?' op je toetsenbord.")

        await notify('dialog', "In het zijpaneel zie je alle cijfers die je hebt toegevoegd, samen met wat centrummaten.\n\nHelemaal onderin zie je een diagram. Die geeft op de x-as de cijfers 1 t/m 10 weer, met op de y-as de \ngemiddelden die je zou kunnen komen te staan als je voor je volgende cijfer x haalt. Vergeet niet \nom de weegfactor goed in te stellen.")
    })

    addEventListener("keydown", e => {
        if (clOverlay.hasAttribute('open') && (e.key === '?' || e.key === '/')) {
            if (aside.hasAttribute('style')) aside.removeAttribute('style')
            else aside.setAttribute('style', 'z-index: 9999999;width: 408px;height: calc(100vh - 139px);position: fixed;top: 123px !important;bottom: 16px;right: 16px;background-color: var(--st-background-primary);pointer-events: none;')
        }
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
                    createStyle(Array.from(clAddedList.children).map(element => `span.grade[id="${element.dataset.id}"]`).join(', ') + ` {box-shadow: inset -0.5px 0 0 4px var(--st-accent-ok) !important;}`, 'st-cculation-added')
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

            const gradeElement = document.querySelector(`.grade[id="${id}"]`)

            let ghostSourcePosition = gradeElement.getBoundingClientRect()
            const ghostElement = element('span', null, document.body, {
                class: 'st-cf-ghost',
                innerText: gradeElement.title,
                style: `top: ${ghostSourcePosition.top}px; right: ${window.innerWidth - ghostSourcePosition.right}px; background-color: ${window.getComputedStyle(gradeElement).backgroundColor}; color: ${window.getComputedStyle(gradeElement).color}`
            })

            let result = Number(gradeElement.title.replace(',', '.')),
                weight,
                column = '?',
                title = '?'

            if (gradeElement.parentElement.dataset.weight && gradeElement.parentElement.dataset.column && gradeElement.parentElement.dataset.title) {
                weight = Number(gradeElement.parentElement.dataset.weight)
                column = gradeElement.parentElement.dataset.column
                title = gradeElement.parentElement.dataset.title
            } else {
                let schoolYearId = document.querySelector('#aanmeldingenSelect>option[selected=selected]').value
                let gradeColumnId = apiGrades[schoolYearId].find(item => `${item.Vak.Afkorting}_${item.CijferKolom.KolomNummer}_${item.CijferKolom.KolomNummer}` === id || `${item.Vak.Afkorting}_${item.CijferKolom.KolomKop}_${item.CijferKolom.KolomNummer}` === id).CijferKolom.Id
                gradeColumns[gradeColumnId] ??= await MagisterApi.grades.columnInfo({ id: schoolYearId }, gradeColumnId)
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
                innerText: `${result.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}×) — ${column}, ${title}\n`,
                'data-insufficient': result < 5.5,
                'data-type': 'table',
                'data-id': id
            })
            addedElement.addEventListener('click', event => {
                addedToCalculation = addedToCalculation.filter(item => item.id !== id)
                event.target.classList.add('remove')
                setTimeout(() => {
                    event.target.remove()
                    createStyle(Array.from(clAddedList.children).map(element => `span.grade[id="${element.dataset.id}"]`).join(', ') + ` {box-shadow: inset -0.5px 0 0 4px var(--st-accent-ok) !important;}`, 'st-cculation-added')
                }, 100)
                updateCalculations()
            })
            addedElement.scrollIntoView({ behavior: 'smooth' })
            createStyle(Array.from(clAddedList.children).map(element => `span.grade[id="${element.dataset.id}"]`).join(', ') + ` {box-shadow: inset -0.5px 0 0 4px var(--st-accent-ok) !important;}`, 'st-cculation-added')

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
            innerText: `${result.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}×) — handmatig ingevoerd\n`,
            'data-insufficient': result < 5.5,
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

        const hoverX = document.querySelector('#st-cc-canvas-x'),
            hoverY = document.querySelector('#st-cc-canvas-y')

        let mouseLeftPart = (event.pageX - event.currentTarget.offsetLeft) / event.currentTarget.offsetWidth
        let hypotheticalGrade = Math.round(0.9 * mouseLeftPart * 100 + 10) / 10

        hoverX.dataset.grade = hypotheticalGrade
        hoverX.style.setProperty('--grade', hypotheticalGrade)

        let hypotheticalMean = weightedPossibleMeans(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight), hypotheticalWeight || fallbackHypotheticalWeight)[0][Math.round(0.9 * mouseLeftPart * 100)]

        hoverY.dataset.grade = hypotheticalMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        hoverY.style.setProperty('--grade', hypotheticalMean)

        if (hypotheticalMean.toFixed(2) === calcMean.toFixed(2)) {
            clFutureDesc.innerText = `Als je een ${hypotheticalGrade.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, \ndan blijf je gemiddeld een ${hypotheticalMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} staan.`
        } else if (hypotheticalMean > calcMean) {
            clFutureDesc.innerText = `Als je een ${hypotheticalGrade.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, \ndan stijgt je gemiddelde tot een ${hypotheticalMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        } else {
            clFutureDesc.innerText = `Als je een ${hypotheticalGrade.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} haalt, \ndan daalt je gemiddelde tot een ${hypotheticalMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
        }
        clFutureDesc.style.color = hypotheticalMean < 5.5 ? 'var(--st-accent-warn)' : 'var(--st-foreground-primary)'
    })

    clCanvas.addEventListener('mouseleave', event => {
        advice = formulateGradeAdvice()
        clFutureDesc.innerText = advice.text || "Bereken wat je moet halen of zie wat je komt te staan."
        clFutureDesc.style.color = advice.color === 'warn' ? 'var(--st-accent-warn)' : 'var(--st-foreground-primary)'
    })

    function updateCalculations() {
        calcMean = weightedMean(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight))
        calcMedian = median(addedToCalculation.map(item => item.result))
        clMean.innerText = isNaN(calcMean)
            ? '?'
            : calcMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        clMedian.innerText = isNaN(calcMedian)
            ? '?'
            : calcMedian.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        clWeight.innerText = addedToCalculation.map(item => item.weight).reduce((acc, curr) => acc + curr, 0) + '×'

        clAdded.dataset.amount = addedToCalculation.length

        if (calcMean < 5.5) clMean.classList.add('insufficient')
        else clMean.classList.remove('insufficient')

        fallbackHypotheticalWeight = Math.round(median(addedToCalculation.map(item => item.weight)) || 1)
        clFutureWeightInput.placeholder = fallbackHypotheticalWeight + '×'

        advice = formulateGradeAdvice()
        clFutureDesc.innerText = advice.text || "Bereken wat je moet halen of zie wat je komt te staan."
        clFutureDesc.style.color = advice.color === 'warn' ? 'var(--st-accent-warn)' : 'var(--st-foreground-primary)'
        renderGradeChart()
    }

    // TODO: chart also with tick marks, hover possibility etc
    function renderGradeChart() {
        clCanvas.dataset.irrelevant = addedToCalculation.length < 1

        let minGrade = weightedPossibleMeans(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight), hypotheticalWeight || fallbackHypotheticalWeight)[0][0],
            maxGrade = weightedPossibleMeans(addedToCalculation.map(item => item.result), addedToCalculation.map(item => item.weight), hypotheticalWeight || fallbackHypotheticalWeight)[0][90]

        const line = element('div', 'st-cc-canvas-line', clCanvas, {
            'data-min-grade': minGrade.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'data-min-grade-insufficient': minGrade < 5.5,
            'data-max-grade': maxGrade.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'data-max-grade-insufficient': maxGrade < 5.5,
            style: `--min-grade: ${minGrade}; --max-grade: ${maxGrade};`
        })

        const currentMean = element('div', 'st-cc-canvas-mean', clCanvas, {
            'data-grade': calcMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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
            means.push(Number(weightedMean(valueArray.concat([i]), weightArray.concat([newWeight]))))
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
            if (meanH >= 5.495) {
                color = 'normal'
                text = `Haal een ${gradeH.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} of hoger die ${weight}× meetelt\nom een voldoende ${mean < 5.5 ? 'komen te' : 'te blijven'} staan.`
                if (gradeH <= 1.0) {
                    text = `Met een cijfer dat ${weight}× meetelt\nkun je niet lager komen te staan dan een ${minimumMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
                } else if (gradeH > 9.9) {
                    text = `Haal een 10,0 die ${weight}× meetelt\nom een voldoende ${mean < 5.5 ? 'komen te' : 'te blijven'} staan.`
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

// Grade backup
async function gradeBackup() {
    if (!syncedStorage['magister-cf-backup']) return
    let aside = await awaitElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        gradesContainer = await awaitElement('.content-container-cijfers, .content-container'),
        bkInvoke = element('button', 'st-cb', document.body, { class: 'st-button', 'data-icon': '', innerText: "Cijferback-up" }),
        // TODO: Give this modal the same treatment as the today.js edit modal.
        bkModal = element('dialog', 'st-cb-modal', document.body, { class: 'st-overlay' }),
        bkModalClose = element('button', 'st-cb-modal-close', bkModal, { class: 'st-button', 'data-icon': '', innerText: "Sluiten" }),
        bkModalTitle = element('span', 'st-cb-title', bkModal, { class: 'st-title', innerText: "Cijferback-up" }),
        bkModalSubtitle = element('span', 'st-cb-subtitle', bkModal, { class: 'st-subtitle', innerText: "Exporteer of importeer je cijferlijst zodat je er altijd bij kunt." }),
        bkModalWrapper = element('div', 'st-cb-modal-wrapper', bkModal),
        bkModalEx = element('div', 'st-cb-ex', bkModalWrapper, { class: 'st-list st-tile' }),
        bkModalExListTitle = element('span', 'st-cb-ex-title', bkModalEx, { class: 'st-section-title', 'data-icon': '', innerText: "Exporteren" }),
        bkModalIm = element('div', 'st-cb-im', bkModalWrapper, { class: 'st-list st-tile' }),
        bkModalImListTitle = element('span', 'st-cb-im-title', bkModalIm, { class: 'st-section-title', 'data-icon': '', innerText: "Importeren" }),
        bkModalImExternal = element('button', 'st-cb-im-external', bkModalIm, { class: 'st-button', 'data-icon': '', innerText: "Importeren via website" }),
        bkModalImExtTip = element('span', 'st-cb-im-ext-tip', bkModalIm, { class: 'st-tip', innerText: "Website speciaal ontwikkeld voor het\nimporteren van cijferback-ups (aanbevolen)\n\n" }),
        bkModalImMagister = element('label', 'st-cb-import', bkModalIm, { class: 'st-button secondary', 'data-icon': '', innerText: "Importeren in Magister" }),
        bkModalImMagTip = element('span', 'st-cb-im-mag-tip', bkModalIm, { class: 'st-tip', innerText: "Niet aanbevolen" }),
        bkImportInput = element('input', 'st-cb-import-input', bkModalImMagister, { type: 'file', accept: '.json', style: 'display:none' }),
        bkIWrapper = document.createElement('div'),
        bkIResult = document.createElement('div'),
        bkIWeight = document.createElement('div'),
        bkIColumn = document.createElement('div'),
        bkITitle = document.createElement('div'),
        yearsArray = [],
        busy = false,
        list = []

    bkModalClose.addEventListener('click', () => bkModal.close())

    bkInvoke.addEventListener('click', async () => {
        bkModal.showModal()

        if (bkModalExListTitle.disabled) {
            bkModalImListTitle.dataset.description = "Upload een andere cijferback-up"
            return
        }

        bkModalExListTitle.dataset.description = "Kies een cijferlijst om te exporteren"
        bkModalImListTitle.dataset.description = "Upload een eerder geëxporteerde cijferlijst"

        document.querySelector("#idWeergave > div > div:nth-child(1) > div > div > form > div:nth-child(1) > div > span").click()
        if (yearsArray?.length > 0) return

        yearsArray = await MagisterApi.years()

        yearsArray.forEach((year, i) => {
            const button = element('button', `st-cb-ex-opt-${year.id}`, bkModalEx, { class: `st-button ${i === 0 ? '' : 'secondary'}`, innerText: `${year.groep.omschrijving || year.groep.code} (${year.studie.code} in ${year.lesperiode.code})`, 'data-icon': i === 0 ? '' : '' })
            button.addEventListener('click', () => exportGradesForYear({ ...year, i, button }))
        })
    })

    async function exportGradesForYear(year) {
        if (busy) return

        busy = true
        bkModalExListTitle.dataset.description = "Schooljaar selecteren..."

        let yearElement = await awaitElement(`#aanmeldingenSelect_listbox>li:nth-child(${year.i + 1})`)
        yearElement.click()

        bkModalExListTitle.dataset.description = "Wachten op cijfers..."

        const gradesArray = await MagisterApi.grades.forYear(year)
        if (!gradesArray?.length > 0) {
            bkModalExListTitle.dataset.description = "Geen cijfers gevonden!"
            busy = false
            return
        }

        await new Promise(resolve => setTimeout(resolve, 1000))

        bkModalExListTitle.dataset.description = `Cijfers verwerken...`

        let nodeList = gradesContainer.querySelectorAll('td:not([style])'),
            array = [...nodeList]

        list = await Promise.all(array.map(async (td, i) => {
            return new Promise(async (resolve, reject) => {
                let type = (!td.innerText || td.innerText.trim().length < 1) ? 'filler' : (td.firstElementChild?.classList.contains('text')) ? 'rowheader' : 'grade',
                    className = td.firstElementChild?.className

                if (type === 'filler') {
                    resolve({
                        type, className
                    })
                } else if (type === 'rowheader') {
                    let title = td.firstElementChild?.innerText

                    resolve({
                        title, type, className
                    })
                } else {
                    let columnComponents = td.firstElementChild?.id.replace(/(\w+)\1+/g, '$1').split('_'),
                        columnName = columnComponents[0] + columnComponents[1].padStart(3, '0')

                    let gradeBasis = gradesArray.find(e => e.CijferKolom.KolomNaam === columnName)

                    let result = gradeBasis.CijferStr || gradeBasis.Cijfer

                    if (Math.floor(i / 400) * 10000 >= 10000) {
                        bkModalExListTitle.dataset.description = `10 seconden wachten...`
                        let secondsRemaining = 10
                        var interval = setInterval(function () {
                            if (secondsRemaining <= 1) clearInterval(interval)
                            bkModalExListTitle.dataset.description = `${secondsRemaining - 1} seconden wachten...`
                            secondsRemaining--
                        }, 1000)
                        setTimeout(() => { bkModalExListTitle.dataset.description = `Cijfers verwerken...` }, 10000)
                    }

                    setTimeout(async () => {
                        const gradeExtra = await MagisterApi.grades.columnInfo(year, gradeBasis.CijferKolom.Id)

                        let weight = Number(gradeExtra.Weging),
                            column = gradeExtra.KolomNaam,
                            title = gradeExtra.KolomOmschrijving

                        resolve({
                            result, weight, column, title, type, className
                        })
                    }, Math.floor(i / 400) * 10000)
                }
            })
        }))

        bkModalExListTitle.dataset.description = "In bestand opslaan..."

        let uri = `data:application/json;base64,${window.btoa(unescape(encodeURIComponent(JSON.stringify({ date: new Date(), list: list }))))}`,
            a = element('a', 'st-cb-temp', document.body, {
                download: `Cijferlijst ${year.studie.code} (${year.lesperiode.code}) ${(new Date).toLocaleString()}`,
                href: uri,
                type: 'application/json'
            })
        a.click()
        a.remove()
        bkModalExListTitle.dataset.description = "Controleer je downloads!"
        busy = false
        setTimeout(() => bkModal.close(), 2000)
    }

    bkModalImExternal.addEventListener('click', () => window.open('https://qkeleq10.github.io/studytools/grades', '_blank'))

    bkImportInput.addEventListener('change', async event => {
        if (busy) return

        busy = true
        bkModalImListTitle.dataset.description = "Wachten op bestand..."

        bkModalExListTitle.dataset.description = `Vernieuw de pagina om te exporteren`
        bkModalExListTitle.disabled = true
        bkModalEx.querySelectorAll(`[id*='st-cb-ex-opt']`).forEach(e => e.remove())
        gradesContainer.setAttribute('style', 'opacity: .6; pointer-events: none')
        list = []

        let reader = new FileReader()
        reader.onload = async event => {
            bkModalImListTitle.dataset.description = "Cijfers op pagina plaatsen..."

            let json = JSON.parse(event.target.result)
            list = json.list
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
            aside.innerText = "Geïmporteerd uit back-up van " + new Date(json.date).toLocaleString('nl-NL', {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric"
            })
            aside.id = 'st-cb-aside'
            aside.append(bkIWrapper)
            bkIWrapper.id = 'st-cb-i-wrapper'
            bkIWrapper.append(bkIResult, bkIWeight, bkIColumn, bkITitle)
            bkIResult.dataset.description = "Resultaat"
            bkIResult.classList.add('st-metric')
            bkIResult.innerText = "?"
            bkIResult.style.color = 'var(--st-foreground-primary)'
            bkIWeight.dataset.description = "Weegfactor"
            bkIWeight.classList.add('st-metric')
            bkIWeight.innerText = "?"
            bkIColumn.dataset.description = "Kolomnaam"
            bkIColumn.classList.add('st-metric')
            bkIColumn.innerText = "?"
            bkITitle.dataset.description = "Kolomkop"
            bkITitle.classList.add('st-metric')
            bkITitle.innerText = "Klik op een cijfer"

            for (let i = 0; i < list.length; i++) {
                bkModalImMagister.style.backgroundPosition = `-${(i + 1) / list.length * 100}% 0`
                item = list[i]
                await appendImportedGrade(item, gradesContainer.querySelector('table'), aside)
                    .then(() => {
                        return
                    })
            }

            if (document.querySelector('#st-cs')) {
                document.querySelector('#st-cs').style.display = 'flex'
                document.querySelector('#st-cs').classList.add('small')
                document.querySelector('#st-cs-bk-communication').click()
                document.querySelector('#st-cs-year-filter-wrapper').style.display = 'none'
            }

            gradesContainer.removeAttribute('style')
            bkModalImListTitle.dataset.description = "Cijferlijst geüpload!"
            busy = false
            setTimeout(() => bkModal.close(), 200)
        }
        reader.readAsText(event.target.files[0])
    })

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
                    span.id = item.column
                    td.append(span)
                    td.addEventListener('click', () => {
                        document.querySelectorAll('.k-state-selected').forEach(e => e.classList.remove('k-state-selected'))
                        td.classList.add('k-state-selected')
                        bkIResult.innerText = item.result
                        bkIWeight.innerText = item.weight
                        bkIColumn.innerText = item.column
                        bkITitle.innerText = item.title
                    })
                    break
            }
            resolve()
        })
    }
}

// Grade statistics
// TODO: Revamp!
async function gradeStatistics() {
    if (!syncedStorage['magister-cf-statistics']) return
    let tabs = await awaitElement('#cijfers-container > aside > div.head-bar > ul'),
        scTab = element('li', 'st-cs-tab', tabs, { class: 'asideTrigger' }),
        scTabLink = element('a', 'st-cs-tab-link', scTab, { innerText: "Statistieken" }),
        scContainer = element('div', 'st-cs', document.body, { 'data-visible': 'false' }),
        scFilterButton = element('button', 'st-cs-filter-button', scContainer, { class: 'st-button icon primary', 'data-icon': '', title: "Leerjaren en vakken selecteren" }),
        scFilterButtonTooltip = element('div', 'st-cs-filter-button-tooltip', scContainer, { innerText: "Kies hier leerjaren en vakken om statistieken voor te tonen!" }),
        scStats = element('div', 'st-cs-stats', scContainer),
        scStatsHeading = element('span', 'st-cs-stats-heading', scStats, { innerText: "Statistieken", 'data-amount': 0 }),
        scStatsInfo = element('span', 'st-cs-stats-info', scStats, { innerText: "Laden..." }),
        scMetricsWrapper = element('div', 'st-cs-metrics-wrapper', scStats),
        scMetrics1 = element('div', 'st-cs-metrics-1', scMetricsWrapper),
        scMean = element('div', 'st-cs-mean', scMetrics1, { class: 'st-metric', 'data-description': "Ongewogen\ngemiddelde", style: 'color: var(--st-foreground-primary)', title: "De gemiddelde waarde, zonder weegfactoren." }),
        scMedian = element('div', 'st-cs-median', scMetrics1, { class: 'st-metric', 'data-description': "Mediaan", title: "De middelste waarde, wanneer je alle cijfers van laag naar hoog op een rijtje zou zetten.\nBij een even aantal waarden: het gemiddelde van de twee middelste waarden." }),
        scMode = element('div', 'st-cs-mode', scMetrics1, { class: 'st-metric', 'data-description': "Modus", title: "De waarde die het meest voorkomt." }),
        scMetrics2 = element('div', 'st-cs-metrics-2', scMetricsWrapper),
        scSufficient = element('div', 'st-cs-sufficient', scMetrics2, { class: 'st-metric', 'data-description': "Voldoendes", title: "Het aantal cijfers hoger of gelijk aan 5,5." }),
        scInsufficient = element('div', 'st-cs-insufficient', scMetrics2, { class: 'st-metric', 'data-description': "Onvoldoendes", title: "Het aantal cijfers lager dan 5,5." }),
        scMetrics3 = element('div', 'st-cs-metrics-3', scMetricsWrapper),
        scMin = element('div', 'st-cs-min', scMetrics3, { class: 'st-metric', 'data-description': "Laagste cijfer", title: "Het laagst behaalde cijfer." }),
        scMax = element('div', 'st-cs-max', scMetrics3, { class: 'st-metric', 'data-description': "Hoogste cijfer", title: "Het hoogst behaalde cijfer." }),
        scStDev = element('div', 'st-cs-stdev', scMetrics3, { class: 'st-metric', 'data-description': "Standaard-\nafwijking", title: "De gemiddelde afwijking van alle meetwaarden tot de gemiddelde waarde." }),
        scBarChart = element('div', 'st-cs-bar-chart', scStats),
        scFilters = element('div', 'st-cs-filters', scContainer),
        scFiltersHeading = element('span', 'st-cs-filters-heading', scFilters, { innerText: "Filters" }),
        scYearFilterAll = element('button', 'st-cs-year-filter-all', scFilters, { class: 'st-button icon', 'data-icon': '', title: "Selectie omkeren" }),
        scYearFilter = element('div', 'st-cs-year-filter', scFilters),
        scSubjectFilterAll = element('button', 'st-cs-subject-filter-all', scFilters, { class: 'st-button icon', 'data-icon': '', title: "Selectie omkeren" }),
        scSubjectFilter = element('div', 'st-cs-subject-filter', scFilters),
        // TODO
        scInteractionPreventer = document.createElement('div'),
        scBkCommunication = document.createElement('button'),
        grades = [],
        years = [],
        gatheredYears = new Set(),
        includedYears = new Set(),
        subjects = new Set(),
        excludedSubjects = new Set(),
        backup = false

    // TODO
    document.body.append(scInteractionPreventer, scBkCommunication)
    scBkCommunication.id = 'st-cs-bk-communication'
    scBkCommunication.style.display = 'none'

    tabs.addEventListener('click', () => {
        if (scTab.classList.contains('active')) {
            scTab.classList.remove('active')
            tabs.classList.remove('st-cs-override')
            scContainer.dataset.visible = false
        }
    })

    scTab.addEventListener('click', async event => {
        event.stopPropagation()
        tabs.classList.add('st-cs-override')
        scTab.classList.add('active')
        scContainer.dataset.visible = true
    })

    // scBkCommunication.addEventListener('click', async () => {
    //     backup = true
    //     years = new Set()
    //     grades = {}
    //     setTimeout(async () => {
    //         grades = await gatherGradesForYear(grades)
    //         await displayStatistics(grades)
    //     }, 200);
    // })

    scTab.addEventListener('click', async event => {
        await displayStatistics()
    }, { once: true })

    scFilterButton.addEventListener('click', () => {
        scFilterButtonTooltip.classList.add('hidden')
        if ((scContainer.dataset.filters == 'true')) {
            scContainer.dataset.filters = false
        } else {
            scContainer.dataset.filters = true
        }
    })

    scYearFilterAll.addEventListener('click', () => {
        [...scYearFilter.children].forEach(e => e.click())
    })

    scSubjectFilterAll.addEventListener('click', () => {
        [...scSubjectFilter.children].forEach(e => e.click())
    })

    // Gather all years and populate the year filter
    years = await MagisterApi.years()
    years.forEach(async (year, i) => {
        let label = element('label', `st-cs-year-${year.id}-label`, scYearFilter, { class: 'st-checkbox-label', for: `st-cs-year-${year.id}`, innerText: `${year.groep.omschrijving || year.groep.code} (${year.studie.code} in ${year.lesperiode.code})` })
        let input = element('input', `st-cs-year-${year.id}`, label, { class: 'st-checkbox-input', type: 'checkbox' })

        if (i === 0) {
            input.checked = true
            let yearGrades = (await MagisterApi.grades.forYear(year))
            grades.push(...yearGrades.filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.')))).map(e => ({ ...e, year: year.id })))

            let yearSubjects = yearGrades.map(e => e.Vak.Omschrijving)
            subjects = new Set([...subjects, ...yearSubjects])
            buildSubjectFilter()

            gatheredYears.add(year.id)
            includedYears.add(year.id)
            displayStatistics()
        }

        input.addEventListener('input', async () => {
            if (!gatheredYears.has(year.id)) {
                let yearGrades = (await MagisterApi.grades.forYear(year))
                grades.push(...yearGrades.filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.')))).map(e => ({ ...e, year: year.id })))

                gatheredYears.add(year.id)
            }

            input.checked ? includedYears.add(year.id) : includedYears.delete(year.id)

            let yearSubjects = grades.filter(e => e.year === year.id).map(e => e.Vak.Omschrijving)
            subjects = new Set([...subjects, ...yearSubjects])
            buildSubjectFilter()

            displayStatistics()
        })
    })

    function buildSubjectFilter() {
        scSubjectFilter.innerText = ''

        subjects = new Set([...subjects]
            .filter(subject => grades.filter(e => includedYears.has(e.year)).find(e => e.Vak.Omschrijving === subject))
            .sort((a, b) => a.localeCompare(b, 'nl-NL', { sensitivity: 'base' })))

        let subjectsArray = [...subjects]
        subjectsArray.forEach(subjectName => {
            let label = element('label', `st-cs-subject-${subjectName}-label`, scSubjectFilter, { class: 'st-checkbox-label', for: `st-cs-subject-${subjectName}`, innerText: subjectName })
            let input = element('input', `st-cs-subject-${subjectName}`, label, { class: 'st-checkbox-input', type: 'checkbox' })
            input.checked = !excludedSubjects.has(subjectName)

            input.addEventListener('input', async () => {
                excludedSubjects.has(subjectName) ? excludedSubjects.delete(subjectName) : excludedSubjects.add(subjectName)
                displayStatistics()
            })
        })

        let excludedSubjectsArray = [...excludedSubjects]
        excludedSubjects = new Set(excludedSubjectsArray.filter(e => subjects.has(e)))
    }

    function filterGrades() {
        const filtered = grades
            .filter(e =>
                includedYears.has(e.year) &&
                !excludedSubjects.has(e.Vak.Omschrijving)
            )
            .filter((grade, index, self) =>
                index === self.findIndex((g) =>
                    g.CijferKolom.KolomKop === grade.CijferKolom.KolomKop &&
                    g.CijferKolom.KolomNaam === grade.CijferKolom.KolomNaam &&
                    g.CijferStr === grade.CijferStr
                )
            )
        return filtered
    }

    async function displayStatistics() {
        return new Promise(async (resolve, reject) => {
            let filteredGrades = filterGrades() || []
            scStatsHeading.dataset.amount = filteredGrades.length

            let yearsText = [...includedYears]
                .sort((idA, idB) => new Date(years.find(y => y.id === idA).begin) - new Date(years.find(y => y.id === idB).begin))
                .map(id => years.find(y => y.id === id).studie.code).join(', ')
            if (includedYears.size === 1 && includedYears.has(years.at(0).id)) yearsText = `Dit leerjaar ${years.at(0).studie.code}`
            if (includedYears.size === years.length) yearsText = `Alle ${years.length} leerjaren (${years.at(-1).studie.code} t/m ${years.at(0).studie.code})`

            let includedSubjects = [...subjects]
                .filter(subject => !excludedSubjects.has(subject))
                .sort()
            let subjectsText = includedSubjects.join(', ')
            if (includedSubjects.length > 3) subjectsText = `${includedSubjects.length} van de ${subjects.size} vakken`
            if (excludedSubjects.size === 1) subjectsText = `Alle ${subjects.size} vakken behalve ${[...excludedSubjects][0]}`
            if (excludedSubjects.size === 0) subjectsText = ''

            scStatsInfo.innerText = [yearsText, subjectsText].filter(t => t.length > 0).join('\n')

            if (filteredGrades.length < 1) {
                scContainer.dataset.filters = true
                scContainer.classList.add('empty')
                return
            }
            scContainer.classList.remove('empty')

            let filteredResults = filteredGrades.map(grade => Number(grade.CijferStr.replace(',', '.'))),
                roundedFrequencies = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }

            filteredResults.forEach(result => roundedFrequencies[Math.round(result)]++)

            scMean.innerText = weightedMean(filteredResults).toLocaleString('nl-NL', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

            scMedian.innerText = median(filteredResults).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

            let { modes, occurrences } = mode(filteredResults)
            scMode.innerText = modes.map(e => e.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })).join(' & ')
            scMode.dataset.extra = occurrences + '×'
            scMode.dataset.description = modes.length <= 1 ? "Modus" : "Modi"
            if (scMode.innerText.length < 1) {
                scMode.innerText = "geen"
                scMode.removeAttribute('data-extra')
            }

            scStDev.innerText = standardDeviation(filteredResults).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

            scMin.innerText = Math.min(...filteredResults).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

            scMax.innerText = Math.max(...filteredResults).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

            let resultsSufficient = filteredResults.filter((e) => { return e >= 5.5 })
            if (resultsSufficient.length > 0) {
                scSufficient.innerText = resultsSufficient.length
                scSufficient.dataset.extra = `${(resultsSufficient.length / filteredGrades.length * 100).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
            } else {
                scSufficient.innerText = 'geen'
                scSufficient.removeAttribute('data-extra')
            }

            let resultsInsufficient = filteredResults.filter((e) => { return e < 5.5 })
            if (resultsInsufficient.length > 0) {
                scInsufficient.innerText = resultsInsufficient.length
                scInsufficient.dataset.extra = `${(resultsInsufficient.length / filteredGrades.length * 100).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
            } else {
                scInsufficient.innerText = 'geen'
                scInsufficient.removeAttribute('data-extra')
            }

            scBarChart.createBarChart(roundedFrequencies, null, 0, false)

            resolve()
        })
    }
}