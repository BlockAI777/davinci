const BPOOL = {
    "contractName": "BPool.sol",
	"gasEstimates": {
		"creation": {
			"codeDepositCost": "4470000",
			"executionCost": "infinite",
			"totalCost": "infinite"
		},
		"external": {
			"BONE()": "310",
			"BPOW_PRECISION()": "342",
			"EXIT_FEE()": "332",
			"INIT_POOL_SUPPLY()": "266",
			"MAX_BOUND_TOKENS()": "265",
			"MAX_BPOW_BASE()": "266",
			"MAX_FEE()": "373",
			"MAX_IN_RATIO()": "284",
			"MAX_OUT_RATIO()": "332",
			"MAX_TOTAL_WEIGHT()": "334",
			"MAX_WEIGHT()": "309",
			"MIN_BALANCE()": "329",
			"MIN_BOUND_TOKENS()": "287",
			"MIN_BPOW_BASE()": "309",
			"MIN_FEE()": "308",
			"MIN_WEIGHT()": "267",
			"allowance(address,address)": "739",
			"approve(address,uint256)": "infinite",
			"balanceOf(address)": "613",
			"bind(address,uint256,uint256)": "infinite",
			"calcInGivenOut(uint256,uint256,uint256,uint256,uint256,uint256)": "infinite",
			"calcOutGivenIn(uint256,uint256,uint256,uint256,uint256,uint256)": "infinite",
			"calcPoolInGivenSingleOut(uint256,uint256,uint256,uint256,uint256,uint256)": "infinite",
			"calcPoolOutGivenSingleIn(uint256,uint256,uint256,uint256,uint256,uint256)": "infinite",
			"calcSingleInGivenPoolOut(uint256,uint256,uint256,uint256,uint256,uint256)": "infinite",
			"calcSingleOutGivenPoolIn(uint256,uint256,uint256,uint256,uint256,uint256)": "infinite",
			"calcSpotPrice(uint256,uint256,uint256,uint256,uint256)": "infinite",
			"decimals()": "481",
			"decreaseApproval(address,uint256)": "infinite",
			"exitPool(uint256,uint256[])": "infinite",
			"exitswapExternAmountOut(address,uint256,uint256)": "infinite",
			"exitswapPoolAmountIn(address,uint256,uint256)": "infinite",
			"finalize()": "infinite",
			"getBalance(address)": "1213",
			"getColor()": "272",
			"getController()": "817",
			"getCurrentTokens()": "infinite",
			"getDenormalizedWeight(address)": "1193",
			"getFactory()": "826",
			"getFinalTokens()": "infinite",
			"getNormalizedWeight(address)": "1633",
			"getNumTokens()": "487",
			"getSpotPrice(address,address)": "infinite",
			"getSpotPriceSansFee(address,address)": "infinite",
			"getSwapFee()": "776",
			"getTotalDenormalizedWeight()": "778",
			"gulp(address)": "infinite",
			"increaseApproval(address,uint256)": "infinite",
			"isBound(address)": "667",
			"isFinalized()": "501",
			"isPublicSwap()": "581",
			"joinPool(uint256,uint256[])": "infinite",
			"joinswapExternAmountIn(address,uint256,uint256)": "infinite",
			"joinswapPoolAmountOut(address,uint256,uint256)": "infinite",
			"name()": "infinite",
			"rebind(address,uint256,uint256)": "infinite",
			"setController(address)": "infinite",
			"setFactory(address)": "infinite",
			"setPublicSwap(bool)": "infinite",
			"setSwapFee(uint256)": "infinite",
			"swapExactAmountIn(address,uint256,address,uint256,uint256)": "infinite",
			"swapExactAmountOut(address,uint256,address,uint256,uint256)": "infinite",
			"symbol()": "infinite",
			"totalSupply()": "511",
			"transfer(address,uint256)": "43607",
			"transferFrom(address,address,uint256)": "infinite",
			"unbind(address)": "infinite"
		},
		"internal": {
			"_burnPoolShare(uint256)": "infinite",
			"_mintPoolShare(uint256)": "infinite",
			"_pullPoolShare(address,uint256)": "infinite",
			"_pullUnderlying(address,address,uint256)": "infinite",
			"_pushPoolShare(address,uint256)": "infinite",
			"_pushUnderlying(address,address,uint256)": "infinite"
		}
	},
	"methodIdentifiers": {
		"BONE()": "c36596a6",
		"BPOW_PRECISION()": "189d00ca",
		"EXIT_FEE()": "c6580d12",
		"INIT_POOL_SUPPLY()": "9381cd2b",
		"MAX_BOUND_TOKENS()": "b0e0d136",
		"MAX_BPOW_BASE()": "bc694ea2",
		"MAX_FEE()": "bc063e1a",
		"MAX_IN_RATIO()": "ec093021",
		"MAX_OUT_RATIO()": "992e2a92",
		"MAX_TOTAL_WEIGHT()": "09a3bbe4",
		"MAX_WEIGHT()": "e4a28a52",
		"MIN_BALANCE()": "867378c5",
		"MIN_BOUND_TOKENS()": "b7b800a4",
		"MIN_BPOW_BASE()": "ba019dab",
		"MIN_FEE()": "76c7a3c7",
		"MIN_WEIGHT()": "218b5382",
		"allowance(address,address)": "dd62ed3e",
		"approve(address,uint256)": "095ea7b3",
		"balanceOf(address)": "70a08231",
		"bind(address,uint256,uint256)": "e4e1e538",
		"calcInGivenOut(uint256,uint256,uint256,uint256,uint256,uint256)": "f8d6aed4",
		"calcOutGivenIn(uint256,uint256,uint256,uint256,uint256,uint256)": "ba9530a6",
		"calcPoolInGivenSingleOut(uint256,uint256,uint256,uint256,uint256,uint256)": "82f652ad",
		"calcPoolOutGivenSingleIn(uint256,uint256,uint256,uint256,uint256,uint256)": "8656b653",
		"calcSingleInGivenPoolOut(uint256,uint256,uint256,uint256,uint256,uint256)": "5c1bbaf7",
		"calcSingleOutGivenPoolIn(uint256,uint256,uint256,uint256,uint256,uint256)": "89298012",
		"calcSpotPrice(uint256,uint256,uint256,uint256,uint256)": "a221ee49",
		"decimals()": "313ce567",
		"decreaseApproval(address,uint256)": "66188463",
		"exitPool(uint256,uint256[])": "b02f0b73",
		"exitswapExternAmountOut(address,uint256,uint256)": "02c96748",
		"exitswapPoolAmountIn(address,uint256,uint256)": "46ab38f1",
		"finalize()": "4bb278f3",
		"getBalance(address)": "f8b2cb4f",
		"getColor()": "9a86139b",
		"getController()": "3018205f",
		"getCurrentTokens()": "cc77828d",
		"getDenormalizedWeight(address)": "948d8ce6",
		"getFactory()": "88cc58e4",
		"getFinalTokens()": "be3bbd2e",
		"getNormalizedWeight(address)": "f1b8a9b7",
		"getNumTokens()": "cd2ed8fb",
		"getSpotPrice(address,address)": "15e84af9",
		"getSpotPriceSansFee(address,address)": "1446a7ff",
		"getSwapFee()": "d4cadf68",
		"getTotalDenormalizedWeight()": "936c3477",
		"gulp(address)": "8c28cbe8",
		"increaseApproval(address,uint256)": "d73dd623",
		"isBound(address)": "2f37b624",
		"isFinalized()": "8d4e4083",
		"isPublicSwap()": "fde924f7",
		"joinPool(uint256,uint256[])": "4f69c0d4",
		"joinswapExternAmountIn(address,uint256,uint256)": "5db34277",
		"joinswapPoolAmountOut(address,uint256,uint256)": "6d06dfa0",
		"name()": "06fdde03",
		"rebind(address,uint256,uint256)": "3fdddaa2",
		"setController(address)": "92eefe9b",
		"setFactory(address)": "5bb47808",
		"setPublicSwap(bool)": "49b59552",
		"setSwapFee(uint256)": "34e19907",
		"swapExactAmountIn(address,uint256,address,uint256,uint256)": "8201aa3f",
		"swapExactAmountOut(address,uint256,address,uint256,uint256)": "7c5e9ea4",
		"symbol()": "95d89b41",
		"totalSupply()": "18160ddd",
		"transfer(address,uint256)": "a9059cbb",
		"transferFrom(address,address,uint256)": "23b872dd",
		"unbind(address)": "cf5e7bd3"
	},
	"abi": [
		{
			"inputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "constructor"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "src",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "dst",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "amt",
					"type": "uint256"
				}
			],
			"name": "Approval",
			"type": "event"
		},
		{
			"anonymous": true,
			"inputs": [
				{
					"indexed": true,
					"internalType": "bytes4",
					"name": "sig",
					"type": "bytes4"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "caller",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "bytes",
					"name": "data",
					"type": "bytes"
				}
			],
			"name": "LOG_CALL",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "caller",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "tokenOut",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				}
			],
			"name": "LOG_EXIT",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "caller",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "tokenIn",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				}
			],
			"name": "LOG_JOIN",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "caller",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "tokenIn",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "tokenOut",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				}
			],
			"name": "LOG_SWAP",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "src",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "dst",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "amt",
					"type": "uint256"
				}
			],
			"name": "Transfer",
			"type": "event"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "BONE",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "BPOW_PRECISION",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "EXIT_FEE",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "INIT_POOL_SUPPLY",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MAX_BOUND_TOKENS",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MAX_BPOW_BASE",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MAX_FEE",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MAX_IN_RATIO",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MAX_OUT_RATIO",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MAX_TOTAL_WEIGHT",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MAX_WEIGHT",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MIN_BALANCE",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MIN_BOUND_TOKENS",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MIN_BPOW_BASE",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MIN_FEE",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "MIN_WEIGHT",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "address",
					"name": "src",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "dst",
					"type": "address"
				}
			],
			"name": "allowance",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "dst",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "amt",
					"type": "uint256"
				}
			],
			"name": "approve",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "address",
					"name": "whom",
					"type": "address"
				}
			],
			"name": "balanceOf",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "token",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "balance",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "denorm",
					"type": "uint256"
				}
			],
			"name": "bind",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenBalanceIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenBalanceOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "swapFee",
					"type": "uint256"
				}
			],
			"name": "calcInGivenOut",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "pure",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenBalanceIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenBalanceOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "swapFee",
					"type": "uint256"
				}
			],
			"name": "calcOutGivenIn",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "pure",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenBalanceOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "poolSupply",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "totalWeight",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "swapFee",
					"type": "uint256"
				}
			],
			"name": "calcPoolInGivenSingleOut",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "poolAmountIn",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "pure",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenBalanceIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "poolSupply",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "totalWeight",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "swapFee",
					"type": "uint256"
				}
			],
			"name": "calcPoolOutGivenSingleIn",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "poolAmountOut",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "pure",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenBalanceIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "poolSupply",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "totalWeight",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "poolAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "swapFee",
					"type": "uint256"
				}
			],
			"name": "calcSingleInGivenPoolOut",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "pure",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenBalanceOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "poolSupply",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "totalWeight",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "poolAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "swapFee",
					"type": "uint256"
				}
			],
			"name": "calcSingleOutGivenPoolIn",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "pure",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "tokenBalanceIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenBalanceOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "tokenWeightOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "swapFee",
					"type": "uint256"
				}
			],
			"name": "calcSpotPrice",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "spotPrice",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "pure",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "decimals",
			"outputs": [
				{
					"internalType": "uint8",
					"name": "",
					"type": "uint8"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "dst",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "amt",
					"type": "uint256"
				}
			],
			"name": "decreaseApproval",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "poolAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256[]",
					"name": "minAmountsOut",
					"type": "uint256[]"
				}
			],
			"name": "exitPool",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "tokenOut",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "maxPoolAmountIn",
					"type": "uint256"
				}
			],
			"name": "exitswapExternAmountOut",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "poolAmountIn",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "tokenOut",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "poolAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "minAmountOut",
					"type": "uint256"
				}
			],
			"name": "exitswapPoolAmountIn",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [],
			"name": "finalize",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "address",
					"name": "token",
					"type": "address"
				}
			],
			"name": "getBalance",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "getColor",
			"outputs": [
				{
					"internalType": "bytes32",
					"name": "",
					"type": "bytes32"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "getController",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "getCurrentTokens",
			"outputs": [
				{
					"internalType": "address[]",
					"name": "tokens",
					"type": "address[]"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "address",
					"name": "token",
					"type": "address"
				}
			],
			"name": "getDenormalizedWeight",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "getFactory",
			"outputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "getFinalTokens",
			"outputs": [
				{
					"internalType": "address[]",
					"name": "tokens",
					"type": "address[]"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "address",
					"name": "token",
					"type": "address"
				}
			],
			"name": "getNormalizedWeight",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "getNumTokens",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "address",
					"name": "tokenIn",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "tokenOut",
					"type": "address"
				}
			],
			"name": "getSpotPrice",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "spotPrice",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "address",
					"name": "tokenIn",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "tokenOut",
					"type": "address"
				}
			],
			"name": "getSpotPriceSansFee",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "spotPrice",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "getSwapFee",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "getTotalDenormalizedWeight",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "token",
					"type": "address"
				}
			],
			"name": "gulp",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "dst",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "amt",
					"type": "uint256"
				}
			],
			"name": "increaseApproval",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [
				{
					"internalType": "address",
					"name": "t",
					"type": "address"
				}
			],
			"name": "isBound",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "isFinalized",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "isPublicSwap",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "poolAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256[]",
					"name": "maxAmountsIn",
					"type": "uint256[]"
				}
			],
			"name": "joinPool",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "tokenIn",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "minPoolAmountOut",
					"type": "uint256"
				}
			],
			"name": "joinswapExternAmountIn",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "poolAmountOut",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "tokenIn",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "poolAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "maxAmountIn",
					"type": "uint256"
				}
			],
			"name": "joinswapPoolAmountOut",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "name",
			"outputs": [
				{
					"internalType": "string",
					"name": "",
					"type": "string"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "token",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "balance",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "denorm",
					"type": "uint256"
				}
			],
			"name": "rebind",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "manager",
					"type": "address"
				}
			],
			"name": "setController",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "manager",
					"type": "address"
				}
			],
			"name": "setFactory",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "bool",
					"name": "public_",
					"type": "bool"
				}
			],
			"name": "setPublicSwap",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "uint256",
					"name": "swapFee",
					"type": "uint256"
				}
			],
			"name": "setSwapFee",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "tokenIn",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "address",
					"name": "tokenOut",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "minAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "maxPrice",
					"type": "uint256"
				}
			],
			"name": "swapExactAmountIn",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "spotPriceAfter",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "tokenIn",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "maxAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "address",
					"name": "tokenOut",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "tokenAmountOut",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "maxPrice",
					"type": "uint256"
				}
			],
			"name": "swapExactAmountOut",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "tokenAmountIn",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "spotPriceAfter",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "symbol",
			"outputs": [
				{
					"internalType": "string",
					"name": "",
					"type": "string"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": true,
			"inputs": [],
			"name": "totalSupply",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"payable": false,
			"stateMutability": "view",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "dst",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "amt",
					"type": "uint256"
				}
			],
			"name": "transfer",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "src",
					"type": "address"
				},
				{
					"internalType": "address",
					"name": "dst",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "amt",
					"type": "uint256"
				}
			],
			"name": "transferFrom",
			"outputs": [
				{
					"internalType": "bool",
					"name": "",
					"type": "bool"
				}
			],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"constant": false,
			"inputs": [
				{
					"internalType": "address",
					"name": "token",
					"type": "address"
				}
			],
			"name": "unbind",
			"outputs": [],
			"payable": false,
			"stateMutability": "nonpayable",
			"type": "function"
		}
	]
};