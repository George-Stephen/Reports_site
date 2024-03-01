$(document).ready(function(){
    
    // Reload the page after 1 hour (3600 seconds)
    setTimeout(function() {
        location.reload();
    }, 3600000);

    fetchCountryData();

    $('#country-dropdown').change(function() {
        var selectedCountry = $(this).val();
        console.log('Selected country:', selectedCountry);
        fetchBranches(selectedCountry);
    });

    $('#branch-dropdown').change(function() {
        var selectedCountry = $('#country-dropdown').val();
        var selectedBranch = $(this).val();
        fetchOrders(selectedCountry, selectedBranch);
        fetchCardsIssued(selectedCountry, selectedBranch);
        fetchProducts(selectedBranch,selectedCountry);
    });



    // Event listener for dropdown change
$('#time-range, #product-dropdown').change(function() {
    var branchCode = $('#branch-dropdown').val();
    var productCode = $('#product-dropdown').val();

    fetchCardApplication(branchCode, productCode).then(function(data) {   
        var filteredApplication = filterApplicationByTimeRange(data);
        return calculateRevenue(filteredApplication);
    }).then(function(revenueData) {
        displayLineGraph(revenueData);
    }).catch(function(error) {
        console.error('Error:', error);
    });
});

    // Export to PDF
    $('#ExportPdf').click(function(){
        window.print();
    });
});

var Total_Quantity = 0;

var BASE_URL = 'http://192.168.1.44:8085/';

function fetchCountryData() {
    $.ajax({
        url: BASE_URL+'reports/countries/active',
        type: 'GET',
        success: function(data) {
            console.log('Fetched country data:', data);
            populateCountryDropdown(data);
        },
        error: function(error) {
            console.error('Error fetching country data:', error);
        }
    });
}

function populateCountryDropdown(countries) {
    var countryDropdown = $('#country-dropdown');
    countryDropdown.empty(); // Clear existing options
    // Add default option
    countryDropdown.append('<option value="">Select Country</option>');
    countries.forEach(function(country) {
        countryDropdown.append('<option value="' + country.code + '">' + country.name + '</option>');
    });
}

function fetchBranches(countryCode) {
    $.ajax({
        url: BASE_URL+'reports/branches/by-country/active?countryCode='+countryCode,
        type: 'GET',
        success: function(data) {
            console.log('Fetched branches:', data);
            populateBranches(data);
        },
        error: function(error) {
            console.error('Error fetching branches:', error);
        }
    });
}

function populateBranches(branches) {
    var branchDropdown = $('#branch-dropdown');
    branchDropdown.empty(); // Clear existing options
    branchDropdown.append('<option value="">Select Branch</option>');
    branches.forEach(function(branch) {
        branchDropdown.append('<option value="' + branch.code + '">' + branch.name + '</option>');
    });
}

function fetchProducts(branchCode,countryCode) {
    $.ajax({
        url: BASE_URL+'reports/products/by-country?countryCode='+countryCode,
        type: 'GET',
        success: function(data) {
            console.log('Fetched products:', data);
            FetchOrderswithProduct(data,branchCode,countryCode);
            populateProducts(data);
        },
        error: function(error) {
            console.error('Error fetching products:', error);
        }
    });
}

function populateProducts(products) {
    var productDropdown = $('#product-dropdown');
    productDropdown.empty(); // Clear existing options
    productDropdown.append('<option value="">Select Product</option>');
    
    products.forEach(function(product) {
        productDropdown.append('<option value="' + product.bin + '">' + product.name + '</option>');
    });
}

function fetchOrders(countryCode, branchCode) {
    $.ajax({
        url: BASE_URL+'reports/orders/by-branch-and-country/'+countryCode+'/'+branchCode,
        type: 'GET',
        success: function(data) {
            processOrdersByProduct(data);
            displayStatusPieChart(data);
            var recievedOrders = data.filter(function(order) {
                return order.status === 7;
            });

            Total_Quantity = calculateQuantity(recievedOrders);
        },
        error: function(error) {
            console.error('Error fetching orders:', error);
        }
    });
}

function calculateQuantity(orders) {
    // var Total_Quantity = 0;
    orders.forEach(function(order) {
        Total_Quantity += order.quantity;
    });
    return Total_Quantity;
}

function fetchCardsIssued(countryCode, branchCode) {
    $.ajax({
        url: BASE_URL+'reports/plastics/by-branch/'+countryCode+'/'+branchCode,
        type: 'GET',
        success: function(data) {
            // console.log('Fetched cards issued:', data);
            // processCardsIssued(data);
            var Total_Issued = data.filter(function(card) {
                return card.status === 2;
            }).length;

            var Destroyed_Cards = data.filter(function(card) {
                return card.status === 5;
            });

            displayDestroyedCardsTable(Destroyed_Cards);
            var Destroyed_Card_number = Destroyed_Cards.length;
            var availableCards = Total_Quantity - Total_Issued - Destroyed_Card_number;
            displayPieChart(Total_Issued, availableCards,Destroyed_Card_number);
        },
        error: function(error) {
            console.error('Error fetching cards issued:', error);
        }
    });
}

