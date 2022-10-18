let weekNumber,
    periodNumber

onload()

async function onload() {
    checkSettings()
    checkUpdates()
    popstate()

    window.addEventListener('popstate', popstate)
    window.addEventListener('hashchange', popstate)
    window.addEventListener('locationchange', popstate)

    weekNumber = getWeekNumber(new Date())
    periodNumber = getPeriodNumber(weekNumber)

    let appbar = await element(".appbar")

    if (await getSetting('magister-appbar-zermelo')) {
        let appbarZermelo = document.createElement("div")
        appbar.firstElementChild.after(appbarZermelo)
        appbarZermelo.outerHTML = `
    <div class="menu-button">
        <a id="zermelo-menu" href="https://${window.location.hostname.split('.')[0]}.zportal.nl/app" target="_blank">
            <img src="https://raw.githubusercontent.com/QkeleQ10/QkeleQ10.github.io/main/img/zermelo.png" width="36" style="border-radius: 100%">
            <span>Zermelo</span>
        </a>
    </div>`}

    if (await getSetting('magister-appbar-week')) {
        let appbarWeek = document.createElement("h1")
        appbarWeek.innerText = `wk ${weekNumber}`
        appbarWeek.setAttribute('style', `color:#fff;font-family:arboria,sans-serif;font-weight:700;font-size:16px;text-align:center`)
        appbar.prepend(appbarWeek)
    }

    if (await getSetting('magister-appbar-hidePicture')) {
        let userImg = await element("#user-menu img")
        userImg.style.display = "none"
    }
}

async function popstate() {
    const href = document.location.href.split("?")[0]

    if (document.location.hash.startsWith("#/vandaag")) vandaag()
    else if (document.location.hash.startsWith("#/agenda")) agenda()
    else if (href.endsWith("/studiewijzer")) studiewijzers()
    else if (href.includes("/studiewijzer/")) studiewijzer()
    else if (href.includes("/opdrachten")) opdrachten()
    else if (href.includes("/cijfers/cijferoverzicht")) cijferoverzicht()
}

async function vandaag() {
    if (await getSetting('magister-vd-deblue')) {
        await element("ul.agenda-list>li.alert")
        document.querySelectorAll("li.alert").forEach(e => e.classList.remove("alert"))
        const e = document.querySelector('h4[data-ng-bind-template*="Wijzigingen voor"]')
        e.innerHTML = e.innerHTML.replace("Wijzigingen voor", "Rooster voor")
    }
}

async function agenda() {
    if (await getSetting('magister-ag-spacious')) {
        await element("tr.ng-scope")
        document.querySelectorAll("tr.ng-scope").forEach(e => e.style.height = "40px")
    }
}

async function studiewijzers() {
    if (await getSetting('magister-sw-sort')) {
        await element(`li[data-ng-repeat="studiewijzer in items"]`)
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
    }
}

async function studiewijzer() {
    if (await getSetting('magister-sw-thisWeek')) {
        await element("li.studiewijzer-onderdeel")
        const regex = new RegExp(`(?<![0-9])(${weekNumber}){1}(?![0-9])`, "g"),
            titles = document.querySelectorAll("li.studiewijzer-onderdeel>div.block>h3>b.ng-binding")
        let matched = false

        titles.forEach(title => {
            if (regex.test(title.innerHTML)) {
                title.parentElement.style.background = "aliceBlue"
                const endlink = title.parentElement.nextElementSibling.lastElementChild
                endlink.style.background = "aliceBlue"
                endlink.scrollIntoView({ behavior: "smooth", block: "center" })
                title.click(), 2000
                matched = true
            }
        })
    }
}

