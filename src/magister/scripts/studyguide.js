let hiddenStudyguides = []

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].includes('/studiewijzer/')) studyguideIndividual()
    else if (document.location.href.split('?')[0].includes('/studiewijzer')) studyguideList()
}

// Page 'Studiewijzers'
async function studyguideList() {
    if (!syncedStorage['sw-enabled']) return

    renderStudyguideList()

    hiddenStudyguides = await getFromStorage('hidden-studyguides', 'local') || []
    let searchBar = element('input', 'st-sw-search', document.body, { class: "st-input", placeholder: "Studiewijzers zoeken" })
    // searchBar.focus()
    searchBar.addEventListener('keyup', e => {
        if ((e.key === 'Enter' || e.keyCode === 13) && searchBar.value?.length > 0) {
            document.querySelector('.st-sw-item:not(.hidden), .st-sw-item-default:not(.hidden)').click()
        }
    })
    searchBar.addEventListener('input', appendStudyguidesToList)
    searchBar.addEventListener('input', e => {
        let egg = eggs.find(egg => egg.location === 'studyguidesSearch' && egg.input === e.target.value)
        if (!egg?.output) return

        let fakeSubjectTile = element('div', `st-sw-fake-subject`, document.querySelector('#st-sw-container .st-sw-col') || document.body, { class: 'st-sw-subject' })

        let fakeDefaultItemButton = element('button', `st-sw-fake-item`, fakeSubjectTile, { innerText: "Geheim", class: 'st-sw-item-default' })
        fakeDefaultItemButton.addEventListener('click', () => {
            notify(egg.type || 'snackbar', egg.output, null, 3600000)
        })

        let fakeDefaultItemDescription = element('span', `st-sw-fake-item-desc`, fakeDefaultItemButton, { innerText: "Wat kan dit betekenen?", class: 'st-sw-item-default-desc', 'data-2nd': "Klik dan!" })
    })

    let showHiddenItemsLabel = element('label', 'st-sw-show-hidden-items-label', document.body, { class: "st-checkbox-label", innerText: "Verborgen items weergeven", 'data-disabled': hiddenStudyguides?.length < 1, title: hiddenStudyguides?.length < 1 ? "Er zijn geen verborgen items. Verberg items door in een studiewijzer op het oog-icoon te klikken." : "Studiewijzers die je hebt verborgen toch in de lijst tonen" })
    let showHiddenItemsInput = element('input', 'st-sw-show-hidden-items', showHiddenItemsLabel, { type: 'checkbox', class: "st-checkbox-input" })
    showHiddenItemsInput.addEventListener('input', appendStudyguidesToList)

    let swHelp = element('button', 'st-sw-help', document.body, { class: 'st-button icon', title: "Informatie over studiewijzers met 'Geen vak'", 'data-icon': '', style: 'display: none' })
    swHelp.addEventListener('click', async () => {
        await notify('dialog', "Eén of meerdere van je studiewijzers is gelabeld als 'Geen vak'. Dit gebeurt als het vak van je studiewijzer \nniet kan worden afgeleid uit de naam van de studiewijzer. Daar zit een complex systeem achter.\n\nGelukkig kun je dit systeem zelf bijstellen. Als je wilt, kun je in het configuratiepaneel onder 'ELO' \nen dan 'Vaknamen bewerken' zelf je vaknamen beheren.\n\nZorg er dan voor dat je onder 'Weergavenaam' de juiste vaknaam invoert, en onder 'Aliassen' de \nvakcodes/-afkortingen die gebruikt worden in de titel van de studiewijzer.")
    })
}

