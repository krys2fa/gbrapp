import fetch from 'node-fetch';

const response = await fetch('http://localhost:3000/api/large-scale-job-cards/24113cd0-6d43-43a8-a943-0c64b7f94972');
const jobCard = await response.json();
console.log('assays type:', typeof jobCard.assays);
console.log('assays is array:', Array.isArray(jobCard.assays));
console.log('assays length:', jobCard.assays ? jobCard.assays.length : 'undefined');
console.log('invoices type:', typeof jobCard.invoices);  
console.log('invoices is array:', Array.isArray(jobCard.invoices));
console.log('invoices length:', jobCard.invoices ? jobCard.invoices.length : 'undefined');
console.log('Status Code:', response.status);
