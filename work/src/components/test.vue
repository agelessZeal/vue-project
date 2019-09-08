<template>
    <div class="txu-container">
        <TxuHeader/>
    </div>
</template>
<script>
    import TxuHeader from './txu-header/index.vue'
    export default {
        name: 'Main',
	props :{
		symbol:String,
		market:String
	}
        components: {
            TxuHeader
        },
        data() {
            return {
		amount:String,
		vouleme:Number
            }
        },
        computed: {},
        mounted() {
        },
        methods: {
            Func1 () {
               ///functtion code
	    },
	}
	 .....	
    }
</script>
<style scoped>
    // css
</style>
