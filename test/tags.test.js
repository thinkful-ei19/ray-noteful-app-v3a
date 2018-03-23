'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Tags', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function() {
    return Tag.insertMany(seedTags)
      .then(() => Tag.ensureIndexes());
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function() {

    it('should return the correct number of tags', function() {
      const dbPromise = Tag.find();
      const apiPromise = chai.request(app).get('/api/tags');

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  });

  describe('GET /api/tags/:id', function() {

    it('should return correct tag from id', function() {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`);
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

    it('should respond with a 404 error for an invalid id', function() {
      return chai.request(app)
        .get('/api/tags/999999999999999999999999')
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/tags', function() {

    it('should create a new folder with valid data', function() {
      const newTag = {
        'name': 'test name'
      };
      let res;
      return chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name');
          return Tag.findById(res.body.id);
        })
        .then(data => {
          expect(res.body.name).to.equal(data.name);
        });
    });

    // it('should return an error when posting an object with a missing "name" field', function() {
    //   const newTag = {};
    //   return chai.request(app)
    //     .post('/api/tags')
    //     .send(newTag)
    //     .catch(err => err.response)
    //     .then(res => {
    //       expect(res).to.have.status(400);
    //       expect(res).to.be.json;
    //       expect(res.body).to.be.an('object');
    //       expect(res.body.messsage).to.equal('Missing `name` in request body');
    //     });
    // });
  });

  describe('PUT /api/tags/:id', function() {

    it('should update tag when provided proper data', function() {
      const updateTag = {
        'name': 'Golden State Warriors'
      };
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/tags/${data.id}`)
            .send(updateTag)
        })
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.keys('id', 'name');
            expect(res.body.id).to.equal(data.id);
            expect(res.body.name).to.equal(updateTag.name);
        });
    });

    it('should respond with a 404 error for an invalid id', function() {
      const updateTag = {
        'name': 'Golden State Warriors'
      };
  
      return chai.request(app)
        .put('/api/folders/999999999999999999999999')
        .send(updateTag)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
      });
    });

    it('should return an error when missing "name" field', function() {
      const updateTag = {};
  
      return chai.request(app)
        .put('/api/folders/1234567')
        .send(updateTag)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });
  });

  describe('DELETE /api/tags/:id', function() {
    
    it('should delete a tag by id', function() {
      let data;
      return Tag.findOne().select('id name')
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/tags/${data.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
        });
    });
  });
});