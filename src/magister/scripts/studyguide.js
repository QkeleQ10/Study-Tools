// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    document.querySelectorAll('.st-button, [id^="st-cf"], .k-animation-container').forEach(e => e.remove())

    const href = document.location.href.split('?')[0]

    if (href.includes('/studiewijzer/')) studyguideIndividual()
    else if (href.includes('/studiewijzer')) studyguideList()
}

// Page 'Studiewijzers'
async function studyguideList() {
    if (!syncedStorage['sw-enabled']) return

    renderStudyguideList()

    let hiddenStudyguides = await getFromStorage('hidden-studyguides', 'local') || []
    let searchBar = element('input', 'st-sw-search', document.body, { class: "st-input", placeholder: "Studiewijzers zoeken" })
    // searchBar.focus()
    searchBar.addEventListener('keyup', e => {
        if ((e.key === 'Enter' || e.keyCode === 13) && searchBar.value?.length > 0) {
            document.querySelector('.st-sw-item:not(.hidden), .st-sw-item-default:not(.hidden)').click()
        }
    })
    searchBar.addEventListener('input', validateItems)

    let showHiddenItemsLabel = element('label', 'st-sw-show-hidden-items-label', document.body, { class: "st-checkbox-label", innerText: "Verborgen items weergeven", 'data-disabled': hiddenStudyguides?.length < 1, title: hiddenStudyguides?.length < 1 ? "Er zijn geen verborgen items. Verberg items door in een studiewijzer op het oog-icoon te klikken." : "Studiewijzers die je hebt verborgen toch in de lijst tonen" })
    let showHiddenItemsInput = element('input', 'st-sw-show-hidden-items', showHiddenItemsLabel, { type: 'checkbox', class: "st-checkbox-input" })
    showHiddenItemsInput.addEventListener('input', validateItems)

    function validateItems() {
        let gridContainer = document.querySelector('#st-sw-container')
        let cols = document.querySelectorAll('#st-sw-container .st-sw-col')
        if (!gridContainer || !cols?.[0]) return

        gridContainer.querySelectorAll('.st-sw-item, .st-sw-item-default').forEach(studyguide => {
            let query = searchBar.value.toLowerCase()
            let matches = (studyguide.dataset.title.toLowerCase().includes(query) || studyguide.closest('.st-sw-subject').dataset.subject.toLowerCase().includes(query)) && (!hiddenStudyguides.includes(studyguide.dataset.title) || showHiddenItemsInput.checked)

            if (matches) studyguide.classList.remove('hidden')
            else studyguide.classList.add('hidden')
        })

        let subjectTiles = gridContainer.querySelectorAll('.st-sw-subject')
        let visibleSubjectTiles = [...subjectTiles].filter(element => element.querySelector('button:not(.hidden)'))
        visibleSubjectTiles.sort((a, b) => a.dataset.subject.localeCompare(b.dataset.subject)).forEach((studyguide, i, a) => {
            cols[Math.floor((i / a.length) * cols.length)].appendChild(studyguide)
        })
    }

    // TODO: This can definitely be more elegant
    setTimeout(validateItems, 200)
    setTimeout(validateItems, 600)
    setTimeout(validateItems, 1200)
}

// Page 'Studiewijzer'
async function studyguideIndividual() {
    if (syncedStorage['sw-current-week-behavior'] === 'focus' || syncedStorage['sw-current-week-behavior'] === 'highlight') {
        let list = await awaitElement('.studiewijzer-content-container>ul'),
            titles = await awaitElement('li.studiewijzer-onderdeel>div.block>h3>b.ng-binding', true),
            regex = new RegExp(/(w|sem|ε|heb)[^\s\d]*\s?(match){1}.*/i)

        list.parentElement.style.paddingTop = '8px !important'
        list.parentElement.style.paddingLeft = '8px !important'
        list.parentElement.setAttribute('style', 'border: none !important; padding: 8px 0 0 8px !important;')

        titles.forEach(async title => {
            if (list.childElementCount === 1 || regex.exec(title.innerText.replace(await getWeekNumber(), 'match'))) {
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
            showSnackbar(`Studiewijzer '${studyguideTitle}' verborgen`)
            document.querySelector('.st-sw-selected').classList.add('hidden-item')
        } else {
            studyguideIsHidden = false
            hideItemButton.dataset.icon = ''
            hideItemButton.title = "Studiewijzer verbergen"
            hiddenStudyguides.splice(hiddenStudyguides.indexOf(studyguideTitle), 1)
            showSnackbar(`Studiewijzer '${studyguideTitle}' niet langer verborgen`)
            document.querySelector('.st-sw-selected').classList.remove('hidden-item')
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
        currentPeriod = await getPeriodNumber(),
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
            priority,
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

        if (period === currentPeriod) priority = 2
        else if (period > 0) priority = 0
        else priority = 1

        if (!object[subject]) object[subject] = []
        object[subject].push({ elem, title, period, priority })
    })

    Object.keys(object).sort((a, b) => a.localeCompare(b)).forEach((subject, i, a) => {
        let items = object[subject]

        let subjectTile = element('div', `st-sw-subject-${subject}`, cols[Math.floor((i / a.length) * Number(settingCols))], { class: 'st-sw-subject', 'data-subject': subject })

        if (items.length > 1) {
            let subjectHeadline = element('div', `st-sw-subject-${subject}-headline`, subjectTile, { innerText: subject, class: 'st-sw-subject-headline' })
            let itemsWrapper = element('div', `st-sw-subject-${subject}-wrapper`, subjectTile, { class: 'st-sw-items-wrapper', 'data-flex-row': Number(settingCols) < 2 })
            for (let i = 0; i < items.length; i++) {
                const item = items.sort((a, b) => b.priority - a.priority)[i]

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
}
