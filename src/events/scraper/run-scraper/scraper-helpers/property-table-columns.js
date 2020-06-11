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

function matchesHeading (matcher, heading) {
  const makeSlug = s => slugify(s, { lower: true })
  if (is.string(matcher) && makeSlug(heading).includes(makeSlug(matcher)))
    return true
  if (is.regexp(matcher) && heading.match(matcher))
    return true
  return false
}

function findUniqueMatch (headings, key, matchers) {
  if (!is.array(matchers))
    matchers = [ matchers ]
  const indices = []
  const unmatchedHeadings = []
  for (var i = 0; i < headings.length; i++) {
    matchers.forEach(m => {
      let found = false
      if (matchesHeading(m, headings[i])) {
        indices.push(i)
        found = true
      }
      if (!found)
        unmatchedHeadings.push(headings[i])
    })
  }
  const errMsg = `matches for ${key} (${matchers.join('; ')}) in headings ${headings.join('; ')}`
  if (indices.length === 0)
    throw new Error(`No ${errMsg}`)
  if (indices.length > 1)
    throw new Error(`Multiple ${errMsg}`)

  return {
    result: indices[0],
    unmatched: unmatchedHeadings
  }
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
  let unmatched = []
  Object.keys(mapping).forEach(k => {
    const m = findUniqueMatch(headings, k, mapping[k])
    result[k] = m.result
    unmatched = unmatched.concat(m.unmatched)
  })
  const indices = Object.values(result)
  const uniqueIndices = Array.from(new Set(indices))
  if (indices.length !== uniqueIndices.length)
    throw new Error('Multiple matches for same heading')
  if (unmatched.length !== 0)
    throw new Error(`Missing mapping for ${unmatched.join(', ')}`)
  return result
}


function tryPropertyColumnIndices (headings, mapping) {
  assertAllKeysAreInSchema(mapping)
  const result = {}
  let unmatched = []
  Object.keys(mapping).forEach(k => {
    const m = findUniqueMatch(headings, k, mapping[k])
    result[k] = m.result
    unmatched = unmatched.concat(m.unmatched)
  })
  const indices = Object.values(result)
  const uniqueIndices = Array.from(new Set(indices))
  if (indices.length !== uniqueIndices.length)
    throw new Error('Multiple matches for same heading')
  /*
  if (unmatched.length !== 0)
    throw new Error(`Missing mapping for ${unmatched.join(', ')}`)
*/
  return result
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