// Page 'Studiewijzer'
async function studyguideIndividual() {
    if (syncedStorage['sw-current-week-behavior'] === 'focus' || syncedStorage['sw-current-week-behavior'] === 'highlight') {
        let list = await awaitElement('.studiewijzer-content-container>ul'),
            titles = await awaitElement('li.studiewijzer-onderdeel>div.block>h3>b.ng-binding', true),
            regex = new RegExp(/(w|sem|ε|heb)[^\s\d]*\s?0?(match)(?!\d)/i)

        list.parentElement.style.paddingTop = '8px !important'
        list.parentElement.style.paddingLeft = '8px !important'
        list.parentElement.setAttribute('style', 'border: none !important; padding: 8px 0 0 8px !important;')

        titles.forEach(async title => {
            if (list.childElementCount === 1 || regex.exec(title.innerText.replace(new Date().getWeek(), 'match'))) {
                let top = title.parentElement,
                    bottom = top.nextElementSibling.lastElementChild.previousElementSibling,
                    li = top.parentElement.parentElement
                li.classList.add('st-current-sw')
                top.setAttribute('title', "De titel van dit kopje komt overeen met het huidige weeknummer.")
                if (syncedStorage['sw-current-week-behavior'] === 'focus') {
                    bottom.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    title.click()
                }
            }
        })
    }

    if (!syncedStorage['sw-enabled']) return

    renderStudyguideList()

    let hiddenStudyguides = await getFromStorage('hidden-studyguides', 'local') || []
    let studyguideTitle = document.querySelector('dna-page-header.ng-binding')?.firstChild?.textContent?.trim()
    let studyguideIsHidden = hiddenStudyguides.indexOf(studyguideTitle) >= 0
    let hideItemButton = element('button', 'st-sw-item-hider', document.body, { class: "st-button icon", 'data-icon': studyguideIsHidden ? '' : '', title: studyguideIsHidden ? "Studiewijzer niet langer verbergen" : "Studiewijzer verbergen", tabindex: 100 })
    hideItemButton.addEventListener('click', () => {
        if (!studyguideIsHidden) {
            studyguideIsHidden = true
            hideItemButton.dataset.icon = ''
            hideItemButton.title = "Studiewijzer niet langer verbergen"
            hiddenStudyguides.push(studyguideTitle)
            notify('snackbar', `Studiewijzer '${studyguideTitle}' verborgen op dit apparaat`, null, 3000)
            document.querySelector('.st-sw-selected')?.classList.add('hidden-item')
        } else {
            studyguideIsHidden = false
            hideItemButton.dataset.icon = ''
            hideItemButton.title = "Studiewijzer verbergen"
            hiddenStudyguides.splice(hiddenStudyguides.indexOf(studyguideTitle), 1)
            notify('snackbar', `Studiewijzer '${studyguideTitle}' niet langer verborgen op dit apparaat`, null, 3000)
            document.querySelector('.st-sw-selected')?.classList.remove('hidden-item')
        }
        saveToStorage('hidden-studyguides', hiddenStudyguides, 'local')
    })
}

