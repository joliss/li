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

const assertAllValuesAreInSchema = (mapping) => {
  const badKeys = Object.values(mapping).filter(v => !schemaKeys.includes(v))
  assert(badKeys.length === 0, `Invalid values in mapping: ${badKeys.join()}`)
}

const normalizeKey = ({ heading, mapping }) => {
  assertAllValuesAreInSchema(mapping)
  const makeSlug = s => slugify(s, { lower: true })

  const slugHeading = makeSlug(heading)
  const mappedToKeys = Object.entries(mapping).
        map(pair => [ makeSlug(pair[0]), pair[1] ]).
        filter(pair => slugHeading.includes(pair[0])).
        map(pair => pair[1])

  const uniqueSchemaKeys = [ ...new Set(mappedToKeys) ]
  assert.equal(uniqueSchemaKeys.length, 1,
    `no single match found for ${slugHeading} in ${JSON.stringify(mapping)}}`
  )
  return uniqueSchemaKeys[0]
}

module.exports = normalizeKey
