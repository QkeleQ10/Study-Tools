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
    studyguides;
    #overview;

    constructor(parentElement) {
        this.element = parentElement.createChildElement('div', { id: 'st-sg' });

        const header = this.element.createChildElement('div', { id: 'st-sg-header' });

        header.createChildElement('div', {
            class: 'st-breadcrumbs', style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
            }
        })
            .createChildElement('a', {
                class: 'st-button icon',
                innerText: '',
                style: {
                    fontSize: '16px',
                    color: 'var(--st-foreground-accent)',
                    margin: '-6px',
                },
                href: '#/vandaag',
            })
            .createSiblingElement('span', {
                innerText: '',
                style: {
                    font: '14px "Font Awesome 6 Pro"',
                    color: 'var(--st-foreground-insignificant)',
                }
            })
            .createSiblingElement('span', {
                innerText: i18n('views.ELO'),
                style: {
                    font: '12px var(--st-font-family-secondary)'
                }
            })
            .createSiblingElement('span', {
                innerText: '',
                style: {
                    font: '14px "Font Awesome 6 Pro"',
                    color: 'var(--st-foreground-insignificant)',
                }
            })
            .createSiblingElement('span', {
                innerText: i18n('views.Studiewijzers'),
                style: {
                    font: '12px var(--st-font-family-secondary)'
                }
            });
        header.createChildElement('span', { class: 'st-title', innerText: i18n('views.Studiewijzers'), });

        const segmentedControl = header.createChildElement('div', { class: 'st-segmented-control' });
        segmentedControl.createChildElement('button', { class: 'st-button segment active', dataset: { mode: 'normal' }, innerText: i18n('sw.viewActive') });
        segmentedControl.createChildElement('button', { class: 'st-button segment', dataset: { mode: 'archived' }, innerText: i18n('sw.viewArchived') });
        segmentedControl.createChildElement('button', { class: 'st-button segment', dataset: { mode: 'hidden' }, innerText: i18n('sw.viewHidden') });
        segmentedControl.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                segmentedControl.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.#overview.drawMode = button.dataset.mode;
                this.#overview.draw();
            });
        });

        const main = this.element.createChildElement('div', { id: 'st-sg-main' });

        this.#overview = new StudyGuidesOverview(main);
        this.#fetchStudyGuides();

        const contents = main.createChildElement('div', { id: 'st-sg-contents' });
    }

    async #fetchStudyGuides() {
        this.studyguides = await magisterApi.studyguides();
        this.#overview.addStudyguides(this.studyguides);
        this.#overview.draw();
    }

    navigateToStudyGuide(id) {
        this.element.classList.add('contents-visible');
        window.location.href = `#/elo/studiewijzer/${id}`;
    }
}

class StudyGuidesOverview {
    element;
    #list;
    #emptyText;
    #progressBar;
    studyguides;
    #drawMode = 'normal';

    get drawMode() {
        return this.#drawMode;
    }

    set drawMode(value) {
        const allowedModes = ['normal', 'hidden', 'archived'];
        this.#drawMode = allowedModes.includes(value) ? value : 'normal';
    }

    constructor(parentElement) {
        this.element = parentElement.createChildElement('div', { id: 'st-sg-overview' });

        this.#list = this.element.createChildElement('div', { id: 'st-sg-list' });
        this.#emptyText = this.element.createChildElement('div', { id: 'st-sg-overview-empty', innerText: i18n('sw.noActiveItems') });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });
    }

    addStudyguides(studyguides) {
        this.studyguides = studyguides.map(sg => {
            const { Id: id, Titel: title, Van: from, TotEnMet: to, VakCodes: subjectCodes, InLeerlingArchief: isArchived } = sg;

            let subject = savedStudyguides.find(e => e.id === id || e.title === title)?.subject || autoStudyguideSubject(subjectCodes.join(' ') + ' ' + title);

            let period = 0;
            let periodTextIndex = title.search(/(kw(t)?|(kwintaal)|(term)|t(hema)?|to|po|p(eriod(e)?)?)(\s|\d)/i);
            if (periodTextIndex > 0) {
                let periodNumberSearchString = title.slice(periodTextIndex),
                    periodNumberIndex = periodNumberSearchString.search(/[1-9]/i);
                if (periodNumberIndex > 0) period = Number(periodNumberSearchString.charAt(periodNumberIndex));
            }

            return { id, title, from, to, subject, period, isArchived };
        });
    }

    isStudyguideVisible(sg) {
        switch (this.drawMode) {
            case 'hidden':
                return sg.subject === 'hidden' && !sg.isArchived;
            case 'archived':
                return sg.isArchived;
            case 'normal':
            default:
                return !sg.isArchived && sg.subject !== 'hidden';
        }
    }

