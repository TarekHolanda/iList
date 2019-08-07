angular.module('starter.controllers', [])

.controller("ProductController", function($scope, $cordovaSQLite, $state, $ionicHistory, $ionicViewSwitcher, $ionicModal, $ionicListDelegate, $ionicPopup, $timeout) {
    var db = window.openDatabase("tk.db", "1.0", "iList", 1);
    // -- Create database, set empty products list
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS product (id integer primary key, name text, price float)");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS bill (id integer primary key, name text, price float, start datetime, end datetime, active boolean)");
    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS connection (id integer primary key, product_id integer, bill_id integer, amount integer)");
    //$cordovaSQLite.execute(db, "DROP TABLE bill");
    
    $scope.bill = null;
    $scope.products = [];
    $scope.connection = [];
    $scope.newProduct = {name: "", price: "", id: 0};

    // -- Get products information from database
    function getProducts() {
        let query = "SELECT * FROM product";
        $cordovaSQLite.execute(db, query).then(function(result) {
            $scope.products = [];
            for (let i = 0; i < result.rows.length; i++) {
                $scope.products.push(result.rows.item(i));
            }
        }, function (err) {
            error(err);
        });
    }

    // -- Get bill and connection info from database
    function getAppInfo() {
        let query = "SELECT * FROM bill WHERE active = ?";
        $cordovaSQLite.execute(db, query, [1]).then(function(result) {
            if (result.rows.length) {
                $scope.bill = result.rows.item(0);
                let query2 = "SELECT * FROM connection WHERE bill_id = ?";
                $cordovaSQLite.execute(db, query2, [$scope.bill.id]).then(function(result2) {
                    $scope.connection = [];
                    for (let k = 0; k < result2.rows.length; k++) {
                        $scope.connection.push(result2.rows.item(k));
                    }
                }, function (err) {
                    error(err);
                });
            } else {
                createFirstBill();
            }
        }, function (err) {
            error(err);
        });
    }

    // -- Create the first and default bill
    function createFirstBill() {
        let now = new Date();
        let query = "INSERT INTO bill (start, active, price) VALUES (?, ?, ?)";
        $cordovaSQLite.execute(db, query, [now, 1, 0]).then(function(result) {
            $scope.bill = {id: result.insertId, start: now, price: 0};
            $scope.connection = [];
            getAppInfo();
        }, function (err) {
            error(err);
        });
    }

    // -- Set the product to the current bill
    $scope.selectProduct = function(product) {
        let query = "SELECT * FROM connection WHERE product_id = ? AND bill_id = ?";
        $cordovaSQLite.execute(db, query, [product.id, $scope.bill.id]).then(function(result) {
            if (result.rows.length) {
                let query2 = "UPDATE connection SET amount = ? WHERE product_id = ?";
                $cordovaSQLite.execute(db, query2, [result.rows.item(0).amount + 1, product.id]).then(function(result2) {
                    for (let i = 0; i < $scope.connection.length; i++) {
                        if ($scope.connection[i].product_id == product.id) {
                            $scope.connection[i].amount++;
                        }
                    }
                    toast("Produto adicionado à conta atual");
                }, function (err) {
                    error(err);
                });
            } else {
                let query2 = "INSERT INTO connection (product_id, bill_id, amount) VALUES (?, ?, ?)";
                $cordovaSQLite.execute(db, query2, [product.id, $scope.bill.id, 1]).then(function(result2) {
                    toast("Produto adicionado à conta atual");
                }, function (err) {
                    error(err);
                });
            }
        }, function (err) {
            error(err);
        });
    };

    // -- Create new product for the app
    $scope.addProduct = function() {
        let query = "INSERT INTO product (name, price) VALUES (?, ?)";
        $cordovaSQLite.execute(db, query, [$scope.newProduct.name, $scope.newProduct.price]).then(function(result) {
            $scope.newProduct.id = result.insertId;
            $scope.products.push(angular.copy($scope.newProduct));
            $scope.newProduct = {name: "", price: "", id: 0};
            $scope.addProductModal.hide();
            toast("Produto adicionado ao app");
        }, function (err) {
            error(err);
        });
    };

    // Edit functionality in construction
    // // -- Edit product price or name
    // function editProduct = function(product_id, new_name, new_price) {
    //     let query = "UPDATE product SET name = ?, price = ? WHERE id = ?";
    //     $cordovaSQLite.execute(db, query, [new_name, new_price, product_id]).then(function(result) {
    //         // let productRemoved = $scope.findProduct(connection.product_id);
    //         // $scope.bill.price = $scope.bill.price - productRemoved.price;
    //         toast("Uma unidade do produto removida");
    //     }, function (err) {
    //         error(err);
    //     });

    //     let query = "UPDATE INTO product (name, price) VALUES (?, ?)";
    //     $cordovaSQLite.execute(db, query, [$scope.newProduct.name, $scope.newProduct.price]).then(function(result) {
    //         $scope.newProduct.id = result.insertId;
    //         $scope.products.push(angular.copy($scope.newProduct));
    //         $scope.newProduct = {name: "", price: "", id: 0};
    //         $scope.addProductModal.hide();
    //         toast("Produto adicionado ao app");
    //     }, function (err) {
    //         error(err);
    //     });
    // }

    // -- Delete the product from the app
    $scope.deleteProduct = function(product, index) {
        $ionicListDelegate.closeOptionButtons();
        let query = "DELETE FROM product WHERE id = ?";
        $cordovaSQLite.execute(db, query, [product.id]).then(function(result) {
            $scope.products.splice(index, 1);
            toast("Produto removido do app");
        }, function (err) {
            error(err);
        });
    };

    // -- Show toast messages
    function toast(message) {
        var _toastElement = document.createElement("div");
        _toastElement.innerHTML = '' +
            '<div class="hc-toast-wrapper">' +
            // '  <div class="hc-toast hc-toast-hidden hc-toast-' + position + '">' +
            '  <div class="hc-toast hc-toast-hidden hc-toast-bottom">' +
            '    <span>' + message + '</span>' +
            '  </div>' +
            '</div>';

        var _innerToastElement = _toastElement.querySelector(".hc-toast-wrapper .hc-toast");
        document.body.appendChild(_toastElement);
        $timeout(function () {
            // _innerToastElement.className = "hc-toast hc-toast-" + position;
            _innerToastElement.className = "hc-toast hc-toast-bottom";
            $timeout(function () {
                _innerToastElement.className += " hc-toast-hidden";
                $timeout(function () {
                    document.body.removeChild(_toastElement);
                }, 600);
            }, 3500);
        });
    }

    // -- Show error warning
    function error(err) {
        console.error(err);
        toast("Alguma coisa deu errado");
    }

    // -- Modals declaration
    $ionicModal.fromTemplateUrl('templates/add-product.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.addProductModal = modal;
    });

    $scope.$on('$ionicView.enter', function(e) {
        getAppInfo();
    });

    getProducts();
})

