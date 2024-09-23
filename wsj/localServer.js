import fs from 'fs';
import * as http from 'http';
import path from 'path';

const INDICES = {
  'SPX': 'SPX',
  'NDX': 'NDX',
  'DAX': 'DX/XETR/DAX',
  'CAC40': 'FR/XPAR/PX1',
  'FTSE100': 'UK/FTSE%20UK/UKX',
  'HSI': 'HK/XHKG/HSI',
  'NIKKEI': 'JP/XTKS/NIK',
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  if (req.method === 'GET') {
    const filePath = path.resolve(import.meta.dirname, '..' + req.url);
	  console.log(filePath);
    const csvFile = await fs.promises.readFile(filePath);
    res.end(csvFile);
  } else if (req.method === 'POST') {
    const bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk))
      .on('end', () => {
        const body = Buffer.concat(bodyChunks).toString();
        console.log('body', body);
        updateFile(req.url.match(/\/(\w+)\.csv/)[1], body);
        res.end('done');
      });
  }
});

async function syncOneIndex(index) {
  const response = await fetch(`http://127.0.0.1:3000/index/${index}.csv`);
  const csvFile = await response.text();
  const csvLines = csvFile.split('\n');
  const csvLinesWithoutHeader = csvLines.slice(1);
  const lastDay = new Date(csvLinesWithoutHeader[0].split(',')[0]);
  const today = new Date();
  console.log('syncOneIndex()', lastDay.toISOString(), today.toISOString());
  await fetchThenPost(index, lastDay, today);
}

function fetchThenPost(index, startDate, endDate) {
  // https://www.wsj.com https://www.wsj.com/market-data/quotes/index/SPX/historical-prices
  const dateToString = date => date.toLocaleString('en-US', {
    year:'numeric', month:'2-digit', day: '2-digit'
  });
  const rowCount = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1;
  const path = `/market-data/quotes/index/${INDICES[index]}/historical-prices/download` +
    `?MOD_VIEW=page&num_rows=${rowCount}&range_days=${rowCount}` +
    `&startDate=${dateToString(startDate)}` +
    `&endDate=${dateToString(endDate)}`;
  return fetch(path).then(x => x.text()).then(csvText => {
    return fetch(`http://127.0.0.1:3000/index/${index}.csv`, {
      method: 'POST',
      mode: 'no-cors',
      body: csvText
    });
  });
}

async function updateFile(index, csvText) {
  const filePath = path.resolve(import.meta.dirname, `../index/${index}.csv`);
  const csvFile = await fs.promises.readFile(filePath, 'ascii');
  const csvLines = csvFile.split('\n');
  const csvLinesWithoutHeader = csvLines.slice(1);
  let lastDay = new Date(csvLinesWithoutHeader[0].split(',')[0]);

  const headerLineCount = 1;
  console.log(`index: ${index}`);
  console.log(csvText);
  const recordsFromWsj = csvText.split('\n').slice(headerLineCount);
  let duplicateLineCount = 0;
  for (let i = recordsFromWsj.length - 1; i >= 0; i--) {
    const line = recordsFromWsj[i];
    const date = new Date(line.split(',')[0]);
    if (date > lastDay) {
      break;
    } else {
      duplicateLineCount++;
    }
  }
  const newRecords = recordsFromWsj.slice(0, recordsFromWsj.length - duplicateLineCount);

  const fileContent = [
    csvLines[0],
    ...newRecords,
    ...csvLinesWithoutHeader,
  ].join('\n');
  await fs.promises.writeFile(filePath, fileContent);
}

const urls = ['https://www.wsj.com https://www.wsj.com/market-data/quotes/index/SPX/historical-prices'];
console.log(`Please go to ${urls} then run:`);
console.log(syncOneIndex.toString())
console.log(fetchThenPost.toString())
// console.log(`fetchThenPost('SPX', new Date('2024-05-01'), new Date('2024-09-20'));`)
// console.log(`syncOneIndex('SPX');`)
console.log(`const INDICES = ${JSON.stringify(INDICES)};`);
console.log(`
(async () => {
  for(const index in INDICES) {
    await syncOneIndex(index);
    console.info(index, 'updated');
    await (ms => new Promise((resolve) => setTimeout(resolve, ms)))(1000+Math.floor(Math.random() * 400));
  }
})();
`);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
