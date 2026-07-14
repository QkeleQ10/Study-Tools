// Global variables to persist schedule state across instances
let persistedScheduleView = localStorage['start-schedule-persisted-view'];
let persistedScheduleDate;

class Schedule {
    element;
    dayElements = {};
    events = {};
    electives = {};
    #header;
    #body;

    constructor(parentElement) {
        this.initPreferences();

        this.element = createElement('div', parentElement, {
            id: 'st-sch',
            class: this.#preferences.listView ? 'list-view' : '',
            style: {
                '--hour-height': `${this.hourHeight}px`
            }
        });
    }

    // === Preferences ===

    #preferences = {
        hourHeight: 110,
        listView: false
    };

    async initPreferences() {
        this.#preferences.hourHeight = localStorage['start-hour-height'] || 110
        this.#preferences.listView = syncedStorage['start-schedule-view'] === 'list'

    }

    get hourHeight() { return this.#preferences.hourHeight; }
    set hourHeight(value) {
        let tValue = Math.min(Math.max(45, value), 450);
        this.#preferences.hourHeight = tValue;
        localStorage['start-hour-height'] = tValue;
        this.element.style.setProperty('--hour-height', `${tValue}px`);
    }
}

class ScheduleDay {
    date;
    #events = [];
    #electives = [];
    body;
    head;
    #nowMarker;
    #interval;

    constructor(date, body, header) {
        this.date = date;

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
        return this.#events.some(event => new Date(event.Einde).getTime() > dates.now.getTime());
    }

