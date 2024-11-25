<script setup>
const props = defineProps(['style'])

function normaliseColorComponent(x, a, b) {
    if (x <= b) {
        // First linear function: from 0 < x < b, correlate to 0 < y < a
        return (x / b) * a;
    } else {
        // Second linear function: from b < x < 100, correlate to a < y < 100
        return a + ((x - b) / (100 - b)) * (100 - a);
    }
}

function shiftedHslColor(wishH, wishS, wishL, defaultS, defaultL) {
    return `hsl(${wishH}, ${normaliseColorComponent(wishS, defaultS, 95)}%, ${normaliseColorComponent(wishL, defaultL, 55)}%)`
}
</script>

<template>
    <svg viewBox="0 0 160 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="MagisterThemePreview">
            <rect id="page" width="160" height="90" />
            <rect id="pagewallpaper" width="160" height="90" fill="url(#pageimage)" fill-opacity="0.2" />
            <g>
                <rect id="appbar" width="10.5" height="90" />
            </g>
            <g clip-path="url(#clip1_43_2)">
                <rect id="menubar" width="35" height="90" x="10" />
                <rect class="decoration" id="custom" opacity="0" x="10" width="35" height="90"
                    fill="url(#menubarimage)" />
                <rect class="decoration" id="waves" opacity="0" x="10" width="35" height="90"
                    fill="url(#pattern0_43_2)" />
                <rect class="decoration" id="zigzag" opacity="0" x="10" width="35" height="90"
                    fill="url(#pattern1_43_2)" />
                <rect class="decoration" id="dots" opacity="0" x="10" width="35" height="90"
                    fill="url(#pattern2_43_2)" />
                <rect class="decoration" id="stripes" opacity="0" x="10" width="35" height="90"
                    fill="url(#pattern3_43_2)" />
                <rect class="decoration" id="lego" opacity="0" x="10" width="35" height="90"
                    fill="url(#pattern4_43_2)" />
                <rect id="sitetitle" x="14" y="8" width="21" height="5" rx="2.5" fill="white" />
            </g>
            <rect id="pagetitle" x="49" y="8" width="21" height="5" rx="2.5" />
            <g>
                <rect id="sidebar" width="48" height="90" x="112" />
                <mask id="path-8-inside-1_43_2">
                    <path d="M112 0H160V90H112V0Z" />
                </mask>
                <path id="border" d="M112.5 90V0H111.5V90H112.5Z" mask="url(#path-8-inside-1_43_2)" />
                <g id="widget1">
                    <rect class="widget" x="116" y="8" width="40" height="28" rx="2" fill="url(#widgetgradient)" />
                    <rect class="stroke" x="115.75" y="7.75" width="40.5" height="28.5" rx="2.25" stroke="#DFDFDF"
                        stroke-opacity="0.666667" stroke-width="0.5" />
                </g>
                <g id="widget2">
                    <rect class="widget" x="116" y="39" width="40" height="15" rx="2" />
                    <rect class="stroke" x="115.75" y="38.75" width="40.5" height="15.5" rx="2.25" stroke="#DFDFDF"
                        stroke-opacity="0.666667" stroke-width="0.5" />
                </g>
                <g id="widget3">
                    <rect class="widget" x="116" y="57" width="40" height="15" rx="2" />
                    <rect class="stroke" x="115.75" y="56.75" width="40.5" height="15.5" rx="2.25" stroke="#DFDFDF"
                        stroke-opacity="0.666667" stroke-width="0.5" />
                </g>
            </g>
        </g>
        <defs>
            <pattern id="pageimage" patternContentUnits="objectBoundingBox" width="1" height="1">
                <image :href="style.wallpaperUrl" x="0" y="0" width="1" height="1" />
            </pattern>
            <pattern id="menubarimage" patternContentUnits="objectBoundingBox" width="1" height="1">
                <image :href="style.decorationUrl" x="0" y="0" width="1" height="1" />
            </pattern>
            <pattern id="pattern0_43_2" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlink:href="#image0_43_2" transform="matrix(0.00915099 0 0 0.00355872 -0.00330452 0)" />
            </pattern>
            <pattern id="pattern1_43_2" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlink:href="#image1_43_2" transform="matrix(0.00915099 0 0 0.00355872 -0.00330452 0)" />
            </pattern>
            <pattern id="pattern2_43_2" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlink:href="#image2_43_2" transform="matrix(0.00915099 0 0 0.00355872 -0.00330452 0)" />
            </pattern>
            <pattern id="pattern3_43_2" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlink:href="#image3_43_2" transform="matrix(0.00915099 0 0 0.00355872 -0.00330452 0)" />
            </pattern>
            <pattern id="pattern4_43_2" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlink:href="#image4_43_2" transform="matrix(0.00915099 0 0 0.00355872 -0.00330452 0)" />
            </pattern>
            <linearGradient id="widgetgradient" x1="116" y1="22" x2="156" y2="22" gradientUnits="userSpaceOnUse">
                <stop id="gradientstop1" offset="0%" stop-color="#1F97F9" />
                <stop id="gradientstop2" offset="100%" stop-color="#0683EA" />
            </linearGradient>
            <clipPath id="clip1_43_2">
                <rect width="35" height="90" transform="translate(10)" />
            </clipPath>
            <image id="image0_43_2" data-name="wave.png" width="110" height="281"
                xlink:href="data:image/png;base64,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" />
            <image id="image1_43_2" data-name="zigzag.png" width="110" height="281"
                xlink:href="data:image/png;base64,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" />
            <image id="image2_43_2" data-name="dots.png" width="110" height="281"
                xlink:href="data:image/png;base64,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" />
            <image id="image3_43_2" data-name="stripes.png" width="110" height="281"
                xlink:href="data:image/png;base64,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" />
            <image id="image4_43_2" data-name="lego.png" width="110" height="281"
                xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG4AAAEZCAYAAAB2CxA2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAIn0lEQVR4nO2dv4pbRxjFzzoKCwkGOxhSbWETSOXO7vMEBtfp9F5ecOHa4CJt8gALAT9AXKQ1JJDKJEYpVpIlrbR7Z+b7M2fu+cGy2tXVd2Z07lzd0b2HOVutVq+Qz0MAL9eP3wL4K1h/uf59BeB9sHYV97IbIOpYAPgpuxEAvtl5/AzAv1kNYWEB4El2Iw64yG4AAwsAn7IbseYceW05T9KtZgHgTXYj8OXkJKsty7s36QudnJAi40iRcaTIOFKsjcv8kJ+V9qLx9ccavPu/y8b6pfqHf3vqp2q3jLgpe9ly4nY12lP1R9Le1q01rrRRlp1g07bS36tVY1xtQyw6kKndFaXGMb8BrW1veb25dvR0ILPzQ6F53DS622lkXBymn88lxnW311UwQh8AlBnnPZmOYIQ+ANChMpLanebo62TcNLobqaXGtXag5fWZ2t0ROeIs3rjMN7+rna7GOMY9l9Xwk3VqR1xJYy4Lt7euN4r2Xr2W63GbIrfNjTz39MsZazdfSN0WSmKu2poOsCLjSJFxpMg4UmQcKWer1WqV3Ygdss7U6C73aMSRsgDnV1heKAMufJFxpMg4UmQcKTKOFIurA1mXN+as3WTc1KiRVyfu0t8876Gfrh0Rs7LOyJXWG0V7r15kzCqTEWLGe3UiT04y83EWUMeshsqYMaPpwDS6M13GxaGYVQMj9AGAYla06FAZh2JWCXQ3UqONy0y8DEV0Pi6TobJ9kTGrzHwc8w53lIiYVc32I2lb5uO2tVo+46Y0yDobV1p3NO1t3TPjJVo8r795am8m5rW354X32/qscq55tXBtzeNIkXGkyDhSZBwpCwA/ZzdClLMA4UpO4tq4P7IbAeBrfFk37k/EL/z3JFivmQWA37IbgetlyDbGXSF+jVQ643RyQoqMI0XGkSLjSLGIWQHHb3uL+uJ1ltoey5AdPpcRs+pB20t/CdQbVxM1supEpnaNvou2Ylb+dRSzMqrBqH0DxaxiSM/HzZWuRhsg4yJJi1mJjpBxpMi4OBSzEjJuKt2FRqJjVl1FlQJRzIpQ24WoQ2Vm1MmSGu3uliGb2iCvqNPU7dyWAkvSNlnN6tRSZBGjYlcjWj9TGwAura6AZx//2Q6fzWg6QIqMI0XGkSLjSLE6ObHkGeJDHxt+BPBdknYRPRp3cfcmbtxf/3RPj8Z9StDcZAQ/A/gvQb+YHo37BfExq80k+ndoGTLhiYwjRcaRIuNIsTTOeg0dJv1wbY+YVdRljlNvlHfM6Tb9MO2WETd1D/PYE7O1p9T1GIXbmrXGlTbIsgNM2pb6zTEr03vgZ6DtQnTMKpPsEyfT10dPBzLzcS10t8NqHkeKjIsjLR/X3eGighH6AEDLkNGiQ2Ucyscl0N1IVcyKlMgRxx516mqni8zHZeISdcrUbolZlWxrnY8r1bekC+2W63GnIlZHhRy4TNbGLfru2ha357F+7lDrazpAiowjRcaRIuNIWQB4nN0I7CdkLgA8SGrH9+jj/biTs9VqtcpuhChHh0pSFvgyF3kO4CmuM2Kvg9vxEMDL9eO3iI9ZZfICwCMAHwG8m/oijThSZBwpMo4UGUeKjCPF4upA1qWVnrW99Zctxk2NGgH2ncjULtF301bMqrxWST2PfBwAxawi6CYfN1cyk0bNMSvzBpBod4dG3DS6M13GxaGYVQMj9AGAYla06FAZh2JWCXQ3UqONy0y8DEV0Pi6TobJ9kTEr9mXIaqGNWdVs37N2FzGrls+4KY3yWIqrpK7XSEvXtlqGLIsRDoFV2poOkCLjSJFxpMg4UmQcKT2urTNXHqHgstPuiMtYRUpUohHXD/8AuJq68a5x5ye3EhF8AvBh6sY6OSFFxpEi40iRcaR4xqyivj3P1E/T9liG7PC56GXIdp/P1IaT/hKoN64mamTViUztGn0X7ciYVSYuUadM7ciTE/alwLpKGilmRYqmA9PoznQZF0dazEp0hIwjRcbFoZiVUMyKQfsoillxaCtmlaDtgmJW/rW6ysfdKGSwHZN2VsRsW9MyZrU88X8vMrVP6YdpW95XyfzhT6eveRwpMo4UGUeKjCNFaR1Sdo1T6IMIHSpJkXGkyDhSZBwpMo4UGUeK5ZfMGd/Qz1bbK2YV0Zm5agPAsuVQOfXOXI/bt1m0PVazWgJahsxb21K/OWZleg/8DLRdUMwqhvR83FzparQBMo4WGReH8nFCxtEi4+JQPi6B7BtubxAds+pqRahAuohZmYkn1WDUvkFkPi4Tl6hTpnZLPq4k6pS1FJhX1Mlj26J6VjGrY5NE75HZq7a3vkk+bq9YErPU1nSAFBlHiowjRcaRsntysolZfQXgcXA77u88vgDwIFg/k2/Xv89R8L6frVarV+vHzwE8tW6V8EGHSlKOzeM+A3gd3ZBkNhPpKwDvg7Vf4HrRv48A3k19kUYcKTKOFBlHiowjxdo45ruFqfCIWUXmxQ71D/92jTrd8Tx1zMojalRSdzTtbV3FrHi09+opZuVPF/k45hOAoSJi0dOBzM4PheZx0+hup5FxcaTFrLrb6yoYoQ8AyoxjvIP5kBH6AECHykgUs0qgu5GqmBUpGnHT6Wqni4xZsS9DVkt3MSvP7XvW7iJm1XKonNIJj3xatvamtsU21doWMasRDkN02jo5IUXGkSLjSJFxpMg4UhYY6FLHnNCII2UB4Nf14x9wnQadI59xncSl4R6AD+ufv3ObkgqVaYAOlbTIOFJkHCkyjhSLqwO3zQOjY1Zz0W4ybmrUKHopsMPnPfTTtSNiVtYZudJ6o2jv1YuMWWUy+5iVmXBijQzt9JjVUBkzZjQdmEZ3psu4OBSzamCEPgBQzIoWHSrjUMwqge5GarRxmYmXoYjOx2UyVLZPMStSFLPy17bMx5nFrCy3Y9Kmj1kdNs7z+ltP2of6ntffjmpbLUO2LWhcT9on0DyOlP8BUHLZs2pAQFIAAAAASUVORK5CYII=" />
        </defs>
    </svg>
