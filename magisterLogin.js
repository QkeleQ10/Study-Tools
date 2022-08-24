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

    let qstaUsername = document.cookie.split("qstaUsername=")[1]
    if (qstaUsername) qstaUsername = qstaUsername.split(";")[0]

    let qstaPassword = document.cookie.split("qstaPassword=")[1]
    if (qstaPassword) qstaPassword = qstaPassword.split(";")[0]

    document.querySelector(".podium_container").style.minHeight = "calc(100vh - 200px)"

    document.querySelector(".bottom").outerHTML = `
    <div class="bottom" style="justify-content: space-between; align-items: center">
        <div>Sla inloggegevens op in de volgende velden.<br>Deze worden opgeslagen in een cookiebestand.<br>Je bent zelf verantwoordelijk voor de beveiliging ervan.</div>
        <div>
            <input type='text' placeholder='Autologin gebruikersnaam' oninput='document.cookie = "qstaUsername=" + this.value + ";max-age=220752000;"' ${qstaUsername ? "value=" + qstaUsername : ""}>
            <br>
            <input type='password' placeholder='Autologin wachtwoord' oninput='document.cookie = "qstaPassword=" + this.value + ";max-age=220752000;"' ${qstaPassword ? "value=" + qstaPassword : ""}>
        </div>
    </div>`

    await awaitElement("#username")
    document.getElementById("username").value = qstaUsername || ""
    document.getElementById("username").dispatchEvent(new Event("input"))

    await awaitElement("#username_submit")
    document.getElementById("username_submit").click()

    await awaitElement("#rswp_password")
    document.getElementById("rswp_password").value = qstaPassword || ""
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

async function awaitElement(s) {
    return new Promise(p => {
        setInterval(() => {
            if (document.querySelector(s)) { p() }
        }, 10)
    })
}