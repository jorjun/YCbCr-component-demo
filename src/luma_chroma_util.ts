import { SamplingType } from './sampling_type'
import { Colour, setColour, YCbCrOffset, matrixYCbCr2RGB, subtract, multiply } from './lib'

const PIXEL_DATA_SIZE = 4

export interface LumaChromaComponentImageData {
    lumaImageData: ImageData
    chromaRedImageData: ImageData
    chromaBlueImageData: ImageData
    resultImageData: ImageData
}

interface LumaChromaModifiers {
    lumaModifier: number
    cbModifier: number
    crModifier: number
}

const getChromaArraySizeFromSamplingType = (length: number, samplingType: SamplingType) => {
    switch (samplingType) {
        case SamplingType.FOUR_FOUR_FOUR:
            return length
        case SamplingType.FOUR_TWO_TWO:
            return Math.floor(length / 2)
        case SamplingType.FOUR_TWO_ZERO:
            return Math.floor(length / 4)
        default:
            return length
    }
}

const getChromaRowDivisor = (samplingType: SamplingType) => {
    if (samplingType === SamplingType.FOUR_TWO_ZERO) {
        return 2
    } else {
        return 1
    }
}

const getChromaColDivisor = (samplingType: SamplingType) => {
    if (samplingType === SamplingType.FOUR_FOUR_FOUR) {
        return 1
    } else {
        return 2
    }
}

// TODO: Need to change this so that it uses the sub sampling strategy to determine the width and height of the chroma red/blue image data
export const generateLumaChromaImageData = (
    data: ImageData,
    samplingType: SamplingType,
    modifiers: LumaChromaModifiers
): LumaChromaComponentImageData => {
    const { lumaModifier, cbModifier, crModifier } = modifiers
    const lumaArraySize = data.data.length
    const chromaArraySize = getChromaArraySizeFromSamplingType(data.data.length, samplingType)
    const resultImageData = new Uint8ClampedArray(lumaArraySize)
    const lumaImageData = new Uint8ClampedArray(lumaArraySize)
    const chromaRedImageData = new Uint8ClampedArray(chromaArraySize)
    const chromaBlueImageData = new Uint8ClampedArray(chromaArraySize)
    const colDivisor = getChromaColDivisor(samplingType)
    const rowDivisor = getChromaRowDivisor(samplingType)
    const chromaRowWidth = Math.floor(data.width / colDivisor)

    for (let i = 0; i < data.data.length; i += PIXEL_DATA_SIZE) {
        const row = Math.floor(i / PIXEL_DATA_SIZE / data.width)
        const col = (i / PIXEL_DATA_SIZE) % data.width

        const pixel = { r: data.data[i], g: data.data[i + 1], b: data.data[i + 2] }
        const alpha = data.data[i + 3]

        const luma = new Colour(pixel, lumaModifier, 235, 'r')
        const yCr = luma.channel
        setColour(lumaImageData, i, yCr, alpha)

        let newRGBVector

        if (isValidColAndRow(col, row, colDivisor, rowDivisor)) {
            const newRow = Math.floor(row / rowDivisor)
            const newCol = Math.floor(col / colDivisor)
            const chromaIndex = (newRow * chromaRowWidth + newCol) * PIXEL_DATA_SIZE

            const pixel = { r: data.data[i], g: data.data[i + 1], b: data.data[i + 2] }

            const blue = new Colour(pixel, cbModifier, 240, 'g')
            const cb = blue.channel
            setColour(chromaBlueImageData, chromaIndex, cb, alpha)

            const red = new Colour(pixel, crModifier, 240, 'b')
            const cr = red.channel
            setColour(chromaRedImageData, chromaIndex, cr, alpha)

            // result
            const temp = { r: luma.value, g: blue.value, b: red.value }
            const vectorWithoutOffset = subtract(temp, YCbCrOffset)
            newRGBVector = multiply(matrixYCbCr2RGB, vectorWithoutOffset)
        } else {
            let index = 0
            // find nearest pixel
            if (isValidColAndRow(col - 1, row, colDivisor, rowDivisor)) {
                const newRow = row
                const newCol = col - 1
                index = (newRow * data.width + newCol) * PIXEL_DATA_SIZE
            } else if (isValidColAndRow(col, row - 1, colDivisor, rowDivisor)) {
                const newRow = row - 1
                const newCol = col
                index = (newRow * data.width + newCol) * PIXEL_DATA_SIZE
            } else if (isValidColAndRow(col - 1, row - 1, colDivisor, rowDivisor)) {
                const newRow = row - 1
                const newCol = col - 1
                index = (newRow * data.width + newCol) * PIXEL_DATA_SIZE
            }
            newRGBVector = { r: resultImageData[index], g: resultImageData[index + 1], b: resultImageData[index + 2] }
        }
        setColour(resultImageData, i, newRGBVector, alpha)
    }

    return {
        lumaImageData: new ImageData(lumaImageData, data.width),
        chromaRedImageData: new ImageData(chromaRedImageData, chromaRowWidth),
        chromaBlueImageData: new ImageData(chromaBlueImageData, chromaRowWidth),
        resultImageData: new ImageData(resultImageData, data.width),
    }
}

const isValidColAndRow = (col: number, row: number, colDivisor: number, rowDivisor: number) => {
    return col % colDivisor === 0 && row % rowDivisor === 0
}
