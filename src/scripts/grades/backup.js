

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

                const grades = await magisterApi.gradesForYear(year);

                for (let i = 0; i < grades.length; i++) {
                    this.#progressBar.firstElementChild.style.width = `${(i / grades.length) * 100}%`;

                    await new Promise(resolve => setTimeout(resolve, (i > 0 && i % 100 === 0) ? 8000 : grades.length > 100 ? 20 : 5));

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

        });
    }
}