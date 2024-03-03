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
  const fileToCleanup = path.join(basePath, 'data.json');
  
  beforeEach(() => {
    if (fs.existsSync(fileToCleanup)) {
      fs.unlinkSync(fileToCleanup);
    }
  });

  afterEach(() => {
    if (fs.existsSync(fileToCleanup)) {
      fs.unlinkSync(fileToCleanup);
    }
  });

  it('should return 200 status', () => {
    return request(app)
      .get('/bot/toggle')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should return bot enabled status if data file contains bot_enabled: true property', () => {
    fs.writeFileSync(fileToCleanup, JSON.stringify({"bot_enabled": true}));

    return request(app)
      .get('/bot/toggle')
      .then((response) => {
        expect(response.body).to.eql({"status": "enabled"});
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

  it('should return bot disabled status if data file contains bot_enabled: false property', () => {

    fs.writeFileSync(fileToCleanup, JSON.stringify({"bot_enabled": false}));

    return request(app)
      .get('/bot/toggle')
      .then((response) => {
        expect(response.body).to.eql({"status": "disabled"});
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

});

