const mongoose = require('mongoose');

let movieSchema = mongoose.Schema({
Title: {type: String, required: true},
Description: {type: String, required: true},
Genre: {type: mongoose.Schema.Types.ObjectId, ref: 'Movie'},
Director: {type: mongoose.Schema.Types.ObjectId, ref: 'Director'},
Actors: [{type: mongoose.Schema.Types.ObjectId, ref: 'Actors'}],
ImagePath: {type: String},
Featured: {type: Boolean}
});

let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    Favorites: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

let actorSchema = mongoose.Schema({
    Name: {type: String, required: true},
    Bio: {type: String},
    Birthday: Date,
    Movies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

let directorSchema = mongoose.Schema({
    Name: {type: String, required: true},
    Bio: {type: String, required: true},
    Birth: Date,
    Death: Date,
    Movies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

let genreSchema = mongoose.Schema({
    Name: {type: String, required: true},
    Decsription: {type: String, required: true},
    Movies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);
let Actor = mongoose.model('Actor', actorSchema);
let Director = mongoose.model('Director', directorSchema);
let Genre = mongoose.model('Genre', genreSchema);

module.exports.Movie = Movie;
module.exports.User = User;
module.exports.Actor = Actor;
module.exports.Director = Director;
module.exports.Genre = Genre;