export enum SamplingType {
    FOUR_FOUR_FOUR = 0,
    FOUR_TWO_TWO,
    FOUR_TWO_ZERO
}

export const mapInputToSamplingType: { [x: string]: SamplingType } = {
    ['0']: SamplingType.FOUR_FOUR_FOUR,
    ['1']: SamplingType.FOUR_TWO_TWO,
    ['2']: SamplingType.FOUR_TWO_ZERO,

}