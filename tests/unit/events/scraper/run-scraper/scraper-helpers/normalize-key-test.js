const test = require('tape')

const sutpath = '../../../../../../src/events/scraper/run-scraper/scraper-helpers/normalize-key.js'
const normalizeKey = require(sutpath)

let mapping = {
  'ase': 'cases'
}

function assertNormalizedKeyEquals (t, key, expected) {
  const actual = normalizeKey({ heading: key, mapping })
  t.equal(actual, expected)
}

test('single string can be mapped to a property if fragment matches', t => {
  const headings = [
    'case', 'cases', 'CASES', 'Cases',
    'positive cases', 'total cases',
    'number of cases',
    'base', 'vases', 'phase'  // !
  ]
  headings.forEach(heading => {
    assertNormalizedKeyEquals(t, heading, 'cases')
  })
  t.end()
})

test('multiple entries in map can resolve to the same thing', t => {
  mapping = {
    'case': 'cases',
    'positive': 'cases'
  }
  const headings = [
    'case', 'positive'
  ]
  headings.forEach(heading => {
    assertNormalizedKeyEquals(t, heading, 'cases')
  })
  t.end()
})

test('unmapped heading throws', t => {
  const headings = [
    'apple', 'cayses', 'k'
  ]
  headings.forEach(heading => {
    t.throws(() => normalizeKey( { heading, mapping } ), heading)
  })
  t.end()
})

test('single entry that is mapped via several maps to same value is ok', t => {
  mapping = {
    'case': 'cases',
    'positive': 'cases'
  }
  assertNormalizedKeyEquals(t, 'positive cases', 'cases')
  t.end()
})

test('can map a key to null', t => {
  mapping = {
    'case': 'cases',
    'positive': 'cases',
    'other': null,
    'another': null
  }
  assertNormalizedKeyEquals(t, 'positive cases', 'cases')
  assertNormalizedKeyEquals(t, 'cases', 'cases')
  assertNormalizedKeyEquals(t, 'something other than that', null)
  assertNormalizedKeyEquals(t, 'another thing', null)
  t.end()
})

test('entry mapped to multiple distinct values fails', t => {
  mapping = {
    'case': 'cases',
    'death': 'deaths'
  }
  const errRe = new RegExp('no single match found for deathlike-case')
  t.throws(() => normalizeKey( { heading: 'deathlike case', mapping } ), errRe)
  t.end()
})

/** Schema keys are hardcoded in the sut file. */
test('all mapping destination values must exist in schema', t => {
  mapping = {
    'positive': 'invalid_mapping_key'
  }
  const errRe = new RegExp('Invalid values in mapping: invalid_mapping_key')
  t.throws(() => normalizeKey( { heading: 'positive', mapping } ), errRe)
  t.end()
})
