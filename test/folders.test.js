'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const Folder = require('../models/folder');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Folders', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function() {
    return Folder.insertMany(seedFolders);
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/folders', function() {

    it('should return the correct number of folders', function() {
      const dbPromise = Folder.find();
      const apiPromise = chai.request(app).get('/api/folders');

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /api/folders/:id', function() {

    it('should return correct folder from id', function() {
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/folders/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
        })
    });

    it('should respond with a 404 for an invalid id', function() {
      return chai.request(app)
        .get('/api/folders/999999999999999999999999')
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/folders', function() {

    it('should create a new folder with valid data', function() {
      const newFolder ={
        'name': 'test name'
      };
      let res;
      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name');
          return Folder.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.name).to.equal(data.name);
        });
    });

    it('should return an error when posting an object with a missing "name" field', function() {
      const newFolder = {};
      return chai.request(app)
        .post('/api/folders')
        .send(newFolder)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });
  });

  describe('PUT /api/folders/:id', function() {

    it('should update the folder when provided proper valid data', function() {
      const updateFolder = {
        'name': 'Golden State Warriors'
      };
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/folders/${data.id}`)
            .send(updateFolder)
        })
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(updateFolder.name);
        });
    });

    it('should respond with a 400 error for improperly formatted id', function() {
      const updateFolder = {
        'name': 'Golden State Warriors'
      };
      const badId = '99-99-99';

      return chai.request(app)
        .put(`/api/folders/${badId}`)
        .send(updateFolder)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.equal('The `id` is not valid');
        });
    });

    it('should respond with a 404 error for an invalid id', function() {
      const updateFolder = {
        'name': 'Golden State Warriors'
      };

      return chai.request(app)
        .put('/api/folders/999999999999999999999999')
        .send(updateFolder)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "name" field', function() {
      const updateFolder = {
        "name": ""
      };

      return chai.request(app)
        .put('/api/folders/1234567')
        .send(updateFolder)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });
  });

  describe('DELETE /api/folders/:id', function() {

    it('should delete a folder by id', function() {
      let data;
      return Folder.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/folders/${data.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
        });
    });
  });
});


