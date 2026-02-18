let EASE_OUT_EXPO = function (t) {
    return Math.min(1, 1.001 - Math.pow(2, -10 * t))
}
