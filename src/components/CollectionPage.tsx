// this engages a babel macro that does cool emotion stuff (like source maps). See https://emotion.sh/docs/babel-macros
import css from "@emotion/css/macro";
// these two lines make the css prop work on react elements
import { jsx } from "@emotion/core";
/** @jsx jsx */

import React, { useMemo, useState } from "react";

import { ContentfulBanner } from "./banners/ContentfulBanner";
import { useGetCollection } from "../model/Collections";
import { RowOfCards } from "./RowOfCards";
import { ByLevelGroups } from "./ByLevelGroups";
import { ListOfBookGroups } from "./ListOfBookGroups";
import { LanguageGroup } from "./LanguageGroup";

import { BookCardGroup } from "./BookCardGroup";
import { ByLanguageGroups } from "./ByLanguageGroups";
import { ByTopicsGroups } from "./ByTopicsGroups";
import { useTrack } from "../analytics/Analytics";
import { IEmbedSettings } from "../model/ContentInterfaces";
import { useSetBrowserTabTitle } from "./Routes";
import { getCollectionAnalyticsInfo } from "../analytics/CollectionAnalyticsInfo";
import { useIntl } from "react-intl";
import { useGetLocalizedCollectionLabel } from "../localization/CollectionLabel";
import { PageNotFound } from "./PageNotFound";
import { useResponsiveChoice } from "../responsiveUtilities";

export const CollectionPage: React.FunctionComponent<{
    collectionName: string;
    embeddedSettings?: IEmbedSettings;
}> = (props) => {
    const l10n = useIntl();
    const getResponsiveChoice = useResponsiveChoice();
    // remains empty (and unused) except in byLanguageGroups mode, when a callback sets it.
    const [booksAndLanguages, setBooksAndLanguages] = useState("");
    const { collection, loading } = useGetCollection(props.collectionName);
    const { params, sendIt } = getCollectionAnalyticsInfo(collection);
    useSetBrowserTabTitle(useGetLocalizedCollectionLabel(collection));
    useTrack("Open Collection", params, sendIt);

    // We seem to get some spurious renders of CollectionPage (at least one extra one on the home page)
    // where nothing significant has changed. Keeping the results in a memo saves time.
    const result = useMemo(() => {
        if (loading) {
            // Typically the display of a collection fills the screen, pushing the footer off the bottom.
            // Until we have a collection, we can't make much of a guess how big its display should be,
            // but a very large guess like this prevents the footer flashing in and out of view.
            return <div style={{ height: "2000px" }}></div>;
        }

        if (!collection) {
            return <PageNotFound />;
        }
        const collectionRows = collection.childCollections.map((c) => {
            if (c.urlKey === "language-chooser") {
                return <LanguageGroup key="lang" />;
            }

            // Ref BL-10063.
            const rows = collection.expandChildCollectionRows ? 1000 : 1;

            return <RowOfCards key={c.urlKey} urlKey={c.urlKey} rows={rows} />;
        });

        let booksComponent: React.ReactElement | null = null;
        if (collection.filter) {
            // "layout" is a choice that we can set in Contentful
            switch (collection.layout) {
                default:
                    booksComponent = <ByTopicsGroups collection={collection} />;
                    break;
                case "no-books": // leave it null
                    break;
                case "all-books": // used by at least RISE-PNG
                    booksComponent = (
                        <BookCardGroup
                            collection={collection}
                            rows={collection.rows ? collection.rows : 1000} // all-books = all books
                        />
                    );
                    break;
                case "by-level":
                    booksComponent = <ByLevelGroups collection={collection} />;
                    break;
                case "by-language":
                    // enhance: may want to use reportBooksAndLanguages callback so we can insert
                    // a string like "X books in Y languages" into our banner. But as yet the
                    // ContentfulBanner has no way to do that.
                    booksComponent = (
                        <ByLanguageGroups
                            titlePrefix=""
                            filter={collection.filter}
                            reportBooksAndLanguages={(books, languages) =>
                                setBooksAndLanguages(
                                    l10n.formatMessage(
                                        {
                                            id: "bookCount.inLanguages",
                                            defaultMessage:
                                                "{bookCount} books in {languageCount} languages",
                                        },
                                        {
                                            bookCount: books,
                                            languageCount: languages,
                                        }
                                    )
                                )
                            }
                        />
                    );
                    break;
                case "by-topic": // untested on this path, though ByTopicsGroup is used in AllResultsPage
                    booksComponent = <ByTopicsGroups collection={collection} />;

                    break;
            }
        }

        const banner = (
            <ContentfulBanner
                id={collection.bannerId}
                collection={collection}
                filter={collection.filter}
                bookCount={
                    // if not by-language, we want this to be undefined, which triggers the usual
                    // calculation of a book count using the filter. If it IS by-language,
                    // we want an empty string until we have a real languages-and-books count,
                    // so we don't waste a query (and possibly get flicker) trying to compute
                    // the filter-based count.
                    collection.layout === "by-language"
                        ? booksAndLanguages
                        : undefined
                }
            />
        );

        return (
            <div>
                {!!props.embeddedSettings || banner}
                <ListOfBookGroups>
                    {collectionRows}
                    {booksComponent}

                    {collection.sponsorshipImage && (
                        <div
                            css={css`
                                margin-bottom: 2em;
                            `}
                        >
                            <h1
                                css={css`
                                    font-size: ${getResponsiveChoice(10, 14)}pt;
                                    margin-bottom: 5px;
                                `}
                            >
                                {l10n.formatMessage({
                                    id: "sponsorshipHeading",
                                    defaultMessage:
                                        "This project was sponsored by",
                                })}
                            </h1>
                            {/* Note: the spacing that looks right here really depends on whether there is
                            one or multiple rows in the sponsorship image. If one row, the 5px is fine. But
                            if multiple rows, well USAID requires a huge space all around, and then a much
                            bigger spacing on top looks good. That spacing has to be added to the image when
                            it is uploaded to Contentful, as we don't know from here. See Begin with Books Mali for example. */}
                            <img
                                src={collection.sponsorshipImage.url}
                                alt={"sponsor logos"}
                                css={css`
                                    max-height: ${getResponsiveChoice(
                                        75,
                                        100
                                    )}%;
                                    max-width: 90vw;
                                `}
                            ></img>
                        </div>
                    )}
                </ListOfBookGroups>
            </div>
        );
    }, [
        booksAndLanguages,
        collection,
        getResponsiveChoice,
        l10n,
        loading,
        props.embeddedSettings,
    ]);
    return result;
};
