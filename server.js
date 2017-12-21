const Koa = require('koa');
const Router = require('koa-router');
const request = require('request');
const koaBody = require('koa-body');
var kafka = require('kafka-node');
var Producer = kafka.Producer;
var render = require('koa-ejs');
const serve = require('koa-static');
var path = require('path');
var csv = require("fast-csv");
var fs = require('fs');

const app = new Koa();
render(app, {
  root: path.join(__dirname, 'view'),
  layout: false,
  viewExt: 'html',
  cache: false,
  debug: false
});

const router = new Router();

const Code = {
  NotLogin: 0,
};

var token = '';

const sensorCurrentInfoUrl = 'https://app-v1-production.vegetalia.jp/field/summary_list';
const seneorHistoryInfoUrl = 'https://app-v1-production.vegetalia.jp/fs/log?pointid=12926&';
const loginUrl = 'https://app-v1-production.vegetalia.jp/user/login';

function login() {
  console.log('login');
  var options = {
    url: loginUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'uuid=1305ec0dc842445ba86558706558181a',
  };
  return new Promise(function(resolve, reject) {
    request(options, function(error, response) {
      if (!error) {
        var setcookie = response.headers["set-cookie"];
        var cookie = setcookie[1].split(';')[0];
        token = cookie.split('=')[1];
        resolve();
      } else {
        reject(error);
      }
    });
  });
}

function getSensorCurrentInfo() {
  var options = {
    url: sensorCurrentInfoUrl,
    method: 'GET',
    headers: {
      'Cookie': 'vegetaliaapp=' + token,
    },
  };
  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      if (!error) {
        var bodyObj;
        try {
          bodyObj = JSON.parse(body);
        } catch (error) {

        }
        if (!bodyObj || bodyObj.code !== '200') {
          resolve(Code.NotLogin);
        } else {
          resolve(bodyObj);
        }
      } else {
        console.log(error);
      }
    });
  });
}

function getSensorHistoryInfo(query) {
  var options = {
    url: seneorHistoryInfoUrl + query,
    method: 'GET',
    headers: {
      'Cookie': 'vegetaliaapp=' + token,
    },
  };
  return new Promise(function(resolve, reject) {
    request(options, function(error, response, body) {
      if (!error) {
        var bodyObj;
        try {
          bodyObj = JSON.parse(body);
        } catch (error) {

        }
        if (!bodyObj || bodyObj.code !== '200') {
          resolve(Code.NotLogin);
        } else {
          resolve(bodyObj);
        }
      } else {
        console.log(error);
      }
    });
  });
}

function filterSensorCurrentInfo(bodyObj) {
  var sensors = bodyObj.data[0].sensor;
  var sensorInfo = [];
  for (var i = 0; i < sensors.length; i++) {
    var sensor = sensors[i];
    if (sensor.name === '葉面濡れ' && sensor.value) {
      sensor.name = '叶面湿度';
      sensorInfo.push(sensor);
    }
    if (sensor.name === '土壌水分' && sensor.value) {
      sensor.name = '土壤水分';
      sensorInfo.push(sensor);
    }
    if (sensor.name === '土壌温度' && sensor.value) {
      sensor.name = '土壤温度';
      sensorInfo.push(sensor);
    }
    if (sensor.name === '土壌EC' && sensor.value) {
      sensor.name = '土壤可溶性盐浓度';
      sensorInfo.push(sensor);
    }
  }
  return {
    sensorName: bodyObj.data[0].name,
    sensorInfo: sensorInfo,
  };
}

