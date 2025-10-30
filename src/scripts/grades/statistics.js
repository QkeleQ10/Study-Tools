class GradeStatisticsPane extends Pane {
    #div1;
    #initialised = false;
    includedTables = new Set();
    excludedSubjects = new Set();

    constructor(parentElement) {
        super(parentElement);
        this.element.id = 'st-grade-statistics-pane';

        this.element.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cs.title') });
        this.#div1 = this.element.createChildElement('div', { class: 'st-div' });
    }

    show() {
        if (!this.#initialised) this.#initialise();
        super.show();
    }

    async #initialise() {
        this.progressBar.dataset.visible = 'true';

        // initialisation here

        const filtersButton = this.element.createChildElement('button', { class: 'st-button icon', 'data-icon': '', title: i18n('cs.filters'), style: { position: 'absolute', top: '12px', right: '12px' } });
        filtersButton.addEventListener('click', async () => {
            const dialog = new Dialog();
            dialog.body.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cs.filters') });

            const yearFilter = dialog.body.createChildElement('div', { id: 'st-cs-year-filter', class: 'st-horizontal-icon-radio' });

            const years = (await magisterApi.years()).sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime());

            for (const year of years) {
                let label = yearFilter.createChildElement('label', {
                    class: 'st-checkbox-label',
                    for: `st-cs-year-filter-year${year.id}`,
                    innerText: year.studie.code.match(/\d/gi)?.[0],
                    title: `${year.groep.omschrijving || year.groep.code} (${year.studie.code} in ${year.lesperiode.code})`
                });
                if (!(label.innerText?.length > 0)) label.innerText = '?';
                let input = label.createChildElement('input', {
                    id: `st-cs-year-filter-year${year.id}`,
                    class: 'st-checkbox-input',
                    name: 'st-cs-year-filter',
                    type: 'checkbox'
                });
                input.checked = [...this.includedTables].some(t => t.identifier.year?.id === year.id);

                input.addEventListener('change', async () => {
                    this.progressBar.dataset.visible = 'true';
                    let gradeTable = gradeTables.find(t => t.identifier.year?.id === year.id);
                    if (!gradeTable) {
                        gradeTable = new GradeTable(await magisterApi.gradesForYear(year), { year });
                        gradeTables.push(gradeTable);
                    }
                    if (input.checked)
                        this.includedTables.add(gradeTable);
                    else
                        this.includedTables.delete(gradeTable);

                    await this.#updateStats();
                    this.progressBar.dataset.visible = 'false';
                });
            }

            for (const table of gradeTables) {
                if (years.some(y => y.id === table.identifier.year?.id)) continue;

                let label = yearFilter.createChildElement('label', {
                    class: 'st-checkbox-label icon',
                    for: `st-cs-year-filter-yearimport${table.identifier.backupDate.getTime()}`,
                    innerText: '',
                    title: `Back-up van ${table.identifier.backupYear.studie.code} (${table.identifier.backupYear.lesperiode.code}) ${table.identifier.backupDate.toLocaleString()}`
                });
                if (!(label.innerText?.length > 0)) label.innerText = '?';
                let input = label.createChildElement('input', {
                    id: `st-cs-year-filter-yearimport${table.identifier.backupDate.getTime()}`,
                    class: 'st-checkbox-input',
                    name: 'st-cs-year-filter',
                    type: 'checkbox'
                });
                input.checked = this.includedTables.has(table);

                input.addEventListener('change', async () => {
                    this.progressBar.dataset.visible = 'true';
                    if (input.checked)
                        this.includedTables.add(table);
                    else
                        this.includedTables.delete(table);

                    await this.#updateStats();
                    this.progressBar.dataset.visible = 'false';
                });
            }

            dialog.show();
        });

        this.includedTables.add(currentGradeTable);

        await this.#updateStats();
        this.#initialised = true;
    }

    async #updateStats() {
        this.progressBar.dataset.visible = 'true';
        this.#div1.innerHTML = '';

        let values = [...this.includedTables].flatMap(t => t.grades.filter(grade => {
            if (this.excludedSubjects.has(grade.Vak.Omschrijving)) return false; // excluded subject
            if (grade.CijferKolom?.KolomSoort == 2 || !grade.TeltMee) return false; // not a relevant grade
            const result = Number(grade.CijferStr?.replace(',', '.'));
            if (isNaN(result) || result < (syncedStorage['c-minimum'] ?? 1) || result > (syncedStorage['c-maximum'] ?? 10)) return false; // not a valid number
            return true;
        }).map(grade => Number(grade.CijferStr.replace(',', '.'))));

        this.#div1.createChildElement('p', {
            innerText: i18n(this.includedTables.size == 1 ? '{tables} cijferlijst' : '{tables} cijferlijsten', { tables: this.includedTables.size }) + '\n' +
                `${values.length} cijfers\ngemiddelde = ${calculateMean(values)}, mediaan = ${calculateMedian(values)}, modus = ${calculateMode(values).modes.join(', ')}, variantie = ${calculateVariance(values)}\n\n[${values.join(', ')}]`
        });

        this.progressBar.dataset.visible = 'false';
    }
}