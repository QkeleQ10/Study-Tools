let savedStudyguides = Object.values(syncedStorage?.['sw-list'] || []) || []

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].includes('/studiewijzer')) {
        if (!syncedStorage['sg-enabled']) return;

        (await awaitElement('#studiewijzer-container')).style.display = 'none';

        const mainView = await awaitElement('div.view.ng-scope');
        const page = new StudyGuidesPage(mainView);
    }
}

class StudyGuidesPage {
    element;
    studyguides;
    #main;
    #overview;
    #contents;

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

        this.#main = this.element.createChildElement('div', { id: 'st-sg-main' });

        this.#overview = new StudyGuidesOverview(this.#main, (id) => this.navigateToStudyGuide(id));
        this.#fetchStudyGuides();

        this.#contents = new StudyGuideContents(this.#main);
    }

    async #fetchStudyGuides() {
        this.studyguides = await magisterApi.studyguides();
        this.#overview.addStudyguides(this.studyguides);
        this.#overview.draw();
    }

    navigateToStudyGuide(id) {
        this.#main.classList.add('contents-visible');
        this.#contents.loadStudyGuide(id);
        this.#overview.updateActiveStudyGuide(id);
        this.#main.querySelector('#st-sg-sidebar-toggle').style.display = 'flex';
    }
}

class StudyGuidesOverview {
    element;
    #list;
    #emptyText;
    #progressBar;
    studyguides;
    #drawMode = 'normal';
    #navigationCallback;

    get drawMode() {
        return this.#drawMode;
    }

    set drawMode(value) {
        const allowedModes = ['normal', 'hidden', 'archived'];
        this.#drawMode = allowedModes.includes(value) ? value : 'normal';
    }

    constructor(parentElement, navigationCallback) {
        this.element = parentElement.createChildElement('div', { id: 'st-sg-overview' });

        const toolbar = this.element.createChildElement('div', { id: 'st-sg-overview-toolbar' });
        const segmentedControl = toolbar.createChildElement('div');
        segmentedControl.createChildElement('button', { class: 'st-button segment active', dataset: { mode: 'normal' }, innerText: i18n('sw.viewActive') });
        segmentedControl.createChildElement('button', { class: 'st-button segment', dataset: { mode: 'archived' }, innerText: i18n('sw.viewArchived') });
        segmentedControl.createChildElement('button', { class: 'st-button segment', dataset: { mode: 'hidden' }, innerText: i18n('sw.viewHidden') });
        segmentedControl.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                segmentedControl.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.drawMode = button.dataset.mode;
                this.draw();
            });
        });

        const sidebarToggle = toolbar.createChildElement('button', { id: 'st-sg-sidebar-toggle', class: 'st-button icon', innerText: '', title: i18n('collapse'), style: { marginLeft: 'auto', display: 'none' } });
        sidebarToggle.addEventListener('click', () => {
            this.element.closest('#st-sg-main')?.classList.remove('contents-visible');
            sidebarToggle.style.display = 'none';
            document.querySelectorAll('.st-sg-item.active').forEach(item => item.classList.remove('active'));
        });

        this.#list = this.element.createChildElement('div', { id: 'st-sg-list' });
        this.#emptyText = this.element.createChildElement('div', { id: 'st-sg-overview-empty', innerText: i18n('sw.noActiveItems') });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

        this.#navigationCallback = navigationCallback;
    }

    addStudyguides(studyguides) {
        this.studyguides = studyguides.map(sg => {
            const { Id: id, Titel: title, Van: from, TotEnMet: to, VakCodes: subjectCodes, InLeerlingArchief: isArchived } = sg;

            let subject = savedStudyguides.find(e => e.id === id || e.title === title)?.subject || autoStudyguideSubject(subjectCodes.join(' ') + ' ' + title);

            let period = autoStudyguidePeriod(title);

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
                    'data-id': sg.id
                });

                sgElement.addEventListener('click', () => {
                    if (this.#navigationCallback) {
                        this.#navigationCallback(sg.id);
                    } else {
                        window.location.href = `#/elo/studiewijzer/${sg.id}`;
                    }
                });

                if (window.location.href.includes(`#/elo/studiewijzer/${sg.id}`)) {
                    sgElement.classList.add('active');
                }
            });
        });

        this.#progressBar.dataset.visible = false;
    }

    updateActiveStudyGuide(id) {
        this.#list.querySelectorAll('.st-sg-item').forEach(item => item.classList.remove('active'));
        const activeItem = this.#list.querySelector(`.st-sg-item[data-id="${id}"]`);
        if (activeItem) activeItem.classList.add('active');
    }
}

