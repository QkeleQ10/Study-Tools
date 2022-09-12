let weekNumber,
    periodNumber

firstload()

async function firstload() {
    checkUpdates()
    popstate()

    window.addEventListener('popstate', popstate)
    window.addEventListener('hashchange', popstate)
    window.addEventListener('locationchange', popstate)

    weekNumber = getWeekNumber(new Date())
    periodNumber = getPeriodNumber(weekNumber)

    await awaitElement(".appbar")
    let appbarZermelo = document.createElement("div")
    document.querySelector(".appbar").firstElementChild.after(appbarZermelo)
    appbarZermelo.outerHTML = `
    <div class="menu-button">
        <a id="zermelo-menu" href="https://${window.location.hostname.split('.')[0]}.zportal.nl/app">
            <img src="https://i.imgur.com/Uzs441M.png" width="36" style="border-radius: 100%">
            <span>Zermelo</span>
        </a>
    </div>`

    let appbarWeek = document.createElement("h1")
    appbarWeek.innerText = `week ${weekNumber}\n${new Date().toLocaleString('nl-nl', { weekday: 'long' })}`
    appbarWeek.style.color = "white"
    document.querySelector(".appbar").prepend(appbarWeek)

    await awaitElement("#user-menu img")
    document.querySelector("#user-menu img").style.display = "none"
}

async function popstate() {
    const href = document.location.href.split("?")[0]

    if (document.location.hash.startsWith("#/vandaag")) vandaag()
    else if (document.location.hash.startsWith("#/agenda")) agenda()
    else if (href.endsWith("/studiewijzer")) studiewijzers()
    else if (href.includes("/studiewijzer/")) studiewijzer()
    else if (href.includes("/opdrachten")) opdrachten()
}

async function vandaag() {
    await awaitElement("ul.agenda-list>li.alert")
    document.querySelectorAll("li.alert").forEach(e => { e.classList.remove("alert") })
    const e = document.querySelector('h4[data-ng-bind-template*="Wijzigingen voor"]')
    e.innerHTML = e.innerHTML.replace("Wijzigingen voor", "Rooster voor")
    document.querySelectorAll(".block").forEach(e => {
        e.style.borderRadius = "6px"
    })
}

async function agenda() {
    await awaitElement("tr.ng-scope")
    document.querySelectorAll("tr.ng-scope").forEach(e => {
        e.style.height = "40px"
    })
}

async function studiewijzers() {
    await awaitElement(`li[data-ng-repeat="studiewijzer in items"]`)
    setTimeout(() => {
        const regexCurrent = new RegExp(`.*((t|(p(eriod)?))([A-z]*)\s*.*${periodNumber}).*`, "gi"),
            oldPeriods = ([1, 2, 3, 4].slice(0, periodNumber - 1) || []),
            oldRegexes = [],
            titles = document.querySelectorAll(`ul>[data-ng-repeat="studiewijzer in items"]`)

        oldPeriods.forEach(p => {
            oldRegexes.push(new RegExp(`.*((t|(p(eriod)?))([A-z]*)\s*.*${p}).*`, "gi"))
        })

        titles.forEach(title => {
            const label = title.firstElementChild.firstElementChild.innerHTML
            if (regexCurrent.test(label.toLowerCase())) {
                title.style.background = "aliceBlue"
                title.parentElement.prepend(title)
            }

            oldRegexes.forEach(oldRegex => {
                if (oldRegex.test(label.toLowerCase())) {
                    title.style.background = "lavenderblush"
                    title.parentElement.append(title)
                }
            })
        })
    }, 1000)
}

async function studiewijzer() {
    await awaitElement("li.studiewijzer-onderdeel")
    const regex = new RegExp(`(?<![0-9])(${weekNumber}){1}(?![0-9])`, "g"),
        titles = document.querySelectorAll("li.studiewijzer-onderdeel>div.block>h3>b.ng-binding")
    let matched = false

    titles.forEach(title => {
        if (regex.test(title.innerHTML)) {
            title.parentElement.style.background = "aliceBlue"
            const endlink = title.parentElement.nextElementSibling.lastElementChild
            endlink.style.background = "aliceBlue"
            title.click()
            if (!matched) setTimeout(() => {
                endlink.scrollIntoView({ behavior: "smooth", block: "center" })
            }, 250)
            matched = true
        }
    })
}

async function opdrachten() {
    await awaitElement("tr.ng-scope")
    document.querySelectorAll(".overdue").forEach(e => { e.style.background = "lavenderBlush" })
    document.querySelectorAll('td[data-ng-bind*="InleverenVoor"]').forEach(e => {
        let d = new Date("20" + e.innerHTML.split("-")[2], Number(Number(e.innerHTML.split("-")[1]) - 1), e.innerHTML.split("-")[0])
        let opt = { weekday: "short", year: "2-digit", month: "short", day: "numeric" }
        if (d.toLocaleDateString("nl-NL", opt) != "Invalid Date") e.innerHTML = d.toLocaleDateString("nl-NL", opt)
    })
}

async function awaitElement(s) {
    return new Promise(p => {
        setInterval(() => {
            if (document.querySelector(s)) { p() }
        }, 10)
    })
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function periodMatches(period) {
    switch (period) {
        case 1:

            break;

        default:
            break;
    }
}

function getPeriodNumber(w) {
    if (w >= 30 && w < 48)
        return 1

    if (w >= 48 || w < 4)
        return 2

    if (w >= 4 && w < 14)
        return 3

    return 0
}

async function checkUpdates() {
    fetch("https://raw.githubusercontent.com/QkeleQ10/Study-Tools/main/manifest.json")
        .then((response) => response.json())
        .then(async (data) => {
            if (data.version != chrome.runtime.getManifest().version) {
                await awaitElement('div.toasts')
                let toastUpdate = document.createElement('div')
                let toastOverlay = document.createElement('div')
                document.querySelector('div.toasts').append(toastUpdate)
                document.querySelector('div.toasts').after(toastOverlay)
                toastUpdate.outerHTML = `
                <div id="toast-0" class="toast ng-scope alert-toast alert-msg" style="z-index: 999999;">
                    <span class="glyph"><a href="https://QkeleQ10.github.io/extensions/studytools/update"></a></span>
                    <span>Update beschikbaar voor StudyTools</span>
                    <em><a href="https://QkeleQ10.github.io/extensions/studytools/update">Klik hier om te installeren</a> of klik buiten deze melding om over te slaan.</em>
                    <i></i>
                </div>`
                toastOverlay.outerHTML = `
                <div style="position: fixed; top: 0; left: 0; opacity: 0.25; background: black; color: white; width: 100%; height: 100%; z-index: 999998;" onclick="this.setAttribute('style', '')"></div>`
            }
        })
}