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
    let aside = await awaitElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        menuHost = await awaitElement('.menu-host'),
        menuCollapser = await awaitElement('.menu-footer>a'),
        gradesContainer = await awaitElement('.content-container-cijfers, .content-container'),
        gradeDetails = await awaitElement('#idDetails>.tabsheet .block .content dl'),
        clOpen = document.createElement('button'),
        clCloser = document.createElement('button'),
        clAddTable = document.createElement('button'),
        clAddCustom = document.createElement('button'),
        clOverlay = document.createElement('div'),
        clSidebar = document.createElement('div'),
        clTitle = document.createElement('span'),
        clSubtitle = document.createElement('span'),
        clAddCustomResult = document.createElement('input'),
        clAddCustomWeight = document.createElement('input'),
        clAdded = document.createElement('p'),
        clAveragesWrapper = document.createElement('div'),
        clMean = document.createElement('div'),
        clMedian = document.createElement('div'),
        clFutureWeight = document.createElement('input'),
        clFutureDesc = document.createElement('p'),
        clCanvas = document.createElement('canvas'),
        ctx = clCanvas.getContext('2d'),
        clCanvasHlVertical = document.createElement('div'),
        clCanvasHlHorizontal = document.createElement('div'),
        resultsList = [],
        weightsList = [],
        hypotheticalWeight = 1,
        calcMean,
        calcMedian

    document.body.append(clOpen)
    clOpen.classList.add('st-button')
    clOpen.id = 'st-cf-cl-open'
    clOpen.innerText = "Cijfercalculator"
    clOpen.dataset.icon = ''
    document.body.append(clOverlay)
    clOverlay.id = 'st-cf-cl'
    clOverlay.classList.add('st-overlay')
    clOverlay.dataset.step = 0
    clOverlay.append(clCloser, clTitle, clSubtitle, clAddTable, clSidebar, clAddCustomResult, clAddCustomWeight, clAddCustom, clCanvasHlVertical, clCanvasHlHorizontal, clFutureWeight)
    clSidebar.id = 'st-cf-cl-sidebar'
    clSidebar.append(clAdded, clAveragesWrapper, clFutureDesc, clCanvas)
    clTitle.id = 'st-cf-cl-title'
    clTitle.innerText = "Cijfercalculator"
    clSubtitle.id = 'st-cf-cl-subtitle'
    clAdded.id = 'st-cf-cl-added'
    clAveragesWrapper.append(clMean, clMedian)
    clAveragesWrapper.id = 'st-cf-cl-averages'
    clMean.dataset.description = "Gemiddelde (incl. weging)"
    clMean.classList.add('st-metric')
    clMean.id = 'st-cf-cl-mean'
    clMedian.dataset.description = "Mediaan"
    clMedian.classList.add('st-metric')
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
        clOverlay.dataset.step = 1
        resultsList = []
        weightsList = []
        clAdded.innerText = ''
        clMean.innerText = '?'
        clMedian.innerText = '?'
        clFutureDesc.innerText = "Zie hier wat je moet halen en wat je komt te staan."
        ctx.clearRect(0, 0, clCanvas.width, clCanvas.height)
        clSubtitle.innerText = "Voeg cijfers toe met de knoppen of dubbelklik op een cijfer uit de tabel. \nDruk op de toets '?' om de zijbalk weer te geven."
        gradesContainer.style.zIndex = '9999999'
        gradesContainer.style.maxWidth = 'calc(100vw - 477px)'
        if (!menuHost.classList.contains('collapsed-menu')) menuCollapser.click()
    })

    addEventListener("keydown", e => {
        if (clOverlay.dataset.step != 0 && (e.key === '?' || e.key === '/')) aside.classList.toggle('st-appear-top')
    })

    gradesContainer.addEventListener('dblclick', () => {
        if (clOverlay.dataset.step == 0) return
        clAddTable.click()
    })

    document.querySelectorAll('#st-cf-cl-add-table, #st-cf-cl-add-custom').forEach(e => {
        e.addEventListener('click', async event => {

            let item = document.querySelector('.k-state-selected'),
                result, weight, column, title

            if (clAddTable.disabled) return
            clAddTable.setAttribute('disabled', true)
            setTimeout(() => {
                clAddTable.removeAttribute('disabled')
            }, 300)

            if (item.dataset.title) {
                result = Number(item.dataset.result.replace(',', '.'))
                weight = Number(item.dataset.weight.replace('x', '').replace(',', '.'))
                column = item.dataset.column
                title = item.dataset.title
            } else if (event.target.id === 'st-cf-cl-add-table') {
                // TODO: Get rid of this annoying timeout
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
                }, 300)
            } else if (event.target.id === 'st-cf-cl-add-custom') {
                result = Number(clAddCustomResult.value), weight = Number(clAddCustomWeight.value)
            }

            let pos = event.target.id === 'st-cf-cl-add-table' ? document.querySelector('.k-state-selected .grade')?.getBoundingClientRect() : clAddCustomResult.getBoundingClientRect(),
                ghostElement = document.createElement('span')
            if (!pos) {
                ghostElement.remove()
                notify('snackbar', 'Er is geen cijfer geselecteerd.')
                return
            }
            setAttributes(ghostElement, { class: 'st-cf-ghost', style: `top: ${pos.top}px; right: ${window.innerWidth - pos.right}px;` })
            ghostElement.innerText = document.querySelector('.k-state-selected .grade')?.lastChild?.wholeText || clAddCustomResult.value
            document.body.append(ghostElement)

            setTimeout(() => {
                if (isNaN(result) || isNaN(weight) || result < 1 || result > 10) {
                    ghostElement.remove()
                    notify('snackbar', 'Dat cijfer kan niet worden toegevoegd aan de berekening.')
                    return
                }
                if (weight <= 0) {
                    ghostElement.remove()
                    notify('snackbar', 'Dat cijfer telt niet mee en is niet toegevoegd aan de berekening.')
                    return
                }

                let addedElement = document.createElement('span')
                clAdded.append(addedElement)
                setAttributes(addedElement, { class: 'st-cf-cl-added-element', 'data-grade-index': resultsList.length })
                addedElement.scrollIntoView({ behavior: 'smooth' })

                pos = addedElement.getBoundingClientRect()
                ghostElement.setAttribute('style', `top: ${pos.top}px; right: ${window.innerWidth - pos.right}px;`)
                ghostElement.classList.add('st-cf-ghost-moving')

                setTimeout(() => {
                    ghostElement.remove()
                }, 400)

                if (column && title)
                    addedElement.innerText = `${result.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}x) — ${column}, ${title}\n`
                else
                    addedElement.innerText = `${result.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}x) — handmatig ingevoerd\n`

                addedElement.addEventListener('click', event => {
                    resultsList.splice(Array.from(event.target.parentNode.children).indexOf(event.target), 1)
                    weightsList.splice(Array.from(event.target.parentNode.children).indexOf(event.target), 1)
                    event.target.classList.add('remove')
                    setTimeout(() => {
                        event.target.remove()
                    }, 200)
                    calcMean = weightedMean(resultsList, weightsList)
                    calcMedian = median(resultsList)
                    clMean.innerText = isNaN(calcMean) ? '?' : calcMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    clMedian.innerText = isNaN(calcMedian) ? '?' : calcMedian.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    if (calcMean < 5.5) clMean.classList.add('insufficient')
                    else clMean.classList.remove('insufficient')

                    renderGradeChart(resultsList, weightsList, hypotheticalWeight, calcMean, clCanvasHlVertical, clCanvasHlHorizontal, clFutureDesc)
                    if (resultsList.length < 1 || weightsList.length < 1 || isNaN(calcMean)) clOverlay.dataset.step = 1
                })

                resultsList.push(result)
                weightsList.push(weight)
                calcMean = weightedMean(resultsList, weightsList)
                calcMedian = median(resultsList)

                clMean.innerText = calcMean.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                clMedian.innerText = calcMedian.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                if (calcMean < 5.5) clMean.classList.add('insufficient')
                else clMean.classList.remove('insufficient')

                clOverlay.dataset.step = 2
                renderGradeChart(resultsList, weightsList, hypotheticalWeight, calcMean, clCanvasHlVertical, clCanvasHlHorizontal, clFutureDesc)
            }, event.target.id === 'st-cf-cl-add-table' ? 300 : 0)
        })
    })

    clFutureWeight.addEventListener('input', async () => {
        hypotheticalWeight = Number(clFutureWeight.value)
        if (isNaN(hypotheticalWeight) || hypotheticalWeight < 1) return
        renderGradeChart(resultsList, weightsList, hypotheticalWeight, calcMean, clCanvasHlVertical, clCanvasHlHorizontal, clFutureDesc)
    })

    clCloser.addEventListener('click', async () => {
        document.body.style.marginLeft = '0'
        gradesContainer.removeAttribute('style')
        clOverlay.dataset.step = 0
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
    clFutureDesc.innerText = "Zie hier wat je moet halen en wat je komt te staan."

    let ctx = clCanvas.getContext('2d')
    ctx.transform(1, 0, 0, -1, 0, clCanvas.height)
    ctx.font = '12px open-sans, sans-serif'

    if (resultsList.length < 1 || weightsList.length < 1 || isNaN(mean)) return

    let means = weightedPossibleMeans(resultsList, weightsList, weight),
        landmarks = [2, 3, 4, 5, 6, 7, 8, 9]
    ctx.clearRect(0, 0, clCanvas.width, clCanvas.height)
    landmarks.forEach(num => {
        ctx.globalAlpha = 0.5
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-border-color')
        ctx.beginPath()
        ctx.moveTo(0, (num * 10 - 9) * heightCoefficient - 1)
        ctx.lineTo(clCanvas.width, (num * 10 - 9) * heightCoefficient - 1)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo((num * 10 - 9) * widthCoefficient - 3, 0)
        ctx.lineTo((num * 10 - 9) * widthCoefficient - 3, clCanvas.height)
        ctx.stroke()
    })

    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-foreground-accent')
    ctx.beginPath()
    ctx.moveTo(0, (mean * 10 - 9) * heightCoefficient - 1)
    ctx.lineTo(clCanvas.width, (mean * 10 - 9) * heightCoefficient - 1)
    ctx.stroke()

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-accent-ok')
    ctx.globalAlpha = .05
    ctx.fillRect(0, 125, 212, 125)
    ctx.globalAlpha = .15
    ctx.fillRect(212, 125, 212, 125)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-accent-warn')
    ctx.globalAlpha = .15
    ctx.fillRect(0, 0, 212, 125)
    ctx.globalAlpha = .05
    ctx.fillRect(212, 0, 212, 125)

    ctx.save()
    ctx.transform(1, 0, 0, -1, 0, clCanvas.height)
    ctx.globalAlpha = .75

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-foreground-primary')
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
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-foreground-primary')
    ctx.beginPath()
    ctx.moveTo((grade1 * 10 - 9) * widthCoefficient - 3, (mean1 * 10 - 9) * heightCoefficient - 1)
    ctx.lineTo((grade55 * 10 - 9) * widthCoefficient - 3, (mean55 * 10 - 9) * heightCoefficient - 1)
    ctx.stroke()
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--st-foreground-primary')
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
        index = Math.round(x / widthCoefficient)
        if (index < 0) index = 0
        else if (index > 90) index = 90

        clCanvasHlVertical.classList.add('show')
        clCanvasHlVertical.style.left = event.clientX + 'px'
        clCanvasHlHorizontal.classList.add('show')
        clCanvasHlHorizontal.style.bottom = Math.abs(means[0][index] * 10 * heightCoefficient) + 'px'
        clCanvasHlHorizontal.dataset.average = means[0][index].toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        clCanvasHlHorizontal.dataset.veryHigh = (means[0][index] > 9.2)

        if (means[0][index] >= 5.495) clFutureDesc.style.color = 'var(--st-foreground-primary)'
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
            if (meanH >= 5.495) {
                color = 'var(--st-foreground-primary)'
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
            color: color || 'var(--st-foreground-primary)'
        })
    })
}

// Page 'Cijferoverzicht', backup
// This needs a rework!!
async function gradeBackup() {
    if (!syncedStorage['magister-cf-backup']) return
    let aside = await awaitElement('#cijfers-container aside, #cijfers-laatst-behaalde-resultaten-container aside'),
        gradesContainer = await awaitElement('.content-container-cijfers, .content-container'),
        bkInvoke = element('button', 'st-cf-bk', document.body, { class: 'st-button', 'data-icon': '', innerText: "Cijferback-up" }),
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