</template>

<style scoped>
svg {
    width: 100%;
    height: 100%;
    color-scheme: v-bind('style.colorScheme');
}

#page {
    fill: light-dark(#ffffff, #111111);
    transition: fill 200ms;
}

#pagewallpaper {
    fill-opacity: v-bind('style.wallpaperOpacity');
    transition: fill-opacity 200ms;
}

#sidebar {
    fill: light-dark(#ffffffaa, #0c0c0caa);
    transition: fill 200ms;
}

#border {
    fill: light-dark(#dfdfdfaa, #2e2e2eaa);
    transition: fill 200ms;
}

.stroke {
    stroke: light-dark(#dfdfdf, #2e2e2e);
    transition: stroke 200ms;
}

.widget {
    fill: light-dark(#ffffffaa, #0c0c0caa);
    transition: fill 200ms;
}

#page {
    fill: v-bind('style.pageColor ?? `light-dark(#ffffff, #111111)`');
    transition: fill 200ms;
    /* wallpaper! */
}

#appbar {
    fill: v-bind('style.appbarColor || `light-dark(${shiftedHslColor(...style.accentColor, 95, 47)}, ${shiftedHslColor(...style.accentColor, 73, 22)})`');
    transition: fill 200ms;
}

#menubar {
    fill: v-bind('style.menubarColor || `light-dark(${shiftedHslColor(...style.accentColor, 95, 55)}, ${shiftedHslColor(...style.accentColor, 73, 30)})`');
    transition: fill 200ms;
}

