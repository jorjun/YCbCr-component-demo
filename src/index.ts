import { img_2 } from '../assets/*.png';
import { generateLumaChromaImageData } from './luma_chroma_util';
import { SamplingType, mapInputToSamplingType } from './sampling_type';

const COMPONENT_IMAGES = 3

// Canvas Elements
const canvas = document.getElementById('original-canvas') as HTMLCanvasElement
const resultCanvas = document.getElementById('result-canvas') as HTMLCanvasElement
const lumaCanvas = document.getElementById('luma-canvas') as HTMLCanvasElement
const chromaRedCanvas = document.getElementById('chroma-red-canvas') as HTMLCanvasElement
const chromaBlueCanvas = document.getElementById('chroma-blue-canvas') as HTMLCanvasElement

// Input Elements
const lumaRange = document.getElementById('luma-range') as HTMLInputElement
const chromaRedRange = document.getElementById('chroma-red-range') as HTMLInputElement
const chromaBlueRange = document.getElementById('chroma-blue-range') as HTMLInputElement
const subSamplingInputs = Array.from(document.getElementsByName('subSamplingOptions')) as HTMLInputElement[] 

// Canvas contexts
const context = canvas.getContext('2d')
const lumaContext = lumaCanvas.getContext('2d')
const chromaRedContext = chromaRedCanvas.getContext('2d')
const chromaBlueContext = chromaBlueCanvas.getContext('2d')
const resultContext = resultCanvas.getContext('2d')

if (context === null) {
    throw new Error('ERROR: No 2d context')
}

const render = () => {
    const selected = subSamplingInputs.filter((input) => input.checked)[0].value
    const samplingType: SamplingType = mapInputToSamplingType[selected]
    const originalImageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const modifiers = {
        lumaModifier: parseInt(lumaRange.value),
        cbModifier: parseInt(chromaBlueRange.value),
        crModifier: parseInt(chromaRedRange.value)
    }
    const imageDataPayload = generateLumaChromaImageData(originalImageData, samplingType, modifiers)

    lumaCanvas.width = imageDataPayload.lumaImageData.width
    lumaCanvas.height = imageDataPayload.lumaImageData.height

    chromaRedCanvas.width = chromaBlueCanvas.width = imageDataPayload.chromaBlueImageData.width
    chromaRedCanvas.height = chromaBlueCanvas.height = imageDataPayload.chromaBlueImageData.height

    const maxImageWidth = window.innerWidth / COMPONENT_IMAGES
    const lumaCanvasScale = imageDataPayload.lumaImageData.width / window.innerWidth
    const chromaCanvasScale = imageDataPayload.chromaRedImageData.width / window.innerWidth

    lumaCanvas.style.width = `${lumaCanvasScale * maxImageWidth}px`
    chromaRedCanvas.style.width = chromaBlueCanvas.style.width = `${chromaCanvasScale * maxImageWidth}px`

    lumaContext?.putImageData(imageDataPayload.lumaImageData, 0, 0)
    chromaRedContext?.putImageData(imageDataPayload.chromaRedImageData, 0, 0)
    chromaBlueContext?.putImageData(imageDataPayload.chromaBlueImageData, 0, 0)
    resultContext?.putImageData(imageDataPayload.resultImageData, 0, 0)
}

chromaRedRange?.addEventListener("change", render) 
chromaBlueRange?.addEventListener("change", render)
lumaRange?.addEventListener("change", render)
subSamplingInputs.forEach((radioButton) => radioButton.onchange = render)

const img = new Image();
img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    resultCanvas.width = img.width
    resultCanvas.height = img.height

    context.drawImage(img, 0, 0);
    resultContext?.drawImage(img, 0, 0)

    canvas.style.width = resultCanvas.style.width = `${window.innerWidth / 3}px`

    render()
};
img.src = img_2;
