let currentTheme,
    updateSteps = []

// Apply the styles instantly,
// and whenever the settings change
// and whenever the system theme changes
document.addEventListener('DOMContentLoaded', () => applyStyles())
chrome.storage.sync.onChanged.addListener(() => applyStyles())
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyStyles())

// TODO: Use color-mix() for these things: color-mix(in hsl, hsl(<color here>), hsl(${h} ${correctionSL[scheme]['accent-secondary']}))
// const correctionSL = {
//     light: {
//         'accent-primary': '95 55',
//         'accent-secondary': '95 47',
//         'foreground-accent': '78 43'
//     },
//     dark: {
//         'accent-primary': '73 30',
//         'accent-secondary': '73 22',
//         'foreground-accent': '53 55'
//     }
// }
function shiftedHslColor(hueOriginal = 207, saturationOriginal = 95, luminanceOriginal = 55, hueWish = 0, saturationWish = 0, luminanceWish = 0, hueForce, saturationForce, luminanceForce) {
    let hue, saturation, luminance

    if (hueForce) hue = hueForce
    else if (hueWish <= 207) hue = (hueOriginal / 207) * hueWish
    else if (hueWish > 207) {
        let a = (((360 - hueOriginal) / (360 - 207))),
            b = hueOriginal - a * 207
        hue = a * hueWish + b
    }

    if (saturationForce) saturation = saturationForce
    else if (saturationWish <= 95) saturation = (saturationOriginal / 95) * saturationWish
    else if (saturationWish > 95) {
        let a = (((100 - saturationOriginal) / (100 - 95))),
            b = saturationOriginal - a * 95
        saturation = a * saturationWish + b
    }

    if (luminanceForce) luminance = luminanceForce
    else if (luminanceWish <= 55) luminance = (luminanceOriginal / 55) * luminanceWish
    else if (luminanceWish > 55) {
        let a = (((100 - luminanceOriginal) / (100 - 55))),
            b = luminanceOriginal - a * 55
        luminance = a * luminanceWish + b
    }

    return `hsl(${hue}, ${saturation}%, ${luminance}%)`
}

function rootVarsForTheme(scheme = 'light', color = { h: 207, s: 95, l: 55 }) {
    switch (scheme) {
        case 'dark': {
            return `
    --st-page-background: ${syncedStorage['pagecolor']?.startsWith('true')
                    ? `hsl(${syncedStorage['pagecolor'].replace('true,', '').replace(/,/gi, ' ')})`
                    : '#111111'};
    --st-page-wallpaper: ${syncedStorage['wallpaper']?.startsWith('custom') ? `var(--st-page-wallpaper-overlay), url(${syncedStorage['wallpaper'].replace('custom,', '')})` : 'none'};
    --st-side-background: ${syncedStorage['sidecolor']?.startsWith('true')
                    ? `hsl(${syncedStorage['sidecolor'].replace('true,', '').replace(/,/gi, ' ')})`
                    : shiftedHslColor(207, 73, 30, color.h, color.s, color.l)};
    --st-appbar-background: ${syncedStorage['appbarcolor']?.startsWith('true')
                    ? `hsl(${syncedStorage['appbarcolor'].replace('true,', '').replace(/,/gi, ' ')})`
                    : shiftedHslColor(207, 73, 22, color.h, color.s, color.l)};
    --st-background-primary: #121212;
    --st-background-secondary: ${syncedStorage['wallpaper']?.startsWith('custom') || syncedStorage['pagecolor']?.startsWith('true') ? '#0c0c0caa' : '#151515'};
    --st-background-tertiary: #0c0c0c;
    --st-background-overlaid: #00000030;
    --st-highlight-primary: ${shiftedHslColor(207, 33, 20, color.h, color.s, color.l, undefined, undefined, 10)};
    --st-highlight-subtle: #181f24;
    --st-highlight-ok: #1a4c38;
    --st-highlight-warn: #511f1f;
    --st-highlight-info: #0f314d;
    --st-foreground-primary: #fff;
    --st-foreground-secondary: #dddddd;
    --st-foreground-insignificant: #888;
    --st-foreground-accent: ${shiftedHslColor(207, 53, 55, color.h, color.s, color.l, undefined, undefined, 55)};
    --st-border-color: #2e2e2eaa;
    --st-accent-primary: ${shiftedHslColor(207, 73, 30, color.h, color.s, color.l)};
    --st-accent-primary-dark: ${shiftedHslColor(207, 73, 22, color.h, color.s, color.l)};
    --st-accent-ok: #339e7c;
    --st-accent-warn: #e94f4f;
    --st-accent-info: #4ea3e9;
    --st-chip-info-border: #0565b4;
    --st-chip-info-background: #022a4b;
    --st-chip-ok-border: #13c4a3;
    --st-chip-ok-background: #15363c;
    --st-chip-warn-border: #953541;
    --st-chip-warn-background: #2f1623;
    --st-contrast-accent: #fff /*color-contrast(var(--st-accent-primary) vs #fff, #333333)*/;
    --st-decoration-fill: #77777711;
    --st-decoration-fill-opaque: #777777;
    --st-decoration-fill-intense: #77777730;
    --st-shadow-value: 0;
    --st-shadow-alpha: .7;
    --st-hover-brightness: 1.3;
    `}

        default: {
            return `
    --st-page-background: ${syncedStorage['pagecolor']?.startsWith('true')
                    ? `hsl(${syncedStorage['pagecolor'].replace('true,', '').replace(/,/gi, ' ')})`
                    : '#ffffff'};
    --st-page-wallpaper: ${syncedStorage['wallpaper']?.startsWith('custom') ? `var(--st-page-wallpaper-overlay), url(${syncedStorage['wallpaper'].replace('custom,', '')})` : 'none'};
    --st-side-background: ${syncedStorage['sidecolor']?.startsWith('true')
                    ? `hsl(${syncedStorage['sidecolor'].replace('true,', '').replace(/,/gi, ' ')})`
                    : shiftedHslColor(207, 95, 55, color.h, color.s, color.l)};
    --st-appbar-background: ${syncedStorage['appbarcolor']?.startsWith('true')
                    ? `hsl(${syncedStorage['appbarcolor'].replace('true,', '').replace(/,/gi, ' ')})`
                    : shiftedHslColor(207, 95, 47, color.h, color.s, color.l)};
    --st-background-primary: #ffffff;
    --st-background-secondary: ${syncedStorage['wallpaper']?.startsWith('custom') || syncedStorage['pagecolor']?.startsWith('true') ? '#ffffffaa' : '#ffffff'};
    --st-background-tertiary: #fafafa;
    --st-background-overlaid: #12121210;
    --st-highlight-primary: ${shiftedHslColor(207, 85, 82, color.h, color.s, color.l, undefined, undefined, 96)};
    --st-highlight-subtle: #f2f9ff;
    --st-highlight-ok: #b6fadf;
    --st-highlight-warn: #ffd4e2;
    --st-highlight-info: #dceefd;
    --st-foreground-primary: #333333;
    --st-foreground-secondary: #555555;
    --st-foreground-insignificant: #888;
    --st-foreground-accent: ${shiftedHslColor(207, 78, 43, color.h, color.s, color.l, undefined, undefined, 43)};
    --st-border-color: #dfdfdfaa;
    --st-accent-primary: ${shiftedHslColor(207, 95, 55, color.h, color.s, color.l)};
    --st-accent-primary-dark: ${shiftedHslColor(207, 95, 47, color.h, color.s, color.l)};
    --st-accent-ok: #339e7c;
    --st-accent-warn: #e94f4f;
    --st-accent-info: #4ea3e9;
    --st-chip-info-border: #066ec2;
    --st-chip-info-background: #ffffff;
    --st-chip-ok-border: #19c5a5;
    --st-chip-ok-background: #d0f3ed;
    --st-chip-warn-border: #a53e52;
    --st-chip-warn-background: #f7d4d2;
    --st-contrast-accent: #fff /*color-contrast(var(--st-accent-primary) vs #fff, #333333)*/;
    --st-decoration-fill: #dddddd11;
    --st-decoration-fill-opaque: #dddddd;
    --st-decoration-fill-intense: #dddddd2a;
    --st-shadow-value: 210;
    --st-shadow-alpha: .5;
    --st-hover-brightness: .9;
    `}
    }
}

