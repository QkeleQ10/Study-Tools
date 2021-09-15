go()
window.addEventListener('popstate', function (event) { go() })

async function go() {
    //stylise()
    if (document.location.hash.startsWith("#/vandaag")) vandaag()
    else if (document.location.hash.startsWith("#/agenda")) agenda()
    else if (document.location.href.includes("/studiewijzer/")) studiewijzer()
    else if (document.location.href.includes("/opdrachten")) opdrachten()

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
    document.querySelectorAll(".alertRed").forEach(e => {
        e.remove()
    })
}

async function agenda() {
    await awaitElement("tr.ng-scope")
    document.querySelectorAll("tr.ng-scope").forEach(e => {
        e.style.height = "40px"
    })
}

async function studiewijzer() {
    await awaitElement("li.studiewijzer-onderdeel")
    document.querySelectorAll("li.studiewijzer-onderdeel>div.block>h3>b.ng-binding").forEach(e => {
        if (e.innerHTML.includes(getWeekNumber(new Date()))) {
            e.parentElement.style.background = "aliceBlue"
            e.click()
            e.scrollIntoView({ behavior: "smooth", block: "start" })
            e.parentElement.nextElementSibling.lastElementChild.style.background = "aliceBlue"
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

async function stylise() {
    document.body.style.backgroundColor = "#f1f1f1"
}