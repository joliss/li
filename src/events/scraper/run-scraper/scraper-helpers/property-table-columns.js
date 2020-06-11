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
  const badKeys = Object.keys(mapping).filter(v => !schemaKeys.includes(v))
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

// TODO - refactor, can use filter i think
function findAllPropertiesForHeading (heading, mapping) {
  const props = []
  Object.keys(mapping).forEach(prop => {
    [ mapping[prop] ].flat().forEach(m => {
      if (matchesHeading(heading, m)) {
        props.push(prop)
      }
    })
  })
  return props
}

function findUniquePropertyForHeading (heading, mapping) {
  const props = findAllPropertiesForHeading(heading, mapping)
  const errMsg = `matches for ${heading} in mapping`
  if (props.length === 0)
    throw new Error(`No ${errMsg}`)
  if (props.length > 1)
    throw new Error(`Multiple ${errMsg}`)
  return props[0]
}


function findUniqueMatch (headings, key, matchers) {
  if (!is.array(matchers))
    matchers = [ matchers ]
  const indices = []

  for (var i = 0; i < headings.length; i++) {
    matchers.forEach(m => {
      if (matchesHeading(m, headings[i])) {
        indices.push(i)
      }
    })
  }
  const errMsg = `matches for ${key} (${matchers.join('; ')}) in headings ${headings.join('; ')}`
  if (indices.length === 0)
    throw new Error(`No ${errMsg}`)
  if (indices.length > 1)
    throw new Error(`Multiple ${errMsg}`)

  return indices[0]
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
 *  This returns {
 *    cases: 0,
 *    deaths: 3
 *  }
 */
function propertyColumnIndices (headings, mapping) {
  assertAllKeysAreInSchema(mapping)
  const result = {}
  headings.forEach((heading, index) => {
    const p = findUniquePropertyForHeading(heading, mapping)
    result[p] = index
  })
  return result
}


// TODO - refactor this, exactly same as other method.
function tryPropertyColumnIndices (headings, mapping) {
  return propertyColumnIndices(headings, mapping)
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
  tryPropertyColumnIndices,
  createHash
}
