let persistedScheduleView = localStorage['start-schedule-persisted-view'], persistedScheduleDate;

class Schedule {
    element;
    days = {};
    #body;
    #header;
    headerControls = {};
    #progressBar;

    #hourHeight = 110;
    get hourHeight() { return this.#hourHeight; }
    set hourHeight(newHeight) {
        const newScroll = this.#body.scrollTop / this.#hourHeight * newHeight;
        this.#hourHeight = Math.min(Math.max(45, newHeight), 450);
        this.element.style.setProperty('--hour-height', `${newHeight}px`);
        this.#body.scrollTop = newScroll;
        localStorage['start-hour-height'] = newHeight;
        // saveToStorage('start-hour-height', newHeight, 'local');
    }

    set scheduleView(newView) {
        switch (newView) {
            case 'workweek': this.scheduleSize = 5; this.snapToMonday = true; break;
            case 'week': this.scheduleSize = 7; this.snapToMonday = true; break;
            case 'day': this.scheduleSize = 1; this.snapToMonday = false; break;
            default: this.scheduleSize = parseInt(newView.replace('day', '')); this.snapToMonday = false; break;
        };
        persistedScheduleView = newView;
        if (syncedStorage['start-schedule-view-persist']) localStorage['start-schedule-persisted-view'] = newView;
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
        this.element.style.setProperty('--size', this.#scheduleSize.toString());
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
        persistedScheduleDate = this.#scheduleDate;
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
            if (!Object.values(this.days).some(day => day.date.getTime() === newRange.start.getTime())) {
                await this.#fetchAndAppendEvents(
                    midnight(newRange.start, -13),
                    midnight(newRange.end, 1)
                );
            }
            if (!Object.values(this.days).some(day => day.date.getTime() === newRange.end.getTime())) {
                await this.#fetchAndAppendEvents(
                    midnight(newRange.start, 0),
                    midnight(newRange.end, 14)
                );
            }

            this.#scheduleRange = newRange;

            await this.#updateDayColumns();
            this.#updateHeaderStrip();
        })();
    }

    constructor(parentElement, hourHeight) {
        this.#hourHeight = hourHeight;
        this.element = createElement('div', parentElement, {
            id: 'st-sch',
            class: listViewEnabled ? 'list-view' : '',
            style: {
                '--hour-height': `${hourHeight}px`,
                '--size': this.#scheduleSize
            },
        });
        this.#initialise();
    }

    async #initialise() {
        this.#progressBar = createElement('div', this.element, { id: 'st-sch-progress', class: 'st-progress-bar' });
        createElement('div', this.#progressBar, { class: 'st-progress-bar-value indeterminate' });

        this.#header = element('div', 'st-start-header', this.element);

        this.#body = this.element.createChildElement('div', { id: 'st-sch-body' });
        this.#body.scrollTop = 8.25 * this.hourHeight; // Scroll to 8:00

        await this.#fetchAndAppendEvents(dates.gatherStart, dates.gatherEnd);

        await this.#updateDayColumns();
        await this.#createHeaderStrip();
        this.#updateHeaderStrip();

        if (persistedScheduleDate) this.scheduleDate = persistedScheduleDate;
        if (persistedScheduleView) this.scheduleView = persistedScheduleView;

        if (!persistedScheduleDate && !persistedScheduleView && showNextDaySetting) {
            let nextDayWithEvents = Object.values(this.days).find(day => day.hasFutureEvents);
            if (nextDayWithEvents && !nextDayWithEvents.isToday) {
                this.scheduleDate = nextDayWithEvents.date;
                notify('snackbar',
                    i18n('toasts.jumpedToDate', { date: this.scheduleDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) })
                    + (this.scheduleDate.isTomorrow() ? ` (${i18n('dates.tomorrow')})` : ''),
                );
            }
        }

    }

    /** Clear all cached elements with keys containing 'event' */
    async refresh() {
        Object.keys(magisterApi.cache).forEach(key => {
            if (['event', 'kwt'].some(type => key.includes(type))) delete magisterApi.cache[key];
        });

        this.redraw();
    }

    /** Clear the state and completely redraw the schedule */
    async redraw() {
        this.days = {};
        this.#body.querySelectorAll('.st-sch-day-body').forEach(day => day.remove());
        this.#header.querySelectorAll('.st-sch-day-head').forEach(day => day.remove());
        await this.#fetchAndAppendEvents(dates.gatherStart, dates.gatherEnd);
        this.#updateDayColumns();
    }

    #fetchAndAppendEvents(gatherStart, gatherEnd) {
        return new Promise(async (resolve, _) => {
            console.debug(`Fetching events between ${gatherStart} and ${gatherEnd}...`);
            this.#progressBar.dataset.visible = true;

            let events = await magisterApi.events(gatherStart, gatherEnd);
            for (let i = 0; i <= Math.ceil((gatherEnd - gatherStart) / (1000 * 60 * 60 * 24)); i++) {
                const date = midnight(gatherStart, i);
                if (Object.values(this.days).some(day => day.date.getTime() === date.getTime())) continue;

                const eventsOfDay = events.filter(event => {
                    const startDate = new Date(event.Start);
                    return (startDate.getTime() - date.getTime()) < 86400000 && (startDate.getTime() - date.getTime()) >= 0;
                });

                if (i === Math.ceil((gatherEnd - gatherStart) / (1000 * 60 * 60 * 24)) && eventsOfDay.length < 1) break;
                if (this.days[date.toISOString()] || this.#header.querySelector(`#st-sch-day-body-${date.getTime()}`)) continue;
                this.days[date.toISOString()] = new ScheduleDay(date, eventsOfDay, this.#body, this.#header);
            }
            resolve();

            this.#progressBar.dataset.visible = false;
        })
    }

    #updateDayColumns() {
        return new Promise(async (resolve, _) => {
            let difference = this.#scheduleDate.getTime() - new Date(this.element.dataset.date).getTime();

            for (const day of Object.values(this.days)) {
                // If the column should be shown, populate it with events
                if ((!day.rendered) && this.positionInRange(day.date) > -1) await day.drawContents();

                setTimeout(() => {
                    day.body.dataset.visible = this.positionInRange(day.date) > -1;
                    day.body.style.setProperty('--index', this.positionInRange(day.date));
                    day.head.dataset.visible = this.positionInRange(day.date) > -1;
                    day.head.style.setProperty('--index', this.positionInRange(day.date));
                }, difference !== 0 ? 60 : 0);
            }

            // Update the scheduleWrapper's navigate attribute to trigger the CSS animation
            this.#body.dataset.navigate = 'still';
            setTimeout(() => {
                this.#body.dataset.navigate = difference > 0 ? 'forwards' : difference < 0 ? 'backwards' : 'still';
                this.element.dataset.size = this.#scheduleSize.toString();
                this.element.dataset.date = this.#scheduleDate.toISOString();

                resolve();
            }, difference !== 0 ? 5 : 0);
        });
    }

    positionInRange(date) {
        if (date >= this.#scheduleRange.start && date <= this.#scheduleRange.end) {
            return Math.round((date.getTime() - this.#scheduleRange.start.getTime()) / 86400000);
        } else return -1;
    }

    #createHeaderStrip() {
        return new Promise((resolve, _) => {
            let headerStrip = this.#header.createChildElement('div', { id: 'st-start-header-strip' });

            let headerTextWrapper = headerStrip.createChildElement('button', {
                id: 'st-start-header-text-wrapper',
                class: (persistedScheduleDate || persistedScheduleView) ? '' : 'greet',
                title: i18n('selectDate'),
            });
            headerTextWrapper.addEventListener('click', () => {
                const dialog = new Dialog({ closeText: i18n('done'), closeIcon: '' });
                dialog.body.createChildElement('h3', { class: 'st-section-heading', innerText: i18n('selectDate') });
                const input = dialog.body.createChildElement('input', {
                    class: 'st-input',
                    type: 'date',
                    value: `${this.scheduleDate.getFullYear()}-${String(this.scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(this.scheduleDate.getDate()).padStart(2, '0')}`,
                });
                dialog.on('close', () => this.scheduleDate = new Date(input.value));
                dialog.show();
                input.focus();
                input.showPicker();
            });
            headerTextWrapper.addEventListener('auxclick', (e) => {
                e.preventDefault();
                let greeting = document.getElementById('st-start-header-greeting');
                if (headerTextWrapper.classList.contains('greet')) return;
                createGreetingMessage(greeting);
                headerTextWrapper.classList.add('greet');
                setTimeout(() => headerTextWrapper.classList.remove('greet'), 2000);
            });

            this.headerControls.title = headerTextWrapper.createChildElement('span', {
                id: 'st-start-header-title',
                class: 'st-title',
                innerText: i18n('loading').replace('.', ''),
            });
            this.headerControls.shortTitle = headerTextWrapper.createChildElement('span', {
                id: 'st-start-header-short-title',
                class: 'st-title',
                innerText: i18n('loading').replace('.', ''),
            });
            createGreetingMessage(headerTextWrapper.createChildElement('span', {
                id: 'st-start-header-greeting',
                class: 'st-title',
                innerText: i18n('loading').replace('.', ''),
            }));
            setTimeout(() => headerTextWrapper.classList.remove('greet'), 2000);

            let headerControls = headerStrip.createChildElement('div', { id: 'st-start-header-buttons' });

            // Buttons for moving one day backwards, moving to today's date, and moving one day forwards.
            this.headerControls.moveReset = element('button', 'st-start-today-offset-zero', headerControls, { class: 'st-button icon', 'data-icon': '', title: i18n('Vandaag'), disabled: true })
            this.headerControls.moveReset.addEventListener('click', () => {
                this.scheduleDate = dates.today;
            })
            this.headerControls.moveBackward = element('button', 'st-start-today-offset-minus', headerControls, { class: 'st-button icon', 'data-icon': '', title: i18n('Achteruit') })
            this.headerControls.moveBackward.addEventListener('click', () => {
                this.scheduleDate = this.scheduleDate.addDays(this.snapToMonday ? -7 : (-1 * this.scheduleSize));
            })
            this.headerControls.moveForward = element('button', 'st-start-today-offset-plus', headerControls, { class: 'st-button icon', 'data-icon': '', title: i18n('Vooruit') })
            this.headerControls.moveForward.addEventListener('click', () => {
                this.scheduleDate = this.scheduleDate.addDays(this.snapToMonday ? 7 : this.scheduleSize);
            })

            this.headerControls.viewMode = new Dropdown(
                createElement('button', headerControls, { id: 'st-start-today-view', class: 'st-segmented-control' }),
                {
                    'day': i18n('dates.day'), // 1 day
                    ...Object.fromEntries([2, 3, 4, 5].map(num => [`${num}day`, i18n('dates.nDays', { num })])), // 2, 3, 4, 5 days
                    'workweek': i18n('dates.workweek'), // workweek
                    'week': i18n('dates.week') // week
                },
                this.scheduleView,
                (newValue) => this.scheduleView = newValue,
                (currentValue) => currentValue === 'day' ? 'workweek' : 'day'
            );

            resolve();
        });
    }

    #updateHeaderStrip() {
        this.headerControls.moveReset.disabled = schedule.positionInRange(dates.today) > -1;

        const dateOptions = { timeZone: 'Europe/Amsterdam' };
        if (isYearNotCurrent(schedule.scheduleRange.start.getFullYear()) || isYearNotCurrent(schedule.scheduleRange.end.getFullYear())) dateOptions.year = 'numeric';

        if (schedule.snapToMonday) {
            if (schedule.scheduleRange.start.getMonth() === schedule.scheduleRange.end.getMonth()) {
                this.headerControls.title.innerText =
                    `${i18n('dates.week')} ${schedule.scheduleRange.start.getWeek()} (${schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, month: 'long' })})`;
                this.headerControls.shortTitle.innerText =
                    `${i18n('dates.weekShort')} ${schedule.scheduleRange.start.getWeek()} (${schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, month: 'short' })})`;

            } else {
                this.headerControls.title.innerText =
                    `${i18n('dates.week')} ${schedule.scheduleRange.start.getWeek()} (${schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, month: 'short' })}–${schedule.scheduleRange.end.toLocaleDateString(locale, { ...dateOptions, month: 'short' })})`;
                this.headerControls.shortTitle.innerText =
                    `${i18n('dates.weekShort')} ${schedule.scheduleRange.start.getWeek()} (${schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, month: 'short' })}–${schedule.scheduleRange.end.toLocaleDateString(locale, { ...dateOptions, month: 'short' })})`;
            }
        } else if (schedule.scheduleSize > 1) {
            if (schedule.scheduleRange.start.getMonth() === schedule.scheduleRange.end.getMonth()) {
                this.headerControls.title.innerText = this.headerControls.shortTitle.innerText =
                    `${schedule.scheduleRange.start.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric' })}–${schedule.scheduleRange.end.toLocaleDateString(locale, { ...dateOptions, weekday: 'short', day: 'numeric', month: 'long' })}`;
            } else {
                this.headerControls.title.innerText = this.headerControls.shortTitle.innerText =
                    `${schedule.scheduleRange.start.toLocaleDateString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short' })}–${schedule.scheduleRange.end.toLocaleDateString(locale, { ...dateOptions, weekday: 'short', day: 'numeric', month: 'short' })}`;
            }
        } else {
            this.headerControls.title.innerText = schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, weekday: 'long', month: 'long', day: 'numeric' });
            this.headerControls.shortTitle.innerText = schedule.scheduleRange.start.toLocaleDateString(locale, { ...dateOptions, weekday: 'short', month: 'short', day: 'numeric' });
        }

        this.headerControls.title.classList.toggle('not-today', schedule.scheduleDate.getTime() !== dates.today.getTime());
        this.headerControls.shortTitle.classList.toggle('not-today', schedule.scheduleDate.getTime() !== dates.today.getTime());
    }
}