// Render studyguide list
async function renderStudyguideList() {
    if (!syncedStorage['sw-enabled']) return

    let mainView = document.querySelector('div.view'),
        widget = document.querySelector('div.full-height.widget'),
        gridContainer = widget || mainView

    let hiddenStudyguides = await getFromStorage('hidden-studyguides', 'local') || []

    const settingCols = syncedStorage['sw-cols'],
        settingShowPeriod = syncedStorage['sw-period'],
        subjectsArray = Object.values(syncedStorage['subjects']),
        viewTitle = document.querySelector('dna-page-header.ng-binding')?.firstChild?.textContent?.replace(/(\\n)|'|\s/gi, ''),
        originalItems = await awaitElement('.studiewijzer-list > ul > li, .content.projects > ul > li', true),
        gridWrapper = element('div', 'st-sw-container', gridContainer)

    let cols = [],
        object = {}

    for (let i = 1; i <= Number(settingCols); i++) {
        cols.push(element('div', `st-sw-col-${i}`, gridWrapper, { class: 'st-sw-col' }))
    }

    originalItems.forEach(elem => {
        let title = elem.firstElementChild.firstElementChild.innerText,
            subject = "Geen vak",
            period = 0,
            periodTextIndex = title.search(/(kw(t)?|(kwintaal)|t(hema)?|p(eriod(e)?)?)(\s|\d)/i)

        subjectsArray.forEach(subjectEntry => {
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

        if (!object[subject]) object[subject] = []
        object[subject].push({ elem, title, period })

        if (subject === "Geen vak" && document.querySelector('#st-sw-help')) {
            document.querySelector('#st-sw-help').style.display = 'flex'
        }
    })

    let tiles = []
    let tempTilesHolder = element('div', 'st-sw-tiles-holder', document.body, { style: 'display: none;' })

    Object.keys(object).sort((a, b) => a.localeCompare(b)).forEach((subject, i, a) => {
        let items = object[subject]

        let subjectTile = element('div', `st-sw-subject-${subject}`, tempTilesHolder, { class: 'st-sw-subject', 'data-subject': subject }) //cols[Math.floor((i / a.length) * Number(settingCols))]

        if (items.length > 1) {
            let subjectHeadline = element('div', `st-sw-subject-${subject}-headline`, subjectTile, { innerText: subject, class: 'st-sw-subject-headline' })
            let itemsWrapper = element('div', `st-sw-subject-${subject}-wrapper`, subjectTile, { class: 'st-sw-items-wrapper', 'data-flex-row': Number(settingCols) < 2 })
            for (let i = 0; i < items.length; i++) {
                const item = items.sort((a, b) => a.period - b.period)[i]

                let periodText = `Periode ${item.period}`
                if (item.period < 1) periodText = "Geen periode"

                let itemButton = element('button', `st-sw-item-${item.title}`, itemsWrapper, settingShowPeriod ? { innerText: periodText, class: 'st-sw-item', 'data-title': item.title, 'data-2nd': item.title } : { innerText: item.title, class: 'st-sw-item', 'data-title': item.title, 'data-2nd': periodText })
                itemButton.addEventListener('click', () => {
                    for (const e of document.querySelectorAll('.studiewijzer-list ul>li>a>span:first-child, .tabsheet .widget ul>li>a>span')) {
                        if (e.textContent.includes(item.title)) e.click()
                    }
                })

                if (hiddenStudyguides.includes(item.title)) itemButton.classList.add('hidden-item', 'hidden')

                if (viewTitle?.toLowerCase() === item.title.replace(/(\\n)|'|\s/gi, '').toLowerCase()) {
                    itemButton.classList.add('st-sw-selected')
                    itemButton.classList.remove('hidden')
                }
            }
        } else if (items[0]) {
            let item = items[0]

            let defaultItemButton = element('button', `st-sw-item-${item.title}`, subjectTile, { innerText: subject, class: 'st-sw-item-default', 'data-title': item.title })
            defaultItemButton.addEventListener('click', () => {
                for (const e of document.querySelectorAll('.studiewijzer-list ul>li>a>span:first-child, .tabsheet .widget ul>li>a>span')) {
                    if (e.textContent.includes(item.title)) e.click()
                }
            })

            let periodText = `Periode ${item.period}`
            if (item.period < 1) periodText = "Geen periode"

            let defaultItemDescription = element('span', `st-sw-item-${item.title}-desc`, defaultItemButton, settingShowPeriod ? { innerText: periodText, class: 'st-sw-item-default-desc', 'data-title': item.title, 'data-2nd': item.title } : { innerText: item.title, class: 'st-sw-item-default-desc', 'data-title': item.title, 'data-2nd': periodText })

            if (hiddenStudyguides.includes(item.title)) defaultItemButton.classList.add('hidden-item', 'hidden')

            if (viewTitle?.toLowerCase() === item.title.replace(/(\\n)|'|\s/gi, '').toLowerCase()) {
                defaultItemButton.classList.add('st-sw-selected')
                defaultItemButton.classList.remove('hidden')
            }
        }
    })

    if (!gridWrapper?.parentElement || !document.body.contains(gridContainer)) {
        mainView = await awaitElement('div.view')
        widget = document.querySelector('div.full-height.widget')
        gridContainer = widget || mainView
        gridContainer.appendChild(gridWrapper)
    }
    if (!document.location.href.includes('/studiewijzer') && gridWrapper) {
        gridWrapper.remove()
    }

    appendStudyguidesToList(tiles)
}

// Append the study guides to the list
function appendStudyguidesToList() {
    let tiles = document.querySelectorAll('.st-sw-subject')
    let items = document.querySelectorAll('.st-sw-item, .st-sw-item-default')
    let searchBar = document.querySelector('#st-sw-search')
    let showHiddenItemsInput = document.querySelector('#st-sw-show-hidden-items')
    let gridContainer = document.querySelector('#st-sw-container')
    let cols = document.querySelectorAll('#st-sw-container .st-sw-col')
    if (!gridContainer || !cols?.[0]) return

    // First, define which study guide items should be shown.
    items.forEach(studyguide => {
        if (studyguide.id === 'st-sw-fake-item') {
            studyguide.parentElement.remove()
            return
        }

        let matches

        if (searchBar && showHiddenItemsInput) {
            let query = searchBar.value.toLowerCase()
            matches = (studyguide.dataset.title?.toLowerCase().includes(query) || studyguide.closest('.st-sw-subject').dataset.subject?.toLowerCase().includes(query)) && (!hiddenStudyguides.includes(studyguide.dataset.title) || showHiddenItemsInput.checked)
        } else {
            matches = (!hiddenStudyguides.includes(studyguide.dataset.title))
        }

        if (matches) studyguide.classList.remove('hidden')
        else studyguide.classList.add('hidden')
    })

    // Next, define which subject tiles have visible children.
    let visibleSubjectTiles = [...tiles].filter(element => element.querySelector('button:not(.hidden)'))

    // Finally, sort the subject tiles and equally distribute them across columns.
    visibleSubjectTiles.sort((a, b) => a.dataset.subject.localeCompare(b.dataset.subject)).forEach((studyguide, i, a) => {
        cols[Math.floor((i / a.length) * cols.length)].appendChild(studyguide)
    })
}