async function opdrachten() {
    if (await getSetting('magister-op-oldred')) {
        await element("tr.ng-scope")
        document.querySelectorAll(".overdue").forEach(e => { e.style.background = "lavenderBlush" })
        document.querySelectorAll('td[data-ng-bind*="InleverenVoor"]').forEach(e => {
            let d = new Date("20" + e.innerHTML.split("-")[2], Number(Number(e.innerHTML.split("-")[1]) - 1), e.innerHTML.split("-")[0])
            let opt = { weekday: "short", year: "2-digit", month: "short", day: "numeric" }
            if (d.toLocaleDateString("nl-NL", opt) != "Invalid Date") e.innerHTML = d.toLocaleDateString("nl-NL", opt)
        })
    }
}

async function cijferoverzicht() {
    if (await getSetting('magister-cf-failred')) {
        let styleElem = document.createElement('style')
        styleElem.innerHTML = `.grade[title="5,0"],.grade[title="5,1"],.grade[title="5,2"],.grade[title="5,3"],.grade[title="5,4"],.grade[title^="1,"],.grade[title^="2,"],.grade[title^="3,"],.grade[title^="4,"]{background-color:lavenderBlush !important;color:red !important;font-weight:700}`
        document.head.append(styleElem)
    }
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
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

// CHANGE THE UPDATE POPUP
async function checkUpdates() {
    if (!await getSetting('update')) return
    fetch("https://raw.githubusercontent.com/QkeleQ10/Study-Tools/main/manifest.json")
        .then((response) => response.json())
        .then(async data => {
            if (data.version >= chrome.runtime.getManifest().version) return
            let notification = document.createElement('div')
            notification.innerHTML =
                `<style>#stnotifh,#stnotifp{font-family:system-ui,sans-serif;user-select:none;color:#fff}#stnotifh{margin:.5em 0;font-size:24px;font-weight:700}#stnotifh:after{content:'.';color:#ff8205}#stnotifp{font-size:12px}#stnotifp>a{color:#fff}</style>
                <h1 id="stnotifh">Study Tools</h1>
                <p id="stnotifp">Er is een update beschikbaar. <a href="https://QkeleQ10.github.io/extensions/studytools/update">Klik hier om deze te installeren.</a></p>`
            notification.setAttribute('style',
                `width:276px;position:fixed;top:0;right:20em;padding:.5em 1em 2em;background-color:#1f97f9;color:#fff;font-family:system-ui,sans-serif;user-select:none;outline:#808080 solid 1px;box-shadow:0 0 1em #000;z-index:9999`)
            document.body.prepend(notification)

        })

}

async function checkSettings() {
    if (await getSetting('openedPopup')) return
    let notification = document.createElement('div')
    notification.innerHTML =
        `<style>#stnotifh,#stnotifp{font-family:system-ui,sans-serif;user-select:none;color:#fff}#stnotifh{margin:.5em 0;font-size:24px;font-weight:700}#stnotifh:after{content:'.';color:#ff8205}#stnotifp{font-size:12px}#stnotifp>a{color:#fff}</style>
        <h1 id="stnotifh">Study Tools</h1>
        <p id="stnotifp">Alle functies van Study Tools zijn standaard uitgeschakeld. <b>Schakel ze in bij 'Study Tools' onder het menu 'Extensies'.</b><br><br>Dit bericht verdwijnt na het eenmalig openen van de extensie permanent.</p>`
    notification.setAttribute('style',
        `width:276px;position:fixed;top:0;right:20em;padding:.5em 1em 2em;background-color:#1f97f9;color:#fff;font-family:system-ui,sans-serif;user-select:none;outline:#808080 solid 1px;box-shadow:0 0 1em #000;z-index:9999`)
    document.body.prepend(notification)

}

function element(querySelector) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if (document.querySelector(querySelector)) {
                clearInterval(interval)
                clearTimeout(timeout)
                return resolve(document.querySelector(querySelector))
            }
        }, 50)

        let timeout = setTimeout(() => {
            clearInterval(interval)
            return reject(Error(`Element "${querySelector}" not found`))
        }, 1500)
    })
}

function getSetting(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get([key], (result) => {
            let value = Object.values(result)[0]
            value ? resolve(value) : resolve('')
        })
    })
}