async function applyStyles(varsOnly, overrideTheme, overrideColor, dontUpdate) {
    if (!dontUpdate && chrome?.storage) await initialiseStorage();

    let now = new Date()

    let themeFixed = syncedStorage['ptheme']?.split(',')
    if (overrideTheme) themeFixed[0] = overrideTheme
    let themeAuto = themeFixed[0] === 'auto'
    currentTheme = themeFixed
    if (themeAuto && window.matchMedia?.('(prefers-color-scheme: dark)').matches) { currentTheme[0] = 'dark' }
    else if (themeAuto) currentTheme[0] = 'light'

    if (verbose) console.debug(`STYLE START with theme ${currentTheme.join(', ')}`)

    const rootVarsGeneral = `
    --st-font-family-primary: 'arboria', sans-serif;
    --st-font-primary: 600 16px/44px var(--st-font-family-primary);
    --st-font-hero: 700 28px/2rem var(--st-font-family-primary);
    --st-font-family-secondary: 'open-sans', sans-serif;
    --st-border: 1px solid var(--st-border-color);
    --st-border-radius: ${syncedStorage.shape}px;
    --st-background-overlay: hsl(from var(--st-background-primary) h s l / 0.97);
    --st-background-transparent: hsl(from var(--st-background-primary) h s l / 0.73);
    --st-page-wallpaper-overlay: linear-gradient(color-mix(in srgb, var(--st-page-background), transparent ${Number(syncedStorage['wallpaper-opacity']) * 100}%), color-mix(in srgb, var(--st-page-background), transparent ${Number(syncedStorage['wallpaper-opacity']) * 100}%));
    --mg-logo-expanded: url('assets/images/logo-magister-white.svg');
    --mg-logo-collapsed: url('assets/images/logo-m-white.svg');`

    const rootVarsInvert = `
    #studiewijzer-detail-container .clearfix.user-content {
        background-color: var(--st-background-primary);
        color: var(--st-foreground-primary);
    }

    #studiewijzer-detail-container .clearfix.user-content * {
        color: var(--st-foreground-primary);
    }

    .block .content.background-white {
        background-color: var(--st-background-secondary);
    }

    .view>iframe:not(.st-approve), .view>.container>iframe:not(.st-approve) {
        filter: invert(1) hue-rotate(180deg);
    }`

    createStyle(`
    :root { 
        ${rootVarsForTheme(currentTheme?.[0], overrideColor || { h: currentTheme?.[1], s: currentTheme?.[2], l: currentTheme?.[3] })} 
        ${rootVarsGeneral}
        ${(syncedStorage['darken-content'] && currentTheme?.[0] === 'dark') ? rootVarsInvert : ''}
    }
    
    .st-force-dark {
        ${rootVarsForTheme('dark', overrideColor || { h: currentTheme?.[1], s: currentTheme?.[2], l: currentTheme?.[3] })} 
    }
    
    .st-force-light {
        ${rootVarsForTheme('light', overrideColor || { h: currentTheme?.[1], s: currentTheme?.[2], l: currentTheme?.[3] })} 
    }

    :root, html, body, * {
        color-scheme: ${currentTheme?.[0]} !important;
    }
    `, 'study-tools-vars')

    if (varsOnly) return

    now = new Date()

    // Menu bar decorations
    function decorations() {
        let style = syncedStorage['decoration']?.split(',')[0],
            size = syncedStorage['decoration-size'] ?? 1,
            css
        switch (style) {
            case 'waves':
                css = `background-image: repeating-radial-gradient( circle at 0 0, transparent 0, var(--st-side-background) calc(${size} * 29px), transparent calc(${size} * 30px) ), repeating-linear-gradient( var(--st-decoration-fill), var(--st-decoration-fill-intense) );`
                break;

            case 'zig-zag':
                css = `background-image: linear-gradient(135deg, var(--st-decoration-fill) 25%, transparent 25%), linear-gradient(225deg, var(--st-decoration-fill) 25%, transparent 25%), linear-gradient(45deg, var(--st-decoration-fill) 25%, transparent 25%), linear-gradient(315deg, var(--st-decoration-fill) 25%, var(--st-side-background) 25%); background-position: calc(${size} * 25px) 0, calc(${size} * 25px) 0, 0 0, 0 0; background-size: calc(${size} * 50px) calc(${size} * 50px); background-repeat: repeat;`
                break;

            case 'polka-dot':
                css = `background-image: radial-gradient(var(--st-decoration-fill) 30%, transparent 31.2%), radial-gradient(var(--st-decoration-fill) 30%, transparent 31.2%); background-position: 0px 0px, calc(${size} * 40px) calc(${size} * 40px); background-size: calc(${size} * 80px) calc(${size} * 80px);`
                break;

            case 'stripes':
                css = `background-image: repeating-linear-gradient(45deg, transparent, transparent calc(${size} * 15px), var(--st-decoration-fill) calc(${size} * 15px), var(--st-decoration-fill-intense) calc(${size} * 40px));`
                break;

            case 'lego':
                css = `background-size: ${size * 120}%; background-position: center center; background-repeat: repeat repeat; background-image: url('data:image/svg+xml,<%3Fxml version="1.0" encoding="UTF-8"%3F><svg fill="none" viewBox="0 0 168 238" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(%23b)"><path d="m139.5-13.5h-13v41h13v-41zm1 41v-13h27v27h-13-14v-14zm28 14v-27h13.5 0.5v-15h-0.5l-41.5-2e-6v-14h-0.5-14-0.5v14h-13l-0.5-1e-6h-0.5l-13 1e-6v-14h-0.5-14-0.5-13.5-0.5v14l-55-3e-6v-14h-0.5-42-0.5v0.5 28 0.5h0.5 27.5v28 41h-14v0.5 28 0.5h14l-4e-6 55h-42v15h42v41h-28v0.5 28 0.5h43v-14h27 1 27v14h28.5 14 0.5v-0.5-13.5h13v27.5 0.5h0.5 14 0.5v-0.5-27.5h28v-56h14v-15h-14v-55h13.5 0.5v-29h-0.5-13.5v-41-1zm-168-27v13h13v-13h-13zm14 0v13h41 1 13v-27l-55-3e-6v13 1zm-1-15v-13h-41v27h27 0.5 13.5v-13.5-0.5zm127 14v-13l41 2e-6v13h-13-0.5-27.5zm27 224v-13h-27v13h27zm0-14v-13h-41v13h41zm-42 0v-13h-27v13h27zm0 14v-13h-13v13h13zm1 1v27h13v-27-14h-13v14zm-15-1v-13h-13v13h13zm-98-70h-13l4e-6 -55h13v27.5 0.5 14 13zm1 0.5v-0.5-13h13v41h-13v-13-1-13-0.5zm-14 14.5h13v13 1 13 0.5 13.5h-13v-41zm-0.5-1h-41.5v-13h41.5 13.5v13h-13.5zm167.5-14v-13h-55v13h55zm-42 1h-55v27h55v-27zm1 14v27h41v-27h-41zm42-1h13v-13h-55v13h42zm-43 15v13h-41v-13h41zm-14 42h-14v-14h-13v27h13.5 13.5v-13zm-41 13h13v-27h-13v27zm13-28h14v-13h-27v13h13zm-14 1v-14h-14-13v27h27v-13zm0-15h14v-13h-27v13h13zm0-27v13h-14-13v-13h27zm-27.5 14h0.5 13v13h-13-28v-13h27.5zm-0.5-15h-13v-27h41v27h-27-1zm29-14h41v-13h-41v13zm97-41h-27v27h27v-27zm-55 0h-14v27h41v-27h-27zm41-14v13h-41v-27h27 14v14zm14.5-1h-13.5v-27h14 13v27h-13-0.5zm-0.5 1v13h-13v-13h13zm-70 28v13h-27v-13h27zm0-14v13h-41v-13h41zm0.5-1h-41.5v-13h28 27v13h-13.5zm-69.5 28h41v-13h-14-27-1-13v13h13 1zm-28.5-42h-0.5-13v-27h13 0.5 13.5v27h-13.5zm14.5 28v-27h13v27h-13zm13-41.5v13.5h-13v-27h13v13.5zm28-14.5h-27v-27h27v27zm1 14v-13h13.5 0.5 13v13h-27zm-15 15h-13v27h27v-14-13h-13-1zm1-14v13h13 28v-13h-27-0.5-0.5-13zm69 13v-27h-27v27h27zm-84-55.5v27.5h-13-1-13v-41h14 13v13.5zm1-13.5v13h27v-13h-27zm28 0v13h27v-27h-13-0.5-0.5-13v13 1zm-43-1v-13h-13v13h13zm1-13h41v13h-28-13v-13zm42 41v-13h27v13h-13-14zm0 1v13h13v-13h-13zm55-1h14v-13h-14-27v13h27zm0-14v-41h-27v14 27h27zm-41 28v-13h13.5 27.5v13h-27-0.5-13.5zm42 0v-13h14 13v27h-27v-14zm-42-83.5v-13.5h13v27h-13v-13.5zm0 27.5v-13h13v13h-13zm41-14v-13h-13.5-0.5v-14h-13v27h27zm1 0.5v27.5h13v-41l-13-1e-6v13.5zm0 41.5v-13h13v13h-13zm14-14v-13h13v41h-13v-28zm27 56h-13v-27-28h13v41 14zm14-55v41h-13v-41h13zm-153 181v-13h27v27h-27v-13-1zm-1 15v-0.5-13.5h-13.5-27.5v27h41v-13zm28-56h-13v13h13v-13zm0-71v-14h0.5 13.5v-13h-27v27h13z" clip-rule="evenodd" fill="${getComputedStyle(document.documentElement).getPropertyValue('--st-decoration-fill-opaque').replace('#', '%23')}" fill-opacity=".08" fill-rule="evenodd"/><g filter="url(%23a)"><path d="m3 7c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm18 4c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm10-4c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm18 4c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm10-4c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm18 4c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm10-4c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm18 4c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm10-4c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm18 4c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm10-4c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm14 0c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm0 14c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-14-210c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-14-210c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-14-210c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-14-210c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-14-210c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-14-210c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4z" clip-rule="evenodd" fill="${getComputedStyle(document.documentElement).getPropertyValue('--st-decoration-fill-opaque').replace('#', '%23')}" fill-opacity=".08" fill-rule="evenodd" shape-rendering="crispEdges"/></g></g><defs><filter id="a" x="0" y="0" width="170" height="240" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dx="1" dy="1"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow_13_3"/><feBlend in="SourceGraphic" in2="effect1_dropShadow_13_3" result="shape"/></filter><clipPath id="b"><rect width="168" height="238" fill="%23fff"/></clipPath></defs></svg>')`
                break;

            case 'custom':
                css = `background-image: url(${syncedStorage['decoration']?.split(',')[1]}); background-size: ${size === 1 ? 'cover' : `auto calc(${size} * 100vh)`}; background-position: center;`
                break;

            default:
                css = ''
                break;
        }
        createStyle(`.menu-host {${css}}`, 'study-tools-menu-decoration')
    }
    decorations()

    // Valentine's day mode
    if (now.getMonth() === 1 && now.getDate() === 14) {
        handleSpecialTheme('valentine')
    }
    // Halloween mode
    if (now.getMonth() === 9 && now.getDate() === 31) {
        if (await getFromStorage('no-special-decorations', 'session') !== 'halloween') {
            const audio = new Audio(`https://www.myinstants.com/media/sounds/${['thunder-sound-effect', 'thunder-crack'].random()}.mp3`)
            setTimeout(() => audio.play(), 9800)
            setTimeout(() => {
                handleSpecialTheme('halloween', `:root{--st-page-wallpaper:var(--st-page-wallpaper-overlay),url(https://www.creativefabrica.com/wp-content/uploads/2023/09/01/gothic-halloween-wallpaper-Graphics-78301451-1.jpg)!important}html{animation:1s flash}.menu-host{background-image:none}@keyframes flash{0%,15%{filter:blur(10px)}10%{filter:brightness(5) blur(10px)}20%{filter:brightness(10) blur(10px)}100%{filter:none}}`, 'dark', { h: 22, s: 85, l: 60 })
            }, 10000)
        }
    }
    // Christmas mode
    if (now.getMonth() === 11 && [24, 25, 26, 27].includes(now.getDate())) {
        handleSpecialTheme('christmas')
    }

    createStyle(`
body>.container {
    display: grid;
    grid-template: 
        "appbar menu view" auto
        ". . view" 1fr
        / auto auto 1fr;
}

.logo .logo-expanded.ng-scope {
    content: var(--mg-logo-expanded);
}

.logo-collapsed {
    content: var(--mg-logo-collapsed);
}

.appbar-host {
    grid-area: appbar;
    height: 100vh;
    max-height: 100vh;
    z-index: 1;
}

mg-feedback-dialog {
    position: absolute;
}

.menu-host {
    grid-area: menu;
    height: 100vh;
    max-height: 100vh;
}

body>.container>.view {
    grid-area: view;
    position: relative;
    min-width: calc(100vw - 304px);
    width: 100%;
    max-width: calc(100vw - 304px);
}

.view section.main {
    overflow: auto;
}
        
.block h3 {
    position: relative;
}

div.collapsed-menu ~ div.view {
    min-width: calc(100vw - 128px);
    max-width: calc(100vw - 128px);
}

.block h4 {
    border-bottom: var(--st-border)
}

.block h4,
footer.endlink {
    box-shadow: none;
    border-top: var(--st-border)
}

body,
html {
    height: 100vh;
    box-sizing: border-box;
}

body {
    background-color: var(--st-page-background) !important;
    background-image: var(--st-page-wallpaper) !important;
    background-size: cover !important;
    background-position: center !important;
}

aside {
    background-color: var(--st-background-secondary);
    border: var(--st-border);
}

aside > .content-container {
    border-color: transparent;
}

.k-block,
.k-widget,
div.loading-overlay,
input[type=switch]+label span,
.agenda-lesdashboard .lesvak-prev-next .content-auto .list li:hover, .agenda-lesdashboard .lesvak-prev-next .content-auto .list a:hover,
.agenda-lesdashboard .lesvak-prev-next .content-auto span.icon-up-arrow.prev:hover, .agenda-lesdashboard .lesvak-prev-next .content-auto span.icon-up-arrow.next:hover {
    background: var(--st-background-primary) !important
}

ul.widget-checkboxes li {
    height: 32px;
    min-height: unset;
    padding: 0 4px;
    line-height: normal;
    border: none;
}

input[type=checkbox]+label span {
    width: 24px;
    height: 24px;
    box-sizing: border-box;
    background-color: var(--st-background-tertiary);
    border: var(--st-border);
    border-radius: calc(var(--st-border-radius) * 0.75);
}

input[type=checkbox]:checked+label span {
    background-color: var(--st-highlight-primary);
}

input[type=checkbox]:checked+label span:after {
    width: 22px;
    height: 22px;
    color: var(--st-foreground-primary);
    font: 600 16px/23px "Font Awesome 6 Pro";
    content: '';
}

#afsprakenLijst colgroup>col:nth-child(2) {
    width: 72px !important;
}

.tabsheet#idMultimedia .content>div[ng-show] img {
    max-width: 100%;
    height: auto;
}

.tabsheet#idMultimedia .content>div[ng-show] img[src="assets/images/PlayerPlaceHolder.png"] {
    visibility: hidden;
}

.tabsheet#idMultimedia .content>div[ng-show]:has(> img[src="assets/images/PlayerPlaceHolder.png"]) {
    background: radial-gradient(at -150% -50%, var(--st-highlight-primary), transparent), radial-gradient(at top right, var(--st-background-primary), var(--st-background-tertiary));
}

.tabsheet#idMultimedia .content>div[ng-show]:has(> img[src="assets/images/PlayerPlaceHolder.png"]):after {
    content: '';
    font: 600 48px "Font Awesome 6 Pro";
    position: absolute;
    top: 50%;
    left: 50%;
    translate:  -50% -50%;
    visibility: visible;
    opacity: .25;
}

.k-multiselect .k-select:has(.k-icon.k-i-close) {
    content-visibility: hidden;
    width: 8px;
}

div.fancy-select .k-multiselect .k-multiselect-wrap li.k-button {
    border-radius: calc(var(--st-border-radius) * .75);
    margin-top: 4px;
    margin-left: 4px;
}

div.fancy-select .k-multiselect .k-multiselect-wrap li.k-button:hover, div.fancy-select .k-multiselect .k-multiselect-wrap li.k-button.k-state-hover {
    background-color: var(--st-highlight-warn);
}

.k-multiselect .k-button span:first-child:first-letter {
    text-transform: capitalize;
}

.new-appointment-block > fieldset > ul > li:nth-child(4) > div > span.check > label {
    text-wrap: nowrap;
}

div.loading-overlay {
    background: radial-gradient(at -150% -50%, var(--st-highlight-primary), transparent), radial-gradient(at top right, var(--st-background-primary), var(--st-background-tertiary)) !important;
    z-index: 200;
}

div.loading-overlay * {
    color: var(--st-foreground-primary) !important;
    font: 14px var(--st-font-family-secondary) !important;
}

div.loading-overlay>div:before {
    color: var(--st-foreground-primary) !important;
}

#cijferoverzichtgrid, .sm-grid.k-grid .k-grid-content tbody, .sm-grid.k-grid, .tech-info {
    background: transparent !important;
    border-color: var(--st-border-color) !important;
}

.block h3 b {
    font: var(--st-font-primary);
    color: var(--st-foreground-primary)
}

.block,
.content-container,
.studiewijzer-onderdeel>div.block>div.content:not(#studiewijzer-detail-container div, #studiewijzer-detail-container ul),
#cijfers-container .main div.content-container-cijfers, dna-card,
.opdracht-versions ul {
    border: var(--st-border);
    border-radius: var(--st-border-radius)
}

.content.content-auto.background-white li>span,
.content.content-auto.background-white li>strong {
    color: #000
}

.k-scheduler-weekview .k-scheduler-table .k-today,
.k-scheduler-workWeekview .k-scheduler-table .k-today,
.k-scheduler .k-today,
.ng-scope td.vrijstelling,
.versions li.selected,
.versions li:hover,
.k-scheduler .k-event.k-state-selected,
.alert,
.k-dropdown .k-dropdown-wrap.k-state-active,
.projects li.selected,
.agenda-lesdashboard aside .agenda-list li a.current,
.k-list-container .k-item.k-state-focused.k-state-selected,
.k-calendar td.range-select,
.k-calendar .k-content tbody td.k-other-month.k-state-hover, .k-calendar .k-content tbody td.k-state-focused, .k-calendar .k-content tbody td.k-state-hover, .k-calendar .k-content tbody td.k-state-selected,
.k-calendar .k-header .k-state-hover,
.column-container li.selected, .column-container li.checked,
.k-treeview .k-in.k-state-selected>a, .k-treeview .k-in.k-state-selected.k-state-focused>a, .k-treeview .k-in.k-state-selected .k-state-focused>a,
.k-treeview .k-in.k-state-hover>a, .k-treeview .k-in.k-state-focused>a, .k-treeview .k-in.k-state-selected:hover>a {
    background: var(--st-highlight-primary) !important;
    background-color: var(--st-highlight-primary) !important
}

.k-calendar .k-content tbody td.k-other-month.k-state-hover a, .k-calendar .k-content tbody td.k-state-focused a, .k-calendar .k-content tbody td.k-state-hover a, .k-calendar .k-content tbody td.k-state-selected a {
    background: none !important;
    background-color: none !important;
}

.agenda-text-icon.outline[icon-type=information], .agenda-text-icon, .text-icon {
    display: inline-block;
    padding-inline: 12px !important;
    height: auto;
    width: auto;
    min-width: max-content;
    border: 1px solid var(--st-chip-info-border);
    border-radius: 12px;
    background-color: var(--st-chip-info-background);
    color: var(--st-foreground-primary) !important;
    font: 500 11px/22px var(--st-font-family-secondary);
}

.agenda-text-icon[icon-type=information], .text-icon[icon-type=information] {
    border: 1px solid var(--st-chip-info-border) !important;
    background-color: var(--st-chip-info-border);
    color: #fff !important;
}

.agenda-text-icon[icon-type=ok], .text-icon[icon-type=ok] {
    border: 1px solid var(--st-chip-ok-border) !important;
    background-color: var(--st-chip-ok-background);
    color: var(--st-foreground-primary);
}

.agenda-text-icon[icon-type=error], .text-icon[icon-type=error] {
    border: 1px solid var(--st-chip-warn-border) !important;
    background-color: var(--st-chip-warn-background);
    color: var(--st-foreground-primary);
}

.agenda-text-icon:first-letter {
    text-transform: capitalize;
}

.sm-grid.k-grid .k-grid-content .icon-column {
    overflow: visible;
}

#studiewijzer-detail-container .content>ul.sources,
#studiewijzer-detail-container .studiewijzer-onderdeel div.content.coloring-blauw .sources li ul,
.block,
.block .content,
.block .content form,
.block h4,
.k-dropdown .k-dropdown-wrap.k-state-default,
.k-dropdown .k-dropdown-wrap.k-state-hover,
.k-grouping-row td,
.k-header,
.k-multiselect .k-button,
.k-multiselect-wrap,
.k-resize-handle-inner,
div[role=gridcell],
.k-scheduler .k-event,
.k-scheduler .k-event:hover,
.k-scheduler-dayview .k-scheduler-table .k-nonwork-hour,
.k-scheduler-weekview .k-scheduler-table .k-nonwork-hour,
.k-scheduler-workWeekview .k-scheduler-table .k-nonwork-hour,
.sm-grid.k-grid .k-grid-content tr,
.sm-grid.k-grid .k-grid-content tr.k-state-selected,
.sm-grid.k-grid .k-grid-content tr.k-state-selected .k-state-focused,
.sm-grid.k-grid .k-grid-content tr.k-state-selected.k-state-focused,
.sm-grid.k-grid .k-grid-content tr:hover,
.sources li:hover,
.studiewijzer-onderdeel>div.block>div.content,
.widget .list li.active,
.widget .list li.no-data a:hover,
.widget .list li.no-data:hover,
.widget .list li:hover,
.widget li,
aside .block .content,
dl.list-dl,
footer.endlink,
table.table-grid-layout th,
td.k-group-cell, #studiewijzer-container div.studiewijzer-list>ul>li, #studiewijzer-container div.studiewijzer-list div.head, #studiewijzer-container div.studiewijzer-list>ul>li:hover, .projects li:hover,
.collapsed-menu .popup-menu,
.collapsed-menu #faux-label,
.appbar .menu-button>a:hover>span,
.collapsed-menu .popup-menu ul li a:hover,
.toast,
.alert-toast i,
#vandaag-container .grade-widget ul,
.cijfers-k-grid.k-grid .k-grid-header th.k-header,
div.ngRow.odd, div.ngRow.even,
dna-card,
.k-calendar .k-header {
    background: var(--st-background-secondary)
}

.block h3, #studiewijzer-container div.studiewijzer-list div.head,
table.table-grid-layout th {
    box-shadow: none;
}

footer.endlink {
    border-radius: 0 0 8px 8px
}

a:not(.user-content a, .st-button, .st-metric, .st-keyboard-hint, .st-widget, .st-widget-title, .st-widget-subitem), table.table-grid-layout td a,
.k-calendar .k-header .k-nav-fast {
    color: var(--st-foreground-accent);
    text-decoration: none;
    overflow-wrap: anywhere
}

.collapsed-menu .popup-menu h3,
.collapsed-menu #faux-label,
.appbar .menu-button>a:hover>span,
.collapsed-menu .popup-menu ul li a:hover,
.appbar .popup-menu h3,
.card .content .content-title {
    color: var(--st-foreground-accent);
}

aside .tabs li.active {
    border-color: var(--st-foreground-accent);
}

.alert a:hover,
.k-dropdown .k-dropdown-wrap.k-state-hover,
.k-scheduler-dayview .k-scheduler-header .k-scheduler-table th,
.k-scheduler-weekview .k-scheduler-header .k-scheduler-table th,
.k-scheduler-workWeekview .k-scheduler-header .k-scheduler-table th,
table.table-grid-layout tr:hover,
.k-grid-header,
#cijfers-container aside .widget .cijfer-berekend tr, form .radio input[type=radio]~label, fieldset .radio input[type=radio]~label,
.wizzard div.sheet div.grid-col div.ngHeaderContainer, div.ngHeaderCell, .column-container h3, #bronnen-container .bronnen-quota-label {
    background-color: var(--st-background-secondary) !important;
    box-shadow: none !important
}

table.table-grid-layout tr, table.table-grid-layout td,
#cijfers-container .main div.content-container-cijfers,
div.ngRow:hover>:not(.unselectable),
.card,
form input[type=text], form input[type=password], form input[type=search], form input[type=email], form input[type=url], form input[type=tel], form input[type=number], fieldset input[type=text], fieldset input[type=password], fieldset input[type=search], fieldset input[type=email], fieldset input[type=url], fieldset input[type=tel], fieldset input[type=number],
.settings-container .widget .multi-line li:hover,
#agenda-afspraak-bewerken-container .k-datepicker .k-picker-wrap,
.k-editor .k-content,
.k-editable-area,
.k-list-container, html body .k-popup.k-list-container .k-item,
.k-calendar thead th, .k-calendar .k-header *, .column-container h3, #bronnen-container .bronnen-quota-label,
.k-treeview .k-treeview-lines, .k-grid-header .k-link:link, .k-grid-header .k-link:visited, .k-grid-header .k-nav-current.k-state-hover .k-link, .k-grouping-header .k-link {
    background-color: var(--st-background-secondary) !important;
    color: var(--st-foreground-primary);
}

.dialog {
    width: auto;
    min-width: 400px;
    margin: 0;
    translate: -50% -50%;
    background-color: var(--st-background-overlay);
    color: var(--st-foreground-primary);
    border: var(--st-border);
    border-radius: var(--st-border-radius);
    overflow: visible;
    box-shadow: 0 0 8px 0 rgba(var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-alpha));
}

.dialog-overlay:before {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(3px);
}

.dialog .content-pane, .dialog .title, .dialog .content, .dialog .footer, .dialog .content * {
    background-color: transparent !important;
    color: var(--st-foreground-primary) !important;
    border: none;
}

.dialog .title {
    height: auto;
    padding: 24px;
    padding-bottom: 0;
    font: var(--st-font-primary);
    line-height: normal;
    box-shadow: none;
}

.dialog .content {
    padding: 24px;
    min-height: 0;
}

.dialog .content p {
    padding-left: 0 !important;
    font: 14px/18px var(--st-font-family-secondary) !important;
}

.dialog .footer {
    height: auto;
    bottom: -40px;
    display: flex;
    justify-content: end;
    gap: 8px;
    box-shadow: none;
}

.dialog .footer .primary-button, .dialog .footer .secondary-button {
    height: 32px;
    width: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 16px;
    padding-block: 6px;
    margin: 0;
    background-color: var(--st-background-overlay);
    color: var(--st-foreground-secondary);
    border: var(--st-border);
    border-radius: var(--st-border-radius);
    font: 600 14px/16px var(--st-font-family-secondary);
    box-shadow: 0 0 8px 0 rgba(var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-alpha));
    text-transform: none !important;
}

.dialog .footer .primary-button:first-letter, .dialog .footer .secondary-button:first-letter {
    text-transform: capitalize;
}

.dialog .footer .primary-button {
    background-color: var(--st-accent-primary);
    color: var(--st-contrast-accent);
}

.dialog-large {
    top: 50% !important;
    left: 50% !important;
    width: 80% !important;
    height: 80% !important;
}

table:not(.clearfix.user-content table),
table.table-grid-layout td,
.ngGrid,
#profiel-container .content,
div.profile-content,
span.datetime-label, 
.block h3+div h3,
.main div.multi-columns .col, .main div.multi-columns .col-noprint,
.sm-grid.k-grid .k-grid-header th.k-header {
    background: transparent !important;
    color: var(--st-foreground-primary);
    border-color: var(--st-border-color) !important
}

.k-grid-header,
.k-multiselect .k-button,
.k-multiselect.k-header,
.widget li,
dl.list-dl dd,
dl.list-dl dt,
table:not(.st) *, #studiewijzer-container div.studiewijzer-list>ul>li, #studiewijzer-container div.studiewijzer-list div.head, #studiewijzer-container div.studiewijzer-list>ul>li>a>span, #studiewijzer-container div.studiewijzer-list div.head span:first-child, 
form .radio input[type=radio]~label, fieldset .radio input[type=radio]~label,
.k-dropdown .k-dropdown-wrap.k-state-default,
.projects li.selected, .projects li:hover,
.studiewijzer-onderdeel div.content ul>li,
table.table-grid-layout,
input[type=switch]+label span, 
.collapsed-menu .popup-menu,
.collapsed-menu #faux-label,
.appbar .menu-button>a:hover>span,
#vandaag-container .grade-widget ul,
.widget .dualcolumn-list li,
#cijfers-container .main div.content-container-cijfers,
div.ngCell,
dna-card,
.card,
form input[type=text], form input[type=password], form input[type=search], form input[type=email], form input[type=url], form input[type=tel], form input[type=number], fieldset input[type=text], fieldset input[type=password], fieldset input[type=search], fieldset input[type=email], fieldset input[type=url], fieldset input[type=tel], fieldset input[type=number],
.settings-container ul.multi-line,
#agenda-afspraak-bewerken-container .k-datepicker .k-picker-wrap,
html body .k-popup.k-list-container .k-item,
.k-popup.k-list-container,
.k-list-container.k-state-border-up .k-list,
.opdracht-versions ul,
.agenda-lesdashboard span,
.bottom_border,
.k-calendar,
.k-calendar td.range-select,
.k-calendar .k-content tbody td.k-other-month.k-state-hover, .k-calendar .k-content tbody td.k-state-focused, .k-calendar .k-content tbody td.k-state-hover, .k-calendar .k-content tbody td.k-state-selected,
.attachment-bar, .attachments,
.block h3,
.k-treeview .k-treeview-lines,
.k-treeview-lines li {
    border-color: var(--st-border-color) !important;
    outline-color: var(--st-border-color) !important
}

.collapsed-menu .popup-menu::after,
.collapsed-menu li:hover span::after,
.appbar .menu-button>a:hover>span::after {
    border-right: 5px solid var(--st-border-color) !important;
    left: -5px;
}

.k-dropdown-wrap.k-state-hover,
.k-scheduler .k-event:hover,
.sm-grid.k-grid .k-grid-content tr:hover,
.sources li:hover,
.widget .list li.active,
.widget .list li.no-data a:hover,
.widget .list li.no-data:hover,
.widget .list li:hover,
table.table-grid-layout tr:hover,
.k-dropdown .k-dropdown-wrap.k-state-active,
input[type=radio]~label:hover,
.collapsed-menu .popup-menu ul li a:hover,
div.ngRow:hover>:not(.unselectable) {
    filter: brightness(var(--st-hover-brightness));
    transition: transform 200ms;
}

.widget .list li.no-data a:hover,
.widget .list li.no-data:hover {
    cursor: default
}

.tabs,
.widget .list {
    border-bottom: var(--st-border)
}

.widget .list li {
    border-top: var(--st-border)
}

.sm-grid.k-grid .k-grid-content tr {
    height: 40px !important
}

.block .content .title,
.block h4,
.k-dropdown-wrap .k-input,
.studiewijzer-onderdeel div.content ul.sources ul>li>a,
.subtitle,
.tabs li a,
.widget .list li a,
a.ng-binding,
dd,
span:not(.st-title, .st-subtitle, .st-section-title, .st-banner, .st-tip, .caption, .k-dropdown, .user-content span):not([class^="st-"]):not([id^="st-"]),
dl.list-dl dd,
dl.list-dl dt,
dna-breadcrumb,
dt,
fieldset label,
form label,
h4,
label,
p:not(.user-content p),
strong,
td,
th,
.k-scheduler .k-event,
.block .content p:not(.user-content p),
form .radio input[type=radio]:checked~label,
.toast em,
div.ngCell, div.ngCellText, div.ngVerticalBar, div.ngHeaderCell, div.ngHeaderContainer,
li.k-item, span.k-input {
    font-family: var(--st-font-family-secondary);
    color: var(--st-foreground-primary)
}

a.k-link.k-nav-fast {
    font-family: var(--st-font-family-secondary) !important;
}

div.ngVerticalBar {
    background-color: var(--st-border-color);
}

.k-scheduler-table td,
.k-scheduler-table th,
.k-scheduler-table th strong,
.k-calendar .k-content *,
.k-calendar .k-content tbody td.k-other-month.k-state-hover a, .k-calendar .k-content tbody td.k-state-focused a, .k-calendar .k-content tbody td.k-state-hover a, .k-calendar .k-content tbody td.k-state-selected a {
    font-family: var(--st-font-family-secondary) !important;
    color: var(--st-foreground-primary) !important
}

.alt-nrblock i,
.k-scheduler .k-event.k-state-selected, .k-dropdown .k-input, .k-dropdown .k-state-focused .k-input,
div.faux.popup-menu>ul>li.submenu>a,
.k-list-container .k-item.k-state-focused.k-state-selected,
.k-calendar .k-content tbody td.k-other-month.k-state-hover, .k-calendar .k-content tbody td.k-state-focused, .k-calendar .k-content tbody td.k-state-hover, .k-calendar .k-content tbody td.k-state-selected {
    color: var(--st-foreground-primary) !important
}

.appbar .popup-menu {
    background-color: var(--st-background-overlay);
    color: var(--st-foreground-primary);
    border-color: var(--st-border-color);
}

.appbar .popup-menu>h3 {
    color: var(--st-foreground-accent) !important;
}

.appbar .popup-menu div, .appbar .popup-menu a {
    color: var(--st-foreground-primary) !important;
    font-size: 12px;
    font-family: var(--st-font-family-secondary);
    border-color: var(--st-border-color);
}

.appbar .popup-menu ul li a:hover {
    background-color: var(--st-highlight-primary);
    color: var(--st-foreground-primary) !important;
}

.menu a,
.menu a span {
    color: var(--st-contrast-accent) !important
}

.k-scheduler .afspraak .afspraak-info>.title .schoolHour,
span.nrblock, 
#afsprakenlijst-container .nrblock {
    display: inline-flex !important;
    justify-content: center;
    align-items: center;
    height: 20px !important;
    aspect-ratio: 1 !important;
    padding: 0 !important;
    margin-right: 2px !important;
    background: var(--st-foreground-primary) !important;
    color: var(--st-background-tertiary) !important;
    font-family: var(--st-font-family-secondary) !important;
    font-weight: 700 !important;
    border-radius: calc(var(--st-border-radius) * 0.5) !important;
}

.k-scheduler .k-event {border-radius: calc(var(--st-border-radius) * 0.75);}

.endlink a:first-letter {
    text-transform: uppercase
}

.endlink a {
    text-decoration: none;
    translate: -2px -2px
}

.endlink a:hover {
    filter: brightness(var(--st-hover-brightness))
}

.widget .endlink a:after {
    content: '⏵';
    font-size: 16px;
    position: relative;
    top: 1px;
    left: 2px
}

.menu-footer, .afsprakenlijst-container .main>.content-container {
    background-color: transparent;
    border-color: var(--st-border-color);
    border-top: none;
}

.menu-footer:hover {
    background-color: color-mix(in srgb, var(--st-foreground-primary), transparent 90%)
}

.appbar>div>a:not(.st-metric),
a.appbar-button,
.menu-host {
    background-color: var(--st-side-background);
    transition: background-color 200ms, width 200ms, min-width 200ms;
}

.appbar-host {
    background-color: var(--st-appbar-background);
}

aside, aside .block,
.main-menu>li.active>a,
.opdracht-versions ul li,
.main-menu>li>a,
.main-menu li.children li.submenu>a,
.main-menu>li.active>a, .main-menu>li>a:hover {
    border-radius: var(--st-border-radius);
}

.main-menu>li.active>a, .main-menu>li.active>a:hover {
    background-color: color-mix(in srgb, var(--st-foreground-primary), transparent 85%);
}

.main-menu>li>a:hover {
    background-color: color-mix(in srgb, var(--st-foreground-primary), transparent 90%);
}

.main-menu>li.children.expanded>a, .main-menu>li.children.expanded>a:hover {
    background-color: color-mix(in srgb, var(--st-foreground-primary), transparent 90%);
}

.main-menu li.children li.submenu {
    width: auto;
    margin-left: -10px;
}

.main-menu li.children li.submenu>a {
    padding-left: 10px;
}

.main-menu li.children li.submenu.active>a, .main-menu li.children li.submenu.active>a:hover {
    background-color: color-mix(in srgb, var(--st-foreground-primary), transparent 85%);
    font-weight: normal;
}

.main-menu li.children li.submenu>a:hover {
    background-color: color-mix(in srgb, var(--st-foreground-primary), transparent 90%);
}

.main-menu li.children>a::after {
    content: '';
    transition: transform 200ms, translate 200ms;
}

.main-menu li.children:active>a::after {
    translate: 0 6px;
}

.main-menu li.expanded>a::after {
    transform: scaleY(-1);
}

.main-menu li.expanded:active>a::after {
    translate: 0 -6px;
}

.alert-toast:before {
    background-color: var(--st-accent-warn);
}

.alert-toast, .alert-toast i {
    border-color: var(--st-accent-warn);
}

.cijfers-k-grid.k-grid .grade {
    box-shadow: inset -0.5px 0 0 0 transparent;
    user-select: none;
    transition: box-shadow 200ms, color 200ms, opacity 200ms;
}

.cijfers-k-grid.k-grid .k-grid-header th.k-header, .cijfers-k-grid.k-grid .grade.herkansingKolom, .cijfers-k-grid.k-grid .k-grid-content tr td span, .cijfers-k-grid.k-grid .grade.eloopdracht, .column-container .rest-column, .column-container .first-column {
    background-color: var(--st-background-secondary) !important;
}

.cijfers-k-grid.k-grid .grade.empty {
    background: var(--st-background-tertiary) !important;
}

.cijfers-k-grid.k-grid .k-grid-content, .cijfers-k-grid.k-grid .k-grid-content tr, .cijfers-k-grid.k-grid .k-grid-content tr.k-alt {
    background: transparent;
}

.cijfers-k-grid.k-grid .grade.herkansingKolom.heeftonderliggendekolommen, .cijfers-k-grid.k-grid .grade.vrijstellingcolumn {
    background-color: var(--st-highlight-subtle) !important;
    color: var(--st-foreground-primary) !important;
    font-weight: normal;
}

.cijfers-k-grid.k-grid .grade.gemiddeldecolumn {
    background-color: var(--st-accent-primary) !important;
    color: var(--st-contrast-accent) !important;
    font-weight: bold;
}

.cijfers-k-grid.k-grid .k-selectable .k-state-selected .grade {
    outline: 2px solid var(--st-accent-primary) !important;
    outline-offset: -2px;
    width: 40px;
    padding-left: 0;
    color: var(--st-foreground-primary);
    filter: brightness(var(--st-hover-brightness));
}

.cijfers-k-grid.k-grid .grade .herkansing-icon {
    visibility: hidden;
    width: 0;
    top: 0;
}

.cijfers-k-grid.k-grid .grade .herkansing-icon:after {
    position: absolute;
    top: 3px;
    left: 3px;
    content: '';
    color: var(--st-foreground-accent);
    font: bold 6px "Font Awesome 6 Pro";
    visibility: visible;
}

.cijfers-k-grid.k-grid .grade.st-cannot-add {
    box-shadow: inset -0.5px 0 0 4px var(--st-accent-warn) !important;
    color: var(--st-accent-warn) !important;
    opacity: 0.5 !important;
}

.dvd-screensaver {
    position: absolute;
    translate: -90px -30px;
    background: #0000ff;
    padding: 16px;
    z-index: 1000;
    animation: moveX 4s linear 0s infinite alternate, moveY 6.8s linear 0s infinite alternate, rainbow 5s linear 0s infinite;
}

.sidecolumn aside .head-bar,
.k-calendar tbody tr td {
    padding: 0;
}

.sidecolumn section.main {
    padding-bottom: 0 !important
}

@media (width <= 800px) {
    .sidecolumn section.main {
        padding-bottom: 330px !important;
    }

    #studiewijzer-container section.main {
        padding-bottom: 0 !important;
    }

    .subtitle aside, .sidecolumn aside {
        top: auto !important;
        left: 23px;
        margin-top: 0;
    }

    .sidecolumn aside .head-bar {
        right: 0 !important;
        left: 0 !important;
        top: 0 !important;
    }

    .sidecolumn aside .head-bar .asideTrigger {
        border: none;
        background-color: transparent;
    }

    .sidecolumn aside .tabs li.active:after {
        top: 0 !important;
    }
}

.k-calendar tbody tr td {
    height: 30px;
}

.k-calendar .k-content tbody td.k-today a, .k-calendar .k-content .k-link {
    margin-left: 0;
    padding: 0;
}

td#calendar_cell_selected {
    background-color: var(--st-accent-primary) !important;
    border-color: var(--st-accent-primary) !important;
}

td#calendar_cell_selected>a {
    color: #fff !important;
}

td.k-other-month {
    background-image: none !important;
}

td.k-other-month a {
    opacity: .3;
}

aside .tabs {
    display: flex;
}

aside .tabs li {
    width: auto;
    flex-shrink: 1;
    flex-grow: 1;
}

aside .tabs li.active, aside .tabs li:hover {
    border: none;
    font-weight: 400;
}

aside .tabs li:after {
  content: '';
  display: block;
  margin-top: 38px;
  top: 0;
  left: 50%;
  translate: -50% 1px;
  height: 0px;
  width: 0px;
  background: var(--st-accent-primary);
  border-radius: 3px 3px 0 0;
  transition: width 200ms ease, height 200ms ease, translate 200ms ease;
}

aside .tabs li:hover:after {
  width: 20px;
  height: 3px;
  translate: -50%;
}

aside .tabs li.active:after,
aside .tabs:has(li.st-tab.active) li.st-tab.active:after {
  width: calc(100% - 24px);
  height: 3px;
  translate: -50%;
}

aside .tabs:has(li.st-tab.active) li.active:after {
    width: 0;
    height: 0;
    translate: -50% 1px;
}

aside .tabs li a, aside .tabs li.double-line-title>a {
    height: 40px;
    margin-top: 0;
    padding-block: 0;
    padding-inline: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: normal;
    text-wrap: balance;
    overflow-wrap: break-word;
    text-overflow: ellipsis;
}

.menu-footer>a>i {
    margin-right: 0;
    padding: 0;
    width: 18px;
    color: currentcolor;
}

.menu-footer>a {
    display: flex;
    height: 100%;
    width: 100%;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding-left: 22px;
}

.collapsed-menu .menu-footer i {
    transform: scaleX(-1);
}

.menu-host {
    display: flex !important;
    flex-direction: column;
}

.menu-host .logo {
    position: static !important;
    margin-left: 16px;
    margin-top: 32px;
    margin-bottom: 12px;
}

.menu-host .logo a .logo-collapsed {
    margin-left: -12px;
}

.menu-host .menu {
    position: static !important;
    padding-bottom: 0 !important;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    max-height: calc(100vh - 84px);
    font-family: var(--st-font-family-secondary);
}

.menu-host .menu .menu-container {
    height: max-content !important;
    max-height: 100%;
}

.menu-host .menu-footer {
    position: static !important;
}

dna-card-title.disabled {
    color: var(--st-foreground-primary) !important;
}

dna-card {
    --box-shadow: 0 2px 4px 0 rgba(var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-alpha)) !important;
}

.container > dna-breadcrumbs, .container dna-breadcrumbs, .container > dna-page-header, .container dna-page-header, dna-button-group, dna-button, :host, :host([default]), ::slotted(a[href]), dna-breadcrumbs > dna-breadcrumb > a {
    --title-color: var(--st-foreground-accent);
    --title-font: var(--st-font-hero) !important;
    --subtitle-font: var(--st-font-family-secondary) !important;
    --color: var(--st-foreground-accent);
    --background: var(--st-foreground-accent);
    --dna-text-color: var(--st-foreground-accent);
    --dna-font-family-base: var(--st-font-family-secondary) !important;
    --dna-font-family-header: var(--st-font-family-secondary) !important
    --separator-color: var(--st-foreground-accent);
    --background-secondary: var(--st-foreground-accent);
    --radius: calc(var(--st-border-radius) * 0.75);
    font-family: var(--st-font-family-secondary) !important;
}

dna-button {
    --_color: var(--st-foreground-accent);
    --color: var(--_color);
    --_background: var(--st-background-secondary);
    --background: var(--_background);
    --_border-width: 1px;
    --border-width: var(--_border-width);
    --_border-color: var(--st-accent-primary);
    --border-color: var(--_border-color);

    &[variant=primary] {
        --_color: var(--st-contrast-accent);
        --_background: var(--st-accent-primary);
    }

    &[fill=clear] {
        --_background: transparent;
        --_border-color: transparent;
    }

    &:hover {
        filter: brightness(var(--st-hover-brightness));
    }
}

dna-breadcrumbs > dna-breadcrumb > a,
.podium header h1 {
    --color: var(--st-foreground-accent) !important;
}

dna-card-title.ng-binding, dna-card-title, .content.content-auto.background-white, .opdrachten-details-row, .gegevens-container, .empty-message, .label, .capitalize.ng-binding, .examen-cijfer.ng-binding {
    color: var(--st-foreground-primary);
}

dna-card-title {
    font: 500 16px/24px var(--st-font-family-primary);
}

dna-page-header span[slot=subtitle] {
    font: 14px var(--st-font-family-secondary);
}

.overdue,.overdue *{color:grey!important}

.studiewijzer-onderdeel div.fold div.content {
    height: auto;
    overflow: hidden !important;
    opacity: 0;
}

.content.content-auto {
    grid-template-rows: 1fr;
    display: grid;
    overflow: hidden !important;
    transition: grid-template-rows 200ms, opacity 200ms;
}

.content.content-auto>* {
    overflow: hidden !important;
}

.fold .content.content-auto {
    grid-template-rows: 0fr;
}

.clearfix.user-content {
    transition: padding 200ms;
}

.fold .clearfix.user-content {
    padding-block: 0 !important;
}

.block h3 strong, .block h3 strong.ng-hide:not(.ng-hide-animate) {
    line-height: 25px;
    min-height: 0;
    max-height: 0;
    display: block !important;
    overflow: hidden !important;
    transition: min-height 200ms, max-height 200ms;
}

.fold h3 strong {
    line-height: 25px;
    min-height: 35px;
    max-height: 35px;
}

#studiewijzer-detail-container .content {
    min-height: 0;
}

footer.endlink {
    display: none;
}

.studiewijzer-onderdeel .block.ng-scope {
    overflow: hidden !important;
    transition: box-shadow 200ms, margin 200ms;
}

.sources>li {
    max-height: 39px;
    transition: max-height 200ms;
}

.sources>li:has(div>ul) {
    max-height: none;
}

.fold .sources>li, .fold .sources>li:has(div>ul) {
    max-height: 0;
    border-top: none !important;
}

.icon-up-arrow:before, .icon-down-arrow:before, .k-calendar .k-header .k-i-arrow-w:after, .k-calendar .k-header .k-i-arrow-e:after {
    content: '' !important;
    font: 400 24px/44px "Font Awesome 6 Pro" !important;
    transition: transform 200ms, rotate 200ms, translate 200ms;
}

#profiel-container .icon-up-arrow:before, #profiel-container .icon-down-arrow:before {
    rotate: 180deg;
}

.icon-down-arrow:before {
    transform: rotateX(180deg);
}

.icon-up-arrow.prev:before, .k-calendar .k-header .k-i-arrow-w:after {
    rotate: -90deg;
}

.icon-up-arrow.next:before, .k-calendar .k-header .k-i-arrow-e:after {
    rotate: 90deg;
}

h3:active > .icon-up-arrow:before, #profiel-container h3:active > .icon-down-arrow:before {
    translate: 0 -6px;
}

h3:active > .icon-down-arrow:before, #profiel-container h3:active > .icon-up-arrow:before {
    translate: 0 6px;
}

.icon-up-arrow.prev:active:before, .k-calendar .k-header .k-i-arrow-w:active:after {
    translate: -6px 0;
}

.icon-up-arrow.next:active:before, .k-calendar .k-header .k-i-arrow-e:active:after {
    translate: 6px 0;
}

.k-calendar .k-header .k-i-arrow-e:after, .k-calendar .k-header .k-i-arrow-w:after {
    border: none !important;
    height: auto !important;
    width: auto !important;
    top: -5px !important;
    left: -20px !important;
}

.k-calendar .k-header .k-i-arrow-w:after {
    left: 14px !important;
}

.k-calendar .k-header .k-link.k-nav-prev, .k-calendar .k-header .k-link.k-nav-next {
    height: auto !important;
    width: auto !important;
}

.block.fold.disabled {
    opacity: .3;
    pointer-events: none;
}

.main .widget.wide {
    padding-right: 0px;
}

#agenda-section .content-container {
    padding: 8px;
}

.studiewijzer-onderdeel .block:not(.fold) {
    box-shadow: 0 0 8px 0 rgba(var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-value), var(--st-shadow-alpha));
    margin-block: 8px;
}

#studiewijzer-detail-container .content-container.widget-container.studiewijzer-content-container {
    border: none !important;
    padding: 8px 0 0 8px !important;
    margin-left: -8px;
    margin-top: -8px;
    max-width: none;
    width: calc(100% + 8px);
    max-height: none;
    height: calc(100% + 8px);
}

.table-block {
    background-color: transparent !important;
}

#leermiddelen-container tr[data-ng-repeat="leermiddel in items"] td {
    position: relative;
}

table.table-grid-layout>tbody>tr.selected::after {
    content: none;
}

table.table-grid-layout>tbody>tr.selected {
    filter: brightness(var(--st-hover-brightness));
    box-shadow: none;
}

#examen-resultaten-widget dna-card {
    --color: var(--st-foreground-primary);
}

.examen-widget {
    font: 12px var(--st-font-family-secondary);
}

.kwt-widget table {
    display: block;
}

.kwt-widget tbody {
    display: flex;
    flex-direction: column-reverse;
    gap: 1px;
    min-width: 100%;
    width: 100%;
    max-width: 100%;
    background-color: var(--st-border-color);
}

.kwt-widget thead {
    display: none;
}

.kwt-widget tbody>tr {
    display: grid;
    grid-template:
        'check title title' auto
        'check teacher classroom' auto
        'check description description' auto
        / 40px auto 1fr;
    padding-block: 4px;
    background-color: var(--st-background-primary);
    color: var(--st-foreground-primary);
}

.kwt-widget tr td {
    display: inline;
    width: auto;
    height: auto;
    padding-right: 0 !important;
    border: none !important;
    line-height: normal;
    background-color: transparent !important;
}

.kwt-widget tr td:first-child {
    position: relative;
    grid-area: check;
}

.kwt-widget tr td:first-child:after {
    content: '';
    position: absolute;
    top: 6px;
    left: 16px;
    font-family: 'Font Awesome 6 Pro';
    font-size: 18px;
    line-height: 100%;
    font-style: normal;
}

.kwt-widget  tr td:first-child .icon-oke {
    display: none;
}

.kwt-widget tr:has(.icon-oke) {
    order: 1;
    background-color: var(--st-highlight-primary) !important;
}

.kwt-widget tr td:first-child:has(.icon-oke):after {
    content: '';
}

.kwt-widget tr td:first-child .disabled-message {
    font-size: 0;
}

.kwt-widget tr.disabled td:first-child .disabled-message:after {
    content: '';
    position: absolute;
    top: 6px;
    left: 11px;
    font-family: 'Font Awesome 6 Pro';
    font-size: 18px;
    line-height: 100%;
    z-index: 2;
}

.kwt-widget tr td:nth-child(2) {
    grid-area: classroom;
}

.kwt-widget tr td:nth-child(2):before {
    content: '(';
}

.kwt-widget tr td:nth-child(2):after {
    content: ')';
}

.kwt-widget tr td:nth-child(3) {
    grid-area: title;
    font: var(--st-font-primary);
    font-size: 14px;
    line-height: normal;
}

.kwt-widget tr td:nth-child(4) {
    grid-area: teacher;
}

.kwt-widget tr td:nth-child(5) {
    grid-area: description;
}

.appbar .menu-button {
    flex: 36px 0 0;
}

.menu-button:has(#help-menu) {
    overflow: hidden;
    max-height: 0;
    margin-bottom: 0;
    transition: max-height 200ms, margin-bottom 200ms;
}

.appbar:has(.user-menu) .menu-button:has(#help-menu) {
    max-height: 50px;
    margin-bottom: 16px;
}

.menu-button:has(#help-menu):has(.user-menu) {
    overflow: visible;
}

.menu-button a:focus-visible, .logo a:focus-visible {
    outline: 2px solid var(--st-foreground-primary);
}

#menu-cijfers {
    img {
        display: none;
    }
    
    &:before {
        margin-inline: 10px;
        width: 20px;
        height: 20px;
        content: '';
        background-color: currentcolor;
        mask: url(assets/images/cijfers.svg) no-repeat center;
    }
}

.app-container {
    display: flex;
    justify-content: stretch;
    align-items: stretch;

    &>.challenge-container {
        flex: 50% 1 1;
        display: flex;
        flex-direction: column;
        align-items: stretch;

        color: var(--st-foreground-primary);

        &>header {
            flex: 64px 0 0;
            height: auto;
        }
        
        &>.podium_container {
            min-height: 0;
            flex: 100% 1 1;
            width: auto;
        }
        
        &>footer {
            flex: 60px 0 0;
            height: auto;
            width: auto;

            background-color: var(--st-background-secondary);
            color: var(--st-foreground-primary);
            overflow: hidden;
            container-type: size;

            &>* {
                flex-shrink: 0;
            }

            &>.bottom-conditions {
                margin-right: 0;
            }

            &>.bottom-company-logo {
                margin-left: auto;

                @container (width < 660px) {
                    width: 14px;
                    overflow: hidden;
                }

                @container (width < 545px) {
                    display: none;
                }
            }

            &>.bottom-green dna-icon, .bottom-green-mobile dna-icon {
                color: var(--st-foreground-accent);
            }
        }
    }
    
    &>.challenge-container+div {
        flex: 50% 1 1;
        position: relative;
        display: block;
    
        &>.splash-container {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
        }
            
        @media (width <= 1150px) {
            display: none;
        }
    }
}

.podium .completed-challenge {
    background-color: var(--st-background-tertiary);
}

.podium .dna-input-group {
    background-color: var(--st-background-secondary);
    border: var(--st-border);
}

.podium .dna-input-group:hover {
    border-color: var(--st-foreground-accent);
}

.podium .dna-input-group-prefix {
    color: var(--st-foreground-accent);
}

.podium h1 {
    color: var(--st-foreground-accent);
    font-family: var(--st-font-family-primary);
    margin-bottom: 6px;
}

.podium h2 {
    font-family: var(--st-font-family-primary);
    font-weight: 500;
    margin-top: 6px;
}

.podium button {
    background-color: var(--st-accent-primary);
    color: var(--st-contrast-accent);
}

.podium button:hover {
    background-color: var(--st-accent-primary);
    filter: brightness(var(--st-hover-brightness));
}

.podium input {
    color: var(--st-foreground-primary) !important;
}

.animation-container-loading {
    position: fixed;
    inset: 0;

    display: flex !important;
    background-color: var(--st-background-transparent);
    opacity: 1;
    backdrop-filter: blur(3px);
    z-index: 10001;
}

.animation-container-loading.ng-cloak {
    display: flex !important;
    opacity: 0;
    backdrop-filter: none;
    pointer-events: none;
    transition: opacity 400ms, backdrop-filter 400ms;
}

.container.ng-cloak {
    display: flex !important;
}

.loading-animation {
    width: 96px;
    content: url("https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/load-animation.svg");
}

.shell-blocker {
    background-color: var(--st-background-overlay) !important;
}
`, 'study-tools')

    if (Math.random() < 0.003) createStyle(`span.st-title:after { content: '🧡' !important; font-size: 9px !important; margin-bottom: -100%; }`, 'study-tools-easter-egg')

    if (syncedStorage['start-enabled']) {
        createStyle(`
#vandaag-container .main .content-container, #vandaag-container dna-page-header {
    display: none !important;
} 

#vandaag-container .main {
    padding-top: 85px !important;
}

.container:has(#vandaag-container) {
    padding-right: 0 !important;
}
`, 'study-tools-start-overhaul')
    } else { createStyle('', 'study-tools-start-overhaul') }

    if (syncedStorage['sw-enabled']) {
        createStyle(`
#studiewijzer-container {
    height: auto !important;
}

#studiewijzer-container section.main {
    padding-top: 125px;
}

#studiewijzer-container aside,
#studiewijzer-container .content-container,
#studiewijzer-detail-container .widget.full-height .block {
    display: none !important;
}

#studiewijzer-container {
    padding-right: 8px
}`, 'study-tools-sw-grid')
    } else { createStyle('', 'study-tools-sw-grid') }

    if (syncedStorage['cs']) {
        createStyle(`
#cijfers-container.subtitle .main {
    padding-top: 125px !important;
}

#cijfers-container.subtitle aside {
    margin-top: -29px;
}

#cijfers-container .main div.content-container-cijfers {
    width: 100% !important;
    max-width: none !important;
}
`, 'study-tools-cs')
    } else { createStyle('', 'study-tools-cs') }

    if (syncedStorage['insuf-red']) {
        let insufArray = []
        for (let i = 1.0; i < Number(syncedStorage['suf-threshold']) - 0.005; i += 0.1) {
            insufArray.push(parseFloat(i.toFixed(1)))
        }
        createStyle(`
${insufArray.map(x => `.grade.grade.grade.grade[title^="${x.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}"]`).join(',')} {
    color: var(--st-accent-warn) !important;
    font-weight: 700;
}

.grade.grade.grade.grade[title^="10,0"] {
    color: var(--st-accent-ok) !important;
    font-weight: 700;
}`, 'study-tools-insuf-red')
    } else { createStyle('', 'study-tools-insuf-red') }

    if (syncedStorage['magister-picture'] === 'custom' && syncedStorage['magister-picture-source']?.length > 10) {
        createStyle(`.menu-button figure img,.photo.photo-high img{content: url("${syncedStorage['magister-picture-source']}")}`, 'study-tools-pfp')
    } else if (syncedStorage['magister-picture'] !== 'show') {
        createStyle(`.menu-button figure img,.photo.photo-high img{display: none}`, 'study-tools-pfp')
    } else { createStyle('', 'study-tools-pfp') }

    if (syncedStorage['custom-css'] || syncedStorage['custom-css2']) {
        createStyle(((syncedStorage['custom-css'] ?? '') + (syncedStorage['custom-css2'] ?? '')), 'study-tools-custom-css')

        function extractVariables(inputString) {
            const regex = /var\(--st-reference-(\w+)-([^\s)]+)\)/g
            let matches
            let result = []

            while ((matches = regex.exec(inputString)) !== null) {
                const property = matches[1]
                const selector = matches[2]?.replace(/\\+/gi, '')
                const variable = `--st-reference-${property}-${selector}`
                result.push({ variable, property, selector })
            }

            return result
        }

        updateSteps = []
        extractVariables(((syncedStorage['custom-css'] ?? '') + (syncedStorage['custom-css2'] ?? ''))).forEach(({ variable, property, selector }) => {
            document.querySelector(selector.replace(/\_/gi, ' ')).addEventListener('mouseup', update)
            updateSteps.push(() => document.querySelector(':root').style.setProperty(variable, document.querySelector(selector.replace(/\_/gi, ' '))[property === 'width' ? 'offsetWidth' : 'offsetHeight'] + 'px'))
        })
        if (getComputedStyle(document.body).getPropertyValue('--st-menu-collapse') === 'disallow') {
            updateSteps.push(() => document.querySelector('.collapsed-menu')?.classList.remove('collapsed-menu'))
            if (await awaitElement('.menu-host')) new MutationObserver(update).observe(document.querySelector('.menu-host'), { attributes: true })
        }

        let interval = setIntervalImmediately(update, 25)
        setTimeout(() => clearInterval(interval), 3000)
        window.addEventListener('resize', update)
        function update() {
            updateSteps.forEach(x => x())
        }
    } else {
        createStyle('', 'study-tools-custom-css')
    }
}

