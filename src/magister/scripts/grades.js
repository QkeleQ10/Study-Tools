// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.includes('cijfers')) {
        await saveToStorage('viewedGrades', new Date().getTime(), 'local')
    }
    if (document.location.href.includes('cijferoverzicht')) {
        gradeCalculator()
        gradeBackup()
        gradeStatistics()
    }
}

// Page 'Cijfers', calculator
async function gradeCalculator() {
    if (!syncedStorage['magister-cf-calculator']) return

    let accessedBefore = await getFromStorage('cf-calc-accessed', 'local') || false

    const aside = await awaitElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        gradesContainer = await awaitElement('.content-container-cijfers, .content-container'),
        gradeDetails = await awaitElement('#idDetails>.tabsheet .block .content dl')

    const clOpen = element('button', 'st-cf-cl-open', document.body, { class: 'st-button', innerText: "Cijfercalculator", 'data-icon': '' }),
        clOverlay = element('div', 'st-cf-cl', document.body, { class: 'st-overlay' }),
        clTitle = element('span', 'st-cf-cl-title', clOverlay, { class: 'st-title', innerText: "Cijfercalculator" }),
        clSubtitle = element('span', 'st-cf-cl-subtitle', clOverlay, { class: 'st-subtitle', innerText: "Voeg cijfers toe en zie wat je moet halen of wat je gemiddelde wordt." }),
        clButtons = element('div', 'st-cf-cl-buttons', clOverlay),
        clBugReport = element('button', 'st-cf-cl-bugs', clButtons, { class: 'st-button icon', title: "Ervaar je problemen?", 'data-icon': '' }),
        clHelp = element('button', 'st-cf-cl-help', clButtons, { class: 'st-button icon', title: "Hulp", 'data-icon': '' }),
        clClose = element('button', 'st-cf-cl-close', clButtons, { class: 'st-button', innerText: "Wissen en sluiten", 'data-icon': '' }),
        clSidebar = element('div', 'st-cf-cl-sidebar', clOverlay),
        clAdded = element('div', 'st-cf-cl-added', clSidebar, { 'data-amount': 0 }),
        clAddedList = element('div', 'st-cf-cl-added-list', clAdded),
        clCustomButtons = element('div', 'st-cf-cl-custom-buttons', clAdded),
        clAddCustomResult = element('input', 'st-cf-custom-result', clCustomButtons, { class: 'st-input', type: 'number', placeholder: 'Cijfer', max: 10, step: 0.1, min: 1 }),
        clAddCustomWeight = element('input', 'st-cf-custom-weight', clCustomButtons, { class: 'st-input', type: 'number', placeholder: 'Weegfactor', min: 1 }),
        clAddCustom = element('button', 'st-cf-cl-custom', clCustomButtons, { class: 'st-button secondary', innerText: "Eigen cijfer toevoegen", 'data-icon': '' }),
        clAveragesWrapper = element('div', 'st-cf-cl-averages', clSidebar),
        clMean = element('div', 'st-cf-cl-mean', clAveragesWrapper, { class: 'st-metric', 'data-description': "Gemiddelde (gewogen)" }),
        clMedian = element('div', 'st-cf-cl-median', clAveragesWrapper, { class: 'st-metric', 'data-description': "Mediaan" }),
        clWeight = element('div', 'st-cf-cl-weight', clAveragesWrapper, { class: 'st-metric', 'data-description': "Gewicht" }),
        clPredictionWrapper = element('div', 'st-cf-cl-prediction', clSidebar),
        clFutureWeightLabel = element('label', 'st-cf-cl-future-weight-label', clPredictionWrapper, { innerText: "Weegfactor:" }),
        clFutureWeightInput = element('input', 'st-cf-cl-future-weight-input', clFutureWeightLabel, { class: 'st-input', type: 'number', placeholder: "Weegfactor", min: 1 }),
        clFutureDesc = element('p', 'st-cf-cl-future-desc', clPredictionWrapper, { innerText: "Bereken wat je moet halen of zie wat je komt te staan." }),
        clCanvas = element('div', 'st-cf-cl-canvas', clPredictionWrapper)

    let years = (await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/leerlingen/$USERID/aanmeldingen?begin=2013-01-01&einde=${new Date().getFullYear() + 1}-01-01`)).items

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

        if (!document.querySelector('#st-cf-bk-aside')) {
            let schoolYearId = document.querySelector('#aanmeldingenSelect>option[selected=selected]').value
            let schoolYear = years.find(y => y.id == schoolYearId)
            apiGrades[schoolYearId] ??= (await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/aanmeldingen/${schoolYearId}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${schoolYear.einde}`)).Items
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
        createStyle('', 'st-calculation-added')
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
            const alreadyAddedElement = clAddedList.querySelector(`.st-cf-cl-added-element[data-id="${id}"]`)
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
                let gradeColumnId = apiGrades[schoolYearId].find(item => `${item.Vak.Afkorting}_${item.CijferKolom.KolomNummer}_${item.CijferKolom.KolomNummer}` === id).CijferKolom.Id
                gradeColumns[gradeColumnId] ??= await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/aanmeldingen/${document.querySelector('#aanmeldingenSelect>option[selected=selected]').value}/cijfers/extracijferkolominfo/${gradeColumnId}`)
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
                setTimeout(() => elem.classList.remove('st-cannot-add'), 500)
                return resolve()
            }
            if (!weight || weight <= 0) {
                ghostElement.remove()
                if (!lowVerbosity) notify('snackbar', 'Dit cijfer telt niet mee en is niet toegevoegd aan de berekening.')
                gradeElement.classList.add('st-cannot-add')
                setTimeout(() => elem.classList.remove('st-cannot-add'), 500)
                return resolve()
            }

            let addedElement = element('span', null, clAddedList, {
                class: 'st-cf-cl-added-element',
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
            class: 'st-cf-cl-added-element',
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

        const hoverX = document.querySelector('#st-cf-cl-canvas-x'),
            hoverY = document.querySelector('#st-cf-cl-canvas-y')

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

        const line = element('div', 'st-cf-cl-canvas-line', clCanvas, {
            'data-min-grade': minGrade.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'data-min-grade-insufficient': minGrade < 5.5,
            'data-max-grade': maxGrade.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            'data-max-grade-insufficient': maxGrade < 5.5,
            style: `--min-grade: ${minGrade}; --max-grade: ${maxGrade};`
        })

        const currentMean = element('div', 'st-cf-cl-canvas-mean', clCanvas, {
            'data-grade': calcMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            style: `--grade: ${calcMean}`
        })

        let hoverX = element('div', 'st-cf-cl-canvas-x', clCanvas)
        let hoverY = element('div', 'st-cf-cl-canvas-y', clCanvas)
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

// Page 'Cijferoverzicht', backup
async function gradeBackup() {
    if (!syncedStorage['magister-cf-backup']) return
    let aside = await awaitElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        gradesContainer = await awaitElement('.content-container-cijfers, .content-container'),
        bkInvoke = element('button', 'st-cf-bk', document.body, { class: 'st-button', 'data-icon': '', innerText: "Cijferback-up" }),
        // TODO: Give this modal the same treatment as the today.js edit modal.
        bkModal = element('dialog', 'st-cf-bk-modal', document.body, { class: 'st-overlay' }),
        bkModalClose = element('button', 'st-cf-bk-modal-close', bkModal, { class: 'st-button', 'data-icon': '', innerText: "Sluiten" }),
        bkModalTitle = element('span', 'st-cf-bk-title', bkModal, { class: 'st-title', innerText: "Cijferback-up" }),
        bkModalSubtitle = element('span', 'st-cf-bk-subtitle', bkModal, { class: 'st-subtitle', innerText: "Exporteer of importeer je cijferlijst zodat je er altijd bij kunt." }),
        bkModalWrapper = element('div', 'st-cf-bk-modal-wrapper', bkModal),
        bkModalEx = element('div', 'st-cf-bk-ex', bkModalWrapper, { class: 'st-list st-tile' }),
        bkModalExListTitle = element('span', 'st-cf-bk-ex-title', bkModalEx, { class: 'st-section-title', 'data-icon': '', innerText: "Exporteren" }),
        bkModalIm = element('div', 'st-cf-bk-im', bkModalWrapper, { class: 'st-list st-tile' }),
        bkModalImListTitle = element('span', 'st-cf-bk-im-title', bkModalIm, { class: 'st-section-title', 'data-icon': '', innerText: "Importeren" }),
        bkModalImExternal = element('button', 'st-cf-bk-im-external', bkModalIm, { class: 'st-button', 'data-icon': '', innerText: "Importeren via website" }),
        bkModalImExtTip = element('span', 'st-cf-bk-im-ext-tip', bkModalIm, { class: 'st-tip', innerText: "Website speciaal ontwikkeld voor het\nimporteren van cijferback-ups (aanbevolen)\n\n" }),
        bkModalImMagister = element('label', 'st-cf-bk-import', bkModalIm, { class: 'st-button secondary', 'data-icon': '', innerText: "Importeren in Magister" }),
        bkModalImMagTip = element('span', 'st-cf-bk-im-mag-tip', bkModalIm, { class: 'st-tip', innerText: "Niet aanbevolen" }),
        bkImportInput = element('input', 'st-cf-bk-import-input', bkModalImMagister, { type: 'file', accept: '.json', style: 'display:none' }),
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

        document.querySelector("#idWeergave > div > div:nth-child(2) > div > div > form > div > div > span").click()
        document.querySelector("#kolomweergave_listbox > li:nth-child(2)").click()
        document.querySelector("#idWeergave > div > div:nth-child(1) > div > div > form > div:nth-child(1) > div > span").click()
        if (yearsArray?.length > 0) return

        await getApiCredentials()

        const yearsRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/leerlingen/${apiUserId}/aanmeldingen?begin=2013-01-01&einde=${new Date().getFullYear() + 1}-01-01`, { headers: { Authorization: apiUserToken } })
        if (yearsRes.status >= 400 && yearsRes.status < 600) {
            let errorEl = element('span', 'st-cf-bk-ex-error', bkModalEx, { innerText: "Vernieuw de pagina en probeer het opnieuw." })
            return
        }
        yearsArray = (await yearsRes.json()).items

        yearsArray.forEach((year, i) => {
            const button = element('button', `st-cf-bk-ex-opt-${year.id}`, bkModalEx, { class: `st-button ${i === 0 ? '' : 'secondary'}`, innerText: `${year.groep.omschrijving || year.groep.code} (${year.studie.code} in ${year.lesperiode.code})`, 'data-icon': i === 0 ? '' : '' })
            button.addEventListener('click', () => exportGradesForYear({ ...year, i, button }))
        })
    })

    async function exportGradesForYear(year) {
        if (busy) return

        busy = true
        bkModalExListTitle.dataset.description = "Schooljaar selecteren..."

        await getApiCredentials()

        let yearElement = await awaitElement(`#aanmeldingenSelect_listbox>li:nth-child(${year.i + 1})`)
        yearElement.click()

        bkModalExListTitle.dataset.description = "Wachten op cijfers..."

        const gradesRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/aanmeldingen/${year.id}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false&peildatum=${year.einde}`, { headers: { Authorization: apiUserToken } })
        if (!gradesRes.ok) {
            bkModalExListTitle.dataset.description = `Fout ${gradesRes.status}\nVernieuw de pagina en probeer het opnieuw`
            bkModalExListTitle.disabled = true
            if (gradesRes.status === 429) bkModalExListTitle.dataset.description = `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`
            bkModalEx.querySelectorAll(`[id*='st-cf-bk-ex-opt']`).forEach(e => e.remove())
            return
        }
        const gradesJson = await gradesRes.json()
        const gradesArray = gradesJson.Items

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
                        const extraRes = await fetch(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/${apiUserId}/aanmeldingen/${year.id}/cijfers/extracijferkolominfo/${gradeBasis.CijferKolom.Id}`, { headers: { Authorization: apiUserToken } })
                        if (!extraRes.ok) {
                            bkModalExListTitle.dataset.description = `Fout ${extraRes.status}\nVernieuw de pagina en probeer het opnieuw`
                            bkModalExListTitle.disabled = true
                            if (extraRes.status === 429) bkModalExListTitle.dataset.description = `Verzoeksquotum overschreden\nWacht even, vernieuw de pagina en probeer het opnieuw`
                            bkModalEx.querySelectorAll(`[id*='st-cf-bk-ex-opt']`).forEach(e => e.remove())
                            return
                        }
                        const gradeExtra = await extraRes.json()

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
            a = element('a', 'st-cf-bk-temp', document.body, {
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
        bkModalEx.querySelectorAll(`[id*='st-cf-bk-ex-opt']`).forEach(e => e.remove())
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
            aside.id = 'st-cf-bk-aside'
            aside.append(bkIWrapper)
            bkIWrapper.id = 'st-cf-bk-i-wrapper'
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

            if (document.querySelector('#st-cf-sc')) {
                document.querySelector('#st-cf-sc').style.display = 'flex'
                document.querySelector('#st-cf-sc').classList.add('small')
                document.querySelector('#st-cf-sc-bk-communication').click()
                document.querySelector('#st-cf-sc-year-filter-wrapper').style.display = 'none'
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

// Page 'Cijferoverzicht', statistics
// TODO: Clean up code and muck
async function gradeStatistics() {
    if (!syncedStorage['magister-cf-statistics']) return
    let tabs = await awaitElement('#cijfers-container > aside > div.head-bar > ul'),
        scTab = document.createElement('li'),
        scTabLink = document.createElement('a'),
        scContainer = element('div', 'st-cf-sc', document.body, { style: 'display: none;', class: 'not-ready' }),
        scFilterContainer = document.createElement('div'),
        scYearFilterWrapper = document.createElement('div'),
        scRowFilterWrapper = document.createElement('div'),
        scRowFilter = document.createElement('textarea'),
        scRowFilterInclude = document.createElement('button'),
        scRowFilterExclude = document.createElement('button'),
        scAveragesContainer = document.createElement('div'),
        scAveragesWrapper1 = document.createElement('div'),
        scAveragesWrapper2 = document.createElement('div'),
        scAveragesWrapper3 = document.createElement('div'),
        scNum = document.createElement('div'),
        scMean = document.createElement('div'),
        scMedian = document.createElement('div'),
        scStDev = element('div', undefined, undefined, { 'data-description': "Standaardafwijking", class: 'st-metric' }),
        scMin = document.createElement('div'),
        scMax = document.createElement('div'),
        scSufficient = document.createElement('div'),
        scInsufficient = document.createElement('div'),
        scGradesContainer = document.createElement('div'),
        scInteractionPreventer = document.createElement('div'),
        scBkCommunication = document.createElement('button'),
        grades = {},
        years = new Set(),
        backup = false

    tabs.append(scTab)
    scTab.id = 'st-cf-sc-tab'
    scTab.classList.add('asideTrigger')
    scTab.append(scTabLink)
    scTabLink.innerText = "Statistieken"
    document.body.append(scInteractionPreventer, scBkCommunication)
    scContainer.append(scAveragesContainer, scGradesContainer, scFilterContainer)
    scFilterContainer.id = 'st-cf-sc-filter-container'
    scFilterContainer.append(scYearFilterWrapper, scRowFilterWrapper)
    scYearFilterWrapper.id = 'st-cf-sc-year-filter-wrapper'
    scRowFilterWrapper.id = 'st-cf-sc-row-filter-wrapper'
    scRowFilterWrapper.append(scRowFilter, scRowFilterInclude, scRowFilterExclude)
    setAttributes(scRowFilter, { id: 'st-cf-sc-row-filter', rows: 3, placeholder: "Typ hier vaknamen, gescheiden door komma's.\nWijzig de modus (insluiten of uitsluiten) met de knop hierboven." })
    // Make the row filter much like the year filter, in that all subjects are displayed with checkboxes in front.
    scRowFilterInclude.id = 'st-cf-sc-row-filter-include'
    scRowFilterInclude.classList.add('st-button', 'small', 'switch-left')
    scRowFilterInclude.innerText = "Wel"
    scRowFilterInclude.title = "Alleen de opgegeven vakken worden meegerekend."
    scRowFilterExclude.id = 'st-cf-sc-row-filter-exclude'
    scRowFilterExclude.classList.add('st-button', 'small', 'secondary', 'switch-right')
    scRowFilterExclude.innerText = "Niet"
    scRowFilterExclude.title = "Alle vakken worden meegerekend, behalve de opgegeven vakken."
    scAveragesContainer.id = 'st-cf-sc-averages-container'
    scAveragesContainer.append(scAveragesWrapper1, scAveragesWrapper2, scAveragesWrapper3)
    scAveragesWrapper1.append(scMean, scMedian)
    scAveragesWrapper2.append(scNum, scSufficient, scInsufficient)
    scAveragesWrapper3.append(scMin, scMax)
    scGradesContainer.id = 'st-cf-sc-grades-container'
    scBkCommunication.id = 'st-cf-sc-bk-communication'
    scBkCommunication.style.display = 'none'

    tabs.addEventListener('click', () => {
        if (scTab.classList.contains('active')) {
            scTab.classList.remove('active')
            tabs.classList.remove('st-cf-sc-override')
            scContainer.style.display = 'none'
        }
    })

    scTab.addEventListener('click', async event => {
        event.stopPropagation()
        tabs.classList.add('st-cf-sc-override')
        scTab.classList.add('active')
        scContainer.style.display = 'flex'
    })

    scRowFilter.addEventListener('input', async () => {
        await displayStatistics(grades)
    })

    scRowFilterInclude.addEventListener('click', async () => {
        scRowFilterInclude.classList.remove('secondary')
        scRowFilterExclude.classList.add('secondary')
        await displayStatistics(grades)
    })

    scRowFilterExclude.addEventListener('click', async () => {
        scRowFilterExclude.classList.remove('secondary')
        scRowFilterInclude.classList.add('secondary')
        await displayStatistics(grades)
    })

    scBkCommunication.addEventListener('click', async () => {
        backup = true
        years = new Set()
        grades = {}
        setTimeout(async () => {
            grades = await gatherGradesForYear(grades)
            scContainer.classList.remove('not-ready')
            await displayStatistics(grades)
        }, 200);
    })

    scTab.addEventListener('click', async event => {
        grades = await gatherGradesForYear(grades)
        scContainer.classList.remove('not-ready')
        await displayStatistics(grades)
    }, { once: true })

    document.querySelector('#idWeergave > div > div:nth-child(1) > div > div > form > div:nth-child(2) > div > span').click()
    document.querySelector('#cijferSoortSelect_listbox > li:nth-child(1)').click()
    let yearSelect = await awaitElement('#idWeergave > div > div:nth-child(1) > div > div > form > div:nth-child(1) > div > span')
    yearSelect.click()
    document.querySelectorAll(`#aanmeldingenSelect_listbox>li.k-item`).forEach((year, index) => {
        if (document.getElementById(`st-cf-sc-year-${index}`)) return
        years.add(year.innerText)
        let label = document.createElement('label'),
            input = document.createElement('input')
        scYearFilterWrapper.append(input, label)
        label.innerText = year.innerText
        label.setAttribute('for', `st-cf-sc-year-${index}`)
        setAttributes(input, { type: 'checkbox', id: `st-cf-sc-year-${index}` })
        if (index === 0) input.checked = true
        input.addEventListener('input', async () => {
            if (!grades[index]) {
                label.dataset.loading = true
                grades = await gatherGradesForYear(grades, index)
                label.dataset.loading = false
            }
            await displayStatistics(grades)
        })
    })
    yearSelect.click()

    async function gatherGradesForYear(grades = {}, index = 0) {
        return new Promise(async (resolve, reject) => {
            scTab.dataset.loading = true
            scInteractionPreventer.id = 'st-prevent-interactions'
            if (!backup) {
                let yearSelection = await awaitElement(`#aanmeldingenSelect_listbox>li:nth-child(${index + 1})`),
                    tableBody = await awaitElement("#cijferoverzichtgrid tbody")
                tableBody.innerText = ''
                yearSelection.click()
            }

            setTimeout(async () => {
                let gradeElements = await awaitElement('#cijferoverzichtgrid:not(.ng-hide) tr td>span.grade:not(.empty, .gemiddeldecolumn), #cijferoverzichtgrid:not(.ng-hide) tr td>span.grade.herkansingKolom:not(.empty), #cijferoverzichtgrid:not(.ng-hide) tr td>span.grade.heeftonderliggendekolommen:not(.empty)', true, 2000)
                if (gradeElements?.[0]) {
                    gradeElements.forEach(grade => {
                        let result = Number(grade.innerText.replace(',', '.').replace('', '')),
                            id = grade.id,
                            subject = grade.parentElement.parentElement.querySelector('td>span.text').innerText
                        if (!isNaN(result)) {
                            if (!grades[index]) grades[index] = {}
                            if (!grades[index][subject]) grades[index][subject] = {}
                            grades[index][subject][id] = result
                        }
                    })
                }
                resolve(grades)
                scInteractionPreventer.id = ''
            }, index < 1 ? 0 : 500)
        })
    }

    async function displayStatistics(grades = new Set()) {
        return new Promise(async (resolve, reject) => {
            let results = [],
                roundedFrequencies = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }

            Object.keys(grades).forEach(yearIndex => {
                if (!backup && !document.querySelector(`#st-cf-sc-year-${yearIndex}`).checked) return
                let yearObject = grades[yearIndex]
                Object.keys(yearObject).forEach(subjectKey => {
                    if (document.querySelector("#st-cf-sc-row-filter-exclude").classList.contains('secondary') && document.querySelector("#st-cf-sc-row-filter").value && !document.querySelector("#st-cf-sc-row-filter").value.split(/(?:,|\r|\n|\r\n)/g).map(x => x.toLowerCase().trim()).includes(subjectKey.toLowerCase())) return
                    if (document.querySelector("#st-cf-sc-row-filter-include").classList.contains('secondary') && document.querySelector("#st-cf-sc-row-filter").value && document.querySelector("#st-cf-sc-row-filter").value.split(/(?:,|\r|\n|\r\n)/g).map(x => x.toLowerCase().trim()).includes(subjectKey.toLowerCase())) return
                    let subjectObject = yearObject[subjectKey]
                    Object.values(subjectObject).forEach(result => {
                        if (result > 10) return
                        results.push(result)
                        roundedFrequencies[Math.round(result)]++
                    })
                })
            })

            if (results.length < 1) {
                scContainer.classList.add('empty')
                scTab.dataset.loading = false
                return
            } else scContainer.classList.remove('empty')

            scNum.dataset.description = "Aantal"
            scNum.classList.add('st-metric')
            scNum.innerText = results.length

            scMean.dataset.description = "Gemiddelde (excl. weging)"
            scMean.classList.add('st-metric')
            scMean.innerText = weightedMean(results).toLocaleString('nl-NL', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
            scMean.style.color = 'var(--st-foreground-primary)'

            scMedian.dataset.description = "Mediaan"
            scMedian.classList.add('st-metric')
            scMedian.innerText = median(results).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

            scStDev.innerText = standardDeviation(results).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

            scMin.dataset.description = "Laagste cijfer"
            scMin.classList.add('st-metric')
            scMin.innerText = Math.min(...results).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

            scMax.dataset.description = "Hoogste cijfer"
            scMax.classList.add('st-metric')
            scMax.innerText = Math.max(...results).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

            scSufficient.dataset.description = "Voldoendes"
            scSufficient.classList.add('st-metric')
            let resultsSufficient = results.filter((e) => { return e >= 5.5 })
            if (resultsSufficient.length > 0) {
                scSufficient.innerText = resultsSufficient.length
                scSufficient.dataset.extra = `${(resultsSufficient.length / results.length * 100).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
            } else {
                scSufficient.innerText = 'geen'
                scSufficient.removeAttribute('data-extra')
            }

            scInsufficient.dataset.description = "Onvoldoendes"
            scInsufficient.classList.add('st-metric')
            let resultsInsufficient = results.filter((e) => { return e < 5.5 })
            if (resultsInsufficient.length > 0) {
                scInsufficient.innerText = resultsInsufficient.length
                scInsufficient.dataset.extra = `${(resultsInsufficient.length / results.length * 100).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
            } else {
                scInsufficient.innerText = 'geen'
                scInsufficient.removeAttribute('data-extra')
            }

            for (let key = 1; key <= 10; key++) {
                let value = roundedFrequencies[key],
                    element = document.getElementById(`st-cf-sc-histogram-${key}`),
                    arr = Object.values(roundedFrequencies),
                    max = Math.max(...arr)
                if (!element) {
                    element = document.createElement('div')
                    element.id = `st-cf-sc-histogram-${key}`
                    scGradesContainer.append(element)
                    element.dataset.grade = key
                }
                element.dataset.times = value
                element.dataset.percentage = (value / results.length * 100).toLocaleString('nl-NL', { maximumFractionDigits: 0 })
                element.style.maxHeight = `${value / max * 100}%`
                element.style.minHeight = `${value / max * 100}%`
            }

            scTab.dataset.loading = false
            resolve()
        })
    }
}