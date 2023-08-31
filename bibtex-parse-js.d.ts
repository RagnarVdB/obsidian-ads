declare module "bibtex-parse-js"


type BibTexParse = {
    toJSON(bibtex: string): {citationKey: string, entryTags: {[key: string]: string, entryType: string}}[];
}
