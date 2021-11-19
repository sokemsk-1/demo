// UUID
const SERVICE_UUID = "d5875408-fa51-4763-a75d-7d33cecebc31";
const RX_CHARACTERISTIC_UUID = "a4f01d8c-a037-43b6-9050-1876a8c23584";
const TX_CHARACTERISTIC_UUID = "a4f01d8c-a037-43b6-9050-1876a8c23584";

// Characteristic
let txCharacteristic;
let rxCharacteristic;

let searchButton;
let readButton;

let loading;


var calVal = 100;
var maxRangeVal = 100;
var minRangeVal = 40;

var mouseVal = [];

var ar_num = [];
var ar_yVal = [];
var ar_xVal = [];
var ar_xyVal = [{
  x: 0,
  y: 0
}];
/*
document.getElementById("contents").onclick = serchBLE()
$('.contents').on('click','.search-button',function(){
  serchBLE();
});
*/
Chart.pluginService.register({
    beforeDraw: function(c){
        if (c.config.options.chartArea && c.config.options.chartArea.backgroundColor) {
            var ctx = c.chart.ctx;
            var chartArea = c.chartArea;
            ctx.fillStyle = "rgba(255, 255, 255, 1)";           // 外側背景色の指定
            ctx.fillRect(0, 0, c.chart.width, c.chart.height);  // 外側背景色描画
            ctx.save();
            ctx.fillStyle = c.config.options.chartArea.backgroundColor;
            ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
            ctx.restore();
        }
    }
});

function init() {
  searchButton = document.querySelector(".search-button");
  searchButton.addEventListener("click", searchBLE);
}


// search & connect
function searchBLE() {

  // acceptAllDevicesの場合optionalServicesが必要みたい
  navigator.bluetooth.requestDevice({
      optionalServices: [SERVICE_UUID],
      acceptAllDevices: true
    })

    .then(device => {
      console.log("devicename:" + device.name);
      console.log("id:" + device.id);

      // 選択したデバイスに接続
      return device.gatt.connect();
    })

    .then(server => {
      console.log("success:connect to device");

      // UUIDに合致するサービス(機能)を取得
      return server.getPrimaryService(SERVICE_UUID);
    })

    .then(service => {
      console.log("success:service");
      // UUIDに合致するキャラクタリスティック(サービスが扱うデータ)を取得
      // 配列で複数のキャラクタリスティックの取得が可能
      return Promise.all([
        service.getCharacteristic(RX_CHARACTERISTIC_UUID),
        service.getCharacteristic(TX_CHARACTERISTIC_UUID)
      ]);

    })
    .then(characteristic => {
      console.log("success:txcharacteristic");

      rxCharacteristic = characteristic[0];
      txCharacteristic = characteristic[1];

      console.log("success:connect BLE");
      loading.className = "hide";
    })

    .catch(error => {
      console.log("Error : " + error);

      // loading非表示
      loading.className = "hide";
    });
}

//グローバル変数に変更した
let message;

function readValueBLE() {
  let message;

  try {
    rxCharacteristic.readValue()
      .then(value => {
        message = value.buffer;
        console.log(new Uint8Array(message));
        var value = new TextDecoder("utf-8").decode(message)
        var num = parseInt(value, 10);
        console.log(num);
        document.getElementById("data-form").value = new TextDecoder("utf-8").decode(message);
      });
  } catch (e) {
    console.log(e);
  }
}

function writeValueBLE() {
  var form_d = document.getElementById("data-form").value;
  var ary_u8 = new Uint8Array(new TextEncoder("utf-8").encode(form_d));
  console.log(ary_u8);
  try {
    txCharacteristic.writeValue(ary_u8);
  } catch (e) {
    console.log(e);
  }
}

window.addEventListener("load", init);