.controller("BillController", function($scope, $cordovaSQLite, $ionicListDelegate, $ionicPopup, $timeout) {
    var db = window.openDatabase("tk.db", "1.0", "iList", 1);

    $scope.bill = null;
    $scope.products = [];
    $scope.connection = [];

    // -- Get all information from database
    function getAppInfo() {
        let query = "SELECT * FROM product";
        $cordovaSQLite.execute(db, query).then(function(result) {
            $scope.products = [];
            for (let i = 0; i < result.rows.length; i++) {
                $scope.products.push(result.rows.item(i));
            }
            let query2 = "SELECT * FROM bill WHERE active = ?";
            $cordovaSQLite.execute(db, query2, [1]).then(function(result2) {
                if (result2.rows.length) {
                    $scope.bill = result2.rows.item(0);
                    let query3 = "SELECT * FROM connection WHERE bill_id = ?";
                    $cordovaSQLite.execute(db, query3, [$scope.bill.id]).then(function(result3) {
                        $scope.connection = [];
                        for (let k = 0; k < result3.rows.length; k++) {
                            $scope.connection.push(result3.rows.item(k));
                            for (let j = 0; j < $scope.products.length; j++) {
                                if (result3.rows.item(k).product_id == $scope.products[j].id && result3.rows.item(k).bill_id == $scope.bill.id) {
                                    $scope.bill.price = $scope.bill.price + (result3.rows.item(k).amount * $scope.products[j].price);
                                }
                            }
                        }
                    }, function (err) {
                        error(err);
                    });
                }
            }, function (err) {
                error(err);
            });
        }, function (err) {
            error(err);
        });
    }

    // -- Start a new bill with no products
    $scope.startBill = function() {
        if ($scope.bill) {
            let confirmPopup = $ionicPopup.confirm({
                title: 'Quer iniciar uma nova conta?',
                subTitle: 'Digite o nome da conta atual',
                template: '<input type="text" ng-model="bill.name">',
                scope: $scope,
                buttons: [
                    { text: 'Cancelar' },
                    {
                        text: '<b>Confirmar</b>', type: 'button-positive',
                        onTap: function(e) {
                            if (!$scope.bill.name) {
                                toast("Digite o nome da conta atual");
                                e.preventDefault();
                            } else {
                                let now = new Date();
                                let query = "UPDATE bill SET active = ?, name = ?, price = ?, end = ? WHERE id = ?";
                                $cordovaSQLite.execute(db, query, [0, $scope.bill.name, $scope.bill.price, now, $scope.bill.id]).then(function(result) {
                                    let query = "INSERT INTO bill (start, active, price) VALUES (?, ?, ?)";
                                    $cordovaSQLite.execute(db, query, [now, 1, 0]).then(function(result) {
                                        $scope.bill = {id: result.insertId, start: now, price: 0};
                                        $scope.connection = [];
                                        toast("Nova conta iniciada");
                                    }, function (err) {
                                        error(err);
                                    });
                                }, function (err) {
                                    error(err);
                                });
                            }
                        }
                    }
                ]
            });
        } else {
            let now = new Date();
            let query = "INSERT INTO bill (start, active, price) VALUES (?, ?, ?)";
            $cordovaSQLite.execute(db, query, [now, 1, 0]).then(function(result) {
                $scope.bill = {id: result.insertId, start: now, price: 0};
                $scope.connection = [];
                toast("Nova conta iniciada");
            }, function (err) {
                error(err);
            });
        }
    };

    // -- Delete the one product from the bill
    $scope.removeProductUnit = function(connection, index) {
        if (connection.amount == 1) {
            $scope.deleteConnection(connection, index);
        } else {
            connection.amount--;
            let query = "UPDATE connection SET amount = ? WHERE product_id = ?";
            $cordovaSQLite.execute(db, query, [connection.amount, connection.product_id]).then(function(result) {
                let productRemoved = $scope.findProduct(connection.product_id);
                $scope.bill.price = $scope.bill.price - productRemoved.price;
                toast("Uma unidade do produto removida");
            }, function (err) {
                error(err);
            });
        }
    };

    // -- Delete the connection from the bill
    $scope.deleteConnection = function(connection, index) {
        $ionicListDelegate.closeOptionButtons();
        let query = "DELETE FROM connection WHERE id = ?";
        $cordovaSQLite.execute(db, query, [connection.id]).then(function(result) {
            let productRemoved = $scope.findProduct(connection.product_id);
            $scope.bill.price = $scope.bill.price - productRemoved.price;
            $scope.connection.splice(index, 1);
            toast("Produto removido da conta");
        }, function (err) {
            error(err);
        });
    };

    function updateBillPriceRemovingProduct(product_id) {
        for (let i = 0; $scope.products.length < i; i++) {
            if ($scope.products[i].id == product_id) {
                $scope.bill.price = $scope.bill.price - $scope.products[i].price;
            }
        }
    }

    // -- Find product id to show its price inside the bill
    $scope.findProduct = function(id) {
        return $scope.products.find(function(x) {
            return x.id == id;
        });
    };

    // -- Show toast messages
    function toast(message) {
        var _toastElement = document.createElement("div");
        _toastElement.innerHTML = '' +
            '<div class="hc-toast-wrapper">' +
            // '  <div class="hc-toast hc-toast-hidden hc-toast-' + position + '">' +
            '  <div class="hc-toast hc-toast-hidden hc-toast-bottom">' +
            '    <span>' + message + '</span>' +
            '  </div>' +
            '</div>';

        var _innerToastElement = _toastElement.querySelector(".hc-toast-wrapper .hc-toast");
        document.body.appendChild(_toastElement);
        $timeout(function () {
            // _innerToastElement.className = "hc-toast hc-toast-" + position;
            _innerToastElement.className = "hc-toast hc-toast-bottom";
            $timeout(function () {
                _innerToastElement.className += " hc-toast-hidden";
                $timeout(function () {
                    document.body.removeChild(_toastElement);
                }, 600);
            }, 3500);
        });
    }

    // -- Show error warning
    function error(err) {
        console.error(err);
        toast("Alguma coisa deu errado");
    }

    $scope.$on('$ionicView.enter', function(e) {
        getAppInfo();
    });
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
    $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope, $cordovaSQLite, $filter, $ionicListDelegate, $timeout) {
    var db = window.openDatabase("tk.db", "1.0", "iList", 1);
    $scope.bills = [];

    // -- Get all information from database
    function getBillsInfo() {
        let query = "SELECT * FROM bill WHERE active = 0";
        $cordovaSQLite.execute(db, query).then(function(result) {
            $scope.bills = [];
            for (let i = 0; i < result.rows.length; i++) {
                let start = $filter('date')(new Date(result.rows.item(i).start), 'dd/MM');
                let end = $filter('date')(new Date(result.rows.item(i).end), 'dd/MM');
                $scope.bills.push(result.rows.item(i));
                $scope.bills[$scope.bills.length-1].start = start;
                $scope.bills[$scope.bills.length-1].end = end;
            }
        }, function (err) {
            error(err);
        });
    }

    // -- Delete the bill from the app
    $scope.deleteBill = function(bill, index) {
        $ionicListDelegate.closeOptionButtons();
        let query = "DELETE FROM bill WHERE id = ?";
        $cordovaSQLite.execute(db, query, [bill.id]).then(function(result) {
            $scope.bills.splice(index, 1);
            toast("Bill removida do app");
        }, function (err) {
            error(err);
        });
    };

    // -- Show toast messages
    function toast(message) {
        var _toastElement = document.createElement("div");
        _toastElement.innerHTML = '' +
            '<div class="hc-toast-wrapper">' +
            // '  <div class="hc-toast hc-toast-hidden hc-toast-' + position + '">' +
            '  <div class="hc-toast hc-toast-hidden hc-toast-bottom">' +
            '    <span>' + message + '</span>' +
            '  </div>' +
            '</div>';

        var _innerToastElement = _toastElement.querySelector(".hc-toast-wrapper .hc-toast");
        document.body.appendChild(_toastElement);
        $timeout(function () {
            // _innerToastElement.className = "hc-toast hc-toast-" + position;
            _innerToastElement.className = "hc-toast hc-toast-bottom";
            $timeout(function () {
                _innerToastElement.className += " hc-toast-hidden";
                $timeout(function () {
                    document.body.removeChild(_toastElement);
                }, 600);
            }, 3500);
        });
    }

    // -- Show error warning
    function error(err) {
        console.error(err);
        toast("Alguma coisa deu errado");
    }

    $scope.$on('$ionicView.enter', function(e) {
        getBillsInfo();
    });
});
