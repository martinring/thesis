#!/usr/bin/env node

import yaml from 'yaml'
import got from 'got'
import { argv } from 'process'

const props = new Set([
  "type",
  "id",
  "citation-key",
  "categories",
  "language",
  "journalAbbreviation",
  "shortTitle",
  "author",
  "chair",
  "collection-editor",
  "compiler",
  "composer",
  "container-author",
  "contributor",
  "curator",
  "director",
  "editor",
  "editorial-director",
  "executive-producer",
  "guest",
  "host",
  "interviewer",
  "illustrator",
  "narrator",
  "organizer",
  "original-author",
  "performer",
  "producer",
  "recipient",
  "reviewed-author",
  "script-writer",
  "series-creator",
  "translator",
  "accessed",
  "available-date",
  "event-date",
  "issued",
  "original-date",
  "submitted",
  "abstract",
  "annote",
  "archive",
  "archive_collection",
  "archive_location",
  "archive-place",
  "authority",
  "call-number",
  "chapter-number",
  "citation-number",
  "citation-label",
  "collection-number",
  "collection-title",
  "container-title",
  "container-title-short",
  "dimensions",
  "division",
  "DOI",
  "edition",
  "event",
  "event-title",
  "event-place",
  "first-reference-note-number",
  "genre",
  "ISBN",
  "ISSN",
  "issue",
  "jurisdiction",
  "keyword",
  "locator",
  "medium",
  "note",
  "number",
  "number-of-pages",
  "number-of-volumes",
  "original-publisher",
  "original-publisher-place",
  "original-title",
  "page",
  "page-first",
  "part",
  "part-title",
  "PMCID",
  "PMID",
  "printing",
  "publisher",
  "publisher-place",
  "references",
  "reviewed-genre",
  "reviewed-title",
  "scale",
  "section",
  "source",
  "status",
  "supplement",
  "title",
  "title-short",
  "URL",
  "version",
  "volume",
  "volume-title",
  "volume-title-short",
  "year-suffix"
])

const DOI = argv[2]
const res = await got.get(`https://dx.doi.org/${DOI}`,{
  headers: {
    Accept: 'application/citeproc+json',
  }
})

const item = JSON.parse(res.body)
const keys = Object.keys(item).filter(x => props.has(x))

const result = { DOI }
keys.forEach(k => result[k] = item[k])

console.log(yaml.stringify([result],{

}))