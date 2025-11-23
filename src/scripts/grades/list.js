class GradeListPane extends Pane {
    id = 'cl';
    icon = '';

    #div1;
    #div2;

    sortingOptions = [
        {
            id: 'date_desc', label: i18n('cl.sortByDateDesc'), comparator: (a, b) => {
                const dateA = new Date(a.DatumIngevoerd);
                const dateB = new Date(b.DatumIngevoerd);
                return dateB.getTime() - dateA.getTime();
            }
        },
        {
            id: 'date_asc', label: i18n('cl.sortByDateAsc'), comparator: (a, b) => {
                const dateA = new Date(a.DatumIngevoerd);
                const dateB = new Date(b.DatumIngevoerd);
                return dateA.getTime() - dateB.getTime();
            }
        },
        {
            id: 'result_desc', label: i18n('cl.sortByResultDesc'), comparator: (a, b) => {
                const resultA = Number(a.CijferStr?.replace(',', '.'));
                const resultB = Number(b.CijferStr?.replace(',', '.'));
                if (isNaN(resultA) && isNaN(resultB)) return a.CijferStr.localeCompare(b.CijferStr);
                if (isNaN(resultA)) return 1;
                if (isNaN(resultB)) return -1;
                return resultB - resultA;
            }
        },
        {
            id: 'result_asc', label: i18n('cl.sortByResultAsc'), comparator: (a, b) => {
                const resultA = Number(a.CijferStr?.replace(',', '.'));
                const resultB = Number(b.CijferStr?.replace(',', '.'));
                if (isNaN(resultA) && isNaN(resultB)) return a.CijferStr.localeCompare(b.CijferStr);
                if (isNaN(resultA)) return 1;
                if (isNaN(resultB)) return -1;
                return resultA - resultB;
            }
        },
    ];
    sortingOption = this.sortingOptions[0];
    sortingShown = false;

    constructor(parentElement) {
        super(parentElement);

        this.element.id = 'st-grade-recents-pane';
        this.element.classList.remove('st-hidden');

        this.#div1 = this.element.createChildElement('div', { class: 'st-div', style: 'margin-bottom: 16px' });
        this.#div1.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cl.title') });
        this.element.createChildElement('hr');
        this.#div2 = this.element.createChildElement('div', { class: 'st-div' });
    }

    show() {
        this.redraw();
        super.show();
    }

    async redraw() {
        this.progressBar.dataset.visible = 'true';

        this.#div1.innerHTML = '';
        this.#div2.innerHTML = '';

        if (this.sortingShown) {
            this.#div1.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cl.title') });
            const select = this.#div1.createChildElement('select', { class: 'st-select', style: 'width: 100%' });
            for (const option of this.sortingOptions) {
                const optionElement = select.createChildElement('option', { value: option.id, innerText: option.label });
                if (option === this.sortingOption) {
                    optionElement.selected = true;
                }
            }
            select.addEventListener('change', () => {
                const selectedOption = this.sortingOptions.find(option => option.id === select.value);
                if (selectedOption && selectedOption !== this.sortingOption) {
                    this.sortingOption = selectedOption;
                    this.redraw();
                }
            });
        } else {
            this.#div1.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cl.recents') });
            this.#div1.createChildElement('button', { class: 'st-button icon', 'data-icon': '', title: i18n('cl.sort'), style: { position: 'absolute', top: '12px', right: '12px' } })
                .addEventListener('click', () => {
                    this.sortingShown = true;
                    this.redraw();
                });
        }
        this.element.querySelector('hr').style.display = this.sortingShown ? 'block' : 'none';

        const recentGrades = await magisterApi.gradesRecent(currentGradeTable.grades.length);

        const grades = currentGradeTable.grades.filter(grade => grade.CijferStr?.length > 0 && grade.CijferKolom?.KolomSoort !== 2);
        grades.sort(this.sortingOption.comparator);

        // === EMPTY ===

        if (grades.length === 0) {
            this.#div2.createChildElement('p', { innerText: i18n('cl.noGrades') });
            this.progressBar.dataset.visible = 'false';
            return;
        }

        // === LIST ===

        const list = this.#div2.createChildElement('ul', { class: 'st-grade-list' });
        for (const grade of grades) {
            const recentGrade = recentGrades.find(rg => rg.kolomId === grade.CijferKolom.Id);
            if (!recentGrade && !this.sortingShown) {
                this.sortingShown = true;
                this.redraw();
                return;
            }
            const gradeItem = list.createChildElement('li', { class: 'st-grade-item' });

            const col1 = gradeItem.createChildElement('div')
            col1.createChildElement('div', { innerText: grade.Vak?.Omschrijving || '-' })
            if (grade.CijferKolom.WerkInformatieOmschrijving || grade.CijferKolom.KolomOmschrijving || recentGrade?.omschrijving) col1.createChildElement('div', { innerText: grade.CijferKolom.WerkInformatieOmschrijving || grade.CijferKolom.KolomOmschrijving || recentGrade?.omschrijving || '-' })
            col1.createChildElement('div', { innerText: new Date(grade.DatumIngevoerd).toLocaleDateString(locale) });

            const col2 = gradeItem.createChildElement('div')
            col2.createChildElement('div', { innerText: grade.CijferStr, classList: grade.IsVoldoende === false ? ['st-insufficient'] : [] })
            if (grade.CijferKolom?.Weging ?? recentGrade) col2.createChildElement('div', { innerText: (grade.CijferKolom?.Weging ?? recentGrade?.weegfactor ?? '?') + 'x' });

            gradeItem.style.cursor = 'pointer';
            gradeItem.addEventListener('click', () => {
                const dialog = new GradeDetailDialog(grade, currentGradeTable.identifier.year);
                dialog.show();
            });
        }

        this.progressBar.dataset.visible = 'false';
    }
}