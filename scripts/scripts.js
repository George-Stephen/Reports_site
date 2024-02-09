$(document).ready(function(){
    
    // Reload the page after 1 hour (3600 seconds)
    setTimeout(function() {
        location.reload();
    }, 3600000);

    var productNames = ["Product A", "Product B", "Product C"];

    // Populate product dropdown
    var productDropdown = $('#product-dropdown');
    productNames.forEach(function(product) {
        productDropdown.append('<option value="' + product + '">' + product + '</option>');
    });

    // Fetch initial data
    fetchData('today'); // Fetch data for today initially

    // Initialize pie chart with initial data
    fetchPieData('today'); // Fetch data for today initially

    // Handle dropdown change event
    $('#time-range_2').change(function() {
        var selectedTimeRange = $(this).val();
        fetchPieData(selectedTimeRange);
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



const coursesData = { 
    labels: ['Cards available', 'Cards issued'], 
    datasets: [{ 
        data: [130, 80], 
        backgroundColor: ['#FF6384', '#36A2EB'], 
    }], 
};

const config = { 
    type: 'doughnut', 
    data: coursesData,  
}; 
const ctx = document.getElementById( 
    'inventoryChart').getContext('2d'); 
      
new Chart(ctx, config); 


// setting up a line graph
function fetchData(timeRange, product) {
    // Generate simulated data based on time range and product
    var simulatedData = generateSimulatedData(timeRange, product);

    // Process and update graph with the fetched data
    updateLineGraph(simulatedData);
}

function generateSimulatedData(timeRange, product) {
    // Simulate data for demonstration
    var data = [];
    var startDate = calculateStartDate(timeRange);
    var currentDate = new Date(startDate);
    var endDate = new Date();
    
    while (currentDate <= endDate) {
        // Generate random revenue for the product
        var revenue = Math.random() * 1000; // Random value for demonstration
        data.push({
            timestamp: currentDate.getTime(),
            revenue: revenue
        });
        currentDate.setDate(currentDate.getDate() + 1); // Increment by one day
    }
    return data;
}

function calculateStartDate(timeRange) {
    var startDate = new Date();
    switch (timeRange) {
        case 'today':
            // Start date is the beginning of today
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            // Start date is 7 days ago
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            // Start date is the beginning of the current month
            startDate.setDate(1);
            break;
        case 'six-months':
            // Start date is 6 months ago
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        case 'year':
            // Start date is the beginning of the current year
            startDate.setMonth(0, 1);
            break;
        default:
            // Default to today
            startDate.setHours(0, 0, 0, 0);
            break;
    }
    return startDate;
}

var LinechartInstance;
function updateLineGraph(data) {

    if (LinechartInstance) {
        LinechartInstance.destroy();
    }
    // Update line graph with the fetched data
    // You need to use Chart.js or any other chart library to update the graph
    var labels = data.map(function(entry) {
        return formatDate(entry.timestamp);
    });

    var revenueData = data.map(function(entry) {
        return entry.revenue;
    });

    var ctx = document.getElementById('productRevenueChart').getContext('2d');
    LinechartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: revenueData,
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        parser: 'YYYY-MM-DD', // Specify the date format
                        unit: 'day'
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

// Function to format timestamp to "yyyy-mm-dd" format
function formatDate(timestamp) {
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2); // Add leading zero if month is less than 10
    var day = ('0' + date.getDate()).slice(-2); // Add leading zero if day is less than 10
    return year + '-' + month + '-' + day;
}

function fetchPieData(timeRange) {
    // Generate simulated data based on time range
    var simulatedData = generateSimulatedPieData(timeRange);

    // Process and update pie chart with the fetched data
    updatePieChart(simulatedData);
}

function generateSimulatedPieData(timeRange) {
    // Simulate data for demonstration
    var data = [];
    var statuses = {
        0: "Not Verified",
        1: "Verified at Branch",
        3: "Approved at Card Centre",
        5: "File Imported",
        6: "Dispatched (Acknowledged at Center)"
    };
    for (var status in statuses) {
        data.push({
            status: statuses[status],
            count: Math.floor(Math.random() * 100) // Random count for demonstration
        });
    }
    return data;
}

var PiechartInstance;

function updatePieChart(data) {

    if (PiechartInstance) {
        PiechartInstance.destroy();
    }

    // Update pie chart with the fetched data
    var labels = data.map(function(entry) {
        return entry.status;
    });

    var counts = data.map(function(entry) {
        return entry.count;
    });

    var ctx = document.getElementById('orderStatusChart').getContext('2d');
    PiechartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
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
