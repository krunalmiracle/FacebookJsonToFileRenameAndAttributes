var glob = require("glob")
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var { utimes } = require("utimes");

const readJSONFiles = async () => {
  const messagesFiles = glob.sync(`dear/message_*.json`)
  const promises = [];
  messagesFiles.forEach(mFile => {
    promises.push(fs.readFileAsync(mFile, 'utf8'));
  })

  return Promise.all(promises);
}

readJSONFiles().then(result => {
  const map = {};
  result.forEach(data => {
    const messagesContents = JSON.parse(data);
    messagesContents.messages
      .filter(m => m.audio_files)
      .forEach(m => {
        m.audio_files.filter(a => {
          const splitted = a.uri.split("/")
          const messageAudioFileName = splitted[splitted.length - 1];
          map[messageAudioFileName] = m.timestamp_ms;
        })
      })
  })

  fs.writeFileSync("./map3.json", JSON.stringify(map))
}).then(() => {
  fs.readFileAsync("./map3.json", 'utf8').then(data => {
    const map = JSON.parse(data);
    glob("**/*.mp4", function (er, files) {
      files.forEach(file => {
        const [, , audio] = file.split("/");

        utimes(file, {
          btime: map[audio],
          atime: map[audio],
          mtime: map[audio]
        });
      })
    })
  })
});