var PieChart;

function displayPieChart(Total_Issued, availableCards, Destroyed_Cards) {

    if (PieChart) {
        // If a chart instance exists, destroy it
        PieChart.destroy();
    }
    var ctx = document.getElementById('inventoryChart').getContext('2d');
    PieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Total Issued', 'Available Cards', 'Destroyed Cards'],
            datasets: [{
                label: 'Cards Issued',
                data: [Total_Issued, availableCards,Destroyed_Cards],
                backgroundColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'

                ],
                borderWidth: 1
            }]
        },
        options: {
            legend: {
                display: true,
                position: 'bottom'
            }
        }
    });
}

function displayDestroyedCardsTable(Destroyed_Cards) {
    // Clear the existing data in the DataTable
    var table = $('#destroyed_cards').DataTable();
    table.clear().draw();

    // Add each destroyed card to the DataTable
    Destroyed_Cards.forEach(function(card) {
        table.row.add([
            card.orderReference,
            card.productCode,
            card.pan,
            card.serial
        ]).draw(false);
    });
}


var statusPieChart;

function displayStatusPieChart(orders){
    if (statusPieChart) {
        // If a chart instance exists, destroy it
        statusPieChart.destroy();
    }

    var statusCounts = {
        0: 0, // Not verified
        1: 0, // Verified at branch
        3: 0, // Approved at card centre
        5: 0, // File imported
        6: 0, // Dispatched (acknowledged at center)
        7: 0  // Received
    };

    orders.forEach(function(order) {
        statusCounts[order.status] += 1;
    });

    var ctx = document.getElementById('orderStatusChart').getContext('2d');
    statusPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Not Verified', 'Verified at Branch', 'Approved at Card Centre', 'File Imported', 'Dispatched', 'Received'],
            datasets: [{
                data: [
                    statusCounts[0],
                    statusCounts[1],
                    statusCounts[3],
                    statusCounts[5],
                    statusCounts[6],
                    statusCounts[7]
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            legend: {
                display: true,
                position: 'bottom'
            }
        }
    });

}



function FetchOrderswithProduct(products,branchCode,countryCode){
    // console.log('Products:', products);
    // console.log('Branch:', branchCode);
    // console.log('Country:', countryCode);
    products.forEach(product => {
        $.ajax({
            url: BASE_URL+'reports/orders/by-branch-and-product/'+branchCode+'/'+product.bin,
            type: 'GET',
            success: function(data) {
                // console.log('Fetched orders:', data);
                processOrders(data,products);
                
                FetchCardsIssuedByProduct(products,countryCode,branchCode);
            },
            error: function(error) {
                console.error('Error fetching orders:', error);
            }
        });

    });
}

var productStats = {};

function processOrders(orders,products) {
    var recievedOrders = orders.filter(function(order) {
        return order.status === 7;
    });

    // console.log('Recieved Orders:', recievedOrders);
    // console.log('Products:', products);
    

    products.forEach(function(product) {
        productStats[product.code] = {
            product_name: product.code,
            total_orders: 0,
            total_cards_issued: 0
        };

        recievedOrders.forEach(function(order){
            if (order.productCode === product.bin) {
                productStats[product.code].total_orders += order.quantity;
            }
        });

        displayTable(productStats);

    });


}

function FetchCardsIssuedByProduct(products,countryCode,branchCode){
    products.forEach(product => {
        $.ajax({
            url: BASE_URL+'reports/plastics/by-product/'+product.code+'/'+countryCode+'/'+branchCode,
            type: 'GET',
            success: function(data) {
                // console.log('Fetched cards issued:', data);
                processCardsIssued(data);
            },
            error: function(error) {
                console.error('Error fetching cards issued:', error);
            }
        });

    });
}

function processCardsIssued(cards) {

        // console.log('Cards:', cards);
        // console.log('Product Stats:', productStats);

        // Check if the cards array is not empty
        if (cards.length > 0) {
            console.log('Cards:', cards);
            cards.forEach(function(card) {
                // Check if card and card.productCode are defined and not null
                if (productStats[card.productCode]) {
                    if (card.status === 2) {
                        console.log('Card:', card);
                        productStats[card.productCode].total_cards_issued += 1;
                    }
                }
            });
        }
        displayTable(productStats);
}

function displayTable(productStats) {
    // Clear the existing data in the DataTable
    var table = $('#product_inventory').DataTable();
    table.clear().draw();

    // Add each product stat to the DataTable
    Object.keys(productStats).forEach(function(productName) {
        var product = productStats[productName];
        var cardsRemaining = product.total_orders - product.total_cards_issued;
        table.row.add([
            product.product_name,
            product.total_orders,
            product.total_cards_issued,
            cardsRemaining
        ]).draw(false);
    });
}



