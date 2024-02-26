// const assert = require("assert");
const expect = require("chai").expect;
const request = require("supertest");
const sinon = require("sinon");
const fs = require("fs");
const path = require("path");

const app = require("../../app/app");

describe('GET /bot/hello', () => {

  it('should return 200 status', () => {
    return request(app)
      .get('/bot/hello')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return json response', () => {
    return request(app)
      .get('/bot/hello')
      .then((response) => {
        expect(response.body).to.eql({"hello": "world"});
        expect(response.headers['content-type']).to.include('application/json');
      })
  });
});


describe('GET /bot/toggle', () => {

  const basePath = path.join(__dirname, '..', '..', 'app', 'data');
  const fileToCleanup1 = path.join(basePath, 'toggle_enabled');
  const fileToCleanup2 = path.join(basePath, 'toggle_disabled');
  
  beforeEach(() => {
    if (fs.existsSync(fileToCleanup1)) {
      fs.unlinkSync(fileToCleanup1);
    }

    if (fs.existsSync(fileToCleanup2)) {
      fs.unlinkSync(fileToCleanup2);
    }    
  });

  afterEach(() => {
    if (fs.existsSync(fileToCleanup1)) {
      fs.unlinkSync(fileToCleanup1);
    }

    if (fs.existsSync(fileToCleanup2)) {
      fs.unlinkSync(fileToCleanup2);
    }    
  });

  it('should return 200 status', () => {
    return request(app)
      .get('/bot/toggle')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return bot enabled status if there is toggle_enabled file', () => {

    fs.writeFileSync(fileToCleanup1, "this is file content");

    return request(app)
      .get('/bot/toggle')
      .then((response) => {
        expect(response.body).to.eql({"status": "enabled"});
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

  it('should return bot disabled status if there is toggle_disabled file', () => {

    fs.writeFileSync(fileToCleanup2, "this is file content");

    return request(app)
      .get('/bot/toggle')
      .then((response) => {
        expect(response.body).to.eql({"status": "disabled"});
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

});

