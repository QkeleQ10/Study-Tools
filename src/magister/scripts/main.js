let subjects

// Run when the extension and page are loaded
main()
async function main() {
    let appbar = await getElement('.appbar'),
        logos = await getElement('img.logo-expanded, img.logo-collapsed', true)

    subjects = await getSetting('magister-subjects')

    if (await getSetting('magister-appbar-zermelo')) {
        const appbarZermelo = document.getElementById('st-appbar-zermelo') || document.createElement('div'),
            spacer = await getElement('.appbar>.spacer'),
            zermeloA = document.createElement('a'),
            zermeloImg = document.createElement('img'),
            zermeloSpan = document.createElement('span')
        appbarZermelo.innerText = ''
        spacer.after(appbarZermelo)
        appbarZermelo.classList.add('menu-button')
        appbarZermelo.id = 'st-appbar-zermelo'
        appbarZermelo.append(zermeloA)
        zermeloA.classList.add('zermelo-menu')
        zermeloA.setAttribute('href', `https://${await getSetting('magister-appbar-zermelo-url') || window.location.hostname.split('.')[0] + '.zportal.nl/app'}`)
        zermeloA.setAttribute('target', '_blank')
        zermeloA.append(zermeloImg)
        zermeloImg.setAttribute('src', 'https://raw.githubusercontent.com/QkeleQ10/QkeleQ10.github.io/main/img/zermelo.png')
        zermeloImg.setAttribute('width', '36')
        zermeloImg.style.borderRadius = '100%'
        zermeloA.append(zermeloSpan)
        zermeloSpan.innerText = "Zermelo"
    }

    if (await getSetting('magister-appbar-week')) {
        let appbarMetrics = document.getElementById('st-appbar-metrics'),
            appbarWeek = document.getElementById('st-appbar-week') || document.createElement('div')
        if (!appbarMetrics) {
            appbarMetrics = document.createElement('div')
            appbarMetrics.id = 'st-appbar-metrics'
            appbar.prepend(appbarMetrics)
        }
        appbarMetrics.prepend(appbarWeek)
        appbarWeek.id = 'st-appbar-week'
        appbarWeek.classList.add('st-metric')
        appbarWeek.dataset.description = 'Week'
        appbarWeek.innerText = getWeekNumber()
    }

    let userMenuLink = await getElement('#user-menu')
    userMenuLink.addEventListener('click', async () => {
        let logoutLink = await getElement('.user-menu ul li:nth-child(3) a')
        logoutLink.addEventListener('click', async () => {
            await setSetting('force-logout', new Date().getTime(), 'local')
        })
    })

    if (Math.random() < 0.003) setTimeout(() => logos.forEach(e => e.classList.add('dvd-screensaver')), 5000)

    if (await getSetting('magister-shortcut-keys')) {
        let shortcutsWrapper = document.createElement('div'),
            sElem = document.createElement('span'),
            todayElem = document.createElement('a'),
            agendaElem = document.createElement('a'),
            gradesElem = document.createElement('a'),
            studyguideElem = document.createElement('a'),
            booksElem = document.createElement('a'),
            key = await getSetting('magister-shortcut-keys-master') || 'S',
            keyDisplay = key?.charAt(0).toUpperCase() + key?.slice(1) || 'S'

        if (key === 'Control') keyDisplay = 'Ctrl'
        if (key === ' ') keyDisplay = 'Spatie'

        document.body.append(shortcutsWrapper)
        shortcutsWrapper.id = 'st-shortcuts'
        shortcutsWrapper.append(sElem, todayElem, agendaElem, gradesElem, studyguideElem, booksElem)

        setAttributes(sElem, { class: 'st-keyboard-hint', 'data-hint-primary': keyDisplay })

        setAttributes(todayElem, { class: 'st-keyboard-hint', 'data-hint-primary': '1', 'data-hint-secondary': '!', href: '#/vandaag' })
        todayElem.innerText = "Vandaag"

        setAttributes(agendaElem, { class: 'st-keyboard-hint', 'data-hint-primary': '2', 'data-hint-secondary': '@', href: '#/agenda' })
        agendaElem.innerText = "Agenda"

        setAttributes(gradesElem, { class: 'st-keyboard-hint', 'data-hint-primary': '3', 'data-hint-secondary': '#', href: '#/cijfers' })
        gradesElem.innerText = "Cijfers"

        setAttributes(studyguideElem, { class: 'st-keyboard-hint', 'data-hint-primary': '4', 'data-hint-secondary': '$', href: '#/elo/studiewijzer' })
        studyguideElem.innerText = "Studiewijzers"

        setAttributes(booksElem, { class: 'st-keyboard-hint', 'data-hint-primary': '5', 'data-hint-secondary': '%', href: '#/leermiddelen' })
        booksElem.innerText = "Leermiddelen"

        addEventListener('keydown', e => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return
            if (shortcutsWrapper.dataset.open === 'false' && e.key.toLowerCase() === key.toLowerCase()) {
                e.preventDefault()
                shortcutsWrapper.dataset.open = true
            }
            shortcutsWrapper.querySelectorAll('a').forEach(shortcut => {
                let primary = shortcut.dataset.hintPrimary,
                    secondary = shortcut.dataset.hintSecondary
                if ((e.key === primary || e.key === secondary) && window.getComputedStyle(shortcutsWrapper).getPropertyValue('z-index') === '10000000') {
                    shortcut.click()
                    shortcut.classList.add('clicked')
                    setTimeout(() => {
                        shortcut.classList.remove('clicked')
                    }, 1500)
                }
            })
        })

        addEventListener('keyup', e => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return
            if (shortcutsWrapper.dataset.open === 'true' && e.key.toLowerCase() === key.toLowerCase()) {
                setTimeout(() => {
                    if (shortcutsWrapper.dataset.open === 'true') shortcutsWrapper.dataset.open = false
                }, 1000)
            }
        })

        window.addEventListener('popstate', async () => {
            if (await getSetting('magister-shortcut-keys-today')) {
                if (shortcutsWrapper?.dataset.open === 'force') shortcutsWrapper.dataset.open = false
                if (document.location.hash.includes('#/vandaag')) shortcutsWrapper.dataset.open = 'force'
            }
        })

        if (await getSetting('magister-shortcut-keys-today') && document.location.hash.includes('#/vandaag')) shortcutsWrapper.dataset.open = 'force'
        else shortcutsWrapper.dataset.open = false
    }
}

