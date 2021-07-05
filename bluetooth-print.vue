<template>
	<view class="dialog-wrap" :class="state ===0 ? 'none' : state===1 ? 'show' : ''" @click.stop.prevent="stopPrevent">
		<view class="dialog-box">
			<view class="dilalog-tit">设备列表</view>
			<view class="dilalog-content">
				<!-- 
				<button size="mini" type="warn" @tap="stopBluetoothDevicesDiscovery">停止搜索</button>
				<button type="primary" @tap="pickUpOnce">测试打印</button> -->
				<button size="mini" type="primary" class="reSearch" @tap="startBluetoothDeviceDiscovery" v-if="devicesList.length===0">搜索周边设备</button>
				<scroll-view class="device_list" scroll-y="true" show-scrollbar="true">
					<view v-for="(item,index) in devicesList" :key="index" class="device_item" @click="select_deviceId(item)">
						<view class="">
							{{item.name}}
						</view>
						<image src="../static/radio-check.png" v-if="item.deviceId==deviceId" mode=""></image>
						<image src="../static/round.png" v-else mode=""></image>

						<!-- <radio-group v-if="deviceId===item.deviceId">
								<view v-for="(service,service_index) in serviceList" :key="service_index" style="font-size: 20rpx">
									<radio style="transform:scale(0.7)" :value="service.uuid" @tap="select_service(service)" />{{service.uuid }}
								</view>
							</radio-group> -->
					</view>
				</scroll-view>
			</view>
			<view class="dialog-footer t-box">
				<view class="cancel t-box-1" @click="cancel">取消</view>
				<view class="sure t-box-1" @click="pickUpOnce">打印</view>
			</view>
		</view>
	</view>
</template>

