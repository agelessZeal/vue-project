<template>
    <div class="component-placeorder-input">
        <div class="input-warp" :class="{'error':is_err,'focus':is_selected}">
            <label class="number">
                <div class="name-wrap">
                    <span class="name">{{label_holder}}</span>
                    <span class="coin">{{coin_holder}}</span>
                </div>
                <input type="text" class="input" v-model="value"  @focus="selectInputForm()"  @blur="unSelectInputForm()">
            </label>
            <div class="control">
                <div class="plus" v-on:click="incValue()">+</div>
                <div class="minus" v-on:click="decValue()">-</div>
            </div>
        </div>
        <div class="tip-wrap" v-visible="is_err" >
            <p class="tip"  :class="{'error':is_err}">{{err_msg}}</p>
            <p class="legal" style="display: none"> ≈ 5.6 USD</p>
        </div>
    </div>

</template>
<script>
    import numeral from 'numeral';

    export default {
        name: 'OrderFormInput',
        components: {},
        props: {
            label_holder: String,
            coin_holder: String,
            trade_type: String,
            value_step: Number,
            market_type:String,
            err_msg: String,
            is_err: Boolean
        },
        data() {
            return {
                is_selected: false,
                time_offset: this.$store.state.time_offset,
                value: "",
            }
        },
        created() {

            this.$eventBus.$on('select-price', (data) => {
                if (this.label_holder == 'Price') {
                    this.value = data;
                }
            });

            this.$eventBus.$on('change-market-mode',(data)=> {
                if (this.label_holder == 'Amount') {
                    this.value = "";
                }
            });

            this.$eventBus.$on('change-value-percent', (data)=>{
                if(data.market_type == this.market_type &&
                    data.trade_type == this.trade_type &&
                    data.value_type == this.label_holder) {
                    this.value = data.value.toFixed(8);
                }
            })

        },
        computed: {},
        mounted() {
            this.$store.watch((state) => state.market.curMarketPrice, this.changePriceTicker, {deep: true});
        },
        methods: {
            incValue() {
                if (isNaN(this.value)) {
                    console.log('Please Input only Numbers');
                } else {
                    this.value = Number(this.value) + this.value_step;//0.00000001
                    this.value = Number.parseFloat(this.value).toFixed(8);

                }
            },
            decValue() {
                if (isNaN(this.value)) {
                    console.log('Please Input only Numbers');
                } else {
                    this.value = Number(this.value) - this.value_step;//0.00000001
                    if (this.value != 0) {
                        this.value = Number.parseFloat(this.value).toFixed(8);
                    }
                }
            },

            changePriceTicker(data) {
                if (this.label_holder == 'Price') {
                    this.value = data;
                }
            },
            selectInputForm() {
                this.is_selected = true;
            },
            unSelectInputForm() {
                this.is_selected = false;
            }
        },

        watch: {
            value() {
                if (this.value.toString().trim().length == 0) {
                    this.value = "";
                }
                if (isNaN(this.value)) {
                    this.value = '';
                    return;
                }
                if (Number(this.value) < 0) {
                    this.value = '';
                    return;
                }

                let inputValueInfo = {
                    'market_type':this.market_type,
                    'trade_type': this.trade_type,
                    'value_type': this.label_holder,
                    'value': this.value
                };
                this.$eventBus.$emit('change-trade-info', inputValueInfo)
            }
        },
        filters: {
            formatNumber: function (value) {
                return numeral(value).format("0,0.[00000000]");
            },
            formatTime: function (ts) {
                let d = new Date(ts * 1000);
                d = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
                return d;
            }
        }

    }

</script>
<style src="./order-input.css" scoped></style>