// Run at start and when the URL changes
popstate()
window.addEventListener('popstate', popstate)
function popstate() {
    document.querySelectorAll('.st-button, [id^="st-cf"], .k-animation-container').forEach(e => e.remove())
}

function getWeekNumber() {
    let d = new Date()
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)),
        weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return weekNo
}

async function getPeriodNumber(w = getWeekNumber()) {
    const settingPeriods = await getSetting('magister-periods')
    let periodNumber = 0

    settingPeriods.split(',').forEach((e, i, arr) => {
        let startWeek = Number(e),
            endWeek = Number(arr[i + 1]) || Number(arr[0])
        if (endWeek < startWeek && (w >= startWeek || w < endWeek)) periodNumber = i + 1
        else if (w >= startWeek && w < endWeek) periodNumber = i + 1
    })

    return periodNumber
}

function parseSubject(string, enabled, subjects) {
    return new Promise(async (resolve, reject) => {
        if (!enabled) resolve({ subjectAlias: '', subjectName: '', stringBefore: string, stringAfter: '', success: false })
        subjects.forEach(subjectEntry => {
            testArray = `${subjectEntry.name},${subjectEntry.aliases} `.split(',')
            testArray.forEach(testString => {
                testString = testString.toLowerCase().trim()
                if ((new RegExp(`^(${testString})$|^(${testString})[^a-z]|[^a-z](${testString})$|[^a-z](${testString})[^a-z]`, 'i')).test(string)) {
                    let stringBefore = string.replace(new RegExp(`(${testString})`, 'i'), '%%').split('%%')[0],
                        stringAfter = string.replace(new RegExp(`(${testString})`, 'i'), '%%').split('%%')[1]
                    resolve({ subjectAlias: testString, subjectName: subjectEntry.name, stringBefore, stringAfter, success: true })
                }
            })
        })
        resolve({ subjectAlias: '', subjectName: '', stringBefore: string, stringAfter: '', success: false })
    })
}

async function msToPixels(ms) {
    return new Promise(async (resolve, reject) => {
        let settingAgendaHeight = await getSetting('magister-vd-agendaHeight') || 1
        resolve(0.000025 * settingAgendaHeight * ms)
    })
}

function weightedMean(valueArray = [], weightArray = []) {
    let result = valueArray.map((value, i) => {
        let weight = weightArray[i] ?? 1,
            sum = value * weight
        return [sum, weight]
    }).reduce((p, c) => {
        return [p[0] + c[0], p[1] + c[1]]
    }, [0, 0])
    return (result[0] / result[1])
}

function median(valueArray = []) {
    let values = [...valueArray].sort()
    var half = Math.floor(values.length / 2)
    if (values.length % 2) return values[half]
    return (values[half - 1] + values[half]) / 2.0
}

function weightedPossibleMeans(valueArray, weightArray, newWeight) {
    let means = [],
        grades = []
    for (let i = 1.0; i <= 10; i += 0.1) {
        grades.push(Number(i))
        means.push(Number(weightedMean(valueArray.concat([i]), weightArray.concat([newWeight]))))
    }
    return [means, grades]
}