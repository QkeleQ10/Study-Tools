let overview, contents;
let currentStudyGuideId;

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

        {
            const breadcrumbs = header.createChildElement('div', {
                id: 'st-sg-breadcrumbs',
                class: 'st-breadcrumbs',
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                }
            });
            breadcrumbs
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
                    id: 'st-sg-breadcrumbs-a',
                    innerText: i18n('views.Studiewijzers'),
                    style: {
                        font: '12px var(--st-font-family-secondary)'
                    }
                })
                .addEventListener('click', () => {
                    this.#overview.hideContents();
                });

            breadcrumbs
                .createChildElement('span', {
                    id: 'st-sg-breadcrumbs-b',
                    innerText: '',
                    style: {
                        font: '14px "Font Awesome 6 Pro"',
                        color: 'var(--st-foreground-insignificant)',
                        display: 'none'
                    }
                })
                .createSiblingElement('span', {
                    id: 'st-sg-breadcrumbs-c',
                    style: {
                        font: '12px var(--st-font-family-secondary)',
                        display: 'none'
                    }
                });
        }

        header.createChildElement('span', { class: 'st-title', innerText: i18n('views.Studiewijzers'), });

        this.#main = this.element.createChildElement('div', { id: 'st-sg-main' });

        this.#overview = new StudyGuidesOverview(this.#main, (studyguide) => this.navigateToStudyGuide(studyguide));
        overview = this.#overview;
        this.#fetchStudyGuides();

        this.#contents = new StudyGuideContents(this.#main);
        contents = this.#contents;

        this.element.createChildElement('a', {
            innerText: "Help Study Tools te verbeteren",
            style: { position: 'absolute', bottom: '10px', right: '32px' }
        }).addEventListener('click', () => this.#promptMachineLearning());
    }

    async #fetchStudyGuides() {
        this.studyguides = await magisterApi.studyguides();
        this.#overview.addStudyguides(this.studyguides);
    }

    navigateToStudyGuide(studyguide) {
        this.#main.classList.add('contents-visible');
        this.#contents.loadStudyGuide(studyguide);
        this.#overview.updateActiveStudyGuide(studyguide);
        this.#main.querySelector('#st-sg-sidebar-toggle').style.display = 'flex';
    }

    async #promptMachineLearning() {
        new Dialog({
            innerText: "Deze pagina gaat in de toekomst machinelearning gebruiken om studiewijzers in te delen. Dat algoritme moet ik eerst trainen. \nAangezien Study Tools niet automatisch gegevens verzamelt, heb ik jouw hulp nodig. \n\nIk wil je vragen om jouw studiewijzers in te delen in vakken. Daarna kan je je resultaten naar mij sturen en kan ik het algoritme gaan trainen.",
            closeText: "Niet meehelpen",
            clickOutsideToClose: false,
            buttons: [
                {
                    innerText: "Volgende",
                    primary: true,
                    onclick: (_, close) => {
                        close();
                        dialog2();
                    }
                }
            ]
        })
            .show();

        const dialog2 = () => {
            const dialog = new Dialog({
                innerText: "Kies voor elke studiewijzer het vak dat er het beste bij past. \nKiest het liefst een vaknaam uit de lijst. Je kan ook zelf een vaknaam typen als er echt geen geschikte keuze tussen staat.",
                closeText: "Annuleren",
                clickOutsideToClose: false,
                buttons: [
                    {
                        innerText: "Volgende",
                        primary: true,
                        onclick: (_, close) => {
                            close();
                            dialog3();
                        }
                    }
                ]
            });
            const list = dialog.body.createChildElement('ul', { class: 'st-sg-ml-editor' });

            this.studyguides
                .map(sg => {
                    const { Id: id, Titel: title, Van: from, TotEnMet: to, VakCodes: subjectCodes, InLeerlingArchief: isArchived } = sg;

                    let subject = syncedStorage['sg-override-subjects']?.[id] ?? autoStudyguideSubject(subjectCodes.join(' ') + ' ' + title);
                    let period = syncedStorage['sg-override-periods']?.[id] ?? autoStudyguidePeriod(title);
                    let isHidden = Object.values(syncedStorage['sg-hidden-studyguides'] || []).includes(id);

                    return { id, title, from, to, subjectCodes, subject, period, isArchived, isHidden };
                })
                .forEach(studyguide => {
                    const item = list.createChildElement('li');
                    item.createChildElement('span', { innerText: studyguide.subjectCodes.join(' ') + ' ' + studyguide.title });
                    const subjectButton = item.createChildElement('a', {
                        class: 'st-sg-edit',
                        innerText: syncedStorage['sg-override-subjects']?.[studyguide.id] || autoStudyguideSubject(studyguide.subjectCodes.join(' ') + ' ' + studyguide.title) || i18n('sw.unknownSubject'),
                        title: i18n('sw.editSubject')
                    });
                    subjectButton.addEventListener('click', () => {
                        const dialog = new StudyGuideEditSubjectDialog(studyguide, () => {
                            subjectButton.innerText = syncedStorage['sg-override-subjects']?.[studyguide.id] || autoStudyguideSubject(studyguide.subjectCodes.join(' ') + ' ' + studyguide.title) || i18n('sw.unknownSubject');
                        });
                        dialog.show();
                    });
                });

            dialog.body.createChildElement('p', {
                style: {
                    marginTop: '16px',
                    font: '600 14px var(--st-font-family-secondary)',
                },
                innerText: "Klik pas op Volgende als de hele lijst hierboven klopt!"
            });

            dialog.show();
        }

        const dialog3 = () => {
            const dialog = new Dialog({
                innerText: "Study Tools doet niet aan automatische gegevensverzameling. \nStuur daarom je resultaten via mail naar mij. Gebruik de Insturen-knop hieronder en verzend de mail!\n\nBedankt voor je hulp.",
                closeText: "Annuleren",
                clickOutsideToClose: false,
                buttons: [
                    {
                        innerText: "Insturen",
                        primary: true,
                        onclick: (_, close) => {
                            close();
                            window.open(`mailto:qkeleq10@gmail.com?subject=Trainingsdata studiewijzers (${makeId(6)})&body=` + encodeURIComponent('Verzend deze mail zonder hem aan te passen! Zo kan ik de data straks allemaal in één keer verwerken.\n\n' +
                                this.studyguides.map(sg => {
                                    const { Id: id, Titel: title, VakCodes: subjectCodes } = sg;
                                    return `${subjectCodes.join(' ')} ${title} => ${syncedStorage['sg-override-subjects']?.[id] ?? autoStudyguideSubject(subjectCodes.join(' ') + ' ' + title)}`;
                                }).join('\n')
                            ), '_blank');
                        }
                    }
                ]
            });
            dialog.show();
        }

        const makeId = (length) => {
            let result = '';
            let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let charactersLength = characters.length;
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        };
    }
}

