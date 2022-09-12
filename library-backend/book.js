const {
  ApolloServer,
  UserInputError,
  AuthenticationError,
  gql,
} = require("apollo-server");
const mongoose = require("mongoose");
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const { v1: uuid } = require("uuid");
const jwt = require("jsonwebtoken");

const MONGODB_URI =
  "mongodb+srv://fullstack:fullstack@cluster0.xh1gj37.mongodb.net/library?retryWrites=true&w=majority";

console.log("connecting to", MONGODB_URI);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message);
  });

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
 *
 * Spanish:
 * Podría tener más sentido asociar un libro con su autor almacenando la id del autor en el contexto del libro en lugar del nombre del autor
 * Sin embargo, por simplicidad, almacenaremos el nombre del autor en conección con el libro
 */

const JWT_SECRET = "NEED_HERE_A_SECRET_KEY";

const typeDefs = gql`
  type User {
    username: String!
    favouriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Author {
    name: String!
    id: ID!
    bookCount: Int
    born: Int
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book!
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favouriteGenre: String!): User
    login(username: String!, password: String!): Token
  }

  type Query {
    me: User
    bookCount: Int!
    authorCount: Int!
    allBooks(genre: String, author: String): [Book!]!
    allAuthors: [Author!]!
  }
`;

const allBooks = async (root, args) => {
  let res = null;
  const books = await Book.find({}).populate("author", {
    name: 1,
    born: 1,
  });
  if (args.author && args.genre) {
    res = books.filter(
      (book) =>
        book.author.name === args.author && book.genres.includes(args.genre)
    );
  } else if (args.author) {
    res = books.filter((book) => book.author.name === args.author);
  } else if (args.genre) {
    res = books.filter((book) => book.genres.includes(args.genre));
  } else {
    res = books;
  }
  return res;
};

const addBook = async (root, args, context) => {
  if (!context.currentUser) {
    throw new UserInputError("You must be logged in to do this");
  }
  const books = await Book.find({}).populate("author", {
    name: 1,
    born: 1,
  });
  if (!books.find((book) => book.author.name === args.author)) {
    const author = new Author({
      name: args.author,
    });
    const book = new Book({
      title: args.title,
      published: args.published,
      genres: args.genres,
      author: author._id,
    });
    try {
      await author.save();
      await book.save();
    } catch (error) {
      throw new UserInputError(error.message, {
        invalidArgs: args,
      });
    }
    await book.populate("author", { name: 1, born: 1 });
    return book;
  } else {
    const author = await Author.find({ name: args.author });
    console.log("author", author);
    const book = new Book({
      title: args.title,
      published: args.published,
      genres: args.genres,
      author: author[0]._id,
    });
    await book.populate("author", { name: 1, born: 1 });
    try {
      await book.save();
    } catch (error) {
      throw new UserInputError(error.message, {
        invalidArgs: args,
      });
    }
    return book;
  }
};

const editAuthor = async (root, args, context) => {
  if (!context.currentUser) {
    throw new UserInputError("You must be logged in to do this");
  }
  const oldAuthor = await Author.findOne({ name: args.name });
  if (!oldAuthor) {
    return null;
  }
  const newAuthor = new Author({
    _id: oldAuthor.id,
    name: oldAuthor.name,
    born: args.setBornTo,
  });
  await Author.findOneAndUpdate({ name: oldAuthor.name }, newAuthor);
  return newAuthor;
};

const resolvers = {
  Mutation: {
    addBook: addBook,
    editAuthor: editAuthor,
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favouriteGenre: args.favouriteGenre,
      });

      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "secret") {
        throw new UserInputError("wrong credentials");
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
  },
  Query: {
    me: (root, args, context) => {
      return context.currentUser;
    },
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: allBooks,
    allAuthors: async () => Author.find({}),
  },
  Book: {
    title: (root) => root.title,
    published: (root) => root.published,
    author: (root) => root.author,
    id: (root) => root.id,
    genres: (root) => root.genres,
  },
  Author: {
    name: (root) => root.name,
    id: (root) => root.id,
    born: (root) => root.born,
    bookCount: async (root) => {
      const books = await Book.find({}).populate("author", {
        name: 1,
        born: 1,
      });
      const count = books.filter((book) => book.author.name === root.name)
        .length;
      return count;
    },
  },
  User: {
    username: (root) => root.username,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