    draw() {
        this.#list.innerText = '';

        this.#emptyText.innerText = i18n(this.drawMode === 'hidden' ? 'sw.noHiddenItems' : this.drawMode === 'archived' ? 'sw.noArchivedItems' : 'sw.noActiveItems');
        this.#emptyText.style.display = this.studyguides.some(sg => this.isStudyguideVisible(sg)) ? 'none' : 'block';

        const subjects = Object.groupBy(this.studyguides.filter(sg => this.isStudyguideVisible(sg)), sg => sg.subject);

        const settingShowPeriod = syncedStorage['sw-period']

        const subjectsSorted = Object.keys(subjects).sort((a, b) => a.localeCompare(b));

        subjectsSorted.forEach((subject, index) => {
            const subjectSection = this.#list.createChildElement('div', {
                class: 'st-sg-subject'
            });

            subjectSection.createChildElement('div', {
                innerText: subject,
                class: 'st-sg-subject-headline'
            });

            const studyguidesContainer = subjectSection.createChildElement('div', {
                class: 'st-sg-items'
            });

            subjects[subject].sort((a, b) => a.period - b.period).forEach(sg => {

                const sgElement = studyguidesContainer.createChildElement('button', {
                    class: 'st-button secondary st-sg-item',
                    innerText: settingShowPeriod && sg.period > 0 ? i18n('sw.periodN', { period: sg.period, periodOrdinal: formatOrdinals(sg.period, true) }) : sg.title,
                    title: `${sg.title}\n${sg.period > 0 ? i18n('sw.periodN', { period: sg.period, periodOrdinal: formatOrdinals(sg.period, true) }) : i18n('sw.periodMissing')}`,
                });

                sgElement.addEventListener('click', () => {
                    this.element.parentElement.classList.add('contents-visible');
                    window.location.href = `#/elo/studiewijzer/${sg.id}`;
                });

                if (window.location.href.includes(`#/elo/studiewijzer/${sg.id}`)) {
                    sgElement.classList.add('active');
                }
            });
        });

        this.#progressBar.dataset.visible = false;
    }
}