popstate()
window.addEventListener('popstate', popstate)
async function popstate() {
    const frame = await awaitElement?.('.view iframe', false, 4000, true)
    if (!frame) return

    const iframeStyleInject = document.querySelector('#study-tools-vars').innerHTML +
        `
${currentTheme[0] === 'dark' ? '.no-selection-container object, .no-messages-container object { opacity: .75; filter: invert(1) hue-rotate(180deg) contrast(.86); }' : ''}

*, html, body, :root, :host, html *, body *, :root *, :host * {
    --dna-primary: var(--st-accent-primary) !important;
    --primary: var(--st-accent-primary) !important;
    --background: var(--st-background-secondary) !important;
    --title-color: var(--st-foreground-accent) !important;
    --title-font: var(--st-font-hero) !important;
    --separator-color: var(--st-foreground-accent) !important;
    --dna-background: var(--st-background-primary) !important;
    --dna-text-color-dark: var(--st-foreground-primary) !important;
    --dna-control-border: var(--st-border-color) !important;
    --backdrop-dark: var(--st-background-overlay) !important;
    --backdrop-light: var(--st-background-overlay) !important;
}

body, .nieuw-bericht-container, .header, cdk-virtual-scroll-viewport .cdk-virtual-scroll-content-wrapper {
    background-color: transparent !important;
    color: var(--st-foreground-primary);
}

app-bericht-details, .dna-cell, .dna-header-cell, .dna-footer-cell {
    background-color: var(--st-background-secondary) !important;
    border-color: var(--st-border-color) !important;
}

app-bericht-details, html:root body dna-search-input {
    border-radius: var(--st-border-radius) !important;
}

.dna-header-cell {
    background-color: var(--st-background-tertiary) !important;
    border-color: var(--st-border-color) !important;
}

dna-button-group, dna-button, :host, :host([default]), ::slotted(a[href]), dna-breadcrumbs > dna-breadcrumb > a {
    --primary: var(--st-foreground-accent) !important;
    --title-color: var(--st-foreground-accent);
    --title-font: var(--st-font-hero);
    --color: var(--st-foreground-accent);
    --background: var(--st-foreground-accent);
    --dna-text-color: var(--st-foreground-accent);
    --separator-color: var(--st-foreground-accent) !important;
    --background-secondary: var(--st-foreground-accent);
    --radius: var(--st-border-radius);
}

.separator, dna-breadcrumbs .separator, dna-breadcrumbs .separator svg, .separator svg.svg-inline--fa.fa-w-10, .svg-inline--fa.fa-w-10 {
    color: var(--st-foreground-accent) !important;
    fill: var(--st-foreground-accent) !important;
}

dna-button[fill=solid] {
    --color: var(--st-contrast-accent) !important;
    --background: var(--st-accent-primary) !important;
    border-color: var(--st-accent-primary) !important;
}

dna-button[fill=outline] {
    --color: var(--st-foreground-primary) !important;
    --background: transparent !important;
    border: 1px solid var(--st-accent-primary) !important;
}

html:root body dna-breadcrumbs, html:root body .action-buttons, .action-buttons * {
    --dna-primary: var(--st-foreground-accent) !important;
    --color: var(--st-foreground-accent) !important;
    --primary: var(--st-foreground-accent) !important;
}

html:root body dna-search-input, html:root body dna-card, html:root body app-logbook-item {
    --background: var(--st-background-secondary) !important;
    --border-color: var(--st-border-color) !important;
}

html:root body dna-card, html:root body dna-card *, html:root body app-logbook-item {
    color: var(--st-foreground-primary) !important;
}

.bericht-item, .dna-tree, .dna-tree-node, .dna-input-group, .dna-text-input, dna-editor, .dna-editor {
    background-color: var(--st-background-secondary) !important;
    color: var(--st-foreground-primary);
    border-color: var(--st-border-color) !important;
}

.container, .folders-container, #berichtenlijst, app-bericht-list, dna-file-preview, .recipients {
    border-color: var(--st-border-color) !important;
}

.dna-tree, .dna-tree-node, .folderName-container, .folderName-container * {
    background-color: transparent !important;
    color: var(--st-foreground-primary) !important;
}

.dna-tree-selectable .dna-tree-node-wrapper:hover, .dna-tree-selectable .dna-tree-node-selected, .dna-tree-selectable .dna-tree-node-selected:hover, .bericht-item.active, .bericht-item:hover {
    background-color: var(--st-highlight-primary) !important;
    color: var(--st-foreground-primary) !important;
}

h2 {
    color: var(--st-foreground-primary) !important;
}

.bijlagen a {
    color: var(--st-foreground-accent) !important;
}
            `

    let interval = setIntervalImmediately(async () => {
        if (!frame) {
            frame = await awaitElement('.view iframe', false, 500, true)
        }
        if (!(frame?.contentDocument?.head || frame?.contentDocument?.querySelector('head'))) {
            frame.classList.remove('st-approve')
            return
        }
        if (!frame.contentDocument.querySelector('#study-tools-iframe-style-inject')) {
            element('style', 'study-tools-iframe-style-inject', frame.contentDocument.head || frame.contentDocument.querySelector('head'), { innerHTML: iframeStyleInject })
            frame.classList.add('st-approve')
        }
    }, 50)
    setTimeout(() => clearInterval(interval), 5000)
}

