const mongoose = require("mongoose");
const Models = require("./models.js");
const Movies = Models.Movie;
const Users = Models.User;
const Actors = Models.Actor;
const Directors = Models.Director;
const Genres = Models.Genre;
const cors = require("cors");
const { check, validationResult } = require("express-validator");

// mongoose.connect("mongodb://localhost:27017/movieBase", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const express = require("express"),
  morgan = require("morgan"),
  app = express(),
  bodyParser = require("body-parser"),
  uuid = require("uuid");

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("common"));
app.use(express.static("public"));

app.use(cors());

let allowedOrigins = ['http://localhost:8080', 'http://localhost:4200', 'https://wojtek-lukowski.github.io/MovieBase-Angular/', 'https://wojtek-lukowski.github.io', 'http://localhost:1234', 'http://testsite.com', 'https://compassionate-kare-ec9836.netlify.app/', 'https://upload.wikimedia.org/', 'https://upload.wikimedia.org/wikipedia/en/8/80/The_Girl_with_the_Dragon_Tattoo_Poster.jpg'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1){
      let message = 'The CORS policy for this app does not allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

let auth = require("./auth")(app);
const passport = require("passport");
require("./passports");

// app.get("/", (req, res) => {
//   res.send("Welcome to movieBase!");
// });

/**
 * Add user - creates an account for a new user
 * @method POST
 * @param {string} endpoint - users endpoint
 * @param {string} Username - username
 * @param {string} Password - password
 * @param {string} Email - e-mail
 * @param {string} Birthday - birthday
 * @returns {object} - new user
 */
app.post('/users', [
  check('Username', 'Username is required').isLength({min: 5}),
  check('Username', 'Username contains non alphanumeric characters - not allowwed').isAlphanumeric(),
  check('Password', 'Password is requqired').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()

], (req, res) => {

  let errors = validationResult(req);

if (!errors.isEmpty()) {
  return res.status(422).json({ errors: errors.array() });
}

  let hashedPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) => { res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

/**
 * Get all users
 * @method GET
 * @param {string} endpoint - users endpoint
 * @returns {object} - returns all users
 */
app.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.find()
      .populate("Favorites")
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Get user by username
 * @method GET
 * @param {string} endpoint - specific user endpoint
 * @param {string} Username - username
 * @returns {object} - returns a user with a selected username
 */
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .populate("Favorites")
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Update user's data. All params need to be filled
 * to complete the action, otherwise alert.
 * @method PUT
 * @param {string} endpoint - specific user's endpoint
 * @param {string} Username
 * @param {string} Password 
 * @param {string} Email 
 * @param {string} Birthday
 * @returns {string} - returns success/error message
 */
app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
  let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * Add movie to favorites
 * @method POST
 * @param {string} endpoint - specific user's favs endpoint
 * @param {string} Title - username
 * @returns {string} - returns success/error message
 */
app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { Favorites: req.params.MovieID },
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * Remove movie from favorites
 * @method DELETE
 * @param {string} endpoint - specific user's favs endpoint
 * @param {string} Title username
 * @returns {string} - returns success/error message
 */
app.delete(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { Favorites: req.params.MovieID },
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

//remove a user by username
/**
 * Remove movie from favorites
 * @method DELETE
 * @param {string} endpoint - specific user's endpoint
 * @param {string} Title username
 * @returns {string} - returns success/error message
 */
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//get all directors
/**
 * Get all directors
 * @method GET
 * @param {string} endpoint - directors endpoint
 * @returns {object} - returns all directors
 */
app.get(
  "/directors",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Directors.find()
      .populate("Movies", "Title")
      .then((directors) => {
        res.status(201).json(directors);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//add new director
app.post(
  "/directors",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Directors.findOne({ Name: req.body.Name })
      .then((director) => {
        if (director) {
          return res.status(400).send(req.body.Name + "already exists");
        } else {
          Directors.create({
            Name: req.body.Name,
            Bio: req.body.Bio,
            Birth: req.body.Birth,
            Death: req.body.Death,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Get director by name
 * @method GET
 * @param {string} endpoint - specific director's endpoint
 * @param {string} Name - selected director's name
 * @returns {object} - returns director with the selected name
 */
app.get(
  "/directors/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Directors.findOne({ Name: req.params.Name })
    .populate("Movies")
      .then((director) => {
        res.json(director);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//update directors's info
app.put(
  "/directors/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Directors.findOneAndUpdate(
      { Name: req.params.Name },
      {
        $set: {
          Name: req.body.Name,
          Bio: req.body.Bio,
          Birth: req.body.Birth,
          Death: req.body.Death,
          Movies: req.body.Movies,
        },
      },
      { new: true },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * Get all genres
 * @method GET
 * @param {string} endpoint - genres endpoint
 * @returns {object} - returns all genres object
 */
app.get(
  "/genres",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Genres.find()
      .then((genre) => {
        res.status(201).json(genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Get genre by name
 * @method GET
 * @param {string} endpoint - specific genre endpoint
 * @param {string} Name - selected genre name
 * @returns {object} - returns the selected genre
 */
app.get(
  "/genres/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Genres.findOne({ Name: req.params.Name })
      .then((genre) => {
        res.json(genre);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//add new genre
app.post(
  "/genres",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Genres.findOne({ Name: req.body.Name })
      .then((genre) => {
        if (genre) {
          return res.status(400).send(req.body.Name + "already exists");
        } else {
          Genres.create({
            Name: req.body.Name,
            Description: req.body.Description,
            Movies: req.body.Movies
          })
            .then((actor) => {
              res.status(201).json(actor);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * Returns all movies
 * @method GET
 * @param {string} endpoint movies endpoint
 * @returns {object} all movies objects
 */
app.get("/movies",
  passport.authenticate('jwt', {session: false}),
  (req, res) => {
    Movies.find()
      .populate("Director")
      .populate("Genre", "Name")
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Get movies by title
 * @method GET
 * @param {string} endpoint specific movie endpoint
 * @param {string} Title selected movie title
 * @returns {object} - returns the selected movie
 */
app.get(
  "/movies/:Title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .populate("Director")
      .populate("Genre")
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//update movie info
app.put(
  "/movies/:Title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOneAndUpdate(
      { Title: req.params.Title },
      {
        $set: {
          Title: req.body.Title,
            Description: req.body.Description,
            Genre: req.body.Genre,
            Director: req.body.Director,
            Actors: req.body.Actors,
           ImagePath: req.body.ImagePath,
           Featured: req.body.Featured
        },
      },
      { new: true },
      (err, updatedMovie) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedMovie);
        }
      }
    );
  }
);

//add new movie
app.post(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.body.Title })
      .then((movie) => {
        if (movie) {
          return res.status(400).send(req.body.Title + " already exists");
        } else {
          Movies.create({
            Title: req.body.Title,
            Description: req.body.Description,
            Genre: req.body.Genre,
            Director: req.body.Director,
            Actors: req.body.Actors,
           ImagePath: req.body.ImagePath,
           Featured: req.body.Featured
          })
            .then((movie) => {
              res.status(201).json(movie);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

//get all actors
app.get(
  "/actors",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Actors.find()
      .populate("Films")
      .then((actors) => {
        res.status(201).json(actors);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//get actor by name
app.get(
  "/actors/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Actors.findOne({ Name: req.params.Name })
      .populate("Films")
      .then((actor) => {
        res.json(actor);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//update actor info
app.put(
  "/actors/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Actors.findOneAndUpdate(
      { Name: req.params.Name },
      {
        $set: {
          Name: req.body.Name,
            Bio: req.body.Bio,
            Birthday: req.body.Birthday,
            Films: req.body.Films
        },
      },
      { new: true },
      (err, updatedMovie) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedMovie);
        }
      }
    );
  }
);

//add new actor
app.post(
  "/actors",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Actors.findOne({ Name: req.body.Name })
      .then((actor) => {
        if (actor) {
          return res.status(400).send(req.body.Name + "already exists");
        } else {
          Actors.create({
            Name: req.body.Name,
            Bio: req.body.Bio,
          Birthday: req.body.Birthday,
            Films: req.body.Films,
          })
            .then((actor) => {
              res.status(201).json(actor);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});

