document.addEventListener('DOMContentLoaded', function () {
    function fetchData() {
        fetch('/data')
            .then(response => response.json())
            .then(data => {
                document.getElementById('temp').textContent = data.temperature;
                document.getElementById('humidity').textContent = data.humidity;
                document.getElementById('water').textContent = data.waterLevel;
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    fetchData();
    setInterval(fetchData, 2000);

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
        .then(data => alert(data.message))
        .catch(error => console.error('Error:', error));
    });
});
