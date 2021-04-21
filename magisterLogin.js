// ✍️ Je kunt de volgende opties aanpassen.

let gebruikersnaam = "" // Je gebruikersnaam voor Magister.
let wachtwoord = "" // Je wachtwoord voor Magister.



// 🙅 Verander hieronder niks.

checkUpdates()
login()

async function login() {

    await awaitElement("#username")
    if (!gebruikersnaam) return document.querySelector(".bottom").innerHTML = "Je kunt automatisch invoeren instellen met de opties in magisterLogin.js."
    document.getElementById("username").value = gebruikersnaam
    document.getElementById("username").dispatchEvent(new Event("input"))

    await awaitElement("#username_submit")
    document.getElementById("username_submit").click()

    await awaitElement("#rswp_password")
    if (!wachtwoord) return document.querySelector(".bottom").innerHTML = "Je kunt automatisch invoeren instellen met de opties in magisterLogin.js."
    document.getElementById("rswp_password").value = wachtwoord
    document.getElementById("rswp_password").dispatchEvent(new Event("input"))

    await awaitElement("[id*=_submit]")
    document.getElementById("rswp_submit").click()

}

async function awaitElement(s) {
    return new Promise(p => {
        setInterval(() => {
            if (document.querySelector(s)) { p() }
        }, 10)
    })
}

async function checkUpdates() {
    fetch("https://raw.githubusercontent.com/QkeleQ10/Study-Tools/main/manifest.json")
        .then((response) => response.json())
        .then((data) => {
            if (data.version != chrome.runtime.getManifest().version) window.open("https://QkeleQ10.github.io/extensions/studytools/update.html", '_blank')
        })
}