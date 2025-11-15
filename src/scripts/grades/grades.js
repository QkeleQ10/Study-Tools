class Pane {
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

let statsGrades = [],
    gradeTables = [],
    currentGradeTable = null,
    displayStatistics

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.includes('cijfers')) {
        if (document.location.href.includes('cijferoverzicht')) {
            gradeOverview()
        } else {
            gradeList()
        }
    }
}

async function gradeList() {
    await awaitElement('#cijferslaatstbehaalderesultaten-uitgebreideweergave')

    saveToStorage('viewedGrades', new Date().getTime(), 'local') // TODO: implement this in the overview as well, with a nice animation
}

let backupPane, statisticsPane, calculatorPane;

async function gradeOverview() {
    if (!syncedStorage['cc']) return;

    const contentContainer = await awaitElement('section.main>div');
    const mainSection = contentContainer.parentElement;
    const gradeContainer = mainSection.parentElement;

    mainSection.setAttribute('style', 'display: grid; grid-template-rows: auto 1fr; grid-template-columns: 1fr auto; padding-bottom: 0 !important;');
    contentContainer.setAttribute('style', 'grid-column: 1; grid-row: 2; border-top-left-radius: 0; border-top-right-radius: 0;');
    gradeContainer.style.paddingRight = '20px';
    (await awaitElement('aside')).style.display = 'none';
    contentContainer.querySelectorAll('*').forEach(child => { child.style.display = 'none'; });

    const toolbar = contentContainer.createSiblingElement('div', { id: 'st-grades-toolbar' });
    const yearFilter = toolbar.createChildElement('div', { id: 'st-grades-year-filter', class: 'st-horizontal-icon-radio st-tabs' });
    const tools = toolbar.createChildElement('div', { class: 'st-horizontal-icon-radio st-tabs' });

    const progressBar = gradeContainer.createChildElement('div', { class: 'st-progress-bar' });
    progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

    const panesContainer = mainSection.createChildElement('div', { class: 'st-panes-container st-hidden' });

    backupPane = new GradeBackupPane(panesContainer);
    statisticsPane = new GradeStatisticsPane(panesContainer);
    calculatorPane = new GradeCalculatorPane(panesContainer);

    let panesVisible = () => backupPane.isVisible || statisticsPane.isVisible || calculatorPane.isVisible;

    const cbLabel = tools.createChildElement('label', { id: 'st-grade-backup-button', class: 'st-checkbox-label icon', title: i18n('cb.title'), innerText: '' });
    const cbInput = cbLabel.createChildElement('input', { id: 'st-grade-backup-input', class: 'st-checkbox-input', type: 'checkbox' });
    cbInput.addEventListener('change', () => {
        backupPane.toggle(cbInput.checked);
        // close other panes
        if (csInput.checked) csInput.click();
        if (ccInput.checked) ccInput.click();
        panesContainer.classList.toggle('st-hidden', !panesVisible());
        contentContainer.style.borderRight = panesVisible() ? 'none' : '';
        contentContainer.style.borderBottomRightRadius = panesVisible() ? '0' : '';
    });

    const csLabel = tools.createChildElement('label', { id: 'st-grade-statistics-button', class: 'st-checkbox-label icon', title: i18n('cs.title'), innerText: '' })
    const csInput = csLabel.createChildElement('input', { id: 'st-grade-statistics-input', class: 'st-checkbox-input', type: 'checkbox' })
    csInput.addEventListener('change', () => {
        statisticsPane.toggle(csInput.checked);
        // close other panes
        if (ccInput.checked) ccInput.click();
        if (cbInput.checked) cbInput.click();
        panesContainer.classList.toggle('st-hidden', !panesVisible());
        contentContainer.style.borderRight = panesVisible() ? 'none' : '';
        contentContainer.style.borderBottomRightRadius = panesVisible() ? '0' : '';
    });

    const ccLabel = tools.createChildElement('label', { id: 'st-grade-calculator-button', class: 'st-checkbox-label icon', title: i18n('cc.title'), innerText: '' })
    const ccInput = ccLabel.createChildElement('input', { id: 'st-grade-calculator-input', class: 'st-checkbox-input', type: 'checkbox' })
    ccInput.addEventListener('change', () => {
        calculatorPane.toggle(ccInput.checked);
        // close other panes
        if (csInput.checked) csInput.click();
        if (cbInput.checked) cbInput.click();
        panesContainer.classList.toggle('st-hidden', !panesVisible());
        contentContainer.style.borderRight = panesVisible() ? 'none' : '';
        contentContainer.style.borderBottomRightRadius = panesVisible() ? '0' : '';
    });

    const years = (await magisterApi.years()).sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime());

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

