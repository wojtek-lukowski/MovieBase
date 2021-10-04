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

let auth = require("./auth")(app);
const passport = require("passport");
require("./passports");

app.get("/", (req, res) => {
  res.send("Welcome to movieBase!");
});

//add new user
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

//get all users
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

//get user by username
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Users.findOne({ Username: req.params.Username })
      .populate("Favorites", "Title")
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

//update user's info /hashing added
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

//add a movie to user's favs
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

//remove a movie from user's favs
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

//get director by name
app.get(
  "/directors/:Name",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Directors.findOne({ Name: req.params.Name })
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

//get all genres
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

//get genre by name
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

//get all movies
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
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

//get movie by the title
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

