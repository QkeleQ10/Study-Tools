async function todaySchedule() {
    let interval

    agendaDayOffset = Math.floor((dates.today - gatherStart) / 86400000)

    const events = await magisterApi.events()

    // Display error if the result does not exist or if it is not an array
    if (!events || !Array.isArray(events)) {
        element('i', `st-start-fa`, schedule, { class: 'st-start-icon fa-duotone fa-calendar-circle-exclamation' })
        element('span', `st-start-disclaimer`, schedule, { class: 'st-start-disclaimer', innerText: i18n('error') })
        return
    }

    // Create an array with 42 days (6 weeks) containing events of those days
    let agendaDays = []
    for (let i = 0; i < 42; i++) {
        const date = new Date(new Date(gatherStart.getTime()).setDate(gatherStart.getDate() + i))
        const eventsOfDay =
            events.filter(item => {
                const startDate = new Date(item.Start)
                return (startDate - date) < 86400000 && (startDate - date) >= 0 // Add all events that are on this date to this element
            })?.map(item => {
                const endDate = new Date(item.Einde)
                if (item.DuurtHeleDag) {
                    item.Einde = new Date(new Date(endDate).setTime(endDate.getTime() + 86399000)).toISOString()
                }
                item.startH = new Date(item.Start).getHoursWithDecimals()
                item.endH = new Date(item.Einde).getHoursWithDecimals()
                item.durationH = item.endH - item.startH
                return item
            }) || []

        let eventsOfDayWithCollision = checkCollision(eventsOfDay)

        agendaDays.push({
            date: new Date(date),
            today: (date - dates.today) === 0, // Days have the highest relevancy when they match the current date.
            tomorrow: (date - dates.today) === 86400000, // Days have increased relevancy when they match tomorrow's date.
            irrelevant: eventsOfDayWithCollision.length < 1 || date < dates.today, // Days are irrelevant when they are empty or in the past.
            events: eventsOfDayWithCollision
        })
    }

    // Start rendering
    renderSchedule = async () => {

        switch (agendaView) {
            case 'week':
                // When in week view, the first day shown should be the Monday of the selected week. The last day shown should be 6 days later.
                agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + Math.min(Math.max(0, Math.floor(agendaDayOffset / 7) * 7), 41)))
                agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + 6))
                schedule.classList.add('week-view')
                schedule.classList.remove('list-view')
                break;

            case 'workweek':
                // When in week view, the first day shown should be the Monday of the selected week. The last day shown should be 6 days later.
                agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + Math.min(Math.max(0, Math.floor(agendaDayOffset / 7) * 7), 41)))
                agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + 4))
                schedule.classList.add('week-view')
                schedule.classList.remove('list-view')
                break;

            default:
                // When in day view, the first day shown should be today. The amount of days set to be shown dictates the last day shown.
                agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + agendaDayOffset))
                if (listViewEnabled) {
                    schedule.classList.add('list-view')
                }

                let todayIndex = agendaDays.findIndex(item => item.today)
                let todayEvents = agendaDays[todayIndex].events
                let nextRelevantDayIndex = agendaDays.findIndex((item, i) => item.events.length > 0 && i > todayIndex) || todayIndex || 0
                let nextRelevantDayEvents = agendaDays[nextRelevantDayIndex]?.events
                let todayEndTime = new Date(Math.max(...todayEvents.filter(item => !(item.Status == 4 || item.Status == 5)).map(item => new Date(item.Einde))))

                // Jump to the next relevant day if no (more) events will take place today (given the user hasn't opted out)
                if (nextRelevantDayIndex > todayIndex && !agendaDayOffsetChanged && (new Date() >= todayEndTime || todayEvents.length < 1) && showNextDaySetting && agendaView === 'day' && agendaDayOffset === (dates.today.getDay() || 7) - 1 && nextRelevantDayEvents.length > 0) {
                    agendaDayOffset = nextRelevantDayIndex
                    agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + agendaDayOffset))
                    notify('snackbar', i18n('toasts.jumpedToDate', { date: formatTimestamp(agendaStartDate) }), [], 1500)

                    setTimeout(() => { if (document.querySelector('#st-start-today-offset-zero')) document.querySelector('#st-start-today-offset-zero').classList.add('emphasise') }, 200)
                    schedule.dataset.navigate = 'jumpforwards'
                }

                if (agendaView === 'day') agendaEndDate = agendaStartDate
                else agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + Number(agendaView.slice(0, 1)) - 1))

                schedule.classList.remove('week-view')
                break;
        }

        clearInterval(interval)

        let ticksWrapper = element('div', 'st-start-ticks-wrapper', schedule)
        let scheduleWrapper = element('div', 'st-start-schedule-wrapper', schedule, { innerText: '' })

        // Create tick marks for schedule view
        if (!listViewEnabled) {
            for (let i = 0; i <= 24; i += 0.5) {
                let hourTick = element('div', `st-start-tick-${i}h`, ticksWrapper, { class: `st-start-tick ${Number.isInteger(i) ? 'whole' : 'half'}`, style: `--start-time: ${i}` })
            }
        }

        agendaDays.forEach((day, i, a) => {
            // If the date falls outside the agenda range, don't proceed.
            if (day.date < agendaStartDate || day.date > agendaEndDate) return

            // Create a column for the day
            const dayColumnEl = element('div', `st-start-schedule-day-${i}`, scheduleWrapper, {
                class: 'st-start-schedule-day',
                'data-today': day.today,
                'data-tomorrow': day.tomorrow,
                'data-irrelevant': day.irrelevant
            })

            // TODO: the label for the column

            renderEvents(day.events, dayColumnEl)

            // Display 'no events' if necessary
            if (day.events?.length < 1 && !listViewEnabled) {
                let seed = cyrb128(String(day.date.getTime()))
                createElement('i', dayColumnEl, {
                    classList: ['st-start-icon', 'fa-duotone', ['fa-island-tropical', 'fa-snooze', 'fa-alarm-snooze', 'fa-house-day', 'fa-umbrella-beach', 'fa-bed', 'fa-face-smile-wink', 'fa-house-person-return', 'fa-house-chimney-user', 'fa-house-user', 'fa-house-heart', 'fa-calendar-heart', 'fa-skull', 'fa-rocket-launch', 'fa-bath', 'fa-bowling-ball-pin', 'fa-poo-storm', 'fa-block-question', 'fa-crab'].random(seed)]
                })
                createElement('span', dayColumnEl, {
                    class: 'st-start-disclaimer',
                    innerText: events.length === 0
                        ? i18n('noEventsUntilDate', { date: gatherEnd.toLocaleDateString(locale, { day: 'numeric', month: 'long' }), dateShort: gatherEnd.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) })
                        : day.today
                            ? i18n('noEventsToday')
                            : i18n('noEvents')
                })
            }

            schedule.scrollTop = hourHeightSetting * 115 * 8 // Default scroll to 08:00

            // Ensure a nice scrolling position if the date shown is not today
            // Only in day view and if the user hasn't navigated to a different day
            if (agendaView.slice(-3) === 'day' && !agendaDayOffsetChanged) {
                if (dayColumnEl.querySelector('.st-event')) {
                    // If there are events today, try to make the last one visible but ensure the first event is visible.
                    dayColumnEl.querySelector('.st-event:last-of-type').scrollIntoView({ block: 'nearest', behavior: 'instant' })
                    dayColumnEl.querySelector('.st-event').scrollIntoView({ block: 'nearest', behavior: 'instant' })
                }
            }

            if (!listViewEnabled && day.today) {
                // Add a marker of the current time (if applicable) and scroll to it if the scroll position is 0.
                const currentTimeMarker = element('div', `st-start-now`, dayColumnEl, { 'data-temporal-type': 'style-hours' }),
                    currentTimeMarkerLabel = element('div', `st-start-now-label`, dayColumnEl, { 'data-temporal-type': 'style-hours', innerText: i18n('dates.nowBrief')?.toUpperCase() })
                updateTemporalBindings()

                // Ensure a nice scrolling position if today is visible on-screen
                // Only in day view and if the user hasn't navigated to a different day
                if (agendaView.slice(-3) === 'day' && !agendaDayOffsetChanged) {
                    if (dayColumnEl.querySelector('.st-event')) {
                        // If there are events today, try to make the last one visible but ensure the first event is visible.
                        dayColumnEl.querySelector('.st-event:last-of-type').scrollIntoView({ block: 'nearest', behavior: 'instant' })
                        dayColumnEl.querySelector('.st-event').scrollIntoView({ block: 'nearest', behavior: 'instant' })
                    }
                    currentTimeMarker.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) // Ensure the current time is visible (with a bottom margin set in CSS)
                }
            }

            schedule.scrollTop -= 3 // Scroll back a few pixels to ensure the border looks nice
            container.scrollLeft = 0 // Ensure the page is not scrolled in the x-axis

            if (agendaView.slice(-3) === 'day') {
                widgetsCollapsed = window.innerWidth < 1100 || widgetsCollapsedSetting
                if (widgets.classList.contains('editing')) widgetsCollapsed = false
                verifyDisplayMode()
                if (document.querySelector('.menu-host')?.classList.contains('collapsed-menu') && window.innerWidth > 1200) document.querySelector('.menu-footer>a')?.click()
                listViewEnabled = listViewEnabledSetting
            } else {
                widgetsCollapsed = true
                if (widgets.classList.contains('editing')) widgetsCollapsed = false
                verifyDisplayMode()
                if (!document.querySelector('.menu-host')?.classList.contains('collapsed-menu')) document.querySelector('.menu-footer>a')?.click()
                listViewEnabled = false
            }
        })

        updateHeaderButtons()
        updateHeaderText()
    }
    renderSchedule()

    updateTemporalBindings()
    updateHeaderButtons()

    setTimeout(() => {
        updateHeaderText()
        if (document.getElementById('st-start-header-greeting')) document.getElementById('st-start-header-greeting').dataset.state = 'hidden'
        if (document.getElementById('st-start-header-text')) document.getElementById('st-start-header-text').dataset.state = 'visible'
    }, 2000)
}