.decoration {
    opacity: 0;
    transition: opacity 200ms;
}

.decoration#custom {
    opacity: v-bind('style.decoration === `custom` ? 1 : 0');
}

.decoration#waves {
    opacity: v-bind('style.decoration === `waves` ? 0.15 : 0');
}

.decoration#zigzag {
    opacity: v-bind('style.decoration === `zig-zag` ? 0.15 : 0');
}

.decoration#dots {
    opacity: v-bind('style.decoration === `polka-dot` ? 0.15 : 0');
}

.decoration#stripes {
    opacity: v-bind('style.decoration === `stripes` ? 0.15 : 0');
}

.decoration#lego {
    opacity: v-bind('style.decoration === `lego` ? 0.15 : 0');
}

#pagetitle {
    fill: light-dark(v-bind('shiftedHslColor(...style.accentColor, 78, 43)'), v-bind('shiftedHslColor(...style.accentColor, 53, 55)'));
    transition: fill 200ms;
}

#gradientstop1 {
    stop-color: light-dark(v-bind('shiftedHslColor(...style.accentColor, 95, 55)'), v-bind('shiftedHslColor(...style.accentColor, 73, 30)'));
    transition: stop-color 200ms;
}

#gradientstop2 {
    stop-color: light-dark(v-bind('shiftedHslColor(...style.accentColor, 95, 47)'), v-bind('shiftedHslColor(...style.accentColor, 73, 22)'));
    transition: stop-color 200ms;
}
</style>