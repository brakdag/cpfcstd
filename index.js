const fs = require('fs');
const path = require('path');
const admZip = require('adm-zip');
const xml2js = require('xml2js');

function getUuidFromDocumentXml(xmlData) {
  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser();
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        reject(err);
      } else {
        const uuid = result.Document.Properties[0].Property.find(
          (property) => property.$.name === 'Uid'
        ).Uuid[0].$.value;
        resolve(uuid);
      }
    });
  });
}

function getUuidFromFCstd(file) {
  return new Promise((resolve, reject) => {
    const zip = new admZip(file);
    const documentXmlEntry = zip.getEntry('Document.xml');
    if (documentXmlEntry) {
      const xmlData = zip.readAsText(documentXmlEntry);
      getUuidFromDocumentXml(xmlData)
        .then((uuid) => {
                console.log(`${uuid};${file}\n`);
                resolve(uuid)})
        .catch((err) => reject(err));
    } else {
      resolve(null);
    }
  });
}

function findDuplicateUuids(folderPath) {
  const uuids = {};
  const files = fs.readdirSync(folderPath);
  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const fileExt = path.extname(filePath);
    if (fileExt === '.FCStd') {
      const uuidPromise = getUuidFromFCstd(filePath);
      uuidPromise.then((uuid) => {
        if (uuid) {
          if (uuid in uuids) {
            uuids[uuid].push(filePath);
          } else {
            uuids[uuid] = [filePath];
          }
        }
      });
    }
  });

  const duplicateUuids = {};
  for (const uuid in uuids) {
    if (uuids[uuid].length > 1) {
      duplicateUuids[uuid] = uuids[uuid];
    }
  }

  return duplicateUuids;
}

// Ruta de la carpeta que deseas analizar
const folderPath = './archivos';
const duplicateUuids = findDuplicateUuids(folderPath);

// Imprime los archivos con el mismo Uuid
for (const uuid in duplicateUuids) {
  console.log(`Uuid: ${uuid}`);
  console.log('Archivos:');
  duplicateUuids[uuid].forEach((file) => {
    console.log(file);
  });
  console.log('');
}
