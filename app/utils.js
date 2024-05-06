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
  }
}
