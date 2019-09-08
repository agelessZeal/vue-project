import numeral from "numeral";
import axios from "axios";
import PageLoading from "../sub/pageloading/pageloading";

export default {
  name: 'OrderHistory',
  components: {
    PageLoading
  },
  props: {},
  data() {
    return {
      baseCoin: this.$store.state.market.baseCoin,
      fiatCoin: this.$store.state.market.fiatCoin,
      marketName: this.$store.state.market.currentMarket,
      isLogin: false,
      orderQueryOffset: 0,
      orderQueryLimit: 100,
      historyQueryOffset: 0,
      historyQueryLimit: 100,
      currentTrans: [],
      currentOrders: [],
      orderHistory: [],
      isNoOrders: true,
      isNoHistory: true,
      executedHistory: [],
      time_offset: this.$store.state.time_offset,

      cancelErrTitle:"",
      cancelSuccessTitle:"",
      cancelErrMsg:"",
      cancelSuccessMsg:"",

      showAjaxProgress:false,
    }
  },
  created(){
    this.$eventBus.$on('update-current-order',(data)=>{
      console.log('Updating Current Orders From Buy Action');
      let duplicateCnt = 0;
      this.currentOrders.forEach(function (item) {
        if(item.id == data.id){
          duplicateCnt ++;
        }
      });
      if(duplicateCnt == 0){
        this.currentOrders.push(data);
      }
    });
  },
  computed: {

  },
  mounted() {
    this.checkIsLogin();
    this.$store.watch((state) => state.market.currentMarket, this.marketSelect, {deep: true});
    this.$store.watch((state) => state.socket.isConnected, this.getInitOrders, {deep: true});
    this.$store.watch((state) => state.socket.message, this.msgHandler, {deep: true});
  },
  methods: {

    getInitOrders() {
      if(this.baseCoin == 'USDT') { return; }
      this.currentTrans.push(this.$gP.ORDER_QUERY);
      this.sendIDVerificationWeb();
    },

    sendIDVerificationWeb() {
      this.$socket.send(JSON.stringify({
        "method": "server.auth",
        "params": [webToken, webSource],
        "id": (this.$gP.ID_VERIFICATION_WEB+1)
      }));
    },
    sendOrderQuery() {
      this.$socket.send(JSON.stringify({
        "method": "order.query",
        "params": [this.marketName, this.orderQueryOffset, this.orderQueryLimit], //Market, Offset, Limit
        "id": this.$gP.ORDER_QUERY
      }));
    },
    sendOrderHistory() {
      this.$socket.send(JSON.stringify({
        "method": "order.history",
        "params": [this.marketName, 0, 0, this.historyQueryOffset, this.historyQueryLimit, 0], //Market, start,end, offset, Limit, side
        "id": this.$gP.ORDER_HISTORY
      }));
    },
    sendOrderSubScribe() {
      this.$socket.send(JSON.stringify({
        "method": "order.subscribe",
        //"params": this.$gP.MarketPairs,
        "params": [this.marketName],
        "id": this.$gP.ORDER_SUBSCRIBE
      }));
    },
    sendOrderUnSubScribe() {
      this.$socket.send(JSON.stringify({
        "method": "order.unsubscribe",
        "params": [],
        "id": this.$gP.ORDER_UNSUBSCRIBE
      }));
    },

    marketSelect(market) {
      this.baseCoin = this.$store.state.market.baseCoin;
      this.fiatCoin = this.$store.state.market.fiatCoin;
      this.marketName = market;

      this.getInitOrders();

      this.currentOrders = [];
      this.executedHistory = [];
      this.isNoHistory = true;
      this.isNoOrders = true;
    },
    msgHandler() {
      let resInfo = JSON.parse(this.$store.state.socket.message);
      if (resInfo.id == (this.$gP.ID_VERIFICATION_WEB+1) ) {
        this.dealTransactions(resInfo)
      } else if (resInfo.id == this.$gP.ORDER_QUERY) {
        if(resInfo.error == null) {
          //Processing Current Asset Info...
          this.getOrderQueryCallback(resInfo.result);
          this.removeTransInfo(this.$gP.ORDER_QUERY);
        } else {
          console.error("Error occurred at API:order.query");
          console.error(resInfo.error.message);
        }

        this.currentTrans.push(this.$gP.ORDER_HISTORY);
        this.sendIDVerificationWeb();

      } else if (resInfo.id == this.$gP.ORDER_HISTORY) {
        if (resInfo.error == null) {
          console.warn('Getting Order History=>>>>>>>>>>>>>>>>');
          this.getHistoryQueryCallback(resInfo.result);
          console.warn('Getting Order History=>>>>>>>>>>>>>>>>');
          this.removeTransInfo(this.$gP.ORDER_HISTORY);
          //Make Asset Subscribe Request
          this.currentTrans.push(this.$gP.ORDER_SUBSCRIBE);
          this.sendIDVerificationWeb();

        } else {
          console.error("Error occurred at API:order.history");
          console.error(resInfo.error.message);
        }
      } else if (resInfo.id == this.$gP.ORDER_SUBSCRIBE) {
        if (resInfo.error == null && resInfo.result.status == 'success') { // asset subscribe request success.
          //remove transaction from transaction buffer.
          console.log('Removing Order SubScribe Request From Transaction List');
          console.log(this.currentTrans);
          console.log('Removed Transaction ID:==============>' + this.$gP.ORDER_SUBSCRIBE);
          this.removeTransInfo(this.$gP.ORDER_SUBSCRIBE);
        } else {
          console.error("Error occurred at API:order.subscribe");
          console.error(resInfo.error.message);
        }
      } else if (resInfo.method == 'order.update') {
        if(resInfo.hasOwnProperty('params')) {
          this.getUpdatedOrderCallback(resInfo.params);
        } else {
          console.error("Error occurred at API:order.update");
          console.error(resInfo);
        }
      }
    },
    checkIsLogin() {
      if (webToken != "" && webSource != "") {
        this.isLogin = true;
      }
    },

    getOrderQueryCallback(resp) {
      if (resp.limit == this.orderQueryLimit && resp.total > 0) {
        this.currentOrders = [];
        resp.records.sort(this.myCompareByTime);
        resp.records.forEach(function (item) {
          if (item.user == userID && item.market == this.marketName) {
            this.currentOrders.push(item);
          }
        }, this);
        this.isNoOrders = this.currentOrders.length == 0
      } else {
        this.isNoOrders = true;
      }
    },

    getHistoryQueryCallback(resp) {
      if (resp.limit == this.historyQueryLimit && resp.records.length > 0){
        this.executedHistory = [];
        resp.records.sort(this.myCompareByTime);
        resp.records.forEach(function (item) {
          if (item.user == userID && item.market == this.marketName) {
            this.executedHistory.push(item);
          }
        }, this);
        this.isNoHistory = this.executedHistory.length == 0;
      } else {
        this.isNoHistory = true;
      }
    },

    getUpdatedOrderCallback(resp) {
      if(resp[1].user == userID) {
        switch (resp[0]) {
          case 1://PUT
            this.currentOrders.push(resp[1]);
            break;
          case 2://UPDATE
            console.log('Order updated');
            this.currentOrders.forEach(function (item,index) {
              if(item.id == resp[1].id) {
                this.currentOrders[index] = resp[1]  ;
              }
            },this);
            break;
          case 3://FINISHED
            //1.Remove Order from Current Orders
            let orderIndex = -1;
            this.currentOrders.forEach(function (item) {
              orderIndex ++;
              if(item.id == resp[1].id) {
                this.currentOrders.splice(orderIndex,1);
              }
            },this);
            if(Number(resp[1].deal_stock) > 0){ //This mean canceled Order
              //insert Mine Data;
              this.$eventBus.$emit('update-mine',JSON.parse(JSON.stringify(resp[1])));
            }
            //2.Push New Order Into Order History
            this.executedHistory.push(resp[1]);
            break;
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

    dealTransactions(msg) {
      if (msg.error == null && msg.result.status == 'success') {
        if (this.currentTrans.length > 0) {
          let transID = this.currentTrans[0];
          if (transID == this.$gP.ORDER_QUERY) {
            this.sendOrderQuery();
          } else if (transID == this.$gP.ORDER_HISTORY) {
            this.sendOrderHistory();
          } else if (transID == this.$gP.ORDER_SUBSCRIBE) {
            this.sendOrderSubScribe();
          }
        }
      }
    },

    onCancelOrder(orderID) {
      if(!this.isLogin) return;
      this.showAjaxProgress = true;
      let params=  {
        cmd:'cancel',
        market:this.marketName,
        user_id:userID,
        order_id:orderID,
      };
      axios.post(apiURL,params).then(result => {
        let resp = result.data;
        if(resp.error == null && resp.result.user == userID) {
          //Update User Balance
          this.$eventBus.$emit('update-user-balance',resp.result);
          //Remove Order From Current Orders Table
          let orderNo = - 1;
          this.orderHistory.forEach(function (item) {
            orderNo ++;
            if(item.id == orderID){
              this.orderHistory.splice(orderNo);
            }
          });

          this.cancelSuccessTitle = 'Done!';
          this.cancelSuccessMsg = 'Order Canceled successfully!';
          this.$modal.show('success-msg-modal');
        }else{
          this.cancelErrTitle = "Something went wrong!";
          this.cancelErrMsg = resp.error.message;
          this.$modal.show('cancel-error-msg-modal');
        }
        this.showAjaxProgress = false;
      }, error => {
        this.showAjaxProgress = false;
        this.cancelErrTitle = error.message;
        this.cancelErrMsg = 'Please check your network!';
        this.$modal.show('cancel-error-msg-modal');
      });
    },

    myCompareByTime(a, b) { // 1,2,3 , Ascending Order by time
      if (a.ctime < b.ctime)
        return -1;
      if (a.ctime > b.ctime)
        return 1;
      return 0;
    },

    getOrderType(order_type) {
      return (order_type == 1) ? "Limit" : "Market";
    },

    getOrderTypeClass(odType) {
      return {
        'cur-limit-order': odType == 1,
        'cur-market-order': odType == 2
      }
    },
    getOrderSideType(sideType) {
      return (sideType == 1) ? "Sell" : "Buy";
    },
    getOrderSideTypeClass(sideType) {
      return {
        'c-red': sideType == 1,//Sell
        'c-green': sideType == 2 //Buy
      }
    },
    getOrderStatus(dealStock){
      return (Number(dealStock)==0)?'Canceled':'Finished';
    },
    getOrderStatusClass(dealStock){
      return {
        'canceled-order': Number(dealStock) == 0,//Canceled
        'finished-order': Number(dealStock)> 0 //Finished
      }
    },
  },

  filters: {
    formatNumberPrice: function (value) {
      return numeral(value).format("0,0.[00000000]");
    },
    formatOrderTime: function (ts) {
      let d = new Date(ts * 1000);
      d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " "
        + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
      return d;
    }
  },
}
