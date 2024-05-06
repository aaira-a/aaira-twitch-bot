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