// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    if (document.location.href.split('?')[0].endsWith('/vandaag')) gamification()
}

async function gamification() {
    let categories = [
        ['grades', "Cijfers", "Cijfers van ", "Hogere cijfers leveren meer punten op. Latere leerjaren hebben meer impact op je score."],
        ['absences', "Ongeoorloofde absenties", "Absenties in ", "Je verliest 15 punten voor ongeoorloofde absenties."],
        ['assignmentsEarly', "Opdrachten op tijd ingeleverd", "Opdrachten in ", "Je verdient punten per op tijd ingeleverde opdracht en extra punten per dag te vroeg. Latere leerjaren hebben meer impact op je score."]
        // ['assignmentsLate', "Opdrachten te laat ingeleverd", "Opdrachten in ", "Voor elke dag dat je een opdracht te laat inlevert, kun je 2 punten verliezen."]
    ]
    mainContainer = await awaitElement('section.main'),
        photo = await awaitElement("#user-menu > figure > img"),
        notifications = await awaitElement('#st-vd-notifications'),
        levelElem = element('button', 'st-level', mainContainer),
        progressElem = element('div', 'st-progress', levelElem),
        progressFilled = element('div', 'st-progress-filled', progressElem),
        gmOverlay = element('dialog', 'st-gm', document.body, { class: 'st-overlay' }),
        gmClose = element('button', 'st-gm-close', gmOverlay, { class: 'st-button', innerText: "Sluiten", 'data-icon': '' }),
        gmTitle = element('span', 'st-gm-title', gmOverlay, { class: 'st-title', innerText: "Jouw score" }),
        gmSubtitle = element('span', 'st-gm-subtitle', gmOverlay, { class: 'st-subtitle', innerText: "Verdien punten en verhoog je niveau door voldoendes te halen, opdrachten vroeg in te leveren en zo min mogelijk absenties te hebben." }),
        gmWrap = element('div', 'st-gm-wrap', gmOverlay),
        gmCard = element('div', 'st-gm-card', gmWrap),
        gmCardTitle = element('span', 'st-gm-card-title', gmCard, { class: 'st-title', innerText: photo.alt }),
        gmCardSubtitle = element('span', 'st-gm-card-subtitle', gmCard, { class: 'st-subtitle', innerText: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) }),
        gmCardLevel = element('div', 'st-gm-card-level', gmCard),
        gmCardProgress = element('div', 'st-gm-card-progress', gmCard),
        gmCardProgressFilled = element('div', 'st-gm-card-progress-filled', gmCardProgress),
        gmBreakdown = element('div', 'st-gm-breakdown', gmWrap)
    // gmBannerAd = element('div', 'st-gm-ad', gmOverlay, {
    //     class: 'st-banner-ad', innerText: "Gamificatie (het berekenen van scores en niveaus) is onderdeel van Study Tools voor Magister.", onclick: `window.open('https://qkeleq10.github.io/extensions/studytools', '_blank').focus()`
    // })

    levelElem.addEventListener('click', () => {
        gmOverlay.showModal()
    })

    gmClose.addEventListener('click', () => {
        gmOverlay.close()
    })

    displayScore()
    setTimeout(() => {
        displayScore()
    }, 1000)
    setTimeout(() => {
        displayScore()
    }, 2000)

    async function displayScore() {
        let points = await getSetting('points'),
            pointsBefore = await getSetting('points-before'),
            pointsDiff = points.total - pointsBefore.total,
            level = Math.floor(Math.sqrt(points.total + 9) - 3),
            levelBefore = Math.floor(Math.sqrt(pointsBefore.total + 9) - 3),
            levelDiff = Math.round(level - levelBefore),
            pointsRequired = 2 * level + 7,
            pointsProgress = Math.floor(points.total - (level ** 2 + 6 * level)),
            notification

        if (typeof points?.total === 'undefined') return

        if (levelDiff > 0) {
            notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Niveau gestegen (+${levelDiff} niveau${levelDiff > 1 ? 's' : ''})`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
            notifications.prepend(notification)
        } else if (levelDiff < 0) {
            notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Niveau gezakt (${levelDiff} niveau${levelDiff < -1 ? 's' : ''})`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
            notifications.prepend(notification)
        } else if (pointsDiff > 0) {
            notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Punten verdiend (+${pointsDiff} punten)`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
            notifications.prepend(notification)
        } else if (pointsDiff < 0) {
            notification = element('li', `st-vd-gamification-notification`, notifications, { innerText: `Punten verloren (${pointsDiff} punten)`, onclick: `document.getElementById('st-gm').showModal()`, 'data-icon': '', 'data-additional-info': '' })
            notifications.prepend(notification)
        }
        if (pointsDiff > 0 || pointsDiff < 0) {
            Object.keys(points).forEach(key => {
                if (key === 'total') return
                let valueBefore = pointsBefore[key],
                    valueAfter = points[key],
                    title = categories.find(e => e[0] === key)[1]
                if (!title && points[key].g) title = "Cijfers van " + points[key].g
                if (!title) return
                if (JSON.stringify(valueAfter) !== JSON.stringify(valueBefore)) {
                    if (notification.dataset.additionalInfo.length > 1) notification.dataset.additionalInfo += ', '
                    notification.dataset.additionalInfo += title
                }
            })
        }
        setSetting('points-before', points)

        if (Number.isNaN(level)) level = 0
        levelElem.dataset.level = level + 1
        gmCardLevel.innerText = level + 1
        progressFilled.style.setProperty('--level-progress', pointsProgress / pointsRequired)
        gmCardProgressFilled.style.setProperty('--level-progress', pointsProgress / pointsRequired)
        gmCardProgress.dataset.pointsProgress = pointsProgress
        gmCardProgress.dataset.pointsRequired = pointsRequired
        gmCardProgress.dataset.pointsRemaining = pointsRequired - pointsProgress
        gmCardProgress.dataset.levelNext = level + 2
        gmBreakdown.innerText = ''

        categories.forEach(category => {
            let categoryElement = element('div', `st-gm-${category[0]}`, gmBreakdown)
            let categoryTitle = element('div', `st-gm-${category[0]}-t`, categoryElement, { innerText: category[1], 'data-value': points[category[0]].sum.toLocaleString('nl-NL', { maximumFractionDigits: 2 }), onclick: `this.parentElement.classList.toggle('expand')` })
            Object.keys(points[category[0]]).forEach(yearKey => {
                let value = points[category[0]][yearKey].v,
                    count = points[category[0]][yearKey].n,
                    title = category[2] + points[category[0]][yearKey].g
                if (!value || !count || !title || count < 1) return
                let yearElement = element('div', `st-gm-${category[0]}-${yearKey}`, categoryElement, { innerText: `${title} (${count}×)`, 'data-value': value.toLocaleString('nl-NL', { maximumFractionDigits: 2 }) })
            })
            let categoryExplanation = element('div', `st-gm-${category[0]}-e`, categoryElement, { innerText: category[3] })
        })

        let total = document.createElement('div')
        gmBreakdown.append(total)
        total.innerText = "Totaal"
        total.classList.add('total')
        total.dataset.value = points.total.toLocaleString('nl-NL', { maximumFractionDigits: 2 })
    }
}