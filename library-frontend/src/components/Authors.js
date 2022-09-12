import { useQuery, useMutation } from "@apollo/client";
import { useState } from "react";
import { ALL_AUTHORS, EDIT_AUTHOR } from "../queries";

const useField = (type) => {
  const [value, setValue] = useState("");

  const onChange = (event) => {
    setValue(event.target.value);
  };

  return {
    type,
    value,
    onChange,
  };
};

const Authors = (props) => {
  const name = useField("text");
  const born = useField("text");

  const result = useQuery(ALL_AUTHORS);
  const [edit] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  //const [edit] = useMutation(EDIT_AUTHOR);

  if (!props.show) {
    return null;
  }

  if (result.loading) {
    return <div>loading...</div>;
  }

  const authors = result.data.allAuthors;

  const updateAuthors = (event) => {
    event.preventDefault();
    const empty = {
      target: {
        value: "",
      },
    };
    edit({ variables: { name: name.value, setBornTo: Number(born.value) } });
    name.onChange(empty);
    born.onChange(empty);
  };

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born !== null ? a.born : "Not known"}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={updateAuthors}>
        <select onChange={name.onChange}>
          {authors.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
        <br />
        <input {...born} />
        <br />
        <button type="submit">submit</button>
      </form>
    </div>
  );
};

export default Authors;