window.onload = function() {

  var dps = []; //dataPoints
  var chart = new CanvasJS.Chart();

  var chart3 = new CanvasJS.Chart();
  var xVal = 0;
  var yVal = 255;
  //下記は2000[ms](2秒)ごとにグラフを更新するように変数を指定。
  //ESP32からも2秒ごとにデータを送信するようにしているので、intervalの時間を合わせておくとわかりやすい。
  var updateInterval = 100;
  var dataLength = 10;
  var updateChart = function(count) {

    try {
      rxCharacteristic.readValue()
        .then(value => {
          message = value.buffer;
          console.log(new Uint8Array(message));
          document.getElementById("data-form").value = new TextDecoder("utf-8").decode(message);
        });
    } catch (e) {
      console.log(e);
    }

    count = count || 1;

    for (var j = 0; j < count; j++) {

      //ESP32からBLEで送られてきたデータをInt型に変換し、変数にnumに代入//
      var value = new TextDecoder("utf-8").decode(message)
      var num = parseInt(value, 10);
      console.log(num);
      ///////////////////////////////////////////////////////////

      yVal = num;
      /*ar_num.push(num);
      if (ar_num.length === 5000) {
        ar_num.shift();
      }
      console.log(ar_num.length);*/

      dps.push({
        x: xVal / 10, //intervalが2秒なのでこうした
        y: yVal
      });
      xVal++;
    }

    if (dps.length > dataLength) {
      dps.shift();
    }

    chart.render();
  }

  updateChart(dataLength);
  setInterval(function() {
    updateChart()
  }, updateInterval);

}

///////////////////////////////////////////////////////////
var chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

/*
function randomScalingFactor() {
    return (Math.random() > 0.5 ? 1.0 : -1.0) * Math.round(Math.random() * 100);
}
*/

function onRefresh(chart) {

  try {
    rxCharacteristic.readValue()
      .then(value => {
        message = value.buffer;
        /*console.log(new Uint8Array(message));*/
        if ((typeof message == 'number') && !isNaN(message)) {
          document.getElementById("data-form").value = new TextDecoder("utf-8").decode(message);
        }
      });
  } catch (e) {
    //console.log(e);
  }

  var value = new TextDecoder("utf-8").decode(message)
  var num = parseInt(value, 10);
  /*console.log(num);*/

  /*  yVal = calVal - Math.round((2.3449 - (num - (-176.146606)) / (1233.338644)) / 0.025 * 10) / 10;*/
  yVal = Math.round((calVal - 100 + ((0.142838511 + 0.000810796 * num) / 0.025)) * 10) / 10;
  //yVal = calVal + (yVal - 100);
  //console.log(calVal);
  //console.log(yVal);
  /*console.log(ar_num);*/

  chart.config.data.datasets.forEach(function(dataset) {
    dataset.data.push({
      x: Date.now(),
      /*y: num //y軸の値はESP32から送られてくるデータ*/
      /*y: Math.round((0.588-(num-(-315.8225711))/(4214.142414))/-0.01*10)/10 //y軸の値はESP32から送られてくるデータ*/
      /*y: -6-(2.3449-(num-(-176.146606))/(1233.338644))/0.025*/
      y: yVal

    });
  });
}


var color = Chart.helpers.color;
var config = {
  type: 'line',
  data: {
    datasets: [{
      label: 'Dataset 1 (linear interpolation)',
      radius: 1,
      backgroundColor: color(chartColors.red).alpha(0.5).rgbString(),
      borderColor: chartColors.red,
      fill: true,
      lineTension: 0,
      borderWidth: 1,
      borderDash: [1, 1],
      data: []
    }]
  },
  options: {
    title: {
      display: false,
      text: 'Line chart Rev,210331'
    },
    // グラフエリアのオプション
    chartArea: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)'
    },
    scales: {
      xAxes: [{
        type: 'realtime',

        realtime: {
          duration: 300000,
          refresh: 100,
          delay: 100,
          onRefresh: onRefresh
        }
      }],
      yAxes: [{
        scaleLabel: { // 軸ラベル
          display: true,
          labelString: 'レベル[dB]'
        },
        //scaleLabel: {
        //    display: true,
        //    labelString: 'value'
        //}

        ticks: {
          max: maxRangeVal,
          min: minRangeVal,
          stepSize: 10
        }
      }]
    },
    tooltips: {
      mode: 'nearest',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: false
    },
    maintainAspectRatio: false, //これを追加,
    events: ['click'],
    onClick: function(e, el) {
      if (!el || el.length === 0) return;
      //console.log(e);
      mouseVal = e;
    }
  }

};