class StudyGuidesOverview {
    element;
    #list;
    #emptyText;
    #progressBar;
    #sidebarToggle;
    #drawActiveButton;
    #drawArchivedButton;
    #studyguidesSource;
    studyguides;
    #drawMode = 'normal';
    #navigationCallback;

    get drawMode() {
        return this.#drawMode;
    }

    set drawMode(value) {
        const allowedModes = ['normal', 'archived'];
        this.#drawMode = allowedModes.includes(value) ? value : 'normal';
        this.#updateSegmentedControl();
        this.#draw();
    }

    constructor(parentElement, navigationCallback) {
        this.element = parentElement.createChildElement('div', { id: 'st-sg-overview' });

        const toolbar = this.element.createChildElement('div', { id: 'st-sg-overview-toolbar' });
        const segmentedControl = toolbar.createChildElement('div');
        this.#drawActiveButton = segmentedControl.createChildElement('button', { class: 'st-button segment active', dataset: { mode: 'normal' }, innerText: i18n('sw.viewActive') });
        this.#drawActiveButton.addEventListener('click', () => {
            this.drawMode = 'normal';
        });
        this.#drawArchivedButton = segmentedControl.createChildElement('button', { class: 'st-button segment', dataset: { mode: 'archived' }, innerText: i18n('sw.viewArchived') });
        this.#drawArchivedButton.addEventListener('click', () => {
            this.drawMode = 'archived';
        });

        this.#sidebarToggle = toolbar.createChildElement('button', {
            id: 'st-sg-sidebar-toggle',
            class: 'st-button icon',
            innerText: '',
            title: i18n('collapse'),
            style: { display: 'none' }
        });
        this.#sidebarToggle.addEventListener('click', () => this.hideContents());

        this.#list = this.element.createChildElement('div', { id: 'st-sg-list' });
        this.#emptyText = this.element.createChildElement('div', { id: 'st-sg-overview-empty', innerText: i18n('sw.noActiveItems') });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

        this.#navigationCallback = navigationCallback;
    }

    addStudyguides(studyguides) {
        this.#studyguidesSource = studyguides;
        this.studyguides = this.#studyguidesSource.map(sg => {
            const { Id: id, Titel: title, Van: from, TotEnMet: to, VakCodes: subjectCodes, InLeerlingArchief: isArchived } = sg;

            let subject = syncedStorage['sg-override-subjects']?.[id] ?? autoStudyguideSubject(subjectCodes.join(' ') + ' ' + title);
            let period = syncedStorage['sg-override-periods']?.[id] ?? autoStudyguidePeriod(title);
            let isHidden = Object.values(syncedStorage['sg-hidden-studyguides'] || []).includes(id);

            return { id, title, from, to, subjectCodes, subject, period, isArchived, isHidden };
        });

        this.#draw();
    }

    isStudyguideVisible(sg) {
        switch (this.drawMode) {
            case 'archived':
                return sg.isArchived || sg.isHidden;
            case 'normal':
            default:
                return !sg.isArchived && !sg.isHidden;
        }
    }

    refresh() {
        this.studyguides = this.#studyguidesSource.map(sg => {
            const { Id: id, Titel: title, Van: from, TotEnMet: to, VakCodes: subjectCodes, InLeerlingArchief: isArchived } = sg;

            let subject = syncedStorage['sg-override-subjects']?.[id] ?? autoStudyguideSubject(subjectCodes.join(' ') + ' ' + title);
            let period = syncedStorage['sg-override-periods']?.[id] ?? autoStudyguidePeriod(title);
            let isHidden = Object.values(syncedStorage['sg-hidden-studyguides'] || []).includes(id);

            return { id, title, from, to, subjectCodes, subject, period, isArchived, isHidden };
        });

        this.#draw();
    }

    #draw() {
        this.#list.innerText = '';


        this.#emptyText.innerText = i18n(this.drawMode === 'archived' ? 'sw.noArchivedItems' : 'sw.noActiveItems');
        this.#emptyText.style.display = this.studyguides.some(sg => this.isStudyguideVisible(sg)) ? 'none' : 'block';

        const subjects = Object.groupBy(this.studyguides.filter(sg => this.isStudyguideVisible(sg)), sg => sg.subject);

        const settingShowPeriod = syncedStorage['sg-show-period'];

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

            subjects[subject].sort((a, b) => a.period - b.period).forEach(studyguide => {
                const sgElement = studyguidesContainer.createChildElement('button', {
                    class: 'st-button secondary st-sg-item',
                    innerText: settingShowPeriod && studyguide.period > 0 ? i18n('sw.periodN', { period: studyguide.period, periodOrdinal: formatOrdinals(studyguide.period, true) }) : studyguide.title,
                    title: `${studyguide.title}\n${studyguide.period > 0 ? i18n('sw.periodN', { period: studyguide.period, periodOrdinal: formatOrdinals(studyguide.period, true) }) : i18n('sw.periodMissing')}`,
                    'data-id': studyguide.id
                });

                if (currentStudyGuideId === studyguide.id) {
                    sgElement.classList.add('active');
                }

                sgElement.addEventListener('click', () => {
                    if (this.#navigationCallback) {
                        this.#navigationCallback(studyguide);
                    } else {
                        window.location.href = `#/elo/studiewijzer/${studyguide.id}`;
                    }
                });

                if (window.location.href.includes(`#/elo/studiewijzer/${studyguide.id}`)) {
                    sgElement.classList.add('active');
                }
            });
        });

        this.#progressBar.dataset.visible = false;
    }

    #updateSegmentedControl() {
        this.#drawActiveButton.classList.toggle('active', this.drawMode === 'normal');
        this.#drawArchivedButton.classList.toggle('active', this.drawMode === 'archived');
    }

    updateActiveStudyGuide(studyguide) {
        currentStudyGuideId = studyguide.id;
        this.#draw();

        document.getElementById('st-sg-breadcrumbs-a').classList.add('clickable');
        document.getElementById('st-sg-breadcrumbs-b').style.display = 'block';
        document.getElementById('st-sg-breadcrumbs-c').style.display = 'block';
        document.getElementById('st-sg-breadcrumbs-c').innerText = studyguide.title || i18n('views.Studiewijzer details');
    }

    hideContents() {
        currentStudyGuideId = null;
        this.#draw();

        this.element.closest('#st-sg-main')?.classList.remove('contents-visible');
        this.#sidebarToggle.style.display = 'none';

        document.getElementById('st-sg-breadcrumbs-a').classList.remove('clickable');
        document.getElementById('st-sg-breadcrumbs-b').style.display = 'none';
        document.getElementById('st-sg-breadcrumbs-c').style.display = 'none';
    }
}

