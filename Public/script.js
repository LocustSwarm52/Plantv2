document.addEventListener('DOMContentLoaded', function () {
  function fetchData() {
      fetch('/data')
          .then(response => response.json())
          .then(data => {
              document.getElementById('temp').textContent = data.temperature ;
              document.getElementById('humidity').textContent = data.humidity;
              document.getElementById('water').textContent = data.waterLevel;
          })
          .catch(error => console.error('Error fetching data:', error));
  }

  // Fetch data initially and periodically
  fetchData();
  setInterval(fetchData, 2000);

  // Add event listener for the pump button
  document.getElementById('pumpButton').addEventListener('click', function() {
      fetch('/pump', { method: 'POST' })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Failed to trigger pump');
              }
              return response.json();
          })
          .then(data => console.log(data.message))
          .catch(error => console.error('Error:', error));
  });
});



