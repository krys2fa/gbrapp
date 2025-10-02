const testWeeklyShipmentReport = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/reports/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType: 'weekly-shipment-exporter',
        exporterId: 'some-exporter-id', // Replace with actual exporter ID
        monthStart: '2024-09-01' // Replace with actual month
      })
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

testWeeklyShipmentReport();