    drawShell() {
        if (this.#interval) clearInterval(this.#interval);
        this.#interval = undefined;
        if (this.#nowMarker) this.#nowMarker.remove();
        this.#nowMarker = undefined;

        this.head.innerText = '';
        this.body.innerText = '';

        const dateFormat = { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short' };
        if (isYearNotCurrent(this.date)) dateFormat.year = 'numeric';
        this.head.createChildElement('span', {
            class: this.isToday ? 'st-sch-day-date today' : 'st-sch-day-date',
            innerText: this.date.toLocaleDateString(locale, dateFormat)
        });

        if (this.isToday) {
            if (!listViewEnabled) {
                this.#nowMarker = this.body.createChildElement('div', {
                    class: 'st-now-marker',
                    style: {
                        '--top': `calc(${dates.now.getHoursWithDecimals()})`
                    }
                });

                if (schedule.positionInRange(this.date) > -1 && this.#nowMarker) {
                    this.#nowMarker.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }

            this.#interval = setIntervalImmediately(() => {
                if (!this.body || (!listViewEnabled && !this.#nowMarker)) return clearInterval(this.#interval);
                if (!listViewEnabled && this.#nowMarker) this.#nowMarker.style.setProperty('--top', `calc(${dates.now.getHoursWithDecimals()})`);
                this.body.querySelectorAll('.st-event').forEach(event => {
                    (event instanceof HTMLElement) && (event.dataset.ongoing = ((new Date(event.dataset.start) < dates.now && new Date(event.dataset.end) > dates.now) ? 'true' : 'false'));
                });
            }, 30000);
        }

        this.rendered = true;
    }

    hydrateEvents(eventsArray) {
        if (this.eventsHydrated) return;
        this.#events = this.#calculateEventOverlap(eventsArray);
        if (!this.body || !this.head) return;
        this.eventsHydrated = true;

        if (this.#events.length === 0) {
            this.head.createChildElement('span', {
                class: 'st-sch-day-no-events',
                innerText: this.isToday ? i18n('noEventsToday') : i18n('noEvents')
            });

            return;
        }

        for (const event of this.#events) {
            const parent = event.DuurtHeleDag ? this.head : this.body;
            const eventWrapperElement = createElement('div', parent, {
                classList: ['st-event-wrapper', syncedStorage['start-event-display'] || 'normal'],
                textContent: event.title,
                style: {
                    '--top': `calc(${event.startH} * var(--hour-height))`,
                    '--height': `calc(${event.durationH} * var(--hour-height))`,
                    '--left': `calc(${event.left} * 100%)`,
                    '--width': `calc(${event.width} * 100%)`,
                    '--border-top-left-radius': this.#events.some(el => el.Einde === event.Start) ? 0 : 'var(--st-border-radius)',
                    '--border-top-right-radius': this.#events.some(el => el.Einde === event.Start) ? 0 : 'var(--st-border-radius)',
                    '--border-bottom-left-radius': this.#events.some(el => el.Start === event.Einde) ? 0 : 'var(--st-border-radius)',
                    '--border-bottom-right-radius': this.#events.some(el => el.Start === event.Einde) ? 0 : 'var(--st-border-radius)',
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

            eventWrapperElement.addEventListener('click', () => {
                if (syncedStorage['start-event-details'])
                    new ScheduleEventDialog(event).show();
                else
                    window.location.hash = `#/agenda/${(event.Type === 1 || event.Type === 16) ? 'afspraak' : 'huiswerk'}/${event.Id}?returnUrl=%252Fvandaag`;
            });

            let eventHours = (event.LesuurVan === event.LesuurTotMet) ? event.LesuurVan : `${event.LesuurVan}-${event.LesuurTotMet}`
            const eventNumberEl = eventElement.createChildElement('div', { class: 'st-event-number', innerText: eventHours })
            if (event.Type === 1) {
                eventNumberEl.classList.add('icon')
                eventNumberEl.innerText = ''
            } else if (event.Type === 16) {
                eventNumberEl.classList.add('icon')
                eventNumberEl.innerText = ''
            } else if (!eventNumberEl.innerText) {
                eventNumberEl.classList.add('icon')
                eventNumberEl.innerText = ''
            }

            if (event.Status == 4 || event.Status == 5) {
                eventElement.dataset.cancelled = 'true';
            }

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

            eventDetailsEl.createChildElement('span', { class: 'st-event-time', innerText: event.DuurtHeleDag ? i18n('allDay') : new Date(event.Start).getFormattedTime() + '–' + new Date(event.Einde).getFormattedTime() })

            if (syncedStorage['start-event-display'] !== 'legacy' && eventTeachers(event)?.length > 0) {
                const eventTeacherEl = eventDetailsEl.createChildElement('span', { class: 'st-event-teacher', innerText: eventTeachers(event) })
                if (eventTeacherEl.innerText.includes('jeb_')) eventTeacherEl.setAttribute('style', 'animation: rainbow 5s linear 0s infinite; color: var(--st-accent-warn)')
                if (eventTeacherEl.innerText.includes('dinnerbone')) eventTeacherEl.style.scale = '1 -1'
            }

            let chips = getEventChips(event)
            const eventChipsWrapperEl = eventElement.createChildElement('div', { class: 'st-event-chips st-chips-wrapper' })
            chips.forEach(chip => {
                eventChipsWrapperEl.createChildElement('span', { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
            })
        }

    }

    hydrateElectives(electivesArray) {
        if (this.electivesHydrated) return;
        this.#electives = electivesArray;
        if (!this.body) return;
        this.electivesHydrated = true;

        const occupiedRanges = this.#events.map(event => ({
            start: new Date(event.Start).getTime(),
            end: new Date(event.Einde).getTime(),
        }));

        const overlapsOccupiedRange = (start, end) =>
            occupiedRanges.some(range => start < range.end && end > range.start);

        for (const appointment of this.#electives) {
            const appointmentStart = new Date(appointment.start).getTime();
            const appointmentEnd = new Date(appointment.end).getTime();
            if (overlapsOccupiedRange(appointmentStart, appointmentEnd)) continue;
            occupiedRanges.push({ start: appointmentStart, end: appointmentEnd });

            const startH = new Date(appointment.start).getHoursWithDecimals();
            const endH = new Date(appointment.end).getHoursWithDecimals();
            const durationH = endH - startH;
            const participantStatus = appointment.participants.find(p => p.type === 'pupil' && !p.isOrganizer)?.status;

            const aaWrapperElement = createElement('div', this.body, {
                classList: ['st-event-wrapper', 'optional', syncedStorage['start-event-display'] || 'normal'],
                style: {
                    '--top': `calc(${startH} * var(--hour-height))`,
                    '--height': `calc(${durationH} * var(--hour-height))`,
                }
            });

            const aaElement = createElement('div', aaWrapperElement, {
                classList: ['st-event',],
                dataset: {
                    start: appointment.start,
                    end: appointment.end,
                    ongoing: new Date(appointment.start) < dates.now && new Date(appointment.end) > dates.now
                }
            });

            aaWrapperElement.addEventListener('click', () => {
                new ScheduleEventDialog(appointment).show();
            });

            let eventHours = (appointment.startTimeSlot === appointment.endTimeSlot) ? appointment.startTimeSlot : `${appointment.startTimeSlot}-${appointment.endTimeSlot}`
            aaElement.createChildElement('div', { class: 'st-event-number', innerText: eventHours })

            const eventDetailsEl = aaElement.createChildElement('div', { class: 'st-event-details' });
            const eventTitleWrapperEl = eventDetailsEl.createChildElement('span', { class: 'st-event-title' });

            switch (participantStatus) {
                case 'accepted':
                    eventTitleWrapperEl.createChildElement('b', {
                        innerText: appointment.subjects.length > 0 ? `${eventSubjects(appointment.subjects)} (${appointment.topic})` : appointment.topic
                    });
                    break;
                case 'declined':
                    eventTitleWrapperEl.createChildElement('b', { innerText: i18n('electivesUnavailable') });
                    break;
                default:
                    eventTitleWrapperEl.createChildElement('b', { innerText: i18n('electivesAvailable') });
                    break;
            }

            eventDetailsEl.createChildElement('span', { class: 'st-event-time', innerText: new Date(appointment.start).getFormattedTime() + '–' + new Date(appointment.end).getFormattedTime() });
            if (participantStatus === 'accepted') {
                eventDetailsEl.createChildElement('span', { innerText: i18n('electivesRegisteredDisclaimer') });
            }
        }
    }

    destroy() {
        if (this.#interval) clearInterval(this.#interval);
        this.#interval = undefined;
        if (this.#nowMarker) this.#nowMarker.remove();
        this.#nowMarker = undefined;
        this.body?.remove();
        this.head?.remove();
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
    #annotationCompletedTag = '[ST-completed]';
    #homeworkInfoTypes = {
        1: { name: i18n('chips.hw'), type: 'info' },
        2: { name: i18n('chips.pw'), type: 'important' },
        3: { name: i18n('chips.prelim'), type: 'important' },
        4: { name: i18n('chips.so'), type: 'important' },
        5: { name: i18n('chips.mo'), type: 'important' },
        6: { name: i18n('chips.info'), type: 'info' },
    };
    #attachmentFileTypes = [
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

    constructor(event) {
        super(event?.Id ? {
            buttons: [{
                'data-icon': '',
                innerText: i18n('viewInAgenda'),
                callback: () => {
                    window.location.hash = `#/agenda/${(event.Type === 1 || event.Type === 16) ? 'afspraak' : 'huiswerk'}/${event.Id}?returnUrl=%252Fvandaag`;
                    this.close();
                }
            }]
        } : undefined);
        this.body.classList.add('st-event-dialog');

        this.event = event;

        if (schedule?.scheduleDate && schedule.positionInRange(new Date(this.event.Start || this.event.start)) < 0)
            schedule.scheduleDate = new Date(this.event.Start || this.event.start);

        this.#progressBar = createElement('div', this.element, { class: 'st-progress-bar' });
        createElement('div', this.#progressBar, { class: 'st-progress-bar-value indeterminate' });

        this.#drawDialogContents();
    }

    async #drawDialogContents() {
        this.body.innerText = '';
        this.#drawPrimaryDetailsColumn();
        this.#loadAdditionalEventInfo();
    }

    #setProgressVisible(visible) {
        this.#progressBar.dataset.visible = visible ? 'true' : 'false';
    }

    #refreshViews() {
        if (schedule?.refresh) schedule.refresh();
        if (widgets?.refresh) widgets.refresh();
    }

    #createColumn(title) {
        const column = createElement('div', this.body, { class: 'st-event-dialog-column' });
        createElement('h3', column, { class: 'st-section-heading', innerText: title });
        return column;
    }

    #drawPrimaryDetailsColumn() {
        const detailsTitle = (this.event?.Type === 1 || this.event?.Type === 16) ? i18n('eventDetails') : i18n('lessonDetails');
        const column = this.#createColumn(detailsTitle);
        const table = createElement('table', column, { class: 'st' });

        if (this.event.Omschrijving)
            this.#addRowToTable(table, i18n('title'), this.event.Omschrijving || '-');
        if (this.event.Vakken)
            this.#addRowToTable(table, i18n('subject'), eventSubjects(this.event) || '-');
        if (this.event.LesuurVan)
            this.#addRowToTable(table, i18n('schoolHour'), this.event.LesuurVan
                ? (this.event.LesuurVan === this.event.LesuurTotMet)
                    ? i18n('schoolHourNum', { num: this.event.LesuurVan, numOrdinal: formatOrdinals(this.event.LesuurVan) })
                    : i18n('closedInterval', { start: i18n('schoolHourNum', { num: this.event.LesuurVan, numOrdinal: formatOrdinals(this.event.LesuurVan) }), end: i18n('schoolHourNum', { num: this.event.LesuurTotMet, numOrdinal: formatOrdinals(this.event.LesuurTotMet) }) })
                : '-');

        const showYear = isYearNotCurrent(new Date(this.event.Start)) || isYearNotCurrent(new Date(this.event.Einde));
        const dateOptions = { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', year: showYear ? 'numeric' : undefined };
        // @ts-ignore
        this.#addRowToTable(table, i18n('start'), new Date(this.event.Start || this.event.start).toLocaleString(locale, dateOptions));
        // @ts-ignore
        this.#addRowToTable(table, i18n('end'), new Date(this.event.Einde || this.event.end).toLocaleString(locale, dateOptions));
        if (this.event.Lokalen || this.event.Lokatie)
            this.#addRowToTable(table, i18n('location'), eventLocations(this.event) || '-');
        if (this.event.Docenten)
            this.#addRowToTable(table, i18n('teacher'), eventTeachers(this.event) || '-');
        if (this.event.Herhaling)
            this.#addRowToTable(table, i18n('repetition'), i18n('untilDate', { date: new Date(this.event.Herhaling.EindDatum).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }));

        const chips = getEventChips(this.event);
        if (chips.length > 0) {
            const chipsWrapper = this.#addRowToTable(table, i18n('extra'));
            chipsWrapper.classList.add('st-chips-wrapper');
            chipsWrapper.style.justifyContent = 'flex-start';
            chips.forEach(chip => createElement('span', chipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name }));
        }
    }

    async #loadAdditionalEventInfo() {
        if (this.event?.Id) {
            const moreInfo = await magisterApi.event(this.event.Id);
            if (moreInfo) this.event = { ...this.event, ...moreInfo };
        }

        if (this.event?.Type === 7) await this.#drawKwtColumn();

        await magisterApi.updateAccountInfo();
        const aaChoices =
            (magisterApi.calendarFeatures?.isAdditionalAppointmentsEnabled && syncedStorage['additional-appointments'])
                ? await magisterApi.electives(new Date(this.event.Start || this.event.start), new Date(this.event.Einde || this.event.end))
                : [];
        if (aaChoices.length) await this.#drawElectivesColumn();

        if (this.event?.Opmerking) this.#drawRemarkColumn();
        if (this.event?.Inhoud?.length > 0) this.#drawHomeworkColumn();
        if (this.event?.Bijlagen?.length > 0) this.#drawAttachmentsColumn();
        if (this.event?.hasOwnProperty('Aantekening')) this.#drawAnnotationColumn();

        this.#setProgressVisible(false);
    }

    async #drawKwtColumn() {
        const kwtColumn = this.#createColumn(i18n('kwtRegistration'));
        const kwtChoices = await magisterApi.kwtChoices(new Date(this.event.Start), new Date(this.event.Einde));

        if (!kwtChoices?.[0]?.Keuzes?.[0]) {
            createElement('span', kwtColumn, { innerText: "KWT-keuzes konden niet worden geladen." });
            return;
        }

        kwtChoices[0].Keuzes.forEach(choice => {
            const percentageFull = parseInt(choice.AantalDeelnemers) / parseInt(choice.MaxDeelnemers);
            const label = createElement('label', kwtColumn, { class: 'st-checkbox-label st-start-kwt-choice', for: `st-start-${choice.Id}-kwt-choice` });
            createElement('b', label, { innerText: choice.Omschrijving });
            createElement('span', label, { innerText: ` (${eventLocations(choice)})` });
            createElement('span', label, { innerText: `(${choice.AantalDeelnemers ?? '?'}/${choice.MaxDeelnemers ?? '?'}${percentageFull === 1 ? ', vol' : ''})`, class: percentageFull > 0.85 ? 'st-tip nearly-full' : 'st-tip', title: "Aantal deelnemers" });
            createElement('span', label, { innerText: `\n${eventTeachers(choice)}` });
            const input = createElement('input', label, { id: `st-start-${choice.Id}-kwt-choice`, class: 'st-checkbox-input', type: 'checkbox' });
            input.checked = choice.Status > 0;
            input.disabled = !kwtChoices[0].MagInschrijven;
            input.addEventListener('input', async () => {
                this.#setProgressVisible(true);
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
                    this.#refreshViews();
                    const newEvent = (await magisterApi.events(midnight(this.event.Start), midnight(this.event.Einde, 1)))
                        .find(e => new Date(e.Start).getTime() === new Date(this.event.Start).getTime() && new Date(e.Einde).getTime() === new Date(this.event.Einde).getTime());
                    if (newEvent) this.event = newEvent;
                    this.#drawDialogContents();
                }
            });
        });
    }

