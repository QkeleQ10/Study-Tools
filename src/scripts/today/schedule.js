class Schedule {
    element;
    days = [];
    #scheduleWrapper;

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
        let ticksWrapper = element('div', 'st-start-ticks-wrapper', this.element);
        for (let i = 0; i <= 24; i += 0.5) {
            createElement('div', ticksWrapper, { classList: [`st-start-tick`, Number.isInteger(i) ? 'whole' : 'half'], style: `--start-time: ${i}` });
        }

        this.#scheduleWrapper = element('div', 'st-start-schedule-wrapper', this.element, { innerText: '' });
        this.#scheduleWrapper.parentElement.scrollTop = 8.5 * this.hourHeight; // Scroll to 8:30

        await this.#fetchAndAppendEvents(dates.gatherStart, dates.gatherEnd);

        this.element.dispatchEvent(new CustomEvent('contentloaded'));

        this.#updateDayColumns();
    }

    #fetchAndAppendEvents(gatherStart, gatherEnd) {
        // TODO: loading bar
        console.log(`Fetching events between ${gatherStart} and ${gatherEnd}...`);

        return new Promise(async (resolve, _) => {
            let events = await magisterApi.events(gatherStart, gatherEnd);
            for (let i = 0; i <= Math.ceil((gatherEnd - gatherStart) / (1000 * 60 * 60 * 24)); i++) {
                const date = midnight(gatherStart, i);
                if (this.days.some(day => day.date.getTime() === date.getTime())) continue;

                const eventsOfDay = events.filter(event => {
                    const startDate = new Date(event.Start);
                    return (startDate - date) < 86400000 && (startDate - date) >= 0;
                });

                if (i === Math.ceil((gatherEnd - gatherStart) / (1000 * 60 * 60 * 24)) && eventsOfDay.length < 1) break;
                this.days.push(new ScheduleDay(date, eventsOfDay, this.#scheduleWrapper));
            }
            resolve();
        })
    }

    async #updateDayColumns(difference = 0) {
        this.#scheduleWrapper.dataset.navigate = 'still';

        for (const day of this.days) {
            // If the column should be shown, populate it with events
            if (!day.rendered && this.isInRange(day.date)) await day.drawEvents();

            setTimeout(() => {
                day.element.dataset.state = this.isInRange(day.date) ? 'visible' : 'hidden';
            }, 60);
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
    element;
    rendered = false;

    constructor(date, eventsArray, parentElement) {
        this.date = date;
        this.events = this.#calculateEventOverlap(eventsArray);

        this.element = createElement('div', parentElement, {
            class: 'st-start-schedule-day',
            dataset: {
                today: this.isToday,
                tomorrow: this.isTomorrow,
                irrelevant: this.events.length < 1 || this.isPast,
            }
        })
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
                    class: "st-event-wrapper", textContent: event.title, style: {
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
                    title: [
                        event.Omschrijving || 'Geen omschrijving',
                        event.Lokatie || event.Lokalen?.map(e => e.Naam).join(', ') || 'Geen locatie',
                        event.DuurtHeleDag ? 'Hele dag' : `${new Date(event.Start).getFormattedTime()}–${new Date(event.Einde).getFormattedTime()}`
                    ].join('\n'),
                    dataset: {
                        temporalType: 'ongoing-check',
                        temporalStart: event.Start,
                        temporalEnd: event.Einde
                    }
                });

                // Event click handler
                eventWrapperElement.addEventListener('click', () => window.location.hash = `#/agenda/${(event.Type === 1 || event.Type === 16) ? 'afspraak' : 'huiswerk'}/${event.Id}?returnUrl=%252Fvandaag`)

                // Parse the subject, teacher and location fields
                let eventSubjects = (event.Vakken?.map((vak, i) => {
                    if (i === 0) return vak.Naam.charAt(0).toUpperCase() + vak.Naam.slice(1)
                    return vak.Naam
                }) || []).join(', ');
                if (!eventSubjects?.length > 0) eventSubjects = event.Omschrijving;

                let eventTeachers = (event.Docenten?.map((docent) => {
                    return (teacherNamesSetting?.[docent.Docentcode] || docent.Naam) + ` (${docent.Docentcode})`;
                }) || []).join(', ');

                let eventLocation = event.Lokatie || event.Lokalen?.map(e => e.Naam).join(', ');

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
                    element('b', null, eventTitleWrapperEl, { innerText: eventSubjects })
                    if (eventLocation.length > 0) element('span', null, eventTitleWrapperEl, { innerText: ` (${eventLocation})` })
                }

                // Render the teacher label
                if (!listViewEnabled && eventTeachers?.length > 0) {
                    const eventTeacherEl = element('span', `st-event-${event.Id}-teacher`, eventDetailsEl, { class: 'st-event-teacher', innerText: eventTeachers })
                    if (eventTeacherEl.innerText.includes('jeb_')) eventTeacherEl.setAttribute('style', 'animation: rainbow 5s linear 0s infinite; color: var(--st-accent-warn)')
                    if (eventTeacherEl.innerText.includes('dinnerbone')) eventTeacherEl.style.scale = '1 -1'
                }

                // Render the time label
                element('span', `st-event-${event.Id}-time`, eventDetailsEl, { class: 'st-event-time', innerText: event.DuurtHeleDag ? 'Hele dag' : new Date(event.Start).getFormattedTime() + '–' + new Date(event.Einde).getFormattedTime() })

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
        let newArray = array.map(item => {
            const endDate = new Date(item.Einde)
            if (item.DuurtHeleDag) {
                item.Einde = new Date(new Date(endDate).setTime(endDate.getTime() + 86399000)).toISOString()
            }
            item.startH = new Date(item.Start).getHoursWithDecimals()
            item.endH = new Date(item.Einde).getHoursWithDecimals()
            item.durationH = item.endH - item.startH
            return item
        })

        // Step 2: Sort events by start time
        newArray.sort((a, b) => a.startH - b.startH);

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
