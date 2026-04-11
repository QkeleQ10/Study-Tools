let savedStudyguides = Object.values(syncedStorage?.['sw-list'] || []) || []

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].includes('/studiewijzer/')) studyguideIndividual()
    else if (document.location.href.split('?')[0].includes('/studiewijzer')) studyguideList()
}

class StudyGuidesPage {
    element;
    #progressBar;
    #grid;

    constructor(parentElement) {
        this.element = parentElement.createChildElement('div', { id: 'st-sg' });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

        const header = this.element.createChildElement('div', { class: 'st-sg-header' });

        this.#fetchStudyGuides();
    }

    async #fetchStudyGuides() {
        const studyguides = await magisterApi.studyguides();

        this.#grid = new StudyGuidesGrid(this.element, studyguides);
        this.#grid.draw();
        this.#progressBar.dataset.visible = false;
    }
}

class StudyGuidesGrid {
    element;
    studyguides;

    // TODO: getter/setter for filters

    constructor(parentElement, studyguides) {
        this.element = parentElement.createChildElement('div', { id: 'st-sg-grid' });
        this.studyguides = studyguides.map(sg => {
            const { Id: id, Titel: title, Van: from, TotEnMet: to, VakCodes: subjectCodes, InLeerlingArchief: isArchived } = sg;

            let subject = savedStudyguides.find(e => e.id === id || e.title === title)?.subject || autoStudyguideSubject(title);

            let period = 0;
            let periodTextIndex = title.search(/(kw(t)?|(kwintaal)|(term)|t(hema)?|to|po|p(eriod(e)?)?)(\s|\d)/i);
            if (periodTextIndex > 0) {
                let periodNumberSearchString = title.slice(periodTextIndex),
                    periodNumberIndex = periodNumberSearchString.search(/[1-9]/i);
                if (periodNumberIndex > 0) period = Number(periodNumberSearchString.charAt(periodNumberIndex));
            }

            return { id, title, from, to, subject, period, isArchived };
        });

        this.subjects = Object.groupBy(this.studyguides, sg => sg.subject);
    }

    draw() {
        this.element.innerText = '';

        const settingCols = Math.max(1, Number(syncedStorage['sw-cols']) || 1),
            settingShowPeriod = syncedStorage['sw-period']
        const columns = [];
        for (let i = 1; i <= settingCols; i++) {
            columns.push(this.element.createChildElement('div', {
                id: `st-sg-col-${i}`,
                class: 'st-sg-col',
                dataset: { index: i }
            }));
        }

        const subjectsSorted = Object.keys(this.subjects).sort((a, b) => a.localeCompare(b));
        const subjectsPerColumn = Math.ceil(subjectsSorted.length / columns.length) || 1;

        subjectsSorted.forEach((subject, index) => {
            const subjectData = this.subjects[subject];
            const isSingular = subjectData.length === 1

            const columnIndex = Math.min(columns.length - 1, Math.floor(index / subjectsPerColumn));
            const subjectSection = columns[columnIndex].createChildElement('div', { class: 'st-sg-subject' });

            if (!isSingular) {
                subjectSection.createChildElement('div', {
                    innerText: subject,
                    class: 'st-sg-subject-headline'
                });
            }

            this.subjects[subject].sort((a, b) => a.period - b.period).forEach(sg => {
                let periodText = i18n('sw.periodN', { period: sg.period, periodOrdinal: formatOrdinals(sg.period, true) })
                if (sg.period < 1) periodText = i18n('sw.periodMissing')

                const sgElement = subjectSection.createChildElement('button', { class: isSingular ? 'st-sg-item-default' : 'st-sg-item' });

                if (isSingular) {
                    sgElement.appendChild(document.createTextNode(subject));
                }

                sgElement.createChildElement('span', {
                    innerText: settingShowPeriod ? periodText : sg.title,
                    dataset: { '2nd': settingShowPeriod ? sg.title : periodText },
                    class: isSingular ? 'st-sg-item-default-desc' : 'st-sg-item-desc'
                });

                sgElement.addEventListener('click', () => {
                    console.log(`Clicked on study guide with id ${sg.id} and title ${sg.title}`)
                    window.location.href = `#/elo/studiewijzer/${sg.id}`
                });

                if (window.location.href.includes(`#/elo/studiewijzer/${sg.id}`)) {
                    sgElement.classList.add('active')
                }
            });
        });
    }
}

