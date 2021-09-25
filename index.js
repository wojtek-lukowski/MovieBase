const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const Actors = Models.Actor;
const Directors = Models.Director;
const Genres = Models.Genre;

mongoose.connect("mongodb://localhost:27017/movieBase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const express = require('express'),
  morgan = require('morgan'),
  app = express(),
  bodyParser = require('body-parser'),
  uuid = require('uuid');

app.use(bodyParser.json());
app.use(morgan("common"));
app.use(express.static("public"));

let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passports');

app.get("/", (req, res) => {
  res.send("Welcome to movieBase!");
});

//add new user
app.post("/users", (req, res) => {
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + "already exists");
      } else {
        Users.create({
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
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
});

//get all users
app.get("/users", (req, res) => {
  Users.find().populate('Favorites')
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//get user by username
app.get("/users/:Username", (req, res) => {
  Users.findOne({ Username: req.params.Username }).populate('Favorites', 'Title')
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//update user's info
app.put("/users/:Username", (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
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
});

//get user's favs
// app.get('/users/:Username/movies', (req, res) => {
//   Users.find({Username: req.params.Username })
//   .then((favorites) => {
//     res.json(favorites)
//   })
//   .catch((err) => {
//     console.error(err);
//     res.status(500).send("Error: " + err);
//   });
// });

//add a movie to user's favs
app.post("/users/:Username/movies/:movieID", (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $push: { Favorites: req.params.movieID },
    },
    { mew: true },
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      } else {
        res.json(updatedUser);
      }
    }
  );
});

//remove a movie from user's favs
app.delete("/users/:Username/movies/:MovieID", (req, res) => {
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
});

//remove a user by username
app.delete("/users/:Username", (req, res) => {
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
});

//get all directors
app.get("/directors", (req, res) => {
  Directors.find().populate('Movies', 'Title')
    .then((directors) => {
      res.status(201).json(directors);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//add new director
app.post("/directors", (req, res) => {
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
});

//get director by name
app.get("/directors/:Name", (req, res) => {
  Directors.findOne({ Name: req.params.Name })
    .then((director) => {
      res.json(director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//get all movies of a director by his name
// app.get("/directors/:Name", (req,res) => {
//   Movies.find({"Director.Name": req.params.Name})
//   .then((movies) => {
//     res.json(movies);
//   })
//   .catch((err) => {
//     console.error(err);
//     res.status(500).send("Error: " + err);
//   });
// })

//get all movies with an actor by his name
// app.get("/movies/:Name", (req,res) => {
//   Movies.find({"Actors": req.params.Name})
//   .then((movies) => {
//     res.json(movies);
//   })
//   .catch((err) => {
//     console.error(err);
//     res.status(500).send("Error: " + err);
//   });
// })

//get all genres
app.get('/genres', (req, res) => {
  Genres.find()
  .then((genre) => {
    res.status(201).json(genre);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
})

//get genre by name
app.get("/genres/:Name", (req, res) => {
  Genres.findOne({ Name: req.params.Name })
    .then((genre) => {
      res.json(genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//get all movies of a genre by name
// app.get("/genres/:Name", (req,res) => {
//   Genres.find({Name: req.params.Name})
//   .then((genre) => {
//     res.json(genre);
//   })
//   .catch((err) => {
//     console.error(err);
//     res.status(500).send("Error: " + err);
//   });
// })

//get all movies
app.get("/movies", passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find().populate('Director').populate('Genre', 'Name')
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//get movie by the title
app.get("/movies/:Title", passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.Title }).populate('Director').populate('Genre')
    .then((movie) => {
      res.json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//get all actors
app.get("/actors", (req, res) => {
  Actors.find().populate('Films')
    .then((actors)=> {
      res.status(201).json(actors);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//get actor by name
app.get("/actors/:Name", (req, res) => {
  Actors.findOne({ Name: req.params.Name }).populate('Movies')
    .then((actor) => {
      res.json(actor);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(8080, () => {
  console.log("MovieBase (with MongoDB) is listening on port 8080.");
});
