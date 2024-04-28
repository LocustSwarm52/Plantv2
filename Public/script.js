document.addEventListener('DOMContentLoaded', function () {
    function fetchData() {
        fetch('/data')
            .then(response => response.json())
            .then(data => {
                document.getElementById('temp').textContent = data.temperature;
                document.getElementById('humidity').textContent = data.humidity;
                document.getElementById('water').textContent = data.waterLevel;
                document.getElementById('pumpStatus').textContent = data.pumpStatus || "Pump status: Not running";
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    function fetchMedian() {
        fetch('/median')
            .then(response => response.json())
            .then(data => {
                document.getElementById('medianAnalogOutput').textContent = `Median Analog Output: ${data.median}`;
            })
            .catch(error => console.error('Error fetching median:', error));
    }

    // Create a new paragraph in your HTML to display the median value
    // Ensure there's an element with id 'medianAnalogOutput' in your HTML

    fetchData(); // Initial fetch when the document loads
    fetchMedian(); // Initial fetch for median

    setInterval(fetchData, 2000); // Update sensor data every 2 seconds
    setInterval(fetchMedian, 60000); // Update median every minute

    document.getElementById('pumpButton').addEventListener('click', function() {
        const duration = document.getElementById('duration').value;
        if (!duration || duration <= 0) {
            alert('Please enter a valid number of seconds.');
            return;
        }
        fetch('/pump/duration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ duration: duration })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchData(); // Re-fetch data to update pump status
            fetchMedian(); // Optionally fetch median again if this affects outputs
        })
        .catch(error => console.error('Error:', error));
    });
});