// Page 'Studiewijzers'
async function studyguideList() {
    if (!syncedStorage['sw-enabled']) return

    const mainView = await awaitElement('div.view.ng-scope')
    const page = new StudyGuidesPage(mainView)
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

        const sidePanel = await awaitElement('.tabsheet#idStudiewijzers')
        const studyguides = await magisterApi.studyguides();

        const list = new StudyGuidesGrid(sidePanel, studyguides);
        list.draw();
        list.element.classList.add('st-sg-sidepanel');
        list.element.previousElementSibling.style.display = 'none';

        const buttons = element('div', 'st-sg-button-wrapper', document.body, { class: 'st-button-wrapper', style: 'position: absolute; top: 70px; right: 20px; z-index: 9999999;' })
        const expandCollapseAll = element('button', 'st-sg-expand-all', buttons, { class: 'st-button icon tertiary', 'data-icon': '' })
        expandCollapseAll.addEventListener('click', () => {
            if (expandCollapseAll.dataset.icon === '') { // Is set to expand mode 
                expandCollapseAll.dataset.icon = ''
                document.querySelectorAll('li.studiewijzer-onderdeel .block.fold h3 b').forEach(e => e.click())
            } else { // Is set to collapse mode 
                expandCollapseAll.dataset.icon = ''
                document.querySelectorAll('li.studiewijzer-onderdeel .block:not(.fold) h3 b').forEach(e => e.click())
            }
        })

        let id = window.location.href.split(/(studiewijzer)\/?/gi)[1].split('?')[0],
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
            let allSubjects = Object.fromEntries([
                ...(savedStudyguides.map(s => [s.subject, s.subject]).filter(([k, v]) => v !== 'hidden').sort(([k1, v1], [k2, v2]) => v1.localeCompare(v2))),
                ['divider', 'divider'],
                ['addNew', i18n('sw.customSubject')],
                ['autoSet', i18n('sw.autoSubject')],
                ['hidden', i18n('sw.hideStudyguide')]
            ])

            async function dropdownChange(newValue) {
                if (newValue === 'addNew') {
                    let result = prompt(i18n('sw.subjectPrompt'))
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

            dropdown = new Dropdown(
                buttons.createChildElement('button', { id: 'st-sg-subject-dropdown', class: 'st-segmented-control', title: i18n('sw.subjectPrompt') }),
                allSubjects,
                savedStudyguides.find(e => e.id === id || e.title === title)?.subject || 'Geen vak',
                dropdownChange
            );
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
                    (!condition.studyguideTitleIncludes || studyguideTitle?.toLowerCase().includes(condition.studyguideTitleIncludes?.toLowerCase())) &&
                    (!condition.studyguideSubjectEquals || savedStudyguides.find(e => e.title === studyguideTitle).subject === condition.studyguideSubjectEquals || autoStudyguideSubject(studyguideTitle) === condition.studyguideSubjectEquals)
                )
            )
            if (!(filteredResources?.length > 0)) return

            const aside = await awaitElement('#studiewijzer-detail-container > aside'),
                asideContent = await awaitElement('#studiewijzer-detail-container > aside > .content-container')

            const hbSheet = element('div', 'st-hb-sheet', aside, { class: 'st-aside-sheet', 'data-visible': 'false', innerText: '' }),
                hbSheetHeading = element('span', 'st-hb-sheet-heading', hbSheet, { class: 'st-section-title', innerText: i18n('hb.title'), title: i18n('hb.subtitle') })

            filteredResources.forEach(resource => {
                let srcs = Array.isArray(resource.src) ? resource.src : [resource.src]

                const container = element('div', `st-sg-resource-${resource.title.slice(0, 26)}`, hbSheet)

                srcs.forEach(src => {
                    switch (resource.type) {
                        case 'spotifyIframe': {
                            const anchor = element('a', null, container, { class: 'st-anchor', innerText: resource.title, href: resource.href, target: '_blank' })

                            const iframe = element('iframe', null, container, { class: 'st-hb-iframe', style: 'border-radius:12px', src: src, width: '100%', height: 352, frameBorder: 0, allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture', loading: 'lazy' })
                            break
                        }

                        case 'youtubeIframe': {
                            const anchor = element('a', null, container, { class: 'st-anchor', innerText: resource.title, href: resource.href, target: '_blank' })

                            const iframe = element('iframe', null, container, { class: 'st-hb-iframe', style: 'border-radius:12px;aspect-ratio:16/9', src: src, width: '100%', height: 'auto', frameBorder: 0, allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; fullscreen; picture-in-picture; web-share', loading: 'lazy', allowfullscreen: 'allowfullscreen' })

                            window.addEventListener('blur', () => {
                                setTimeout(() => {
                                    if (!document.fullscreenElement && document.activeElement.tagName === 'IFRAME' && document.activeElement.src === src) {
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
            })

            const tabs = await awaitElement('#studiewijzer-detail-container > aside > div.head-bar > ul'),
                existingTabs = document.querySelectorAll('#studiewijzer-detail-container > aside > div.head-bar > ul > li[data-ng-class]'),
                hbTab = element('li', 'st-hb-tab', tabs, { class: 'st-tab asideTrigger' }),
                hbTabLink = element('a', 'st-hb-tab-link', hbTab, { innerText: i18n('hb.title'), title: i18n('hb.subtitle') })

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

        asideResizer.addEventListener('mousedown', function (e) {
            m_pos = e.x
            document.addEventListener('mousemove', asideResize, false)
        }, false)
        document.addEventListener('mouseup', function () {
            asidePreferenceWidth = asideDisplayWidth
            document.removeEventListener('mousemove', asideResize, false)
        }, false)
    }
}


function autoStudyguideSubject(title) {
    const subjectMap = [
        { name: "Aardrijkskunde", aliases: ["aardrijkskunde", "ak"] },
        { name: "Bedrijfseconomie", aliases: ["bedrijfseconomie", "beco", "bec"] },
        { name: "Beeldende vorming", aliases: ["beeldend", "beeldende", "kubv", "be", "bv", "bha", "kbv", "tw"] },
        { name: "Biologie", aliases: ["biologie", "bio", "bi", "biol"] },
        { name: "Cult. en kunstz. vorming", aliases: ["ckv"] },
        { name: "Drama", aliases: ["drama", "kudr", "dr", "kdr", "da", "kda"] },
        { name: "Economie", aliases: ["economie", "eco", "ec", "econ", "eo"] },
        { name: "Frans", aliases: ["frans", "fatl", "fa", "fr", "franse", "français"] },
        { name: "Geschiedenis", aliases: ["geschiedenis", "gs", "ges", "gst", "gm"] },
        { name: "Godsdienst", aliases: ["godsdienst", "religie", "god", "gd", "gds"] },
        { name: "Grieks", aliases: ["grieks", "gtc", "gr", "grkc", "grtl", "griekse"] },
        { name: "Informatica", aliases: ["informatica", "in", "ict"] },
        { name: "Kunst algemeen", aliases: ["kunst algemeen", "ku", "kua", "kv1"] },
        { name: "Latijn", aliases: ["latijn", "ltc", "la", "lakc", "latl", "latijnse"] },
        { name: "Levensbeschouwing", aliases: ["levensbeschouwing", "lv"] },
        { name: "Sport", aliases: ["sport", "lo", "s&b", "lichamelijke opvoeding", "gym", "bsm"] },
        { name: "Maatschappijleer", aliases: ["maatschappijleer", "ma", "malv", "maat"] },
        { name: "Maatschappij­wetenschappen", aliases: ["maatschappijwetenschappen", "ma", "maat", "maw", "mask"] },
        { name: "Mens en maatschappij", aliases: ["mens en maatschappij", "m&m", "mm"] },
        { name: "Mens en natuur", aliases: ["mens en natuur", "m&n", "mn", "groene vingers"] },
        { name: "Mentor", aliases: ["mentor", "mentoruur", "mentoraat", "mr"] },
        { name: "Muziek", aliases: ["muziek", "kumu", "mu", "kmu"] },
        { name: "Natuurkunde", aliases: ["natuurkunde", "na", "nat", "nask1", "nsk1"] },
        { name: "Nederlands", aliases: ["nederlands", "netl", "ne", "nl", "nederlandse"] },
        { name: "Ontmoeten en verbinden", aliases: ["ontmoeten en verbinden", "o&v", "ov"] },
        { name: "Scheikunde", aliases: ["scheikunde", "sk", "sch", "schk", "nask2", "nsk2"] },
        { name: "Natuur- en scheikunde", aliases: ["natuur- en scheikunde", "natuur en scheikunde", "natuurkunde en scheikunde", "nask", "ns"] },
        { name: "Spaans", aliases: ["spaans", "sptl", "sp", "es", "spaanse", "español", "espanol"] },
        { name: "Tekenen", aliases: ["tekenen", "teken", "bte", "te"] },
        { name: "Wiskunde", aliases: ["wiskunde", "wi", "wa", "wb", "wc", "wd", "wis", "wisa", "wisb", "wisc", "wisd", "rekenen", "re"] },
        { name: "Handarbeid", aliases: ["ha"] }, // Positioned very low to avoid 'ha' being recognised as 'Handarbeid'
        { name: "Duits", aliases: ["duits", "dutl", "du", "de", "duitse", "deutsch"] }, // Positioned very low to avoid 'de' being recognised as 'Duits'
        { name: "Engels", aliases: ["engels", "entl", "en", "engelse", "english"] }, // Positioned very low to avoid 'en' being recognised as 'Engels'
        { name: "Examentraining", aliases: ["examentraining", "examenvoorbereiding", "examen"] },
        { name: "Loopbaan­oriëntatie en -begeleiding", aliases: ["loopbaan", "lob"] }
    ]

    const resultingSubject = subjectMap.find((subjectObject) => title?.split(/\s|-|_|\d/gi)?.some(titleWord => subjectObject.aliases.includes(titleWord.toLowerCase())))

    return resultingSubject?.name || 'Geen vak'
}