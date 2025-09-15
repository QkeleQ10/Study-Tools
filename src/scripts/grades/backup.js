

class GradeBackupDialog extends Dialog {
    years = [];
    busy = false;
    #progressBar;
    #column1;
    #column2;

    constructor() {
        super();

        this.body.classList.add('st-grade-backup-dialog');

        this.#column1 = createElement('div', this.body, { class: 'st-dialog-column' });
        this.#column1.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cb.export') });

        this.#column2 = createElement('div', this.body, { class: 'st-dialog-column' });
        this.#column2.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('cb.import') });

        this.#progressBar = this.element.createChildElement('div', { class: 'st-progress-bar' });
        this.#progressBar.createChildElement('div', { class: 'st-progress-bar-value indeterminate' });

        this.#initialise();
    }

    async #initialise() {
        const importButton = this.#column2.createChildElement('button', { id: 'st-grade-backup-import', class: 'st-button', innerText: i18n('cb.browse'), 'data-icon': '' });
        this.#column2.createChildElement('p', { innerText: i18n('cb.importInfo'), style: 'max-width:200px;text-wrap:balance;font-size:smaller;text-align:center' });
        const input = this.#column2.createChildElement('input', { type: 'file', accept: '.json', style: 'display:none' });
        importButton.addEventListener('click', () => {
            if (this.busy) return;
            input.click();
        });
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const json = JSON.parse(typeof e.target.result === 'string' ? e.target.result : new TextDecoder().decode(e.target.result));
                await this.#importBackup(json);
            };
            reader.readAsText(file);
        });

        years = (await magisterApi.years()).sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

        years.forEach((year, i, a) => {
            this.#column1.createChildElement('button', {
                class: i === a.length - 1 ? 'st-button' : 'st-button secondary',
                innerText: `${year.studie.code} (lesperiode ${year.lesperiode.code}, ${year.groep.omschrijving || year.groep.code})`,
            })
                .addEventListener('click', async () => {
                    if (this.busy) return;
                    this.#exportGrades(year);
                });
        })

        this.#progressBar.dataset.visible = 'false';
    }

    async #exportGrades(year) {
        return new Promise(async (resolve, reject) => {
            try {

                this.busy = true;
                this.#column1.classList.add('st-disabled');

                const grades = await this.#gatherGrades(year);

                this.#progressBar.dataset.visible = 'true';

                let uri = `data:application/json;base64,${window.btoa(unescape(encodeURIComponent(JSON.stringify(
                    {
                        date: new Date(),
                        year: { groep: { omschrijving: year.groep.omschrijving, code: year.groep.code }, studie: { code: year.studie.code }, lesperiode: { code: year.lesperiode.code } },
                        grades
                    }
                ))))}`,
                    a = element('a', 'st-grade-backup-temp', document.body, {
                        download: `Cijferback-up ${year.studie.code} (${year.lesperiode.code}) ${(new Date).toLocaleString()}`,
                        href: uri,
                        type: 'application/json'
                    });
                a.click();
                a.remove();

                setTimeout(() => {
                    this.#progressBar.dataset.visible = 'false';
                }, 500);

                new Dialog({ innerText: i18n('cb.done') }).show();

                setTimeout(() => {
                    this.#column1.classList.remove('st-disabled');
                    this.busy = false;
                    resolve();
                }, 10000)

            } catch (error) {
                reject(error);
                this.close();
                new Dialog({ innerText: i18n('cb.error') }).show();
            }
        });
    }

    async #gatherGrades(year) {
        return new Promise(async (resolve, reject) => {
            try {
                this.#progressBar.firstElementChild.classList.remove('indeterminate');
                this.#progressBar.dataset.visible = 'true';

                const grades = (await magisterApi.gradesForYear(year)).filter(grade => grade.CijferKolom?.Id > 0);

                for (let i = 0; i < grades.length; i++) {
                    this.#progressBar.firstElementChild.style.width = `${(i / grades.length) * 100}%`;

                    await new Promise((resolve) => {
                        let delay = 5;
                        if (i > 0 && i % 100 === 0) {
                            delay = 8000;
                            const dialog = new Dialog({ innerText: i18n('cb.avoidingRateLimit'), allowClose: false });
                            dialog.show();
                            setTimeout(() => dialog.close(), 8000);
                        } else if (grades.length > 100) {
                            delay = 20;
                        }
                        setTimeout(resolve, delay);
                    });

                    const gradeColumnInfo = await magisterApi.gradesColumnInfo(year, grades[i].CijferKolom.Id);

                    grades[i] = {
                        ...grades[i],
                        CijferKolom: { ...grades[i].CijferKolom, ...gradeColumnInfo }
                    }
                }

                this.#progressBar.firstElementChild.removeAttribute('style');
                this.#progressBar.firstElementChild.classList.add('indeterminate');
                this.#progressBar.dataset.visible = 'false';

                resolve(grades);
            } catch (error) {
                reject(error);
            }
        });
    }

    async #importBackup(json) {
        const { date, year, grades } = json;

        if (!date || !year || !grades || !Array.isArray(grades)) {
            new Dialog({
                innerText: "Je back-up is ongeldig of in een verouderde indeling.\n\nJe kunt oude back-ups importeren via onderstaande website.",
                buttons: [{ innerText: 'Importeren via website', primary: true, href: 'https://qkeleq10.github.io/studytools/grades#grades' }]
            }).show();
            return;
        }

        this.close();

        const aside = await awaitElement('aside'), container = await awaitElement('.container[id$=container]'), asideResizer = document.querySelector('#st-aside-resize');
        aside.setAttribute('style', 'display:none;width:0px;');
        container.style.paddingRight = '20px';
        if (asideResizer) asideResizer.setAttribute('style', `display:none`);

        collectedGrades.unshift({
            title: `Back-up van ${year.studie.code} (${year.lesperiode.code}) ${date.toLocaleString()}`,
            grades
        })

        const contentContainer = await awaitElement('section.main>div');
        contentContainer.querySelectorAll('*').forEach(child => { child.style.display = 'none'; });

        const asideDetails = await awaitElement('#idDetails>.tabsheet>div[ng-transclude]');
        asideDetails.querySelectorAll('*').forEach(child => { child.style.display = 'none'; });

        drawGradeTable(grades, contentContainer, (grade, event) => {
            const dialog = new GradeDetailDialog(grade);
            dialog.show();
        });
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

        if (this.grade.CijferKolom.Weging === null && this.year) {
            const gradeColumnInfo = await magisterApi.gradesColumnInfo(this.year, this.grade.CijferKolom.Id);

            this.grade = {
                ...this.grade,
                CijferKolom: { ...this.grade.CijferKolom, ...gradeColumnInfo }
            }
        }

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

        this.#progressBar.dataset.visible = 'false';
    }

    #addRowToTable(parentElement, label, value) {
        let row = createElement('tr', parentElement);
        createElement('td', row, { innerText: label || '' });
        return createElement('td', row, { innerText: value || '' });
    }
}