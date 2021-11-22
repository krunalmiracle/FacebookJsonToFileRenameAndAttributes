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
      .filter(m => m.photos)
      .forEach(m => {
        m.photos.filter(p => {
          const splitted = p.uri.split("/")
          const messagePhotoFileName = splitted[splitted.length - 1];
          map[messagePhotoFileName] = m.timestamp_ms;
        })
      })
  })

  fs.writeFileSync("./map.json", JSON.stringify(map))
}).then(() => {
  fs.readFileAsync("./map.json", 'utf8').then(data => {
    const map = JSON.parse(data);
    glob("**/*.jpg", function (er, files) {
      files.forEach(file => {
        const [, , photo] = file.split("/");

        utimes(file, {
          btime: map[photo],
          atime: map[photo],
          mtime: map[photo]
        });
      })
    })
  })
});