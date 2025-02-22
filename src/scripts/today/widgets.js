class Widget {
    element;
    header;
    options = {};
    progressBar;

    constructor(parentElement, options) {
        this.options = options || {};

        if (this.constructor == Widget || !this.toString()) {
            throw new Error("Abstract classes can't be instantiated.");
        }

        this.element = createElement('div', parentElement, {
            id: `st-start-widget-${this.toString()}`,
            class: 'st-widget',
        });

        this.header = createElement('h3', this.element, {
            id: `st-start-widget-${this.toString()}-title`,
            class: 'st-widget-title',
            innerText: i18n(`widgets.${this.toString()}`),
            'data-amount': 0,
        });

        this.progressBar = createElement('div', this.element, {
            class: 'st-progress-bar',
        });
        createElement('div', this.progressBar, {
            class: 'st-progress-bar-value indeterminate',
        });

        this.initialise();
    }

    async initialise() { }

    toString() { }
}

class ListWidget extends Widget {
    #listElement;
    listItems = [];

    constructor(parentElement, options) {
        super(parentElement, options);

        this.#listElement = this.element.createChildElement('ul', {
            id: `st-start-widget-${this.toString()}-list`,
            class: 'st-widget-list',
        });
    }

    async initialise() {
        this.#drawList();
    }

    async #drawList() {
        for (const item of this.listItems) {
            await this.drawListItem(item);
        }

        this.header.dataset.amount = this.listItems.length;
        if (this.listItems.length < 1) this.element.style.display = 'none';

        this.progressBar.dataset.visible = false;
    }

    drawListItem() {
        return createElement('li', this.#listElement, {
            class: 'st-widget-subitem'
        })
    }
}

class HomeworkWidget extends ListWidget {
    async initialise() {
        this.listItems = (await magisterApi.events()).filter(item => {
            if (this.options.filter === 'incomplete')
                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date() && !item.Afgerond)
            else
                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
        });
        super.initialise();
    }

    async drawListItem(event) {
        return new Promise(resolve => {
            let itemElement = super.drawListItem();

            itemElement.addEventListener('click', () => {
                if (this.element.closest('#st-start-widgets')?.classList.contains('editing')) return;
                new ScheduleEventDialog(event).show();
                if (schedule.scheduleDate) schedule.scheduleDate = new Date(event.Start);
            });

            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row'
            })
                .createChildElement('b', {
                    class: 'st-widget-subitem-title',
                    innerText: eventSubjects(event) || event.Omschrijving,
                })
                .createSiblingElement('span', {
                    class: 'st-widget-subitem-timestamp',
                    innerText: makeTimestamp(event.Start),
                });

            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row',
            })
                .createChildElement('div', {
                    class: 'st-widget-subitem-content',
                    innerHTML: event.Inhoud.replace(/(<br ?\/?>)/gi, ''),
                });

            let chips = getEventChips(event)
            const chipsWrapper = itemElement.createChildElement('div', {
                class: 'st-chips-wrapper',
            });
            chips.forEach(chip => {
                createElement('span', chipsWrapper, {
                    class: `st-chip ${chip.type || 'info'}`,
                    innerText: chip.name,
                });
            });

            resolve(itemElement);
        });
    }

    toString() {
        return 'homework';
    }
}

class MessagesWidget extends ListWidget {
    async initialise() {
        this.listItems = await magisterApi.messages();
        super.initialise();

        this.element.tabIndex = 0;
        this.element.addEventListener('click', () => {
            if (this.element.closest('#st-start-widgets')?.classList.contains('editing')) return;
            window.location.href = '#/berichten';
        });
    }

    async drawListItem(message) {
        return new Promise(resolve => {
            let itemElement = super.drawListItem();

            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row'
            })
                .createChildElement('b', {
                    class: 'st-widget-subitem-title',
                    innerText: message.afzender.naam,
                })
                .createSiblingElement('span', {
                    class: 'st-widget-subitem-timestamp',
                    innerText: makeTimestamp(message.verzondenOp),
                });


            itemElement.createChildElement('span', {
                class: 'st-widget-subitem-row',
            })
                .createChildElement('div', {
                    class: 'st-widget-subitem-content',
                    innerText: message.onderwerp,
                });

            let chips = []
            if (message.heeftPrioriteit) chips.push({ name: i18n('chips.important'), type: 'warn' })
            if (message.heeftBijlagen) chips.push({ name: i18n('chips.attachments'), type: 'info' })
            const chipsWrapper = itemElement.createChildElement('div', {
                class: 'st-chips-wrapper',
            });
            chips.forEach(chip => {
                createElement('span', chipsWrapper, {
                    class: `st-chip ${chip.type || 'info'}`,
                    innerText: chip.name,
                });
            });

            resolve(itemElement);
        });
    }

    toString() {
        return 'messages';
    }
}
