let keysChanged = false,
    cancelPrompt = document.createElement("div")

login()

async function login() {
    document.body.appendChild(cancelPrompt)
    cancelPrompt.setAttribute("style", "position: fixed; top: 0; left: 0; opacity: 0.25; background: black; color: white; width: 100%; height: 100%; font-size: 36px; display: flex; align-items: center; justify-content: center;")
    cancelPrompt.innerHTML = "<b>Automatisch inloggen annuleren</b>"
    window.addEventListener('keydown', cancelLogin)
    window.addEventListener('keyup', cancelLogin)
    cancelPrompt.addEventListener('click', cancelLogin)

    let stU = document.cookie.split("stU=")[1]
    if (stU) stU = cipher(stU.split(";")[0], -7)

    let stP = document.cookie.split("stP=")[1]
    if (stP) stP = cipher(stP.split(";")[0], -10)

    document.querySelector(".podium_container").style.minHeight = "calc(100vh - 200px)"

    document.querySelector(".bottom").outerHTML = `
    <div class="bottom" style="justify-content: space-between; align-items: center">
        <div>Sla inloggegevens op in de volgende velden.<br>Deze worden opgeslagen in je cookies.<br>Je bent zelf verantwoordelijk voor de beveiliging ervan.</div>
        <div>
            <input id='stU' type='text' placeholder='Autologin gebruikersnaam' ${stU ? "value=" + stU : ""}>
            <br>
            <input id='stP' type='password' placeholder='Autologin wachtwoord' ${stP ? "value=" + stP : ""}>
        </div>
    </div>`

    document.getElementById('stU').addEventListener('input', event => document.cookie = "stU=" + cipher(event.target.value, 7) + ";max-age=220752000;")
    document.getElementById('stP').addEventListener('input', event => document.cookie = "stP=" + cipher(event.target.value, 10) + ";max-age=220752000;")

    await awaitElement("#username")
    document.getElementById("username").value = stU || ""
    document.getElementById("username").dispatchEvent(new Event("input"))

    await awaitElement("#username_submit")
    document.getElementById("username_submit").click()

    await awaitElement("#rswp_password")
    document.getElementById("rswp_password").value = stP || ""
    document.getElementById("rswp_password").dispatchEvent(new Event("input"))

    await awaitElement("#rswp_submit")
    if (keysChanged) return
    setTimeout(() => {
        cancelPrompt.style.display = "none"
        document.getElementById("rswp_submit").click()
    }, 250)
}

async function cancelLogin() {
    keysChanged = true
    cancelPrompt.style.display = "none"
}

function cipher(str, num) {
    let result = ''
    for (let i = 0; i < str.length; i++) {
        const charcode = (str[i].charCodeAt()) + num
        result += String.fromCharCode(charcode)
    }
    return result
}

async function awaitElement(s) {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if (document.querySelector(s)) {
                clearTimeout(timeout)
                clearInterval(interval)
                return resolve()
            }
        }, 10)

        let timeout = setTimeout(() => {
            alert(s)
            clearInterval(interval)
            console.log(s)
            reject(`Element "${s}" not found`)
            cancelLogin()
        }, 2000)
    })
}