async function handleSpecialTheme(type, customCss, customTheme, customColor) {
    if ((await getFromStorage('no-special-decorations', 'session') ?? '') === type) return
    const decoration = createStyle(customCss ||
        `nav.menu.ng-scope {
            background-image: url("https://raw.githubusercontent.com/QkeleQ10/http-resources/main/study-tools/decorations/${type}.svg");
            background-size: 240px 480px;
            background-position: bottom center;
            background-repeat: no-repeat;
        }`, `st-special-decoration`)
    if (customTheme && customColor) applyStyles(true, customTheme, customColor)
    const disableButton = element('button', 'st-decoration-disable', document.body, { class: 'st-button text', innerText: "Speciaal thema..." })
    disableButton.addEventListener('click', () => {
        if (document.querySelector('.st-dialog')) return
        notify('dialog', `Magister ziet er vandaag anders uit vanwege een speciale gelegenheid ('${type}').\n\nJe kunt dit speciale thema uitschakelen. Hierna verschijnt het niet meer totdat je je browser opnieuw opent.`, [{
            innerText: "Thema uitschakelen", callback: () => {
                decoration.remove()
                applyStyles(true)
                disableButton.remove()
                saveToStorage('no-special-decorations', type, 'session')
                if (Math.random() < 0.3) notify('snackbar', `Oké ${type === 'christmas' ? 'grinch' : 'loser'}`)
                document.querySelector('.st-dialog-dismiss').click()
            }, 'data-icon': ''
        }], null, { closeIcon: '', closeText: "Thema behouden", primary: true })
    })
}
