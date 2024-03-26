let savedStudyguides = Object.values(syncedStorage?.['sw-list'] || []) || []

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

    let hiddenItemsContainer = element('div', 'st-sw-hidden-items', document.body),
        hiddenItemsButton = element('button', 'st-sw-hidden-items-button', document.body, { class: 'st-button tertiary', innerText: i18n.sw.showHiddenItems })

    hiddenItemsButton.addEventListener('click', () => {
        hiddenItemsContainer.classList.toggle('st-expanded')
        hiddenItemsButton.classList.toggle('st-collapsed')
    })

    renderStudyguideList(hiddenItemsContainer)

    let searchBar = element('input', 'st-sw-search', document.body, { class: "st-input", placeholder: i18n.sw.searchPlaceholder })
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
}

// Page 'Studiewijzer'
async function studyguideIndividual() {
    if (syncedStorage['sw-current-week-behavior'] === 'focus' || syncedStorage['sw-current-week-behavior'] === 'highlight') highlightWeek()
    async function highlightWeek() {
        let list = await awaitElement('.studiewijzer-content-container>ul'),
            titles = await awaitElement('li.studiewijzer-onderdeel>div.block>h3>b.ng-binding', true),
            regex = new RegExp(/(w|sem|ε|heb)[^\s\d]*\s?0?(match)(?!\d)/i)

        list.parentElement.setAttribute('style', 'padding: 8px 0 0 8px !important;')

        titles?.forEach(async title => {
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

    if (syncedStorage['sw-enabled']) setTimeout(handleStudyguideIndividual, 100)
    async function handleStudyguideIndividual() {
        await renderStudyguideList()

        const buttons = element('div', 'st-sw-button-wrapper', document.body, { class: 'st-button-wrapper', style: 'position: absolute; top: 70px; right: 20px; z-index: 9999999;' })
        const expandCollapseAll = element('button', 'st-sw-expand-all', buttons, { class: 'st-button icon tertiary', 'data-icon': '' })
        expandCollapseAll.addEventListener('click', () => {
            if (expandCollapseAll.dataset.icon === '') { // Is set to expand mode 
                expandCollapseAll.dataset.icon = ''
                document.querySelectorAll('li.studiewijzer-onderdeel .block.fold h3 b').forEach(e => e.click())
            } else { // Is set to collapse mode 
                expandCollapseAll.dataset.icon = ''
                document.querySelectorAll('li.studiewijzer-onderdeel .block:not(.fold) h3 b').forEach(e => e.click())
            }
        })

        let id = window.location.href.split('studiewijzer/')[1].split('?')[0],
            title = (await awaitElement('dna-page-header.ng-binding'))?.firstChild?.textContent?.trim(),
            dropdown

        savedStudyguides = Object.values(await getFromStorage('sw-list') || [])

        if (!savedStudyguides.find(e => e.id === id)) {
            title = (await awaitElement('dna-page-header.ng-binding'))?.firstChild?.textContent?.trim()
            savedStudyguides.find(e => e.title === title)?.id === id
        }

        if (!savedStudyguides.find(e => e.id === id || e.title === title)?.subject) {
            await awaitElement('dna-page-header.ng-binding')
            setTimeout(async () => {
                title = (await awaitElement('dna-page-header.ng-binding'))?.firstChild?.textContent?.trim()
                savedStudyguides.push({ id: id, title: title, subject: autoStudyguideSubject(title) })
                createDropdown()
                saveToStorage('sw-list', savedStudyguides)
            }, 200)
        } else createDropdown()

        function createDropdown() {
            let allSubjects = Object.fromEntries([...(savedStudyguides.map(s => [s.subject, s.subject]).filter(([k, v]) => v !== 'hidden').sort(([k1, v1], [k2, v2]) => v1.localeCompare(v2))), ['divider', 'divider'], ['addNew', i18n.sw.customSubject], ['autoSet', i18n.sw.autoSubject], ['hidden', i18n.sw.hideStudyguide]])

            async function dropdownChange(newValue) {
                if (newValue === 'addNew') {
                    let result = prompt(i18n.sw.subjectPrompt)
                    if (result?.length > 1) {
                        savedStudyguides.find(e => e.id === id || e.title === title).subject = result
                        saveToStorage('sw-list', savedStudyguides)
                        createDropdown()
                        setTimeout(() => dropdown.changeValue(result), 10)
                    } else {
                        title = (await awaitElement('dna-page-header.ng-binding'))?.firstChild?.textContent?.trim()
                        savedStudyguides.find(e => e.id === id || e.title === title).subject = autoStudyguideSubject(title)
                        saveToStorage('sw-list', savedStudyguides)
                        createDropdown()
                        setTimeout(() => dropdown.changeValue(autoStudyguideSubject(title)), 10)
                    }
                } if (newValue === 'autoSet') {
                    title = (await awaitElement('dna-page-header.ng-binding'))?.firstChild?.textContent?.trim()
                    savedStudyguides.find(e => e.id === id || e.title === title).subject = autoStudyguideSubject(title)
                    saveToStorage('sw-list', savedStudyguides)
                    createDropdown()
                } else {
                    savedStudyguides.find(e => e.id === id || e.title === title).subject = newValue
                    saveToStorage('sw-list', savedStudyguides)
                }
            }

            dropdown = element('button', 'st-sw-subject-dropdown', buttons, { class: 'st-segmented-control', title: i18n.sw.subjectPrompt })
                .createDropdown(
                    allSubjects,
                    savedStudyguides.find(e => e.id === id || e.title === title)?.subject || 'Geen vak',
                    dropdownChange)
        }
    }

    setTimeout(() => { resources() }, 500)
    async function resources() {
        const availableResources = (await (await fetch('https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/studyguide-resources.json'))?.json())

        await awaitElement('dna-page-header.ng-binding')
        setTimeout(async () => {
            const studyguideTitle = (await awaitElement('dna-page-header.ng-binding'))?.firstChild?.textContent?.trim()

            const filteredResources = availableResources?.filter(resource =>
                resource.conditions.some(condition =>
                    studyguideTitle?.toLowerCase().includes(condition.studyguideTitleIncludes?.toLowerCase())
                )
            )
            if (!(filteredResources?.length > 0)) return

            const aside = await awaitElement('#studiewijzer-detail-container > aside'),
                asideContent = await awaitElement('#studiewijzer-detail-container > aside > .content-container')

            const hbSheet = element('div', 'st-hb-sheet', aside, { class: 'st-aside-sheet', 'data-visible': 'false', innerText: '' }),
                hbSheetHeading = element('span', 'st-hb-sheet-heading', hbSheet, { class: 'st-section-title', innerText: i18n.hb.title, 'data-description': i18n.hb.subtitle })

            filteredResources.forEach(resource => {
                switch (resource.type) {
                    case 'spotifyIframe': {
                        const container = element('div', null, hbSheet)
                        const anchor = element('a', null, container, { class: 'st-anchor', innerText: resource.title + ' (Spotify)', href: resource.href, target: '_blank' })

                        const iframe = element('iframe', null, container, { class: 'st-hb-iframe', style: 'border-radius:12px', src: resource.src, width: '100%', height: 352, frameBorder: 0, allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture', loading: 'lazy' })
                        break
                    }

                    case 'youtubeIframe': {
                        const container = element('div', null, hbSheet)
                        const anchor = element('a', null, container, { class: 'st-anchor', innerText: resource.title + ' (YouTube)', href: resource.href, target: '_blank' })

                        const iframe = element('iframe', null, container, { class: 'st-hb-iframe', style: 'border-radius:12px;aspect-ratio:16/9', src: resource.src, width: '100%', height: 'auto', frameBorder: 0, allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen; picture-in-picture; web-share', loading: 'lazy', allowfullscreen: 'allowfullscreen' })

                        window.addEventListener('blur', () => {
                            setTimeout(() => {
                                if (!document.fullscreenElement && document.activeElement.tagName === 'IFRAME' && document.activeElement.src === resource.src) {
                                    iframe.requestFullscreen()
                                    document.addEventListener('fullscreenchange', () => window.focus())
                                }
                            })
                        })
                        break
                    }

                    default:
                        break
                }
            })

            const tabs = await awaitElement('#studiewijzer-detail-container > aside > div.head-bar > ul'),
                existingTabs = document.querySelectorAll('#studiewijzer-detail-container > aside > div.head-bar > ul > li[data-ng-class]'),
                hbTab = element('li', 'st-hb-tab', tabs, { class: 'st-tab asideTrigger' }),
                hbTabLink = element('a', 'st-hb-tab-link', hbTab, { innerText: i18n.hb.title })

            tabs.addEventListener('click', (event) => {
                let bkTabClicked = event.target.id.startsWith('st-hb-tab')
                if (bkTabClicked) {
                    hbTab.classList.add('active')
                    hbSheet.dataset.visible = true
                    asideContent.style.display = 'none'
                } else {
                    hbTab.classList.remove('active')
                    hbSheet.dataset.visible = false
                    asideContent.style.display = ''
                }
            })

            if (!syncedStorage['sw-resources-auto']) return

            hbTab.click()
        }, 500)
    }

    allowAsideResize()
    async function allowAsideResize() {
        // Allow resizing aside
        let m_pos,
            asidePreferenceWidth = 294,
            asideDisplayWidth = 294

        const contentContainer = await awaitElement('#studiewijzer-detail-container'),
            aside = await awaitElement('#studiewijzer-detail-container > aside'),
            asideResizer = element('div', 'st-aside-resize', document.body, { innerText: '' })

        function asideResize(e) {
            let dx = m_pos - e.x
            m_pos = e.x
            asidePreferenceWidth += dx

            asideDisplayWidth = Math.max(Math.min(600, asidePreferenceWidth), 294)
            if (asidePreferenceWidth < 100) asideDisplayWidth = 0

            aside.style.width = (asideDisplayWidth) + 'px'
            contentContainer.style.paddingRight = (20 + asideDisplayWidth) + 'px'
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
}

// Render studyguide list
async function renderStudyguideList(hiddenItemsDestination) {
    return new Promise(async (resolve) => {
        if (!syncedStorage['sw-enabled']) return resolve()

        let mainView = document.querySelector('div.view'),
            widget = document.querySelector('div.full-height.widget'),
            gridContainer = widget || mainView

        savedStudyguides = Object.values(await getFromStorage('sw-list') || [])

        const settingCols = syncedStorage['sw-cols'],
            settingShowPeriod = syncedStorage['sw-period'],
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
                subject = savedStudyguides.find(e => e.title === title)?.subject,
                period = 0,
                periodTextIndex = title.search(/(kw(t)?|(kwintaal)|t(hema)?|p(eriod(e)?)?)(\s|\d)/i)

            if (!subject) {
                savedStudyguides.push({ title: title, subject: autoStudyguideSubject(title) })
                subject = autoStudyguideSubject(title)
                saveToStorage('sw-list', savedStudyguides)
            }

            if (periodTextIndex > 0) {
                let periodNumberSearchString = title.slice(periodTextIndex),
                    periodNumberIndex = periodNumberSearchString.search(/[1-9]/i)
                if (periodNumberIndex > 0) period = Number(periodNumberSearchString.charAt(periodNumberIndex))
            }

            if (!object[subject]) object[subject] = []
            object[subject].push({ elem, title, period })
        })

        let tiles = []
        let tempTilesHolder = element('div', 'st-sw-tiles-holder', document.body, { style: 'display: none;' })

        Object.keys(object).sort((a, b) => a.localeCompare(b)).forEach((subject, i, a) => {
            let items = object[subject]

            let subjectTile = element('div', `st-sw-subject-${subject}`, tempTilesHolder, { class: 'st-sw-subject', 'data-subject': subject })

            if (items.length > 1 || subject === 'hidden') {
                let subjectHeadline = element('div', `st-sw-subject-${subject}-headline`, subjectTile, { innerText: subject, class: 'st-sw-subject-headline' })
                let itemsWrapper = element('div', `st-sw-subject-${subject}-wrapper`, subjectTile, { class: 'st-sw-items-wrapper', 'data-flex-row': Number(settingCols) < 2 })
                if (subject === 'hidden') {
                    subjectHeadline.remove()
                    itemsWrapper.remove()
                }
                for (let i = 0; i < items.length; i++) {
                    const item = items.sort((a, b) => a.period - b.period)[i]

                    let periodText = i18n.sw.periodN.replace('%s', item.period).replace('%o', formatOrdinals(item.period, true))
                    if (item.period < 1) periodText = i18n.sw.periodMissing

                    let itemButton = element(
                        'button',
                        `st-sw-item-${item.title}`,
                        subject === 'hidden'
                            ? hiddenItemsDestination
                            : itemsWrapper,
                        settingShowPeriod && subject !== 'hidden'
                            ? { innerText: periodText, class: 'st-sw-item', 'data-title': item.title, 'data-2nd': item.title }
                            : { innerText: item.title, class: 'st-sw-item', 'data-title': item.title, 'data-2nd': subject === 'hidden' ? item.title : periodText }
                    )
                    itemButton.addEventListener('click', () => {
                        for (const e of document.querySelectorAll('.studiewijzer-list ul>li>a>span:first-child, .tabsheet .widget ul>li>a>span')) {
                            if (e.textContent.includes(item.title)) e.click()
                        }
                    })

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

                let periodText = i18n.sw.periodN.replace('%s', item.period).replace('%o', formatOrdinals(item.period, true))
                if (item.period < 1) periodText = i18n.sw.periodMissing

                let defaultItemDescription = element(
                    'span',
                    `st-sw-item-${item.title}-desc`,
                    defaultItemButton,
                    settingShowPeriod
                        ? { innerText: periodText, class: 'st-sw-item-default-desc', 'data-title': item.title, 'data-2nd': item.title }
                        : { innerText: item.title, class: 'st-sw-item-default-desc', 'data-title': item.title, 'data-2nd': periodText })

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

        resolve()

        console.log()
        if (document.getElementById('st-sw-hidden-items-button') && !(document.getElementById('st-sw-hidden-items')?.children.length > 0)) {
            document.getElementById('st-sw-hidden-items-button')?.remove()
        }
    })
}

// Append the study guides to the list
function appendStudyguidesToList() {
    let tiles = document.querySelectorAll('.st-sw-subject')
    let items = document.querySelectorAll('.st-sw-item, .st-sw-item-default')
    let searchBar = document.querySelector('#st-sw-search')
    let gridContainer = document.querySelector('#st-sw-container')
    let cols = document.querySelectorAll('#st-sw-container .st-sw-col')
    if (!gridContainer || !cols?.[0]) return

    // First, define which study guide items should be shown.
    items.forEach(studyguide => {
        if (studyguide.id === 'st-sw-fake-item') {
            studyguide.parentElement.remove()
            return
        }

        let matches = true

        if (searchBar) {
            let query = searchBar.value.toLowerCase()
            matches = (studyguide.dataset.title?.toLowerCase().includes(query) || studyguide.closest('.st-sw-subject').dataset.subject?.toLowerCase().includes(query))
        }

        if (matches) studyguide.classList.remove('hidden')
        else studyguide.classList.add('hidden')
    })

    // Next, define which subject tiles have visible children.
    let visibleSubjectTiles = [...tiles].filter(element => element.querySelector('button:not(.hidden)'))

    visibleSubjectTiles.sort((a, b) => a?.dataset?.subject?.localeCompare(b?.dataset?.subject)).forEach((studyguide, i, a) => {
        cols[Math.floor((i / a.length) * cols.length)].appendChild(studyguide)
    })

    // distributeElements(visibleSubjectTiles.sort((a, b) => a?.dataset?.subject?.localeCompare(b?.dataset?.subject)))
    // // Finally, sort the subject tiles and equally distribute them across columns.
    // // visibleSubjectTiles.sort((a, b) => a?.dataset?.subject?.localeCompare(b?.dataset?.subject)).forEach((studyguide, i, a) => {
    // //     grid[Math.floor((i / a.length) * grid.length)].appendChild(studyguide)
    // // })

    // function distributeElements(elements) {
    //     const columns = [[], [], []] // Array of arrays to store elements for each column
    //     const columnHeights = [0, 0, 0] // Initial heights for each column

    //     elements.forEach((element) => {
    //         // Find the shortest column
    //         const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
    //         // Add element to the shortest column
    //         columns[shortestColumnIndex].push(element)
    //         // Update height of the shortest column
    //         columnHeights[shortestColumnIndex] += element.offsetHeight // Use offsetHeight for variable height
    //     })

    //     // Distribute elements to the columns in the DOM
    //     columns.forEach((column, index) => {
    //         column.forEach((element) => {
    //             element.style.gridColumn = index + 1 // Set grid column using inline CSS
    //             grid.appendChild(element)
    //         })
    //     })
    // }
}

function autoStudyguideSubject(title) {
    const subjectMap = [
        { name: "Aardrijkskunde", aliases: ["aardrijkskunde", "ak"] },
        { name: "Bedrijfseconomie", aliases: ["bedrijfseconomie", "beco", "bec"] },
        { name: "Beeldende vorming", aliases: ["beeldend", "beeldende", "kubv", "be", "bv"] },
        { name: "Biologie", aliases: ["biologie", "bio", "bi", "biol"] },
        { name: "Cult. en kunstz. vorming", aliases: ["ckv"] },
        { name: "Drama", aliases: ["drama", "kudr", "dr"] },
        { name: "Duits", aliases: ["duits", "dutl", "du", "de", "duitse", "deutsch"] },
        { name: "Economie", aliases: ["economie", "eco", "ec", "econ"] },
        { name: "Frans", aliases: ["frans", "fatl", "fa", "fr", "franse", "français"] },
        { name: "Geschiedenis", aliases: ["geschiedenis", "gs", "ges"] },
        { name: "Grieks", aliases: ["grieks", "gtc", "gr", "grkc", "grtl", "griekse"] },
        { name: "Kunst algemeen", aliases: ["kunst algemeen", "ku", "kua"] },
        { name: "Latijn", aliases: ["latijn", "ltc", "la", "lakc", "latl", "latijnse"] },
        { name: "Levensbeschouwing", aliases: ["levensbeschouwing", "lv"] },
        { name: "Sport", aliases: ["sport", "lo", "s&b", "lichamelijke opvoeding", "gym"] },
        { name: "Maatschappijleer", aliases: ["maatschappijleer", "ma", "malv", "maat"] },
        { name: "Maatschappij­wetenschappen", aliases: ["maatschappijwetenschappen", "maw"] },
        { name: "Mens en maatschappij", aliases: ["mens en maatschappij", "m&m", "mm"] },
        { name: "Mens en natuur", aliases: ["mens en natuur", "m&n", "mn"] },
        { name: "Mentor", aliases: ["mentor", "mentoruur", "mentoraat"] },
        { name: "Muziek", aliases: ["muziek", "kumu", "mu"] },
        { name: "Natuurkunde", aliases: ["natuurkunde", "na", "nat", "nask1"] },
        { name: "Nederlands", aliases: ["nederlands", "netl", "ne", "nl", "nederlandse"] },
        { name: "Scheikunde", aliases: ["scheikunde", "sk", "sch", "schk", "nask2"] },
        { name: "Spaans", aliases: ["spaans", "sptl", "sp", "es", "spaanse", "español", "espanol"] },
        { name: "Wiskunde", aliases: ["wiskunde", "wi", "wa", "wb", "wc", "wd", "wis", "wisa", "wisb", "wisc", "wisd", "rekenen"] },
        { name: "Engels", aliases: ["engels", "entl", "en", "engelse", "english"] },
        { name: "Examentraining", aliases: ["examentraining"] },
        { name: "Loopbaan­oriëntatie en -begeleiding", aliases: ["loopbaan", "lob"] }
    ]

    const resultingSubject = subjectMap.find((subjectObject) => title?.split(/\s|-|_|\d/gi)?.some(titleWord => subjectObject.aliases.includes(titleWord.toLowerCase())))

    return resultingSubject?.name || 'Geen vak'
}