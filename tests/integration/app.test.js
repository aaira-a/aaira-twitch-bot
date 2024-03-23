// const assert = require("assert");
const expect = require("chai").expect;
const request = require("supertest");
const sinon = require("sinon");
const nock = require("nock");
const axios = require("axios");
const fs = require("fs");
const path = require("path");


// axios.defaults.adapter = "http";
// this is commented out after downgrading
// axios from 1.6.7 to 0.27.2

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


describe('GET /bot/set/toggle/:state', () => {

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


  it('should return 400 status for no state', () => {
    return request(app)
      .get('/bot/set/toggle')
      .then((response) => {
        expect(response.status).to.eql(400)
      })
  });

  it('should return 200 status for invalid state', () => {
    return request(app)
      .get('/bot/set/toggle/unknown')
      .then((response) => {
        expect(response.status).to.eql(400)
      })
  });

  it('should return 200 status for enable state', () => {
    return request(app)
      .get('/bot/set/toggle/enable')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should write bot_enabled true to data file for enable state if file exists', () =>{

    fs.writeFileSync(fileToCleanup, JSON.stringify({"bot_enabled": false}));

    return request(app)
      .get('/bot/set/toggle/enable')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql({"bot_enabled": true});
        let fileContent = JSON.parse(fs.readFileSync(fileToCleanup, 'utf8'));
        expect(fileContent["bot_enabled"]).to.eql(true)
      })    
  });

  it('should write bot_enabled true to data file for enable state if file doesnt exist', () =>{
    return request(app)
      .get('/bot/set/toggle/enable')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql({"bot_enabled": true});
        let fileContent = JSON.parse(fs.readFileSync(fileToCleanup, 'utf8'));
        expect(fileContent["bot_enabled"]).to.eql(true)
      })    
  });

  it('should return 200 status for disable state', () => {
    return request(app)
      .get('/bot/set/toggle/disable')
      .then((response) => {
        expect(response.status).to.eql(200)
      })
  });

  it('should write bot_enabled false to data file for disable state if file exists', () =>{

    fs.writeFileSync(fileToCleanup, JSON.stringify({"bot_enabled": true}));

    return request(app)
      .get('/bot/set/toggle/disable')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql({"bot_enabled": false});
        let fileContent = JSON.parse(fs.readFileSync(fileToCleanup, 'utf8'));
        expect(fileContent["bot_enabled"]).to.eql(false)
      })    
  });

  it('should write bot_enabled true to data file for disable state if file doesnt exist', () =>{
    return request(app)
      .get('/bot/set/toggle/disable')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql({"bot_enabled": false});
        let fileContent = JSON.parse(fs.readFileSync(fileToCleanup, 'utf8'));
        expect(fileContent["bot_enabled"]).to.eql(false)
      })    
  });

});

describe('GET /bot/now-playing', () => {

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

  let mockValidSpotifyResponse = {
    "item": {
      "name": "track 1",
      "album": {
        "artists": [
          {
            "name": "singer 1"
          }
        ]
      }
    }
  };

  it('should call Spotify API using access token in environment file', () => {

    const env = Object.assign({}, process.env);

    after(() => {
      process.env = env;
    });

    process.env.SPOTIFY_ACCESS_TOKEN = 'DUMMYTOKEN1';

    const scope = nock("https://api.spotify.com")
      .matchHeader('Authorization', 'Bearer DUMMYTOKEN1')
      .get('/v1/me/player/currently-playing')
      .reply(200, mockValidSpotifyResponse)

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
    })

  });

  it('should return now playing track from stored data file', () => {

    let dataFileContent = {
      "artistName": "singer 1",
      "itemName": "track 1"
    }

    let expectedResponse = {
      "artistName": "singer 1",
      "itemName": "track 1"
    }

    fs.writeFileSync(fileToCleanup, JSON.stringify(dataFileContent));

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(200)
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql(expectedResponse);
      })
  });

  it('should return now playing track if there is no stored data file', () => {

    let expectedResponse = {
      "artistName": "singer 1",
      "itemName": "track 1"
    }

    const scope = nock("https://api.spotify.com")
        .get('/v1/me/player/currently-playing')
        .reply(200, mockValidSpotifyResponse)

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(200)
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql(expectedResponse);
      })
  });

});
