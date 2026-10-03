console.log("BookMyShow API service scaffold initialized.");

export const healthCheck = () => ({
  status: "ok",
  service: "@bookmyshow/api",
  timestamp: new Date().toISOString()
});