class GradeTable {
    grades = [];
    identifier = {};
    date = null;
    #parentElement = null;
    element = null;

    constructor(grades = [], identifier = {}, parentElement = document.querySelector('section.main>div')) {
        this.grades = grades;
        this.identifier = identifier;
        this.#parentElement = parentElement;
    }

    draw() {
        const grades = this.grades;

        const groupingVariable = syncedStorage['grade-col-grouping'] || 'KolomNummer';

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

        if (!document.body.contains(this.#parentElement)) this.#parentElement = document.querySelector('section.main>div');

        // Create and store table element
        this.element = this.#parentElement.createChildElement('table', { class: 'st st-grade-table' });

        const headerRow1 = this.element.createChildElement('tr');
        headerRow1.createChildElement('th')
            .addEventListener('click', async () => {
                if (statisticsPane.isVisible) {
                    const subjectGrades = filteredGrades.filter(g => g.CijferKolom?.KolomSoort !== 2);
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
                    const subjectGrades = filteredGrades.filter(g => g.CijferKolom?.KolomSoort !== 2);
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
                        const subjectGrades = filteredGrades.filter(g => g.Vak?.Omschrijving === subject && g.CijferKolom?.KolomSoort !== 2);
                        await calculatorPane.toggleMultipleGrades(subjectGrades, this.identifier.year);
                        calculatorPane.redraw();
                        return;
                    }
                    if (statisticsPane.isVisible) {
                        const subjectGrades = filteredGrades.filter(g => g.Vak?.Omschrijving === subject && g.CijferKolom?.KolomSoort !== 2);
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
                            ['insufficient', grade.IsVoldoende === false],
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
                                ['docentenkolom', grade.CijferKolom?.IsDocentKolom],
                                ['heeft herkansing', grade.CijferKolom?.IsHerkansingKolom],
                                ['heeft onderliggende kolommen', grade.CijferKolom?.HeeftOnderliggendeKolommen],
                            ].filter(c => c[1] === true || (c.length === 1 && c[0])).map(c => c[0]).join(', '),
                        popovertarget: 'st-grade-details-popover',
                    });
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
        super();
        this.body.classList.add('st-grade-detail-dialog');

        this.grade = grade;
        if (year) this.year = year;

        this.#progressBar = createElement('div', this.element, { class: 'st-progress-bar' })
        createElement('div', this.#progressBar, { class: 'st-progress-bar-value indeterminate' })

        this.#drawDialogContents();
    }

    async #drawDialogContents() {
        this.body.innerText = '';

        const column1 = createElement('div', this.body, { class: 'st-grade-detail-dialog-column' });
        createElement('h3', column1, { class: 'st-section-heading', innerText: this.grade.CijferKolom.KolomOmschrijving || i18n('details') });

        const metricsStrip = createElement('div', column1, { style: 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;' });

        if (this.grade.CijferStr.length < 5)
            createElement('div', metricsStrip, { class: 'st-metric', innerText: this.grade.CijferStr || '-', dataset: { description: i18n('assessment') }, style: syncedStorage['insufficient'] !== 'off' && this.grade.IsVoldoende === false ? 'color: var(--st-accent-warn)' : '' });
        if (this.grade.CijferKolom?.Weging >= 0)
            createElement('div', metricsStrip, { class: 'st-metric', innerText: `${this.grade.CijferKolom.Weging}x`, dataset: { description: i18n('weight') } });

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
        }

        this.#progressBar.dataset.visible = 'false';
    }

    #addRowToTable(parentElement, label, value) {
        let row = createElement('tr', parentElement);
        createElement('td', row, { innerText: label || '' });
        return createElement('td', row, { innerText: value || '' });
    }
}