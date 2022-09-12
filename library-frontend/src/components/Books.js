import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";
import { ALL_BOOKS } from "../queries";

const Books = ({ show }) => {
  //const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState("");
  const resultAll = useQuery(ALL_BOOKS);
  const result = useQuery(ALL_BOOKS, {
    variables: {
      genre,
    },
  });

  if (!show) {
    return null;
  }

  if (result.loading || resultAll.loading) {
    return <div>loading...</div>;
  }

  const flatten = (arr) => {
    return arr.reduce((flat, toFlatten) => {
      return flat.concat(
        Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
      );
    }, []);
  };

  const books = result.data.allBooks;
  //get unique genres as a set
  const genres = [
    ...new Set(flatten(resultAll.data.allBooks.map((book) => book.genres))),
  ];

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {genres.map((a) => (
        <button onClick={() => setGenre(a)}>{a}</button>
      ))}
      <button onClick={() => setGenre("")}>all genres</button>
    </div>
  );
};

export default Books;
