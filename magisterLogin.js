checkUpdates()
login()

async function login() {

    let keysChanged = false
    document.body.onkeydown = function () { keysChanged = true }
    document.body.onkeyup = function () { keysChanged = true }

    let qstaUsername = document.cookie.split("qstaUsername=")[1]
    if (qstaUsername) qstaUsername = qstaUsername.split(";")[0]

    let qstaPassword = document.cookie.split("qstaPassword=")[1]
    if (qstaPassword) qstaPassword = qstaPassword.split(";")[0]

    document.querySelector(".bottom").outerHTML = `
    <div class="bottom" style="justify-content: space-between; align-items: center">
        Druk op een toets om te annuleren.
        <input type='text' placeholder='Autologin gebruikersnaam' oninput='document.cookie = "qstaUsername=" + this.value + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;"; console.log(this.value)' ${qstaUsername ? "value=" + qstaUsername : ""}>
        <input type='password' placeholder='Autologin wachtwoord' oninput='document.cookie = "qstaPassword=" + this.value + ";expires=Fri, 31 Dec 9999 23:59:59 GMT;"; console.log(this.value)' ${qstaPassword ? "value=" + qstaPassword : ""}>
    </div>`

    await awaitElement("#username")
    if (keysChanged) return
    document.getElementById("username").value = qstaUsername || ""
    document.getElementById("username").dispatchEvent(new Event("input"))

    await awaitElement("#username_submit")
    if (keysChanged) return
    document.getElementById("username_submit").click()

    await awaitElement("#rswp_password")
    if (keysChanged) return
    document.getElementById("rswp_password").value = qstaPassword || ""
    document.getElementById("rswp_password").dispatchEvent(new Event("input"))

    await awaitElement("[id*=_submit]")
    if (keysChanged) return
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
            if (data.version > chrome.runtime.getManifest().version) window.open("https://QkeleQ10.github.io/extensions/studytools/update", '_blank')
        })
}