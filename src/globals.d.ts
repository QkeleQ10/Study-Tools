// globals.d.ts
/// <reference types="chrome" />
/// <reference path="./util.js" />
/// <reference path="./api.js" />

// globals.d.ts
interface Window {
    stFaviconObserver: MutationObserver;
}

interface HTMLElement {
    /**
     * Creates a child element under this HTMLElement.
     * @template {keyof HTMLElementTagNameMap} K
     * @param {K} tagName - The element's tag name.
     * @param {CreateElementAttributes & Record<string, any>} [attributes] - Attributes to set
     * @returns {HTMLElementTagNameMap[K]}
     */
    createChildElement(
        tagName: K,
        attributes?: CreateElementAttributes & Record<string, any>
    ): HTMLElementTagNameMap[K];

    /**
     * Creates a sibling element under the parent of this element.
     * @template {keyof HTMLElementTagNameMap} K
     * @param {K} tagName - The element's tag name.
     * @param {CreateElementAttributes & Record<string, any>} [attributes] - Attributes to set on the sibling.
     * @returns {HTMLElementTagNameMap[K]}
     */
    createSiblingElement(
        tagName: K,
        attributes?: CreateElementAttributes & Record<string, any>
    ): HTMLElementTagNameMap[K];

    /**
     * Sets multiple attributes, properties, styles, classes, etc. on this element.
     * @param {CreateElementAttributes & Record<string, any>} attributes - An object of attributes and properties.
     * @returns {void}
     */
    setAttributes(attributes: CreateElementAttributes & Record<string, any>): void;
}

interface Date {
    getWeek(): number;
    getHoursWithDecimals(): number;

    getFormattedDay(): string;
    getFormattedTime(): string;

    addDays(days: number): Date;

    isToday(offset?: number): boolean;
    isTomorrow(offset?: number): boolean;
    isYesterday(offset?: number): boolean;
}

interface Array {
    random(seed);
    mode();
}