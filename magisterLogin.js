let username = ""
let password = ""

checkUpdates()
login()

async function login() {

    await awaitElement("#username")
    if (!username) return
    document.getElementById("username").value = username || "Pas aan in magisterLogin.js"
    document.getElementById("username").dispatchEvent(new Event("input"))

    await awaitElement("#username_submit")
    document.getElementById("username_submit").click()

    await awaitElement("#rswp_password")
    if (!password) return
    document.getElementById("rswp_password").value = password || "Pas aan in magisterLogin.js"
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

    //window.open("https://QkeleQ10.github.io/extensions/studytools/update", '_blank')
}