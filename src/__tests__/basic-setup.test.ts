import { isValidAptosAddress, convertMicroUnits } from './utils/test-constants'

describe('Basic Test Setup', () => {
  test('should validate correct Aptos address format', () => {
    const validAddress = '0xd665491175132e66210164f5c0aef6aa432191ac7f3fcc1ab1deebe6d76351ec'
    expect(isValidAptosAddress(validAddress)).toBe(true)
  })

  test('should reject invalid address formats', () => {
    const invalidAddresses = [
      '0x123', // Too short
      '0xg234567890123456789012345678901234567890123456789012345678901234', // Invalid hex
      'd665491175132e66210164f5c0aef6aa432191ac7f3fcc1ab1deebe6d76351ec', // Missing 0x
      '0x12345678901234567890123456789012345678901234567890123456789012345', // Too long
    ]

    invalidAddresses.forEach(address => {
      expect(isValidAptosAddress(address)).toBe(false)
    })
  })

  test('should convert microunits to readable APT amounts', () => {
    const testCases = [
      { microunits: '100000000', expected: '1' }, // 1 APT (no fraction)
      { microunits: '150000000', expected: '1.50000000' }, // 1.5 APT
      { microunits: '123456789', expected: '1.23456789' }, // 1.23456789 APT
      { microunits: '1000000000', expected: '10' }, // 10 APT (no fraction)
    ]

    testCases.forEach(({ microunits, expected }) => {
      const result = convertMicroUnits(microunits)
      expect(result).toBe(expected)
    })
  })

  test('should handle basic arithmetic', () => {
    expect(2 + 2).toBe(4)
    expect(10 - 5).toBe(5)
    expect(3 * 4).toBe(12)
    expect(15 / 3).toBe(5)
  })
})
