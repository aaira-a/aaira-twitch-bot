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
  const mockDataFile = path.join(basePath, 'data.json');
  
  beforeEach(() => {
    if (fs.existsSync(mockDataFile)) {
      fs.unlinkSync(mockDataFile);
    }
  });

  afterEach(() => {
    if (fs.existsSync(mockDataFile)) {
      fs.unlinkSync(mockDataFile);
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
    fs.writeFileSync(mockDataFile, JSON.stringify({"bot_enabled": true}));

    return request(app)
      .get('/bot/toggle')
      .then((response) => {
        expect(response.body).to.eql({"status": "enabled"});
        expect(response.headers['content-type']).to.include('application/json');
      })
  });

  it('should return bot disabled status if data file contains bot_enabled: false property', () => {

    fs.writeFileSync(mockDataFile, JSON.stringify({"bot_enabled": false}));

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
  const mockDataFile = path.join(basePath, 'data.json');
  
  beforeEach(() => {
    if (fs.existsSync(mockDataFile)) {
      fs.unlinkSync(mockDataFile);
    }
  });

  afterEach(() => {
    if (fs.existsSync(mockDataFile)) {
      fs.unlinkSync(mockDataFile);
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

    fs.writeFileSync(mockDataFile, JSON.stringify({"bot_enabled": false}));

    return request(app)
      .get('/bot/set/toggle/enable')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql({"bot_enabled": true});
        let fileContent = JSON.parse(fs.readFileSync(mockDataFile, 'utf8'));
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
        let fileContent = JSON.parse(fs.readFileSync(mockDataFile, 'utf8'));
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

    fs.writeFileSync(mockDataFile, JSON.stringify({"bot_enabled": true}));

    return request(app)
      .get('/bot/set/toggle/disable')
      .then((response) => {
        expect(response.status).to.eql(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql({"bot_enabled": false});
        let fileContent = JSON.parse(fs.readFileSync(mockDataFile, 'utf8'));
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
        let fileContent = JSON.parse(fs.readFileSync(mockDataFile, 'utf8'));
        expect(fileContent["bot_enabled"]).to.eql(false)
      })    
  });

});

describe('GET /bot/now-playing', () => {

  const basePath = path.join(__dirname, '..', '..', 'app', 'data');
  const mockDataFile = path.join(basePath, 'data.json');
  const mockCredFile = path.join(basePath, 'credentials.json');

  let clock = null;

  beforeEach(() => {
    if (fs.existsSync(mockDataFile)) {
      fs.unlinkSync(mockDataFile);
    }
    if (fs.existsSync(mockCredFile)) {
      fs.unlinkSync(mockCredFile);
    }
    clock = sinon.useFakeTimers({
      now: 1711934625000
    });
  });

  afterEach(() => {
    if (fs.existsSync(mockDataFile)) {
      fs.unlinkSync(mockDataFile);
    }
    if (fs.existsSync(mockCredFile)) {
      fs.unlinkSync(mockCredFile);
    }
    clock.restore();
  });

  let mockValidSpotifyResponse = {
    "timestamp": 1711934625000,
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

  let mockValidSpotifyResponse2 = {
    "timestamp": 1711934640000,
    "item": {
      "name": "track 2",
      "album": {
        "artists": [
          {
            "name": "singer 2"
          }
        ]
      }
    }
  };

  let mockTokenExpiredSpotifyResponse = {
    "error": {
      "status": 401,
      "message": "The access token expired"
    }
  }

  it('should return 428 if the bot is disabled', () => {

    fs.writeFileSync(mockCredFile, JSON.stringify(
      {
        "SPOTIFY_ACCESS_TOKEN": "EXPIRED_TOKEN1",
        "SPOTIFY_REFRESH_TOKEN": "REFRESH_TOKEN1",
        "SPOTIFY_CLIENT_ID": "abc",
        "SPOTIFY_CLIENT_SECRET": "def"
      })
    );

    fs.writeFileSync(mockDataFile, JSON.stringify({"bot_enabled": false}));

    let expectedResponse = {
      "error": "bot_enabled is false"
    }

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(428)
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql(expectedResponse);
      })
  });

  it('should return 501 if credentials file does not exist', () => {
    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(501)
        expect(response.headers['content-type']).to.include('application/json')
        expect(response.body).to.eql({"error": "Credentials file does not exist"});
    })
  });

  it('should return 503 if unable to retrieve track data after refreshing token', () => {

    fs.writeFileSync(mockCredFile, JSON.stringify(
      {
        "SPOTIFY_ACCESS_TOKEN": "EXPIRED_TOKEN1",
        "SPOTIFY_REFRESH_TOKEN": "REFRESH_TOKEN1",
        "SPOTIFY_CLIENT_ID": "abc",
        "SPOTIFY_CLIENT_SECRET": "def"
      })
    );

    const base64_client_id_and_secret = Buffer.from("abc:def").toString("base64");

    const initialCall = nock("https://api.spotify.com")
      .get('/v1/me/player/currently-playing')
      .reply(401, mockTokenExpiredSpotifyResponse)

    const tokenRefreshReqPayload = {
      "grant_type": "refresh_token",
      "access_token": "EXPIRED_TOKEN1",
      "refresh_token": "REFRESH_TOKEN1"
    }

    const tokenRefreshResPayload = {
      "access_token": "NEW_VALID_TOKEN1",
      "token_type": "Bearer",
      "expires_in": 3600,
      "scope": "user-read-playback-state user-read-currently-playing"
    }

    const tokenRefreshCall = nock("https://accounts.spotify.com")
      .post('/api/token')
      .query(new URLSearchParams(tokenRefreshReqPayload))
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .matchHeader('Authorization', `Basic ${base64_client_id_and_secret}`)
      .reply(401, tokenRefreshResPayload)

    let expectedResponse = {"error": "Unable to refresh token"}

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(400)
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql(expectedResponse);

        let credFileContent = JSON.parse(fs.readFileSync(mockCredFile, 'utf8'));
        expect(credFileContent["SPOTIFY_ACCESS_TOKEN"]).to.eql("EXPIRED_TOKEN1")
    })

  });

  it('should return 400 if unable to refresh token', () => {

    fs.writeFileSync(mockCredFile, JSON.stringify(
      {
        "SPOTIFY_ACCESS_TOKEN": "EXPIRED_TOKEN1",
        "SPOTIFY_REFRESH_TOKEN": "REFRESH_TOKEN1",
        "SPOTIFY_CLIENT_ID": "abc",
        "SPOTIFY_CLIENT_SECRET": "def"
      })
    );

    const base64_client_id_and_secret = Buffer.from("abc:def").toString("base64");

    const initialCall = nock("https://api.spotify.com")
      .get('/v1/me/player/currently-playing')
      .reply(401, mockTokenExpiredSpotifyResponse)

    const tokenRefreshReqPayload = {
      "grant_type": "refresh_token",
      "access_token": "EXPIRED_TOKEN1",
      "refresh_token": "REFRESH_TOKEN1"
    }

    const tokenRefreshResPayload = {
      "access_token": "NEW_VALID_TOKEN1",
      "token_type": "Bearer",
      "expires_in": 3600,
      "scope": "user-read-playback-state user-read-currently-playing"
    }

    const tokenRefreshCall = nock("https://accounts.spotify.com")
      .post('/api/token')
      .query(new URLSearchParams(tokenRefreshReqPayload))
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .matchHeader('Authorization', `Basic ${base64_client_id_and_secret}`)
      .reply(200, tokenRefreshResPayload)

    const invalidSecondSpotifyCall = nock("https://api.spotify.com")
        .get('/v1/me/player/currently-playing')
        .reply(401, mockTokenExpiredSpotifyResponse)

    let expectedResponse = {"error": "Unable to request currently playing song after second attempt"}

    // Test flow:
    // 1. Call /bot/now-playing endpoint using access token from credentials file
    // 2. Spotify returns 401 because access token is expired
    // 3. Call Spotify refresh token endpoint
    // 4. Spotify returns new valid access token
    // 5. Save new valid access token into credentials file
    // 6. Call Spotify /currently-playing endpoint with new access token
    // 7. Spotify returns invalid currently-playing data
    // 9. /bot/now-playing endpoint returns 503 error to the caller

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(503)
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql(expectedResponse);

        let credFileContent = JSON.parse(fs.readFileSync(mockCredFile, 'utf8'));
        expect(credFileContent["SPOTIFY_ACCESS_TOKEN"]).to.eql("NEW_VALID_TOKEN1")
    })
  });

  it('should call Spotify API using access token from credentials file', () => {

    fs.writeFileSync(mockCredFile, JSON.stringify({"SPOTIFY_ACCESS_TOKEN": "DUMMYTOKEN1"}));

    const scope = nock("https://api.spotify.com")
      .matchHeader('Authorization', 'Bearer DUMMYTOKEN1')
      .get('/v1/me/player/currently-playing')
      .reply(200, mockValidSpotifyResponse)

    let expectedDataFileContent = {
      "artistName": "singer 1",
      "itemName": "track 1",
      "timestamp": 1711934625000
    }

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.headers['content-type']).to.include('application/json');
        
        // check track data is saved in data file
        let dataFileContent = JSON.parse(fs.readFileSync(mockDataFile, 'utf8'));
        expect(dataFileContent).to.eql(expectedDataFileContent)
    })

  });

  it('should refresh the token if getting 401 from Spotify', () => {

    fs.writeFileSync(mockCredFile, JSON.stringify(
      {
        "SPOTIFY_ACCESS_TOKEN": "EXPIRED_TOKEN1",
        "SPOTIFY_REFRESH_TOKEN": "REFRESH_TOKEN1",
        "SPOTIFY_CLIENT_ID": "abc",
        "SPOTIFY_CLIENT_SECRET": "def"
      })
    );

    const base64_client_id_and_secret = Buffer.from("abc:def").toString("base64");

    const initialCall = nock("https://api.spotify.com")
      .get('/v1/me/player/currently-playing')
      .reply(401, mockTokenExpiredSpotifyResponse)

    const tokenRefreshReqPayload = {
      "grant_type": "refresh_token",
      "access_token": "EXPIRED_TOKEN1",
      "refresh_token": "REFRESH_TOKEN1"
    }

    const tokenRefreshResPayload = {
      "access_token": "NEW_VALID_TOKEN1",
      "token_type": "Bearer",
      "expires_in": 3600,
      "scope": "user-read-playback-state user-read-currently-playing"
    }

    const tokenRefreshCall = nock("https://accounts.spotify.com")
      .post('/api/token')
      .query(new URLSearchParams(tokenRefreshReqPayload))
      .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
      .matchHeader('Authorization', `Basic ${base64_client_id_and_secret}`)
      .reply(200, tokenRefreshResPayload)

    const validSpotifyCall = nock("https://api.spotify.com")
        .get('/v1/me/player/currently-playing')
        .reply(200, mockValidSpotifyResponse)

    let expectedResponse = {
      "timestamp": 1711934625000,
      "artistName": "singer 1",
      "itemName": "track 1"
    }

    // Test flow:
    // 1. Call /bot/now-playing endpoint using access token from credentials file
    // 2. Spotify returns 401 because access token is expired
    // 3. Call Spotify refresh token endpoint
    // 4. Spotify returns new valid access token
    // 5. Save new valid access token into credentials file
    // 6. Call Spotify /currently-playing endpoint with new access token
    // 7. Spotify returns valid currently-playing data
    // 9. /bot/now-playing endpoint returns song data to caller

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(200)
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql(expectedResponse);

        let credFileContent = JSON.parse(fs.readFileSync(mockCredFile, 'utf8'));
        expect(credFileContent["SPOTIFY_ACCESS_TOKEN"]).to.eql("NEW_VALID_TOKEN1")
    })
  });

  it('should return now playing track from stored data file if the data age is < 15 sec', () => {

    let dataFileContent = {
      "timestamp": 1711934625000,
      "artistName": "singer 1",
      "itemName": "track 1"
    }

    let expectedResponse = {
      "timestamp": 1711934625000,
      "artistName": "singer 1",
      "itemName": "track 1"
    }

    fs.writeFileSync(mockCredFile, JSON.stringify({"SPOTIFY_ACCESS_TOKEN": "DUMMYTOKEN1"}));
    fs.writeFileSync(mockDataFile, JSON.stringify(dataFileContent));

    clock.tick(14999);

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(200)
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql(expectedResponse);
      })
  });

  it('should return now playing track from Spotify if the data age is > 15 sec', () => {

    let dataFileContent = {
      "timestamp": 1711934625000,
      "artistName": "singer 1",
      "itemName": "track 1"
    }
    let expectedResponse = {
      "timestamp": 1711934640000,
      "artistName": "singer 2",
      "itemName": "track 2"
    }

    fs.writeFileSync(mockCredFile, JSON.stringify({"SPOTIFY_ACCESS_TOKEN": "DUMMYTOKEN1"}));
    fs.writeFileSync(mockDataFile, JSON.stringify(dataFileContent));

    const scope = nock("https://api.spotify.com")
      .matchHeader('Authorization', 'Bearer DUMMYTOKEN1')
      .get('/v1/me/player/currently-playing')
      .reply(200, mockValidSpotifyResponse2)

    clock.tick(15000);

    return request(app)
      .get('/bot/now-playing')
      .then((response) => {
        expect(response.status).to.eql(200)
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.body).to.eql(expectedResponse);
      })
  });

  it('should return now playing track from Spotify if there is no stored data file', () => {

    fs.writeFileSync(mockCredFile, JSON.stringify({"SPOTIFY_ACCESS_TOKEN": "DUMMYTOKEN1"}));

    let expectedResponse = {
      "timestamp": 1711934625000,
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


  it('should return now playing track in plain text format if plain text is requested', () => {

    fs.writeFileSync(mockCredFile, JSON.stringify({"SPOTIFY_ACCESS_TOKEN": "DUMMYTOKEN1"}));

    let expectedResponse = "Now playing: [singer 1] - [track 1]"

    const scope = nock("https://api.spotify.com")
        .get('/v1/me/player/currently-playing')
        .reply(200, mockValidSpotifyResponse)

    return request(app)
      .get('/bot/now-playing')
      .query({"format": "text"})
      .then((response) => {
        expect(response.status).to.eql(200)
        expect(response.headers['content-type']).to.include('text/plain');
        expect(response.text).to.eql(expectedResponse);
      })
  });

});