class StudyGuideContents {
    element;
    #progressBar;
    #titleElement;
    #subjectElement;
    #periodElement;
    #wrapper;
    #body;

    #attachmentFileTypes = [
        { extensions: ['pdf'], icon: '' },
        { extensions: ['txt', 'md'], icon: '' },
        { extensions: ['doc', 'docx', 'odt', 'csv'], icon: '', name: 'Word' },
        { extensions: ['ppt', 'pptx', 'odp'], icon: '', name: 'PowerPoint' },
        { extensions: ['xls', 'xlsx', 'ods'], icon: '', name: 'Excel' },
        { extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'], icon: '' },
        { extensions: ['svg', 'eps'], icon: '' },
        { extensions: ['mp3', 'wav', 'avi', 'ogg'], icon: '' },
        { extensions: ['mp4', 'mov'], icon: '' },
        { extensions: ['zip', '7z', 'rar', 'tar', 'gz'], icon: '' },
        { extensions: ['exe', 'msi', 'cad'], icon: '' },
    ];

    constructor(parentElement) {
        this.element = parentElement.createChildElement('div', { id: 'st-sg-contents' });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

        this.#wrapper = this.element.createChildElement('div', { id: 'st-sg-contents-wrapper' });

        const header = this.#wrapper.createChildElement('div', { id: 'st-sg-contents-header' });
        this.#titleElement = header.createChildElement('h3', { class: 'st-section-heading' });
        const headerInfo = header.createChildElement('div', { id: 'st-sg-contents-header-info' });
        this.#subjectElement = headerInfo.createChildElement('a', { class: 'st-sg-edit' });
        this.#periodElement = headerInfo.createChildElement('a', { class: 'st-sg-edit' });

        this.#body = this.#wrapper.createChildElement('div', { id: 'st-sg-contents-body' });
    }

