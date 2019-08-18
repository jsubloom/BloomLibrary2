export interface IFilter {
    language?: string; // review: what is this exactly? BCP 47? Our Parse has duplicate "ethnologueCode" and "isoCode" columns, which actually contain code and full script tags.
    publisher?: string;
    bookshelf?: string;
    feature?: string;
    topic?: string;
    bookShelfCategory?: string;
    otherTags?: string;
    inCirculation?: boolean;
    search?: string;
}
