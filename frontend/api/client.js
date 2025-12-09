import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your local IP address for physical device testing
// For Android Emulator use 'http://10.0.2.2:5000/api'
// For iOS Simulator use 'http://localhost:5000/api'
const BASE_URL = 'http://172.21.17.139:5000/api';

const client = axios.create({
    baseURL: BASE_URL,
});

client.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default client;
