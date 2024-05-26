const expect = require("chai").expect;

const utils = require("../../app/utils");


describe('extractQueueData', () => {

  it('should filter out unnecessary data', () => {

    let mockValidSpotifyResponse = {
      "currently_playing": {
        "artists": [
          {
            "name": "currently playing artist name",
          }
        ],
        "duration_ms": 60000,
        "name": "currently playing track name",
        "id": "currently playing track ID",
        "extra": "this should not be returned in response"
      },
      "queue": [
        {
          "artists": [
            {
              "name": "queue item 1 artist name"
            }
          ],
          "duration_ms": 120000,
          "name": "queue item 1 track name",
          "id": "queue item 1 track ID",
          "extra": "this should not be returned in response 2"
        },
        {
          "artists": [
            {
              "name": "queue item 2 artist name"
            }
          ],
          "duration_ms": 180000,
          "name": "queue item 2 track name",
          "id": "queue item 2 track ID",
          "extra": "this should not be returned in response 3"
        }
      ]
    };

    let expectedResult = {
      "currently_playing": {
        "artist": "currently playing artist name",
        "duration_ms": 60000,
        "name": "currently playing track name",
        "id": "currently playing track ID"
      },
      "queue": [
        {
          "artist": "queue item 1 artist name",
          "duration_ms": 120000,
          "name": "queue item 1 track name",
          "id": "queue item 1 track ID"
        },
        {
          "artist": "queue item 2 artist name",
          "duration_ms": 180000,
          "name": "queue item 2 track name",
          "id": "queue item 2 track ID"
        }
      ]
    }

    const result = utils.extractQueueData(mockValidSpotifyResponse);
    expect(result).to.eql(expectedResult);

  });

});


describe('extractTrackId', () => {

  it('should return track ID from Spotify external URL format', () => {

    let input = "https://open.spotify.com/track/7BD50ATrF3Vab5FQy7vtK8";
    let output = "7BD50ATrF3Vab5FQy7vtK8";

    const result = utils.extractTrackId(input);
    expect(result).to.eql(output);
  });

  it('should return track ID from Spotify external URL format with extra slash', () => {

    let input = "https://open.spotify.com/track/7BD50ATrF3Vab5FQy7vtK8/";
    let output = "7BD50ATrF3Vab5FQy7vtK8";

    const result = utils.extractTrackId(input);
    expect(result).to.eql(output);
  });

  it('should return track ID from Spotify external URL format with share ID', () => {

    let input = "https://open.spotify.com/track/7BD50ATrF3Vab5FQy7vtK8?si=afc63723be6f4094";
    let output = "7BD50ATrF3Vab5FQy7vtK8";

    const result = utils.extractTrackId(input);
    expect(result).to.eql(output);
  });

});


describe('constructAddSongUri', () => {

  it('should construct Spotify track URI from track ID', () => {

    let input = "7BD50ATrF3Vab5FQy7vtK8";
    let output = "spotify:track:7BD50ATrF3Vab5FQy7vtK8";

    const result = utils.constructAddSongUri(input);
    expect(result).to.eql(output);
  });

});


describe('detectSongRequestFormat', () => {

  it('should return EMPTY output for empty string input', () => {
    let input = "";
    let output = "EMPTY";

    const result = utils.detectSongRequestFormat(input);
    expect(result).to.eql(output);
  });

  it('should return EMPTY output for undefined input', () => {
    let input;
    let output = "EMPTY";

    const result = utils.detectSongRequestFormat(input);
    expect(result).to.eql(output);
  });

  it('should return URI output for uri input', () => {
    let input = "https://open.spotify.com/track/7BD50ATrF3Vab5FQy7vtK8";
    let output = "URI";

    const result = utils.detectSongRequestFormat(input);
    expect(result).to.eql(output);
  });

  it('should return URI output for uri input with share ID', () => {
    let input = "https://open.spotify.com/track/7BD50ATrF3Vab5FQy7vtK8?si=shareIdAbC0123";
    let output = "URI";

    const result = utils.detectSongRequestFormat(input);
    expect(result).to.eql(output);
  });


  it('should return STRING output for uri input with unidentified pattern 1', () => {
    let input = "artist 1 - track 2";
    let output = "STRING";

    const result = utils.detectSongRequestFormat(input);
    expect(result).to.eql(output);
  });

  it('should return STRING output for uri input with unidentified pattern 2', () => {
    let input = "papejela";
    let output = "STRING";

    const result = utils.detectSongRequestFormat(input);
    expect(result).to.eql(output);
  });

  it('should return STRING output for uri input with unidentified pattern 3', () => {
    let input = "abc:123:qwe";
    let output = "STRING";

    const result = utils.detectSongRequestFormat(input);
    expect(result).to.eql(output);
  });

});

