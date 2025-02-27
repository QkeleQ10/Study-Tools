class Schedule {
    element;
    days = [];
    #scheduleWrapper;
    #progressBar;

    #hourHeight = 115;
    get hourHeight() { return this.#hourHeight; }
    set hourHeight(newHeight) {
        this.#hourHeight = Math.min(Math.max(45, newHeight), 450);
        this.element.style.setProperty('--hour-height', `${newHeight}px`);
        saveToStorage('start-hour-height', newHeight, 'local');
    }

    set scheduleView(newView) {
        switch (newView) {
            case 'workweek': this.scheduleSize = 5; this.snapToMonday = true; break;
            case 'week': this.scheduleSize = 7; this.snapToMonday = true; break;
            case 'day': this.scheduleSize = 1; this.snapToMonday = false; break;
            default: this.scheduleSize = parseInt(newView.replace('day', '')); this.snapToMonday = false; break;
        };
        persistedScheduleView = newView;
    }
    get scheduleView() {
        if (this.#snapToMonday && this.#scheduleSize === 5) return 'workweek';
        if (this.#snapToMonday) return 'week';
        if (this.#scheduleSize === 1) return 'day';
        return `${this.#scheduleSize}day`;
    }

    #scheduleSize = 1;
    get scheduleSize() { return this.#scheduleSize; }
    set scheduleSize(newSize) {
        this.#scheduleSize = Math.min(Math.max(1, newSize), 7);
        this.scheduleDate = this.scheduleDate;
    }

    #snapToMonday = false;
    get snapToMonday() { return this.#snapToMonday; }
    set snapToMonday(newSetting) {
        this.#snapToMonday = newSetting;
        this.scheduleDate = this.scheduleDate;
    }

    #scheduleDate = dates.today;
    get scheduleDate() { return this.#scheduleDate; }
    set scheduleDate(newDate) {
        this.#scheduleDate = midnight(newDate);
        this.scheduleRange = { start: midnight(this.#scheduleDate), end: midnight(this.#scheduleDate, this.#scheduleSize - 1) };
    }

    #scheduleRange = { start: this.#scheduleDate, end: this.#scheduleDate };
    get scheduleRange() { return this.#scheduleRange; }
    set scheduleRange(newRange) {
        if (this.#snapToMonday) {
            while (newRange.start.getDay() !== 1) {
                newRange.start.setDate(newRange.start.getDate() - 1);
                newRange.end.setDate(newRange.end.getDate() - 1);
            }
        }
        (async () => {
            // If any of the days in agendaRange don't have a corresponding entry in this.days, extend the schedule range to include it.
            if (!this.days.some(day => day.date.getTime() === newRange.start.getTime())) {
                await this.#fetchAndAppendEvents(
                    midnight(newRange.start, -13),
                    midnight(newRange.end, 1)
                );
            }
            if (!this.days.some(day => day.date.getTime() === newRange.end.getTime())) {
                await this.#fetchAndAppendEvents(
                    midnight(newRange.start, 0),
                    midnight(newRange.end, 14)
                );
            }

            let oldRange = this.#scheduleRange;
            this.#scheduleRange = newRange;

            this.element.dispatchEvent(new CustomEvent('rangechange'));

            this.#updateDayColumns(newRange.start - oldRange.start);
        })();
    }

    constructor(parentElement, hourHeight) {
        this.element = createElement('div', parentElement, { id: 'st-start-schedule', style: `--hour-height: ${hourHeight}px` });
        this.#initialise();
    }

    async #initialise() {
        this.#progressBar = createElement('div', this.element, { id: 'st-start-schedule-progress', class: 'st-progress-bar' })
        createElement('div', this.#progressBar, { class: 'st-progress-bar-value indeterminate' })

        let ticksWrapper = element('div', 'st-start-ticks-wrapper', this.element);
        for (let i = 0; i <= 24; i += 0.5) {
            createElement('div', ticksWrapper, { classList: [`st-start-tick`, Number.isInteger(i) ? 'whole' : 'half'], style: `--start-time: ${i}` });
        }

        this.#scheduleWrapper = element('div', 'st-start-schedule-wrapper', this.element);
        this.#scheduleWrapper.parentElement.scrollTop = 8.0 * this.hourHeight; // Scroll to 8:00

        await this.#fetchAndAppendEvents(dates.gatherStart, dates.gatherEnd);

        this.element.dispatchEvent(new CustomEvent('contentloaded'));

        this.#scheduleWrapper.addEventListener('eventchanged', async () => {
            // Clear all cached elements with keys containing 'event'
            Object.keys(magisterApi.cache).forEach(key => {
                if (key.includes('event')) delete magisterApi.cache[key];
            });

            // Clear the state and completely redraw the schedule
            this.days = [];
            this.#scheduleWrapper.innerHTML = '';
            await this.#fetchAndAppendEvents(dates.gatherStart, dates.gatherEnd);
            this.#updateDayColumns();
        });

        this.#updateDayColumns();
    }

    #fetchAndAppendEvents(gatherStart, gatherEnd) {
        return new Promise(async (resolve, _) => {
            console.info(`Fetching events between ${gatherStart} and ${gatherEnd}...`);
            this.#progressBar.dataset.visible = true;

            let events = await magisterApi.events(gatherStart, gatherEnd);
            for (let i = 0; i <= Math.ceil((gatherEnd - gatherStart) / (1000 * 60 * 60 * 24)); i++) {
                const date = midnight(gatherStart, i);
                if (this.days.some(day => day.date.getTime() === date.getTime())) continue;

                const eventsOfDay = events.filter(event => {
                    const startDate = new Date(event.Start);
                    return (startDate - date) < 86400000 && (startDate - date) >= 0;
                });

                if (i === Math.ceil((gatherEnd - gatherStart) / (1000 * 60 * 60 * 24)) && eventsOfDay.length < 1) break;
                if (this.#scheduleWrapper.querySelector(`.st-start-schedule-day[data-date="${date.toISOString()}"]`)) continue;
                this.days.push(new ScheduleDay(date, eventsOfDay, this.#scheduleWrapper));
            }
            resolve();

            this.#progressBar.dataset.visible = false;
        })
    }

    async #updateDayColumns(difference = 0) {
        this.#scheduleWrapper.dataset.navigate = 'still';

        for (const day of this.days) {
            // If the column should be shown, populate it with events
            if (!day.rendered && this.isInRange(day.date)) await day.drawEvents();

            setTimeout(() => {
                day.element.dataset.visible = this.isInRange(day.date);

                if (this.isInRange(day.date)) {
                    day.element.dataset.leftmost = day.date.getTime() === this.#scheduleRange.start.getTime();
                    day.element.dataset.rightmost = day.date.getTime() === this.#scheduleRange.end.getTime();
                }
            }, difference !== 0 ? 60 : 0);
        }

        // Update the scheduleWrapper's navigate attribute to trigger the CSS animation
        setTimeout(() => {
            this.#scheduleWrapper.dataset.navigate = difference > 0 ? 'forwards' : difference < 0 ? 'backwards' : 'still';
        }, 5);
    }

    isInRange(date) {
        return date >= this.#scheduleRange.start && date <= this.#scheduleRange.end;
    }
}

class ScheduleDay {
    date;
    events;
    element;
    rendered = false;

    constructor(date, eventsArray, parentElement) {
        this.date = date;
        this.events = this.#calculateEventOverlap(eventsArray);

        this.element = createElement('div', null, {
            class: 'st-start-schedule-day',
            dataset: {
                visible: false,
                date: date.toISOString()
            }
        })

        const siblings = Array.from(parentElement.children);
        const index = siblings.findIndex(sibling => new Date(sibling.dataset.date) > date);
        if (index === -1) {
            parentElement.appendChild(this.element);
        } else {
            parentElement.insertBefore(this.element, siblings[index]);
        }

        this.element.addEventListener('eventchanged', () => parentElement.dispatchEvent(new CustomEvent('eventchanged')));
    }

    get isToday() {
        return this.date.getTime() === dates.today.getTime();
    }

    get isTomorrow() {
        return this.date.getTime() === dates.tomorrow.getTime();
    }

    get isPast() {
        return this.date.getTime() < dates.today.getTime();
    }

    get hasFutureEvents() {
        return this.events.some(event => new Date(event.Einde).getTime() > dates.now.getTime());
    }

    async drawEvents() {
        return new Promise((resolve, _) => {
            this.events.forEach(event => {
                const eventWrapperElement = createElement('div', this.element, {
                    class: event.DuurtHeleDag ? "st-event-wrapper all-day" : "st-event-wrapper", textContent: event.title, style: {
                        top: `calc(${event.startH} * var(--hour-height))`,
                        height: `calc(${event.durationH} * var(--hour-height))`,
                        left: `calc(${event.left} * 100%)`,
                        width: `calc(${event.width} * 100%)`,
                        borderTopLeftRadius: this.events.some(el => el.Einde === event.Start) ? 0 : 'var(--st-border-radius)',
                        borderTopRightRadius: this.events.some(el => el.Einde === event.Start) ? 0 : 'var(--st-border-radius)',
                        borderBottomLeftRadius: this.events.some(el => el.Start === event.Einde) ? 0 : 'var(--st-border-radius)',
                        borderBottomRightRadius: this.events.some(el => el.Start === event.Einde) ? 0 : 'var(--st-border-radius)',
                    }
                });

                const eventElement = createElement('div', eventWrapperElement, {
                    class: 'st-event',
                    dataset: {
                        temporalType: 'ongoing-check',
                        temporalStart: event.Start,
                        temporalEnd: event.Einde
                    }
                });

                // Event click handler
                eventWrapperElement.addEventListener('click', () => new ScheduleEventDialog(event, this.element).show());

                // Draw the school hour label
                let eventHours = (event.LesuurVan === event.LesuurTotMet) ? event.LesuurVan : `${event.LesuurVan}-${event.LesuurTotMet}`
                const eventNumberEl = element('div', `st-event-${event.Id}-school-hours`, eventElement, { class: 'st-event-number', innerText: eventHours })
                if (event.Type === 1) {
                    eventNumberEl.classList.add('icon')
                    eventNumberEl.innerText = '' // Icon: user-lock
                } else if (event.Type === 16) {
                    eventNumberEl.classList.add('icon')
                    eventNumberEl.innerText = '' // Icon: user-edit
                } else if (!eventNumberEl.innerText) {
                    eventNumberEl.classList.add('icon')
                    eventNumberEl.innerText = '' // Icon: calendar-day
                }

                // Cancelled label
                if (event.Status == 4 || event.Status == 5) {
                    eventElement.dataset.cancelled = true
                }

                // Draw the event details
                const eventDetailsEl = element('div', `st-event-${event.Id}-details`, eventElement, {
                    class: 'st-event-details'
                })
                const eventTitleWrapperEl = element('span', `st-event-${event.Id}-title`, eventDetailsEl, { class: 'st-event-title' })
                if (listViewEnabled) {
                    element('b', null, eventTitleWrapperEl, { innerText: event.Lokatie ? `${event.Omschrijving} (${event.Lokatie})` : event.Omschrijving })
                } else {
                    element('b', null, eventTitleWrapperEl, { innerText: eventSubjects(event) || event.Omschrijving })
                    if (eventLocations(event)?.length > 0) element('span', null, eventTitleWrapperEl, { innerText: ` (${eventLocations(event)})` })
                }

                // Render the time label
                element('span', `st-event-${event.Id}-time`, eventDetailsEl, { class: 'st-event-time', innerText: event.DuurtHeleDag ? 'Hele dag' : new Date(event.Start).getFormattedTime() + '–' + new Date(event.Einde).getFormattedTime() })

                // Render the teacher label
                if (!listViewEnabled && eventTeachers(event)?.length > 0) {
                    const eventTeacherEl = element('span', `st-event-${event.Id}-teacher`, eventDetailsEl, { class: 'st-event-teacher', innerText: eventTeachers(event) })
                    if (eventTeacherEl.innerText.includes('jeb_')) eventTeacherEl.setAttribute('style', 'animation: rainbow 5s linear 0s infinite; color: var(--st-accent-warn)')
                    if (eventTeacherEl.innerText.includes('dinnerbone')) eventTeacherEl.style.scale = '1 -1'
                }

                // Parse and render any chips
                let chips = getEventChips(event)

                const eventChipsWrapperEl = element('div', `st-event-${event.Id}-chips`, eventElement, { class: 'st-event-chips st-chips-wrapper' })
                chips.forEach(chip => {
                    element('span', `st-event-${event.Id}-chip-${chip.name}`, eventChipsWrapperEl, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                })
            });

            this.rendered = true;

            resolve();
        })
    }

    #calculateEventOverlap(array) {
        // Step 1: Add event details
        array = array.map(item => {
            // const endDate = new Date(item.Einde)
            // if (item.DuurtHeleDag) {
            //     item.Einde = new Date(new Date(endDate).setTime(endDate.getTime() + 86399000)).toISOString();
            // }
            item.startH = new Date(item.Start).getHoursWithDecimals();
            item.endH = new Date(item.Einde).getHoursWithDecimals();
            item.durationH = item.endH - item.startH;
            return item;
        })
            // Step 2: Sort events by start time
            .sort((a, b) => a.startH - b.startH);


        let activeColumns = []; // Tracks currently overlapping events

        array.forEach(event => {
            // Remove finished events from activeColumns
            activeColumns = activeColumns.filter(e => e.endH > event.startH);

            // Assign the first available column index
            let columnIndex = 0;
            while (activeColumns.some(e => e.column === columnIndex)) {
                columnIndex++;
            }

            event.column = columnIndex;
            activeColumns.push(event);

            // Find max simultaneous overlaps for this event
            event.maxOverlap = activeColumns.length;
        });

        // Step 3: Compute width dynamically based on maxOverlap
        array.forEach(event => {
            // Get max overlap for events in the same timeslot
            let overlappingEvents = array.filter(e =>
                (e.startH < event.endH && e.endH > event.startH)
            );
            let maxColumns = Math.max(...overlappingEvents.map(e => e.column + 1));

            event.width = 1 / maxColumns; // Take up only necessary space
            event.left = (event.column / maxColumns); // Adjust left position
        });

        return array;
    }
}

class ScheduleEventDialog extends Dialog {
    event;
    #progressBar;
    #invokerElement;

    constructor(event, invokerElement) {
        super({
            buttons: [{
                innerText: i18n('viewInAgenda'),
                callback: () => {
                    window.location.hash = `#/agenda/${(event.Type === 1 || event.Type === 16) ? 'afspraak' : 'huiswerk'}/${event.Id}?returnUrl=%252Fvandaag`;
                    this.close();
                }
            }]
        });
        this.body.classList.add('st-event-dialog');

        this.event = event;
        this.#invokerElement = invokerElement;

        this.#progressBar = createElement('div', this.element, { class: 'st-progress-bar' })
        createElement('div', this.#progressBar, { class: 'st-progress-bar-value indeterminate' })

        const column1 = createElement('div', this.body, { class: 'st-event-dialog-column' });
        createElement('h3', column1, { class: 'st-section-heading', innerText: (event.Type === 1 || event.Type === 16) ? 'Afspraakdetails' : 'Lesdetails' });

        let table1 = createElement('table', column1, { class: 'st' });

        this.#addRowToTable(table1, i18n('title'), event.Omschrijving || i18n('unknown'));
        this.#addRowToTable(table1, i18n('subject'), eventSubjects(event) || i18n('unknown'));
        this.#addRowToTable(table1, i18n('schoolHour'), event.LesuurVan ? (event.LesuurVan === event.LesuurTotMet) ? event.LesuurVan : `${event.LesuurVan}–${event.LesuurTotMet}` : i18n('unknown'));
        const dateFormat = { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
        if (isYearNotCurrent(new Date(event.Start)) || isYearNotCurrent(new Date(event.Einde))) dateFormat.year = 'numeric';
        this.#addRowToTable(table1, i18n('start'), new Date(event.Start).toLocaleString(locale, dateFormat));
        this.#addRowToTable(table1, i18n('end'), new Date(event.Einde).toLocaleString(locale, dateFormat));
        this.#addRowToTable(table1, i18n('location'), eventLocations(event) || i18n('unknown'));
        this.#addRowToTable(table1, i18n('teacher'), eventTeachers(event) || i18n('unknown'));
        if (event.Opmerking) this.#addRowToTable(table1, i18n('note'), event.Opmerking);
        if (event.Herhaling) this.#addRowToTable(table1, i18n('repetition'), i18n('untilDate', { date: new Date(event.Herhaling.EindDatum).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }));

        let chips = getEventChips(event);
        if (chips.length > 0) {
            const chipsWrapper = this.#addRowToTable(table1, i18n('extra'));
            chipsWrapper.classList.add('st-chips-wrapper');
            chipsWrapper.style.justifyContent = 'flex-start';
            chips.forEach(chip => createElement('span', chipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name }));
        }

        this.#loadAdditionalEventInfo();
    }

    async #loadAdditionalEventInfo() {
        const moreInfo = await magisterApi.event(this.event.Id);
        if (moreInfo) this.event = { ...this.event, ...moreInfo };
        this.#progressBar.dataset.visible = false;

        if (this.event.Type === 7) {
            const kwtColumn = createElement('div', this.body, { class: 'st-event-dialog-column' });
            createElement('h3', kwtColumn, { class: 'st-section-heading', innerText: i18n('register') });

            const kwtChoices = await magisterApi.kwtChoices(new Date(this.event.Start), new Date(this.event.Einde));

            console.log(kwtChoices)

            if (kwtChoices?.[0]?.Keuzes?.[0]) {
                kwtChoices[0].Keuzes.forEach(choice => {
                    const percentageFull = parseInt(choice.AantalDeelnemers) / parseInt(choice.MaxDeelnemers)
                    const label = createElement('label', kwtColumn, { class: 'st-checkbox-label st-start-kwt-choice', for: `st-start-${choice.Id}-kwt-choice` });
                    createElement('b', label, { innerText: choice.Omschrijving.toSentenceCase() });
                    createElement('span', label, { innerText: ` (${eventLocations(choice)})` });
                    createElement('span', label, { innerText: `(${choice.AantalDeelnemers}/${choice.MaxDeelnemers}${percentageFull === 1 ? ', vol' : ''})`, class: percentageFull > 0.85 ? 'st-tip nearly-full' : 'st-tip' });
                    createElement('span', label, { innerText: `\n${eventTeachers(choice)}` });
                    const input = createElement('input', label, { id: `st-start-${choice.Id}-kwt-choice`, class: 'st-checkbox-input', type: 'checkbox' });
                    input.checked = choice.Status == 2;
                    input.disabled = true || !kwtChoices[0].MagInschrijven;
                    // input.addEventListener('input', async () => {
                    //     this.#progressBar.dataset.visible = true;
                    //     // await magisterApi.putEvent(this.event.Id, { ...(await magisterApi.event(this.event.Id)), Afgerond: input.checked });
                    //     this.#invokerElement.dispatchEvent(new CustomEvent('eventchanged'));
                    //     choice.Status == 2
                    //     this.#progressBar.dataset.visible = false;
                    // })
                });
                createElement('span', kwtColumn, { innerText: "Schrijf je in via de agenda. Klik op onderstaande knop." });
            } else {
                createElement('span', kwtColumn, { innerText: "KWT-keuzes konden niet worden geladen." });
            }
        }

        if (this.event.Inhoud?.length > 0) {
            const infoTypes = {
                1: { name: i18n('chips.hw'), type: 'info' },
                2: { name: i18n('chips.pw'), type: 'important' },
                3: { name: i18n('chips.prelim'), type: 'important' },
                4: { name: i18n('chips.so'), type: 'important' },
                5: { name: i18n('chips.mo'), type: 'important' },
                6: { name: i18n('chips.info'), type: 'info' },
            };

            const homeworkColumn = createElement('div', this.body, { class: 'st-event-dialog-column' });
            createElement('h3', homeworkColumn, { class: 'st-section-heading', innerText: infoTypes[this.event.InfoType].name });

            createElement('div', homeworkColumn, { class: 'st-event-dialog-event-content', innerHTML: this.event.Inhoud });

            const label = createElement('label', homeworkColumn, { class: 'st-checkbox-label', for: `st-start-${this.event.Id}-hw-complete`, innerText: i18n('completed') });
            const input = createElement('input', label, { id: `st-start-${this.event.Id}-hw-complete`, class: 'st-checkbox-input', type: 'checkbox' });
            input.checked = this.event.Afgerond;
            input.addEventListener('input', async () => {
                this.#progressBar.dataset.visible = true;
                await magisterApi.putEvent(this.event.Id, { ...(await magisterApi.event(this.event.Id)), Afgerond: input.checked });
                this.#invokerElement.dispatchEvent(new CustomEvent('eventchanged'));
                this.event.Afgerond = input.checked;
                this.body.querySelectorAll('.st-chip').forEach(chip => {
                    if (chip.innerText === i18n('chips.hw')) {
                        chip.classList.toggle('ok', input.checked);
                        chip.classList.toggle('info', !input.checked);
                    }
                });
                this.#progressBar.dataset.visible = false;
            });

            let table2 = createElement('table', homeworkColumn, { class: 'st' });

            const dateFormat = { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            if (isYearNotCurrent(new Date(this.event.TaakAangemaaktOp)) || isYearNotCurrent(new Date(this.event.TaakGewijzigdOp))) dateFormat.year = 'numeric';
            this.#addRowToTable(table2, i18n('added'), this.event.TaakAangemaaktOp ? new Date(this.event.TaakAangemaaktOp).toLocaleString(locale, dateFormat) : i18n('unknown'));
            this.#addRowToTable(table2, i18n('lastModified'), this.event.TaakGewijzigdOp ? new Date(this.event.TaakGewijzigdOp).toLocaleString(locale, dateFormat) : i18n('unknown'));
        }

        console.log(this.event);

        if (this.event.Bijlagen?.length > 0) {
            const fileTypes = [
                { extensions: ['pdf'], icon: '' },
                { extensions: ['txt', 'md'], icon: '' },
                { extensions: ['doc', 'docx', 'odt', 'csv'], icon: '', name: 'Word' },
                { extensions: ['ppt', 'pptx', 'odp'], icon: '', name: 'PowerPoint' },
                { extensions: ['xls', 'xlsx', 'ods'], icon: '', name: 'Excel' },
                { extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'], icon: '' },
                { extensions: ['svg', 'eps'], icon: '' },
                { extensions: ['mp3', 'wav', 'avi', 'ogg'], icon: '' },
                { extensions: ['mp4', 'mov'], icon: '' },
                { extensions: ['zip', '7z', 'rar', 'tar', 'gz'], icon: '' },
                { extensions: ['exe', 'msi', 'cad'], icon: '' },
            ];

            const attachmentsColumn = createElement('div', this.body, { class: 'st-event-dialog-column' });
            createElement('h3', attachmentsColumn, { class: 'st-section-heading', innerText: this.event.Bijlagen.length > 1 ? i18n('attachments') : i18n('attachment') });

            this.event.Bijlagen.forEach(bijlage => {
                let fileType = fileTypes.find(type => type.extensions.some(ext => bijlage.Naam.toLowerCase().endsWith(ext)));

                const fileButton = attachmentsColumn.createChildElement('button', { class: 'st-button secondary st-event-dialog-event-attachment', innerText: bijlage.Naam, dataset: { icon: fileType?.icon || '' } });
                fileButton.addEventListener('click', async () => window.open((await magisterApi.eventAttachment(bijlage.Id)).location, '_blank'));
                fileButton.addEventListener('auxclick', async (e) => {
                    e.preventDefault();
                    const locationUrl = (await magisterApi.eventAttachment(bijlage.Id)).location;
                    const file = await fetch(locationUrl);
                    const blob = new Blob([await file.blob()], { type: bijlage.ContentType });
                    window.open(URL.createObjectURL(blob), '_blank');
                });

                let table2 = createElement('table', attachmentsColumn, { class: 'st' });
                this.#addRowToTable(table2, i18n('fileSize'), bijlage.Grootte ? `${Math.ceil(bijlage.Grootte / 1024)} ${i18n('units.kibibyte')}` : i18n('unknown'));
                this.#addRowToTable(table2, i18n('fileType'), i18n('typeFile', { type: fileType?.name || /(?:\.([^.]+))?$/.exec(bijlage.Naam.toUpperCase())[1] }));
                const dateFormat = { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' };
                if (isYearNotCurrent(new Date(bijlage.Datum))) dateFormat.year = 'numeric';
                this.#addRowToTable(table2, i18n('uploaded'), bijlage.Datum ? new Date(bijlage.Datum).toLocaleString(locale, dateFormat) : i18n('unknown'));
            });
        }
    }

    #addRowToTable(parentElement, label, value) {
        let row = createElement('tr', parentElement);
        createElement('td', row, { innerText: label || '' });
        return createElement('td', row, { innerText: value || '' });
    }
}

