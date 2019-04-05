import React, { Component } from "react";
import BookCard from "./BookCard";
import { css, cx } from "emotion";
import CategoryCard from "./CategoryCard";

interface IProps {
  title: string;
}

export const CategoryGroup: React.SFC<IProps> = props => (
  <li>
    <h1>{props.title}</h1>
    <ul
      className={css`
        list-style: none;
        display: flex;
        padding-left: 0;
      `}
    >
      <CategoryCard
        title="Africa Storybook Project"
        bookCount="100"
        query={{ publisher: "ASP" }}
      />
      <CategoryCard
        title="Pratham Books"
        bookCount="50"
        query={{ publisher: "Pratham", lang: "en" }}
      />
      <CategoryCard
        title="Book Dash"
        bookCount="20"
        query={{ publisher: "BookDash" }}
      />
    </ul>
  </li>
);

export default CategoryGroup;