// Page 'Studiewijzers'
async function studyguideList() {
    if (!syncedStorage['sg-enabled']) return;

    (await awaitElement('#studiewijzer-container')).style.display = 'none';

    const mainView = await awaitElement('div.view.ng-scope');
    const page = new StudyGuidesPage(mainView);
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

    if (syncedStorage['sg-enabled']) setTimeout(handleStudyguideIndividual, 100)
    async function handleStudyguideIndividual() {

        const sidePanel = await awaitElement('.tabsheet#idStudiewijzers')
        const studyguides = await magisterApi.studyguides();

        const list = new StudyGuidesOverview(sidePanel);
        list.addStudyguides(studyguides);
        list.draw();
        list.element.classList.add('st-sg-sidepanel');
        list.element.previousElementSibling.style.display = 'none';

        const buttons = element('div', 'st-sg-button-wrapper', document.body, { class: 'st-button-wrapper', style: 'position: absolute; top: 70px; right: 20px; z-index: 9999999;' })
        const expandCollapseAll = element('button', 'st-sg-expand-all', buttons, { class: 'st-button icon tertiary', 'data-icon': '' })
        expandCollapseAll.addEventListener('click', () => {
            if (expandCollapseAll.dataset.icon === '') { // Is set to expand mode 
                expandCollapseAll.dataset.icon = ''
                // @ts-ignore
                document.querySelectorAll('li.studiewijzer-onderdeel .block.fold h3 b').forEach(e => e.click())
            } else { // Is set to collapse mode 
                expandCollapseAll.dataset.icon = ''
                // @ts-ignore
                document.querySelectorAll('li.studiewijzer-onderdeel .block:not(.fold) h3 b').forEach(e => e.click())
            }
        })

        let id = window.location.href.split('/studiewijzer/')[1].split('?')[0],
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
                switch (newValue) {
                    case 'addNew':
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
                        break
                    case 'autoSet':
                        title = (await awaitElement('dna-page-header.ng-binding'))?.firstChild?.textContent?.trim()
                        savedStudyguides.find(e => e.id === id || e.title === title).subject = autoStudyguideSubject(title)
                        saveToStorage('sw-list', savedStudyguides)
                        createDropdown()
                        break
                    default:
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
                                    // @ts-ignore
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
}


function autoStudyguideSubject(title) {
    const subjectMap = [
        { name: "Aardrijkskunde", aliases: ["aardrijkskunde", "ak"] },
        { name: "Bedrijfseconomie", aliases: ["bedrijfseconomie", "beco", "bec"] },
        { name: "Beeldende vorming", aliases: ["beeldend", "beeldende", "kubv", "be", "bv", "bha", "kbv", "tw"] },
        { name: "Biologie", aliases: ["biologie", "bio", "bi", "biol"] },
        { name: "Cambridge Engels", aliases: ["cambridge engels", "cambridge", "caeng", "ceng", "ce"] },
        { name: "Chinees", aliases: ["chinees", "chtl", "ch", "zh", "chinese", "中文"] },
        { name: "Culturele en kunstzinnige vorming", aliases: ["ckv"] },
        { name: "Digitale vaardigheden", aliases: ["digitale vaardigheden", "digitaal", "dv"] },
        { name: "Drama", aliases: ["drama", "kudr", "dr", "kdr", "da", "kda"] },
        { name: "Economie", aliases: ["economie", "eco", "ec", "econ", "eo"] },
        { name: "Filosofie", aliases: ["filosofie", "filo", "fil", "fie", "fi"] },
        { name: "Frans", aliases: ["frans", "fatl", "fa", "fr", "franse", "français"] },
        { name: "Geschiedenis", aliases: ["geschiedenis", "gs", "ges", "gst", "gm"] },
        { name: "Godsdienst", aliases: ["godsdienst", "religie", "god", "gd", "gds"] },
        { name: "Grieks", aliases: ["grieks", "gtc", "gr", "grkc", "grtl", "griekse"] },
        { name: "Kunst algemeen", aliases: ["kunst algemeen", "ku", "kua", "kv1"] },
        { name: "Klassieke culturele vorming", aliases: ["klassieke culturele vorming", "kc", "kcv"] },
        { name: "Latijn", aliases: ["latijn", "ltc", "la", "lakc", "latl", "latijnse"] },
        { name: "Levensbeschouwing", aliases: ["levensbeschouwing", "lv"] },
        { name: "Sport", aliases: ["sport", "lo", "s&b", "lichamelijke opvoeding", "gym", "bsm"] },
        { name: "Maatschappijleer", aliases: ["maatschappijleer", "ma", "malv", "maat"] },
        { name: "Maatschappij­wetenschappen", aliases: ["maatschappijwetenschappen", "ma", "maat", "maw", "mask"] },
        { name: "Mens en maatschappij", aliases: ["mens en maatschappij", "m&m", "mm"] },
        { name: "Mens en natuur", aliases: ["mens en natuur", "m&n", "mn", "groene vingers"] },
        { name: "Mentor", aliases: ["mentor", "mentoruur", "mentoraat", "mr"] },
        { name: "Muziek", aliases: ["muziek", "kumu", "mu", "kmu"] },
        { name: "Natuurkunde", aliases: ["natuurkunde", "na", "nat"] },
        { name: "Nederlands", aliases: ["nederlands", "netl", "ne", "nl", "nederlandse"] },
        { name: "Rekenen", aliases: ["rekenen", "reken", "rekenvaardigheid", "re", "rv"] },
        { name: "Scheikunde", aliases: ["scheikunde", "sk", "sch", "schk"] },
        { name: "Natuur- en scheikunde", aliases: ["natuur- en scheikunde", "natuur en scheikunde", "natuurkunde en scheikunde", "nask", "ns"] },
        { name: "Natuur- en scheikunde 1", aliases: ["natuur- en scheikunde 1", "natuur en scheikunde 1", "natuurkunde en scheikunde 1", "nask 1", "ns1", "nask1", "nsk1"] },
        { name: "Natuur- en scheikunde 2", aliases: ["natuur- en scheikunde 2", "natuur en scheikunde 2", "natuurkunde en scheikunde 2", "nask 2", "ns2", "nask2", "nsk2"] },
        { name: "Spaans", aliases: ["spaans", "sptl", "sp", "es", "spaanse", "español", "espanol"] },
        { name: "STEAM", aliases: ["steam", "stem"] },
        { name: "Techniek", aliases: ["techniek", "tech"] },
        { name: "Wiskunde", aliases: ["wiskunde", "wi", "wis"] },
        { name: "Wiskunde A", aliases: ["wiskunde a", "wi a", "wa", "wis a", "wisa"] },
        { name: "Wiskunde B", aliases: ["wiskunde b", "wi b", "wb", "wis b", "wisb"] },
        { name: "Wiskunde C", aliases: ["wiskunde c", "wi c", "wc", "wis c", "wisc"] },
        { name: "Wiskunde D", aliases: ["wiskunde d", "wi d", "wd", "wis d", "wisd"] },
        { name: "Examentraining", aliases: ["examentraining", "examenvoorbereiding", "examen"] },
        { name: "Loopbaan­oriëntatie en -begeleiding", aliases: ["loopbaan", "lob"] },
        { name: "Onderzoek en ontwerpen", aliases: ["onderzoek en ontwerpen", "o&o", "oo", "oe"] },
        { name: "Ontmoeten en verbinden", aliases: ["ontmoeten en verbinden", "o&v", "ov"] },
        { name: "Tekenen", aliases: ["tekenen", "teken", "bte", "te"] },
        { name: "Handarbeid", aliases: ["ha"] }, // Positioned very low to avoid 'ha' being recognised as 'Handarbeid'
        { name: "Informatica", aliases: ["informatica", "in", "ict"] }, // Positioned very low to avoid 'in' being recognised as 'Informatica'
        { name: "Duits", aliases: ["duits", "dutl", "du", "de", "duitse", "deutsch"] }, // Positioned very low to avoid 'de' being recognised as 'Duits'
        { name: "Engels", aliases: ["engels", "entl", "en", "engelse", "english"] }, // Positioned very low to avoid 'en' being recognised as 'Engels'
    ]

    const resultingSubject = subjectMap.find((subjectObject) => title?.split(/\s|-|_|\d/gi)?.some(titleWord => subjectObject.aliases.includes(titleWord.toLowerCase())))

    return resultingSubject?.name || 'Geen vak'
}