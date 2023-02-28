import http from 'http';
import https from 'https';

export async function getJsonDataFromUrl(url: string): Promise<object> {
  if (!url.startsWith('https://myntfsid.mypinata.cloud/') && !url.startsWith('https://resolver.mydid.eu/'))
    throw 'Bad URL input for method : getJsonDataFromUrl';

  const client = url.startsWith('https://') ? https : http;
  return new Promise((resolve, reject) => {
    var request = client.get(url, function (res) {
      var data = '';
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function () {
        resolve(JSON.parse(data));
      });
    });
    request.on('error', function (e) {
      reject(e.message);
    });
    request.end();
  });
}
