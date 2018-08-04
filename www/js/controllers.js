angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $cordovaSQLite, $state, $ionicHistory, $ionicViewSwitcher, $ionicLoading, $ionicModal, $ionicListDelegate, $ionicPopup, $cordovaToast) {
    loading(1);
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
        var query = "SELECT * FROM product";
        $cordovaSQLite.execute(db, query).then(function(result) {
            $scope.products = [];
            for (var i = 0; i < result.rows.length; i++) {
                $scope.products.push(result.rows.item(i));
            }
            loading(0);
        }, function (err) {
            error(err);
        });
    }

    // -- Get bill and connection info from database
    function getAppInfo() {
        var query = "SELECT * FROM bill WHERE active = ?";
        $cordovaSQLite.execute(db, query, [1]).then(function(result) {
            if (result.rows.length) {
                $scope.bill = result.rows.item(0);
                var query2 = "SELECT * FROM connection WHERE bill_id = ?";
                $cordovaSQLite.execute(db, query2, [$scope.bill.id]).then(function(result2) {
                    $scope.connection = [];
                    for (var k = 0; k < result2.rows.length; k++) {
                        $scope.connection.push(result2.rows.item(k));
                    }
                    loading(0);
                }, function (err) {
                    error(err);
                });
            }
        }, function (err) {
            error(err);
        });
    }

    // -- Set the product to the current bill
    $scope.selectProduct = function(product) {
        loading(1);
        var query = "SELECT * FROM connection WHERE product_id = ? AND bill_id = ?";
        $cordovaSQLite.execute(db, query, [product.id, $scope.bill.id]).then(function(result) {
            if (result.rows.length) {
                var query2 = "UPDATE connection SET amount = ? WHERE product_id = ?";
                $cordovaSQLite.execute(db, query2, [result.rows.item(0).amount + 1, product.id]).then(function(result2) {
                    for (var i = 0; i < $scope.connection.length; i++) {
                        if ($scope.connection[i].product_id == product.id) {
                            $scope.connection[i].amount++;
                        }
                    }
                    toast("Produto adicionado à conta atual");
                    loading(0);
                }, function (err) {
                    error(err);
                });
            } else {
                var query2 = "INSERT INTO connection (product_id, bill_id, amount) VALUES (?, ?, ?)";
                $cordovaSQLite.execute(db, query2, [product.id, $scope.bill.id, 1]).then(function(result2) {
                    toast("Produto adicionado à conta atual");
                    loading(0);
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
        loading(1);
        var query = "INSERT INTO product (name, price) VALUES (?, ?)";
        $cordovaSQLite.execute(db, query, [$scope.newProduct.name, $scope.newProduct.price]).then(function(result) {
            $scope.newProduct.id = result.insertId;
            $scope.products.push(angular.copy($scope.newProduct));
            $scope.newProduct = {name: "", price: "", id: 0};
            $scope.addProductModal.hide();
            toast("Produto adicionado ao app");
            loading(0);
        }, function (err) {
            error(err);
        });
    };

    // -- Delete the product from the app
    $scope.deleteProduct = function(product, index) {
        $ionicListDelegate.closeOptionButtons();
        loading(1);
        var query = "DELETE FROM product WHERE id = ?";
        $cordovaSQLite.execute(db, query, [product.id]).then(function(result) {
            $scope.products.splice(index, 1);
            toast("Produto removido do app");
            loading(0);
        }, function (err) {
            error(err);
        });
    };

    // -- Show/Hide the ionic loading
    function loading(show) {
        if (show) {
            $ionicLoading.show({
                template: '<ion-spinner class="spinner-balanced"></ion-spinner><p>Um momento...</p>'
            });
        } else {
            $ionicLoading.hide();
        }
    }

    // -- Show toast messages
    function toast(message) {
        try {
            $cordovaToast.show(message, 'long', 'center');
        } catch(err) {
           console.error(message);
        }
    }

    // -- Hide loading and show error warning
    function error(err) {
        loading(0);
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

.controller('ChatsCtrl', function($scope, $cordovaSQLite, $ionicLoading, $ionicListDelegate, $ionicPopup) {
    loading(1);
    var db = window.openDatabase("tk.db", "1.0", "iList", 1);

    $scope.bill = null;
    $scope.products = [];
    $scope.connection = [];

    // -- Get all information from database
    function getAppInfo() {
        var query = "SELECT * FROM product";
        $cordovaSQLite.execute(db, query).then(function(result) {
            $scope.products = [];
            for (var i = 0; i < result.rows.length; i++) {
                $scope.products.push(result.rows.item(i));
            }
            loading(0);
            var query2 = "SELECT * FROM bill WHERE active = ?";
            $cordovaSQLite.execute(db, query2, [1]).then(function(result2) {
                if (result2.rows.length) {
                    $scope.bill = result2.rows.item(0);
                    var query3 = "SELECT * FROM connection WHERE bill_id = ?";
                    $cordovaSQLite.execute(db, query3, [$scope.bill.id]).then(function(result3) {
                        $scope.connection = [];
                        for (var k = 0; k < result3.rows.length; k++) {
                            $scope.connection.push(result3.rows.item(k));
                            for (var j = 0; j < $scope.products.length; j++) {
                                if (result3.rows.item(k).product_id == $scope.products[j].id && result3.rows.item(k).bill_id == $scope.bill.id) {
                                    $scope.bill.price = $scope.bill.price + (result3.rows.item(k).amount * $scope.products[j].price);
                                }
                            }
                        }
                        loading(0);
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
            var confirmPopup = $ionicPopup.confirm({
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
                                loading(1);
                                var now = new Date();
                                for (var i = 0; i < $scope.connection.length; i++) {
                                    for (var j = 0; j < $scope.products.length; j++) {
                                        if ($scope.connection[i].product_id == $scope.products[j].id && $scope.connection[i].bill_id == $scope.bill.id) {
                                            $scope.bill.price = $scope.bill.price + ($scope.connection[i].amount * $scope.products[j].price);
                                        }
                                    }
                                }
                                var query = "UPDATE bill SET active = ?, name = ?, price = ?, end = ? WHERE id = ?";
                                $cordovaSQLite.execute(db, query, [0, $scope.bill.name, $scope.bill.price, now, $scope.bill.id]).then(function(result) {
                                    var query = "INSERT INTO bill (start, active, price) VALUES (?, ?, ?)";
                                    $cordovaSQLite.execute(db, query, [now, 1, 0]).then(function(result) {
                                        $scope.bill = {id: result.insertId, start: now, price: 0};
                                        $scope.connection = [];
                                        toast("Nova conta iniciada");
                                        loading(0);
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
            var now = new Date();
            var query = "INSERT INTO bill (start, active, price) VALUES (?, ?, ?)";
            $cordovaSQLite.execute(db, query, [now, 1, 0]).then(function(result) {
                $scope.bill = {id: result.insertId, start: now, price: 0};
                $scope.connection = [];
                toast("Nova conta iniciada");
                loading(0);
            }, function (err) {
                error(err);
            });
        }
    };

    // -- Delete the connection from the account
    $scope.deleteConnection = function(connection, index) {
        $ionicListDelegate.closeOptionButtons();
        loading(1);
        var query = "DELETE FROM connection WHERE id = ?";
        $cordovaSQLite.execute(db, query, [connection.id]).then(function(result) {
            $scope.connection.splice(index, 1);
            toast("Produto removido da conta");
            loading(0);
        }, function (err) {
            error(err);
        });
    };

    // -- Find product id to show its price inside the bill
    $scope.findProduct = function(id) {
        return $scope.products.find(function(x) {
            return x.id == id;
        });
    };

    // -- Show/Hide the ionic loading
    function loading(show) {
        if (show) {
            $ionicLoading.show({
                template: '<ion-spinner class="spinner-balanced"></ion-spinner><p>Um momento...</p>'
            });
        } else {
            $ionicLoading.hide();
        }
    }

    // -- Show toast messages
    function toast(message) {
        try {
            $cordovaToast.show(message, 'long', 'center');
        } catch(err) {
           console.error(message);
        }
    }

    // -- Hide loading and show error warning
    function error(err) {
        loading(0);
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

.controller('AccountCtrl', function($scope, $cordovaSQLite, $filter, $ionicListDelegate, $ionicLoading) {
    var db = window.openDatabase("tk.db", "1.0", "iList", 1);
    $scope.bills = [];

    // -- Get all information from database
    function getBillsInfo() {
        var query = "SELECT * FROM bill WHERE active = 0";
        $cordovaSQLite.execute(db, query).then(function(result) {
            $scope.bills = [];
            for (var i = 0; i < result.rows.length; i++) {
                var start = $filter('date')(new Date(result.rows.item(i).start), 'dd/MM');
                var end = $filter('date')(new Date(result.rows.item(i).end), 'dd/MM');
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
        loading(1);
        var query = "DELETE FROM bill WHERE id = ?";
        $cordovaSQLite.execute(db, query, [bill.id]).then(function(result) {
            $scope.bills.splice(index, 1);
            toast("Bill removida do app");
            loading(0);
        }, function (err) {
            error(err);
        });
    };

    // -- Show/Hide the ionic loading
    function loading(show) {
        if (show) {
            $ionicLoading.show({
                template: '<ion-spinner class="spinner-balanced"></ion-spinner><p>Um momento...</p>'
            });
        } else {
            $ionicLoading.hide();
        }
    }

    // -- Show toast messages
    function toast(message) {
        try {
            $cordovaToast.show(message, 'long', 'center');
        } catch(err) {
           console.error(message);
        }
    }

    // -- Hide loading and show error warning
    function error(err) {
        loading(0);
        console.error(err);
        toast("Alguma coisa deu errado");
    }

    $scope.$on('$ionicView.enter', function(e) {
        getBillsInfo();
    });
});