class ScheduleDay {
    date;
    events;
    body;
    head;
    #nowMarker;
    rendered = false;
    #interval;

    constructor(date, eventsArray, body, header) {
        this.date = date;
        this.events = this.#calculateEventOverlap(eventsArray);

        // Create the day head
        this.head = createElement('div', null, {
            class: 'st-sch-day-head',
            id: `st-sch-day-head-${date.getTime()}`,
            dataset: {
                visible: false,
                date: date.toISOString()
            }
        })

        // Create the day body
        this.body = createElement('div', null, {
            class: 'st-sch-day-body',
            id: `st-sch-day-body-${date.getTime()}`,
            dataset: {
                visible: false,
                date: date.toISOString()
            }
        })

        // Append the elements in their appropriate DOM positions based on the date
        const index = Array.from(header.children).findIndex(sibling => new Date(sibling.dataset.date) > date);
        if (index === -1) {
            body.appendChild(this.body);
            header.appendChild(this.head);
        } else {
            body.insertBefore(this.body, Array.from(body.children)[index]);
            header.insertBefore(this.head, Array.from(header.children)[index]);
        }
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

    async drawContents() {
        return new Promise((resolve, _) => {
            this.head.innerText = '';
            this.body.innerText = '';

            const dateFormat = { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short' };
            if (isYearNotCurrent(this.date)) dateFormat.year = 'numeric';
            this.head.createChildElement('span', {
                class: this.isToday ? 'st-sch-day-date today' : 'st-sch-day-date',
                innerText: this.date.toLocaleDateString(locale, dateFormat)
            });

            if (!this.events?.length) {
                this.head.createChildElement('span', {
                    class: 'st-sch-day-no-events',
                    innerText: this.isToday
                        ? i18n('noEventsToday')
                        : i18n('noEvents')
                });
            }

            for (const event of this.events) {
                const eventWrapperElement = createElement('div', event.DuurtHeleDag ? this.head : this.body, {
                    classList: ['st-event-wrapper', syncedStorage['start-event-display'] || 'normal'],
                    textContent: event.title,
                    style: {
                        '--top': `calc(${event.startH} * var(--hour-height))`,
                        '--height': `calc(${event.durationH} * var(--hour-height))`,
                        '--left': `calc(${event.left} * 100%)`,
                        '--width': `calc(${event.width} * 100%)`,
                        '--border-top-left-radius': this.events.some(el => el.Einde === event.Start) ? 0 : 'var(--st-border-radius)',
                        '--border-top-right-radius': this.events.some(el => el.Einde === event.Start) ? 0 : 'var(--st-border-radius)',
                        '--border-bottom-left-radius': this.events.some(el => el.Start === event.Einde) ? 0 : 'var(--st-border-radius)',
                        '--border-bottom-right-radius': this.events.some(el => el.Start === event.Einde) ? 0 : 'var(--st-border-radius)',
                    }
                });

                const eventElement = createElement('div', eventWrapperElement, {
                    classList: ['st-event',],
                    dataset: {
                        start: event.Start,
                        end: event.Einde,
                        ongoing: new Date(event.Start) < dates.now && new Date(event.Einde) > dates.now
                    }
                });

                // Event click handler
                eventWrapperElement.addEventListener('click', () => {
                    if (syncedStorage['start-event-details'])
                        new ScheduleEventDialog(event).show();
                    else
                        window.location.hash = `#/agenda/${(event.Type === 1 || event.Type === 16) ? 'afspraak' : 'huiswerk'}/${event.Id}?returnUrl=%252Fvandaag`;
                });

                // Draw the school hour label
                let eventHours = (event.LesuurVan === event.LesuurTotMet) ? event.LesuurVan : `${event.LesuurVan}-${event.LesuurTotMet}`
                const eventNumberEl = eventElement.createChildElement('div', { class: 'st-event-number', innerText: eventHours })
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
                    eventElement.dataset.cancelled = 'true';
                }

                // Draw the event details
                const eventDetailsEl = eventElement.createChildElement('div', { class: 'st-event-details' });

                const eventTitleWrapperEl = eventDetailsEl.createChildElement('span', { class: 'st-event-title' });

                eventTitleWrapperEl.createChildElement('b', {
                    innerText: syncedStorage['start-event-display'] === 'legacy'
                        ? event.Omschrijving
                        : eventSubjects(event) || event.Omschrijving?.split('-')[0]
                });

                if (eventLocations(event)?.length > 0) {
                    eventTitleWrapperEl.createChildElement('span', {
                        innerText: ` (${eventLocations(event)})`
                    });
                }

                // Render the time label
                eventDetailsEl.createChildElement('span', { class: 'st-event-time', innerText: event.DuurtHeleDag ? i18n('allDay') : new Date(event.Start).getFormattedTime() + '–' + new Date(event.Einde).getFormattedTime() })

                // Render the teacher label
                if (syncedStorage['start-event-display'] !== 'legacy' && eventTeachers(event)?.length > 0) {
                    const eventTeacherEl = eventDetailsEl.createChildElement('span', { class: 'st-event-teacher', innerText: eventTeachers(event) })
                    if (eventTeacherEl.innerText.includes('jeb_')) eventTeacherEl.setAttribute('style', 'animation: rainbow 5s linear 0s infinite; color: var(--st-accent-warn)')
                    if (eventTeacherEl.innerText.includes('dinnerbone')) eventTeacherEl.style.scale = '1 -1'
                }

                // Parse and render any chips
                let chips = getEventChips(event)

                const eventChipsWrapperEl = eventElement.createChildElement('div', { class: 'st-event-chips st-chips-wrapper' })
                chips.forEach(chip => {
                    eventChipsWrapperEl.createChildElement('span', { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                })
            }

            if (this.isToday) {
                if (!listViewEnabled) {
                    if (this.body.lastElementChild) this.body.lastElementChild.scrollIntoView({ behavior: 'instant', block: 'center' });
                    if (this.body.firstElementChild) this.body.firstElementChild.scrollIntoView({ behavior: 'instant', block: 'nearest' });

                    this.#nowMarker = this.body.createChildElement('div', {
                        class: 'st-now-marker',
                        style: {
                            '--top': `calc(${dates.now.getHoursWithDecimals()})`
                        }
                    });

                    if (schedule.positionInRange(this.date)) {
                        setTimeout(() => { if (this.#nowMarker) this.#nowMarker.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 200);
                    }
                }

                setTimeout(() => {
                    this.#interval = setIntervalImmediately(() => {
                        if (!this.body || (!listViewEnabled && !this.#nowMarker)) return clearInterval(this.#interval);
                        if (!listViewEnabled && this.#nowMarker) this.#nowMarker.style.setProperty('--top', `calc(${dates.now.getHoursWithDecimals()})`);
                        this.body.querySelectorAll('.st-event').forEach(event => {
                            (event instanceof HTMLElement) && (event.dataset.ongoing = ((new Date(event.dataset.start) < dates.now && new Date(event.dataset.end) > dates.now) ? 'true' : 'false'));
                        });
                    }, 30000);
                }, 60000 - (new Date().getTime() % 60000));
            }

            this.rendered = true;

            resolve();
        });
    }

    #calculateEventOverlap(array) {
        // Step 1: Add event details
        array = array.map(item => {
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

    constructor(event) {
        super({
            buttons: [{
                'data-icon': '',
                innerText: i18n('viewInAgenda'),
                callback: () => {
                    window.location.hash = `#/agenda/${(event.Type === 1 || event.Type === 16) ? 'afspraak' : 'huiswerk'}/${event.Id}?returnUrl=%252Fvandaag`;
                    this.close();
                }
            }]
        });
        this.body.classList.add('st-event-dialog');

        this.event = event;

        if (schedule?.scheduleDate && schedule.positionInRange(new Date(this.event.Start)) < 0) schedule.scheduleDate = new Date(this.event.Start);

        this.#progressBar = createElement('div', this.element, { class: 'st-progress-bar' })
        createElement('div', this.#progressBar, { class: 'st-progress-bar-value indeterminate' })

        this.#drawDialogContents();
    }

    async #drawDialogContents() {
        this.body.innerText = '';

        const column1 = createElement('div', this.body, { class: 'st-event-dialog-column' });
        createElement('h3', column1, { class: 'st-section-heading', innerText: (this.event.Type === 1 || this.event.Type === 16) ? i18n('eventDetails') : i18n('lessonDetails') });

        let table1 = createElement('table', column1, { class: 'st' });

        this.#addRowToTable(table1, i18n('title'), this.event.Omschrijving || '-');
        this.#addRowToTable(table1, i18n('subject'), eventSubjects(this.event) || '-');
        this.#addRowToTable(table1, i18n('schoolHour'), this.event.LesuurVan
            ? (this.event.LesuurVan === this.event.LesuurTotMet)
                ? i18n('schoolHourNum', { num: this.event.LesuurVan, numOrdinal: formatOrdinals(this.event.LesuurVan) })
                : i18n('closedInterval', { start: i18n('schoolHourNum', { num: this.event.LesuurVan, numOrdinal: formatOrdinals(this.event.LesuurVan) }), end: i18n('schoolHourNum', { num: this.event.LesuurTotMet, numOrdinal: formatOrdinals(this.event.LesuurTotMet) }) })
            : '-');
        const showYear = isYearNotCurrent(new Date(this.event.Start)) || isYearNotCurrent(new Date(this.event.Einde));
        this.#addRowToTable(table1, i18n('start'), new Date(this.event.Start).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', year: showYear ? 'numeric' : undefined }));
        this.#addRowToTable(table1, i18n('end'), new Date(this.event.Einde).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', year: showYear ? 'numeric' : undefined }));
        this.#addRowToTable(table1, i18n('location'), eventLocations(this.event) || '-');
        this.#addRowToTable(table1, i18n('teacher'), eventTeachers(this.event) || '-');
        if (this.event.Opmerking) this.#addRowToTable(table1, i18n('remark'), this.event.Opmerking);
        if (this.event.Herhaling) this.#addRowToTable(table1, i18n('repetition'), i18n('untilDate', { date: new Date(this.event.Herhaling.EindDatum).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }));

        let chips = getEventChips(this.event);
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
        this.#progressBar.dataset.visible = 'false';

        if (this.event.Type === 7) {
            const kwtColumn = createElement('div', this.body, { class: 'st-event-dialog-column' });
            createElement('h3', kwtColumn, { class: 'st-section-heading', innerText: i18n('register') });

            const kwtChoices = await magisterApi.kwtChoices(new Date(this.event.Start), new Date(this.event.Einde));

            if (kwtChoices?.[0]?.Keuzes?.[0]) {
                kwtChoices[0].Keuzes.forEach(choice => {
                    const percentageFull = parseInt(choice.AantalDeelnemers) / parseInt(choice.MaxDeelnemers)
                    const label = createElement('label', kwtColumn, { class: 'st-checkbox-label st-start-kwt-choice', for: `st-start-${choice.Id}-kwt-choice` });
                    createElement('b', label, { innerText: choice.Omschrijving });
                    createElement('span', label, { innerText: ` (${eventLocations(choice)})` });
                    createElement('span', label, { innerText: `(${choice.AantalDeelnemers ?? '?'}/${choice.MaxDeelnemers ?? '?'}${percentageFull === 1 ? ', vol' : ''})`, class: percentageFull > 0.85 ? 'st-tip nearly-full' : 'st-tip', title: "Aantal deelnemers" });
                    createElement('span', label, { innerText: `\n${eventTeachers(choice)}` });
                    const input = createElement('input', label, { id: `st-start-${choice.Id}-kwt-choice`, class: 'st-checkbox-input', type: 'checkbox' });
                    input.checked = choice.Status > 0;
                    input.disabled = !kwtChoices[0].MagInschrijven;
                    input.addEventListener('input', async () => {
                        this.#progressBar.dataset.visible = 'true';
                        kwtColumn.querySelectorAll('input').forEach(i => i.disabled = true);
                        try {
                            if (choice.Status == 0) {
                                await magisterApi.postKwtRegistration(choice);
                            } else {
                                await magisterApi.deleteKwtRegistration(choice.Id);
                            }
                        } catch (e) {
                            new Dialog({ innerText: (await e.json())?.Message || i18n('error') }).show();
                        } finally {
                            if (schedule?.refresh) schedule.refresh();
                            if (widgets?.refresh) widgets.refresh();
                            this.event = (await magisterApi.events(dates.gatherStart, dates.gatherEnd)).find(e => new Date(e.Start).getTime() === new Date(this.event.Start).getTime() && new Date(e.Einde).getTime() === new Date(this.event.Einde).getTime());
                            this.#drawDialogContents();
                        }
                    });
                });
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
                this.#progressBar.dataset.visible = 'true';
                await magisterApi.putEvent(this.event.Id, { ...(await magisterApi.event(this.event.Id)), Afgerond: input.checked });
                if (schedule?.refresh) schedule.refresh();
                if (widgets?.refresh) widgets.refresh();
                this.event.Afgerond = input.checked;
                this.body.querySelectorAll('.st-chip').forEach(chip => {
                    if ((chip instanceof HTMLElement) && chip.innerText === infoTypes[this.event.InfoType].name) {
                        chip.classList.toggle('ok', input.checked);
                        chip.classList.toggle('info', !input.checked);
                    }
                });
                this.#progressBar.dataset.visible = 'false';
            });

            let table2 = createElement('table', homeworkColumn, { class: 'st' });

            const showYear = (isYearNotCurrent(new Date(this.event.TaakAangemaaktOp)) || isYearNotCurrent(new Date(this.event.TaakGewijzigdOp)))
            this.#addRowToTable(table2, i18n('added'), this.event.TaakAangemaaktOp ? new Date(this.event.TaakAangemaaktOp).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', year: showYear ? 'numeric' : undefined }) : '-');
            this.#addRowToTable(table2, i18n('lastModified'), this.event.TaakGewijzigdOp ? new Date(this.event.TaakGewijzigdOp).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', year: showYear ? 'numeric' : undefined }) : '-');
        }

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
                this.#addRowToTable(table2, i18n('fileSize'), bijlage.Grootte ? `${Math.ceil(bijlage.Grootte / 1024)} ${i18n('units.kibibyte')}` : '-');
                this.#addRowToTable(table2, i18n('fileType'), i18n('typeFile', { type: fileType?.name || /(?:\.([^.]+))?$/.exec(bijlage.Naam.toUpperCase())[1] }));
                const showYear = isYearNotCurrent(new Date(bijlage.Datum));
                this.#addRowToTable(table2, i18n('uploaded'), bijlage.Datum ? new Date(bijlage.Datum).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', year: showYear ? 'numeric' : undefined }) : '-');
            });
        }

        const annotationColumn = createElement('div', this.body, { class: 'st-event-dialog-column' });
        createElement('h3', annotationColumn, { class: 'st-section-heading', innerText: i18n('annotation') });

        const annotationContents = createElement('div', annotationColumn, { class: 'st-event-dialog-event-content', innerHTML: this.event.Aantekening || '', contenteditable: true, placeholder: i18n('addAnnotation') });

        const annotationHint = annotationContents.createSiblingElement('p', { class: 'st-event-dialog-event-content-hint' });
        Object.entries({ bold: ['Ctrl', 'B'], italic: ['Ctrl', 'I'], underline: ['Ctrl', 'U'] }).forEach(([value, keys]) => {
            keys.forEach(k => annotationHint.createChildElement('kbd', { innerText: k }));
            annotationHint.createChildElement('span', { innerText: i18n(value) });
        });

        const saveButton = createElement('button', annotationColumn, { class: 'st-button st-hidden st-event-dialog-event-content-save', innerText: i18n('save') });
        saveButton.addEventListener('click', async () => {
            this.#progressBar.dataset.visible = 'true';
            await magisterApi.putEvent(this.event.Id, { ...(await magisterApi.event(this.event.Id)), Aantekening: annotationContents.innerHTML?.replace(/^\<br\>$/, '').length ? annotationContents.innerHTML : null });
            if (schedule?.refresh) schedule.refresh();
            if (widgets?.refresh) widgets.refresh();
            saveButton.classList.add('st-hidden');
            this.#progressBar.dataset.visible = 'false';
        });

        annotationContents.addEventListener('input', () => {
            annotationContents.classList.toggle('empty', annotationContents.innerHTML.replace(/^\<br\>$/, '') === '');
            saveButton.classList.toggle('st-hidden', annotationContents.innerHTML.replace(/^\<br\>$/, '') === (this.event.Aantekening || ''));
        });
    }

    #addRowToTable(parentElement, label, value) {
        let row = createElement('tr', parentElement);
        createElement('td', row, { innerText: label || '' });
        return createElement('td', row, { innerText: value || '' });
    }
}