    async loadStudyGuide(id) {
        this.#progressBar.dataset.visible = true;

        const studyguide = await magisterApi.studyguide(id);

        this.#titleElement.innerText = studyguide.Titel;
        this.#subjectElement.innerText = savedStudyguides.find(e => e.id === id)?.subject || autoStudyguideSubject(studyguide.VakCodes.join(' ') + ' ' + studyguide.Titel);
        this.#periodElement.innerText = autoStudyguidePeriod(studyguide.Titel) > 0 ? i18n('sw.periodN', { period: autoStudyguidePeriod(studyguide.Titel), periodOrdinal: formatOrdinals(autoStudyguidePeriod(studyguide.Titel), true) }) : i18n('sw.periodMissing');
        this.#body.innerText = '';
        this.#wrapper.scrollTo({ top: 0, behavior: 'smooth' });

        for (const section of studyguide.Onderdelen?.Items || []) {
            const sectionElement = this.#body.createChildElement('div', { classList: ['st-sg-section', `st-color-${section.Kleur}`] });

            const sectionTop = sectionElement.createChildElement('button', { class: 'st-sg-section-top', title: i18n('expand') });
            sectionTop.createChildElement('h3', { class: 'st-section-heading', innerText: section.Titel });
            sectionTop.createChildElement('p', { class: 'st-sg-section-abstract', innerText: section.Omschrijving });

            let expanded = false;

            const sectionBody = sectionElement.createChildElement('div', { class: 'st-sg-section-body st-collapsed', innerText: section.Omschrijving });

            sectionTop.addEventListener('click', async () => {
                if (!expanded) {
                    this.#progressBar.dataset.visible = true;
                    const item = await magisterApi.studyguideSection(id, section.Id);

                    sectionBody.innerHTML = item.Omschrijving || '';

                    if (item.Bronnen?.length) {
                        const sourcesContainer = sectionBody.createChildElement('div', { class: 'st-sg-attachments' });
                        item.Bronnen.sort((a, b) => a.Volgnr - b.Volgnr).forEach(source => {
                            const sourceElement = sourcesContainer.createChildElement('button', {
                                id: `source-${source.Id}`,
                                class: 'st-sg-attachment',
                                dataset: {
                                    icon: this.#attachmentFileTypes.find(type => type.extensions.some(ext => source.Naam.toLowerCase().endsWith('.' + ext)))?.icon || '',
                                }
                            });
                            sourceElement.createChildElement('span', {
                                innerText: source.Naam
                            });

                            let infoRows = [];
                            if (source.GeplaatstDoor) infoRows.push(i18n('uploadedBy') + ': ' + source.GeplaatstDoor?.Naam);
                            if (source.GemaaktOp) infoRows.push(i18n('createdAt') + ': ' + new Date(source.GemaaktOp).toLocaleString());
                            if (source.GewijzigdOp) infoRows.push(i18n('modifiedAt') + ': ' + new Date(source.GewijzigdOp).toLocaleString());
                            if (source.Grootte) infoRows.push(i18n('fileSize') + ': ' + (source.Grootte ? `${Math.ceil(source.Grootte / 1024)} ${i18n('units.kibibyte')}` : ''));
                            sourceElement.title = infoRows.join('\n');

                            if (source.Uri?.length) {
                                sourceElement.dataset.icon = '';
                                sourceElement.addEventListener('click', () => {
                                    window.open(source.Uri, '_blank');
                                });
                            } else if (source.Links[0]?.Href?.length) {
                                sourceElement.addEventListener('click', async () => {
                                    const attachment = await magisterApi.studyguideAttachment(id, section.Id, source.Id, syncedStorage['sw-inline-attachments']);
                                    const url = attachment?.location;
                                    window.open(url, '_blank');
                                });
                            }

                            if (source.ModuleSoort === 5) {
                                sourceElement.dataset.icon = '';
                                sourceElement.title = i18n('expand');
                                sourceElement.classList.add('folder');

                                const childrenContainer = sourcesContainer.createChildElement('div', { class: 'st-sg-attachments-children', id: `source-${source.Id}-children` });

                                childrenContainer.classList.add('st-collapsed')
                                sourceElement.addEventListener('click', () => {
                                    childrenContainer.classList.toggle('st-collapsed');
                                    sourceElement.dataset.icon = childrenContainer.classList.contains('st-collapsed') ? '' : '';
                                    sourceElement.title = i18n(childrenContainer.classList.contains('st-collapsed') ? 'expand' : 'collapse');
                                    sourceElement.classList.toggle('open');
                                });
                            }

                            if (source.ParentId) sourcesContainer.querySelector(`#source-${source.ParentId}-children`)?.appendChild(sourceElement);

                        });
                    }

                    expanded = true;

                    this.#progressBar.dataset.visible = false;
                }

                sectionBody.classList.toggle('st-collapsed');
                sectionTop.classList.toggle('st-collapsed');
                sectionTop.title = sectionTop.classList.contains('st-collapsed') ? i18n('collapse') : i18n('expand');
            });
        }

        this.#progressBar.dataset.visible = false;
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

function autoStudyguidePeriod(title) {
    let period = 0;
    let periodTextIndex = title.search(/(kw(t)?|(kwintaal)|(term)|t(hema)?|to|po|p(eriod(e)?)?)(\s|\d)/i);

    if (periodTextIndex > 0) {
        let periodNumberSearchString = title.slice(periodTextIndex),
            periodNumberIndex = periodNumberSearchString.search(/[1-9]/i);
        if (periodNumberIndex > 0) period = Number(periodNumberSearchString.charAt(periodNumberIndex));
    }

    return period;
}