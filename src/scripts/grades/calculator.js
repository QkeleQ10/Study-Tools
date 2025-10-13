class GradeCalculatorPane extends Pane {
    #div1;
    selectedGrades = [];

    constructor(parentElement) {
        super(parentElement);
        this.element.id = 'st-grade-calculator-pane';

        this.element.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cc.title') });
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

        if (this.selectedGrades.length === 0) {
            this.#div1.createChildElement('p', { innerText: i18n('cc.emptyDesc') });
            this.progressBar.dataset.visible = 'false';
            return;
        }

        for (const { id, result, weight, column, title } of this.selectedGrades) {
            this.#div1.createChildElement('p', { innerText: `${result.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} (${weight}×) — ${column}, ${title}\n` });
            const elem = document.getElementById(id);
            if (elem) elem.classList.add('st-grade-calculator-selected');
        }

        const N = this.selectedGrades.length;
        const totalWeight = this.selectedGrades.reduce((sum, grade) => sum + grade.weight, 0);
        const weightedTotal = this.selectedGrades.reduce((sum, grade) => sum + (grade.result * grade.weight), 0);
        const unweightedTotal = this.selectedGrades.reduce((sum, grade) => sum + grade.result, 0);
        const weightedAverage = totalWeight > 0 ? weightedTotal / totalWeight : 0;
        const unweightedAverage = N > 0 ? unweightedTotal / N : 0;

        this.#div1.createChildElement('p', { innerText: `\n\nN=${N}\nTotal Weight=${totalWeight}\nWeighted Average=${weightedAverage.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nUnweighted Average=${unweightedAverage.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });

        this.progressBar.dataset.visible = 'false';
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
                id: grade.CijferId || new Date().getTime(),
                result,
                weight: grade.CijferKolom.Weging || 0,
                column: grade.CijferKolom.KolomNaam || '',
                title: grade.CijferKolom.KolomOmschrijving || '',
            });
        }

        this.redraw();
    }
}