const SensorType = {
  sTemp: 0,
  sWet: 1,
  sEC: 2,
  leaf: 3
};

var tempChart;
var wetChart;
var ECChart;
var leafChart;



function request() {
  var startTime = timeSelector.startTimeDay.value.replace(/-/g, "/") + " " + timeSelector.startTimeMinute.value;
  var endTime = timeSelector.endTimeDay.value.replace(/-/g, "/") + " " + timeSelector.endTimeMinute.value;
  getJapanHistoryData(startTime, endTime);
}

function getJapanHistoryData(start, end) {
  var queryString = '?start=' + start + '&end=' + end;
  $.ajax('/field/japan/log' + queryString, {
    method: 'GET',
  }).done(function(body) {
    console.log(body);
    var label = [];
    var sTempData = [];
    var sWetData = [];
    var sECData = [];
    var leafData = [];
    for (var i = 0; i < body.length; i++) {
      var record = body[i];
      label.push(record.time);
      sTempData.push(record.sTemp);
      sWetData.push(record.sWet);
      sECData.push(record.sEC);
      leafData.push(record.leaf);
    }
    showInFigure(label, sTempData, '土壤温度(℃)', 'rgba(255,99,132,1)', tempChart);
    showInFigure(label, sWetData, '土壤湿度(%VWC)', 'rgba(20,20,20,1)', wetChart);
    showInFigure(label, sECData, '土壤导电率(dS/m)', 'rgba(99,132,255,1)', ECChart);
    showInFigure(label, leafData, '叶面湿度(counts)', 'rgba(255,12,255,1)', leafChart);
  });
}

function showInFigure(label, info, title, borderColor, chart) {
  var data_label = label;
  var data_data = info;
  var data_title = title;

  var data = {
    labels: data_label,
    datasets: [{
      label: data_title,
      data: data_data,
      backgroundColor: [
        'rgba(200, 200, 200, 0.2)'
      ],
      borderColor: [
        borderColor
      ],
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
  };
  tempChart = new Chart(document.getElementById('myChartTemp').getContext("2d"), {
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
    },
  });
  wetChart = new Chart(document.getElementById('myChartWet').getContext("2d"), {
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
    },
  });
  ECChart = new Chart(document.getElementById('myChartEC').getContext("2d"), {
    type: 'line',
    options: {
      scales: {
        yAxes: [{
          ticks: {
            min: 0.5,
            max: 1
          }
        }]
      },
      maintainAspectRatio: false,
      cubicInterpolationMode: 'monotone',
    },
  });
  leafChart = new Chart(document.getElementById('myChartLeaf').getContext("2d"), {
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
    },
  });
});