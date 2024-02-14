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



    // Handle dropdown change event
    $('#time-range, #product-dropdown').change(function() {
        var selectedTimeRange = $('#time-range').val();
        var selectedProduct = $('#product-dropdown').val();
        console.log('Selected time range:', selectedTimeRange);
        fetchData(selectedTimeRange, selectedProduct);
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
    // Add default option
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
    // Add default option
    productDropdown.append('<option value="">Select Product</option>');
    
    products.forEach(function(product) {
        productDropdown.append('<option value="' + product.code + '">' + product.name + '</option>');
    });
}

function fetchOrders(countryCode, branchCode) {
    $.ajax({
        url: BASE_URL+'reports/orders/by-branch-and-country/'+countryCode+'/'+branchCode,
        type: 'GET',
        success: function(data) {
            // console.log('Fetched orders:', data);
            displayStatusPieChart(data);
            // populateOrders(data);
            var recievedOrders = data.filter(function(order) {
                return order.status === 7;
            });

            Total_Quantity = calculateQuantity(recievedOrders);
            
            // displayPieChart(Total_Quantity);
        },
        error: function(error) {
            console.error('Error fetching orders:', error);
        }
    });
}

function calculateQuantity(orders) {
    var Total_Quantity = 0;
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
            // console.log('Total Cards:', Total_Issued);
            // console.log('Total Quantity:', Total_Quantity);
            var availableCards = Total_Quantity - Total_Issued;
            // console.log('Available Cards:', availableCards);
            displayPieChart(Total_Issued, availableCards);
        },
        error: function(error) {
            console.error('Error fetching cards issued:', error);
        }
    });
}

function displayPieChart(Total_Issued, availableCards) {
    var ctx = document.getElementById('inventoryChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Total Issued', 'Available Cards'],
            datasets: [{
                label: 'Cards Issued',
                data: [Total_Issued, availableCards],
                backgroundColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
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

function displayStatusPieChart(orders){
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
    var chart = new Chart(ctx, {
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
    var tableBody = $('#product_inventory tbody');
    tableBody.empty(); // Clear existing rows
    Object.keys(productStats).forEach(function(productName) {
        var product = productStats[productName];
        var cardsRemaining = product.total_orders - product.total_cards_issued;
        tableBody.append('<tr><td>' + product.product_name + '</td><td>' + product.total_orders + '</td><td>' + product.total_cards_issued + '</td>'+'<td>'+ cardsRemaining +'</td></tr>');
    });
}