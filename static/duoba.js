const SensorType = {
  sTemp: 0,
  sWet: 1,
  sEC: 2,
  leaf: 3
};

var wet2Chart;
var wet3Chart;
var wet4Chart;


function request() {
  var startTime = timeSelector.startTimeDay.value.replace(/-/g, "/") + " " + timeSelector.startTimeMinute.value;
  var endTime = timeSelector.endTimeDay.value.replace(/-/g, "/") + " " + timeSelector.endTimeMinute.value;
  getQinghaiHistoryData(startTime, endTime);
}

function getQinghaiHistoryData(start, end) {
  var queryString = '?start=' + start + '&end=' + end;
  $.ajax('/field/qinghai/log' + queryString, {
    method: 'GET',
  }).done(function(body) {
    console.log(body);
    var label = [];
    var wet2 = [];
    var wet3 = [];
    var wet4 = [];
    var wet_p2 = [];
    var wet_p3 = [];
    var wet_p4 = [];
    for (var i = 0; i < body.length; i++) {
      var record = body[i];
      label.push(record.time);
      wet2.push(record.wet2);
      wet3.push(record.wet3);
      wet4.push(record.wet4);
      wet_p2.push(record.wet_p2);
      wet_p3.push(record.wet_p3);
      wet_p4.push(record.wet_p4);
    }
    showInFigure(label, wet2, wet_p2, '监测点2土壤湿度(%)', '监测点2预测土壤湿度(%)', 'rgba(255,99,132,1)', 'rgba(99,132,255,1)', wet2Chart);
    showInFigure(label, wet3, wet_p3, '监测点3土壤湿度(%)', '监测点3预测土壤湿度(%)', 'rgba(255,99,132,1)', 'rgba(99,132,255,1)', wet3Chart);
    showInFigure(label, wet4, wet_p4, '监测点4土壤湿度(%)', '监测点4预测土壤湿度(%)', 'rgba(255,99,132,1)', 'rgba(99,132,255,1)', wet4Chart);
  });
}

function showInFigure(label, info, info_p , title, title2, borderColor, borderColor_p, chart) {
  var data_label = label;

  var data = {
    labels: data_label,
    datasets: [{
      label: title,
      data: info,
      backgroundColor: [
        'rgba(200, 200, 200, 0.2)'
      ],
      borderColor: [
        borderColor
      ],
      borderWidth: 2,
      pointRadius: 0
    },{
      label: title2,
      data: info_p,
      backgroundColor:['rgba(100, 100, 100, 0.2)'],
      borderColor: [borderColor_p],
      borderWidth: 2,
      pointRadius: 0
    }]
  };
  chart.data = data;
  chart.update();
}

$(document).ready(function() {
  var options = {
    // scales: {
    //     yAxes: [{
    //         ticks: {
    //             beginAtZero:true
    //         }
    //     }]
    // },
    maintainAspectRatio: false,
    cubicInterpolationMode: 'monotone',
    spanGaps: true,
  };
  wet2Chart = new Chart(document.getElementById('myChartWet2').getContext("2d"), {
    type: 'line',
    options: {
      scales: {
        yAxes: [{
          ticks: {
            min: 0
          }
        }]
      },
      maintainAspectRatio: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
    },
  });
  wet3Chart = new Chart(document.getElementById('myChartWet3').getContext("2d"), {
    type: 'line',
    options: {
      scales: {
        yAxes: [{
          ticks: {
            min: 0,
          }
        }]
      },
      maintainAspectRatio: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
    },
  });
  wet4Chart = new Chart(document.getElementById('myChartWet4').getContext("2d"), {
    type: 'line',
    options: {
      scales: {
        yAxes: [{
          ticks: {
            min: 0,
          }
        }]
      },
      maintainAspectRatio: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
    },
  });
});