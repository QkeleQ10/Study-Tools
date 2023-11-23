let events = []

// Run at start and when the URL changes
if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
window.addEventListener('popstate', () => {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) today()
})

// Page 'Vandaag'
async function today() {
    if (!syncedStorage['start-enabled']) return

    let widgetsCollapsedSetting = await getFromStorage('start-widgets-collapsed', 'local') ?? false,
        widgetsCollapsed = widgetsCollapsedSetting ?? false,
        zoomSetting = await getFromStorage('start-zoom', 'local') || 1,
        teacherNamesSetting = await getFromStorage('start-teacher-names') || await getFromStorage('teacher-names', 'local') || {},
        widgetsOrder = await getFromStorage('start-widgets', 'local') || ['counters', 'grades', 'messages', 'homework', 'assignments', 'EXCLUDE', 'digitalClock'],
        mainView = await awaitElement('div.view.ng-scope'),
        container = element('div', 'st-start', mainView, { 'data-widgets-collapsed': widgetsCollapsed }),
        header = element('div', 'st-start-header', container),
        schedule = element('div', 'st-start-schedule', container),
        widgets = element('div', 'st-start-widgets', container)

    let widgetFunctions
    let renderSchedule, updateHeaderButtons, updateHeaderText
    let agendaStartDate, agendaEndDate

    const daysToShowSetting = syncedStorage['start-schedule-days'] || 1
    const showExtraDaySetting = syncedStorage['start-schedule-extra-day'] ?? true
    const listViewEnabledSetting = syncedStorage['start-schedule-view'] === 'list'

    let listViewEnabled = listViewEnabledSetting

    let weekView = false // False for day view, true for week view
    let agendaDayOffset = 0 // Six weeks are capable of being shown in the agenda.

    let now = new Date()

    const todayDate = new Date(new Date().setHours(0, 0, 0, 0)),
        yesterdayDate = new Date(new Date(todayDate).setDate(todayDate.getDate() - 1)),
        tomorrowDate = new Date(new Date(todayDate).setDate(todayDate.getDate() + 1)),
        firstName = (await awaitElement("#user-menu > figure > img")).alt.split(' ')[0]

    // Automagically collapse the widgets panel when it's necessary
    widgetsCollapsed = widgetsCollapsed || window.innerWidth < 1100
    verifyDisplayMode()
    window.addEventListener('resize', () => {
        widgetsCollapsed = widgetsCollapsed || window.innerWidth < 1100
        verifyDisplayMode()
    })

    todayHeader()
    todaySchedule()
    todayWidgets()

    // Birthday party mode!
    const accountInfo = await useApi(`https://amadeuslyceum.magister.net/api/account?noCache=0`),
        dateOfBirth = new Date(new Date(accountInfo.Persoon.Geboortedatum).setHours(0, 0, 0, 0)),
        birthday = new Date(new Date(dateOfBirth).setYear(now.getFullYear())),
        isBirthdayToday = (birthday.getTime() === todayDate.getTime()),
        isBirthdayYesterday = (todayDate.getDay() === 1 && birthday.getTime() === yesterdayDate.getTime()) || (todayDate.getDay() === 1 && new Date(new Date(birthday).setFullYear(birthday.getFullYear() - 1)).getTime() === yesterdayDate.getTime()),
        isBirthdayTomorrow = (todayDate.getDay() === 5 && birthday.getTime() === tomorrowDate.getTime()) || (todayDate.getDay() === 1 && new Date(new Date(birthday).setFullYear(birthday.getFullYear() + 1)).getTime() === tomorrowDate.getTime())

    if (isBirthdayToday || isBirthdayYesterday || isBirthdayTomorrow) {
        createStyle(`
nav.menu.ng-scope {
    background-image: url("https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/decorations/birthday.svg");
    background-size: 240px 480px;
    background-position: bottom 64px center;
    background-repeat: no-repeat;
}

.menu-host, .appbar-host {
    animation: rainbow 5s linear 0s 3, red-accent 500ms 15s both;
}

@keyframes red-accent {
    from {
        --st-accent-primary: hsl(0, 50%, 60%);
        --st-accent-secondary: hsl(0, 50%, 55%);
    }
}
`, 'st-party-mode')
        if (isBirthdayTomorrow)
            notify('snackbar', `Alvast van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
        else if (isBirthdayYesterday)
            notify('snackbar', `Nog van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
        else if (isBirthdayToday)
            notify('snackbar', `Van harte gefeliciteerd met je verjaardag, ${firstName}!`, null, 15000)
    }

    // Random thank you
    if (Math.random() < 0.01) notify('snackbar', "Bedankt voor het gebruiken van Study Tools 💚")

    async function todayHeader() {
        let headerText = element('span', 'st-start-header-text', header, { class: 'st-title' }),
            headerButtons = element('div', 'st-start-header-buttons', header),
            formattedWeekday = now.toLocaleString('nl-NL', { weekday: 'long' })

        // Greeting system
        const greetingsByHour = [
            [22, 'Goedenavond#', 'Goedenavond, nachtuil.', `Fijne ${formattedWeekday}avond!`, 'Bonsoir!', 'Buenas noches!', 'Guten Abend!'], // 22:00 - 23:59
            [18, 'Goedenavond#', `Fijne ${formattedWeekday}avond!`, 'Bonsoir!', 'Buenas tardes!', 'Guten Abend!'], // 18:00 - 21:59
            [12, 'Goedemiddag#', `Fijne ${formattedWeekday}middag!`, 'Bonjour!', 'Buenas tardes!', 'Guten Mittag!'], // 12:00 - 17:59
            [6, 'Goedemorgen#', 'Goeiemorgen#', `Fijne ${formattedWeekday}ochtend!`, 'Bonjour!', 'Buenos días!', 'Guten Morgen!'], // 6:00 - 11:59
            [0, 'Goedemorgen#', 'Goeiemorgen#', 'Goedemorgen, nachtuil.', 'Goedemorgen, vroege vogel!', `Fijne ${formattedWeekday}ochtend!`, 'Bonjour!', 'Buenos días!', 'Guten Morgen!'] // 0:00 - 5:59
        ],
            greetingsGeneric = ['Welkom#', 'Hallo!', `Welkom terug, ${firstName}#`, `Hey, ${firstName}#`, 'Welkom terug#', 'Goedendag!', 'Yooo!', 'Hello, handsome.', 'Guten Tag!', 'Greetings!', 'Hey!', 'Hoi!', '¡Hola!', 'Ahoy!', 'Bonjour!', 'Buongiorno!', 'Namasté!', 'Howdy!', 'G\'day!', 'Oi mate!', 'Aloha!', 'Ciao!', 'Olá!', 'Salut!', 'Saluton!', 'Hei!', 'Hej!', 'Salve!', 'Bom dia!', 'Zdravo!', 'Shalom!', 'Γεια!', 'Привіт!', 'Здравейте!', '你好！', '今日は!', '안녕하세요!']

        let possibleGreetings = []
        for (let i = 0; i < greetingsByHour.length; i++) {
            const e = greetingsByHour[i]
            if (now.getHours() >= e[0]) {
                e.shift()
                possibleGreetings.push(...e, ...e, ...e) // hour-bound greetings have 3x more chance than generic ones
                break
            }
        }
        possibleGreetings.push(...greetingsGeneric)
        const punctuation = Math.random() < 0.7 ? '.' : '!',
            greeting = possibleGreetings[Math.floor(Math.random() * possibleGreetings.length)].replace('#', punctuation)
        headerText.innerText = greeting.slice(0, -1)
        headerText.dataset.lastLetter = greeting.slice(-1)

        updateHeaderButtons = () => {
            // Update the week offset buttons accordingly
            let todayResetOffset = document.querySelector('#st-start-today-offset-zero')
            let todayDecreaseOffset = document.querySelector('#st-start-today-offset-minus')
            let todayIncreaseOffset = document.querySelector('#st-start-today-offset-plus')
            if (todayDecreaseOffset && todayIncreaseOffset) {
                todayResetOffset.disabled = (weekView && agendaDayOffset < 7) || agendaDayOffset === (todayDate.getDay() || 7) - 1
                todayDecreaseOffset.disabled = (weekView && Math.floor(agendaDayOffset / 7) * 7 <= 0) || agendaDayOffset <= 0
                todayIncreaseOffset.disabled = (weekView && Math.floor(agendaDayOffset / 7) * 7 >= 35) || agendaDayOffset >= 41
            }
        }

        updateHeaderText = () => {
            // Update the header text accordingly
            if (weekView) headerText.innerText = "Week " + getWeekNumber(new Date(new Date(now).setDate(now.getDate() + Math.floor(agendaDayOffset / 7) * 7)))
            else headerText.innerText = agendaStartDate.toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })
            headerText.dataset.lastLetter = '.'
        }

        // Buttons for moving one day backwards, moving to today's date, and moving one day forwards.
        let todayDecreaseOffset = element('button', 'st-start-today-offset-minus', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Achteruit" })
        todayDecreaseOffset.addEventListener('click', () => {
            if ((weekView && Math.floor(agendaDayOffset / 7) * 7 <= 0) || agendaDayOffset <= 0) return
            if (weekView) agendaDayOffset -= 7
            else agendaDayOffset--
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })
        let todayResetOffset = element('button', 'st-start-today-offset-zero', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Vandaag", disabled: true })
        todayResetOffset.addEventListener('click', () => {
            if ((weekView && agendaDayOffset < 7) || agendaDayOffset === (todayDate.getDay() || 7) - 1) return
            agendaDayOffset = (todayDate.getDay() || 7) - 1
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })
        let todayIncreaseOffset = element('button', 'st-start-today-offset-plus', headerButtons, { class: 'st-button icon', 'data-icon': '', title: "Vooruit" })
        todayIncreaseOffset.addEventListener('click', () => {
            if ((weekView && Math.floor(agendaDayOffset / 7) * 7 >= 35) || agendaDayOffset >= 41) return
            if (weekView) agendaDayOffset += 7
            else agendaDayOffset++
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })

        let todayViewMode = element('div', 'st-start-today-view', headerButtons, { class: 'st-segmented-control' })
        let todayViewDay = element('button', 'st-start-today-view-day', todayViewMode, { class: 'st-button segment active', innerText: "Dag" })
        let todayViewWeek = element('button', 'st-start-today-view-week', todayViewMode, { class: 'st-button segment', innerText: "Week" })
        todayViewDay.addEventListener('click', () => {
            todayViewDay.classList.add('active')
            todayViewWeek.classList.remove('active')
            widgetsCollapsed = window.innerWidth < 1100
            verifyDisplayMode()
            if (document.querySelector('.menu-host')?.classList.contains('collapsed-menu') && window.innerWidth > 1200) document.querySelector('.menu-footer>a')?.click()
            weekView = false
            listViewEnabled = listViewEnabledSetting
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })
        todayViewWeek.addEventListener('click', () => {
            todayViewDay.classList.remove('active')
            todayViewWeek.classList.add('active')
            widgetsCollapsed = true
            verifyDisplayMode()
            if (!document.querySelector('.menu-host')?.classList.contains('collapsed-menu')) document.querySelector('.menu-footer>a')?.click()
            weekView = true
            listViewEnabled = false
            renderSchedule()
            updateHeaderButtons()
            updateHeaderText()
        })

        // Controls (bottom right of page)
        let widgetControlsWrapper = element('div', 'st-start-widget-controls-wrapper', container)
        let widgetControls = element('div', 'st-start-widget-controls', widgetControlsWrapper)

        // Zoom buttons
        let zoomOut = element('button', 'st-start-edit-zoom-out', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "uitzoomen" })
        let zoomIn = element('button', 'st-start-edit-zoom-in', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "Inzoomen" })
        zoomOut.addEventListener('click', () => {
            zoomSetting -= .1
            effectuateZoom(zoomOut)
        })
        zoomIn.addEventListener('click', () => {
            zoomSetting += .1
            effectuateZoom(zoomIn)
        })
        function effectuateZoom(source) {
            zoomSetting = Math.min(Math.max(0.4, zoomSetting), 4)
            saveToStorage('start-zoom', zoomSetting, 'local')
            document.querySelector('#st-start-ticks-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
            document.querySelector('#st-start-schedule-wrapper').setAttribute('style', `--hour-zoom: ${zoomSetting}`)
            if (source) {
                let ghost = element('span', null, document.body, { class: 'st-number-ghost', innerText: `${Math.round(zoomSetting * 100)}%`, style: `top: ${source.getBoundingClientRect().top}px; left: ${source.getBoundingClientRect().left}px;` })
                setTimeout(() => ghost.remove(), 1000)
            }
        }

        let editor

        (async () => {

            // Editor overlay
            editor = element('dialog', 'st-start-editor', document.body, { class: 'st-overlay' })
            let editorHeading = element('div', 'st-start-editor-heading', editor),
                editorTitle = element('span', 'st-start-editor-title', editorHeading, { class: 'st-title', innerText: "Opties" }),
                editorSubtitle = element('span', 'st-start-editor-subtitle', editorHeading, { class: 'st-subtitle', innerText: "Andere opties vind je in het configuratiepaneel van Study Tools." }),
                editorClose = element('button', 'st-start-editor-close', editorHeading, { class: 'st-button', 'data-icon': '', innerText: "Sluiten" }),
                editorTeachers = element('div', 'st-start-editor-teachers', editor, { class: 'st-list st-tile' }),
                editorTeachersTitle = element('span', 'st-start-editor-teachers-title', editorTeachers, { class: 'st-section-title', 'data-icon': '', innerText: "Bijnamen" }),
                editorWidgets = element('div', 'st-start-editor-widgets', editor, { class: 'st-list st-tile' }),
                editorWidgetsTitle = element('span', 'st-start-editor-widgets-title', editorWidgets, { class: 'st-section-title', 'data-icon': '', innerText: "Widgets" })
            editorClose.addEventListener('click', () => {
                editor.close()
                todayWidgets()
                renderSchedule()
            })

            // Nicknames editor 
            {
                now = new Date()
                let todayDate = new Date(new Date().setHours(0, 0, 0, 0))

                const gatherStart = new Date()
                gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
                gatherStart.setHours(0, 0, 0, 0)

                const gatherEnd = new Date()
                gatherEnd.setDate(now.getDate() + 42)
                gatherEnd.setHours(0, 0, 0, 0)

                agendaDayOffset = Math.floor((todayDate - gatherStart) / 86400000)

                const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
                const events = eventsRes.Items

                const eventsTeachers = events.flatMap(item => item.Docenten).filter((value, index, self) =>
                    index === self.findIndex((t) => (
                        t.Docentcode === value.Docentcode
                    ))
                )

                const allTeacherNames = {
                    ...teacherNamesSetting,
                    ...eventsTeachers.reduce((obj, item) => (obj[item.Docentcode] = teacherNamesSetting[item.Docentcode] || null, obj), {})
                }

                let nicknamesList = element('div', 'st-start-edit-nicknames-list', editorTeachers)

                for (const key in allTeacherNames) {
                    if (Object.hasOwnProperty.call(allTeacherNames, key)) {
                        const value = allTeacherNames[key],
                            teacherName = eventsTeachers.find(item => item.Docentcode === key)?.Naam
                        let wrapper = element('div', `st-start-edit-nicknames-list-${key}`, nicknamesList)
                        let label = element('label', `st-start-edit-nicknames-list-${key}-label`, wrapper, { innerText: key, style: `text-decoration: ${teacherName ? 'underline' : 'none'}`, title: teacherName ? (value ? `Je hebt ${key} (${teacherName}) een bijnaam gegeven en\ndeze docent komt ook voor in je rooster van de komende 6 weken.` : `Je hebt ${key} (${teacherName}) geen bijnaam gegeven, maar\ndeze docent komt wel voor in je rooster van de komende 6 weken.`) : `Je hebt ${key} eerder een bijnaam gegeven, maar\ndeze docent komt niet voor in je rooster van de komende 6 weken.` })
                        let input = element('input', `st-start-edit-nicknames-list-${key}-input`, wrapper, { class: 'st-input', value: value || '', placeholder: teacherName || '' })
                        input.addEventListener('change', async () => {
                            teacherNamesSetting[key] = input.value
                            teacherNamesSetting = Object.fromEntries(Object.entries(teacherNamesSetting).filter(([_, v]) => v != null && v.length > 0))
                            await saveToStorage('start-teacher-names', teacherNamesSetting)
                        })
                    }
                }
            }

            // Widgets editor
            {
                let includedWidgetsHeading = element('span', 'st-start-edit-include', editorWidgets, { innerText: "Ingeschakelde widgets" })
                let sortableList = element('ul', 'st-start-edit-wrapper', editorWidgets, { class: 'st-sortable-list' })

                Object.keys(widgetFunctions).forEach(key => {
                    if (!widgetsOrder.find(e => e === key)) widgetsOrder.push(key)
                })

                let exclusionIndex = widgetsOrder.findIndex(e => e === 'EXCLUDE')
                widgetsOrder.forEach((key, i) => {
                    if (i === exclusionIndex) {
                        let excludedWidgetsHeading = element('span', 'st-start-edit-exclude', sortableList, { innerText: "Uitgeschakelde widgets", 'data-value': "EXCLUDE" })
                        return
                    }

                    let widgetName = widgetFunctions[key].title
                    let item = element('li', `st-start-edit-${key}`, sortableList, { class: 'st-sortable-list-item', innerText: widgetName, draggable: true, 'aria-roledescription': "Sleepbaar item. Gebruik spatie om op te tillen.", 'data-value': key })

                    if (i > exclusionIndex) item.classList.add('excluded')

                    if (widgetFunctions[key].options) {
                        widgetFunctions[key].options.forEach(option => {
                            let optionWrapper = element('div', `st-start-edit-${option.key}`, item, { class: 'st-sortable-list-item-option' })
                            let optionTitle = element('label', `st-start-edit-${option.key}-title`, optionWrapper, { for: `st-start-edit-${option.key}-input`, innerText: option.title })
                            switch (option.type) {
                                case 'select':
                                    let optionInput = element('select', `st-start-edit-${option.key}-input`, optionWrapper, { name: option.title })
                                    option.choices.forEach(async choice => {
                                        let optionChoice = element('option', `st-start-edit-${option.key}-${choice.value}`, optionInput, { value: choice.value, innerText: choice.title })
                                        if (await getFromStorage(option.key, 'local') === choice.value) optionChoice.setAttribute('selected', true)
                                    })
                                    optionInput.addEventListener('change', event => {
                                        saveToStorage(option.key, event.target.value, 'local')
                                    })
                                    break

                                case 'description':
                                    let optionText = element('span', `st-start-edit-${option.key}-text`, optionWrapper, { name: option.title })
                                    break

                                default:
                                    // Implement other option types as necessary
                                    break
                            }
                        })
                    }

                    item.addEventListener('dragstart', event => {
                        setTimeout(() => {
                            item.classList.add('dragging')
                        }, 0)

                        let dragGhost = item.cloneNode(true)
                        dragGhost.id += '-ghost'
                        dragGhost.classList.add('st-sortable-list-ghost')
                        dragGhost.classList.remove('dragging')
                        dragGhost.setAttribute('style', `top: ${item.getBoundingClientRect().top}px; left: ${item.getBoundingClientRect().left}px; width: ${item.getBoundingClientRect().width}px; height: ${item.getBoundingClientRect().height}px; translate: ${event.clientX}px ${event.clientY}px; transform: translateX(-${event.clientX}px) translateY(-${event.clientY}px);`)
                        editor.append(dragGhost)
                    })
                    item.addEventListener('dragend', () => {
                        item.classList.remove('dragging')
                        item.classList.add('dragging-return')
                        document.querySelectorAll('.st-sortable-list-ghost').forEach(e => {
                            e.classList.add('returning')
                            e.setAttribute('style', `top: ${item.getBoundingClientRect().top}px; left: ${item.getBoundingClientRect().left}px; width: ${item.getBoundingClientRect().width}px; height: ${item.getBoundingClientRect().height}px;`)
                            setTimeout(() => {
                                e.remove()
                                item.classList.remove('dragging-return')
                            }, 200)
                        })
                    })

                })
                sortableList.addEventListener('dragover', (event) => {
                    event.preventDefault()

                    const draggingItem = document.querySelector('.dragging')

                    const draggingGhost = document.querySelector('.st-sortable-list-ghost')
                    draggingGhost.style.translate = `${event.clientX}px ${event.clientY}px`

                    let siblings = [...draggingItem.parentElement.children].filter(child => child !== draggingItem)

                    let nextSibling = siblings.find(sibling => {
                        return (event.clientY) <= (sibling.getBoundingClientRect().y + sibling.getBoundingClientRect().height / 2)
                    })

                    sortableList.insertBefore(draggingItem, nextSibling)

                    widgetsOrder = [...sortableList.children].map(element => element.dataset.value)
                    saveToStorage('start-widgets', widgetsOrder, 'local')

                    if (Array.prototype.indexOf.call(sortableList.children, sortableList.querySelector('.dragging')) > Array.prototype.indexOf.call(sortableList.children, sortableList.querySelector('#st-start-edit-exclude'))) {
                        draggingGhost.classList.add('excluded')
                        draggingItem.classList.add('excluded')
                    }
                    else {
                        draggingGhost.classList.remove('excluded')
                        draggingItem.classList.remove('excluded')
                    }
                })
                sortableList.addEventListener('dragenter', e => e.preventDefault())
            }

        })()

        // Editor invoke button
        let invokeEditor = element('button', 'st-start-invoke-editor', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "Opties\nPas bijnamen aan en personaliseer het widgetpaneel" })
        invokeEditor.addEventListener('click', async () => {
            editor.showModal()
        })

        // Side panel collapse/expand button
        let todayCollapseWidgets = element('button', 'st-start-collapse-widgets', widgetControls, { class: 'st-button icon', 'data-icon': '', title: "Widgetpaneel weergeven of verbergen" })
        todayCollapseWidgets.addEventListener('click', () => {
            widgetsCollapsed = !widgetsCollapsed
            widgetsCollapsedSetting = widgetsCollapsed
            saveToStorage('start-widgets-collapsed', widgetsCollapsedSetting, 'local')
            verifyDisplayMode()
        })

        // Allow for keyboard navigation
        document.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft' && !todayDecreaseOffset.disabled) todayDecreaseOffset.click()
            else if (event.key === 'ArrowRight' && !todayIncreaseOffset.disabled) todayIncreaseOffset.click()
        })
    }

    async function todaySchedule() {
        let interval

        now = new Date()
        let todayDate = new Date(new Date().setHours(0, 0, 0, 0))

        const gatherStart = new Date()
        gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
        gatherStart.setHours(0, 0, 0, 0)

        const gatherEnd = new Date()
        gatherEnd.setDate(now.getDate() + 42)
        gatherEnd.setHours(0, 0, 0, 0)

        agendaDayOffset = Math.floor((todayDate - gatherStart) / 86400000)

        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
        const events = eventsRes.Items

        // Create an array with 42 days (6 weeks) containing events of those days
        let agendaDays = []
        for (let i = 0; i < 42; i++) {
            const date = new Date(new Date(gatherStart.getTime()).setDate(gatherStart.getDate() + i))
            const eventsOfDay =
                events.filter(item => {
                    const startDate = new Date(item.Start)
                    return (startDate - date) < 86400000 && (startDate - date) >= 0 // Add all events that are on this date to this element
                }) || []

            let eventsOfDayWithCollision = checkCollision(eventsOfDay)

            agendaDays.push({
                date: new Date(date),
                today: (date - todayDate) === 0, // Days have the highest relevancy when they match the current date.
                tomorrow: (date - todayDate) === 86400000, // Days have increased relevancy when they match tomorrow's date.
                irrelevant: eventsOfDayWithCollision.length < 1 || date < todayDate, // Days are irrelevant when they are empty or in the past.
                events: eventsOfDayWithCollision
            })
        }

        // Start rendering
        renderSchedule = async () => {

            // Select which days to show based on view mode
            if (!weekView) {
                // When in day view, the first day shown should be today. The amount of days set to be shown dictates the last day shown.
                agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + agendaDayOffset))
                if (listViewEnabled) {
                    schedule.classList.add('list-view')
                    agendaEndDate = new Date(new Date(agendaStartDate))
                } else {
                    let daysToShow = daysToShowSetting

                    // Add an extra day to the day view if the last event of the day has passed. (given the user has chosen for this to happen)
                    let todayEvents = agendaDays.find(item => item.today).events
                    let todayEndTime = new Date(Math.max(...todayEvents.map(item => new Date(item.Einde))))
                    if ((new Date() >= todayEndTime || todayEvents.length < 1) && showExtraDaySetting && daysToShow === 1 && agendaDayOffset === (todayDate.getDay() || 7) - 1) daysToShow++

                    agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + daysToShow - 1))
                }
                schedule.classList.remove('week-view')
            } else {
                // When in week view, the first day shown should be the Monday of the selected week. The last day shown should be 6 days later.
                agendaStartDate = new Date(new Date(gatherStart).setDate(gatherStart.getDate() + Math.min(Math.max(0, Math.floor(agendaDayOffset / 7) * 7), 41)))
                agendaEndDate = new Date(new Date(agendaStartDate).setDate(agendaStartDate.getDate() + 6))
                schedule.classList.add('week-view')
                schedule.classList.remove('list-view')
            }

            now = new Date()

            clearInterval(interval)

            let ticksWrapper = element('div', 'st-start-ticks-wrapper', schedule, { style: `--hour-zoom: ${zoomSetting || 1}` })
            let scheduleWrapper = element('div', 'st-start-schedule-wrapper', schedule, { style: `--hour-zoom: ${zoomSetting || 1}`, innerText: '' })

            // Create tick marks for schedule view
            if (!listViewEnabled) {
                for (let i = 0; i <= 24; i += 0.5) {
                    let hourTick = element('div', `st-start-tick-${i}h`, ticksWrapper, { class: `st-start-tick ${Number.isInteger(i) ? 'whole' : 'half'}`, style: `--relative-start: ${i}` })
                }
            }

            agendaDays.forEach((item, i, a) => {
                // If the date falls outside the agenda range, don't proceed.
                if (item.date < agendaStartDate || item.date > agendaEndDate) return

                // Create a column for the day
                let column = element('div', `st-start-col-${i}`, scheduleWrapper, {
                    class: 'st-start-col',
                    'data-today': item.today,
                    'data-tomorrow': item.tomorrow,
                    'data-irrelevant': item.irrelevant
                }),
                    columnLabel = element('div', `st-start-col-${i}-head`, column, {
                        class: 'st-start-col-head',
                        innerText: item.today ? "Vandaag" : item.tomorrow ? "Morgen" : item.date.toLocaleDateString('nl-NL', { weekday: 'long', month: 'long', day: 'numeric' })
                    })

                // Loop through all events of the day
                item.events.forEach((item, i) => {
                    let ongoing = (new Date(item.Start) < now && new Date(item.Einde) > now)

                    // Render the event element
                    // TODO: BUG: overlap is quite broken!
                    // TODO: BUG: all-day events show up as normal ones, but with a duration of 0.
                    let eventElement = element('button', `st-start-event-${item.Id}`, column, { class: 'st-start-event', 'data-2nd': item.Omschrijving, 'data-ongoing': ongoing, 'data-start': item.Start, 'data-end': item.Einde, style: `--relative-start: ${timeInHours(item.Start)}; --duration: ${timeInHours(item.Einde) - timeInHours(item.Start)}; --cols: ${item.cols.length}; --cols-before: ${item.colsBefore.length};`, title: `${item.Omschrijving}\n${item.Lokatie}\n${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.Einde).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })}` })
                    let egg = eggs.find(egg => egg.location === 'personalEventTitle' && egg.matchRule === 'startsWith' && item.Omschrijving.startsWith(egg.input))
                    if (egg && egg.type === 'dialog') {
                        eventElement.addEventListener('click', () => notify('dialog', egg.output))
                    } else {
                        eventElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)
                    }

                    // Parse and array-ify the subjects, the teachers and the locations
                    let subjectNames = item.Vakken?.map((e, i, a) => {
                        if (i === 0) return e.Naam.charAt(0).toUpperCase() + e.Naam.slice(1)
                        return e.Naam
                    }) || [item.Omschrijving]
                    let teacherNames = item.Docenten?.map((e, i, a) => {
                        return (teacherNamesSetting[e.Docentcode] || e.Naam) + ` (${e.Docentcode})`
                    }) || []
                    let locationNames = item.Lokalen?.map(e => e.Naam) || [item.Lokatie]
                    if (subjectNames.length < 1 && item.Omschrijving) subjectNames.push(item.Omschrijving)
                    if (locationNames.length < 1 && item.Lokatie) locationNames.push(item.Lokatie)

                    // Render the school hour label
                    let schoolHours = (item.LesuurVan === item.LesuurTotMet) ? item.LesuurVan : `${item.LesuurVan}-${item.LesuurTotMet}`
                    let eventSchoolHours = element('div', `st-start-event-${item.Id}-school-hours`, eventElement, { class: 'st-start-event-school-hours', innerText: schoolHours })
                    if (item.Type === 1) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = '' // Icon: user-lock
                    }
                    if (item.Type === 16) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = '' // Icon: user-edit
                    }
                    if (!eventSchoolHours.innerText) {
                        eventSchoolHours.classList.add('icon')
                        eventSchoolHours.innerText = '' // Icon: calendar-day
                    }

                    // Cancelled label
                    if (item.Status === 5) {
                        eventElement.classList.add('cancelled')
                        element('div', `st-start-event-${item.Id}-cancelled`, eventElement, { class: 'st-start-event-cancelled', title: "Dit blok vervalt mogelijk.\nControleer alsjeblieft even je Magister-app of de pagina 'Agenda'!" })
                    }

                    // Render the subject and location label
                    if (listViewEnabled) {
                        let eventSubject = element('span', `st-start-event-${item.Id}-subject`, eventElement, { class: 'st-start-event-subject', innerText: item.Lokatie ? `${item.Omschrijving} (${item.Lokatie})` : item.Omschrijving })
                    } else {
                        let eventSubjectWrapper = element('span', `st-start-event-${item.Id}-subject-wrapper`, eventElement, { class: 'st-start-event-subject-wrapper' })
                        let eventSubject = element('span', `st-start-event-${item.Id}-subject`, eventSubjectWrapper, { class: 'st-start-event-subject', innerText: subjectNames.join(', ') })
                        let eventLocation = element('span', `st-start-event-${item.Id}-location`, eventSubjectWrapper, { class: 'st-start-event-location', innerText: locationNames.join(', ') })
                    }

                    let row = element('div', `st-start-event-${item.Id}-row1`, eventElement, { class: 'st-list-row' })

                    // Render the teacher label
                    if (!listViewEnabled && item.Docenten[0]) {
                        let eventTeacher = element('span', `st-start-event-${item.Id}-teacher`, row, { class: 'st-start-event-teacher', innerText: teacherNames.join(', ') })
                    }

                    // Render the time label
                    let eventTime = element('span', `st-start-event-${item.Id}-time`, row, { class: 'st-start-event-time', innerText: `${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })} - ${new Date(item.Einde).toLocaleTimeString('nl-NL', { hour: "2-digit", minute: "2-digit" })}` })

                    // Parse and render any chips
                    let chips = eventChips(item)

                    let eventChipsWrapper = element('div', `st-start-event-${item.Id}-chips`, eventElement, { class: 'st-chips-wrapper' })
                    chips.forEach(chip => {
                        let chipElement = element('span', `st-start-event-${item.Id}-chip-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                    })
                })

                if (!listViewEnabled && item.today) {
                    // Add a marker of the current time (if applicable) and scroll to it if the scroll position is 0.
                    let currentTimeMarker = element('div', `st-start-now`, column, { style: `--relative-start: ${timeInHours(now)}` })
                    if (schedule.scrollTop === 0 && (!weekView || listViewEnabledSetting && weekView)) {
                        schedule.scrollTop = zoomSetting * 115 * 8 // Default scroll to 08:00
                        if (column.querySelector('.st-start-event:last-of-type')) column.querySelector('.st-start-event:last-of-type').scrollIntoView({ block: 'nearest', behavior: 'instant' }) // If there are events today, ensure the last event is visible.
                        if (column.querySelector('.st-start-event')) column.querySelector('.st-start-event').scrollIntoView({ block: 'nearest', behavior: 'instant' }) // If there are events today, ensure the first event is visible.
                        schedule.scrollTop -= 1 // Scroll back one pixel to ensure the border looks nice.
                        currentTimeMarker.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) // Ensure the current time is visible (with a bottom margin set in CSS)
                    }
                    // Keep the current time marker updated every 10 seconds.
                    interval = setInterval(() => {
                        if (!currentTimeMarker) {
                            clearInterval(interval)
                        } else if (timeInHours(now) >= 24) {
                            clearInterval(interval)
                            renderSchedule()
                        } else {
                            now = new Date()
                            currentTimeMarker = element('div', `st-start-now`, null, { style: `--relative-start: ${timeInHours(now)}` })
                        }
                    }, 10000)
                }
            })
        }
        renderSchedule()

        updateHeaderButtons()

        setTimeout(() => {
            header.dataset.transition = true
            setTimeout(async () => {
                updateHeaderText()
                header.removeAttribute('data-transition')
            }, 300)
        }, 2000)

        // Update ongoing events every 30 seconds
        updateSchedule = () => {
            let events = document.querySelectorAll('.st-start-event[data-start][data-end]')
            now = new Date()

            events.forEach(item => {
                let ongoing = (new Date(item.dataset.start) < now && new Date(item.dataset.end) > now)
                if (ongoing) item.dataset.ongoing = true
                else item.dataset.ongoing = false
            })
        }
        setInterval(updateSchedule, 30000)
    }

    async function todayWidgets() {
        widgets.innerText = ''

        let widgetsProgress = element('div', 'st-start-widget-progress', widgets, { class: 'st-progress-bar' })
        let widgetsProgressValue = element('div', 'st-start-widget-progress-value', widgetsProgress, { class: 'st-progress-bar-value indeterminate' })
        let widgetsProgressText = element('span', 'st-start-widget-progress-text', widgets, { class: 'st-subtitle', innerText: "Widgets laden..." })

        now = new Date()

        const gatherStart = new Date()
        gatherStart.setDate(now.getDate() - (now.getDay() + 6) % 7)
        gatherStart.setHours(0, 0, 0, 0)

        const gatherEnd = new Date()
        gatherEnd.setDate(now.getDate() + 30 + (7 - (now.getDay() + 30) % 7))
        gatherEnd.setHours(0, 0, 0, 0)

        let widgetsShown = widgetsOrder.slice(0, widgetsOrder.findIndex(item => item === 'EXCLUDE'))

        widgetFunctions = {

            counters: {
                title: "Beknopte notificaties",
                options: [
                    {
                        title: "Tellertjes die overige informatie (activiteiten, logboeken, etc.) weergeven indien beschikbaar.",
                        key: 'start-widget-misc-widget',
                        type: 'description'
                    }
                ],
                render: async () => {
                    return new Promise(async resolve => {
                        let elems = []

                        if (!widgetsShown.includes('grades')) {
                            widgetsProgressText.innerText = `Cijfers ophalen...`
                            let lastViewMs = await getFromStorage('viewedGrades', 'local') || 0
                            let lastViewDate = new Date(lastViewMs)
                            if (!lastViewDate || !(lastViewDate instanceof Date) || isNaN(lastViewDate)) lastViewDate = new Date().setDate(now.getDate() - 7)
                            const gradesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/cijfers/laatste?top=12&skip=0`)
                            const unreadGradesNum = gradesRes.items.filter(item => new Date(item.ingevoerdOp) > lastViewDate).length
                            if (unreadGradesNum > 0) {
                                elems.push(element('div', 'st-start-widget-counters-grades', null, { class: 'st-metric', innerText: unreadGradesNum > 11 ? "10+" : unreadGradesNum, 'data-description': "Cijfers" }))
                            }
                        }

                        if (!widgetsShown.includes('messages')) {
                            widgetsProgressText.innerText = `Berichten ophalen...`
                            const messagesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`)
                            const unreadMessagesNum = messagesRes.totalCount
                            if (unreadMessagesNum > 0) {
                                elems.push(element('div', 'st-start-widget-counters-messages', null, { class: 'st-metric', innerText: unreadMessagesNum, 'data-description': "Berichten" }))
                            }
                        }

                        if (!widgetsShown.includes('homework')) {
                            widgetsProgressText.innerText = `Huiswerk ophalen...`
                            const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
                            const homeworkEvents = eventsRes.Items.filter(item => item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                            if (homeworkEvents.length > 0) {
                                elems.push(element('div', 'st-start-widget-counters-homework', null, { class: 'st-metric', innerText: homeworkEvents.length, 'data-description': "Huiswerk" }))
                            }
                        }

                        if (!widgetsShown.includes('assignments')) {
                            widgetsProgressText.innerText = `Opdrachten ophalen...`
                            const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`)
                            const dueAssignments = assignmentsRes.Items.filter(item => !item.Afgesloten && !item.IngeleverdOp)
                            if (dueAssignments.length > 0) {
                                elems.push(element('div', 'st-start-widget-counters-assignments', null, { class: 'st-metric', innerText: dueAssignments.length, 'data-description': "Opdrachten" }))
                            }
                        }

                        widgetsProgressText.innerText = `Activiteiten ophalen...`
                        const activitiesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/activiteiten?status=NogNietAanEisVoldaan&count=true`)
                        const activitiesNum = activitiesRes.TotalCount
                        if (activitiesNum > 0) {
                            elems.push(element('div', 'st-start-widget-counters-activities', null, { class: 'st-metric', innerText: activitiesNum, 'data-description': "Activiteiten" }))
                        }

                        widgetsProgressText.innerText = `Logboeken ophalen...`
                        const logsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/leerlingen/$USERID/logboeken/count`)
                        const logsNum = logsRes.count
                        if (logsNum > 0) {
                            elems.push(element('div', 'st-start-widget-counters-logs', null, { class: 'st-metric', innerText: logsNum, 'data-description': "Logboeken" }))
                        }

                        if (elems.length < 1) return resolve()

                        let widgetElement = element('div', 'st-start-widget-counters', null, { class: 'st-widget' })
                        widgetElement.append(...elems)

                        resolve(widgetElement)
                    })
                }
            },

            grades: {
                title: "Cijfers",
                options: [
                    {
                        title: "Widget weergeven",
                        key: 'start-widget-cf-widget',
                        type: 'select',
                        choices: [
                            {
                                title: "Altijd",
                                value: 'always'
                            },
                            {
                                title: "Bij nieuw cijfer",
                                value: 'new'
                            }
                        ]
                    },
                    {
                        title: "Beoordeling weergeven",
                        key: 'start-widget-cf-result',
                        type: 'select',
                        choices: [
                            {
                                title: "Altijd",
                                value: 'always'
                            },
                            {
                                title: "Alleen voldoendes",
                                value: 'sufficient'
                            },
                            {
                                title: "Nooit",
                                value: 'never'
                            }
                        ]
                    }
                ],
                render: async () => {
                    return new Promise(async resolve => {
                        let viewWidget = await getFromStorage('start-widget-cf-widget', 'local') || 'always'
                        let viewResult = await getFromStorage('start-widget-cf-result', 'local') || 'always'
                        let hiddenItems = await getFromStorage('hiddenGrades', 'local') || []
                        let lastViewMs = await getFromStorage('viewedGrades', 'local') || 0
                        let lastViewDate = new Date(lastViewMs)
                        if (!lastViewDate || !(lastViewDate instanceof Date) || isNaN(lastViewDate)) lastViewDate = new Date().setDate(now.getDate() - 7)

                        const gradesJson = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/cijfers/laatste?top=12&skip=0`)
                        const recentGrades = gradesJson.items.map(item => {
                            return {
                                ...item,
                                date: new Date(item.ingevoerdOp),
                                unread: new Date(item.ingevoerdOp) > lastViewDate,
                                hidden: (hiddenItems.includes(item.kolomId)) || (viewResult === 'sufficient' && !item.isVoldoende) || (viewResult === 'never') // Hide if hidden manually, or if insufficient and user has set widget to sufficient only, or if user has set widget to hide result.
                            }
                        })

                        if (recentGrades.length < 1 || (viewWidget === 'new' && recentGrades.filter(item => item.unread).length < 1)) return resolve() // Stop if no grades, or if no new grades and user has set widget to new grades only.

                        let widgetElement = element('button', 'st-start-widget-grades', null, { class: 'st-tile st-widget', title: "Laatste cijfers bekijken" })
                        widgetElement.addEventListener('click', () => {
                            window.location.hash = '#/cijfers'
                        })
                        let widgetTitle = element('div', 'st-start-widget-grades-title', widgetElement, { class: 'st-widget-title', innerText: "Laatste cijfer" })

                        let mostRecentItem = recentGrades[0]
                        if (mostRecentItem.unread) widgetElement.classList.add('st-unread')

                        let lastGrade = element('span', 'st-start-widget-grades-last', widgetElement, { innerText: mostRecentItem.waarde })
                        if (mostRecentItem.hidden) lastGrade.style.display = 'none'
                        let lastGradeSubj = element('span', 'st-start-widget-grades-last-subj', widgetElement, { innerText: mostRecentItem.vak.omschrijving.charAt(0).toUpperCase() + mostRecentItem.vak.omschrijving.slice(1) })
                        let lastGradeInfo = element('span', 'st-start-widget-grades-last-info', widgetElement, { innerText: mostRecentItem.weegfactor > 0 && mostRecentItem.teltMee ? `${mostRecentItem.omschrijving} (${mostRecentItem.weegfactor}×)` : mostRecentItem.omschrijving })
                        let lastGradeDate = element('span', 'st-start-widget-grades-last-date', widgetElement, { innerText: mostRecentItem.unread ? getRelativeTimeString(new Date(mostRecentItem.date)) : mostRecentItem.date.toLocaleDateString('nl-NL', { month: 'long', day: 'numeric' }) })
                        let lastGradeHide = element('button', 'st-start-widget-grades-last-hide', widgetElement, { class: 'st-button icon', 'data-icon': mostRecentItem.hidden ? '' : '', title: "Dit specifieke cijfer verbergen/weergeven" })
                        lastGradeHide.addEventListener('click', (event) => {
                            event.stopPropagation()
                            if (lastGrade.style.display === 'none') {
                                lastGradeHide.dataset.icon = ''
                                lastGrade.style.display = 'block'
                                hiddenItems = hiddenItems.filter(item => item !== mostRecentItem.kolomId)
                                saveToStorage('hiddenGrades', hiddenItems, 'local')
                            } else {
                                lastGradeHide.dataset.icon = ''
                                lastGrade.style.display = 'none'
                                hiddenItems.push(mostRecentItem.kolomId)
                                saveToStorage('hiddenGrades', hiddenItems, 'local')
                            }
                        })

                        let moreUnreadItems = recentGrades.filter(item => item.unread)
                        moreUnreadItems.shift()

                        widgetTitle.innerText = moreUnreadItems.length > 0 ? "Laatste cijfers" : "Laatste cijfer"

                        if (moreUnreadItems.length === 1) {
                            let moreGrades = element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En een ander cijfer voor ${moreUnreadItems[0].item.vak.code}` })
                        } else if (moreUnreadItems.length > 10) {
                            let moreGrades = element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En nog meer cijfers voor o.a. ${[...new Set(moreUnreadItems.map(item => item.vak.code))].join(', ').replace(/, ([^,]*)$/, ' en $1')}` })
                        } else if (moreUnreadItems.length > 1) {
                            let moreGrades = element('span', 'st-start-widget-grades-more', widgetElement, { innerText: `En nog ${moreUnreadItems.length} cijfers voor ${[...new Set(moreUnreadItems.map(item => item.vak.code))].join(', ').replace(/, ([^,]*)$/, ' en $1')}` })
                        }

                        resolve(widgetElement)
                    })
                }
            },

            messages: {
                title: "Berichten",
                render: async () => {
                    return new Promise(async resolve => {
                        const messagesRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/berichten/postvakin/berichten?top=12&skip=0&gelezenStatus=ongelezen`)
                        const unreadMessages = messagesRes.items

                        if (unreadMessages.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-messages', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-start-widget-messages-title', widgetElement, { class: 'st-widget-title', innerText: "Berichten", 'data-amount': unreadMessages.length })

                        unreadMessages.forEach(item => {
                            let messageElement = element('button', `st-start-widget-messages-${item.id}`, widgetElement, { class: 'st-list-item' })
                            messageElement.addEventListener('click', () => window.location.hash = `#/berichten`)

                            let row1 = element('span', `st-start-widget-messages-${item.id}-row1`, messageElement, { class: 'st-list-row' })
                            let messageSender = element('span', `st-start-widget-messages-${item.id}-title`, row1, { class: 'st-list-title', innerText: item.afzender.naam })
                            let messageDate = element('span', `st-start-widget-messages-${item.id}-date`, row1, {
                                class: 'st-list-timestamp',
                                innerText: new Date(item.verzondenOp).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
                            })

                            let row2 = element('span', `st-start-widget-messages-${item.id}-row2`, messageElement, { class: 'st-list-row' })
                            let messageSubject = element('div', `st-start-widget-messages-${item.id}-content`, row2, { class: 'st-list-content', innerText: item.onderwerp })

                            let chips = []
                            if (item.heeftPrioriteit) chips.push({ name: "Belangrijk", type: 'warn' })

                            let messageChipsWrapper = element('div', `st-start-widget-messages-${item.id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-messages-${item.id}-chip-${chip.name}`, messageChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            homework: {
                title: "Huiswerk",
                options: [
                    {
                        title: "Afgeronde items tonen",
                        key: 'start-widget-hw-filter',
                        type: 'select',
                        choices: [
                            {
                                title: "Alleen onvoltooid",
                                value: 'incomplete'
                            },
                            {
                                title: "Alles",
                                value: 'all'
                            }
                        ]
                    }
                ],
                render: async () => {
                    return new Promise(async resolve => {
                        const filterOption = await getFromStorage('start-widget-hw-filter', 'local') || 'incomplete'
                        const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
                        const homeworkEvents = eventsRes.Items.filter(item => {
                            if (filterOption === 'incomplete')
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date() && !item.Afgerond)
                            else
                                return (item.Inhoud?.length > 0 && new Date(item.Einde) > new Date())
                        })

                        if (homeworkEvents.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-homework', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-start-widget-homework-title', widgetElement, { class: 'st-widget-title', innerText: "Huiswerk", 'data-amount': homeworkEvents.length })

                        homeworkEvents.forEach(item => {
                            let subjectNames = item.Vakken?.map((e, i, a) => {
                                if (i === 0) return e.Naam.charAt(0).toUpperCase() + e.Naam.slice(1)
                                return e.Naam
                            }) || [item.Omschrijving]
                            if (subjectNames.length < 1 && item.Omschrijving) subjectNames.push(item.Omschrijving)

                            let
                                date = `week ${getWeekNumber(new Date(item.Start))}, ${new Date(item.Start).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (getWeekNumber(new Date(item.Start)) === getWeekNumber())
                                date = `${new Date(item.Start).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (new Date(item.Start).toDateString() === new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString())
                                date = `morgen ${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.Start))})`
                            if (new Date(item.Start).toDateString() === new Date().toDateString())
                                date = `vandaag ${new Date(item.Start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.Start))})`

                            let eventElement = element('button', `st-start-widget-homework-${item.Id}`, widgetElement, { class: 'st-list-item' })
                            eventElement.addEventListener('click', () => window.location.hash = `#/agenda/huiswerk/${item.Id}`)

                            let row1 = element('span', `st-start-widget-homework-${item.Id}-row1`, eventElement, { class: 'st-list-row' })
                            let eventSubject = element('span', `st-start-widget-homework-${item.Id}-title`, row1, { class: 'st-list-title', innerText: subjectNames.join(', ') })
                            let eventDate = element('span', `st-start-widget-homework-${item.Id}-date`, row1, {
                                class: 'st-list-timestamp',
                                innerText: date
                            })

                            let row2 = element('span', `st-start-widget-homework-${item.Id}-row2`, eventElement, { class: 'st-list-row' })
                            let eventContent = element('div', `st-start-widget-homework-${item.Id}-content`, row2, { class: 'st-list-content' })
                            eventContent.innerHTML = item.Inhoud.replace(/(<br ?\/?>)/gi, '') // eventContent.setHTML(item.Inhoud)
                            if (eventContent.scrollHeight > eventContent.clientHeight) eventContent.classList.add('overflow')

                            let chips = eventChips(item)

                            let eventChipsWrapper = element('div', `st-start-widget-homework-${item.Id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-homework-${item.Id}-chip-${chip.name}`, eventChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            assignments: {
                title: "Opdrachten",
                render: async () => {
                    return new Promise(async resolve => {
                        const assignmentsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/opdrachten?top=12&skip=0&startdatum=${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}&einddatum=${now.getFullYear() + 1}-${now.getMonth() + 1}-${now.getDate()}`)
                        const relevantAssignments = assignmentsRes.Items.filter(item => (!item.Afgesloten && !item.IngeleverdOp) || item.BeoordeeldOp)

                        if (relevantAssignments.length < 1) return resolve()
                        let widgetElement = element('div', 'st-start-widget-assignments', null, { class: 'st-tile st-widget' })
                        let widgetTitle = element('div', 'st-start-widget-assignments-title', widgetElement, { class: 'st-widget-title', innerText: "Opdrachten", 'data-amount': relevantAssignments.length })

                        relevantAssignments.forEach(item => {
                            let
                                date = `week ${getWeekNumber(new Date(item.InleverenVoor))}, ${new Date(item.InleverenVoor).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (getWeekNumber(new Date(item.InleverenVoor)) === getWeekNumber())
                                date = `${new Date(item.InleverenVoor).toLocaleDateString('nl-NL', { weekday: 'long' })} ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
                            if (new Date(item.InleverenVoor).toDateString() === new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toDateString())
                                date = `morgen ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.InleverenVoor))})`
                            if (new Date(item.InleverenVoor).toDateString() === new Date().toDateString())
                                date = `vandaag ${new Date(item.InleverenVoor).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} (${getRelativeTimeString(new Date(item.InleverenVoor))})`

                            let assignmentElement = element('button', `st-start-widget-assignments-${item.Id}`, widgetElement, { class: 'st-list-item' })
                            assignmentElement.addEventListener('click', () => window.location.hash = `#/elo/opdrachten/${item.Id}`)

                            let row1 = element('span', `st-start-widget-assignments-${item.Id}-row1`, assignmentElement, { class: 'st-list-row' })
                            let assignmentTitle = element('span', `st-start-widget-assignments-${item.Id}-title`, row1, { class: 'st-list-title', innerText: item.Vak ? [item.Vak, item.Titel].join(': ') : item.Titel })
                            let assignmentDate = element('span', `st-start-widget-assignments-${item.Id}-date`, row1, {
                                class: 'st-list-timestamp',
                                innerText: date
                            })

                            let row2 = element('span', `st-start-widget-assignments-${item.Id}-row2`, assignmentElement, { class: 'st-list-row' })
                            let assignmentContent = element('div', `st-start-widget-assignments-${item.Id}-content`, row2, { class: 'st-list-content' })
                            assignmentContent.innerHTML = item.Omschrijving.replace(/(<br ?\/?>)/gi, '') //assignmentContent.setHTML(item.Omschrijving)
                            if (assignmentContent.scrollHeight > assignmentContent.clientHeight) assignmentContent.classList.add('overflow')

                            let chips = []
                            if (item.BeoordeeldOp) chips.push({ name: "Beoordeeld", type: 'ok' })

                            let assignmentChipsWrapper = element('div', `st-start-widget-assignments-${item.id}-chips`, row2, { class: 'st-chips-wrapper' })
                            chips.forEach(chip => {
                                let chipElement = element('span', `st-start-widget-assignments-${item.id}-chip-${chip.name}`, assignmentChipsWrapper, { class: `st-chip ${chip.type || 'info'}`, innerText: chip.name })
                            })
                        })

                        resolve(widgetElement)
                    })
                }
            },

            digitalClock: {
                title: "Digitale klok",
                options: [
                    {
                        title: "Bètaversie van deze widget.",
                        key: 'start-widget-digitalClock-widget',
                        type: 'description'
                    }
                ],
                render: () => {
                    return new Promise(async resolve => {
                        let widgetElement = element('div', 'st-start-widget-digital-clock', null, { class: 'st-tile st-widget' }),
                            timeText = element('div', 'st-start-widget-digital-clock-time', widgetElement)
                        //     timeProgressBar = element('div', 'st-start-widget-digital-clock-progress-bar', widgetElement, { style: `--progress: 0` }),
                        //     timeProgressLabel = element('div', 'st-start-widget-digital-clock-progress-label', widgetElement, { style: `--progress: 0`, innerText: `0%` })

                        // const eventsRes = await useApi(`https://${window.location.hostname.split('.')[0]}.magister.net/api/personen/$USERID/afspraken?van=${gatherStart.toISOString().substring(0, 10)}&tot=${gatherEnd.toISOString().substring(0, 10)}`)
                        // const events = eventsRes.Items.filter(e => e.Einde.startsWith(`${gatherStart.toISOString().substring(0, 10)}`))

                        // // TODO: Finish digital clock widget!
                        // // Find the earliest start time and the latest end time, rounded outwards to 30 minutes.
                        // const aaaa = Object.values(events).reduce((earliestHour, currentItem) => {
                        //     let currentHour = new Date(currentItem.Start)
                        //     if (!earliestHour || currentHour < earliestHour) { return Math.floor(currentHour * 2) / 2 }
                        //     return earliestHour
                        // }, null)
                        // const aaab = Object.values(events).reduce((latestHour, currentItem) => {
                        //     let currentHour = new Date(currentItem.Einde)
                        //     if (!latestHour || currentHour > latestHour) { return Math.ceil(currentHour * 2) / 2 }
                        //     return latestHour
                        // }, null)

                        setIntervalImmediately(() => {
                            now = new Date()
                            let timeString = now.toLocaleTimeString('nl-NL')
                            timeText.innerText = ''
                            timeString.split('').forEach((char, i) => {
                                let charElement = element('span', `st-start-widget-digital-clock-time-${i}`, timeText, { innerText: char, style: char === ':' ? 'width: 7.2px' : '' })
                            })
                            // let progress = (now - aaaa) / (aaab - aaaa)
                            // timeProgressBar.setAttribute('style', `--progress: ${progress}`)
                            // timeProgressLabel.setAttribute('style', `--progress: ${progress}`)
                            // timeProgressLabel.innerText = `${progress.toLocaleString('nl-NL', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
                        }, 1000)

                        resolve(widgetElement)
                    })
                }
            }
        }

        // Draw the selected widgets in the specified order
        for (const functionName of widgetsShown) {
            widgetsProgressText.innerText = `Widget '${widgetFunctions[functionName].title}' laden...`
            let widgetElement = await widgetFunctions[functionName].render()
            if (widgetElement) widgets.append(widgetElement)
        }

        widgetsProgress.remove()
        widgetsProgressText.remove()
    }

    function verifyDisplayMode() {
        container.setAttribute('data-widgets-collapsed', widgetsCollapsed)
    }
}

function timeInHours(input) {
    let date = new Date(input),
        currentHour = date.getHours() + (date.getMinutes() / 60)
    return currentHour
}

function collidesWith(a, b) {
    return new Date(a.Einde) > new Date(b.Start) && new Date(a.Start) < new Date(b.Einde)
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

function eventChips(item) {
    let chips = []

    if (item.Status === 5) chips.push({ name: "Vervallen", type: 'warn' })
    if (item.InfoType === 1 && item.Afgerond) chips.push({ name: "Huiswerk", type: 'ok' })
    else if (item.InfoType === 1) chips.push({ name: "Huiswerk", type: 'info' })
    if (item.InfoType === 2 && item.Afgerond) chips.push({ name: "Proefwerk", type: 'ok' })
    else if (item.InfoType === 2) chips.push({ name: "Proefwerk", type: 'important' })
    if (item.Type === 7 && item.Lokatie?.length > 0) chips.push({ name: "Ingeschreven", type: 'ok' })
    else if (item.Type === 7) chips.push({ name: "KWT", type: 'info' })

    return chips
}