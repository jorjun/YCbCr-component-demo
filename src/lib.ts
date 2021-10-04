export const PIXEL_DATA_SIZE = 4,
    CR_CB_OFFSET = 128,
    matrixRGB2YCbCr: RGB[] = [
        { r: 0.257, g: 0.504, b: 0.098 },
        { r: -0.148, g: -0.291, b: 0.439 },
        { r: 0.439, g: -0.368, b: -0.071 },
    ],
    matrixYCbCr2RGB: RGB[] = [
        { r: 1.164, g: 0, b: 1.596 },
        { r: 1.164, g: -0.392, b: -0.813 },
        { r: 1.164, g: 2.017, b: 0 },
    ],
    YCbCrOffset: RGB = { r: 16, g: CR_CB_OFFSET, b: CR_CB_OFFSET },
    multiply = (matrix: RGB[], vec: RGB): RGB => {
        if (vec.r === 0 && vec.g === 0 && vec.b === 0) {
            return vec // Easy optimisation (happens lots in the sample image)
        }
        let ix = 0
        return {
            r: matrix[0].r * vec.r + matrix[0].g * vec.g + matrix[0].b * vec.b,
            g: matrix[1].r * vec.r + matrix[1].g * vec.g + matrix[1].b * vec.b,
            b: matrix[2].r * vec.r + matrix[2].g * vec.g + matrix[2].b * vec.b,
        }
    },
    add = (a: RGB, b: RGB): RGB => {
        return { r: a.r + b.r, g: a.g + b.g, b: a.b + b.b }
    },
    subtract = (a: RGB, b: RGB): RGB => {
        return { r: a.r - b.r, g: a.g - b.g, b: a.b - b.b }
    },
    setColour = (data: Uint8ClampedArray, idx: number, col: RGB, alpha: number) => {
        data[idx++] = col.r
        data[idx++] = col.g
        data[idx++] = col.b
        data[idx++] = alpha
    }

type Col = 'r' | 'g' | 'b'

export type RGB = {
    r: number
    g: number
    b: number
}

export class Colour {
    value = 0

    constructor(private rgb: RGB, private modify: number, private min: number, private bias: Col) {
        const rawYrb = multiply(matrixRGB2YCbCr, rgb)
        const offSetYrb = add(YCbCrOffset, rawYrb)
        const offset = offSetYrb[this.bias]
        this.value = Math.min(offset + this.modify, this.min) // saved for use in combined results
    }
    get channel() {
        const mask = { r: CR_CB_OFFSET, g: CR_CB_OFFSET, b: CR_CB_OFFSET }
        mask[this.bias] = this.value
        const rawYrb = subtract(mask, YCbCrOffset)
        return multiply(matrixYCbCr2RGB, rawYrb)
    }
}
