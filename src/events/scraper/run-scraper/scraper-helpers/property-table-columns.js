const is = require('is')
const assert = require('assert')
const slugify = require('slugify')


/** The set of keys that are allowed in the mapping.  This ensures
 * that we're actually mapping headings to permissible data points. */
const validProperties = [
  'active',
  'cases',
  'county',
  'deaths',
  'hospitalized',
  'icu',
  'recovered',
  'state',
  'tested',

  // Not in final schema, used for negative results to then combine
  // with cases to get `tested` number.
  'testedNegative',

  // Use when we want to discard the heading/column.
  null
]

function validateMappingKeys (mapping) {
  const badKeys = Object.keys(mapping).filter(k => k !== 'null').filter(k => !validProperties.includes(k))
  assert(badKeys.length === 0, `Invalid keys in mapping: ${badKeys.join()}`)
}

/** Get array of all properties that a heading could map to. */
function allPropertiesForHeading (heading, mapping) {

  const toArray = a => [ a ].flat()

  const slugged = s => slugify(s, { lower: true })

  const matchesHeading = m => {
    return false ||
      (is.string(m) && slugged(heading).includes(slugged(m))) ||
      (is.regexp(m) && heading.match(m))
  }

  return Object.keys(mapping).filter(prop => {
    return toArray(mapping[prop]).some(matchesHeading)
  })
}

/** Returns single property returned by using the mapping. */
function propertyForHeading (heading, mapping) {
  const props = allPropertiesForHeading(heading, mapping)
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
  validateMappingKeys(mapping)
  const result = {}
  headings.forEach((heading, index) => {
    const p = propertyForHeading(heading, mapping)
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
  validateMappingKeys(mapping)
  return propertyForHeading(key, mapping)
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
