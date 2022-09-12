import { useQuery, useMutation } from "@apollo/client";
import { ALL_BOOKS, ME } from "../queries";

export const Recommend = ({ show }) => {
  const user = useQuery(ME);
  const genre = user.data ? user.data.me.favouriteGenre : "";
  const result = useQuery(ALL_BOOKS, {
    variables: {
      genre,
    },
  });

  if (!show) {
    return null;
  }

  if (result.loading) {
    return <div>loading...</div>;
  }

  const books = result.data.allBooks;
  console.log("user", user);

  return (
    <div>
      <h2>recommendations</h2>
      <div>books from your favourite genre</div>
      <table>
        <tbody>
          <tr key={"header"}>
            <th key={"title"}>Title</th>
            <th key={"author"}>Author</th>
            <th key={"Pub"}>Published</th>
          </tr>
          {books.map((book) => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommend;
