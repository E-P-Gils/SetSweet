const LOCAL_IP = "192.168.1.3"; // Replace with your local IP address

const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:3001/api`
  : 'http://localhost:3001/api';

module.exports = {
  API_BASE_URL,
  LOCAL_IP
}; 