function collidesWith(a, b) {
    return new Date(a.Einde) > new Date(b.Start) && new Date(a.Start) < new Date(b.Einde);
}

function checkCollision(eventArr) {
    let eventArrOut = []
    for (var i = 0; i < eventArr.length; i++) {
        eventArrOut[i] = { ...eventArr[i], cols: [], colsBefore: [] }
        for (var j = 0; j < eventArr.length; j++) {
            if (collidesWith(eventArr[i], eventArr[j])) {
                eventArrOut[i].cols.push(j)
                if (i > j) eventArrOut[i].colsBefore.push(j)
            }
        }
    }
    return eventArrOut
}

function renderEvents(events, parent) {
    parent.innerHTML = ""; // Clear previous events

    positionEvents(events).forEach(event => {
        const eventWrapperElement = createElement("div", parent, {
            class: "st-event-wrapper", textContent: event.title, style: {
                top: `calc(${event.startH} * var(--hour-height))`,
                height: `calc(${event.durationH} * var(--hour-height))`,
                left: `calc(${event.left} * 100%)`,
                width: `calc(${event.width} * 100%)`,
                borderTopLeftRadius: events.some(el => el.Einde === event.Start) ? 0 : 'var(--st-border-radius)',
                borderTopRightRadius: events.some(el => el.Einde === event.Start) ? 0 : 'var(--st-border-radius)',
                borderBottomLeftRadius: events.some(el => el.Start === event.Einde) ? 0 : 'var(--st-border-radius)',
                borderBottomRightRadius: events.some(el => el.Start === event.Einde) ? 0 : 'var(--st-border-radius)',
            }
        });

        const eventElement = createElement('div', eventWrapperElement, {
            class: 'st-event',
            title: `${event.Omschrijving || 'Geen omschrijving'}
${event.Lokatie || event.Lokalen?.map(e => e.Naam).join(', ') || 'Geen locatie'}
${event.DuurtHeleDag ? 'Hele dag' : `${new Date(event.Start).getFormattedTime()}–${new Date(event.Einde).getFormattedTime()}`}`
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
            eventWrapperElement.dataset.cancelled = true
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
}

function positionEvents(events) {
    // Step 1: Sort events by start time
    events.sort((a, b) => a.startH - b.startH);

    let activeColumns = []; // Tracks currently overlapping events

    events.forEach(event => {
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

    // Step 2: Compute width dynamically based on maxOverlap
    events.forEach(event => {
        // Get max overlap for events in the same timeslot
        let overlappingEvents = events.filter(e =>
            (e.startH < event.endH && e.endH > event.startH)
        );
        let maxColumns = Math.max(...overlappingEvents.map(e => e.column + 1));

        event.width = 1 / maxColumns; // Take up only necessary space
        event.left = (event.column / maxColumns); // Adjust left position
    });

    return events;
}