import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { LOGIN } from "../queries";

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

const Login = ({ show, setToken, setPage }) => {
  const username = useField("text");
  const password = useField("password");

  const [login, result] = useMutation(LOGIN, {
    onError: (error) => {
      console.log(error.graphQLErrors[0].message);
    },
  });

  useEffect(() => {
    if (result.data) {
      const token = result.data.login.value;
      setToken(token);
      localStorage.setItem("library-user-token", token);
    }
  }, [result.data]); // eslint-disable-line

  if (!show) {
    return null;
  }

  const submit = async (event) => {
    event.preventDefault();
    const empty = {
      target: {
        value: "",
      },
    };
    login({
      variables: { username: username.value, password: password.value },
    });
    username.onChange(empty);
    password.onChange(empty);
    setPage("authors");
  };

  return (
    <form id="login-form" onSubmit={submit}>
      <div>
        username: <input id="username" {...username} />
      </div>
      <div>
        password: <input id="password" {...password} />
      </div>
      <div>
        <button id="login-button" type="submit">
          login
        </button>
      </div>
    </form>
  );
};

export default Login;
