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

    constructor(parentElement) {
        super(parentElement);

        this.element.id = 'st-grade-recents-pane';
        this.element.classList.remove('st-hidden');

        this.#div1 = this.element.createChildElement('div', { class: 'st-div', style: 'margin-bottom: 16px' });
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
        this.element.createChildElement('hr');
        this.#div2 = this.element.createChildElement('div', { class: 'st-div' });
    }

    show() {
        this.redraw();
        super.show();
    }

    async redraw() {
        this.progressBar.dataset.visible = 'true';

        this.#div2.innerHTML = '';

        this.#div1.firstElementChild.innerText = this.sortingOption.id === 'date_desc' ? i18n('cl.recents') : i18n('cl.title');

        const recentGrades = await magisterApi.gradesRecent(currentGradeTable.grades.length);

        const grades = currentGradeTable.grades.filter(g => g.CijferStr?.length > 0 && g.CijferKolom?.KolomSoort !== 2 && !syncedStorage['ignore-grade-columns'].includes(g.CijferKolom?.KolomKop || 'undefined'));
        grades.sort(this.sortingOption.comparator);

        // === EMPTY ===

        if (grades.length === 0) {
            this.#div2.createChildElement('p', { innerText: i18n('cl.emptyDesc') });
            this.progressBar.dataset.visible = 'false';
            return;
        }

        // === LIST ===

        const list = this.#div2.createChildElement('ul', { class: 'st-grade-list' });
        for (const grade of grades) {
            const recentGrade = recentGrades.find(rg => rg.kolomId === grade.CijferKolom.Id);
            
            const gradeItem = list.createChildElement('li', { class: 'st-grade-item' });

            const col1 = gradeItem.createChildElement('div')
            col1.createChildElement('div', { class: 'st-subject', innerText: grade.Vak?.Omschrijving || '-' })
            if (grade.CijferKolom.WerkInformatieOmschrijving || grade.CijferKolom.KolomOmschrijving || recentGrade?.omschrijving) col1.createChildElement('div', { innerText: grade.CijferKolom.WerkInformatieOmschrijving || grade.CijferKolom.KolomOmschrijving || recentGrade?.omschrijving || '-' })
            col1.createChildElement('div', { innerText: makeTimestamp(grade.DatumIngevoerd) });

            const col2 = gradeItem.createChildElement('div')
            col2.createChildElement('div', { innerText: grade.CijferStr, classList: grade.IsVoldoende === false ? ['st-insufficient'] : [] })
            if (grade.CijferKolom?.Weging ?? recentGrade) col2.createChildElement('div', { innerText: (grade.CijferKolom?.Weging ?? recentGrade?.weegfactor ?? '?') + 'x' });

            if (
                new Date(grade.DatumIngevoerd) >= new Date(new Date(localStorage['st-grade-last-viewed'] || 0))
                && new Date(grade.DatumIngevoerd) >= new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
            )
                gradeItem.classList.add('st-highlight');

            gradeItem.classList.add('st-clickable');
            gradeItem.addEventListener('click', () => {
                const dialog = new GradeDetailDialog(grade, currentGradeTable.identifier.year);
                dialog.show();
            });
        }

        localStorage['st-grade-last-viewed'] = new Date().toISOString();

        this.progressBar.dataset.visible = 'false';
    }
}