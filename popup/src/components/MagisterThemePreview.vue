<script setup>
import { computed, inject, defineProps } from 'vue'

const props = defineProps(['preset'])

const syncedStorage = inject('syncedStorage')

const preset = props.preset || syncedStorage.value

const style = computed(() => {
    let accentColor = (preset['ptheme'] || 'auto,207,95,55')?.split(',')
    let pageColor = preset['pagecolor']?.startsWith('true')
        ? `hsl(${preset['pagecolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    let appbarColor = preset['appbarcolor']?.startsWith('true')
        ? `hsl(${preset['appbarcolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    let menubarColor = preset['sidecolor']?.startsWith('true')
        ? `hsl(${preset['sidecolor'].replace('true,', '').replace(/,/gi, ' ')})`
        : null
    let wallpaper = preset['wallpaper']?.startsWith('custom')
        ? `linear-gradient(color-mix(in srgb, var(--page), transparent 20%), color-mix(in srgb, var(--page), transparent 20%)), url(${preset['wallpaper'].replace('custom,', '')})`
        : 'none'
    let decoration = preset['decoration']?.startsWith('custom')
        ? `url(${preset['decoration'].replace('custom,', '')})`
        : 'none'
    accentColor?.shift()
    return {
        '--color-scheme': preset['ptheme']?.split(',')?.[0] || 'auto',
        '--page': pageColor || `light-dark(#ffffff, #111111)`,
        '--wallpaper': wallpaper,
        '--appbar': appbarColor || `light-dark(${shiftedHslColor(207, 95, 47, ...accentColor)}, ${shiftedHslColor(207, 73, 22, ...accentColor)})`,
        '--menubar': menubarColor || `light-dark(${shiftedHslColor(207, 95, 55, ...accentColor)}, ${shiftedHslColor(207, 73, 30, ...accentColor)})`,
        '--decoration': decoration,
        '--sidebar': `light-dark(#ffffffaa, #0c0c0caa)`,
        '--foreground-accent': `light-dark(${shiftedHslColor(207, 78, 43, ...accentColor)}, ${shiftedHslColor(207, 53, 55, ...accentColor)})`,
        '--border': `light-dark(#dfdfdfaa, #2e2e2eaa)`,
        '--border-radius': (preset['shape'] ?? 8) + 'px',
        '--accent-1': `light-dark(${shiftedHslColor(207, 95, 55, ...accentColor)}, ${shiftedHslColor(207, 73, 30, ...accentColor)})`,
        '--accent-2': `light-dark(${shiftedHslColor(207, 95, 47, ...accentColor)}, ${shiftedHslColor(207, 73, 22, ...accentColor)})`,
    }
})

function shiftedHslColor(hueOriginal = 207, saturationOriginal = 95, luminanceOriginal = 55, hueWish = 0, saturationWish = 0, luminanceWish = 0, hueForce, saturationForce, luminanceForce) {
    let hue, saturation, luminance

    hueWish = Number(hueWish)
    saturationWish = Number(saturationWish)
    luminanceWish = Number(luminanceWish)

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

const decorations = [
    {
        id: 'none',
        style: {}
    },
    {
        id: 'waves',
        style: {
            'background-image': 'repeating-radial-gradient( circle at 0 0, transparent 0, var(--palette-primary) 19px, transparent 20px ), repeating-linear-gradient( #ffffff11, #ffffff33 )'
        }
    },
    {
        id: 'zig-zag',
        style: {
            'background-image': 'linear-gradient(135deg, #ffffff11 25%, transparent 25%), linear-gradient(225deg, #ffffff11 25%, transparent 25%), linear-gradient(45deg, #ffffff11 25%, transparent 25%), linear-gradient(315deg, #ffffff11 25%, var(--palette-primary) 25%)',
            'background-position': '15px 0, 15px 0, 0 0, 0 0',
            'background-size': '30px 30px',
            'background-repeat': 'repeat'
        }
    },
    {
        id: 'polka-dot',
        style: {
            'background-image': 'radial-gradient(#ffffff11 30%, transparent 31.2%), radial-gradient(#ffffff11 30%, transparent 31.2%)', 'background-position': '0px 0px, 15px 15px', 'background-size': '30px 30px'
        }
    },
    {
        id: 'stripes',
        style: {
            'background-image': 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff0a 10px, #ffffff22 20px)'
        }
    },
    {
        id: 'lego',
        style: {
            'background-size': '150px',
            'background-position': '14px 14px',
            'background-image': `url('data:image/svg+xml,<%3Fxml version="1.0" encoding="UTF-8"%3F><svg fill="none" viewBox="0 0 168 238" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(%23b)"><path d="m139.5-13.5h-13v41h13v-41zm1 41v-13h27v27h-13-14v-14zm28 14v-27h13.5 0.5v-15h-0.5l-41.5-2e-6v-14h-0.5-14-0.5v14h-13l-0.5-1e-6h-0.5l-13 1e-6v-14h-0.5-14-0.5-13.5-0.5v14l-55-3e-6v-14h-0.5-42-0.5v0.5 28 0.5h0.5 27.5v28 41h-14v0.5 28 0.5h14l-4e-6 55h-42v15h42v41h-28v0.5 28 0.5h43v-14h27 1 27v14h28.5 14 0.5v-0.5-13.5h13v27.5 0.5h0.5 14 0.5v-0.5-27.5h28v-56h14v-15h-14v-55h13.5 0.5v-29h-0.5-13.5v-41-1zm-168-27v13h13v-13h-13zm14 0v13h41 1 13v-27l-55-3e-6v13 1zm-1-15v-13h-41v27h27 0.5 13.5v-13.5-0.5zm127 14v-13l41 2e-6v13h-13-0.5-27.5zm27 224v-13h-27v13h27zm0-14v-13h-41v13h41zm-42 0v-13h-27v13h27zm0 14v-13h-13v13h13zm1 1v27h13v-27-14h-13v14zm-15-1v-13h-13v13h13zm-98-70h-13l4e-6 -55h13v27.5 0.5 14 13zm1 0.5v-0.5-13h13v41h-13v-13-1-13-0.5zm-14 14.5h13v13 1 13 0.5 13.5h-13v-41zm-0.5-1h-41.5v-13h41.5 13.5v13h-13.5zm167.5-14v-13h-55v13h55zm-42 1h-55v27h55v-27zm1 14v27h41v-27h-41zm42-1h13v-13h-55v13h42zm-43 15v13h-41v-13h41zm-14 42h-14v-14h-13v27h13.5 13.5v-13zm-41 13h13v-27h-13v27zm13-28h14v-13h-27v13h13zm-14 1v-14h-14-13v27h27v-13zm0-15h14v-13h-27v13h13zm0-27v13h-14-13v-13h27zm-27.5 14h0.5 13v13h-13-28v-13h27.5zm-0.5-15h-13v-27h41v27h-27-1zm29-14h41v-13h-41v13zm97-41h-27v27h27v-27zm-55 0h-14v27h41v-27h-27zm41-14v13h-41v-27h27 14v14zm14.5-1h-13.5v-27h14 13v27h-13-0.5zm-0.5 1v13h-13v-13h13zm-70 28v13h-27v-13h27zm0-14v13h-41v-13h41zm0.5-1h-41.5v-13h28 27v13h-13.5zm-69.5 28h41v-13h-14-27-1-13v13h13 1zm-28.5-42h-0.5-13v-27h13 0.5 13.5v27h-13.5zm14.5 28v-27h13v27h-13zm13-41.5v13.5h-13v-27h13v13.5zm28-14.5h-27v-27h27v27zm1 14v-13h13.5 0.5 13v13h-27zm-15 15h-13v27h27v-14-13h-13-1zm1-14v13h13 28v-13h-27-0.5-0.5-13zm69 13v-27h-27v27h27zm-84-55.5v27.5h-13-1-13v-41h14 13v13.5zm1-13.5v13h27v-13h-27zm28 0v13h27v-27h-13-0.5-0.5-13v13 1zm-43-1v-13h-13v13h13zm1-13h41v13h-28-13v-13zm42 41v-13h27v13h-13-14zm0 1v13h13v-13h-13zm55-1h14v-13h-14-27v13h27zm0-14v-41h-27v14 27h27zm-41 28v-13h13.5 27.5v13h-27-0.5-13.5zm42 0v-13h14 13v27h-27v-14zm-42-83.5v-13.5h13v27h-13v-13.5zm0 27.5v-13h13v13h-13zm41-14v-13h-13.5-0.5v-14h-13v27h27zm1 0.5v27.5h13v-41l-13-1e-6v13.5zm0 41.5v-13h13v13h-13zm14-14v-13h13v41h-13v-28zm27 56h-13v-27-28h13v41 14zm14-55v41h-13v-41h13zm-153 181v-13h27v27h-27v-13-1zm-1 15v-0.5-13.5h-13.5-27.5v27h41v-13zm28-56h-13v13h13v-13zm0-71v-14h0.5 13.5v-13h-27v27h13z" clip-rule="evenodd" fill="WHITE" fill-opacity=".1" fill-rule="evenodd"/><g filter="url(%23a)"><path d="m3 7c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm18 4c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm10-4c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm18 4c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm10-4c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm18 4c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm10-4c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm18 4c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm10-4c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm18 4c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm10-4c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm14 0c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm0 14c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-14-210c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-14-210c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.2091 1.791 4 4 4s4-1.7909 4-4-1.791-4-4-4-4 1.7909-4 4zm4 18c-2.209 0-4-1.7909-4-4s1.791-4 4-4 4 1.7909 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-4 10c0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4-4 1.791-4 4zm4 18c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm-14-210c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-14-210c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-14-210c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm-14-210c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-14-210c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.7909-4-4s1.7909-4 4-4 4 1.7909 4 4-1.7909 4-4 4zm-4 10c0 2.2091 1.7909 4 4 4s4-1.7909 4-4-1.7909-4-4-4-4 1.7909-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4zm4 18c-2.2091 0-4-1.791-4-4s1.7909-4 4-4 4 1.791 4 4-1.7909 4-4 4zm-4 10c0 2.209 1.7909 4 4 4s4-1.791 4-4-1.7909-4-4-4-4 1.791-4 4z" clip-rule="evenodd" fill="WHITE" fill-opacity=".1" fill-rule="evenodd" shape-rendering="crispEdges"/></g></g><defs><filter id="a" x="0" y="0" width="170" height="240" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dx="1" dy="1"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow_13_3"/><feBlend in="SourceGraphic" in2="effect1_dropShadow_13_3" result="shape"/></filter><clipPath id="b"><rect width="168" height="238" fill="WHITE"/></clipPath></defs></svg>')`
        }
    }
]
</script>

<template>
    <div id="theme-preview" :style="{ ...style, ...props.preset?.thumbnailStyle?.body }">
        <div id="appbar" :style="props.preset?.thumbnailStyle?.appbar"></div>
        <div id="menubar"
            :style="{ ...(decorations.find(e => preset['decoration']?.startsWith(e.id))?.style || {}), ...props.preset?.thumbnailStyle?.menubar }">
            <div id="menubar-title" :style="props.preset?.thumbnailStyle?.menubarTitle"></div>
        </div>
        <div id="page" :style="props.preset?.thumbnailStyle?.page">
            <div id="page-title" :style="props.preset?.thumbnailStyle?.pageTitle"></div>
        </div>
        <div id="sidebar" :style="props.preset?.thumbnailStyle?.sidebar">
            <div class="widget" id="widget-grades"
                :style="{ ...props.preset?.thumbnailStyle?.widgetGrades, ...props.preset?.thumbnailStyle?.widget }"></div>
            <div class="widget" :style="props.preset?.thumbnailStyle?.widget"></div>
            <div class="widget" :style="props.preset?.thumbnailStyle?.widget"></div>
        </div>
    </div>
</template>

<style scoped>
* {
    transition: all 200ms;
}

#theme-preview {
    color-scheme: var(--color-scheme);
    display: grid;
    grid-template-columns: 5% 22% 1fr 30%;
    grid-template-rows: 1fr;
    overflow: hidden;

    background-image: var(--wallpaper);
    background-position: center;
    background-size: cover;
    background-color: var(--page);
}

#theme-preview * {
    box-sizing: border-box;
}

#appbar {
    background-color: var(--appbar);
}

#menubar,
#page,
#sidebar {
    padding-inline: 5px;
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 3%;
}

#menubar {
    background-image: var(--decoration);
    background-position: center;
    background-size: cover;
    background-color: var(--menubar);
}

#menubar-title {
    width: 25px;
    height: 5px;
    border-radius: 100vmax;
    background-color: #ffffff88;
}

#page-title {
    width: 50%;
    height: 5px;
    border-radius: 100vmax;
    background-color: var(--foreground-accent);
}

#sidebar {
    padding-top: 5px;
    align-items: stretch;
    border-left: 1px solid var(--border);
    background-color: var(--sidebar);
}

.widget {
    height: 20px;
    border-radius: calc(var(--border-radius)*0.5);
    border: 1px solid var(--border);
    background-color: var(--sidebar);
}

#widget-grades {
    height: 25px;
    background: linear-gradient(35deg, var(--accent-1), var(--accent-2));
}
</style>