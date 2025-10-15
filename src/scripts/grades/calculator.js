class GradeCalculatorPane extends Pane {
    selectedGrades = [];
    futureWeight = null;

    constructor(parentElement) {
        super(parentElement);
        this.element.id = 'st-grade-calculator-pane';

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

        this.element.innerHTML = '';
        document.querySelectorAll('.st-grade-calculator-selected').forEach(elem => elem.classList.remove('st-grade-calculator-selected'));

        // === EMPTY ===

        if (this.selectedGrades.length === 0) {
            this.element.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cc.title') });
            this.element.createChildElement('p', { innerText: i18n('cc.emptyDesc') });
            this.progressBar.dataset.visible = 'false';
            return;
        }

        // === ADDED GRADES ===

        this.element.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cc.gradesInCalculation') + ` (${this.selectedGrades.length})` });

        for (const { id, result, weight, column, title } of this.selectedGrades.sort((a, b) => a.index - b.index)) {
            this.element.createChildElement('p', {
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

        // === CENTRAL TENDENCY MEASURES ===

        const N = this.selectedGrades.length;
        const totalWeight = this.selectedGrades.reduce((sum, grade) => sum + grade.weight, 0);
        const weightedTotal = this.selectedGrades.reduce((sum, grade) => sum + (grade.result * grade.weight), 0);
        const unweightedTotal = this.selectedGrades.reduce((sum, grade) => sum + grade.result, 0);
        const weightedAverage = totalWeight > 0 ? weightedTotal / totalWeight : 0;
        const unweightedAverage = N > 0 ? unweightedTotal / N : 0;
        const median = calculateMedian(this.selectedGrades.map(item => item.result))

        this.element.createChildElement('hr');

        const tendencyMeasures = this.element.createChildElement('div', { style: { display: 'flex' } });
        tendencyMeasures.createChildElement('div', { class: 'st-metric', dataset: { description: i18n(`cc.weightedAverage`) }, innerText: weightedAverage.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
        tendencyMeasures.createChildElement('div', { class: 'st-metric', dataset: { description: i18n(`cc.median`) }, innerText: median.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
        tendencyMeasures.createChildElement('div', { class: 'st-metric', dataset: { description: i18n(`cc.totalWeight`) }, innerText: `${totalWeight}x` });

        // === PREDICTION ===

        this.element.createChildElement('hr');

        this.element.createChildElement('p', { innerText: i18n('cc.futureDesc') });
        const futureWeightInput = this.element.createChildElement('input', { type: 'number', class: 'st-input', value: this.futureWeight, min: '0', step: '1', placeholder: i18n('weight') });
        const predictionSection = this.element.createChildElement('div', { style: { marginTop: '10px' } });
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

        section.createChildElement('p', { innerText: res.message });

        const canvas = this.element.createChildElement('div');
    }

    async toggleGrade(grade, year) {
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
            if (isNaN(result) || result < (syncedStorage['c-minimum'] ?? 1) || result > (syncedStorage['c-maximum'] ?? 10)) return; // not a valid number

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