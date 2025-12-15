let statsGrades = [],
    gradeTables = [],
    currentGradeTable = null,
    displayStatistics

// Run at start and when the URL changes
gradeOverview()
window.addEventListener('popstate', gradeOverview)

let listPane, backupPane, statisticsPane, calculatorPane;

async function gradeOverview() {
    if (!document.location.href.includes('cijfers') || !syncedStorage['cc']) return;

    (await awaitElement('#cijfers-laatst-behaalde-resultaten-container, #cijfers-container')).style.display = 'none';

    const mainView = await awaitElement('div.view.ng-scope'),
        container = mainView.createChildElement('div', { id: 'st-grades' }),
        progressBar = container.createChildElement('div', { class: 'st-progress-bar' }),
        header = container.createChildElement('div', { id: 'st-grades-header' }),
        contentContainer = container.createChildElement('div', { id: 'st-grades-main' });

    progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

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
            innerText: i18n('views.Cijfers'),
            style: {
                font: '12px var(--st-font-family-secondary)'
            }
        });
    header.createChildElement('span', { class: 'st-title', innerText: i18n('views.Cijfers'), });

    const toolbar = contentContainer.createChildElement('div', { id: 'st-grades-toolbar' });
    const yearFilter = toolbar.createChildElement('div', { id: 'st-grades-year-filter', class: 'st-horizontal-icon-radio st-tabs' });
    const tools = toolbar.createChildElement('div', { class: 'st-horizontal-icon-radio st-tabs' });

    const gradesContainer = contentContainer.createChildElement('div', { id: 'st-grades-container' });

    const panesContainer = contentContainer.createChildElement('div', { class: 'st-panes-container' });

    listPane = new GradeListPane(panesContainer);
    backupPane = new GradeBackupPane(panesContainer);
    statisticsPane = new GradeStatisticsPane(panesContainer);
    calculatorPane = new GradeCalculatorPane(panesContainer);

    const panes = [
        { instance: listPane },
        { instance: backupPane },
        { instance: statisticsPane },
        { instance: calculatorPane },
    ];

    const panesVisible = () => panes.some(p => p.instance.isVisible);

    panes.forEach(config => {
        const label = tools.createChildElement('label', {
            id: `st-grade-${config.instance.id}-button`,
            class: 'st-checkbox-label icon',
            title: i18n(`${config.instance.id}.title`),
            innerText: config.instance.icon,
        });
        const input = label.createChildElement('input', {
            id: `st-grade-${config.instance.id}-input`,
            class: 'st-checkbox-input',
            type: 'checkbox'
        });
        if (config.instance.isVisible) input.checked = true;
        config.input = input;
        input.addEventListener('change', () => {
            config.instance.toggle(input.checked);
            // close other panes
            panes.filter(p => p !== config).forEach(p => {
                if (p.input?.checked) p.input.click();
            });
            panesContainer.classList.toggle('st-hidden', !panesVisible());
        });
    });

    handleTooltips();

    const years = [...await magisterApi.years()].sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime());

    years.forEach(async (year, i) => {
        let label = yearFilter.createChildElement('label', {
            class: 'st-checkbox-label',
            for: `st-year-filter-year${year.id}`,
            innerText: year.studie.code.match(/\d/gi)?.[0],
            title: `${year.groep.omschrijving || year.groep.code} (${year.studie.code} in ${year.lesperiode.code})`
        });
        if (!(label.innerText?.length > 0)) label.innerText = i + 1;
        let input = label.createChildElement('input', { id: `st-year-filter-year${year.id}`, class: 'st-checkbox-input', name: 'st-year-filter', type: 'radio' });

        input.addEventListener('change', async () => {
            progressBar.dataset.visible = 'true';
            if (!input.checked) return;
            let gradeTable = gradeTables.find(t => t.identifier.year?.id === year.id);
            if (!gradeTable) {
                gradeTable = new GradeTable(await magisterApi.gradesForYear(year), { year });
                gradeTables.push(gradeTable);
            }
            currentGradeTable?.destroy();
            currentGradeTable = gradeTable;
            currentGradeTable.draw();
            progressBar.dataset.visible = 'false';
        });

        if (i === years.length - 1) {
            input.click();
        };
    });

    progressBar.dataset.visible = 'false';
}