<script>
	import PrinterJobs from '@/common/print/printerjobs.js'
	import printerUtil from '@/common/print/printerutil.js'
	import util from '@/common/print/util.js'
	import drawQrcode from '@/common/print/weapp.qrcode.esm.js'
	import Bluetooth from '@/common/print/bluetooth.js'

	let bluetooth;
	export default {
		name: 'bluetooth-print',
		data() {
			return {
				isOpenBle: false, //是否已经打开蓝牙，默认为false
				devicesList: [], //设备列表
				serviceList: [], //服务列表
				deviceId: "", //选中的deviceId
				serviceId: 0,
				bluetoothInfo: {},
				canPrint:false
			}
		},
		props: {
			state: {
				type: Number,
				default: 0
			},
			data: {
				type: Object,
				default: {}
			},
			printType:{
				type:String,
				default:'orderDetail'
			}
		},
		beforeCreate() {},
		mounted() {
			console.log(this.data);
		},
		watch: {
			state(val) {
				if (val == '1') {
					console.log(this.data);
					console.log(this.printType);
					bluetooth = new Bluetooth()
					this.startBluetoothDeviceDiscovery()
				}
			}
		},
		computed: {

		},
		methods: {
			cancel() {
				bluetooth.closeBLEConnection();
				bluetooth.closeBluetoothAdapter();
				uni.hideLoading();
				this.$emit("close")
			},
			//搜索周边设备
			startBluetoothDeviceDiscovery() {
				uni.showLoading({
					title: '蓝牙搜索中'
				})
				let self = this;
				self.devicesList = [];

				setTimeout(() => {
					uni.startBluetoothDevicesDiscovery({
						success: res => {
							uni.onBluetoothDeviceFound(devices => {
								if (!self.devicesList.some(item => {
										return item.deviceId === devices.devices[0].deviceId 
									})&& devices.devices[0].name) {
										console.log(devices.devices[0].name);
										uni.hideLoading()
										self.devicesList.push(devices.devices[0])
								}
							});
						},
						fail: err => {
							uni.hideLoading();
							console.log(`搜索设备失败` + JSON.stringify(err));
							self.errorCodeTip(err.errCode);
						}
					})
				}, 200)
			},

			//停止搜索蓝牙设备
			stopBluetoothDevicesDiscovery() {
				uni.hideLoading();
				bluetooth.stopBluetoothDevicesDiscovery();
			},


			//选中设备
			async select_deviceId(item) {
				this.serviceId = 0
				this.deviceId = item.deviceId;
				bluetooth.deviceId = item.deviceId;
				uni.setStorageSync('deviceId', bluetooth.deviceId);

				this.serviceList = [];

				try {
					//1.链接设备
					let result = await bluetooth.createBLEConnection();
					//2.寻找服务
					let result2 = await bluetooth.getBLEDeviceServices();
					console.log("获取服务: " + JSON.stringify(result2));
					this.serviceList = result2;
					this.getCharacteristics()
				} catch (e) {
					//TODO handle the exception
					console.log("e: " + JSON.stringify(e));
				}
			},
			getCharacteristics() {
				var that = this
				let {
					serviceList: list, 
					serviceId: num,
				} = that;
				let write=false
				uni.getBLEDeviceCharacteristics({
					deviceId: that.deviceId,
					serviceId: list[num].uuid,
					success(res) {
						console.log(res)
						// for (let i = 0; i < res.characteristics.length; i++) {
						// 	let properties = res.characteristics[i].properties
						// 	let item = res.characteristics[i].uuid
						// 	if(!write){
						// 		if (properties.write) {
						// 			that.bluetoothInfo.writeCharaterId = item;
						// 			that.bluetoothInfo.writeServiceId = list[num].uuid;
						// 			uni.showToast({
						// 				icon:'none',
						// 				title:'连接成功'
						// 			})
						// 			write = true
						// 			that.select_service({uuid:list[num].uuid})
						// 			that.canPrint=true
						// 		}
						// 	}
						// }
						res.characteristics.forEach((charitem)=>{
							console.log(charitem);
							let properties = charitem.properties
							let item = charitem.uuid
							if(!write){
								if (properties.write) {
									that.bluetoothInfo.writeCharaterId = item;
									that.bluetoothInfo.writeServiceId = list[num].uuid;
									uni.showToast({
										icon:'none',
										title:'连接成功'
									})
									write = true
									that.select_service({uuid:list[num].uuid})
									that.canPrint=true
								}
							}
						})
						if (!write) {
							num++
							that.serviceId = num;
							if (num == list.length) {
								uni.showModal({
									title: '提示',
									content: '该设备不可打印',
								})
							} else {
								that.getCharacteristics()
							}
						} else {
							bluetooth.serviceId = that.bluetoothInfo.writeServiceId;
						}
					},
					fail: function(e) {
						console.log("getBLEDeviceCharacteristics fail：", e);
						that.errorCodeTip(e.errCode);
					}
				})
			},
			//选中服务
			async select_service(res) {

				bluetooth.serviceId = res.uuid;
				uni.setStorageSync('serviceId', res.uuid);

				try {
					let result = await bluetooth.getBLEDeviceCharacteristics();
				} catch (e) {
					//TODO handle the exception
					console.log("e: " + JSON.stringify(e));
				}

			},



			//打印一次
			pickUpOnce() {
				let self = this;
				if(!this.canPrint){
					return false
				}
				bluetooth.notifyBLECharacteristicValue();
				setTimeout(() => {
					self.writeBLECharacteristicValue();
				}, 500);
			},
			//写入控制命令
			async writeBLECharacteristicValue() {
				let printerJobs = new PrinterJobs();
				if(printType==='orderDetail'){
					printerJobs
						// .print(printerUtil.fillLine())
						.setAlign('ct')
						.setSize(2, 2)
						.print('发货单')
						.print(`  `)
						.setAlign('lt')
						.setSize(1, 1)
						.print(`订单编号：${this.data.order_bn}`)
						.print(`下单时间：${this.data.created_at}`)
						.print(`供应商：${this.data.userInfo.addons.company_name}`)
						.print(`订单备注：${this.data.remark || ''}`)
						.print(printerUtil.fillAround('商品信息'));
					
					this.data.items.forEach(item => {
						printerJobs.print(printerUtil.inlineThird(`${item.item_name}*${parseFloat(item.qty)}${item.unit}`,`${item.price}`,`${parseFloat(item.price)*parseFloat(item.qty)}`));
					})
					printerJobs.print(printerUtil.inline(`总计金额`, `${this.data.total_fee}`));
					if(this.data.status==='SHIPMENT_FINISHED'){
						printerJobs
							.print(printerUtil.fillAround('签收信息'));
							
						this.data.items.forEach(item => {
							printerJobs.print(printerUtil.inlineThird(`${item.item_name}*${parseFloat(item.sign_num)}${item.unit}`,`${item.price}`,`${parseFloat(item.price)*parseFloat(item.sign_num)}`));
						})
						
						printerJobs.print(printerUtil.inline(`签收金额`, `${this.data.sign_order_total_fee||''}`));
						
					}
					
					
					printerJobs
						.print(printerUtil.fillAround('物流信息'))
						.setAlign('lt')
						.print(`配送方式：${this.data.shipping_method_name}`);
					
					
					if (this.data.shipping_method === 'mailing') {
						printerJobs
							.print(`物流公司：${this.data.shipInfo.express_name}`)
							.print(`物流单号：${this.data.shipInfo.express_num}`);
					} else {
						if(this.data.delivery_time){
							this.data.delivery_time = this.data.delivery_time.replace(',',' 至 ')
						}else{
							this.data.delivery_time = ''
						}
						printerJobs
							.print(`司机姓名：${this.data.shipInfo.driver_name}`)
							.print(`司机手机号：${this.data.shipInfo.driver_tel}`)
							.print(`车牌号：${this.data.shipInfo.driver_plate}`)
							.print(`送达时间：${this.data.delivery_time}`);
					}
					
					printerJobs
						.setAlign('lt')
						.print(printerUtil.fillAround('收货信息'))
						.print(`收货人：${this.data.addr_info.name}`)
						.print(`联系方式：${this.data.addr_info.mobile}`)
						.print(`收货地址：${this.data.addr_info.area} ${this.data.addr_info.street}`)
						.print(printerUtil.fillAround('签名处'))
						.print(`  `)
						.print(`送货人：`)
						.print(`  `)
						.print(printerUtil.fillLine())
						.println();
				}else if(printType==='afterDetail'){
					printerJobs
						// .print(printerUtil.fillLine())
						.setAlign('ct')
						.setSize(2, 2)
						.print('售后单')
						.print(`  `)
						.setAlign('lt')
						.setSize(1, 1)
						.print(printerUtil.fillAround('商品信息'));
						
						
					this.data.items.forEach(item => {
						printerJobs.print(printerUtil.inlineThird(`${item.name}*${parseFloat(item.qty)}${item.unit}`,`${item.price}`,`${parseFloat(item.price)*parseFloat(item.qty)}`));
					})
						
						
					printerJobs
						.setAlign('lt')
						.setSize(1, 1)
						.print(printerUtil.inline(`退款总金额`, `${this.data.total_fee}`))
						.print(printerUtil.fillAround('售后信息'))
						.print(`售后原因：${this.data.aftersale_reason}`)
						.print(`问题描述：${this.data.aftersale_desc}`)
						.print(`售后单号：${this.data.aftersales_bn}`)
						.print(`申请退货时间：${this.data.created_at}`)
						.print(`审核时间：${this.data.updated_at}`)
						.print(`审核结果：${this.data.status_name}`)
						.print(`审核意见：${this.data.audit_reason}`)
						.print(`供应商名称：${this.data.userInfo.addons.company_name}`)
						.print(printerUtil.fillAround('签名处'))
						.print(`  `)
						.print(`送货人：`)
						.print(`  `)
						.print(printerUtil.fillLine())
						.println();
				}
				
				// console.log(printerJobs);
				let buffer = printerJobs.buffer();

				this.printbuffs(buffer);
			},

			printbuffs(buffer) {
				// 1.并行调用多次会存在写失败的可能性
				// 2.建议每次写入不超过20字节
				// 分包处理，延时调用
				const maxChunk = 20;
				const delay = 20;
				for (let i = 0, j = 0, length = buffer.byteLength; i < length; i += maxChunk, j++) {
					let subPackage = buffer.slice(i, i + maxChunk <= length ? (i + maxChunk) : length);
					setTimeout(this.printbuff, j * delay, subPackage);
				}
			},
			printbuff(buffer) {
				bluetooth.writeBLECharacteristicValue(buffer);
			},
			stopPrevent() {},
			//错误码提示
			errorCodeTip(code) {
				if (code == 0) {
					//正常
				} else if (code == 10000) {
					uni.showToast({
						title: '未初始化蓝牙适配器',
						icon: 'none'
					})
				} else if (code == 10001) {
					uni.showToast({
						title: '当前蓝牙适配器不可用',
						icon: 'none'
					})
				} else if (code == 10002) {
					uni.showToast({
						title: '没有找到指定设备',
						icon: 'none'
					})
				} else if (code == 10003) {
					uni.showToast({
						title: '连接失败',
						icon: 'none'
					})
				} else if (code == 10004) {
					uni.showToast({
						title: '没有找到指定服务',
						icon: 'none'
					})
				} else if (code == 10005) {
					uni.showToast({
						title: '没有找到指定特征值',
						icon: 'none'
					})
				} else if (code == 10006) {
					uni.showToast({
						title: '当前连接已断开',
						icon: 'none'
					})
				} else if (code == 10007) {
					uni.showToast({
						title: '当前特征值不支持此操作',
						icon: 'none'
					})
				} else if (code == 10008) {
					uni.showToast({
						title: '其余所有系统上报的异常',
						icon: 'none'
					})
				} else if (code == 10009) {
					uni.showToast({
						title: 'Android 系统特有，系统版本低于 4.3 不支持 BLE',
						icon: 'none'
					})
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	.dialog-wrap {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10000;
		background: rgba(0, 0, 0, 0);
		transition: .3s;
	}

	.none {
		display: none;
	}

	.show {
		background: rgba(0, 0, 0, .4);

		.dialog-box {
			transform: translate(-50%, -50%);
		}
	}

	.dialog-box {
		position: absolute;
		top: 50%;
		left: 50%;
		padding-top: 40upx;
		width: 600upx;
		background-color: #fff;
		border-radius: 12upx;
		box-sizing: border-box;
		transform: translate(100%);
	}

	.dilalog-tit {
		font-size: 36upx;
		color: #000000;
		text-align: center;
		line-height: 32upx;
		font-weight: 600;
	}

	.dilalog-content {
		padding: 40upx 32upx;
	}

	.dialog-footer {
		height: 88upx;
		line-height: 88upx;
		text-align: center;
		border-top: 2upx solid #C8C8C8;
		color: $uni-theme-color;
		font-size: 34upx;
	}

	.cancel {
		border-right: 2upx solid #C8C8C8;
		color: #000000;
	}

	.device_list {
		height: 400upx;
	}

	.device_item {
		display: flex;
		align-items: center;
		margin: 30upx;
		justify-content: space-between;

		image {
			width: 40upx;
			height: 40upx;
		}
	}
	.reSearch{
		background-color: $uni-theme-color;
		margin-left: 164upx;
	}
</style>
