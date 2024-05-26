module.exports = {
  extractQueueData: function(input) {

    let result = {};

    let currently_playing = {
      "artist": input.currently_playing.artists[0].name,
      "name": input.currently_playing.name,
      "duration_ms": input.currently_playing.duration_ms,
      "id": input.currently_playing.id
    };

    result.currently_playing = currently_playing;

    const queue = [];

    input.queue.forEach((el) => {
      let queueItem = {
        "artist": el.artists[0].name,
        "name": el.name,
        "duration_ms": el.duration_ms,
        "id": el.id
      }
      queue.push(queueItem);
    });

    result.queue = queue;

    return result;
  },

  extractTrackId: function(input) {
    const re = /https:\/\/open.spotify.com\/track\/(\w*)\/?/;
    const r = input.match(re);

    return r[1];
  },

  constructAddSongUri: function(input) {
    return "spotify:track:" + input;
  },


  detectSongRequestFormat: function(input) {

    if ((input == undefined) || (input == "")) {
      return "EMPTY";
    }

    const re = /https:\/\/open.spotify.com\/track\/(\w*)\/?/;
    const r = input.match(re);

    if (r) {
      return "URI";
    }
    else {
      return "STRING";
    }
  }

}