async function handleTooltips() {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!localStorage['st-tutorial-shown']) {
        const overlay = document.getElementById('st-grades').createChildElement('div', {
            style: {
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--st-background-overlay)',
                transition: 'opacity 200ms',
                opacity: 0,
                zIndex: 1000,
                cursor: 'pointer',
            }
        });
        overlay.createChildElement('span', {
            class: 'st-title',
            innerText: i18n('tooltips.cNewH').slice(0, -1),
            dataset: { lastLetter: i18n('tooltips.cNewH').at(-1) }
        })
        overlay.createChildElement('p', {
            class: 'st-subtitle',
            innerText: i18n('tooltips.cNewDesc'),
            style: {
                maxWidth: '500px',
                marginTop: '12px',
                textAlign: 'center',
            }
        });

        overlay.style.opacity = '1';

        overlay.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
            localStorage['st-tutorial-shown'] = true;
            handleTooltips();
        }, { once: true });

        return;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const tooltipConfigs = [
        { key: 'st-tooltip-clNew-shown', textKey: 'tooltips.clNew', style: { top: '96px', right: '280px' }, trigger: 'body' },
        { key: 'st-tooltip-ccNew-shown', textKey: 'tooltips.ccNew', style: { top: '64px', right: '32px' }, triggerId: 'st-grade-cc-button' },
        { key: 'st-tooltip-csNew-shown', textKey: 'tooltips.csNew', style: { top: '64px', right: '68px' }, triggerId: 'st-grade-cs-button' },
    ];

    for (const cfg of tooltipConfigs) {
        if (!document.location.href.includes('cijfers') || !syncedStorage['cc']) return;
        if (localStorage[cfg.key]) continue;

        const tooltip = document.body.createChildElement('div', {
            class: 'st-tooltip bottom-right',
            innerText: i18n(cfg.textKey),
            style: {
                ...cfg.style,
                position: 'fixed',
                zIndex: 10,
            }
        });

        const closeHandler = () => {
            tooltip.classList.add('st-hidden');
            setTimeout(() => tooltip.remove(), 200);
            localStorage[cfg.key] = true;
            handleTooltips();
        };

        if (cfg.trigger === 'body') {
            document.body.addEventListener('click', closeHandler, { once: true });
        } else {
            const el = document.getElementById(cfg.triggerId);
            if (el) el.addEventListener('click', closeHandler, { once: true });
        }

        return;
    }
}

class Pane {
    id;
    icon;

    parentElement;
    element;
    progressBar;

    get isVisible() {
        return !this.element.classList.contains('st-hidden');
    }

    set isVisible(visible) {
        if (visible) this.show();
        else this.hide();
    }

    constructor(parentElement) {
        this.parentElement = parentElement;

        this.element = this.parentElement.createChildElement('div', { class: 'st-pane st-hidden', style: 'width: 300px;' });

        this.progressBar = this.element.createChildElement('div', {
            class: 'st-progress-bar', dataset: { visible: 'false' },
        });
        createElement('div', this.progressBar, {
            class: 'st-progress-bar-value indeterminate',
        });
    }

    show() {
        this.element.classList.remove('st-hidden');
    }

    hide() {
        this.element.classList.add('st-hidden');
    }

    toggle(force) {
        if (!force) this.hide();
        else this.show();
    }
}

class GradeTable {
    grades = [];
    identifier = {};
    date = null;
    #parentElement = null;
    element = null;

    constructor(grades = [], identifier = {}, parentElement = document.querySelector('#st-grades-container')) {
        this.grades = grades;
        this.identifier = identifier;
        this.#parentElement = parentElement;
    }

