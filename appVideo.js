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
      .filter(m => m.videos)
      .forEach(m => {
        m.videos.filter(v => {
          const splitted = v.uri.split("/")
          const messageVideoFileName = splitted[splitted.length - 1];
          map[messageVideoFileName] = m.timestamp_ms;
        })
      })
  })

  fs.writeFileSync("./map2.json", JSON.stringify(map))
}).then(() => {
  fs.readFileAsync("./map2.json", 'utf8').then(data => {
    const map = JSON.parse(data);
    glob("**/*.mp4", function (er, files) {
      files.forEach(file => {
        const [, , video] = file.split("/");

        utimes(file, {
          btime: map[video],
          atime: map[video],
          mtime: map[video]
        });
      })
    })
  })
});