    async #drawElectivesColumn() {
        const aaColumn = this.#createColumn(i18n('electivesRegistration'));
        const aaChoices = (magisterApi.calendarFeatures?.isAdditionalAppointmentsEnabled && syncedStorage['additional-appointments'])
            ? await magisterApi.electives(new Date(this.event.Start || this.event.start), new Date(this.event.Einde || this.event.end))
            : [];

        if (!aaChoices?.[0]) {
            createElement('span', aaColumn, { innerText: "Keuzes konden niet worden geladen." });
            return;
        }

        aaChoices.forEach(choice => {
            const label = createElement('label', aaColumn, { class: 'st-checkbox-label st-start-aa-choice', for: `st-start-${choice.id}-aa-choice` });
            createElement('b', label, { innerText: choice.subjects.length > 0 ? `${eventSubjects(choice.subjects)} (${choice.topic})` : choice.topic });
            createElement('span', label, { innerText: ` (${eventLocations(choice.locations)})` });
            createElement('span', label, { innerText: `\n${eventTeachers(choice.participants.filter(p => p.type !== 'pupil'))}` });
            const input = createElement('input', label, { id: `st-start-${choice.id}-aa-choice`, class: 'st-checkbox-input', type: 'checkbox' });
            input.checked = choice.participants.find(p => p.type === 'pupil' && !p.isOrganizer)?.status === 'accepted';
            input.disabled = !choice.links.enroll && !choice.links.unenroll;
            input.addEventListener('input', async () => {
                this.#setProgressVisible(true);
                aaColumn.querySelectorAll('input').forEach(i => i.disabled = true);
                try {
                    if (choice.links.enroll?.href) {
                        await magisterApi.enrollElective(choice.links.enroll.href);
                    } else if (choice.links.unenroll?.href) {
                        await magisterApi.enrollElective(choice.links.unenroll.href);
                    }
                } catch (e) {
                    new Dialog({ innerText: (await e.json())?.ActionNotAvailableOrNotAllowed?.[0] || i18n('error') }).show();
                } finally {
                    this.#refreshViews();
                    const newEvent = (await magisterApi.events(midnight(this.event.Start), midnight(this.event.Einde, 1)))
                        .find(e => new Date(e.Start).getTime() === new Date(this.event.Start).getTime() && new Date(e.Einde).getTime() === new Date(this.event.Einde).getTime());
                    if (newEvent) this.event = newEvent;
                    this.#drawDialogContents();
                    new Dialog({ innerText: i18n('electivesRegisteredDisclaimer') }).show();
                }
            });
        });
    }

    #drawRemarkColumn() {
        const remarkColumn = this.#createColumn(i18n('remark'));

        const remarkContentsWrapper = remarkColumn.createChildElement('div', { class: 'st-event-dialog-event-content-wrapper' });
        const remarkContents = createElement('div', remarkContentsWrapper, { class: 'st-event-dialog-event-content', innerHTML: this.event.Opmerking });
    }

    #drawHomeworkColumn() {
        const infoType = this.#homeworkInfoTypes[this.event.InfoType];
        const homeworkColumn = this.#createColumn(infoType?.name || i18n('chips.info'));

        const homeworkContentsWrapper = homeworkColumn.createChildElement('div', { class: 'st-event-dialog-event-content-wrapper' });
        const homeworkContents = createElement('div', homeworkContentsWrapper, { class: 'st-event-dialog-event-content', innerHTML: this.event.Inhoud });

        const label = createElement('label', homeworkColumn, { class: 'st-checkbox-label', for: `st-start-${this.event.Id}-hw-complete`, innerText: i18n('completed') });
        const input = createElement('input', label, { id: `st-start-${this.event.Id}-hw-complete`, class: 'st-checkbox-input', type: 'checkbox' });
        input.checked = this.event.Afgerond;
        input.addEventListener('input', async () => {
            this.#setProgressVisible(true);
            await magisterApi.putEvent(this.event.Id, { ...(await magisterApi.event(this.event.Id)), Afgerond: input.checked });
            this.#refreshViews();
            this.event.Afgerond = input.checked;
            this.body.querySelectorAll('.st-chip').forEach(chip => {
                if ((chip instanceof HTMLElement) && chip.innerText === infoType?.name) {
                    chip.classList.toggle('ok', input.checked);
                    chip.classList.toggle('info', !input.checked);
                }
            });
            this.#setProgressVisible(false);
        });

        const table = createElement('table', homeworkColumn, { class: 'st' });
        const showYear = isYearNotCurrent(new Date(this.event.TaakAangemaaktOp)) || isYearNotCurrent(new Date(this.event.TaakGewijzigdOp));
        this.#addRowToTable(table, i18n('added'), this.event.TaakAangemaaktOp ? new Date(this.event.TaakAangemaaktOp).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', year: showYear ? 'numeric' : undefined }) : '-');
        this.#addRowToTable(table, i18n('lastModified'), this.event.TaakGewijzigdOp ? new Date(this.event.TaakGewijzigdOp).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', year: showYear ? 'numeric' : undefined }) : '-');
    }

    #drawAttachmentsColumn() {
        const attachmentsColumn = this.#createColumn(this.event.Bijlagen.length > 1 ? i18n('attachments') : i18n('attachment'));

        this.event.Bijlagen.forEach(bijlage => {
            const fileType = this.#attachmentFileTypes.find(type => type.extensions.some(ext => bijlage.Naam.toLowerCase().endsWith(ext)));
            const fileButton = attachmentsColumn.createChildElement('button', { class: 'st-button secondary st-event-dialog-event-attachment', innerText: bijlage.Naam, dataset: { icon: fileType?.icon || '' } });

            fileButton.addEventListener('click', async () => window.open((await magisterApi.eventAttachment(bijlage.Id)).location, '_blank'));
            fileButton.addEventListener('auxclick', async (e) => {
                e.preventDefault();
                const locationUrl = (await magisterApi.eventAttachment(bijlage.Id)).location;
                const file = await fetch(locationUrl);
                const blob = new Blob([await file.blob()], { type: bijlage.ContentType });
                window.open(URL.createObjectURL(blob), '_blank');
            });

            const table = createElement('table', attachmentsColumn, { class: 'st' });
            this.#addRowToTable(table, i18n('fileSize'), bijlage.Grootte ? `${Math.ceil(bijlage.Grootte / 1024)} ${i18n('units.kibibyte')}` : '-');
            this.#addRowToTable(table, i18n('fileType'), i18n('typeFile', { type: fileType?.name || /(?:\.([^.]+))?$/.exec(bijlage.Naam.toUpperCase())[1] }));
            const showYear = isYearNotCurrent(new Date(bijlage.Datum));
            this.#addRowToTable(table, i18n('uploaded'), bijlage.Datum ? new Date(bijlage.Datum).toLocaleString(locale, { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', year: showYear ? 'numeric' : undefined }) : '-');
        });
    }

    #parseAnnotation(value) {
        const sanitized = (value || '').replace(/^\s*<br\s*\/?>\s*$/i, '');
        const isCompleted = /\s*\[ST-completed\]\s*$/.test(sanitized);
        return {
            content: sanitized.replace(/\s*\[ST-completed\]\s*$/, ''),
            isCompleted
        };
    }

    #drawAnnotationColumn() {
        const annotationColumn = this.#createColumn(i18n('annotation'));
        const initialAnnotation = this.#parseAnnotation(this.event?.Aantekening || '');
        let savedAnnotationContent = initialAnnotation.content;
        let savedAnnotationCompleted = initialAnnotation.isCompleted && savedAnnotationContent !== '';

        const annotationContentsWrapper = createElement('div', annotationColumn, { class: 'st-event-dialog-event-content-wrapper' });
        const annotationContents = createElement('div', annotationContentsWrapper, { class: 'st-event-dialog-event-content', innerHTML: savedAnnotationContent, contenteditable: true, placeholder: i18n('addAnnotation') });

        const annotationHint = annotationContentsWrapper.createChildElement('p', { class: 'st-event-dialog-event-content-hint' });
        Object.entries({ bold: ['Ctrl', 'B'], italic: ['Ctrl', 'I'], underline: ['Ctrl', 'U'] }).forEach(([value, keys]) => {
            keys.forEach(k => annotationHint.createChildElement('kbd', { innerText: k }));
            annotationHint.createChildElement('span', { innerText: i18n(value) });
        });

        const annotationCompletedLabel = createElement('label', annotationColumn, { class: 'st-checkbox-label st-hidden st-event-dialog-event-content-completed', for: `st-start-${this.event.Id}-annotation-complete`, innerText: i18n('completed') });
        const annotationCompletedInput = createElement('input', annotationCompletedLabel, { id: `st-start-${this.event.Id}-annotation-complete`, class: 'st-checkbox-input', type: 'checkbox' });
        annotationCompletedInput.checked = savedAnnotationCompleted;

        const saveButton = createElement('button', annotationColumn, { class: 'st-button st-hidden st-event-dialog-event-content-save', innerText: i18n('save') });

        const getCurrentAnnotationContent = () => this.#parseAnnotation(annotationContents.innerHTML).content;
        const getAnnotationToSave = () => {
            const content = getCurrentAnnotationContent();
            if (content === '') return null;
            return annotationCompletedInput.checked ? `${content}${this.#annotationCompletedTag}` : content;
        };

        const updateAnnotationUiState = () => {
            const currentAnnotationContent = getCurrentAnnotationContent();
            const isEmpty = currentAnnotationContent === '';
            const currentCompleted = isEmpty ? false : annotationCompletedInput.checked;
            const savedCompleted = savedAnnotationContent === '' ? false : savedAnnotationCompleted;
            const hasChanged = currentAnnotationContent !== savedAnnotationContent || currentCompleted !== savedCompleted;

            annotationContents.classList.toggle('empty', isEmpty);
            saveButton.classList.toggle('st-hidden', !hasChanged);
            annotationCompletedLabel.classList.toggle('st-hidden', !saveButton.classList.contains('st-hidden') || isEmpty);
        };

        const saveAnnotation = async () => {
            this.#setProgressVisible(true);
            const annotationToSave = getAnnotationToSave();
            await magisterApi.putEvent(this.event.Id, { ...(await magisterApi.event(this.event.Id)), Aantekening: annotationToSave });
            this.#refreshViews();
            this.event.Aantekening = annotationToSave;
            savedAnnotationContent = getCurrentAnnotationContent();
            savedAnnotationCompleted = savedAnnotationContent !== '' && annotationCompletedInput.checked;
            annotationCompletedInput.checked = savedAnnotationCompleted;
            updateAnnotationUiState();
            this.#setProgressVisible(false);
        };

        saveButton.addEventListener('click', saveAnnotation);
        annotationContents.addEventListener('input', updateAnnotationUiState);
        annotationCompletedInput.addEventListener('input', async () => {
            if (getCurrentAnnotationContent() === '') return;
            await saveAnnotation();
        });
        updateAnnotationUiState();
    }

    #addRowToTable(parentElement, label, value) {
        let row = createElement('tr', parentElement);
        createElement('td', row, { innerText: label || '' });
        return createElement('td', row, { innerText: value || '' });
    }
}