    draw() {
        const grades = this.grades;

        // const groupingVariable = syncedStorage['grade-col-grouping'] || 'KolomNummer';
        const groupingVariable = 'KolomNummer';

        const filteredGrades = grades.filter(g => g.CijferKolom?.Id);

        const sortedColumns = filteredGrades.sort((a, b) =>
            (a.CijferPeriode?.VolgNummer ?? 0) - (b.CijferPeriode?.VolgNummer ?? 0) ||
            Number(a.CijferKolom?.KolomVolgNummer ?? 0) - Number(b.CijferKolom?.KolomVolgNummer ?? 0)
        );
        const gradePeriods = [...new Set(sortedColumns.map(g => g.CijferPeriode?.Naam))];
        const gradeColumns = [...new Set(sortedColumns.map(g => g.CijferKolom?.[groupingVariable]))];
        const gradeSubjects = [...new Set(grades
            .slice()
            .sort((a, b) => (a.Vak?.Volgnr ?? 0) - (b.Vak?.Volgnr ?? 0))
            .map(g => g.Vak?.Omschrijving))];

        let detailsPopover = document.getElementById('st-grade-details-popover');
        if (!detailsPopover) {
            detailsPopover = createElement('div', document.body, { id: 'st-grade-details-popover', popover: 'auto' });
            const detailsPopoverTable = detailsPopover.createChildElement('table', { class: 'st-grade-details-table' });
            [].map((value, i) => {
                const tr = createElement('tr', detailsPopoverTable);
                const th = createElement('th', tr, { innerText: i18n(value) });
                const td = createElement('td', tr);
                return { th, td };
            });
        }

        if (!document.body.contains(this.#parentElement)) this.#parentElement = document.querySelector('#st-grades-container');

        // Create and store table element
        this.element = this.#parentElement.createChildElement('table', { class: 'st st-grade-table' });

        const headerRow1 = this.element.createChildElement('tr');
        headerRow1.createChildElement('th')
            .addEventListener('click', async () => {
                if (statisticsPane.isVisible) {
                    const subjectGrades = filteredGrades.filter(g => g.CijferKolom?.KolomSoort !== 2 && !syncedStorage['ignore-grade-columns'].includes(g.CijferKolom?.KolomKop || 'undefined'));
                    await statisticsPane.toggleMultipleGrades(subjectGrades);
                    statisticsPane.redraw();
                    return;
                }
            });
        for (const period of gradePeriods) {
            const numColumns = new Set(sortedColumns.filter(col => col.CijferPeriode?.Naam === period).map(g => g.CijferKolom?.[groupingVariable])).size;
            headerRow1.createChildElement('th', { innerText: period, colSpan: numColumns });
        }

        const headerRow2 = this.element.createChildElement('tr');
        headerRow2.createChildElement('th', { innerText: i18n('toggleAll') })
            .addEventListener('click', async () => {
                if (statisticsPane.isVisible) {
                    const subjectGrades = filteredGrades.filter(g => g.CijferKolom?.KolomSoort !== 2 && !syncedStorage['ignore-grade-columns'].includes(g.CijferKolom?.KolomKop || 'undefined'));
                    await statisticsPane.toggleMultipleGrades(subjectGrades);
                    statisticsPane.redraw();
                    return;
                }
            });
        for (const column of gradeColumns) {
            headerRow2.createChildElement('th')
                .createChildElement('span', { innerText: column });
        }

        for (const subject of gradeSubjects) {
            const subjectRow = this.element.createChildElement('tr');
            subjectRow.createChildElement('th', { innerText: subject })
                .addEventListener('click', async () => {
                    if (calculatorPane.isVisible) {
                        const subjectGrades = filteredGrades.filter(g => g.Vak?.Omschrijving === subject && g.CijferKolom?.KolomSoort !== 2 && !syncedStorage['ignore-grade-columns'].includes(g.CijferKolom?.KolomKop || 'undefined'));
                        await calculatorPane.toggleMultipleGrades(subjectGrades, this.identifier.year);
                        calculatorPane.redraw();
                        return;
                    }
                    if (statisticsPane.isVisible) {
                        const subjectGrades = filteredGrades.filter(g => g.Vak?.Omschrijving === subject && g.CijferKolom?.KolomSoort !== 2 && !syncedStorage['ignore-grade-columns'].includes(g.CijferKolom?.KolomKop || 'undefined'));
                        await statisticsPane.toggleMultipleGrades(subjectGrades);
                        statisticsPane.redraw();
                        return;
                    }
                });

            for (const column of gradeColumns) {
                let grade = filteredGrades.find(g => g.Vak?.Omschrijving === subject && g.CijferKolom?.[groupingVariable] === column);
                if (grade) {
                    const td = subjectRow.createChildElement('td', {
                        id: grade.CijferId,
                        innerText: grade.CijferStr,
                        classList: [
                            ['st-insufficient', grade.IsVoldoende === false],
                            ['inh', grade.Inhalen],
                            ['vr', grade.Vrijstelling],
                            ['not-counted', grade.TeltMee === false],
                            [`column-type-${grade.CijferKolom?.KolomSoort}`],
                            ['column-resit', grade.CijferKolom?.IsHerkansingKolom],
                            ['column-teacher', grade.CijferKolom?.IsDocentKolom],
                            ['column-underlying', grade.CijferKolom?.HeeftOnderliggendeKolommen],
                            ['column-pta', grade.CijferKolom?.IsPTAKolom],
                        ].filter(c => c[1] === true || (c.length === 1 && c[0])).map(c => c[0]),
                        title:
                            `${new Date(grade.DatumIngevoerd)?.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' }) || '?'}
${grade.CijferKolom?.KolomOmschrijving || '?'}
${grade.CijferKolom?.KolomNaam || '?'}, ${grade.CijferKolom?.KolomKop || '?'}

${grade.CijferStr || '?'} ${grade.CijferKolom?.Weging ? `(${grade.CijferKolom?.Weging}×)` : ''}

` + [
                                ['onvoldoende', grade.IsVoldoende === false],
                                ['inhalen', grade.Inhalen],
                                ['vrijstelling', grade.Vrijstelling],
                                ['telt niet mee', grade.TeltMee === false],
                                ['gemiddeldekolom', grade.CijferKolom?.KolomSoort === 2],
                                ['PTA-kolom', grade.CijferKolom?.IsPTAKolom],
                                ['docentkolom', grade.CijferKolom?.IsDocentKolom],
                                ['heeft herkansing', grade.CijferKolom?.IsHerkansingKolom],
                                ['heeft onderliggende kolommen', grade.CijferKolom?.HeeftOnderliggendeKolommen],
                            ].filter(c => c[1] === true || (c.length === 1 && c[0])).map(c => c[0]).join(', '),
                        popovertarget: 'st-grade-details-popover',
                    });
                    if (grade.CijferStr.length > 5 && isNaN(Number(grade.CijferStr.replace(',', '.')))) {
                        td.classList.add('non-numeric');
                        td.innerText = '';
                    }
                    td.addEventListener('click', async () => {
                        if (calculatorPane.isVisible) {
                            await calculatorPane.toggleGrade(grade, this.identifier.year);
                            calculatorPane.redraw();
                            return;
                        }
                        if (statisticsPane.isVisible) {
                            await statisticsPane.toggleGrade(grade);
                            statisticsPane.redraw();
                            return;
                        }
                        const dialog = new GradeDetailDialog(grade, this.identifier.year);
                        dialog.show();
                        grade = dialog.grade;
                    });
                    td.addEventListener('auxclick', event => {
                        event.preventDefault();
                        event.stopPropagation();
                        const dialog = new GradeDetailDialog(grade, this.identifier.year);
                        dialog.show();
                        grade = dialog.grade;
                    });
                } else {
                    subjectRow.createChildElement('td', { class: 'empty' });
                }
            }
        }

        if (!this.grades.length) {
            this.element.remove();
            this.element = this.#parentElement.createChildElement('p', {
                innerText: i18n('cl.emptyDesc'), colSpan: gradeColumns.length + 1, style: {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                }
            });
        }

        if (listPane.isVisible) listPane.redraw();
        if (backupPane.isVisible) backupPane.redraw();
        if (calculatorPane.isVisible) calculatorPane.redraw();
        if (statisticsPane.isVisible) statisticsPane.redraw();
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

class GradeDetailDialog extends Dialog {
    grade;
    year;
    #progressBar;

    constructor(grade, year) {
        super({
            buttons: [
                {
                    innerText: i18n('reveal'),
                    onclick: async () => {
                        if (!location.href.includes('#/cijfers')) window.location.href = '#/cijfers';
                        this.close();
                        let elem = await awaitElement(`td[id="${grade.CijferId}"]`);
                        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        elem.classList.add('st-highlight');
                        setTimeout(() => elem.classList.remove('st-highlight'), 3000);
                    },
                    primary: true,
                    'data-icon': ''
                }
            ]
        });
        this.body.classList.add('st-grade-detail-dialog');

        this.grade = grade;
        if (year) this.year = year;

        this.#progressBar = createElement('div', this.element, { class: 'st-progress-bar' })
        createElement('div', this.#progressBar, { class: 'st-progress-bar-value indeterminate' })

        this.#drawDialogContents();
    }

    async #drawDialogContents() {
        this.body.innerText = '';

        if (!this.grade?.CijferKolom) {
            this.body.innerText = i18n('unknown');
            return;
        }

        const column1 = createElement('div', this.body, { class: 'st-grade-detail-dialog-column' });
        createElement('h3', column1, { class: 'st-section-heading', innerText: this.grade.CijferKolom.KolomOmschrijving || i18n('details') });

        const gradeItem = new GradeListItem(column1, {
            subject: this.grade.Vak?.Omschrijving,
            title: this.grade.CijferKolom.WerkInformatieOmschrijving || this.grade.CijferKolom.KolomOmschrijving,
            date: this.grade.DatumIngevoerd,
            result: this.grade.CijferStr,
            isSufficient: this.grade.IsVoldoende,
            weight: this.grade.CijferKolom?.Weging,
        });
        gradeItem.element.style.fontSize = '12.5px';

        let table1 = createElement('table', column1, { class: 'st' });

        this.#addRowToTable(table1, i18n('column'), this.grade.CijferKolom.KolomKop ? `${this.grade.CijferKolom.KolomKop} (${this.grade.CijferKolom.KolomNaam})` : this.grade.CijferKolom.KolomNaam);
        this.#addRowToTable(table1, i18n('description'), this.grade.CijferKolom.KolomOmschrijving || '-');
        this.#addRowToTable(table1, i18n('level'), this.grade.CijferKolom.KolomNiveau || '-');
        this.#addRowToTable(table1, i18n('weight'), this.grade.CijferKolom.Weging >= 0 ? `${this.grade.CijferKolom.Weging}x` : '-');
        this.#addRowToTable(table1, i18n('assessment'), this.grade.CijferStr || '-');
        const showYear = isYearNotCurrent(new Date(this.grade.DatumIngevoerd)) || isYearNotCurrent(new Date(this.grade.CijferKolom.WerkinformatieDatumIngevoerd));
        this.#addRowToTable(table1, i18n('entered'),
            ((this.grade.DatumIngevoerd && new Date(this.grade.DatumIngevoerd).getTime() > 0)
                ? new Date(this.grade.DatumIngevoerd).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', year: showYear ? 'numeric' : undefined })
                : '') + (this.grade.IngevoerdDoor ? ` ${i18n('by')} ${this.grade.IngevoerdDoor}` : '')
        );
        this.#addRowToTable(table1, i18n('taken'),
            (this.grade.CijferKolom.WerkinformatieDatumIngevoerd && new Date(this.grade.CijferKolom.WerkinformatieDatumIngevoerd).getTime() > 0)
                ? new Date(this.grade.CijferKolom.WerkinformatieDatumIngevoerd).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', year: showYear ? 'numeric' : undefined })
                : '-'
        );
        this.#addRowToTable(table1, i18n('productDescription'), this.grade.CijferKolom.WerkInformatieOmschrijving || '-');
        this.#addRowToTable(table1, i18n('teacher'), this.grade.Docent || '-');
        this.#addRowToTable(table1, i18n('subject'), this.grade.Vak?.Omschrijving || '-');
        this.#addRowToTable(table1, i18n('period'), this.grade.CijferPeriode?.Naam || '-');

        if (this.grade.CijferKolom.Weging == null && this.year) {
            const gradeColumnInfo = await magisterApi.gradesColumnInfo(this.year, this.grade.CijferKolom.Id);

            this.grade = {
                ...this.grade,
                CijferKolom: { ...this.grade.CijferKolom, ...gradeColumnInfo }
            }

            this.#drawDialogContents();
            return;
        }

        const relatedColumns = (await magisterApi.gradesRelatedColumns(this.grade.CijferKolom.Id)).filter(rc => rc.Kolomnaam !== this.grade.CijferKolom.KolomNaam);
        if (relatedColumns?.length > 0) {
            const column2 = createElement('div', this.body, { class: 'st-grade-detail-dialog-column' });
            createElement('h3', column2, { class: 'st-section-heading', innerText: i18n('calculation') });

            for (const relatedColumn of relatedColumns) {

                let relatedGrade = currentGradeTable.grades.find(g => g.CijferKolom?.KolomNaam === relatedColumn.Kolomnaam);
                const relatedGradeColumnInfo = await magisterApi.gradesColumnInfo(this.year, relatedGrade.CijferKolom.Id);

                relatedGrade = {
                    ...relatedGrade,
                    CijferKolom: {
                        ...relatedGrade?.CijferKolom,
                        ...relatedGradeColumnInfo,
                    }
                };

                const relatedGradeItem = new GradeListItem(column2, {
                    subject: relatedGrade.Vak?.Omschrijving,
                    title: relatedGrade.CijferKolom.WerkInformatieOmschrijving || relatedGrade.CijferKolom.KolomOmschrijving || relatedColumn.Kolomkop,
                    date: relatedGrade.DatumIngevoerd,
                    result: relatedColumn.Cijfer,
                    isSufficient: relatedColumn.IsVoldoende,
                    weight: relatedColumn.Weegfactor,
                });
                relatedGradeItem.element.style.fontSize = '11px';
                relatedGradeItem.element.classList.add('st-clickable');
                relatedGradeItem.element.addEventListener('click', () => {
                    if (!relatedGrade) return;
                    const dialog = new GradeDetailDialog(relatedGrade, this.year);
                    dialog.show();
                    dialog.closeCallback = () => {
                        this.close();
                    }
                });
            }
        }

        this.#progressBar.dataset.visible = 'false';
    }

