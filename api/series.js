const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const seriesRouter = express.Router();

const validateSeriesReq = (req) => {
  const name = req.body.series.name;
  const description = req.body.series.description;

  if (!name || !description) return true;
  else return false;
}

seriesRouter.get('/', (req, res) => {
  db.all('SELECT * FROM Series', (err, series) => {
    res.status(200).json({ series });
  });
});

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
  const sql = 'SELECT * FROM Series WHERE Series.id = $seriesId';
  const values = {$seriesId: seriesId};
  db.get(sql, values, (error, series) => {
    if (error) {
      next(error);
    } else if (series) {
      req.series = series;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

seriesRouter.get('/:seriesId', (req, res) => {
  res.status(200).json({ series: req.series })
})

seriesRouter.post('/', (req, res, next) => {
  if (validateSeriesReq(req)) res.sendStatus(400);
  const { name, description } = req.body.series;
  const sql = 'INSERT INTO Series (name, description) VALUES ($name, $description)'
  const values = {
    $name: name,
    $description: description
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error)
    } else {
      db.get(`SELECT * FROM Series WHERE Series.id = ${this.lastID}`, (error, series) => {
        res.status(201).json({ series });
      });
    }
  });
});

seriesRouter.put('/:seriesId', (req, res) => {
  if (validateSeriesReq(req)) res.sendStatus(400);
  const { name, description } = req.body.series;
  const sql = 'UPDATE Series SET name = $name, description = $description WHERE Series.id = $seriesId';
  const values = {
    $name: name,
    $description: description,
    $seriesId: req.params.seriesId
  }
  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`, (error, series) => {
        res.status(200).json({ series });
      });
    }
  })
})

module.exports = seriesRouter;