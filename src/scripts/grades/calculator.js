class GradeCalculatorPane extends Pane {
    #div1;
    selectedGrades = [];
    futureWeight = null;

    constructor(parentElement) {
        super(parentElement);
        this.element.id = 'st-grade-calculator-pane';

        this.#div1 = this.element.createChildElement('div', { class: 'st-div' });
    }

    show() {
        this.redraw();
        super.show();
    }

    hide() {
        document.querySelectorAll('.st-grade-calculator-selected').forEach(elem => elem.classList.remove('st-grade-calculator-selected'));
        super.hide();
    }

    async redraw() {
        this.progressBar.dataset.visible = 'true';

        this.#div1.innerHTML = '';
        document.querySelectorAll('.st-grade-calculator-selected').forEach(elem => elem.classList.remove('st-grade-calculator-selected'));

        // === ADDED GRADES ===

        const listSection = this.#div1.createChildElement('div', { class: 'added-list' });

        if (this.selectedGrades.length === 0) {
            listSection.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cc.title') });
            listSection.createChildElement('p', { innerText: i18n('cc.emptyDesc') });
        } else {
            listSection.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cc.gradesInCalculation') + ` (${this.selectedGrades.length})` });
        }

        const addCustomGradeButton = listSection.createChildElement('button', { class: 'st-button icon', 'data-icon': '+', title: i18n('cc.addCustomGrade'), style: { position: 'absolute', top: '12px', right: '12px' } });
        addCustomGradeButton.addEventListener('click', async () => {
            const dialog = new Dialog();
            dialog.body.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cc.addCustomGrade') });
            const flex = dialog.body.createChildElement('div', { style: { display: 'flex', gap: '8px' } });
            const gradeInput = flex.createChildElement('input', { type: 'number', class: 'st-input', placeholder: i18n('assessment'), min: (syncedStorage['c-minimum'] ?? 1), max: (syncedStorage['c-maximum'] ?? 10), step: '0.1', style: { flex: '1' } });
            const weightInput = flex.createChildElement('input', { type: 'number', class: 'st-input', placeholder: i18n('weight'), min: '0', step: '1', style: { flex: '1' } });

            dialog.buttonsWrapper.createChildElement('button', {
                innerText: i18n('add'),
                'data-icon': '+',
                class: 'st-button primary',
            })
                .addEventListener('click', () => {
                    const gradeValue = Number(gradeInput.value);
                    const weightValue = Math.max(0, Math.round(Number(weightInput.value)));
                    if (isNaN(gradeValue) || gradeValue < (syncedStorage['c-minimum'] ?? 1) || gradeValue > (syncedStorage['c-maximum'] ?? 10)) {
                        new Dialog({ innerText: i18n('cc.invalidGradeValue', { min: (syncedStorage['c-minimum'] ?? 1), max: (syncedStorage['c-maximum'] ?? 10) }) }).show();
                        return;
                    }
                    this.selectedGrades.push({
                        id: `custom-grade-${Date.now()}`,
                        result: gradeValue,
                        weight: weightValue,
                        column: null,
                        title: null,
                        index: Infinity,
                    });
                    this.redraw();
                });

            dialog.show();
        });

        for (const { id, result, weight, column, title } of this.selectedGrades.sort((a, b) => a.index - b.index)) {
            listSection.createChildElement('p', {
                class: 'entry',
                innerText: `${result.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}x) — ` + (column && title ? `${column}, ${title}` : i18n('cc.addedManually')),
                title: i18n('remove'),
            })
                .addEventListener('click', () => {
                    this.selectedGrades = this.selectedGrades.filter(g => g.id !== id);
                    this.redraw();
                });
            const elem = document.getElementById(id);
            if (elem) elem.classList.add('st-grade-calculator-selected');
        }

        // === EMPTY ===

        if (this.selectedGrades.length === 0) {
            this.progressBar.dataset.visible = 'false';
            return;
        }

        // === CENTRAL TENDENCY MEASURES ===

        const N = this.selectedGrades.length;
        const totalWeight = this.selectedGrades.reduce((sum, grade) => sum + grade.weight, 0);
        const weightedTotal = this.selectedGrades.reduce((sum, grade) => sum + (grade.result * grade.weight), 0);
        const unweightedTotal = this.selectedGrades.reduce((sum, grade) => sum + grade.result, 0);
        const weightedAverage = totalWeight > 0 ? weightedTotal / totalWeight : 0;
        const unweightedAverage = N > 0 ? unweightedTotal / N : 0;
        const median = calculateMedian(this.selectedGrades.map(item => item.result))

        this.#div1.createChildElement('hr');

        const tendencyMeasures = this.#div1.createChildElement('div', { style: { display: 'flex' } });
        tendencyMeasures.createChildElement('div', { class: 'st-metric secondary', dataset: { description: i18n(`cc.weightedAverage`) }, innerText: weightedAverage.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
        tendencyMeasures.createChildElement('div', { class: 'st-metric secondary', dataset: { description: i18n(`cc.median`) }, innerText: median.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
        tendencyMeasures.createChildElement('div', { class: 'st-metric secondary', dataset: { description: i18n(`cc.totalWeight`) }, innerText: `${totalWeight}x` });

        // === FUTURE WEIGHT ===

        this.#div1.createChildElement('hr');

        const futureWeightSection = this.#div1.createChildElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlock: '-10px' } });
        futureWeightSection.createChildElement('p', { innerText: i18n('cc.futureWeight'), style: { textWrap: 'balance', flex: '2' } });
        const futureWeightInput = futureWeightSection.createChildElement('input', { type: 'number', class: 'st-input', value: this.futureWeight, min: '0', step: '1', placeholder: `${Math.round(calculateMedian(this.selectedGrades.map(item => item.weight)) || 1)}x`, style: { flex: '1' } });

        // === PREDICTION ===

        this.#div1.createChildElement('hr');

        const predictionSection = this.#div1.createChildElement('div');
        futureWeightInput.addEventListener('input', () => {
            this.futureWeight = Math.max(0, Math.round(Number(futureWeightInput.value)));
            this.drawPredictionSection(predictionSection, weightedTotal, totalWeight)
        });
        this.drawPredictionSection(predictionSection, weightedTotal, totalWeight);

        this.progressBar.dataset.visible = 'false';
    }

    async drawPredictionSection(section, weightedTotal, totalWeight) {
        section.innerHTML = '';

        const target = (syncedStorage['suf-threshold'] || 5.5);
        const newWeight = this.futureWeight || Math.round(calculateMedian(this.selectedGrades.map(item => item.weight)) || 1);

        const x = (target * (totalWeight + newWeight) - weightedTotal) / newWeight;

        const upperBound = (syncedStorage['c-maximum'] ?? 10);
        const lowerBound = (syncedStorage['c-minimum'] ?? 1);

        let res = {
            achievable: true,
            message: i18n((weightedTotal / totalWeight) < target ? 'cc.adviceCurrentlyNotPassing' : 'cc.adviceCurrentlyPassing', {
                newResult: x.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1, roundingMode: 'ceil' }),
                newWeight,
                target: target.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
            }),
        };

        if (x > upperBound) {
            const newAverage = (weightedTotal + (upperBound * newWeight)) / (totalWeight + newWeight);
            res = {
                achievable: false,
                message: i18n('cc.adviceAboveUpperBound', {
                    newWeight,
                    newAverage: newAverage.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }),
            };
        } else if (x < lowerBound) {
            const newAverage = (weightedTotal + (lowerBound * newWeight)) / (totalWeight + newWeight);
            res = {
                achievable: true,
                message: i18n('cc.adviceBelowLowerBound', {
                    newWeight,
                    newAverage: newAverage.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }),
            };
        }

        section.createChildElement('p', { innerText: res.message, style: { color: res.achievable ? 'var(--st-foreground-primary)' : 'var(--st-accent-warn)', textWrap: 'balance' } });

        const chartContainer = section.createChildElement('div');

        // Calculate the linear function: newAverage = a * newResult + b
        //                                           = (weightedTotal + newResult * newWeight) / (totalWeight + newWeight)
        // Rearranging:                              = (newWeight / (totalWeight + newWeight)) * newResult + (weightedTotal / (totalWeight + newWeight))

        const slope = newWeight / (totalWeight + newWeight);
        const intercept = weightedTotal / (totalWeight + newWeight);

        chartContainer.createLinearLineChart(slope, intercept, lowerBound, upperBound, lowerBound, upperBound, upperBound - lowerBound, upperBound - lowerBound, (x, y) => `${x.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ➜ ${y.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 0.1);
    }

    async toggleGrade(grade, year) {
        this.progressBar.dataset.visible = 'true';

        if (this.selectedGrades.some(g => g.id === grade.CijferId)) {
            this.selectedGrades = this.selectedGrades.filter(g => g.id !== grade.CijferId);
        } else {

            if (grade.CijferKolom.Weging == null && year) {
                const gradeColumnInfo = await magisterApi.gradesColumnInfo(year, grade.CijferKolom.Id);

                grade = {
                    ...grade,
                    CijferKolom: { ...grade.CijferKolom, ...gradeColumnInfo }
                };
            }

            const result = Number(grade.CijferStr.replace(',', '.'));
            if (isNaN(result) || result < (syncedStorage['c-minimum'] ?? 1) || result > (syncedStorage['c-maximum'] ?? 10)) {
                // not a valid number
                this.progressBar.dataset.visible = 'false';
                return;
            }

            this.selectedGrades.push({
                id: grade.CijferId,
                result,
                weight: grade.CijferKolom.Weging || 0,
                column: grade.CijferKolom.KolomNaam || '',
                title: grade.CijferKolom.KolomOmschrijving || '',
                index: grade.CijferKolom.KolomVolgNummer || 0,
            });
        }

        this.redraw();
    }
}