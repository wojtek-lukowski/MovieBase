const express = require('express'),
morgan = require('morgan');
const app = express();

let movies = [
  {
    title: 'Movie 0',
    director: 'Diector 0'
  },
  {
    title: 'Movie 1',
    director: 'Diector 1'
  },
  {
    title: 'Movie 2',
    director: 'Diector 2'
  },
  {
    title: 'Movie 3',
    director: 'Diector 3'
  },
  {
    title: 'Movie 4',
    director: 'Diector 4'
  },
  {
    title: ' Movie 5',
    director: 'Diector 5'
  },
  {
    title: 'Movie 6',
    director: 'Diector 6'
  },
  {
    title: 'Movie 7',
    director: 'Diector 7'
  },
  {
    title: 'Movie 8',
    director: 'Diector 8'
  },
  {
    title: 'Movie 9',
    director: 'Diector 9'
  },
];

app.use(morgan('common'));

app.get('/movies', (req, res) =>{
res.json(movies);
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('MovieBase is listening in port 8080.')
})

console.log('end');
