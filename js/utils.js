// eslint-disable-next-line no-redeclare, no-unused-vars
const EASE_OUT_EXPO = function (t) {
    return Math.min(1, 1.001 - Math.pow(2, -10 * t))
}