function filterSensorHistoryInfo(bodyObj) {
  var info = bodyObj.data;
  var sensorInfo = [];
  for (var i = 0; i < info.length; i++) {
    var sensor = info[i];
    if (sensor.name === '葉面濡れ' && sensor.data.length !== 0) {
      sensor.name = '叶面湿度';
      sensorInfo.push(sensor);
    }
    if (sensor.name === '土壌水分' && sensor.data.length !== 0) {
      sensor.name = '土壤水分';
      sensorInfo.push(sensor);
    }
    if (sensor.name === '土壌温度' && sensor.data.length !== 0) {
      sensor.name = '土壤温度';
      sensorInfo.push(sensor);
    }
    if (sensor.name === '土壌EC' && sensor.data.length !== 0) {
      sensor.name = '土壤可溶性盐浓度';
      sensorInfo.push(sensor);
    }
  }
  return {
    sensorInfo: sensorInfo,
  };
}

function getCsvData(file, start, end) {
  return new Promise(function(resolve, reject) {
    var stream = fs.createReadStream(file);
    var res = [];
    var csvStream = csv({
        objectMode: true,
        headers: true,
      })
      .on("data", function(data) {
        console.log(Date.parse(data.time));
        if (Date.parse(data.time) >= start && Date.parse(data.time) <= end) {
          res.push(data);
        }
      })
      .on("end", function() {
        resolve(res);
      });

    stream.pipe(csvStream);
  });
}

function sendIntoKafka(data) {
  console.log('send to kafka');
  var client = new kafka.Client();
  var producer = new Producer(client);
  var message = data.sensorInfo['土壌EC'] + ',' +
    data.sensorInfo['土壌温度'] + ',' +
    data.sensorInfo['土壌水分'] + ',' +
    data.sensorInfo['葉面濡れ'];
  var payloads = [{ topic: 'sensor', messages: message }];
  producer.on('ready', function() {
    producer.send(payloads, function(err, data) {
      producer.close();
    });
  });

  producer.on('error', function(err) {
    console.log(err);
  });
}

async function timer() {
  var data;
  var res = await getSensorCurrentInfo();
  if (res === Code.NotLogin) {
    await login();
    data = await getSensorCurrentInfo();
  } else {
    data = res;
  }
  sendIntoKafka(filterSensorCurrentInfo(data));
}

// send into kafka timer
// setInterval(timer, 5000);
// 
app.use(serve(__dirname + '/static'));

router
  .post('/field/login', koaBody(), async function(ctx) {
    var loginInfo = JSON.parse(ctx.request.body);
  })
  .get('/field/summary_list', async function(ctx) {
    var data;
    var res = await getSensorCurrentInfo();
    if (res === Code.NotLogin) {
      await login();
      data = await getSensorCurrentInfo();
    } else {
      data = res;
    }
    ctx.status = 200;
    ctx.body = filterSensorCurrentInfo(data);
  })
  .get('/field/log', async function(ctx) {
    var data;
    var res = await getSensorHistoryInfo(ctx.querystring);
    if (res === Code.NotLogin) {
      await login();
      data = await getSensorHistoryInfo(ctx.querystring);
    } else {
      data = res;
    }
    ctx.status = 200;
    ctx.body = filterSensorHistoryInfo(data);
  })
  .get('/field/japan/log', async function(ctx) {
    var start = Date.parse(ctx.query.start);
    var end = Date.parse(ctx.query.end);
    console.log(start);
    console.log(end);
    var type = ctx.query.type;
    var res = await getCsvData("./static/2.csv",start, end);
    ctx.status = 200;
    ctx.body = res;
    console.log(res);
  })
  .get('/field/qinghai/log', async function(ctx) {
    var start = Date.parse(ctx.query.start);
    var end = Date.parse(ctx.query.end);
    console.log(start);
    console.log(end);
    var type = ctx.query.type;
    var res = await getCsvData("./static/nuomuhong.csv",start, end);
    ctx.status = 200;
    ctx.body = res;
    console.log(res);
  })
  .get('/', async function(ctx) {
    await ctx.render('index');
  })
  .get('/duoba/history', async function(ctx) {
    await ctx.render('duoba');
  })
  .get('/japan/history', async function(ctx) {
    await ctx.render('japanhistory')
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);