const abi =
    [
        {
            type: "constructor",
            inputs: [],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "cancelOrder",
            inputs: [
                {
                    name: "pool",
                    type: "tuple",
                    internalType: "struct IPoolManager.Pool",
                    components: [
                        {
                            name: "baseCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "quoteCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "orderBook",
                            type: "address",
                            internalType: "contract IOrderBook",
                        },
                    ],
                },
                {
                    name: "orderId",
                    type: "uint48",
                    internalType: "uint48",
                },
            ],
            outputs: [],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "getBestPrice",
            inputs: [
                {
                    name: "_baseCurrency",
                    type: "address",
                    internalType: "Currency",
                },
                {
                    name: "_quoteCurrency",
                    type: "address",
                    internalType: "Currency",
                },
                {
                    name: "side",
                    type: "uint8",
                    internalType: "enum IOrderBook.Side",
                },
            ],
            outputs: [
                {
                    name: "",
                    type: "tuple",
                    internalType: "struct IOrderBook.PriceVolume",
                    components: [
                        {
                            name: "price",
                            type: "uint128",
                            internalType: "uint128",
                        },
                        {
                            name: "volume",
                            type: "uint256",
                            internalType: "uint256",
                        },
                    ],
                },
            ],
            stateMutability: "view",
        },
        {
            type: "function",
            name: "getNextBestPrices",
            inputs: [
                {
                    name: "pool",
                    type: "tuple",
                    internalType: "struct IPoolManager.Pool",
                    components: [
                        {
                            name: "baseCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "quoteCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "orderBook",
                            type: "address",
                            internalType: "contract IOrderBook",
                        },
                    ],
                },
                {
                    name: "side",
                    type: "uint8",
                    internalType: "enum IOrderBook.Side",
                },
                {
                    name: "price",
                    type: "uint128",
                    internalType: "uint128",
                },
                {
                    name: "count",
                    type: "uint8",
                    internalType: "uint8",
                },
            ],
            outputs: [
                {
                    name: "",
                    type: "tuple[]",
                    internalType: "struct IOrderBook.PriceVolume[]",
                    components: [
                        {
                            name: "price",
                            type: "uint128",
                            internalType: "uint128",
                        },
                        {
                            name: "volume",
                            type: "uint256",
                            internalType: "uint256",
                        },
                    ],
                },
            ],
            stateMutability: "view",
        },
        {
            type: "function",
            name: "getOrder",
            inputs: [
                {
                    name: "_baseCurrency",
                    type: "address",
                    internalType: "Currency",
                },
                {
                    name: "_quoteCurrency",
                    type: "address",
                    internalType: "Currency",
                },
                {
                    name: "orderId",
                    type: "uint48",
                    internalType: "uint48",
                },
            ],
            outputs: [
                {
                    name: "",
                    type: "tuple",
                    internalType: "struct IOrderBook.Order",
                    components: [
                        {
                            name: "user",
                            type: "address",
                            internalType: "address",
                        },
                        {
                            name: "id",
                            type: "uint48",
                            internalType: "uint48",
                        },
                        {
                            name: "next",
                            type: "uint48",
                            internalType: "uint48",
                        },
                        {
                            name: "quantity",
                            type: "uint128",
                            internalType: "uint128",
                        },
                        {
                            name: "filled",
                            type: "uint128",
                            internalType: "uint128",
                        },
                        {
                            name: "price",
                            type: "uint128",
                            internalType: "uint128",
                        },
                        {
                            name: "prev",
                            type: "uint48",
                            internalType: "uint48",
                        },
                        {
                            name: "expiry",
                            type: "uint48",
                            internalType: "uint48",
                        },
                        {
                            name: "status",
                            type: "uint8",
                            internalType: "enum IOrderBook.Status",
                        },
                        {
                            name: "orderType",
                            type: "uint8",
                            internalType: "enum IOrderBook.OrderType",
                        },
                        {
                            name: "side",
                            type: "uint8",
                            internalType: "enum IOrderBook.Side",
                        },
                    ],
                },
            ],
            stateMutability: "view",
        },
        {
            type: "function",
            name: "getOrderQueue",
            inputs: [
                {
                    name: "_baseCurrency",
                    type: "address",
                    internalType: "Currency",
                },
                {
                    name: "_quoteCurrency",
                    type: "address",
                    internalType: "Currency",
                },
                {
                    name: "side",
                    type: "uint8",
                    internalType: "enum IOrderBook.Side",
                },
                {
                    name: "price",
                    type: "uint128",
                    internalType: "uint128",
                },
            ],
            outputs: [
                {
                    name: "orderCount",
                    type: "uint48",
                    internalType: "uint48",
                },
                {
                    name: "totalVolume",
                    type: "uint256",
                    internalType: "uint256",
                },
            ],
            stateMutability: "view",
        },
        {
            type: "function",
            name: "initialize",
            inputs: [
                {
                    name: "_poolManager",
                    type: "address",
                    internalType: "address",
                },
                {
                    name: "_balanceManager",
                    type: "address",
                    internalType: "address",
                },
            ],
            outputs: [],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "owner",
            inputs: [],
            outputs: [
                {
                    name: "",
                    type: "address",
                    internalType: "address",
                },
            ],
            stateMutability: "view",
        },
        {
            type: "function",
            name: "placeMarketOrder",
            inputs: [
                {
                    name: "pool",
                    type: "tuple",
                    internalType: "struct IPoolManager.Pool",
                    components: [
                        {
                            name: "baseCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "quoteCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "orderBook",
                            type: "address",
                            internalType: "contract IOrderBook",
                        },
                    ],
                },
                {
                    name: "_quantity",
                    type: "uint128",
                    internalType: "uint128",
                },
                {
                    name: "_side",
                    type: "uint8",
                    internalType: "enum IOrderBook.Side",
                },
                {
                    name: "_user",
                    type: "address",
                    internalType: "address",
                },
            ],
            outputs: [
                {
                    name: "orderId",
                    type: "uint48",
                    internalType: "uint48",
                },
            ],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "placeMarketOrderWithDeposit",
            inputs: [
                {
                    name: "pool",
                    type: "tuple",
                    internalType: "struct IPoolManager.Pool",
                    components: [
                        {
                            name: "baseCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "quoteCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "orderBook",
                            type: "address",
                            internalType: "contract IOrderBook",
                        },
                    ],
                },
                {
                    name: "_quantity",
                    type: "uint128",
                    internalType: "uint128",
                },
                {
                    name: "_side",
                    type: "uint8",
                    internalType: "enum IOrderBook.Side",
                },
                {
                    name: "_user",
                    type: "address",
                    internalType: "address",
                },
            ],
            outputs: [
                {
                    name: "orderId",
                    type: "uint48",
                    internalType: "uint48",
                },
            ],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "placeOrder",
            inputs: [
                {
                    name: "pool",
                    type: "tuple",
                    internalType: "struct IPoolManager.Pool",
                    components: [
                        {
                            name: "baseCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "quoteCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "orderBook",
                            type: "address",
                            internalType: "contract IOrderBook",
                        },
                    ],
                },
                {
                    name: "_price",
                    type: "uint128",
                    internalType: "uint128",
                },
                {
                    name: "_quantity",
                    type: "uint128",
                    internalType: "uint128",
                },
                {
                    name: "_side",
                    type: "uint8",
                    internalType: "enum IOrderBook.Side",
                },
                {
                    name: "_user",
                    type: "address",
                    internalType: "address",
                },
            ],
            outputs: [
                {
                    name: "orderId",
                    type: "uint48",
                    internalType: "uint48",
                },
            ],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "placeOrderWithDeposit",
            inputs: [
                {
                    name: "pool",
                    type: "tuple",
                    internalType: "struct IPoolManager.Pool",
                    components: [
                        {
                            name: "baseCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "quoteCurrency",
                            type: "address",
                            internalType: "Currency",
                        },
                        {
                            name: "orderBook",
                            type: "address",
                            internalType: "contract IOrderBook",
                        },
                    ],
                },
                {
                    name: "_price",
                    type: "uint128",
                    internalType: "uint128",
                },
                {
                    name: "_quantity",
                    type: "uint128",
                    internalType: "uint128",
                },
                {
                    name: "_side",
                    type: "uint8",
                    internalType: "enum IOrderBook.Side",
                },
                {
                    name: "_user",
                    type: "address",
                    internalType: "address",
                },
            ],
            outputs: [
                {
                    name: "orderId",
                    type: "uint48",
                    internalType: "uint48",
                },
            ],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "renounceOwnership",
            inputs: [],
            outputs: [],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "swap",
            inputs: [
                {
                    name: "srcCurrency",
                    type: "address",
                    internalType: "Currency",
                },
                {
                    name: "dstCurrency",
                    type: "address",
                    internalType: "Currency",
                },
                {
                    name: "srcAmount",
                    type: "uint256",
                    internalType: "uint256",
                },
                {
                    name: "minDstAmount",
                    type: "uint256",
                    internalType: "uint256",
                },
                {
                    name: "maxHops",
                    type: "uint8",
                    internalType: "uint8",
                },
                {
                    name: "user",
                    type: "address",
                    internalType: "address",
                },
            ],
            outputs: [
                {
                    name: "receivedAmount",
                    type: "uint256",
                    internalType: "uint256",
                },
            ],
            stateMutability: "nonpayable",
        },
        {
            type: "function",
            name: "transferOwnership",
            inputs: [
                {
                    name: "newOwner",
                    type: "address",
                    internalType: "address",
                },
            ],
            outputs: [],
            stateMutability: "nonpayable",
        },
        {
            type: "event",
            name: "Initialized",
            inputs: [
                {
                    name: "version",
                    type: "uint64",
                    indexed: false,
                    internalType: "uint64",
                },
            ],
            anonymous: false,
        },
        {
            type: "event",
            name: "OwnershipTransferred",
            inputs: [
                {
                    name: "previousOwner",
                    type: "address",
                    indexed: true,
                    internalType: "address",
                },
                {
                    name: "newOwner",
                    type: "address",
                    indexed: true,
                    internalType: "address",
                },
            ],
            anonymous: false,
        },
        {
            type: "error",
            name: "FillOrKillNotFulfilled",
            inputs: [
                {
                    name: "filledAmount",
                    type: "uint128",
                    internalType: "uint128",
                },
                {
                    name: "requestedAmount",
                    type: "uint128",
                    internalType: "uint128",
                },
            ],
        },
        {
            type: "error",
            name: "InsufficientBalance",
            inputs: [
                {
                    name: "requiredDeposit",
                    type: "uint256",
                    internalType: "uint256",
                },
                {
                    name: "userBalance",
                    type: "uint256",
                    internalType: "uint256",
                },
            ],
        },
        {
            type: "error",
            name: "InvalidInitialization",
            inputs: [],
        },
        {
            type: "error",
            name: "InvalidOrderType",
            inputs: [],
        },
        {
            type: "error",
            name: "InvalidPrice",
            inputs: [
                {
                    name: "price",
                    type: "uint256",
                    internalType: "uint256",
                },
            ],
        },
        {
            type: "error",
            name: "InvalidPriceIncrement",
            inputs: [],
        },
        {
            type: "error",
            name: "InvalidQuantity",
            inputs: [],
        },
        {
            type: "error",
            name: "InvalidQuantityIncrement",
            inputs: [],
        },
        {
            type: "error",
            name: "NotInitializing",
            inputs: [],
        },
        {
            type: "error",
            name: "OrderHasNoLiquidity",
            inputs: [],
        },
        {
            type: "error",
            name: "OrderNotFound",
            inputs: [],
        },
        {
            type: "error",
            name: "OrderTooLarge",
            inputs: [
                {
                    name: "amount",
                    type: "uint256",
                    internalType: "uint256",
                },
                {
                    name: "maxAmount",
                    type: "uint256",
                    internalType: "uint256",
                },
            ],
        },
        {
            type: "error",
            name: "OrderTooSmall",
            inputs: [
                {
                    name: "amount",
                    type: "uint256",
                    internalType: "uint256",
                },
                {
                    name: "minAmount",
                    type: "uint256",
                    internalType: "uint256",
                },
            ],
        },
        {
            type: "error",
            name: "OwnableInvalidOwner",
            inputs: [
                {
                    name: "owner",
                    type: "address",
                    internalType: "address",
                },
            ],
        },
        {
            type: "error",
            name: "OwnableUnauthorizedAccount",
            inputs: [
                {
                    name: "account",
                    type: "address",
                    internalType: "address",
                },
            ],
        },
        {
            type: "error",
            name: "PostOnlyWouldTake",
            inputs: [],
        },
        {
            type: "error",
            name: "QueueEmpty",
            inputs: [],
        },
        {
            type: "error",
            name: "SlippageExceeded",
            inputs: [
                {
                    name: "requestedPrice",
                    type: "uint256",
                    internalType: "uint256",
                },
                {
                    name: "limitPrice",
                    type: "uint256",
                    internalType: "uint256",
                },
            ],
        },
        {
            type: "error",
            name: "SlippageTooHigh",
            inputs: [
                {
                    name: "received",
                    type: "uint256",
                    internalType: "uint256",
                },
                {
                    name: "minReceived",
                    type: "uint256",
                    internalType: "uint256",
                },
            ],
        },
        {
            type: "error",
            name: "TradingPaused",
            inputs: [],
        },
        {
            type: "error",
            name: "UnauthorizedCancellation",
            inputs: [],
        },
        {
            type: "error",
            name: "UnauthorizedRouter",
            inputs: [
                {
                    name: "reouter",
                    type: "address",
                    internalType: "address",
                },
            ],
        },
    ]

export default abi;