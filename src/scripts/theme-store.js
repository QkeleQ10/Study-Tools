const storedThemes = {
    get value() {
        return new Promise((resolve) => {
            if (
                typeof chrome !== "undefined" &&
                chrome.storage &&
                chrome.storage.local
            ) {
                chrome.storage.local.get(["storedThemes"], (result) => {
                    const themes = Array.isArray(result.storedThemes)
                        ? result.storedThemes
                        : result.storedThemes
                            ? Object.values(result.storedThemes)
                            : [];
                    resolve(themes);
                });
            } else {
                resolve([]);
            }
        });
    },
    set value(val) {
        if (
            typeof chrome !== "undefined" &&
            chrome.storage &&
            chrome.storage.local
        ) {
            chrome.storage.local.set({ storedThemes: val });
        }
    },
};

document.getElementById("magisterStudyToolsInstalledNotVisible").style.display =
    "none";
document.getElementById("magisterStudyToolsInstalledVisible").style.display =
    "block";

const observer = new MutationObserver(function () {
    const load = document.querySelector("StudyToolLoadComand");
    if (!load) return;
    storeCustomTheme(JSON.parse(load.getAttribute("themeJson")));
    load.remove();
});

observer.observe(document, { childList: true, subtree: true });

async function storeCustomTheme(themeJson) {
    let currentThemes = await storedThemes.value;
    if (!Array.isArray(currentThemes)) {
        throw new Error(
            "Stored themes should be an array, but got: " + typeof currentThemes
        );
    }

    if (!themeJson) {
        return;
    }
    if (!currentThemes.some((t) => t.id === themeJson.id)) {
        storedThemes.value = [...currentThemes, themeJson];
    }
}