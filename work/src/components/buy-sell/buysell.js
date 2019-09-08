import vueSlider from 'vue-slider-component'
import SlConfig from '../store/slider_options'
import OrderFormInput from '../sub/order-input-item/index'
import numeral from "numeral"; //https://www.npmjs.com/package/vue-slider-component
import axios from "axios";
import PageLoading from "../sub/pageloading/pageloading";

export default {
  name: 'BuySell',
  components: {
    'vue-slider': vueSlider,
    OrderFormInput,
    PageLoading
  },
  props: {},
  data() {
    return {
      isLimitMode: true,
      buy_value_limit: '0%',
      buy_value_market: '0%',
      sell_value_limit: '0%',
      sell_value_market: '0%',
      sl_ops: SlConfig,
      sl_ops_market: SlConfig,
      baseCoin: this.$store.state.market.baseCoin,
      fiatCoin: this.$store.state.market.fiatCoin,
      marketName:this.$store.state.market.currentMarket,
      baseCoinAmount: 0,
      fiatCoinAmount: 0,
      asstInfo: {},
      isLogin: false,
      currentTrans: [],
      buyPrice: 0,
      buyAmount: 0,
      buyEstValue: 0,
      buyPriceErr: false,
      buyAmountErr: false,
      buyPriceErrMsg: '',
      buyAmountErrMsg: '',
      sellPrice: 0,
      sellAmount: 0,
      sellEstValue: 0,
      sellPriceErr: false,
      sellAmountErr: false,
      sellPriceErrMsg: '',
      sellAmountErrMsg: '',

      marketBuyAmount: 0,
      marketSellAmount: 0,
      marketBuyErr: false,
      marketBuyErrMsg: '',
      marketSellErr: false,
      marketSellErrMsg: '',

      isEnableBuyBtn:false,
      isEnableSellBtn:false,

      tradeErrTitle:'This is Error Message!',
      tradeErrMsg:'You will not be able to do..',
      tradeSuccessTitle:'',
      tradeSuccessMsg:'',

      marketBuyPrice:0.0,

      showAjaxProgress:false,
    }
  },
  created() {
    this.$eventBus.$on('update-user-balance',(data)=>{
      if(data.user == userID) {
        console.log("We will update user\'s balance information");
        if(data.side == 1){ //sell
          this.asstInfo[this.fiatCoin] = Number(this.asstInfo[this.fiatCoin]) + Number(data.amount);
          this.fiatCoinAmount = Number(this.fiatCoinAmount) + Number(this.amount);
        } else { // buy
          this.asstInfo[this.baseCoin] = Number(this.asstInfo[this.baseCoin]) + Number(data.amount);
          this.baCoinAmount = Number(this.baCoinAmount) + Number(this.amount);
        }
      }
    });

    this.$eventBus.$on('select-price', (data) => {
      if (this.label_holder == 'Price') {
        this.marketBuyPrice = Number(data);
      }
    });

    this.$eventBus.$on('change-trade-info', (data) => {
      if (data.market_type == 'limit') {
        if (data.trade_type == 'buy') {
          if (data.value_type == 'Price') {
            this.buyPrice = Number(data.value);
            if (this.buyPrice == 0) {
              this.buyPriceErr = true;
              this.buyPriceErrMsg = 'Price should be larger than 0';
            } else {
              this.buyPriceErr = false;
              this.buyPriceErrMsg = '';
            }
          }
          if (data.value_type == 'Amount') {
            this.buyAmount = Number(data.value);
          }
          this.buyEstValue = Number(this.buyPrice * this.buyAmount).toFixed(8);
          if (this.baseCoinAmount < this.buyEstValue) {
            this.buyAmountErr = true;
            this.buyAmountErrMsg = 'Insufficient balance';
          } else {
            this.buyAmountErr = false;
            this.buyAmountErrMsg = '';
          }
        }
        if (data.trade_type == 'sell') {
          if (data.value_type == 'Price') {
            this.sellPrice = Number(data.value);
            if (this.sellPrice == 0) {
              this.sellPriceErr = true;
              this.sellPriceErrMsg = 'Price should be larger than 0';
            } else {
              this.sellPriceErr = false;
              this.sellPriceErrMsg = '';
            }
          }
          if (data.value_type == 'Amount') {
            this.sellAmount = Number(data.value);
            if (this.sellAmount > this.fiatCoinAmount) {
              this.sellAmountErr = true;
              this.sellAmountErrMsg = 'Insufficient balance';
            } else {
              this.sellAmountErr = false;
              this.sellAmountErrMsg = '';
            }
          }
          this.sellEstValue = Number(this.sellPrice*this.sellAmount).toFixed(8);
        }
      } else {
        if (data.value_type == 'Value') {
          this.marketBuyAmount = Number(data.value);
          if (this.marketBuyAmount > this.baseCoinAmount) {
            this.marketBuyErr = true;
            this.marketBuyErrMsg = 'Insufficient balance';
          } else {
            this.marketBuyErr = false;
            this.marketBuyErrMsg = '';
          }
        }
        if (data.value_type == 'Amount') {
          this.marketSellAmount = Number(data.value);
          if (this.marketSellAmount > this.fiatCoinAmount) {
            this.marketSellErr = true;
            this.marketSellErrMsg = 'Insufficient balance';
          } else {
            this.marketSellErr = false;
            this.marketSellErrMsg = '';
          }
        }
      }
      this.getCheckTradesBtn();
    });
  },

  computed: {},
  mounted() {
    this.checkIsLogin();
    this.$store.watch((state) => state.socket.isConnected, this.getCurrentAsset, {deep: true});
    this.$store.watch((state) => state.market.currentMarket, this.marketSelect, {deep: true});
    this.$store.watch((state) => state.socket.message, this.msgHandler, {deep: true});
  },
  methods: {

    initFormFields() {
      this.buyAmount = 0;
      this.buyEstValue = 0;
      this.buyPriceErr = false;
      this.buyAmountErr = false;
      this.buyPriceErrMsg = '';
      this.buyAmountErrMsg = '';
      this.sellAmount = 0;
      this.sellEstValue = 0;
      this.sellPriceErr = false;
      this.sellAmountErr = false;
      this.sellPriceErrMsg = '';
      this.sellAmountErrMsg = '';
      this.isEnableSellBtn = false;
      this.isEnableBuyBtn = false;
    },

    getCurrentAsset() {
      this.currentTrans.push(this.$gP.ASSET_QUERY);
      this.sendIDVerificationWeb();
    },

    marketSelect() {

      this.baseCoin = this.$store.state.market.baseCoin;
      this.fiatCoin = this.$store.state.market.fiatCoin;
      this.baseCoinAmount = 0;
      this.fiatCoinAmount = 0;
      this.marketBuyPrice = this.$store.state.market.curMarketPrice;
      this.marketName = this.$store.state.market.currentMarket;

      this.currentTrans = [];

      this.initFormFields();
      this.getAvailableAssetsCallback();
      this.getCheckTradesBtn();
    },
    onChangeMarketMode(mode) {

      this.isLimitMode = mode;
      this.initFormFields();
      this.getCheckTradesBtn();
      this.$eventBus.$emit('change-market-mode', 'change-market')

    },
    changeSliderBuyLimit() {
      let percentVal = Number(this.buy_value_limit.split("%")[0]);
      this.buyEstValue = this.baseCoinAmount * percentVal / 100;
      //calculate fiat coin amount....
      if(this.buyPrice == 0 || isNaN(this.buyPrice)){
        return;
      }
      let eventData = {
        'market_type':'limit',
        'trade_type': 'buy',
        'value_type': 'Amount',
        'value': this.buyEstValue/this.buyPrice
      };
      this.$eventBus.$emit('change-value-percent',eventData)
    },
    changeSliderSellLimit() {
      let percentVal = Number(this.sell_value_limit.split("%")[0]);
      //calculate fiat coin amount....
      if(this.sellPrice == 0 || isNaN(this.sellPrice)){
        return;
      }
      let eventData = {
        'market_type':'limit',
        'trade_type': 'sell',
        'value_type': 'Amount',
        'value': this.fiatCoinAmount * percentVal / 100
      };
      this.$eventBus.$emit('change-value-percent',eventData)
    },
    changeSliderBuyMarket() {
      let percentVal = Number(this.buy_value_market.split("%")[0]);
      let eventData = {
        'market_type':'market',
        'trade_type': 'buy',
        'value_type': 'Value',
        'value': this.baseCoinAmount * percentVal / 100
      };
      this.$eventBus.$emit('change-value-percent',eventData)
    },
    changeSliderSellMarket() {
      let percentVal = Number(this.sell_value_market.split("%")[0]);
      let eventData = {
        'market_type':'market',
        'trade_type': 'sell',
        'value_type': 'Amount',
        'value': this.fiatCoinAmount * percentVal / 100
      };
      this.$eventBus.$emit('change-value-percent',eventData)
    },
    sendIDVerificationWeb() {
      this.$socket.send(JSON.stringify({
        "method": "server.auth",
        "params": [webToken, webSource],
        "id": this.$gP.ID_VERIFICATION_WEB
      }));
    },

    sendAssetQuery() {
      this.$socket.send(JSON.stringify({
        "method": "asset.query",
        "params": [],
        "id": this.$gP.ASSET_QUERY
      }));
    },

    sendAssetHistory() { /////////////////////////////////////////?????????????????
      this.$socket.send(JSON.stringify({
        "method": "asset.history",
        "params": [this.baseCoin, ',', 0, 0, 0, 100],//asset, business, start_time, end_time, offset, limit
        "id": this.$gP.ASSET_HISTORY
      }));
    },

    sendAssetSubScribe() {
      this.$socket.send(JSON.stringify({
        "method": "asset.subscribe",
        "params": Object.keys(this.asstInfo),
        "id": this.$gP.ASSET_SUBSCRIBE
      }));
    },

    sendAssetUnSubScribe() {
      this.$socket.send(JSON.stringify({
        "method": "asset.unsubscribe",
        "params": [this.baseCoin],
        "id": this.$gP.ASSET_HISTORY
      }));
    },
    checkIsLogin() {
      if (webToken != "" && webSource != "" && userID!=null ) {
        this.isLogin = true;
      }
    },
    msgHandler() {
      let resInfo = JSON.parse(this.$store.state.socket.message);
      if (resInfo.id == this.$gP.ID_VERIFICATION_WEB) {
        this.dealTransactions(resInfo);
      } else if (resInfo.id == this.$gP.ASSET_QUERY) {
        for(let coinStr in resInfo.result){
          if(resInfo.result.hasOwnProperty(coinStr)){
            this.asstInfo[coinStr] = Number(resInfo.result[coinStr]['available']);
          }
        }

        //Processing Current Asset Info...
        this.getAvailableAssetsCallback();
        this.removeTransInfo(this.$gP.ASSET_QUERY);

        //Make Asset Subscribe Request
        this.currentTrans.push(this.$gP.ASSET_SUBSCRIBE);
        this.sendIDVerificationWeb();

      } else if (resInfo.id == this.$gP.ASSET_SUBSCRIBE) {
        if (resInfo.error == null && resInfo.result.status == 'success') { // asset subscribe request success.
          //remove transaction from transaction buffer.
          console.log('Removing Asset SubScribe Request From Transaction List');
          console.log(this.currentTrans);
          console.log('Removed Transaction ID:==============>' + this.$gP.ASSET_SUBSCRIBE);
          this.removeTransInfo(this.$gP.ASSET_SUBSCRIBE);
        }
      } else if (resInfo.method == 'asset.update') {
        //Update Assets Information.
        for (let i = 0;i<resInfo.params.length ; i++) {
          let assetObj = resInfo.params[i];
          let coinStrKeys = Object.keys(assetObj);
          for(let j = 0; j < coinStrKeys.length; j++) {
            console.error('Updating Asset Information:========>' + coinStrKeys[j]);
            if(assetObj.hasOwnProperty(coinStrKeys[j])){
              this.asstInfo[coinStrKeys[j]] = Number(assetObj[coinStrKeys[j]]['available']);
              if (coinStrKeys[j] == this.baseCoin) this.baseCoinAmount = Number(assetObj[coinStrKeys[j]]['available']);
              if (coinStrKeys[j] == this.fiatCoin) this.fiatCoinAmount = Number(assetObj[coinStrKeys[j]]['available']);
            }
          }
        }
      }
    },

    dealTransactions(msg) {
      if (msg.error == null && msg.result.status == 'success') {
        if (this.currentTrans.length > 0) {
          let transID = this.currentTrans[0];
          if (transID == this.$gP.ASSET_QUERY) {
            this.sendAssetQuery();
          } else if (transID == this.$gP.ASSET_SUBSCRIBE) {
            this.sendAssetSubScribe();
          }
        }
      }
    },

    removeTransInfo(transID) {
      if (this.currentTrans.length > 0) {
        let transInfoIndex = this.currentTrans.indexOf(transID);
        if (transInfoIndex > -1) {
          this.currentTrans.splice(transInfoIndex, 1); // Remove First Item
        }
      }
    },
    //Message Dealing Functions
    getAvailableAssetsCallback() {
      if (this.asstInfo.hasOwnProperty(this.baseCoin)) {
        this.baseCoinAmount = Number(this.asstInfo[this.baseCoin]);
      }
      if (this.asstInfo.hasOwnProperty(this.fiatCoin)) {
        this.fiatCoinAmount = Number(this.asstInfo[this.fiatCoin]);
      }
    },
    //////////////Buy&Sell Validation Process
    getLimitBuyValidationStatus(){
      this.isEnableBuyBtn  = this.baseCoinAmount>0 && !this.buyPriceErr && !this.buyAmountErr && this.buyPrice>0 && this.buyAmount>0 && this.buyEstValue>0;
    },
    getLimitSellValidationStatus(){
      this.isEnableSellBtn = this.fiatCoinAmount>0 && !this.sellPriceErr && !this.sellAmountErr && this.sellPrice>0 && this.sellAmount>0 && this.sellEstValue>0;
    },
    getMarketBuyValidationStatus(){
      this.isEnableBuyBtn = this.baseCoinAmount>0 && !this.marketBuyErr && this.marketBuyAmount>0 && this.marketBuyPrice>0;
    },
    getMarketSellValidationStatus(){
      this.isEnableSellBtn = this.fiatCoinAmount>0 && !this.marketSellErr && this.marketSellAmount>0;
    },
    getCheckTradesBtn() {
      if(this.isLogin){
        if(this.isLimitMode){
          this.getLimitBuyValidationStatus();
          this.getLimitSellValidationStatus();
        }else{
          this.getMarketBuyValidationStatus();
          this.getMarketSellValidationStatus();
        }
      }else{
        this.isEnableBuyBtn = false;
        this.isEnableSellBtn = false;
      }
    },
    ///Order Execution Functions
    sendLimitBuyRequest(){
      if(!this.isLogin) return;
      this.getLimitBuyValidationStatus();
      if(!this.isEnableBuyBtn) return;
      this.showAjaxProgress = true;
      let params=  {
        cmd:'limit',
        market:this.marketName,
        user_id:userID,
        side:2,
        amount:this.buyAmount,
        price:this.buyPrice
      };
      axios.post(apiURL,params).then(result => {
        let resp = result.data;
        if(resp.error == null && resp.result.user == userID) {
          //Update User Balance
          this.asstInfo[resp.result.market] = Number(this.asstInfo[resp.result.market]) - Number(resp.result.amount);
          this.baseCoinAmount = Number(this.baseCoinAmount) - Number(resp.result.amount);
          this.buyAmount = 0;
          this.$refs.buySliderLimit.setValue('0%');
          this.$eventBus.$emit('update-current-order',resp.result);

          this.tradeSuccessTitle = 'Congratulation!';
          this.tradeSuccessMsg = 'Your order has done successfully!';
          this.$modal.show('success-msg-modal');
        }else{
          this.tradeErrTitle = "Something went wrong!";
          this.tradeErrMsg = resp.error.message;
          this.$modal.show('error-msg-modal');
        }

        this.showAjaxProgress = false;

      }, error => {
        this.showAjaxProgress = false;
        this.tradeErrTitle = error.message;
        this.tradeErrMsg = 'Please check your network!';
        this.$modal.show('error-msg-modal');
      });
    },
    sendLimitSellRequest(){
      if(!this.isLogin) return;
      this.getLimitSellValidationStatus();
      if(!this.isEnableSellBtn) return;
      this.showAjaxProgress = true;
      let params=  {
        cmd:'limit',
        market:this.marketName,
        user_id:userID,
        side:1,
        amount:this.sellAmount,
        price:this.sellPrice
      };
      axios.post(apiURL,params).then(result => {
        let resp = result.data;
        if(resp.error == null && resp.result.user == userID) {
          //Update User Balance
          this.asstInfo[resp.result.market] = Number(this.asstInfo[resp.result.market]) - Number(resp.result.amount);
          this.fiatCoinAmount = Number(this.fiatCoinAmount) - Number(resp.result.amount);
          this.sellAmount = 0;
          //Update Current Order History
          this.$eventBus.$emit('update-current-order',resp.result);

          this.tradeSuccessTitle = 'Congratulation!';
          this.tradeSuccessMsg = 'Your order has done successfully!';
          this.$modal.show('success-msg-modal');
        }else{
          this.tradeErrTitle = "Something went wrong!";
          this.tradeErrMsg = resp.error.message;
          this.$modal.show('error-msg-modal');
        }
        this.showAjaxProgress = false;
      }, error => {
        this.showAjaxProgress = false;
        this.tradeErrTitle = error.message;
        this.tradeErrMsg = 'Please check your network!';
        this.$modal.show('error-msg-modal');
      });
    },
    sendMarketBuyRequest() {
      if(!this.isLogin) return;
      this.getMarketBuyValidationStatus();
      if(!this.isEnableBuyBtn) return;
      this.showAjaxProgress = true;
      let params=  {
        cmd:'market',
        market:this.marketName,
        user_id:userID,
        side:2,
        amount:this.marketBuyAmount,
        price:this.marketBuyPrice
      };
      axios.post(apiURL,params).then(result => {
        let resp = result.data;
        if(resp.error == null && resp.result.user == userID) {
          //Update User Balance
          this.asstInfo[resp.result.market] = Number(this.asstInfo[resp.result.market]) - Number(resp.result.amount);
          this.baseCoinAmount = Number(this.baseCoinAmount) - Number(resp.result.amount);
          this.marketBuyAmount = 0;
          this.$refs.buySliderMarket.setValue('0%');
          this.$eventBus.$emit('update-current-order',resp.result);

          this.tradeSuccessTitle = 'Congratulation!';
          this.tradeSuccessMsg = 'Your order has done successfully!';
          this.$modal.show('success-msg-modal');
        }else{
          this.tradeErrTitle = "Something went wrong!";
          this.tradeErrMsg = resp.error.message;
          this.$modal.show('error-msg-modal');
        }
        this.showAjaxProgress = false;
      }, error => {
        this.showAjaxProgress = false;
        this.tradeErrTitle = error.message;
        this.tradeErrMsg = 'Please check your network!';
        this.$modal.show('error-msg-modal');
      });
    },
    sendMarketSellRequest() {
      if(!this.isLogin) return;
      this.getMarketSellValidationStatus();
      if(!this.isEnableSellBtn) return;
      this.showAjaxProgress = true;
      let params=  {
        cmd:'market',
        market:this.marketName,
        user_id:userID,
        side:1,
        amount:this.marketSellAmount,
        price:this.marketBuyPrice
      };
      axios.post(apiURL,params).then(result => {
        let resp = result.data;
        if(resp.error == null && resp.result.user == userID) {
          //Update User Balance
          this.asstInfo[resp.result.market] = Number(this.asstInfo[resp.result.market]) - Number(resp.result.amount);
          this.fiatCoinAmount = Number(this.fiatCoinAmount) - Number(resp.result.amount);
          this.marketSellAmount = 0;
          this.$refs.sellSliderMarket.setValue('0%');
          this.$eventBus.$emit('update-current-order',resp.result);

          this.tradeSuccessTitle = 'Congratulation!';
          this.tradeSuccessMsg = 'Your order has done successfully!';
          this.$modal.show('success-msg-modal');
        }else{
          this.tradeErrTitle = "Something went wrong!";
          this.tradeErrMsg = resp.error.message;
          this.$modal.show('error-msg-modal');
        }
        this.showAjaxProgress = false;
      }, error => {
        this.showAjaxProgress = false;
        this.tradeErrTitle = error.message;
        this.tradeErrMsg = 'Please check your network!';
        this.$modal.show('error-msg-modal');
      });
    },
  },
  filters: {
    formatNumber: function (value) {
      return numeral(value).format("0,0.[00000000]");
    },
  }
}
