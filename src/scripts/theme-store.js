const storedThemes = {
    get value() {
        return new Promise((resolve) => {
            if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['storedThemes'], (result) => {
                    resolve(result.storedThemes || []);
                });
            } else {
                // Fallback for non-extension environments
                resolve([]);
            }
        });
    },
    set value(val) {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ storedThemes: val });
        }
        // Optionally handle fallback for non-extension environments
    }
};

document.getElementById('magisterStudyToolsInstalledNotVisible').style.display = 'none';
document.getElementById('magisterStudyToolsInstalledVisible').style.display = 'block';

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
        currentThemes = [];
    }
    // Prevent adding duplicate themes based on a unique property, e.g., 'name'
    if (!currentThemes.some(theme => theme.name === themeJson.name)) {
        storedThemes.value = [
            ...currentThemes,
            {
                ...themeJson
            }
        ];
    }
}
