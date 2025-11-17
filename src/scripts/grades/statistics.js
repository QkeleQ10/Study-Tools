class GradeStatisticsPane extends Pane {
    id = 'cs';
    icon = '';

    #div1;
    #div2;
    selectedGrades = [];
    #initialised = false;

    constructor(parentElement) {
        super(parentElement);
        this.element.id = 'st-grade-statistics-pane';

        this.element.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cs.title') });
        this.#div1 = this.element.createChildElement('div', { class: 'st-div' });
        this.#div2 = this.element.createChildElement('div', { class: 'st-div' });
    }

    show() {
        this.redraw();
        super.show();
    }

    hide() {
        document.querySelectorAll('.st-grade-statistics-selected').forEach(elem => elem.classList.remove('st-grade-statistics-selected'));
        currentGradeTable.element.classList.remove('st-cs-open');
        super.hide();
    }

    async redraw() {
        this.progressBar.dataset.visible = 'true';

        if (!this.#initialised && this.selectedGrades.length === 0) {
            for (const grade of currentGradeTable.grades) {
                await this.toggleGrade(grade);
            }
            this.#initialised = true;
        }

        this.#div1.innerHTML = '';
        this.#div2.innerHTML = '';

        document.querySelectorAll('.st-grade-statistics-selected').forEach(elem => elem.classList.remove('st-grade-statistics-selected'));
        currentGradeTable.element.classList.add('st-cs-open');

        let grades = this.selectedGrades;
        let values = grades.map(({ result }) => result);

        for (const { id } of grades) {
            const elem = document.getElementById(id);
            if (elem) elem.classList.add('st-grade-statistics-selected');
        }

        const filterButton = this.#div1.createChildElement('button', { class: 'st-button icon', 'data-icon': '', title: i18n('selection'), style: { position: 'absolute', top: '12px', right: '12px' } });
        filterButton.addEventListener('click', async () => {
            const dialog = new Dialog({
                innerText: i18n('cs.howToAdd'),
            });
            dialog.show();
        });

        // === EMPTY ===

        if (this.selectedGrades.length === 0) {
            this.#div1.createChildElement('p', { innerText: i18n('cs.emptyDesc') });
            this.progressBar.dataset.visible = 'false';
            return;
        } else {
            this.#div1.createChildElement('p', {
                class: 'remove',
                innerText: i18n(
                    grades.length === 1 ? 'cs.xGrade' : 'cs.xGrades',
                    { num: grades.length }
                ),
                title: i18n('remove')
            })
                .addEventListener('click', () => {
                    this.selectedGrades = [];
                    this.redraw();
                });
        }

        // === CENTRAL TENDENCIES ===

        const divCentralTendencies = this.#div2.createChildElement('div', { class: 'st-cs-tile', id: 'st-cs-central-tendencies' });
        divCentralTendencies.createChildElement('div', {
            class: 'st-metric',
            'data-description': i18n('cs.mean'),
            title: i18n('cs.meanDescription'),
            innerText: calculateMean(values).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        });
        divCentralTendencies.createChildElement('div', {
            class: 'st-metric secondary',
            'data-description': i18n('cs.median'),
            title: i18n('cs.medianDescription'),
            innerText: calculateMedian(values).toLocaleString(locale)
        });
        const { modes, occurrences } = calculateMode(values);
        divCentralTendencies.createChildElement('div', {
            class: 'st-metric secondary',
            'data-description': i18n(modes.length > 1 ? 'cs.modes' : 'cs.mode'),
            title: i18n('cs.modeDescription'),
            innerText: modes.length > 0 ? modes.map(m => m.toLocaleString(locale)).join(', ') : i18n('none'),
            'data-extra': modes.length > 0 ? `${occurrences}x` : null
        });
        divCentralTendencies.createChildElement('div', {
            class: 'st-metric secondary',
            'data-description': i18n('cs.standardDeviation'),
            title: i18n('cs.standardDeviationDescription'),
            innerText: calculateStandardDeviation(values).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        });

        // === SUFFICIENT / INSUFFICIENT ===

        const numSufficient = grades.filter(g => g.sufficient).length;

        const divSufInsuf = this.#div2.createChildElement('div', { class: 'st-cs-tile', id: 'st-cs-suf-insuf' });
        const pieChart = divSufInsuf.createChildElement('div', { id: 'st-cs-pie' });
        pieChart.createChildElement('div', {
            class: 'st-circle-sector', style: {
                '--start': `0%`,
                '--end': `${(grades.length - numSufficient) / grades.length * 100}%`,
                outlineColor: 'var(--st-accent-warn)',
            }
        });
        pieChart.createChildElement('div', {
            class: 'st-circle-sector', style: {
                '--start': `${(grades.length - numSufficient) / grades.length * 100}%`,
                '--end': `100%`,
                outlineColor: 'var(--st-accent-ok)',
            }
        });
        divSufInsuf.createChildElement('div', {
            class: 'st-metric secondary',
            'data-description': i18n('cs.sufficient'),
            title: i18n('cs.sufficientDescription'),
            innerText: numSufficient,
            'data-extra': `${(numSufficient / grades.length * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
        });
        divSufInsuf.createChildElement('div', {
            class: 'st-metric secondary',
            'data-description': i18n('cs.insufficient'),
            title: i18n('cs.insufficientDescription'),
            innerText: grades.length - numSufficient,
            'data-extra': `${((grades.length - numSufficient) / grades.length * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
        });

        // === HISTOGRAM ===

        const lowerBound = (syncedStorage['c-minimum'] ?? 1);
        const upperBound = (syncedStorage['c-maximum'] ?? 10);
        const range = upperBound - lowerBound;
        const stepSize = Math.floor(range / 10) || 1;
        const roundedFrequencies = {};
        for (let i = Math.ceil(lowerBound); i <= Math.floor(upperBound); i += stepSize) {
            roundedFrequencies[i] = 0;
        }
        for (const value of values) {
            let roundedValue = Math.round((value - lowerBound) / stepSize) * stepSize + lowerBound;
            roundedFrequencies[roundedValue]++;
        }

        const divHistogram = this.#div2.createChildElement('div', { class: 'st-cs-tile', id: 'st-cs-histogram' });
        divHistogram.createChildElement('h4', { innerText: i18n('cs.histogram'), style: { marginBottom: '4px' } });
        const histogram = divHistogram.createChildElement('div', { class: 'st-histogram horizontal' });
        const maxFrequency = Math.max(...Object.values(roundedFrequencies));
        for (const [roundedValue, frequency] of Object.entries(roundedFrequencies)) {
            histogram.createChildElement('div', { class: 'st-cs-histogram-bar-label', innerText: roundedValue });
            histogram
                .createChildElement('div', {
                    class: 'st-cs-histogram-bar-container',
                    title: i18n('cs.histogramBarDescription', {
                        frequency,
                        rangeStart: Math.max(lowerBound, Number(roundedValue) - stepSize / 2).toLocaleString(locale),
                        rangeEnd: Math.min(upperBound, Number(roundedValue) + stepSize / 2).toLocaleString(locale)
                    }),
                })
                .createChildElement('div', {
                    class: 'st-cs-histogram-bar',
                    style: {
                        '--percentage': `${(frequency / maxFrequency) * 100}%`,
                        backgroundColor: roundedValue >= (syncedStorage['suf-threshold'] ?? 5.5) ? 'var(--st-accent-ok)' : 'var(--st-accent-warn)',
                    },
                    'data-percentage': frequency ? `${(frequency / values.length * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : '',
                })
        }

        // === LINE CHART ===

        const divLineChart = this.#div2.createChildElement('div', { class: 'st-cs-tile' });
        divLineChart.createChildElement('h4', { innerText: i18n('cs.trend'), style: { marginBottom: '4px' } });
        divLineChart.createChildElement('p', { innerText: "Deze grafiek werkt niet naar behoren en zal worden vervangen.", style: { marginBottom: '4px' } });
        divLineChart.createChildElement('div', { id: 'st-cs-line-chart', style: { width: '100%', height: '300px' } })
            .createLineChart(values, null, lowerBound, upperBound);


        this.progressBar.dataset.visible = 'false';
    }

    async toggleGrade(grade, force) {
        this.progressBar.dataset.visible = 'true';

        if ((this.selectedGrades.some(g => g.id === grade.CijferId) || force === false) && force !== true) {
            this.selectedGrades = this.selectedGrades.filter(g => g.id !== grade.CijferId);
        } else {
            const result = Number(grade.CijferStr?.replace(',', '.'));
            if (grade.CijferKolom?.KolomSoort == 2 || !grade.TeltMee || isNaN(result) || result < (syncedStorage['c-minimum'] ?? 1) || result > (syncedStorage['c-maximum'] ?? 10)) {
                // not a valid number or not a relevant grade
                this.progressBar.dataset.visible = 'false';
                return;
            }

            this.selectedGrades.push({
                id: grade.CijferId,
                result,
                sufficient: grade.IsVoldoende
            });
        }
    }

    async toggleMultipleGrades(grades) {
        const someAlreadySelected = grades.some(g => this.selectedGrades.some(sg => sg.id === g.CijferId));

        for (const grade of grades) {
            await this.toggleGrade(grade, !someAlreadySelected);
        }
    }
}