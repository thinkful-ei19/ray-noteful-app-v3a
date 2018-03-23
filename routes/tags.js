'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Tag = require('../models/tag');

//GET all tags
router.get('/tags', (req, res, next) => {
  let filter = {};

  Tag.find(filter)
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});


//GET a single tag
router.get('/tags/:id', (req, res, next) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not found');
    err.status = 404;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Tag.findById(id)
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});


// POST/CREATE a new tag
router.post('/tags', (req, res, next) => {
  const {name} = req.body;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newTag = {name};

  Tag.create(newTag)
  .then(result => {
    res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
  })
  .catch(err => {
    if (err.code === 11000) {
      err = new Error('The tag name already exists');
      err.status = 400;
    }
    next(err);
  });
});


// PUT/UPDATE a tag
router.put('/tags/:id', (req, res, next) => {
  const {id} = req.params;
  const {name} = req.body;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updateTag = {name};
  const options = {new: true};

  Tag.findByIdAndUpdate(id, updateTag, options)
  .then(result => {
    if(result) {
      res.json(result);
    } else {
      next();
    }
  })
  .catch(err => {
    if (err.code === 11000) {
      err = new Error('The tag name already exists');
      err.status = 400;
    }
    next(err);
  });
});


//DELETE a tag
router.delete('/tags/:id', (req, res, next) => {
  const id = req.params.id;

  const deleteTag = Tag.findByIdAndRemove({_id: id});
  const updateTag = Tag.updateMany(
    {'tags': id},
    {'$pull': { 'tags': id } }
  );

  Promise.all([deleteTag, updateTag])
    .then(([results]) => {
      if(results) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });

//   Tag.findByIdAndRemove(id)
//     .then(() => {
//       res.status(204).end();
//     })
//     .catch(err => {
//       next(err);
//     });
});


module.exports = router;
