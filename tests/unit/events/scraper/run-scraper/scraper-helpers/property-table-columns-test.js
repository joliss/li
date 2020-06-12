const test = require('tape')

const sutpath = '../../../../../../src/events/scraper/run-scraper/scraper-helpers/property-table-columns.js'
const { propertyColumnIndices, createHash } = require(sutpath)

/**
 * propertyColumnIndices tests
 */

let headings = [ 'county', 'cases' ]

function assertIndicesEqual (t, mapping, headings, expected) {
  const actual = propertyColumnIndices(headings, mapping)
  t.deepEqual(actual, expected)
}

test('returns indices for exact text matches', t => {
  const mapping = {
    county: 'county',
    cases: 'cases'
  }
  const expected = {
    county: 0,
    cases: 1
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('all headings must be mapped', t => {
  const mapping = {
    county: 'county'
  }
  const re = new RegExp('No matches for cases in mapping')
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('can ignore headings by mapping them to null', t => {
  const mapping = {
    county: 'county',
    null: 'cases'
  }
  const expected = {
    county: 0
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('can use null mapping as catch-all for unmapped headings', t => {
  const mapping = {
    county: 'county',
    null: /.*/
  }
  const headings = [ 'county', 'something', 'else', 'here' ]
  const expected = {
    county: 0
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('can have several mappings all mapping to the same property', t => {
  const mapping = {
    county: [ 'county', 'ount', 'ty', /count/ ],
    cases: 'cases'
  }
  const expected = {
    county: 0,
    cases: 1
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('text matches are case-insensitive and do not have to match full string', t => {
  const testcases = [
    'case', 'cases', 'CASES', 'Cases',
    'positive cases', 'total cases',
    'number of cases',
    'base', 'vases', 'phase'
  ]
  testcases.forEach(c => {
    const headings = [ c ]

    const mapping = {
      cases: 'as'  // This matches every test case above.
    }
    const expected = {
      cases: 0
    }

    assertIndicesEqual(t, mapping, headings, expected)
  })

  t.end()
})

/** Schema keys are hardcoded in the sut file. */
test('all mapping destination values must exist in schema', t => {
  const mapping = {
    invalid_key: 'something'
  }
  const re = /Invalid keys in mapping: invalid_key/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('can use regexes', t => {
  const mapping = {
    county: /COUNTY/i,
    cases: /ase/
  }
  const expected = {
    county: 0,
    cases: 1
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('fails if no match', t => {
  const mapping = {
    county: /nomatch/,
    cases: 'cases'
  }
  const re = /No matches for county in mapping/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if ambiguous match', t => {
  const mapping = {
    county: /c/,
    cases: /c/
  }
  const re = /Multiple matches for county in mapping/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if ambiguous match due to bad headings', t => {
  headings = [ 'cases', 'cases' ]
  const mapping = {
    cases: 'cases'
  }
  const re = /Duplicate mapping of cases to indices 0 and 1/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('can use array of matchers', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples', 'ants' ],
    tested: [ 'bats' ],
    hospitalized: [ 'cats' ],
    deaths: [ /^d/, 'elephants' ]
  }
  const expected = {
    cases: 0,
    tested: 1,
    hospitalized: 2,
    deaths: 3
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('array of matchers fails if matches multiple columns', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples', 'dogs' ],
    tested: 'bats',
    deaths: 'cats'
  }
  const re = /Duplicate mapping of cases to indices 0 and 3/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if multiple matchers match the same column', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples' ],
    deaths: [ /pples/, 'elephants' ]
  }
  const re = /Multiple matches for apples in mapping/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})


test('createHash creates a hash', t => {
  const mapping = {
    cases: 0,
    deaths: 4
  }
  const raw = [ 'abc', 1, 2, 'def', 'xxx' ]
  t.deepEqual( { cases: 'abc', deaths: 'xxx' }, createHash(mapping, raw) )
  t.end()
})


test('createHash throws if index out of range', t => {
  const mapping = {
    cases: 0,
    deaths: 4
  }
  const raw = [ 'abc', 1, 2 ]
  const msg = "deaths (index 4) out of range for ['abc', 1, 2]"
  t.throws(() => { createHash(mapping, raw) }, msg)
  t.end()
})