class StudyGuideContents {
    element;
    studyguide;
    #progressBar;
    #titleElement;
    #subjectElement;
    #periodElement;
    #hideButton;
    #expandAllButton;
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

        this.#subjectElement = headerInfo.createChildElement('a', { class: 'st-sg-edit', title: i18n('sw.editSubject') });
        this.#subjectElement.addEventListener('click', () => {
            const dialog = new StudyGuideEditSubjectDialog(this.studyguide, () => {
                this.studyguide.subject = syncedStorage['sg-override-subjects']?.[this.studyguide.id] || autoStudyguideSubject(this.studyguide.subjectCodes.join(' ') + ' ' + this.studyguide.title);
                this.#updateHeader();
                overview.refresh();
            });
            dialog.show();
        });

        this.#periodElement = headerInfo.createChildElement('a', { class: 'st-sg-edit', title: i18n('sw.editPeriod') });
        this.#periodElement.addEventListener('click', () => {
            const dialog = new StudyGuideEditPeriodDialog(this.studyguide, () => {
                this.studyguide.period = syncedStorage['sg-override-periods']?.[this.studyguide.id] ?? autoStudyguidePeriod(this.studyguide.title);
                this.#updateHeader();
                overview.refresh();
            });
            dialog.show();
        });

        const headerActions = headerInfo.createChildElement('div', { id: 'st-sg-contents-header-actions' });

        this.#hideButton = headerActions.createChildElement('button', { class: 'st-button icon', innerText: '', title: i18n('sw.moveTo') });
        this.#hideButton.addEventListener('click', () => this.moveStudyGuide());

        this.#expandAllButton = headerActions.createChildElement('button', { class: 'st-button icon', innerText: '', title: i18n('sw.expandAll') });
        this.#expandAllButton.addEventListener('click', () => this.expandAllSections());

        this.#body = this.#wrapper.createChildElement('div', { id: 'st-sg-contents-body' });
    }

    async loadStudyGuide(studyguide) {
        this.studyguide = studyguide;

        this.#progressBar.dataset.visible = true;

        this.#wrapper.scrollTo({ top: 0, behavior: 'smooth' });

        const studyguideDetails = await magisterApi.studyguide(studyguide.id);

        this.#updateHeader();
        this.#body.innerText = '';

        for (const section of studyguideDetails.Onderdelen?.Items || []) {
            const sectionElement = this.#body.createChildElement('div', { classList: ['st-sg-section', `st-color-${section.Kleur}`] });

            const sectionTop = sectionElement.createChildElement('button', { class: 'st-sg-section-top', title: i18n('expand') });
            sectionTop.createChildElement('h3', { class: 'st-section-heading', innerText: section.Titel });
            sectionTop.createChildElement('p', { class: 'st-sg-section-abstract', innerText: section.Omschrijving });

            if (autoSectionWeek(section.Titel).includes(new Date().getWeek())) {
                sectionTop.classList.add('current');
            }

            let expanded = false;

            const sectionBody = sectionElement.createChildElement('div', { class: 'st-sg-section-body st-collapsed', innerText: section.Omschrijving });

            sectionTop.addEventListener('click', async () => {
                if (!expanded) {
                    this.#progressBar.dataset.visible = true;
                    const item = await magisterApi.studyguideSection(studyguide.id, section.Id);

                    sectionBody.innerHTML = item.Omschrijving || '';

                    if (item.Bronnen?.length) {
                        const sourcesContainer = sectionBody.createChildElement('div', { class: 'st-sg-attachments' });
                        item.Bronnen.sort((a, b) => ((a.ParentId > 0) ? 1 : 0) - ((b.ParentId > 0) ? 1 : 0) || a.Volgnr - b.Volgnr).forEach(source => {
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
                                    const attachment = await magisterApi.studyguideAttachment(studyguide.id, section.Id, source.Id, syncedStorage['sg-inline-attachments']);
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

                            if (source.ParentId && source.ParentId > 0) {
                                sourcesContainer.querySelector(`#source-${source.ParentId}-children`)?.appendChild(sourceElement);
                            }

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

        if (syncedStorage['sg-scroll-current-week']) {
            const currentSection = this.#body.querySelector('.st-sg-section-top.current');
            if (currentSection) {
                currentSection.click();
                this.#wrapper.scrollTo({ top: currentSection.offsetTop - 200, behavior: 'smooth' });
            }
        }

        this.#progressBar.dataset.visible = false;
    }

    #updateHeader() {
        this.#titleElement.innerText = this.studyguide.title;
        this.#subjectElement.innerText = syncedStorage['sg-override-subjects']?.[this.studyguide.id] || autoStudyguideSubject(this.studyguide.subjectCodes.join(' ') + ' ' + this.studyguide.title);
        if (syncedStorage['sg-override-periods']?.[this.studyguide.id] !== undefined) {
            this.#periodElement.innerText =
                syncedStorage['sg-override-periods']?.[this.studyguide.id] > 0
                    ? i18n('sw.periodN', {
                        period: syncedStorage['sg-override-periods']?.[this.studyguide.id],
                        periodOrdinal: formatOrdinals(syncedStorage['sg-override-periods']?.[this.studyguide.id], true)
                    })
                    : i18n('sw.periodMissing');

        } else {
            this.#periodElement.innerText =
                autoStudyguidePeriod(this.studyguide.title) > 0
                    ? i18n('sw.periodN', {
                        period: autoStudyguidePeriod(this.studyguide.title),
                        periodOrdinal: formatOrdinals(autoStudyguidePeriod(this.studyguide.title), true)
                    })
                    : i18n('sw.periodMissing');
        }
        this.#hideButton.title = i18n('sw.moveTo', { destination: this.studyguide.isArchived ? i18n('sw.viewActive') : i18n('sw.viewArchived') });
    }

    moveStudyGuide() {
        const dialog = new Dialog({
            innerText: this.studyguide.isHidden
                ? i18n('sw.moveConfirm', { origin: i18n('sw.viewArchived'), destination: i18n('sw.viewActive') })
                : i18n('sw.moveConfirm', { origin: i18n('sw.viewActive'), destination: i18n('sw.viewArchived') }),
            buttons: [
                {
                    primary: true,
                    innerText: i18n('move'),
                    callback: () => {
                        if (this.studyguide.isHidden) {
                            syncedStorage['sg-hidden-studyguides'] = Object.values(syncedStorage['sg-hidden-studyguides'] || []).filter(id => id !== this.studyguide.id);
                        } else {
                            syncedStorage['sg-hidden-studyguides'] = [...Object.values(syncedStorage['sg-hidden-studyguides'] || []), this.studyguide.id];
                        }
                        this.studyguide.isHidden = !this.studyguide.isHidden;
                        this.#updateHeader();
                        overview.drawMode = this.studyguide.isHidden ? 'archived' : 'normal';
                        dialog.close();

                        notify('snackbar', i18n('sw.moved', { destination: this.studyguide.isHidden ? i18n('sw.viewArchived') : i18n('sw.viewActive') }));
                    }
                }
            ],
            closeText: i18n('cancel')
        });
        dialog.show();
    }

    expandAllSections() {
        const allCollapsedSections = this.#body.querySelectorAll('.st-sg-section-top:not(.st-collapsed)');
        if (allCollapsedSections.length === 0) {
            this.#body.querySelectorAll('.st-sg-section-top.st-collapsed').forEach(sectionTop => sectionTop.click());
        } else {
            allCollapsedSections.forEach(sectionTop => sectionTop.click());
        }
    }
}

class StudyGuideEditSubjectDialog extends Dialog {
    #studyguide;
    #old;
    #suggestion;
    #saveCallback;
    #input;
    #list;

    #subjectsSorted = [...SUBJECTS].sort((a, b) => a.name.localeCompare(b.name));

    constructor(studyguide, saveCallback) {
        super({
            buttons: [
                {
                    innerText: i18n('save'),
                    dataset: { icon: '' },
                    callback: () => this.save()
                }
            ],
            closeText: i18n('cancel')
        });

        this.#studyguide = studyguide;
        this.#saveCallback = saveCallback;
        this.#old = studyguide.subject;
        this.#suggestion = autoStudyguideSubject(studyguide.subjectCodes.join(' ') + ' ' + studyguide.title);

        this.body.classList.add('st-subject-dialog');

        this.body.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('sw.editSubject') });

        this.#input = this.body.createChildElement('input', { class: 'st-input', placeholder: i18n('sw.search') });
        this.#input.value = this.#studyguide.subject || '';
        this.#input.addEventListener('input', () => this.#populateList());

        this.body.createChildElement('br');
        this.body.createChildElement('br');
        this.body.createChildElement('small', { class: 'st-note', innerText: i18n('sw.searchResults') });
        this.#list = this.body.createChildElement('div', { class: 'st-subject-list' });
        this.#populateList();
    }

    #populateList() {
        const query = this.#input.value.trim().toLowerCase();
        const subjects = [...this.#subjectsSorted].sort((a, b) => {
            const scoreA = this.#matchScore(a, query);
            const scoreB = this.#matchScore(b, query);

            if (scoreA !== scoreB) return scoreA - scoreB;

            return a.name.localeCompare(b.name);
        });

        this.#list.innerText = '';
        subjects.forEach(subject => {
            const score = this.#matchScore(subject, query);
            const subjectButton = this.#list.createChildElement('button', {
                class: 'st-subject-list-item',
                innerText: subject.name,
            });

            if (score === Number.MAX_SAFE_INTEGER) {
                subjectButton.classList.add('muted');
            }

            if (subject.name === this.#input.value.trim()) {
                subjectButton.createChildElement('small', { innerText: i18n('sw.selected') });
                subjectButton.classList.add('active');
            } else if (subject.name === this.#old) {
                subjectButton.createChildElement('small', { innerText: i18n('sw.current') });
            }
            if (subject.name === this.#suggestion) {
                subjectButton.createChildElement('small', { innerText: i18n('sw.recognised') });
            }

            subjectButton.addEventListener('click', () => {
                this.#input.value = subject.name;
                setTimeout(() => {

                    this.#populateList();
                }, 5);
            });
        });
    }

    #matchScore(subject, query) {
        if (!query.length) return Number.MAX_SAFE_INTEGER - 1;

        const name = subject.name.toLowerCase();
        const aliases = subject.aliases.map(alias => alias.toLowerCase());

        if (name === query) return 0;

        if (name.startsWith(query)) return 10;

        const nameWordMatchIndex = name.search(new RegExp(`\\b${escapeRegExp(query)}`));
        if (nameWordMatchIndex >= 0) return 20 + nameWordMatchIndex;

        const nameContainsIndex = name.indexOf(query);
        if (nameContainsIndex >= 0) return 40 + nameContainsIndex;

        const aliasStartsWithIndex = aliases.findIndex(alias => alias.startsWith(query));
        if (aliasStartsWithIndex >= 0) return 60 + aliasStartsWithIndex;

        const aliasContainsIndex = aliases.findIndex(alias => alias.includes(query));
        if (aliasContainsIndex >= 0) return 80 + aliasContainsIndex;

        if (subject.name === this.#suggestion) return 90;
        if (subject.name === this.#old) return 91;

        return Number.MAX_SAFE_INTEGER;
    }

    async save() {
        syncedStorage['sg-override-subjects'] = {
            ...(syncedStorage['sg-override-subjects'] || {}),
            [this.#studyguide.id]: this.#input.value.trim() || undefined
        };

        notify('snackbar', i18n('saved'));

        this.close();

        if (this.#saveCallback) this.#saveCallback();
    }
}

class StudyGuideEditPeriodDialog extends Dialog {
    #studyguide;
    #old;
    #suggestion;
    #saveCallback;
    #input;

    constructor(studyguide, saveCallback) {
        super({
            buttons: [
                {
                    innerText: i18n('save'),
                    dataset: { icon: '' },
                    callback: () => this.save()
                }
            ],
            closeText: i18n('cancel')
        });

        this.#studyguide = studyguide;
        this.#saveCallback = saveCallback;
        this.#old = studyguide.period;
        this.#suggestion = autoStudyguidePeriod(studyguide.title);

        this.body.classList.add('st-subject-dialog');

        this.body.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('sw.editPeriod') });

        this.#input = this.body.createChildElement('input', { class: 'st-input', placeholder: 0, type: 'number', min: 0 });
        this.#input.value = this.#studyguide.period ?? 0;

        this.body.createChildElement('br');
        this.body.createChildElement('small', { class: 'st-note', innerText: i18n('sw.recognised') + ': ' + i18n('sw.periodN', { period: this.#suggestion, periodOrdinal: formatOrdinals(this.#suggestion, true) }) });
        this.body.createChildElement('br');
        this.body.createChildElement('small', { class: 'st-note', innerText: i18n('sw.editPeriodDisclaimer') });
    }

    async save() {
        syncedStorage['sg-override-periods'] = {
            ...(syncedStorage['sg-override-periods'] || {}),
            [this.#studyguide.id]: this.#input.value.trim() ?? 0
        };

        notify('snackbar', i18n('saved'));

        this.close();

        if (this.#saveCallback) this.#saveCallback();
    }
}

const SUBJECTS = [
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
    { name: "Natuur- en scheikunde 1", aliases: ["natuur- en scheikunde 1", "natuur en scheikunde 1", "natuurkunde en scheikunde 1", "nask 1", "ns1", "nask1", "nsk1"] },
    { name: "Natuur- en scheikunde 2", aliases: ["natuur- en scheikunde 2", "natuur en scheikunde 2", "natuurkunde en scheikunde 2", "nask 2", "ns2", "nask2", "nsk2"] },
    { name: "Natuur- en scheikunde", aliases: ["natuur- en scheikunde", "natuur en scheikunde", "natuurkunde en scheikunde", "nask", "ns"] },
    { name: "Spaans", aliases: ["spaans", "sptl", "sp", "es", "spaanse", "español", "espanol"] },
    { name: "STEAM", aliases: ["steam", "stem"] },
    { name: "Techniek", aliases: ["techniek", "tech"] },
    { name: "Wiskunde A", aliases: ["wiskunde a", "wi a", "wa", "wis a", "wisa"] },
    { name: "Wiskunde B", aliases: ["wiskunde b", "wi b", "wb", "wis b", "wisb"] },
    { name: "Wiskunde C", aliases: ["wiskunde c", "wi c", "wc", "wis c", "wisc"] },
    { name: "Wiskunde D", aliases: ["wiskunde d", "wi d", "wd", "wis d", "wisd"] },
    { name: "Wiskunde", aliases: ["wiskunde", "wi", "wis"] },
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
function autoStudyguideSubject(title) {
    const resultingSubject = SUBJECTS.find((subjectObject) => title?.split(/\s|-|_|\d/gi)?.some(titleWord => subjectObject.aliases.includes(titleWord.toLowerCase())))

    return resultingSubject?.name || 'Geen vak'
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function autoSectionWeek(sectionTitle) {
    // return an array of week numbers that are mentioned in the section title, or an empty array if no week numbers are found
    if (!sectionTitle || typeof sectionTitle !== 'string') return [];

    const keywordRegex = /(?:week|weken|woche|wochen|semaine|semaines|semana|semanas|sem)\b|wk(?=\s*\d)/gi;
    const numberRegex = /^(\d{1,2})(?![,.]\d)/;
    const delimiterRegex = /^\s*(?:-|\/|&|en|and|und|et|e|y|)\s*/i;
    const weekNumbers = [];

    let keywordMatch;
    while ((keywordMatch = keywordRegex.exec(sectionTitle)) !== null) {
        let cursor = keywordRegex.lastIndex;

        const prefixMatch = sectionTitle.slice(cursor).match(/^\s*[:.\-]?\s*/);
        cursor += prefixMatch?.[0]?.length || 0;

        const firstNumberMatch = sectionTitle.slice(cursor).match(numberRegex);
        if (!firstNumberMatch) continue;

        weekNumbers.push(Number(firstNumberMatch[1]));
        cursor += firstNumberMatch[0].length;

        while (true) {
            const remaining = sectionTitle.slice(cursor);
            const delimiterMatch = remaining.match(delimiterRegex);
            if (!delimiterMatch) break;

            const nextStart = cursor + delimiterMatch[0].length;
            const nextNumberMatch = sectionTitle.slice(nextStart).match(numberRegex);
            if (!nextNumberMatch) break;

            weekNumbers.push(Number(nextNumberMatch[1]));
            cursor = nextStart + nextNumberMatch[0].length;
        }
    }

    return [...new Set(weekNumbers)];
}