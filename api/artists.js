const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const artistRouter = express.Router();

const validateArtistReq = (req) => {
  const name = req.body.artist.name;
  const dateOfBirth = req.body.artist.dateOfBirth;
  const biography = req.body.artist.biography;
  
  if (!name || !dateOfBirth || !biography) return true;
  else false;
}

artistRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Artist WHERE is_currently_employed = 1', (err, artists) => {
    if (err) next(err);
    else res.status(200).json({ artists });
  })
});

artistRouter.param('artistId', (req, res, next, artistId) => {
  const sql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
  const values = {$artistId: artistId};
  db.get(sql, values, (error, artist) => {
    if (error) {
      next(error);
    } else if (artist) {
      req.artist = artist;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

artistRouter.get('/:artistId', (req, res, next) => {
  res.status(200).json({ artist: req.artist });
});

artistRouter.post('/', (req, res, next) => {
  if (validateArtistReq(req)) return res.sendStatus(400);
  const { name, dateOfBirth, biography } = req.body.artist;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  const sql = 'INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)';
  const values = {
    $name: name,
    $dateOfBirth: dateOfBirth,
    $biography: biography,
    $isCurrentlyEmployed: isCurrentlyEmployed
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Artist WHERE Artist.id = ${this.lastID}`, (error, artist) => {
        res.status(201).json({ artist });
      });
    }
  })
});

artistRouter.put('/:artistId', (req, res, next) => {
  if (validateArtistReq(req)) return res.sendStatus(400);
  const { name, dateOfBirth, biography } = req.body.artist;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  const sql = 'UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId';
  const values = {
    $name: name,
    $dateOfBirth: dateOfBirth,
    $biography: biography,
    $isCurrentlyEmployed: isCurrentlyEmployed,
    $artistId: req.params.artistId
  };
  
  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (error, artist) => {
        res.status(200).json({ artist });
      })
    }
  })
})

artistRouter.delete('/:artistId', (req, res, next) => {
  const sql = `UPDATE Artist SET is_currently_employed = 0 WHERE Artist.id = ${req.params.artistId}`;
  db.run(sql, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (error, artist) => {
        res.status(200).json({ artist });
      })
    }
  })
})

module.exports = artistRouter;