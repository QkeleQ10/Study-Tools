let currentWeek,
    currentPeriod

go()
checkUpdates()
window.addEventListener('popstate', go)
window.addEventListener('hashchange', go)
window.addEventListener('locationchange', go)

async function go() {
    const href = document.location.href.split("?")[0]
    currentWeek = getWeekNumber(new Date())
    currentPeriod = getPeriodNumber(currentWeek)
    if (document.location.hash.startsWith("#/vandaag")) vandaag()
    else if (document.location.hash.startsWith("#/agenda")) agenda()
    else if (href.endsWith("/studiewijzer")) studiewijzers()
    else if (href.includes("/studiewijzer/")) studiewijzer()
    else if (href.includes("/opdrachten")) opdrachten()

    await awaitElement("#user-menu img")
    document.querySelector("#user-menu img").style.display = "none"
}

async function vandaag() {
    await awaitElement("ul.agenda-list>li.alert")
    document.querySelectorAll("li.alert").forEach(e => { e.classList.remove("alert") })
    const e = document.querySelector('h4[data-ng-bind-template*="Wijzigingen voor"]')
    e.innerHTML = e.innerHTML.replace("Wijzigingen voor", "Rooster voor")
    document.querySelectorAll(".block").forEach(e => {
        e.style.borderRadius = "6px"
    })
    // let dateText = document.querySelector("div.title"),
    //     year = new Date().getFullYear()
    // dateText.innerHTML = dateText.innerHTML.split(year) + `(week ${getWeekNumber(new Date())})`
}

async function agenda() {
    await awaitElement("tr.ng-scope")
    document.querySelectorAll("tr.ng-scope").forEach(e => {
        e.style.height = "40px"
    })
}

async function studiewijzers() {
    await awaitElement(`li[data-ng-repeat="studiewijzer in items"]`)

    const list = document.querySelector(`div.studiewijzer-list > ul`),
        periods = [1, 2, 3, 4]


    setTimeout(() => {

        periods.forEach(iteratedPeriod => {
            let periodItem = document.createElement('li'),
                isCurrent = iteratedPeriod == currentPeriod
            periodItem.innerHTML =
                `<details ${isCurrent ? 'open' : ''}>
                    <summary>Periode ${iteratedPeriod}</summary>
                    <div class="studiewijzer-list normaal">
                        <ul id="studytools-period-${iteratedPeriod}-list"></ul>
                    </div>
                </details>`
            periodItem.classList.add('studytools-period')
            periodItem.id = `studytools-period-${iteratedPeriod}`
            periodItem.style.height = 'auto'
            isCurrent ? list.prepend(periodItem) : list.append(periodItem)

            const periodItemList = document.getElementById(`studytools-period-${iteratedPeriod}-list`),
                periodRegex = new RegExp(`.*((t|(p(eriod)?))([A-z]*)\s*.*${iteratedPeriod}).*`, "gi")

            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const titles = document.querySelectorAll(`ul>[data-ng-repeat="studiewijzer in items"]`)
                    titles.forEach(title => {
                        const label = title.firstElementChild.firstElementChild.innerHTML
                        if (periodRegex.test(label.toLowerCase())) {
                            periodItemList.append(title)
                        }
                    })
                }, 500)
            }
        })

        let periodItem = document.createElement('li')
        periodItem.innerHTML =
            `<details open>
            <summary>Geen periode</summary>
            <div class="studiewijzer-list normaal">
                <ul id="studytools-period-0-list"></ul>
            </div>
        </details>`
        periodItem.id = `studytools-period-0`
        periodItem.style.height = 'auto'
        list.prepend(periodItem)

        const periodItemList = document.getElementById(`studytools-period-0-list`),
            titles = document.querySelectorAll(`ul>[data-ng-repeat="studiewijzer in items"]`)
        titles.forEach(title => {
            periodItemList.append(title)
        })
    }, 200)
}

async function studiewijzer() {
    await awaitElement("li.studiewijzer-onderdeel")

    const regex = new RegExp(`(?<![0-9])(${currentWeek}){1}(?![0-9])`, "g"),
        titles = document.querySelectorAll("li.studiewijzer-onderdeel>div.block>h3>b.ng-binding")
    let matched = false

    titles.forEach(title => {
        if (regex.test(title.innerHTML)) {
            title.parentElement.style.background = "aliceBlue"
            title.click()
            const endlink = title.parentElement.nextElementSibling.lastElementChild
            endlink.style.background = "aliceBlue"
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

function getPeriodNumber(w) {
    if (w >= 35 && w < 45)
        return 1

    if (w >= 45 || w < 4)
        return 2

    if (w >= 4 && w < 14)
        return 3

    if (w >= 14 && w < 25)
        return 4

    return 0
}

function checkUpdates() {
    fetch("https://raw.githubusercontent.com/QkeleQ10/Study-Tools/main/manifest.json")
        .then((response) => response.json())
        .then((data) => {
            if (data.version > chrome.runtime.getManifest().version) window.open("https://QkeleQ10.github.io/extensions/studytools/update", '_blank')
        })
}