    #addRowToTable(parentElement, label, value) {
        let row = createElement('tr', parentElement);
        createElement('td', row, { innerText: label || '' });
        return createElement('td', row, { innerText: value || '' });
    }
}

class GradeListItem {
    element;

    /**
     * @param {HTMLDivElement} parentElement
     * @param {{ subject: string; title: string; date: string|Date; result: string; isSufficient: boolean; weight: string; }} grade
     */
    constructor(parentElement, grade) {
        this.element = parentElement.createChildElement('li', { class: 'st-grade-list-item' });

        const col1 = this.element.createChildElement('div')
        if (grade.subject) col1.createChildElement('div', { class: 'st-subject', innerText: grade.subject || '-' })
        if (grade.title) col1.createChildElement('div', { innerText: grade.title || '-' })
        if (grade.date) col1.createChildElement('div', { innerText: makeTimestamp(grade.date) });

        const col2 = this.element.createChildElement('div')

        if (String(grade.result).length > 5 && isNaN(Number(grade.result.replace(',', '.')))) {
            col2.createChildElement('div', { innerText: '', classList: grade.isSufficient === false ? ['non-numeric', 'st-insufficient'] : ['non-numeric'] })
        } else {
            col2.createChildElement('div', { innerText: grade.result, classList: grade.isSufficient === false ? ['st-insufficient'] : [] })
        }
        if (grade.weight) col2.createChildElement('div', { innerText: grade.weight + 'x' });
    }
}