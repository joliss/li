const assert = require('assert')
const slugify = require('slugify')

const slugifyOptions = { lower: true }

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

/**
 * Hand-rolled version of _.pickBy from lodash/
 * @param {object} object
 * @param {(value:any, key: string|null) => boolean} predicate
 */
const pickBy = (object, predicate) => {
  const obj = {}
  for (const key in object) {
    if (predicate(object[key], key)) {
      obj[key] = object[key]
    }
  }
  return obj
}

const assertAllValuesAreInSchema = (mapping) => {
  const badKeys = Object.values(mapping).filter(v => !schemaKeys.includes(v))
  assert(badKeys.length === 0, `Invalid values in mapping: ${badKeys.join()}`)
}

const normalizeKey = ({ heading, mapping }) => {
  assertAllValuesAreInSchema(mapping)
  const slugHeading = slugify(heading, slugifyOptions)

  const foundItems = pickBy(mapping, (schemaKey, headingFragment) => {
    const slugFragment = slugify(headingFragment, slugifyOptions)
    return slugHeading.includes(slugFragment)
  })
  const foundSchemaKeys = [ ...new Set(Object.values(foundItems)) ]
  assert.strictEqual(foundSchemaKeys.length, 1,
    `no single match found for ${slugHeading} in ${JSON.stringify(mapping)}}`
  )
  return foundSchemaKeys[0]
}

module.exports = normalizeKey
