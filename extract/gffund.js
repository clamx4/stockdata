(async () => {
  const fetchWithStartEnd = (start, end) => fetch(`https://www.gffunds.com.cn/apistore/JsonService?service=MarketPerformance&method=NAV&op=queryNAVByFundcode&fundcode=512910&startdate=${start}&enddate=${end}&curpage=1&orderby=NAVDATE_DESC&pagelines=30`, {
    "headers": {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest"
    },
    "referrer": "https://www.gffunds.com.cn/funds/?fundcode=512910",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
  });
  const netValueList = [];
  for (let year = 2019; year <= 2024; year++) {
    for (let month = 1; month <= 12; month++) {
      const start1 = `${year}${(month).toString().padStart(2, 0)}02`;
      const end1 = `${year}${(month).toString().padStart(2, 0)}15`;
      const start2 = `${year}${(month).toString().padStart(2, 0)}16`;
      const end2 = `${month === 12 ? year + 1 : year}${(month%12+1).toString().padStart(2, 0)}01`;
      console.log(start1, end1);
      const response = await fetchWithStartEnd(start1, end1);
      const responseJson = await response.json();
      if (Array.isArray(responseJson.data)) {
        netValueList.unshift(...responseJson.data)
        console.log(netValueList.length, responseJson.data.length, netValueList.map(x=>x.NAVDATE))
      } else {
        console.log(`empty, start=${start1}, end=${end1}`)
      }
      console.log(start2, end2);
      const response2 = await fetchWithStartEnd(start2, end2);
      const responseJson2 = await response2.json();
      if (Array.isArray(responseJson2.data)) {
        netValueList.unshift(...responseJson2.data)
        console.log(netValueList.length, responseJson2.data.length, netValueList.map(x=>x.NAVDATE))
      } else {
        console.log(`empty, start=${start2}, end=${end2}`)
      }
    }
  }
  console.log('newValueList');
  console.log(netValueList);
})();