var orderDetails = [];

function processOrdersByProduct(orders) {
    var recievedOrders = orders.filter(function(order) {
        return order.status === 7;
    });
    
    console.log('Recieved Orders:', recievedOrders);
    
    recievedOrders.forEach(function(order) {
        fetchProductNameUsingOrder(order.productCode, function(productName) {
            fetchCardsIssuedByOrder(order.reference,function(cards){
                console.log('Cards:', cards);
    
                var cards_issued = 0;
    
                cards.forEach(function(card) {
                    if (card.status === 2) {
                        cards_issued += 1;
                    }
                });
    
                var cards_remaining = order.quantity - cards_issued;
    
                var orderDetail = {
                    order_reference_number: order.reference,
                    product_name: productName,
                    quantity_ordered: order.quantity,
                    total_cards_issued: cards_issued,
                    remaining_cards: cards_remaining
                };
    
                orderDetails.push(orderDetail);
    
                if (orderDetails.length === recievedOrders.length) {
                    displayOrdersTable(orderDetails);
                }
            });
        });
    });
}

function fetchCardsIssuedByOrder(orderReference, callback) {
    $.ajax({
        url: BASE_URL+'reports/plastics/by-order/'+orderReference,
        type: 'GET',
        success: function(data) {
            callback(data);
        },
        error: function(error) {
            console.error('Error fetching cards issued by order:', error);
        }
    });
}

function fetchProductNameUsingOrder(productCode, callback) {
    $.ajax({
        url: BASE_URL+'reports/products/by-bin?bin='+productCode,
        type: 'GET',
        success: function(data) {
            callback(data.name);
        },
        error: function(error) {
            console.error('Error fetching product name:', error);
        }
    });
}

function displayOrdersTable(orderDetails) {
    // $('#order_inventory').DataTable().ajax.reload();
    var table = $('#order_inventory').DataTable({
        data: orderDetails,
        columns: [
            { data: 'order_reference_number' },
            { data: 'product_name' },
            { data: 'quantity_ordered' },
            { data: 'total_cards_issued' },
            { data: 'remaining_cards' }
        ]
    });
}

function fetchCardApplication(branchCode, productCode) {
    $.ajax({
        url: BASE_URL + 'reports/applications/by-product/by-branch?productCode=' + productCode + '&branchCode=' + branchCode,
        type: 'GET',
        success: function(data) {
            var filteredApplications = filterApplicationByTimeRange(data);
            if (filteredApplications.length > 0) {
                calculateRevenue(filteredApplications);
            }else
            {
                displayLineGraph([],[]);
            }
        },
        error: function(error) {
            console.error('Error fetching card application:', error);
        }
    });
}

function filterApplicationByTimeRange(applications) {
    var selectedTimeRange = $('#time-range').val();
    var startDate = calculateStartDate(selectedTimeRange);

    return applications.filter(function(application) {
        console.log('Application Date:', application.applicationDate);
        var applicationDate = new Date(application.applicationDate).toISOString().split('T')[0];
        console.log('Start Date:', startDate);
        console.log('Application Date:', applicationDate);
        console.log('Is application date greater than or equal to start date:', applicationDate >= startDate);
        return applicationDate >= startDate;
    });
}

function calculateStartDate(selectedTimeRange) {
    var currentDate = new Date();
    var startDate;

    switch (selectedTimeRange) {
        case 'today':
            startDate = new Date(currentDate.setHours(0, 0, 0, 0));
            break;
        case 'one-week':
            startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'one-month':
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
            break;
        case 'six-months':
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, currentDate.getDate());
            break;
        case 'one-year':
            startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
            break;
        default:
            startDate = currentDate;
            break;
    }

    // Convert start date to YYYY-MM-DD format
    return startDate.toISOString().split('T')[0];
}


function calculateRevenue(applications) {
    var reference = [];
    var revenueData = [];

    applications.forEach(function(application) {
        var applicationDate = new Date(application.applicationDate);
        var formattedDate = applicationDate.toISOString().split('T')[0];
        reference.push(formattedDate); // Store applicationDate as x-axis labels
        if (application.issueDate != null) {
            $.ajax({
                url: BASE_URL + 'reports/revenue/by-ref?reference=' + application.reference,
                type: 'GET',
                success: function(data) {
                    console.log('Fetched revenue:', data.fee);
                    revenueData.push(parseInt(data.fee));
                    displayLineGraph(reference, revenueData);
                },
                error: function(error) {
                    console.error('Error fetching product:', error);
                }
            });
        } else {
            revenueData.push(0);
            displayLineGraph(reference, revenueData);
        }
    });
}

var statusLineChart;

function displayLineGraph(labels, data) {
    var ctx = document.getElementById('productRevenueChart').getContext('2d');

    if (statusLineChart) {
        statusLineChart.destroy();
    }

    statusLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: data,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            legend: {
                display: true,
                position: 'bottom'
            }
        }
    });
}
