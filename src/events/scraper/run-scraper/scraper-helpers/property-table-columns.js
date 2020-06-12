const is = require('is')
const assert = require('assert')
const slugify = require('slugify')

const schemaKeys = [
  'active',
  'cases',
  'county',
  'deaths',
  'hospitalized',
  'icu',
  'recovered',
  'state',
  'tested',
  'testedNegative', // Not in final schema, used for negative results to then combine with cases to get `tested` number.
  null // Use when we want to discard the column.
]

function assertAllKeysAreInSchema (mapping) {
  const badKeys = Object.keys(mapping).filter(k => k !== 'null').filter(k => !schemaKeys.includes(k))
  assert(badKeys.length === 0, `Invalid keys in mapping: ${badKeys.join()}`)
}

function matchesHeading (heading, matcher) {
  const makeSlug = s => slugify(s, { lower: true })
  if (is.string(matcher) && makeSlug(heading).includes(makeSlug(matcher)))
    return true
  if (is.regexp(matcher) && heading.match(matcher))
    return true
  return false
}

function findAllPropertiesForHeading (heading, mapping) {
  return Object.keys(mapping).filter(prop => {
    return [ mapping[prop] ].flat().some(m => matchesHeading(heading, m))
  })
}

function findUniquePropertyForHeading (heading, mapping) {
  const props = findAllPropertiesForHeading(heading, mapping)
  if (props.length === 0)
    throw new Error(`No matches for ${heading} in mapping`)

  // Mapping to a null is valid ... this just means "ignore".
  const realProps = props.filter(p => p && p !== 'null')
  if (realProps.length === 0)
    return null
  if (realProps.length > 1)
    throw new Error(`Multiple matches for ${heading} in mapping`)
  return realProps[0]
}

/** Find indexes for property columns in a table's headings.
 *
 * Example:
 *
 *  const headings = [ 'apples', 'bats', 'cats', 'dogs' ]
 *
 *  const mapping = {
 *    cases: [ 'apples', 'ants' ],
 *    deaths: [ /^d/, 'elephants' ]
 *  }
 *
 *  This returns { cases: 0, deaths: 3 }
 *
 * If the key in mapping is 'null', the field matching it
 * will be ignored:
 *
 *  const mapping = {
 *    cases: [ 'apples', 'ants' ],
 *    null: [ /^d/, 'elephants' ]
 *  }
 *
 *  This returns { cases: 0 }
 */
function propertyColumnIndices (headings, mapping) {
  assertAllKeysAreInSchema(mapping)
  const result = {}
  headings.forEach((heading, index) => {
    const p = findUniquePropertyForHeading(heading, mapping)
    if (result[p] !== undefined) {
      throw new Error(`Duplicate mapping of ${p} to indices ${result[p]} and ${index}`)
    }
    if (p)
      result[p] = index
  })
  return result
}

/** Normalizes a key to a proper domain key. */
function normalizeKey (key, mapping) {
  assertAllKeysAreInSchema(mapping)
  return findUniquePropertyForHeading(key, mapping)
}

/** Helper method: make a hash. */
function createHash (propertyIndices, arr) {
  return Object.entries(propertyIndices).reduce((hsh, pair) => {
    const [ key, i ] = pair
    if (i > (arr.length - 1)) {
      const msg = `${key} (index ${i}) out of range for ${JSON.stringify(arr)}`
      throw new Error(msg)
    }
    hsh[key] = arr[i]
    return hsh
  }, {})
}

module.exports = {
  propertyColumnIndices,
  createHash,
  normalizeKey
}