var config2 = {
  type: 'line',
  data: {
    datasets: [{
      label: 'Dataset 1 (linear interpolation)',
      radius: 1,
      backgroundColor: color(chartColors.grey).alpha(0.5).rgbString(),
      borderColor: chartColors.grey,
      fill: true,
      lineTension: 0,
      borderWidth: 1,
      borderDash: [1, 1],
      data: []
    }]
  },
  options: {
    title: {
      display: false,
      text: 'Line chart Rev,210331'
    },
    // グラフエリアのオプション
    chartArea: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)'
    },
    scales: {
      xAxes: [{
        type: 'realtime',

        realtime: {
          duration: 1800000,
          refresh: 100,
          delay: 1000,
          onRefresh: onRefresh
        }
      }],
      yAxes: [{
        scaleLabel: { // 軸ラベル
          display: true,
          labelString: 'レベル[dB]'
        },

        ticks: {
          max: maxRangeVal,
          min: minRangeVal,
          stepSize: 10
        }
      }]
    },
    tooltips: {
      mode: 'nearest',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: false
    },
    maintainAspectRatio: false //これを追加
  }
};


function onRefresh3() {
  ar_num = [];
  var objTable = document.getElementById('tableArea');
  objTable.rows[1].cells[0].innerHTML = 0;
  objTable.rows[1].cells[1].innerHTML = 0;
  objTable.rows[1].cells[2].innerHTML = 0;
  objTable.rows[1].cells[3].innerHTML = 0;
  objTable.rows[1].cells[4].innerHTML = 0;
  objTable.rows[1].cells[5].innerHTML = 0;
  objTable.rows[1].cells[6].innerHTML = ar_num.length;
};

function arrGet() {
  if ((typeof yVal == 'number') && !isNaN(yVal)) {
    ar_num.push(yVal);
  }

  if (ar_num.length === 6001) {
    ar_num.shift();
  }
}

function tableReflesh() {
  if (ar_num.length) {
    var objTable = document.getElementById('tableArea');
    ar_yVal = ar_num;
    ar_yVal.sort((a, b) => a - b);

    objTable.rows[1].cells[0].innerHTML = Math.round(Math.max.apply(null, ar_yVal) * 10) / 10;
    objTable.rows[1].cells[1].innerHTML = get_percentile(95, ar_yVal);
    objTable.rows[1].cells[2].innerHTML = get_percentile(90, ar_yVal);
    objTable.rows[1].cells[3].innerHTML = get_percentile(50, ar_yVal);
    objTable.rows[1].cells[4].innerHTML = get_percentile(5, ar_yVal);
    objTable.rows[1].cells[5].innerHTML = Math.round(Math.min.apply(null, ar_yVal) * 10) / 10;
    objTable.rows[1].cells[6].innerHTML = ar_yVal.length;

    //console.log(ar_num.length);
    //console.log(ar_yVal.length);
  }
};

function get_percentile($percentile, $array) {
  $index = ($percentile / 100) * $array.length;
  if (Math.floor($index) == $index) {
    $result = ($array[$index - 1] + $array[$index]) / 2;
  } else {
    $result = $array[Math.floor($index)];
  }
  return Math.round($result * 10) / 10;
}

function getLp() {
  let LpElement = document.getElementById("LpDisp");

  if ((typeof yVal == 'number') && !isNaN(yVal)) {
    LpElement.value = Math.round(yVal * 10) / 10;
  } else {
    LpElement.value = 0;
  }
};

function ChangeCal() {
  calVal = document.getElementById('cal').value;
  calVal = parseFloat(calVal);
  //console.log(document.getElementById('cal').value);
};

window.onload = function() {

  var ctx = document.getElementById('myChart').getContext('2d');
  //var ctx2 = document.getElementById('myChart2').getContext('2d');

  window.myChart = new Chart(ctx, config);
  //window.myChart2 = new Chart(ctx2, config2);
};
