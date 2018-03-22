'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Folder = require('../models/folder');
const Note = require('../models/note');

//GET all folders
router.get('/folders', (req, res, next) => {
  let filter = {};

  Folder.find(filter)
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

//GET a single folder
router.get('/folders/:id', (req, res, next) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not found');
    err.status = 404;
    return next(err);
  }

  Folder.findById(id)
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

// POST/CREATE a new folder
router.post('/folders', (req, res, next) => {
  const {name} = req.body;

  /***** Never trust users - validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newFolder = {name};

  Folder.create(newFolder)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

// PUT/UPDATE a folder
router.put('/folders/:id', (req, res, next) => {
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

  const updateFolder = {name};
  const options = {new: true};

  Folder.findByIdAndUpdate(id, updateFolder, options)
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The folder name already exists');
        err.status = 400;
      }
      next(err);
    });
});

//DELETE a folder
router.delete('/folders/:id', (req, res, next) => {
  const id = req.params.id;
  
  const deleteFolder = Folder.findByIdAndRemove({_id: id});
  const deleteNote = Note.updateMany(
    {folderId: id},
    {$unset: {'folderId': ''}}
  );

  Promise.all([deleteFolder, deleteNote])
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      next(err);
    });

//   Folder.findByIdAndRemove(id)
//     .then(() => {
//       res.status(204).end();
//     })
//     .catch(err => {
//       next(err);
//     });
});



module.exports = router;

