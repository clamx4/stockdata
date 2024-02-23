import fs from 'fs';

const sleep = async millisecond => {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
};

const INDICES = {
  'SPX': 'SPX',
  'NDX': 'NDX',
  'DAX': 'DX/XETR/DAX',
  'CAC40': 'FR/XPAR/PX1',
  'FTSE100': 'UK/FTSE%20UK/UKX',
  'HSI': 'HK/XHKG/HSI',
  'NIKKEI': 'JP/XTKS/NIK',
};

const getUrl = (index, startDate, endDate) => {
  const startDateStr = startDate.toISOString().substring(0, 10);
  const endDateStr = endDate.toISOString().substring(0, 10);
  return `https://www.wsj.com/market-data/quotes/index/${INDICES[index]}/historical-prices/download\
?num_rows=1000&startDate=${startDateStr}&endDate=${endDateStr}`;
};

const update = async index => {
  const dataFolder = 'index';
  const filePath = `./${dataFolder}/${index}.csv`;
  const csvFile = await fs.promises.readFile(filePath, 'ascii');
  const csvLines = csvFile.split('\n');
  const csvLinesWithoutHeader = csvLines.slice(1);
  let lastDay = new Date(csvLinesWithoutHeader[0].split(',')[0]);

  const oneYearLater = new Date(lastDay.valueOf() + 365 * 24 * 3600_000);
  const csvText = await getCsvFromWsj(index, lastDay, oneYearLater);
  await sleep(100);
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

  const latestDay = new Date(newRecords[0].split(',')[0]);
  if (new Date(latestDay.valueOf() + 5 * 24 * 3600_000) < new Date()) {
    await update(index);
  }
};

const getCsvFromWsj = async (index, startDate, endDate) => {
  const url = getUrl(index, startDate, endDate);
  const result = await fetch(url, {
    headers: {
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    }
  });
  return await result.text();
};

for(const index in INDICES) {
  await update(index);
  console.info(index, 'updated');
}

