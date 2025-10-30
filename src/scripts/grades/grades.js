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

    saveToStorage('viewedGrades', new Date().getTime(), 'local')
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
    const yearFilter = toolbar.createChildElement('div', { id: 'st-grades-year-filter', class: 'st-horizontal-icon-radio' });
    const tools = toolbar.createChildElement('div', { class: 'st-horizontal-icon-radio' });

    const progressBar = gradeContainer.createChildElement('div', { class: 'st-progress-bar' });
    progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

    backupPane = new GradeBackupPane(mainSection);
    statisticsPane = new GradeStatisticsPane(mainSection);
    calculatorPane = new GradeCalculatorPane(mainSection);

    const cbLabel = tools.createChildElement('label', { id: 'st-grade-backup-button', class: 'st-checkbox-label icon', title: i18n('cb.title'), innerText: '' });
    const cbInput = cbLabel.createChildElement('input', { id: 'st-grade-backup-input', class: 'st-checkbox-input', type: 'checkbox' });
    cbInput.addEventListener('change', () => {
        backupPane.toggle(cbInput.checked);
        // close other panes
        if (csInput.checked) csInput.click();
        if (ccInput.checked) ccInput.click();
        contentContainer.style.borderBottomRightRadius = cbInput.checked ? '0' : 'var(--st-border-radius)';
    });

    const csLabel = tools.createChildElement('label', { id: 'st-grade-statistics-button', class: 'st-checkbox-label icon', title: i18n('cs.title'), innerText: '' })
    const csInput = csLabel.createChildElement('input', { id: 'st-grade-statistics-input', class: 'st-checkbox-input', type: 'checkbox' })
    csInput.addEventListener('change', () => {
        statisticsPane.toggle(csInput.checked);
        // close other panes
        if (ccInput.checked) ccInput.click();
        if (cbInput.checked) cbInput.click();
        contentContainer.style.borderBottomRightRadius = csInput.checked ? '0' : 'var(--st-border-radius)';
    });

    const ccLabel = tools.createChildElement('label', { id: 'st-grade-calculator-button', class: 'st-checkbox-label icon', title: i18n('cc.title'), innerText: '' })
    const ccInput = ccLabel.createChildElement('input', { id: 'st-grade-calculator-input', class: 'st-checkbox-input', type: 'checkbox' })
    ccInput.addEventListener('change', () => {
        calculatorPane.toggle(ccInput.checked);
        // close other panes
        if (csInput.checked) csInput.click();
        if (cbInput.checked) cbInput.click();
        contentContainer.style.borderBottomRightRadius = ccInput.checked ? '0' : 'var(--st-border-radius)';
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
    #table = null;

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

        // Create and store table element
        this.#table = this.#parentElement.createChildElement('table', { class: 'st st-grade-table' });

        const headerRow1 = this.#table.createChildElement('tr');
        headerRow1.createChildElement('th');
        for (const period of gradePeriods) {
            const numColumns = new Set(sortedColumns.filter(col => col.CijferPeriode?.Naam === period).map(g => g.CijferKolom?.[groupingVariable])).size;
            headerRow1.createChildElement('th', { innerText: period, colSpan: numColumns });
        }

        const headerRow2 = this.#table.createChildElement('tr');
        headerRow2.createChildElement('th');
        for (const column of gradeColumns) {
            headerRow2.createChildElement('th')
                .createChildElement('span', { innerText: column });
        }

        for (const subject of gradeSubjects) {
            const subjectRow = this.#table.createChildElement('tr');
            subjectRow.createChildElement('th', { innerText: subject })
                .addEventListener('click', () => {
                    if (calculatorPane.isVisible) {
                        const subjectGrades = filteredGrades.filter(g => g.Vak?.Omschrijving === subject && g.CijferKolom?.KolomSoort !== 2);
                        for (const grade of subjectGrades) {
                            calculatorPane.toggleGrade(grade, this.identifier.year);
                        }
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
                    td.addEventListener('click', () => {
                        if (calculatorPane.isVisible) {
                            calculatorPane.toggleGrade(grade, this.identifier.year);
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
    }

    destroy() {
        if (this.#table) {
            this.#table.remove();
            this.#table = null;
        }
    }
}

// Grade statistics
async function gradeStatistics() {
    const aside = await awaitElement('#cijfers-container > aside'),
        asideContent = await awaitElement('#cijfers-container > aside > .content-container'),
        tabs = await awaitElement('#cijfers-container > aside > div.head-bar > ul'),
        scTab = element('li', 'st-cs-tab', tabs, { class: 'st-tab asideTrigger' }),
        scTabLink = element('a', 'st-cs-tab-link', scTab, { innerText: i18n('cs.title') })

    const scContainer = element('div', 'st-cs', aside, { class: 'st-sheet', 'data-visible': 'false' }),
        scFilterButton = element('button', 'st-cs-filter-button', scContainer, { class: 'st-button icon primary', 'data-icon': '', title: "Leerjaren en vakken selecteren" }),
        scFilterButtonTooltip = element('div', 'st-cs-filter-button-tooltip', scContainer, { innerText: "Selecteer hier welke vakken en leerjaren worden getoond!" })

    const scStats = element('div', 'st-cs-stats', scContainer),
        scStatsHeading = element('span', 'st-cs-stats-heading', scStats, { innerText: i18n('cs.title'), 'data-amount': 0 }),
        scStatsInfo = element('span', 'st-cs-stats-info', scStats, { innerText: "Laden..." })

    const scCentralTendencies = element('div', 'st-cs-central-tendencies', scStats),
        scWeightedMean = element('div', 'st-cs-weighted-mean', scCentralTendencies, { class: 'st-metric', 'data-description': "Gemiddelde", title: "De gemiddelde waarde met weegfactoren." }),
        scUnweightedMean = element('div', 'st-cs-unweighted-mean', scCentralTendencies, { class: 'st-metric', 'data-description': "Ongewogen gemiddelde", title: "De gemiddelde waarde, zonder weegfactoren." }),
        scMedian = element('div', 'st-cs-median', scCentralTendencies, { class: 'st-metric secondary', 'data-description': "Mediaan", title: "De middelste waarde, wanneer je alle cijfers van laag naar hoog op een rijtje zou zetten.\nBij een even aantal waarden: het gemiddelde van de twee middelste waarden." }),
        scMode = element('div', 'st-cs-mode', scCentralTendencies, { class: 'st-metric secondary', 'data-description': "Modus", title: "De waarde die het meest voorkomt." })

    const scSufInsuf = element('div', 'st-cs-suf-insuf', scStats),
        scSufficient = element('div', 'st-cs-sufficient', scSufInsuf, { class: 'st-metric secondary', 'data-description': "Voldoendes", title: "Het aantal cijfers hoger dan of gelijk aan de voldoendegrens." }),
        scSufInsufChart = element('div', 'st-cs-suf-insuf-chart', scSufInsuf, { class: 'donut', title: "Het percentage cijfers hoger dan of gelijk aan de voldoendegrens." }),
        scInsufficient = element('div', 'st-cs-insufficient', scSufInsuf, { class: 'st-metric secondary', 'data-description': "Onvoldoendes", title: "Het aantal cijfers lager dan de voldoendegrens." }),
        scSufInsufDisclaimer = element('div', 'st-cs-suf-insuf-disclaimer', scSufInsuf, { innerText: `Voldoende: ≥ ${Number(syncedStorage['suf-threshold']).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` })

    const scRoundedHeading = element('span', 'st-cs-rounded-heading', scStats, { class: 'st-section-heading', innerText: "Afgerond behaalde cijfers" }),
        scRoundedChart = element('div', 'st-cs-rounded-chart', scStats)

    const scHistory = element('div', 'st-cs-history', scStats),
        scHistoryHeading = element('span', 'st-cs-history-heading', scHistory, { class: 'st-section-heading', innerText: "Behaalde cijfers" }),
        scMin = element('div', 'st-cs-min', scHistory, { class: 'st-metric secondary', 'data-description': "Laagste cijfer", title: "Het laagst behaalde cijfer." }),
        scMax = element('div', 'st-cs-max', scHistory, { class: 'st-metric secondary', 'data-description': "Hoogste cijfer", title: "Het hoogst behaalde cijfer." }),
        scVariance = element('div', 'st-cs-variance', scHistory, { class: 'st-metric secondary', 'data-description': "Variantie", title: "De gemiddelde afwijking van alle meetwaarden tot de gemiddelde waarde." }),
        scLineChart = element('div', 'st-cs-history-chart', scHistory, { style: `--suf-threshold-p: ${(1 - ((Number(syncedStorage['suf-threshold']) - 1) / 9)) * 100}%` })

    const scFilters = element('div', 'st-cs-filters', scContainer),
        scFiltersHeading = element('span', 'st-cs-filters-heading', scFilters, { innerText: i18n('cs.filters') }),
        scYearFilterHeading = element('span', 'st-cs-year-filter-heading', scFilters, { innerText: i18n('cs.years') }),
        scYearFilter = element('div', 'st-cs-year-filter', scFilters),
        scSubjectFilterAll = element('button', 'st-cs-subject-filter-all', scFilters, { class: 'st-button icon', 'data-icon': '', title: "Selectie omkeren" }),
        scSubjectFilter = element('div', 'st-cs-subject-filter', scFilters)

    let years = [],
        gatheredYears = new Set(),
        includedYears = new Set(),
        subjects = new Set(),
        excludedSubjects = new Set()


    tabs.addEventListener('click', (event) => {
        let scTabClicked = event.target.id.startsWith('st-cs-tab')
        if (scTabClicked) {
            scTab.classList.add('active')
            scContainer.dataset.visible = true
            asideContent.style.display = 'none'
        } else {
            scTab.classList.remove('active')
            scContainer.dataset.visible = false
            if (!tabs.querySelector('.st-tab.active')) asideContent.style.display = ''
        }
    })

    scFilterButton.addEventListener('click', () => {
        scFilterButtonTooltip.classList.add('hidden')
        if ((scContainer.dataset.filters == 'true')) {
            scContainer.dataset.filters = false
        } else {
            scContainer.dataset.filters = true
        }
    })

    scSubjectFilterAll.addEventListener('click', () => {
        [...scSubjectFilter.children].forEach(e => e.click())
    })

    // Gather all years and populate the year filter
    years = (await magisterApi.years()).sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())
    years.forEach(async (year, i, a) => {
        let label = element('label', `st-cs-year-${year.id}-label`, scYearFilter, { class: 'st-checkbox-label', for: `st-cs-year-${year.id}`, innerText: year.studie.code.match(/\d/gi)?.[0], title: `${year.groep.omschrijving || year.groep.code} (${year.studie.code} in ${year.lesperiode.code})` })
        if (!(label.innerText?.length > 0)) label.innerText = i + 1
        let input = element('input', `st-cs-year-${year.id}`, label, { class: 'st-checkbox-input', type: 'checkbox' })


        if (i === a.length - 1) {
            input.checked = true
            let yearGrades = (await magisterApi.gradesForYear(year))
                .filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.'))) && (Number(grade.CijferStr.replace(',', '.')) <= 10) && (Number(grade.CijferStr.replace(',', '.')) >= 1))
                .filter((grade, index, self) =>
                    index === self.findIndex((g) =>
                        g.CijferKolom.KolomKop === grade.CijferKolom.KolomKop &&
                        g.CijferKolom.KolomNaam === grade.CijferKolom.KolomNaam &&
                        g.CijferStr === grade.CijferStr
                    )
                )
                .sort((a, b) => new Date(a.DatumIngevoerd).getTime() - new Date(b.DatumIngevoerd).getTime())
            statsGrades.push(...yearGrades.filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.')))).map(e => ({ ...e, result: Number(e.CijferStr.replace(',', '.')), year: year.id })))

            let yearSubjects = statsGrades.filter(e => e.year === year.id).map(e => e.Vak.Omschrijving)
            subjects = new Set([...subjects, ...yearSubjects])

            gatheredYears.add(year.id)
            includedYears.add(year.id)

            buildSubjectFilter()
            displayStatistics()
        }

        label.addEventListener('contextmenu', (event) => {
            event.preventDefault()
            scYearFilter.querySelectorAll('input').forEach(child => {
                if (child.checked) child.click()
            })
            input.click()
        })

        input.addEventListener('input', async () => {
            if (!gatheredYears.has(year.id)) {
                let yearGrades = (await magisterApi.gradesForYear(year))
                statsGrades.push(...yearGrades.filter(grade => grade.CijferKolom.KolomSoort == 1 && !isNaN(Number(grade.CijferStr.replace(',', '.')))).map(e => ({ ...e, result: Number(e.CijferStr.replace(',', '.')), year: year.id })))

                gatheredYears.add(year.id)
            }

            input.checked ? includedYears.add(year.id) : includedYears.delete(year.id)

            let yearSubjects = statsGrades.filter(e => e.year === year.id).map(e => e.Vak.Omschrijving)
            subjects = new Set([...subjects, ...yearSubjects])

            buildSubjectFilter()
            displayStatistics()
        })
    })

    function buildSubjectFilter() {
        scSubjectFilter.innerText = ''

        subjects = new Set([...subjects]
            .filter(subject => statsGrades.filter(e => includedYears.has(e.year)).find(e => e.Vak.Omschrijving === subject))
            .sort((a, b) => a.localeCompare(b, locale, { sensitivity: 'base' })))

        let subjectsArray = [...subjects]
        subjectsArray.forEach(subjectName => {
            let label = element('label', `st-cs-subject-${subjectName}-label`, scSubjectFilter, { class: 'st-checkbox-label', for: `st-cs-subject-${subjectName}`, innerText: subjectName })
            let input = element('input', `st-cs-subject-${subjectName}`, label, { class: 'st-checkbox-input', type: 'checkbox' })
            input.checked = !excludedSubjects.has(subjectName)

            input.addEventListener('input', async () => {
                excludedSubjects.has(subjectName) ? excludedSubjects.delete(subjectName) : excludedSubjects.add(subjectName)
                displayStatistics()
            })

            label.addEventListener('contextmenu', (event) => {
                event.preventDefault()
                scSubjectFilter.querySelectorAll('input').forEach(child => {
                    if (child.checked) child.click()
                })
                input.click()
            })
        })

        let excludedSubjectsArray = [...excludedSubjects]
        excludedSubjects = new Set(excludedSubjectsArray.filter(e => subjects.has(e)))
    }

    function filterGrades() {
        const filtered = statsGrades
            // Remove grades that don't match filter
            .filter(e =>
                includedYears.has(e.year) &&
                !excludedSubjects.has(e.Vak.Omschrijving)
            )
            // Remove any duplicates (based on column num, column name and result)
            .filter((grade, index, self) =>
                index === self.findIndex((g) =>
                    g.CijferKolom.KolomKop === grade.CijferKolom.KolomKop &&
                    g.CijferKolom.KolomNaam === grade.CijferKolom.KolomNaam &&
                    g.CijferStr === grade.CijferStr
                )
            )
            // Sort from old to new
            .sort((a, b) => new Date(a.DatumIngevoerd).getTime() - new Date(b.DatumIngevoerd).getTime())
        return filtered
    }

    displayStatistics = async (fromBackup = false) => {
        return new Promise(async (resolve, reject) => {
            scContainer.classList.remove('empty')
            scContainer.classList.remove('with-weights')
            scUnweightedMean.classList.remove('secondary')

            let includedSubjects = [...subjects]
                .filter(subject => !excludedSubjects.has(subject))
                .sort((a, b) => a.localeCompare(b, locale, { sensitivity: 'base' }))

            let filteredGrades = []

            if (fromBackup) {
                filteredGrades = statsGrades
                    .filter(grade => !isNaN(grade.result) && grade.weight > 0 && grade.className !== 'grade gemiddeldecolumn' && grade.result >= 1 && grade.result <= 10)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                scStatsHeading.dataset.amount = filteredGrades.length

                scStatsInfo.innerText = "Statistieken kunnen in Magister niet cor-\nrect worden weergegeven voor back-ups."
            } else {
                filteredGrades = filterGrades()
                scStatsHeading.dataset.amount = filteredGrades.length

                let yearsText = new Intl.ListFormat(locale, {
                    style: 'short',
                    type: 'conjunction',
                }).format(
                    [...includedYears]
                        .sort((idA, idB) => new Date(years.find(y => y.id === idA).begin).getTime() - new Date(years.find(y => y.id === idB).begin).getTime())
                        .map(id => years.find(y => y.id === id).studie.code)
                )
                if (includedYears.size === 1 && includedYears.has(years.at(-1).id)) yearsText = `Dit leerjaar (${years.at(-1)?.studie?.code})`
                else if (includedYears.size === years.length) yearsText = `Alle ${years.length} leerjaren (${years.at(-1)?.studie?.code} t/m ${years.at(0)?.studie?.code})`

                let subjectsText = includedSubjects.join(', ')
                if (includedSubjects.length > 3) subjectsText = `${includedSubjects.length} van de ${subjects.size} vakken`
                if (excludedSubjects.size === 1) subjectsText = `Alle ${subjects.size} vakken behalve ${[...excludedSubjects][0]}`
                if (excludedSubjects.size === 0) subjectsText = `Alle ${subjects.size} vakken`

                scStatsInfo.innerText = [yearsText, subjectsText].join('\n')
            }


            if (filteredGrades.length < 1) {
                scContainer.dataset.filters = true
                scContainer.classList.add('empty')
                return
            }

            let filteredResults = filteredGrades.map(grade => grade.result),
                roundedFrequencies = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }

            filteredResults.forEach(result => roundedFrequencies[Math.round(result)]++)


            let unweightedMean = calculateMean(filteredResults)
            scUnweightedMean.innerText = unweightedMean.toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })

            scCentralTendencies.dataset.great = unweightedMean >= 7.0 ? true : false

            let median = calculateMedian(filteredResults)
            scMedian.innerText = median.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

            let { modes, occurrences } = calculateMode(filteredResults)
            scMode.innerText = modes.map(e => e.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })).join(' & ')
            scMode.dataset.extra = occurrences + '×'
            scMode.dataset.description = modes.length <= 1 ? "Modus" : "Modi"
            if (scMode.innerText.length < 1) {
                scMode.innerText = "geen"
                scMode.removeAttribute('data-extra')
            }

            let variance = calculateVariance(filteredResults)
            scVariance.innerText = variance.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

            let minResult = Math.min(...filteredResults)
            scMin.innerText = minResult.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
            scMin.dataset.extra = filteredResults.filter(result => result === minResult).length + '×'

            let maxResult = Math.max(...filteredResults)
            scMax.innerText = maxResult.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
            scMax.dataset.extra = filteredResults.filter(result => result === maxResult).length + '×'

            let resultsSufficient = filteredResults.filter((e) => { return e >= Number(syncedStorage['suf-threshold']) })
            scSufficient.innerText = resultsSufficient.length

            let resultsInsufficient = filteredResults.filter((e) => { return e < Number(syncedStorage['suf-threshold']) })
            scInsufficient.innerText = resultsInsufficient.length
            scInsufficient.dataset.has = resultsInsufficient.length > 0

            scRoundedChart.createBarChart(roundedFrequencies, null, 0, false, false)

            scSufInsufChart.style.backgroundImage = `
            url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='90%25' height='90%25' x='3.75' y='3.75' fill='none' rx='100' ry='100' stroke='${getComputedStyle(document.body).getPropertyValue('--st-accent-warn').replace('#', '%23')}' stroke-width='7' stroke-dasharray='${(resultsInsufficient.length / filteredResults.length) * 278}%25%2c 10000%25' stroke-dashoffset='0'/%3e%3c/svg%3e"),
            url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='90%25' height='90%25' x='3.75' y='3.75' fill='none' rx='100' ry='100' stroke='${getComputedStyle(document.body).getPropertyValue('--st-accent-primary').replace('#', '%23')}' stroke-width='6.9'/%3e%3c/svg%3e")`
            scSufInsufChart.dataset.percentage = `${(resultsSufficient.length / filteredResults.length * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`

            scLineChart.createLineChart(filteredResults, filteredGrades.map(e => `${new Date(e.DatumIngevoerd || e.date).toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' })}\n${e.Vak?.Omschrijving || ''}\n${e.CijferKolom?.KolomNaam || e.column}, ${e.CijferKolom?.KolomKop || e.title || 'cijfer'}\n`), 1, 10)
            // TODO: also incorporate mean and (if subject selected) weighted mean (requires fetching every grade!)

            resolve()

            // Add weighted stats afterwards in case there's only one subject and year selected
            if (!fromBackup && includedYears.size === 1 && includedSubjects.length === 1) {
                for (const e of filteredGrades) {
                    e.weight ??= (await magisterApi.gradesColumnInfo({ id: [...includedYears][0] }, e.CijferKolom.Id)).Weging
                    statsGrades[statsGrades.findIndex(f => f.CijferKolom.Id === e.CijferKolom.Id)].weight ??= e.weight
                }

                if (!filteredGrades.every(grade => grade.weight) || !filteredGrades.some(grade => grade.weight > 0)) return

                scWeightedMean.innerText = calculateMean(
                    filteredGrades
                        .filter(grade => grade.weight > 0)
                        .map(grade => grade.result),
                    filteredGrades
                        .filter(grade => grade.weight > 0)
                        .map(grade => grade.weight)
                ).toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })


                scContainer.classList.add('with-weights')
                scUnweightedMean.classList.add('secondary')
            }
        })
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