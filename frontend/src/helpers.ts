// Helper functions for the AST Explorer

// helper function to not search for a term if it contains no non-whitespace chars
export function isSearchable(term: string): boolean {
    return term.trim().length > 0;
}

export {}