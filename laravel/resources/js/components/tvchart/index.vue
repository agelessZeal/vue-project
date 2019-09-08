<template>
  <div id="tv_container">
  </div>
</template>

<script>
  import {widget as TvWidget} from '../../assets/plugins/tradingview/charting_library/charting_library.min'
  import datafeeds from './datafeeds/datafees.js'

  export default {
    data() {
      return {
        widget: null,
        datafeeds: new datafeeds(this),
        symbol: null,
        interval: 5,
        cacheData: {},
        lastTime: null,
        getBarTimer: null,
        isLoading: true,
        startTime:null,
        endTime:null,
        marketName: this.$store.state.market.currentMarket
      }
    },

    mounted() {
      this.$store.watch((state) => state.socket.isConnected, this.initConnection, {deep: true});
      this.$store.watch((state) => state.socket.message, this.onMessage, {deep: true});
      this.$store.watch((state) => state.market.currentMarket, this.onChangeTv, {deep: true});
    },
    created() {
    },
    methods: {

      initConnection() {
        this.init();
      },
      onChangeTv(marketName) {
        this.marketName = marketName;
        this.startTime = 0;
        this.endTime = 0;
        this.widget = null;
        this.init();
      },

      sendKlineQuery(start, end) {
        if(Math.abs(this.startTime - start)<20 && Math.abs(this.endTime - end)<20) return;
        this.startTime = start;
        this.endTime = end;
        let startTime = start ? start : this.getTime() - this.interval * 60 * 10;
        let endTime = end ? end: this.getTime();
        if(parseInt(startTime).toString().length < 8 ){
          startTime = startTime*1000;
        }
        if(parseInt(endTime).toString().length < 8 ){
          endTime = endTime*1000;
        }
        this.$socket.send(JSON.stringify({
            'method': 'kline.query',
            params: [
              this.marketName,//market name
              startTime, //from time
              endTime, ///end time
              this.interval * 60 // interval
            ],
            id: this.$gP.KLINE_QUERY
          }
        ));
      },
      sendKlineSubscribe() {
        this.$socket.send(JSON.stringify({
            'method': 'kline.subscribe',
            params: [this.marketName, this.interval * 60],
            id: this.$gP.KLINE_SUBSCRIBE
          }
        ));
      },

      unKlineSubscribe() {
        this.$socket.send(JSON.stringify({
            'method': 'kline.unsubscribe',
            params: [],
            id: this.$gP.KLINE_UNSUBSCRIBE
          }
        ));
      },
      onMessage(msg) {
        let resInfo = JSON.parse(msg);
        if (resInfo.id == this.$gP.KLINE_QUERY) {
          if(resInfo.error == null) {
            this.klineDataUpdate(resInfo.result);
            this.unKlineSubscribe();
            this.sendKlineSubscribe();
          } else {
            console.log("Can't get kline data from server:" + this.marketName);
            console.error(resInfo.error.message + " Kline Data API");
          }
        }

        if (resInfo.method == 'kline.update') {
          this.klineDataUpdate(resInfo.params);
          this.datafeeds.barsUpdater.updateData()
        }
      },

      klineDataUpdate(data) {
        const list = [];
        if(data){
          const ticker = `${this.marketName}-${this.interval}`;
          if(this.cacheData[ticker]) {
            data.forEach(function (elem) {
              const cachedEndTime = this.cacheData[ticker][this.cacheData[ticker].length-1].time;
              if(elem[0]>cachedEndTime && elem[7] == this.marketName){
                const newBar = {
                  time: elem[0]*1000,
                  open: Number(elem[1]),
                  close: Number(elem[2]),
                  high: Number(elem[3]),
                  low: Number(elem[4]),
                  volume: Number(elem[5])
                  // volume: Math.random()*20
                };
                this.cacheData[ticker].push(newBar);
                list.push(newBar);
              }
            },this)
          }else{
            data.forEach(function (element) {
              if(element[7] == this.marketName) {
                list.push({
                  time: element[0]*1000,
                  open: Number(element[1]),
                  close: Number(element[2]),
                  high: Number(element[3]),
                  low: Number(element[4]),
                  volume: Number(element[5])
                  // volume: Math.random()*20
                })
              }
            }, this);
            this.cacheData[ticker] = list;
          }
          if(list.length>0){
            this.lastTime = list[list.length - 1].time;
          }
        }
      },

      init() {
        if (!this.widget) {
          this.widget = new TvWidget({
            symbol: this.marketName,
            interval: this.interval,
            container_id: 'tv_container',
            datafeed: this.datafeeds,
            library_path: './js/tradingview/charting_library/',
            disabled_features: ['header_symbol_search'],
            enabled_features: [],
            timezone: 'Asia/Shanghai',
            locale: 'en',
            debug: false
          });
        }
      },
      getBars(symbolInfo, resolution, rangeStartDate, rangeEndDate, onLoadedCallback) {
        if(resolution == '1D' || resolution == 'D') {
          this.interval = 1440;
        }else{
          this.interval = Number(resolution);
        }
        const ticker = `${this.marketName}-${this.interval}`;
        if (this.cacheData[ticker]) {
          this.isLoading = false;
          const newBars = [];
          this.cacheData[ticker].forEach(item => {
            if (item.time >= rangeStartDate*1000 && item.time <= rangeEndDate*1000) {
              newBars.push(item)
            }
          });
          // console.log(newBars);
          onLoadedCallback(newBars)
        } else {
          const self = this;
          this.sendKlineQuery(rangeStartDate, rangeEndDate);
          this.getBarTimer = setTimeout(function () {
            self.getBars(symbolInfo, resolution, rangeStartDate, rangeEndDate, onLoadedCallback)
          }, 500)
        }
      },
      getTime() {
        return parseInt(Date.now() / 1000);
      }
    }
  }
</script>

